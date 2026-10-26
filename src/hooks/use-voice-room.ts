import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

// Peer-to-peer voice (WebRTC mesh) with Realtime broadcast as signalling and
// Realtime presence as the "who is in the call" list. Fine for a handful of owners.

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

type PresenceMeta = { name: string; userId: string | null; muted: boolean };
type SignalKind = "offer" | "answer" | "ice";
type Signal = { from: string; to: string; kind: SignalKind; data: unknown };

type PeerEntry = {
  pc: RTCPeerConnection;
  audio: HTMLAudioElement;
  pending: RTCIceCandidateInit[];
  analyser: AnalyserNode | null;
};

export type VoicePeer = {
  id: string;
  name: string;
  muted: boolean;
  connected: boolean;
  speaking: boolean;
};

function level(analyser: AnalyserNode | null, buf: Uint8Array<ArrayBuffer>) {
  if (!analyser) return 0;
  analyser.getByteTimeDomainData(buf);
  let sum = 0;
  for (let i = 0; i < buf.length; i++) {
    const v = ((buf[i] ?? 128) - 128) / 128;
    sum += v * v;
  }
  return Math.sqrt(sum / buf.length);
}

export function useVoiceRoom(opts: { room: string; name: string; userId: string | null }) {
  const { room, name, userId } = opts;
  const [myId] = useState(() => crypto.randomUUID());
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [peers, setPeers] = useState<VoicePeer[]>([]);
  const [meSpeaking, setMeSpeaking] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const localAnalyser = useRef<AnalyserNode | null>(null);
  const pcs = useRef(new Map<string, PeerEntry>());
  const seen = useRef(new Set<string>());
  const joinedRef = useRef(false);
  const mutedRef = useRef(false);
  const speakingRef = useRef(new Set<string>());

  const refreshPeers = useCallback(() => {
    const channel = channelRef.current;
    if (!channel) return;
    const state = channel.presenceState<PresenceMeta>();
    setPeers(
      Object.keys(state)
        .filter((id) => id !== myId)
        .map((id) => {
          const meta = state[id]?.[0];
          const entry = pcs.current.get(id);
          return {
            id,
            name: meta?.name || "أونر",
            muted: !!meta?.muted,
            connected: entry?.pc.connectionState === "connected",
            speaking: speakingRef.current.has(id),
          };
        }),
    );
  }, [myId]);

  const send = useCallback(
    (to: string, kind: SignalKind, data: unknown) => {
      const msg: Signal = { from: myId, to, kind, data };
      void channelRef.current?.send({ type: "broadcast", event: "signal", payload: msg });
    },
    [myId],
  );

  const closePeer = useCallback((id: string) => {
    const entry = pcs.current.get(id);
    if (!entry) return;
    entry.pc.onicecandidate = null;
    entry.pc.ontrack = null;
    entry.pc.onconnectionstatechange = null;
    entry.pc.close();
    entry.audio.pause();
    entry.audio.srcObject = null;
    pcs.current.delete(id);
  }, []);

  const createPeer = useCallback(
    (id: string) => {
      const existing = pcs.current.get(id);
      if (existing) return existing;
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      const audio = new Audio();
      audio.autoplay = true;
      const entry: PeerEntry = { pc, audio, pending: [], analyser: null };
      const stream = streamRef.current;
      stream?.getTracks().forEach((t) => pc.addTrack(t, stream));
      pc.onicecandidate = (e) => {
        if (e.candidate) send(id, "ice", e.candidate.toJSON());
      };
      pc.ontrack = (e) => {
        const remote = e.streams[0] ?? new MediaStream([e.track]);
        audio.srcObject = remote;
        void audio.play().catch(() => {});
        const ctx = ctxRef.current;
        if (ctx) {
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 512;
          ctx.createMediaStreamSource(remote).connect(analyser);
          entry.analyser = analyser;
        }
      };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed" && myId < id) {
          // Retry once things settle, if they're still in the room.
          closePeer(id);
          setTimeout(() => {
            if (joinedRef.current && seen.current.has(id) && !pcs.current.has(id)) void call(id);
          }, 1500);
        }
        refreshPeers();
      };
      pcs.current.set(id, entry);
      return entry;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [myId, send, closePeer, refreshPeers],
  );

  const call = useCallback(
    async (id: string) => {
      const { pc } = createPeer(id);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      send(id, "offer", pc.localDescription?.toJSON());
    },
    [createPeer, send],
  );

  const flush = async (entry: PeerEntry) => {
    const list = entry.pending.splice(0);
    for (const c of list) await entry.pc.addIceCandidate(c).catch(() => {});
  };

  const onSignal = useCallback(
    async (msg: Signal) => {
      if (!joinedRef.current || msg.to !== myId) return;
      try {
        if (msg.kind === "offer") {
          const entry = createPeer(msg.from);
          await entry.pc.setRemoteDescription(msg.data as RTCSessionDescriptionInit);
          await flush(entry);
          const answer = await entry.pc.createAnswer();
          await entry.pc.setLocalDescription(answer);
          send(msg.from, "answer", entry.pc.localDescription?.toJSON());
        } else if (msg.kind === "answer") {
          const entry = pcs.current.get(msg.from);
          if (!entry || entry.pc.signalingState !== "have-local-offer") return;
          await entry.pc.setRemoteDescription(msg.data as RTCSessionDescriptionInit);
          await flush(entry);
        } else {
          const entry = pcs.current.get(msg.from);
          if (!entry) return;
          const cand = msg.data as RTCIceCandidateInit;
          if (entry.pc.remoteDescription) await entry.pc.addIceCandidate(cand).catch(() => {});
          else entry.pending.push(cand);
        }
      } catch (err) {
        console.error("voice signal failed", err);
      }
    },
    [myId, createPeer, send],
  );

  const onSync = useCallback(() => {
    const channel = channelRef.current;
    if (!channel) return;
    const ids = Object.keys(channel.presenceState()).filter((id) => id !== myId);
    for (const id of [...seen.current]) {
      if (!ids.includes(id)) {
        seen.current.delete(id);
        closePeer(id);
      }
    }
    for (const id of ids) seen.current.add(id);
    if (joinedRef.current) {
      // Exactly one side of every pair makes the offer.
      for (const id of ids) if (myId < id && !pcs.current.has(id)) void call(id);
    }
    refreshPeers();
  }, [myId, call, closePeer, refreshPeers]);

  // Watch the room (who's inside) even before joining.
  const onSignalRef = useRef(onSignal);
  const onSyncRef = useRef(onSync);
  onSignalRef.current = onSignal;
  onSyncRef.current = onSync;
  useEffect(() => {
    const channel = supabase.channel(`owners-meeting-${room}`, {
      config: { broadcast: { self: false }, presence: { key: myId } },
    });
    channel
      .on("broadcast", { event: "signal" }, ({ payload }) => void onSignalRef.current(payload as Signal))
      .on("presence", { event: "sync" }, () => onSyncRef.current())
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") setError("ما قدرنا نتصل بالروم، حدّث الصفحة.");
      });
    channelRef.current = channel;
    return () => {
      channelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [room, myId]);

  // Speaking indicators.
  useEffect(() => {
    if (!joined) return;
    const buf = new Uint8Array(new ArrayBuffer(512));
    const t = setInterval(() => {
      setMeSpeaking(!mutedRef.current && level(localAnalyser.current, buf) > 0.04);
      const next = new Set<string>();
      for (const [id, entry] of pcs.current) if (level(entry.analyser, buf) > 0.04) next.add(id);
      const prev = speakingRef.current;
      if (next.size !== prev.size || [...next].some((id) => !prev.has(id))) {
        speakingRef.current = next;
        refreshPeers();
      }
    }, 200);
    return () => clearInterval(t);
  }, [joined, refreshPeers]);

  const teardown = useCallback(() => {
    joinedRef.current = false;
    for (const id of [...pcs.current.keys()]) closePeer(id);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    localAnalyser.current = null;
    void ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
    speakingRef.current = new Set();
  }, [closePeer]);

  const join = useCallback(async () => {
    if (joinedRef.current || joining) return;
    setError(null);
    setJoining(true);
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("no-media");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: false,
      });
      streamRef.current = stream;
      const ctx = new AudioContext();
      ctxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      ctx.createMediaStreamSource(stream).connect(analyser);
      localAnalyser.current = analyser;
      mutedRef.current = false;
      setMuted(false);
      joinedRef.current = true;
      await channelRef.current?.track({ name, userId, muted: false } satisfies PresenceMeta);
      setJoined(true);
    } catch (err) {
      teardown();
      const denied = err instanceof DOMException && err.name === "NotAllowedError";
      setError(denied ? "لازم تسمح للموقع يستخدم الميك عشان تدخل المكالمة." : "ما قدرنا نشغّل الميك.");
    }
    setJoining(false);
  }, [joining, name, userId, teardown]);

  const leave = useCallback(async () => {
    teardown();
    setJoined(false);
    setMeSpeaking(false);
    await channelRef.current?.untrack();
    refreshPeers();
  }, [teardown, refreshPeers]);

  const toggleMute = useCallback(() => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !next));
    setMuted(next);
    void channelRef.current?.track({ name, userId, muted: next } satisfies PresenceMeta);
  }, [name, userId]);

  // Leave cleanly when the page closes.
  useEffect(() => {
    const onHide = () => {
      if (joinedRef.current) void channelRef.current?.untrack();
      teardown();
    };
    window.addEventListener("pagehide", onHide);
    return () => {
      window.removeEventListener("pagehide", onHide);
      teardown();
    };
  }, [teardown]);

  return { joined, joining, muted, error, peers, meSpeaking, join, leave, toggleMute };
}
