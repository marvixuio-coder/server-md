import { useState } from "react";

type Cell = "X" | "O" | null;
const LINES: [number, number, number][] = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function winner(b: Cell[]): Cell | "draw" | null {
  for (const [a, c, d] of LINES) if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
  return b.every(Boolean) ? "draw" : null;
}

function minimax(b: Cell[], ai: boolean): number {
  const w = winner(b);
  if (w === "O") return 1;
  if (w === "X") return -1;
  if (w === "draw") return 0;
  let best = ai ? -2 : 2;
  b.forEach((v, i) => {
    if (v) return;
    b[i] = ai ? "O" : "X";
    const s = minimax(b, !ai);
    b[i] = null;
    best = ai ? Math.max(best, s) : Math.min(best, s);
  });
  return best;
}

function aiMove(b: Cell[]): number {
  const free = b.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
  if (Math.random() < 0.25) return free[Math.floor(Math.random() * free.length)] ?? 0;
  let best = -2, move = free[0] ?? 0;
  for (const i of free) {
    b[i] = "O";
    const s = minimax(b, false);
    b[i] = null;
    if (s > best) { best = s; move = i; }
  }
  return move;
}

export function TicTacToe() {
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const result = winner(board);

  const play = (i: number) => {
    if (board[i] || result) return;
    const next = [...board];
    next[i] = "X";
    if (!winner(next)) next[aiMove(next)] = "O";
    setBoard(next);
  };

  const status =
    result === "X" ? "فزت! 🔥" : result === "O" ? "الذكاء الاصطناعي فاز 🤖" : result === "draw" ? "تعادل 🤝" : "دورك — أنت X";

  return (
    <div className="flex flex-col items-center gap-4">
      <div dir="ltr" className="grid grid-cols-3 gap-2">
        {board.map((c, i) => (
          <button
            key={i}
            onClick={() => play(i)}
            className="flex size-20 items-center justify-center rounded-xl border bg-secondary/60 font-display text-4xl font-bold transition hover:bg-secondary"
          >
            <span className={c === "X" ? "text-primary" : "text-muted-foreground"}>{c}</span>
          </button>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">{status}</p>
      <button
        onClick={() => setBoard(Array(9).fill(null))}
        className="rounded-full border px-4 py-1.5 text-sm hover:bg-secondary"
      >
        العب من جديد
      </button>
    </div>
  );
}
