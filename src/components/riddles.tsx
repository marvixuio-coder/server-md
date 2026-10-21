import { useState } from "react";

const RIDDLES = [
  { q: "شيء كلما أخذت منه كبر، ما هو؟", a: "الحفرة" },
  { q: "له أسنان ولا يعض، ما هو؟", a: "المشط" },
  { q: "يمشي بلا رجلين ويبكي بلا عينين، ما هو؟", a: "السحاب" },
  { q: "شيء يكتب ولا يقرأ، ما هو؟", a: "القلم" },
  { q: "بيت بلا أبواب ولا نوافذ، ما هو؟", a: "البيضة" },
  { q: "كلما زاد نقص، ما هو؟", a: "العمر" },
  { q: "له رقبة وليس له رأس، ما هو؟", a: "الزجاجة" },
  { q: "يسمع بلا أذن ويتكلم بلا لسان، ما هو؟", a: "الهاتف" },
];

export function Riddles() {
  const [i, setI] = useState(0);
  const [show, setShow] = useState(false);
  const r = RIDDLES[i];
  return (
    <div className="flex flex-col items-center gap-4">
      <p className="font-display text-xl font-semibold">{r.q}</p>
      {show && <p className="text-primary">{r.a}</p>}
      <div className="flex gap-2">
        <button onClick={() => setShow(true)} className="rounded-full border px-4 py-1.5 text-sm hover:bg-secondary">
          اظهر الجواب
        </button>
        <button
          onClick={() => { setI((i + 1) % RIDDLES.length); setShow(false); }}
          className="rounded-full border px-4 py-1.5 text-sm hover:bg-secondary"
        >
          لغز جديد
        </button>
      </div>
    </div>
  );
}
