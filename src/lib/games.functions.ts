import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { RIDDLES } from "@/components/riddles-data";
import { isRightAnswer } from "./riddles";
import { RIDDLE_SCORE } from "./score";
import { APPLE_SCORE, maxApples } from "./snake";

const validIdx = (n: number) => Number.isInteger(n) && n >= 0 && n < RIDDLES.length;
const UUID = /^[0-9a-f-]{36}$/i;

/** Checks a riddle answer; the first correct answer per riddle (without revealing) adds score. */
export const answerRiddle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { idx: number; guess: string }) => ({
    idx: Number(d?.idx),
    guess: String(d?.guess ?? "").slice(0, 100),
  }))
  .handler(async ({ data, context }) => {
    if (!validIdx(data.idx)) return { correct: false, awarded: 0 };
    if (!isRightAnswer(RIDDLES[data.idx]!, data.guess)) return { correct: false, awarded: 0 };
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await db
      .from("riddle_solves")
      .upsert(
        { user_id: context.userId, riddle_idx: data.idx, solved: true },
        { onConflict: "user_id,riddle_idx", ignoreDuplicates: true },
      )
      .select("riddle_idx");
    if (!rows?.length) return { correct: true, awarded: 0 };
    const { error } = await db.rpc("award_score", { _user_id: context.userId, _amount: RIDDLE_SCORE });
    if (error) console.error(error);
    return { correct: true, awarded: error ? 0 : RIDDLE_SCORE };
  });

/** Records that the answer was shown, so that riddle no longer gives score. */
export const revealRiddle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { idx: number }) => ({ idx: Number(d?.idx) }))
  .handler(async ({ data, context }) => {
    if (!validIdx(data.idx)) return { ok: false };
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    await db
      .from("riddle_solves")
      .upsert(
        { user_id: context.userId, riddle_idx: data.idx, solved: false },
        { onConflict: "user_id,riddle_idx", ignoreDuplicates: true },
      );
    return { ok: true };
  });

export const startSnakeGame = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const { data, error } = await db
      .from("snake_games")
      .insert({ user_id: context.userId })
      .select("id")
      .single();
    if (error || !data) throw new Error("could not start game");
    return { id: data.id };
  });

/** Ends a snake game once; credits at most what the game's length makes possible. */
export const finishSnakeGame = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { id: string; apples: number }) => ({
    id: String(d?.id ?? ""),
    apples: Math.floor(Number(d?.apples) || 0),
  }))
  .handler(async ({ data, context }) => {
    if (!UUID.test(data.id)) return { awarded: 0 };
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const { data: game } = await db
      .from("snake_games")
      .select("id,status,created_at")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!game || game.status !== "playing") return { awarded: 0 };
    const elapsed = Date.now() - new Date(game.created_at).getTime();
    const apples = Math.max(0, Math.min(data.apples, maxApples(elapsed)));
    const { data: updated } = await db
      .from("snake_games")
      .update({ status: "done", apples, finished_at: new Date().toISOString() })
      .eq("id", game.id)
      .eq("status", "playing")
      .select("id");
    if (!updated?.length || apples === 0) return { awarded: 0 };
    const amount = apples * APPLE_SCORE;
    const { error } = await db.rpc("award_score", { _user_id: context.userId, _amount: amount });
    if (error) console.error(error);
    return { awarded: error ? 0 : amount };
  });
