import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { fetchProfile, profileQueryKey, useAuthUser } from "@/lib/auth-context";

export type ShopKind = "vip_buy" | "og_buy" | "og_claim";

const REPLIES: Record<string, string> = {
  ok: "✅ وصل طلبك للأونر",
  already: "طلبك موجود، انتظر الأونر",
  not_enough: "نقاطك ما تكفي، العب X O واجمع نقاط",
  signed_out: "سجّل دخول أول",
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

/** Sends a shop request under the signed-in account; VIP points are taken by the database. */
export function ShopButton({ kind, children, variant = "solid" }: { kind: ShopKind; children: ReactNode; variant?: "solid" | "outline" }) {
  const user = useAuthUser();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const send = async () => {
    if (!user) return setMsg(REPLIES["signed_out"]!);
    setBusy(true);
    setMsg(null);
    const { data, error } = await supabase.rpc("request_shop_item", { _kind: kind });
    setBusy(false);
    setMsg(error ? "صار خطأ، جرّب مرة ثانية" : (REPLIES[data] ?? "صار خطأ، جرّب مرة ثانية"));
    if (data === "ok") void queryClient.invalidateQueries({ queryKey: profileQueryKey(user.id) });
  };

  return (
    <div className="mt-4 flex flex-col items-center gap-1.5">
      <button
        onClick={() => void send()}
        disabled={busy}
        className={
          variant === "solid"
            ? "w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition hover:scale-[1.02] disabled:opacity-60"
            : "w-full rounded-full border-2 border-primary py-2.5 text-sm font-semibold transition hover:bg-primary/10 disabled:opacity-60"
        }
      >
        {busy ? "لحظة..." : children}
      </button>
      {msg && <p className="text-xs text-muted-foreground">{msg}</p>}
    </div>
  );
}
