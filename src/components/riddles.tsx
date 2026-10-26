import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { RIDDLES } from "./riddles-data";
import { useAuthUser } from "@/lib/auth-context";
import { isRightAnswer } from "@/lib/riddles";
import { RIDDLE_SCORE } from "@/lib/score";
import { answerRiddle, revealRiddle } from "@/lib/games.functions";

type State = "idle" | "right" | "wrong" | "shown";

export function Riddles() {
  const user = useAuthUser();
  const queryClient = useQueryClient();
  const answer = useServerFn(answerRiddle);
  const reveal = useServerFn(revealRiddle);
  const [i, setI] = useState(0);
  const [guess, setGuess] = useState("");
  const [state, setState] = useState<State>("idle");
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const r = RIDDLES[i] ?? RIDDLES[0]!;

  // Start on a random riddle (after load, so the page renders the same on server and browser).
  useEffect(() => setI(Math.floor(Math.random() * RIDDLES.length)), []);

  const check = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim() || busy || state === "right" || state === "shown") return;
    if (!isRightAnswer(r, guess)) return setState("wrong");
    setState("right");
    if (!user) return setNote(null);
    setBusy(true);
    try {
      const res = await answer({ data: { idx: i, guess } });
      setNote(res.awarded > 0 ? `+${res.awarded} سكور 🏆` : "حليته قبل، ما ينحسب مرة ثانية");
      if (res.awarded > 0) void queryClient.invalidateQueries({ queryKey: ["profile"] });
    } catch {
      setNote("ما قدرنا نحسب السكور، جرّب لغز ثاني");
    } finally {
      setBusy(false);
    }
  };

  const show = () => {
    if (state === "right") return;
    setState("shown");
    setNote(user ? "انكشف الجواب، هذا اللغز ما يعطي سكور" : null);
    if (user) void reveal({ data: { idx: i } }).catch(() => {});
  };

  const next = () => {
    let n = Math.floor(Math.random() * RIDDLES.length);
    if (n === i) n = (n + 1) % RIDDLES.length;
    setI(n);
    setGuess("");
    setState("idle");
    setNote(null);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-xs text-muted-foreground">كل لغز تحله = {RIDDLE_SCORE} سكور</p>
      <p className="font-display text-xl font-semibold">{r.q}</p>
      <form onSubmit={(e) => void check(e)} className="flex w-full max-w-sm gap-2">
        <input
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          placeholder="اكتب إجابتك هنا"
          className="min-w-0 flex-1 rounded-full border bg-background px-4 py-2 text-sm outline-none focus:border-primary"
        />
        <button type="submit" disabled={busy} className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
          تحقق
        </button>
      </form>
      {state === "right" && <p className="text-online">صح عليك! 🔥</p>}
      {state === "wrong" && <p className="text-destructive">غلط، جرّب مرة ثانية 🤔</p>}
      {state === "shown" && <p className="text-primary">الجواب: {r.a[0]}</p>}
      {note && <p className="text-sm font-semibold text-muted-foreground">{note}</p>}
      <div className="flex gap-2">
        <button onClick={show} className="rounded-full border px-4 py-1.5 text-sm hover:bg-secondary">
          اظهر الجواب
        </button>
        <button onClick={next} className="rounded-full border px-4 py-1.5 text-sm hover:bg-secondary">
          لغز جديد
        </button>
      </div>
    </div>
  );
}
