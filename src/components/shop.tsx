import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { fetchProfile, profileQueryKey, useAuthUser } from "@/lib/auth-context";

export type ShopKind = "vip_buy" | "og_claim";

const REPLIES: Record<string, string> = {
  ok: "✅ وصل طلبك للأونر",
  already: "طلبك موجود، انتظر الأونر",
  not_enough: "نقاطك ما تكفي، العب X O واجمع نقاط",
  signed_out: "سجّل دخول أول",
  need_proof: "اكتب الإثبات أول: بقالك قد إيه في السيرفر",
  proof_too_long: "الإثبات طويل، الحد 300 حرف",
};

/** Shows the signed-in player's points, or a sign-in link. */
export function MyPoints() {
  const user = useAuthUser();
  const { data: profile } = useQuery({
    queryKey: profileQueryKey(user?.id ?? "none"),
    queryFn: () => fetchProfile(user!.id),
    enabled: !!user,
  });
  if (user === undefined) return null;
  if (!user)
    return (
      <Link to="/auth" className="font-semibold text-primary hover:underline">
        سجّل دخول عشان تشتري
      </Link>
    );
  return <span>نقاطك: <b className="text-foreground">{profile?.points ?? 0}</b> 💎</span>;
}

/**
 * Sends a shop request under the signed-in account; VIP points are taken by the database.
 * With `proofLabel`, a proof box shows above the button and must be filled first.
 */
export function ShopButton({
  kind,
  children,
  proofLabel,
}: {
  kind: ShopKind;
  children: ReactNode;
  proofLabel?: ReactNode;
}) {
  const user = useAuthUser();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [proof, setProof] = useState("");

  const send = async () => {
    if (!user) return setMsg(REPLIES["signed_out"]!);
    if (proofLabel && !proof.trim()) return setMsg(REPLIES["need_proof"]!);
    setBusy(true);
    setMsg(null);
    const { data, error } = await supabase.rpc("request_shop_item", {
      _kind: kind,
      ...(proofLabel ? { _proof: proof.trim() } : {}),
    });
    setBusy(false);
    setMsg(error ? "صار خطأ، جرّب مرة ثانية" : (REPLIES[data] ?? "صار خطأ، جرّب مرة ثانية"));
    if (data === "ok") {
      setProof("");
      void queryClient.invalidateQueries({ queryKey: profileQueryKey(user.id) });
    }
  };

  return (
    <div className="mt-auto flex flex-col gap-2 pt-4">
      {proofLabel && (
        <label className="flex flex-col gap-1.5 text-start text-sm">
          {proofLabel}
          <textarea
            value={proof}
            onChange={(e) => setProof(e.target.value)}
            maxLength={300}
            rows={2}
            placeholder="مثلًا: من سنة 2023، ودخلت عن طريق..."
            className="resize-none rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </label>
      )}
      <button
        onClick={() => void send()}
        disabled={busy}
        className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition hover:scale-[1.02] disabled:opacity-60"
      >
        {busy ? "لحظة..." : children}
      </button>
      {msg && <p className="text-center text-xs text-muted-foreground">{msg}</p>}
    </div>
  );
}
