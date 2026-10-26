/** Snake rules shared by the browser (the game) and the server (score check). */
export const GRID = 15;
export const TICK_MS = 140;
/** Each apple eaten = this much score. */
export const APPLE_SCORE = 1;
/** Fastest believable pace; the server never credits more apples than elapsed time allows. */
export const MIN_MS_PER_APPLE = 300;

export type Pt = { x: number; y: number };
export type Dir = "up" | "down" | "left" | "right";

const DELTA: Record<Dir, Pt> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export function initialSnake(): Pt[] {
  const mid = Math.floor(GRID / 2);
  return [
    { x: mid, y: mid },
    { x: mid - 1, y: mid },
    { x: mid - 2, y: mid },
  ];
}

export function isOpposite(a: Dir, b: Dir) {
  return (
    (a === "up" && b === "down") ||
    (a === "down" && b === "up") ||
    (a === "left" && b === "right") ||
    (a === "right" && b === "left")
  );
}

/** A random free cell, or null when the snake fills the board. */
export function randomApple(snake: Pt[], rnd: () => number = Math.random): Pt | null {
  const taken = new Set(snake.map((p) => p.y * GRID + p.x));
  const free: number[] = [];
  for (let i = 0; i < GRID * GRID; i++) if (!taken.has(i)) free.push(i);
  if (!free.length) return null;
  const cell = free[Math.floor(rnd() * free.length)] ?? free[0]!;
  return { x: cell % GRID, y: Math.floor(cell / GRID) };
}

/** Moves the snake one cell. Eating an apple grows it by one. */
export function step(snake: Pt[], dir: Dir, apple: Pt | null) {
  const head = snake[0]!;
  const d = DELTA[dir];
  const next = { x: head.x + d.x, y: head.y + d.y };
  if (next.x < 0 || next.y < 0 || next.x >= GRID || next.y >= GRID)
    return { snake, ate: false, dead: true };
  const ate = !!apple && apple.x === next.x && apple.y === next.y;
  const body = ate ? snake : snake.slice(0, -1);
  if (body.some((p) => p.x === next.x && p.y === next.y)) return { snake, ate: false, dead: true };
  return { snake: [next, ...body], ate, dead: false };
}

/** Most apples the server will credit for a game that lasted `elapsedMs`. */
export function maxApples(elapsedMs: number) {
  return Math.max(0, Math.min(GRID * GRID - 3, Math.floor(elapsedMs / MIN_MS_PER_APPLE)));
}
