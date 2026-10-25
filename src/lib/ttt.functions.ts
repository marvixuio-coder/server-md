import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { aiMove, fromBoardString, toBoardString, winner } from "./ttt";

type GameStatus = "playing" | "won" | "lost" | "draw";

/** Starts a scored game for the signed-in player. The board lives on the server so wins can't be faked. */
export const startTttGame = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const { data, error } = await db
      .from("ttt_games")
      .insert({ user_id: context.userId })
      .select("id,board")
      .single();
    if (error || !data) throw new Error("could not start game");
    return { id: data.id, board: data.board };
  });

export const playTttMove = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { id: string; cell: number }) => ({
    id: String(d?.id ?? ""),
    cell: Number(d?.cell),
  }))
  .handler(async ({ data, context }) => {
    if (!/^[0-9a-f-]{36}$/i.test(data.id) || !Number.isInteger(data.cell) || data.cell < 0 || data.cell > 8)
      return { ok: false as const };
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const { data: game } = await db
      .from("ttt_games")
      .select("id,board,status")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!game || game.status !== "playing") return { ok: false as const };

    const board = fromBoardString(game.board);
    if (board[data.cell]) return { ok: false as const };
    board[data.cell] = "X";
    let aiCell = -1;
    if (!winner(board)) {
      aiCell = aiMove(board);
      if (aiCell >= 0) board[aiCell] = "O";
    }
    const w = winner(board);
    const status: GameStatus = w === "X" ? "won" : w === "O" ? "lost" : w === "draw" ? "draw" : "playing";

    // Only the request that actually moves the board from its old state counts (no double rewards).
    const { data: updated } = await db
      .from("ttt_games")
      .update({ board: toBoardString(board), status, updated_at: new Date().toISOString() })
      .eq("id", game.id)
      .eq("board", game.board)
      .eq("status", "playing")
      .select("id");
    if (!updated?.length) return { ok: false as const };

    if (status === "won") {
      const { error } = await db.rpc("award_ttt_win", { _user_id: context.userId });
      if (error) console.error(error);
    }
    return { ok: true as const, board: toBoardString(board), status };
  });
