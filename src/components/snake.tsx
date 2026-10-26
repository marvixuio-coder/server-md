import { useEffect, useReducer, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { useAuthUser } from "@/lib/auth-context";
import { finishSnakeGame, startSnakeGame } from "@/lib/games.functions";
import {
  APPLE_SCORE,
  GRID,
  initialSnake,
  isOpposite,
  randomApple,
  step,
  TICK_MS,
  type Dir,
  type Pt,
} from "@/lib/snake";

const KEYS: Record<string, Dir> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  s: "down",
  a: "left",
  d: "right",
};

type Phase = "idle" | "starting" | "playing" | "over";

export function Snake() {
  const user = useAuthUser();
  const queryClient = useQueryClient();
  const start = useServerFn(startSnakeGame);
  const finish = useServerFn(finishSnakeGame);

  const game = useRef({ snake: initialSnake(), apple: null as Pt | null, dir: "right" as Dir, queue: [] as Dir[], apples: 0 });
  const gameId = useRef<string | null>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const [, redraw] = useReducer((n: number) => n + 1, 0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [note, setNote] = useState<string | null>(null);

  const turn = (d: Dir) => {
    const g = game.current;
    const last = g.queue[g.queue.length - 1] ?? g.dir;
    if (d !== last && !isOpposite(d, last) && g.queue.length < 3) g.queue.push(d);
  };

  const begin = async () => {
    if (phase === "starting" || phase === "playing") return;
    const snake = initialSnake();
    game.current = { snake, apple: randomApple(snake), dir: "right", queue: [], apples: 0 };
    gameId.current = null;
    setNote(null);
    redraw();
    if (user) {
      setPhase("starting");
      try {
        gameId.current = (await start()).id;
      } catch {
        setNote("ما قدرنا نبدأ لعبة بسكور، تقدر تلعب بدون سكور");
      }
    }
    setPhase("playing");
  };

  // Game loop
  useEffect(() => {
    if (phase !== "playing") return;
    const t = setInterval(() => {
      const g = game.current;
      const next = g.queue.shift();
      if (next && !isOpposite(next, g.dir)) g.dir = next;
      const r = step(g.snake, g.dir, g.apple);
      if (r.dead) {
        clearInterval(t);
        setPhase("over");
        return;
      }
      g.snake = r.snake;
      if (r.ate) {
        g.apples++;
        g.apple = randomApple(g.snake);
        if (!g.apple) {
          clearInterval(t);
          setPhase("over");
        }
      }
      redraw();
    }, TICK_MS);
    return () => clearInterval(t);
  }, [phase]);

  // Keyboard
  useEffect(() => {
    if (phase !== "playing") return;
    const onKey = (e: KeyboardEvent) => {
      const d = KEYS[e.key] ?? KEYS[e.key.toLowerCase()];
      if (!d) return;
      e.preventDefault();
      turn(d);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  // Send the score when a game ends
  useEffect(() => {
    if (phase !== "over") return;
    const id = gameId.current;
    gameId.current = null;
    if (!id) return;
    const apples = game.current.apples;
    finish({ data: { id, apples } })
      .then((res) => {
        setNote(res.awarded > 0 ? `+${res.awarded} سكور 🏆` : null);
        if (res.awarded > 0) void queryClient.invalidateQueries({ queryKey: ["profile"] });
      })
      .catch(() => setNote("ما قدرنا نحسب السكور هالمرة"));
  }, [phase, finish, queryClient]);

  const g = game.current;
  const body = new Set(g.snake.map((p) => p.y * GRID + p.x));
  const head = g.snake[0]!;
  const appleCell = g.apple ? g.apple.y * GRID + g.apple.x : -1;

  const onTouchEnd = (e: React.TouchEvent) => {
    const s = touch.current;
    const t = e.changedTouches[0];
    touch.current = null;
    if (!s || !t) return;
    const dx = t.clientX - s.x;
    const dy = t.clientY - s.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
    turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up");
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm">
        التفاح: <b className="font-display text-lg text-primary">{g.apples}</b> 🍎
        <span className="text-muted-foreground"> — كل تفاحة = {APPLE_SCORE} سكور</span>
      </p>
      <div
        dir="ltr"
        onTouchStart={(e) => {
          const t = e.touches[0];
          if (t) touch.current = { x: t.clientX, y: t.clientY };
        }}
        onTouchEnd={onTouchEnd}
        className="relative grid aspect-square w-full max-w-sm touch-none gap-px overflow-hidden rounded-xl border-2 border-primary bg-border p-px"
        style={{ gridTemplateColumns: `repeat(${GRID}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: GRID * GRID }, (_, i) => {
          const isHead = i === head.y * GRID + head.x;
          return (
            <div
              key={i}
              className={
                isHead
                  ? "rounded-sm bg-accent"
                  : body.has(i)
                    ? "rounded-sm bg-primary"
                    : "bg-background"
              }
            >
              {i === appleCell && (
                <span className="flex size-full items-center justify-center text-[0.65rem] leading-none sm:text-xs">🍎</span>
              )}
            </div>
          );
        })}
        {phase !== "playing" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80 text-center">
            {phase === "over" && (
              <p className="font-display text-2xl font-bold">خلصت! أكلت {g.apples} 🍎</p>
            )}
            <button
              onClick={() => void begin()}
              disabled={phase === "starting"}
              className="rounded-full bg-primary px-6 py-2.5 font-semibold text-primary-foreground transition hover:scale-105 disabled:opacity-60"
            >
              {phase === "starting" ? "لحظة..." : phase === "over" ? "العب من جديد" : "ابدأ 🐍"}
            </button>
          </div>
        )}
      </div>
      {note && <p className="text-sm font-semibold text-muted-foreground">{note}</p>}

      <div dir="ltr" className="grid grid-cols-3 gap-1.5">
        <span />
        <ArrowBtn label="فوق" onPress={() => turn("up")}>▲</ArrowBtn>
        <span />
        <ArrowBtn label="يسار" onPress={() => turn("left")}>◀</ArrowBtn>
        <ArrowBtn label="تحت" onPress={() => turn("down")}>▼</ArrowBtn>
        <ArrowBtn label="يمين" onPress={() => turn("right")}>▶</ArrowBtn>
      </div>
      <p className="text-xs text-muted-foreground">استخدم الأسهم في الكيبورد، أو اسحب على المربع في الجوال</p>
      {user === null && (
        <p className="text-xs text-muted-foreground">
          <Link to="/auth" className="font-semibold text-primary hover:underline">سجّل دخول</Link> عشان ينحسب لك السكور
        </p>
      )}
    </div>
  );
}

function ArrowBtn({ label, onPress, children }: { label: string; onPress: () => void; children: React.ReactNode }) {
  return (
    <button
      aria-label={label}
      onPointerDown={(e) => {
        e.preventDefault();
        onPress();
      }}
      className="flex size-11 items-center justify-center rounded-xl border bg-secondary/60 text-lg transition hover:bg-secondary active:scale-95"
    >
      {children}
    </button>
  );
}
