import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { OwnerPasswordBox } from "@/components/owner-gate";
import { OwnerTag, useOwnerIds } from "@/components/owner-tag";
import { supabase } from "@/integrations/supabase/client";
import {
  completeShopRequest,
  deleteAllCommunityMessages,
  deleteCommunityMessage,
  deleteMember,
  getOwnerDashboard,
  lockOwner,
  rejectShopRequest,
} from "@/lib/owner.functions";

const dashboardQuery = queryOptions({
  queryKey: ["owner-dashboard"],
  queryFn: () => getOwnerDashboard(),
  // Backup for the live updates: also refresh every 10s while the panel is open.
  refetchInterval: (q) => (q.state.data?.unlocked ? 10_000 : false),
});

export const Route = createFileRoute("/owner")({
  // Signed-in owners are recognised by their account, which only the browser knows.
  ssr: false,
  head: () => ({
    meta: [
      { title: "لوحة التحكم — MD" },
      { name: "description", content: "لوحة تحكم أصحاب سيرفر MD." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "لوحة التحكم — MD" },
      { property: "og:description", content: "لوحة تحكم أصحاب سيرفر MD." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(dashboardQuery),
  component: OwnerPage,
});

const fmt = (d: string) =>
  new Date(d).toLocaleString("ar", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

const REQUEST_LABELS: Record<string, string> = {
  vip_buy: "شراء VIP",
  og_buy: "شراء OG",
  og_claim: "مطالبة OG",
};

function OwnerPage() {
  const { data } = useSuspenseQuery(dashboardQuery);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const owners = useOwnerIds();
  const lock = useServerFn(lockOwner);
  const delMsg = useServerFn(deleteCommunityMessage);
  const delAll = useServerFn(deleteAllCommunityMessages);
  const delMember = useServerFn(deleteMember);
  const completeReq = useServerFn(completeShopRequest);
  const rejectReq = useServerFn(rejectShopRequest);
  const refresh = () => queryClient.invalidateQueries({ queryKey: dashboardQuery.queryKey });
  const unlocked = data.unlocked;

  // Live: refresh the panel whenever someone writes in the community chat.
  useEffect(() => {
    if (!unlocked) return;
    const channel = supabase
      .channel(`owner-chat-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "community_messages" }, () => {
        void queryClient.invalidateQueries({ queryKey: dashboardQuery.queryKey });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [unlocked, queryClient]);

  if (!data.unlocked) {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center gap-4 px-5">
        <div className="bg-glow pointer-events-none absolute inset-0" />
        <div className="relative flex aspect-square w-[min(90vw,22rem)] flex-col items-center justify-center rounded-3xl border bg-card p-8 shadow-[var(--shadow-glow)]">
          <OwnerPasswordBox
            onUnlocked={() => {
              queryClient.removeQueries({ queryKey: ["owner-access"] });
              void refresh();
            }}
          />
        </div>
        <Link to="/" className="relative text-sm text-muted-foreground hover:text-foreground">
          → رجوع للرئيسية
        </Link>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="bg-glow pointer-events-none absolute inset-0" />
      <div className="relative mx-auto max-w-4xl px-5 pt-12 pb-16">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            → رجوع للرئيسية
          </Link>
          <button
            onClick={async () => {
              await lock();
              queryClient.removeQueries({ queryKey: dashboardQuery.queryKey });
              queryClient.removeQueries({ queryKey: ["owner-access"] });
              void navigate({ to: "/", replace: true });
            }}
            className="rounded-full border border-destructive/60 px-4 py-1.5 text-sm font-semibold text-destructive hover:bg-destructive/10"
          >
            قفل اللوحة
          </button>
        </div>

        <h1 className="mt-6 font-display text-4xl font-bold">لوحة التحكم 🛠️</h1>
        <p className="mt-2 text-sm text-muted-foreground">كل اللي يصير في الموقع، يتحدّث لحاله أول ما أحد يكتب.</p>

        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-2xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">عدد الحسابات</p>
            <p className="mt-2 font-display text-4xl font-bold">{data.memberCount}</p>
          </div>
          <div className="rounded-2xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">دخلوا آخر ٢٤ ساعة</p>
            <p className="mt-2 font-display text-4xl font-bold">{data.activeToday}</p>
          </div>
          <div className="rounded-2xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">كل رسائل الشات</p>
            <p className="mt-2 font-display text-4xl font-bold">{data.messageCount}</p>
          </div>
          <div className="rounded-2xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">رسائل آخر ٢٤ ساعة</p>
            <p className="mt-2 font-display text-4xl font-bold">{data.messagesToday}</p>
          </div>
        </div>

        <Link
          to="/owner/bot"
          className="mt-6 flex items-center gap-4 rounded-2xl border-2 border-primary bg-card p-5 shadow-[var(--shadow-glow)] transition hover:scale-[1.01]"
        >
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-3xl">🤖</div>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-2xl font-bold">بوت MD</h2>
            <p className="text-sm text-muted-foreground">ادخل وكلّم البوت بالأوامر: تضيف أونرز، تنزّل رسائل، تضيف أوامر...</p>
          </div>
          <span className="text-2xl text-muted-foreground">←</span>
        </Link>

        <section className="mt-6 rounded-2xl border bg-card p-5">
          <h2 className="font-display text-xl font-semibold">
            🛒 الطلبات <span className="text-sm font-normal text-muted-foreground">— مين طلب من الشوب وبأي حساب</span>
          </h2>
          {data.requests.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">ما فيه طلبات لسا</p>
          ) : (
            <ul className="mt-4 max-h-[28rem] divide-y overflow-y-auto pe-1">
              {data.requests.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-1.5 font-semibold">
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">
                        {REQUEST_LABELS[r.kind] ?? r.kind}
                      </span>
                      {r.display_name}
                      {owners.has(r.user_id) && <OwnerTag />}
                      {r.username && (
                        <span dir="ltr" className="font-normal text-muted-foreground">@{r.username}</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {fmt(r.created_at)}
                      {r.price > 0 && ` · دفع ${r.price} نقطة`} · نقاطه الحين: {r.points}
                      {r.status === "done" && " · ✅ تم"}
                    </p>
                    {r.proof && (
                      <p className="mt-1 break-words rounded-lg bg-secondary/60 px-2 py-1 text-xs">
                        الإثبات: {r.proof}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {r.status === "pending" && (
                      <button
                        onClick={async () => {
                          await completeReq({ data: { id: r.id } });
                          void refresh();
                        }}
                        className="rounded-full border border-online/60 px-3 py-1 text-xs font-semibold text-online hover:bg-online/10"
                      >
                        تم
                      </button>
                    )}
                    <button
                      onClick={async () => {
                        const refund = r.status === "pending" && r.price > 0;
                        if (!confirm(refund ? `ترفض الطلب؟ ترجع له ${r.price} نقطة.` : "تمسح الطلب؟")) return;
                        await rejectReq({ data: { id: r.id } });
                        void refresh();
                      }}
                      className="rounded-full border px-3 py-1 text-xs text-destructive hover:bg-destructive/10"
                    >
                      {r.status === "pending" ? "رفض" : "مسح"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="mt-12 space-y-6">
          <section className="rounded-2xl border bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-xl font-semibold">
                💬 شات الفعالية <span className="text-sm font-normal text-muted-foreground">— مين كتب وايش كتب</span>
              </h2>
              {data.messages.length > 0 && (
                <button
                  onClick={async () => {
                    if (!confirm("تمسح كل رسائل الشات؟ ما تقدر ترجعها.")) return;
                    await delAll();
                    void refresh();
                  }}
                  className="shrink-0 rounded-full border border-destructive/60 px-3 py-1 text-xs font-semibold text-destructive hover:bg-destructive/10"
                >
                  مسح الكل
                </button>
              )}
            </div>
            {data.messages.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">ما فيه رسائل لسا</p>
            ) : (
              <ul className="mt-4 max-h-[28rem] divide-y overflow-y-auto pe-1">
                {data.messages.map((m) => (
                  <li key={m.id} className="flex items-start justify-between gap-3 py-2.5 text-sm">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-1.5 font-semibold">
                        {m.name}
                        {m.user_id && owners.has(m.user_id) && <OwnerTag />}
                        <span className="text-xs font-normal text-muted-foreground">{fmt(m.created_at)}</span>
                      </p>
                      <p className="break-words text-muted-foreground">{m.content}</p>
                    </div>
                    <button
                      onClick={async () => {
                        if (!confirm("تمسح هالرسالة؟")) return;
                        await delMsg({ data: { id: m.id } });
                        void refresh();
                      }}
                      className="shrink-0 rounded-full border px-3 py-1 text-xs text-destructive hover:bg-destructive/10"
                    >
                      مسح
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border bg-card p-5">
            <h2 className="font-display text-xl font-semibold">
              👤 الحسابات <span className="text-sm font-normal text-muted-foreground">— مين سجّل ومتى آخر دخول</span>
            </h2>
            {data.members.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">ما فيه حسابات لسا</p>
            ) : (
              <ul className="mt-4 max-h-[28rem] divide-y overflow-y-auto pe-1">
                {data.members.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-1.5 font-semibold">
                        {m.display_name}
                        {owners.has(m.id) && <OwnerTag />}
                        <span dir="ltr" className="font-normal text-muted-foreground">@{m.username}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        سجّل: {fmt(m.created_at)} · آخر دخول: {m.last_sign_in_at ? fmt(m.last_sign_in_at) : "—"}
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        if (!confirm(`تمسح حساب ${m.display_name}؟ ما يقدر يدخل فيه مرة ثانية.`)) return;
                        await delMember({ data: { id: m.id } });
                        void refresh();
                      }}
                      className="shrink-0 rounded-full border px-3 py-1 text-xs text-destructive hover:bg-destructive/10"
                    >
                      مسح الحساب
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
