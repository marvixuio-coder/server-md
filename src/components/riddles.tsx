import { useState } from "react";

const RIDDLES = [
  { q: "شيء كلما أخذت منه كبر، ما هو؟", a: ["الحفرة", "حفرة", "الحفره", "حفره"] },
  { q: "له أسنان ولا يعض، ما هو؟", a: ["المشط", "مشط"] },
  { q: "يمشي بلا رجلين ويبكي بلا عينين، ما هو؟", a: ["السحاب", "سحاب", "الغيم", "غيم", "السحابة", "سحابة"] },
  { q: "شيء يكتب ولا يقرأ، ما هو؟", a: ["القلم", "قلم"] },
  { q: "بيت بلا أبواب ولا نوافذ، ما هو؟", a: ["البيضة", "بيضة", "البيضه", "بيضه"] },
  { q: "كلما زاد نقص، ما هو؟", a: ["العمر", "عمر"] },
  { q: "له رقبة وليس له رأس، ما هو؟", a: ["الزجاجة", "زجاجة", "الزجاجه", "زجاجه", "القارورة", "قارورة"] },
  { q: "يسمع بلا أذن ويتكلم بلا لسان، ما هو؟", a: ["الهاتف", "هاتف", "التلفون", "تلفون", "الجوال", "جوال"] },
];

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
