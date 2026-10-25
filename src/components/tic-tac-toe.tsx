import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { useAuthUser } from "@/lib/auth-context";
import { aiMove, fromBoardString, winner, WIN_POINTS, WIN_SCORE, type Cell } from "@/lib/ttt";
import { playTttMove, startTttGame } from "@/lib/ttt.functions";

const EMPTY: Cell[] = Array(9).fill(null);

export function TicTacToe() {
  const user = useAuthUser();
  const queryClient = useQueryClient();
  const start = useServerFn(startTttGame);
  const move = useServerFn(playTttMove);

  const [board, setBoard] = useState<Cell[]>(EMPTY);
  const [gameId, setGameId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const result = winner(board);
  const scored = !!user;

  const play = async (i: number) => {
    if (board[i] || result || busy) return;
    if (!scored) {
      const next = [...board];
      next[i] = "X";
      if (!winner(next)) next[aiMove(next)] = "O";
      setBoard(next);
      return;
    }
    setBusy(true);
    setError(false);
    const optimistic = [...board];
    optimistic[i] = "X";
    setBoard(optimistic);
    try {
      const id = gameId ?? (await start()).id;
      setGameId(id);
      const res = await move({ data: { id, cell: i } });
      if (!res.ok) throw new Error("move rejected");
      setBoard(fromBoardString(res.board));
      if (res.status === "won") void queryClient.invalidateQueries({ queryKey: ["profile"] });
    } catch {
      setBoard(board);
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setBoard(EMPTY);
    setGameId(null);
    setError(false);
  };

  const status =
    result === "X"
      ? scored
        ? `فزت! 🔥 +${WIN_SCORE} سكور و +${WIN_POINTS} نقاط`
        : "فزت! 🔥"
      : result === "O"
        ? "الذكاء الاصطناعي فاز 🤖"
        : result === "draw"
          ? "تعادل 🤝"
          : busy
            ? "الذكاء الاصطناعي يفكّر..."
            : "دورك — أنت X";

  return (
    <div className="flex flex-col items-center gap-4">
      <div dir="ltr" className="grid grid-cols-3 gap-2">
        {board.map((c, i) => (
          <button
            key={i}
            onClick={() => void play(i)}
            disabled={busy}
            className="flex size-14 items-center justify-center rounded-xl border bg-secondary/60 font-display text-2xl font-bold transition hover:bg-secondary"
          >
            <span className={c === "X" ? "text-primary" : "text-muted-foreground"}>{c}</span>
          </button>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">{status}</p>
      {error && <p className="text-sm text-destructive">صار خطأ، جرّب مرة ثانية</p>}
      {user === null && (
        <p className="text-xs text-muted-foreground">
          <Link to="/auth" className="font-semibold text-primary hover:underline">سجّل دخول</Link> عشان ينحسب لك السكور
        </p>
      )}
      <button onClick={reset} className="rounded-full border px-4 py-1.5 text-sm hover:bg-secondary">
        العب من جديد
      </button>
    </div>
  );
}
