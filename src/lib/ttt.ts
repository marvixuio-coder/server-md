/** X O rules shared by the browser (guest play) and the server (scored play). */
export type Cell = "X" | "O" | null;

/** How often the AI plays its best move; the rest of the time it plays a random free cell. */
export const AI_SMART_RATE = 0.8;
/** Reward for one win against the AI (applied in the database by award_ttt_win). */
export const WIN_SCORE = 50;
export const WIN_POINTS = 5;

const LINES: [number, number, number][] = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

export function winner(b: Cell[]): Cell | "draw" | null {
  for (const [a, c, d] of LINES) if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
  return b.every(Boolean) ? "draw" : null;
}

function minimax(b: Cell[], ai: boolean, depth: number): number {
  const w = winner(b);
  if (w === "O") return 10 - depth;
  if (w === "X") return depth - 10;
  if (w === "draw") return 0;
  let best = ai ? -100 : 100;
  for (let i = 0; i < 9; i++) {
    if (b[i]) continue;
    b[i] = ai ? "O" : "X";
    const s = minimax(b, !ai, depth + 1);
    b[i] = null;
    best = ai ? Math.max(best, s) : Math.min(best, s);
  }
  return best;
}

export function bestMove(board: Cell[]): number {
  const b = [...board];
  let best = -Infinity;
  let move = -1;
  for (let i = 0; i < 9; i++) {
    if (b[i]) continue;
    b[i] = "O";
    const s = minimax(b, false, 0);
    b[i] = null;
    if (s > best) {
      best = s;
      move = i;
    }
  }
  return move;
}

/** `rand` is injectable for tests; values below AI_SMART_RATE mean "play the best move". */
export function aiMove(board: Cell[], rand: () => number = Math.random): number {
  const free = board.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
  if (free.length === 0) return -1;
  if (rand() >= AI_SMART_RATE) return free[Math.floor(rand() * free.length)] ?? free[0]!;
  return bestMove(board);
}

export const toBoardString = (b: Cell[]) => b.map((c) => c ?? "_").join("");
export const fromBoardString = (s: string): Cell[] =>
  s.split("").map((c) => (c === "X" || c === "O" ? c : null));
