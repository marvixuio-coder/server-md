import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Mic, MicOff, Phone, PhoneOff } from "lucide-react";

import { OwnerPasswordBox } from "@/components/owner-gate";
import { useVoiceRoom } from "@/hooks/use-voice-room";
import { getMeetingRoom } from "@/lib/owner.functions";

const meetingQuery = queryOptions({
  queryKey: ["owner-meeting"],
  queryFn: () => getMeetingRoom(),
});

export const Route = createFileRoute("/owner_/meeting")({
  // Signed-in owners are recognised by their account, which only the browser knows.
  ssr: false,
  head: () => ({
    meta: [
      { title: "اجتماع الاونرز — MD" },
      { name: "description", content: "روم صوتي خاص بأصحاب سيرفر MD." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "اجتماع الاونرز — MD" },
      { property: "og:description", content: "روم صوتي خاص بأصحاب سيرفر MD." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(meetingQuery),
  component: MeetingPage,
});

function MeetingPage() {
  const { data } = useSuspenseQuery(meetingQuery);
  const queryClient = useQueryClient();

  if (!data.owner) {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center gap-4 px-5">
        <div className="bg-glow pointer-events-none absolute inset-0" />
        <div className="relative flex aspect-square w-[min(90vw,22rem)] flex-col items-center justify-center rounded-3xl border bg-card p-8 shadow-[var(--shadow-glow)]">
          <OwnerPasswordBox
            onUnlocked={() => void queryClient.invalidateQueries({ queryKey: meetingQuery.queryKey })}
          />
        </div>
        <Link to="/" className="relative text-sm text-muted-foreground hover:text-foreground">
          → رجوع للرئيسية
        </Link>
      </main>
    );
  }

  return <Room room={data.room} name={data.name} userId={data.userId} />;
}

function Avatar({ name, speaking, muted, dim }: { name: string; speaking: boolean; muted: boolean; dim?: boolean }) {
  return (
    <div className="relative">
      <div
        className={`flex size-20 items-center justify-center rounded-full bg-primary font-display text-3xl font-bold text-primary-foreground transition ${
          speaking ? "ring-4 ring-online ring-offset-2 ring-offset-card" : ""
        } ${dim ? "opacity-50" : ""}`}
      >
        {name.trim().charAt(0) || "؟"}
      </div>
      {muted && (
        <span className="absolute -bottom-1 -end-1 flex size-7 items-center justify-center rounded-full border-2 border-card bg-destructive text-destructive-foreground">
          <MicOff className="size-3.5" />
        </span>
      )}
    </div>
  );
}

function Room({ room, name, userId }: { room: string; name: string; userId: string | null }) {
  const voice = useVoiceRoom({ room, name, userId });
  const count = voice.peers.length + (voice.joined ? 1 : 0);

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden">
      <div className="bg-glow pointer-events-none absolute inset-0" />
      <div className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 pt-8 pb-8">
        <Link to="/owner" className="text-sm text-muted-foreground hover:text-foreground">
          → رجوع للوحة التحكم
        </Link>

        <div className="mt-6 flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-2xl">🎙️</div>
          <div>
            <h1 className="font-display text-3xl font-bold">اجتماع الاونرز</h1>
            <p className="text-sm text-muted-foreground">
              {count === 0 ? "ما فيه أحد في المكالمة الحين" : `في المكالمة الحين: ${count}`}
            </p>
          </div>
        </div>

        <section className="mt-6 flex min-h-[18rem] flex-1 flex-col rounded-2xl border bg-card p-6">
          {count === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
              <div className="text-5xl">🔇</div>
              <p>الروم فاضي، ادخل وخلّ الباقين يلحقونك.</p>
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-6 sm:grid-cols-3">
              {voice.joined && (
                <li className="flex flex-col items-center gap-2 text-center">
                  <Avatar name={name} speaking={voice.meSpeaking} muted={voice.muted} />
                  <p className="font-semibold">{name} (أنت)</p>
                </li>
              )}
              {voice.peers.map((p) => (
                <li key={p.id} className="flex flex-col items-center gap-2 text-center">
                  <Avatar
                    name={p.name}
                    speaking={p.speaking}
                    muted={p.muted}
                    dim={voice.joined && !p.connected}
                  />
                  <p className="font-semibold">{p.name}</p>
                  {voice.joined && !p.connected && <p className="text-xs text-muted-foreground">يتصل...</p>}
                </li>
              ))}
            </ul>
          )}
        </section>

        {voice.error && (
          <p className="mt-3 rounded-xl border border-destructive/60 bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {voice.error}
          </p>
        )}

        <div className="mt-5 flex items-center justify-center gap-4">
          {voice.joined ? (
            <>
              <button
                onClick={voice.toggleMute}
                aria-label={voice.muted ? "افتح الميك" : "اقفل الميك"}
                className={`flex h-14 items-center gap-2 rounded-full px-6 font-semibold transition ${
                  voice.muted
                    ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                {voice.muted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
                {voice.muted ? "الميك مقفول" : "الميك شغّال"}
              </button>
              <button
                onClick={() => void voice.leave()}
                className="flex h-14 items-center gap-2 rounded-full bg-destructive px-6 font-semibold text-destructive-foreground transition hover:bg-destructive/90"
              >
                <PhoneOff className="size-5" />
                كانسل
              </button>
            </>
          ) : (
            <button
              onClick={() => void voice.join()}
              disabled={voice.joining}
              className="flex h-14 items-center gap-2 rounded-full bg-online px-8 font-semibold text-background transition hover:opacity-90 disabled:opacity-60"
            >
              <Phone className="size-5" />
              {voice.joining ? "يدخل..." : "ادخل المكالمة"}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
