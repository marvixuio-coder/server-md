import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { fetchProfile, profileQueryKey, useAuthUser } from "@/lib/auth-context";
import { convertPreview, POINTS_PER_BLOCK, SCORE_PER_BLOCK } from "@/lib/score";

/** Live score + points for the signed-in player, with the score → points exchange. */
export function ScoreBar() {
  const user = useAuthUser();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const { data: profile } = useQuery({
    queryKey: profileQueryKey(user?.id ?? "none"),
    queryFn: () => fetchProfile(user!.id),
    enabled: !!user,
  });

  if (user === undefined) return null;
  if (!user)
    return (
      <div className="w-full rounded-2xl border bg-card p-4 text-center text-sm text-muted-foreground">
        <Link to="/auth" className="font-semibold text-primary hover:underline">سجّل دخول</Link> عشان ينحسب لك
        السكور في كل الألعاب
      </div>
    );

  const score = profile?.score ?? 0;
  const { spend, gain } = convertPreview(score);

  const convert = async () => {
    setBusy(true);
    setMsg(null);
    const { data, error } = await supabase.rpc("convert_score_to_points");
    setBusy(false);
    if (error) return setMsg("صار خطأ، جرّب مرة ثانية");
    setMsg(data > 0 ? `✅ أخذت ${data} نقاط` : `تحتاج ${SCORE_PER_BLOCK} سكور على الأقل`);
    void queryClient.invalidateQueries({ queryKey: profileQueryKey(user.id) });
  };

  return (
    <div className="flex w-full flex-col items-center gap-3 rounded-2xl border bg-card p-4 sm:flex-row sm:justify-between">
      <div className="flex gap-3">
        <div className="rounded-xl border bg-background px-4 py-2 text-center">
          <p className="text-xs text-muted-foreground">السكور 🏆</p>
          <p className="font-display text-2xl font-bold">{score}</p>
        </div>
        <div className="rounded-xl border bg-background px-4 py-2 text-center">
          <p className="text-xs text-muted-foreground">النقاط 💎</p>
          <p className="font-display text-2xl font-bold text-primary">{profile?.points ?? 0}</p>
        </div>
      </div>
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={() => void convert()}
          disabled={busy || gain === 0}
          className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:scale-[1.02] disabled:opacity-50"
        >
          {busy ? "لحظة..." : gain > 0 ? `حوّل ${spend} سكور ← ${gain} نقاط` : "حوّل السكور لنقاط"}
        </button>
        <p className="text-xs text-muted-foreground">
          {msg ?? `كل ${SCORE_PER_BLOCK} سكور = ${POINTS_PER_BLOCK} نقاط`}
        </p>
      </div>
    </div>
  );
}
