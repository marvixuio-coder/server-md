import { useState } from "react";

import { RIDDLES } from "./riddles-data";



const norm = (s: string) => s.trim().replace(/[أإآ]/g, "ا").replace(/ى/g, "ي");

export function Riddles() {
  const [i, setI] = useState(0);
  const [guess, setGuess] = useState("");
  const [state, setState] = useState<"idle" | "right" | "wrong" | "shown">("idle");
  const r = RIDDLES[i] ?? RIDDLES[0]!;

  const check = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim()) return;
    setState(r.a.some((x) => norm(x) === norm(guess)) ? "right" : "wrong");
  };

  const next = () => {
    setI((i + 1) % RIDDLES.length);
    setGuess("");
    setState("idle");
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="font-display text-xl font-semibold">{r.q}</p>
      <form onSubmit={check} className="flex w-full max-w-sm gap-2">
        <input
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          placeholder="اكتب إجابتك هنا"
          className="flex-1 rounded-full border bg-background px-4 py-2 text-sm outline-none focus:border-primary"
        />
        <button type="submit" className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          تحقق
        </button>
      </form>
      {state === "right" && <p className="text-online">صح عليك! 🔥</p>}
      {state === "wrong" && <p className="text-destructive">غلط، جرّب مرة ثانية 🤔</p>}
      {state === "shown" && <p className="text-primary">الجواب: {r.a[0]}</p>}
      <div className="flex gap-2">
        <button onClick={() => setState("shown")} className="rounded-full border px-4 py-1.5 text-sm hover:bg-secondary">
          اظهر الجواب
        </button>
        <button onClick={next} className="rounded-full border px-4 py-1.5 text-sm hover:bg-secondary">
          لغز جديد
        </button>
      </div>
    </div>
  );
}
