import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { OwnerPasswordBox } from "@/components/owner-gate";
import { deleteCommunityMessage, getOwnerDashboard, lockOwner } from "@/lib/owner.functions";

const dashboardQuery = queryOptions({
  queryKey: ["owner-dashboard"],
  queryFn: () => getOwnerDashboard(),
});

export const Route = createFileRoute("/owner")({
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

function OwnerPage() {
  const { data } = useSuspenseQuery(dashboardQuery);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const lock = useServerFn(lockOwner);
  const del = useServerFn(deleteCommunityMessage);
  const refresh = () => queryClient.invalidateQueries({ queryKey: dashboardQuery.queryKey });

  if (!data.unlocked) {
    return (
      <main className="relative flex min-h-screen items-center justify-center px-5">
        <div className="bg-glow pointer-events-none absolute inset-0" />
        <div className="relative flex aspect-square w-[min(90vw,22rem)] flex-col items-center justify-center rounded-3xl border bg-card p-8 shadow-[var(--shadow-glow)]">
          <OwnerPasswordBox onUnlocked={refresh} />
        </div>
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
              void navigate({ to: "/", replace: true });
            }}
            className="rounded-full border border-destructive/60 px-4 py-1.5 text-sm font-semibold text-destructive hover:bg-destructive/10"
          >
            قفل اللوحة
          </button>
        </div>

        <h1 className="mt-6 font-display text-4xl font-bold">لوحة التحكم 🛠️</h1>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">عدد الحسابات</p>
            <p className="mt-2 font-display text-4xl font-bold">{data.memberCount}</p>
          </div>
          <div className="rounded-2xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">رسائل شات الفعالية</p>
            <p className="mt-2 font-display text-4xl font-bold">{data.messageCount}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border bg-card p-5">
            <h2 className="font-display text-xl font-semibold">آخر الحسابات</h2>
            {data.members.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">ما فيه حسابات لسا</p>
            ) : (
              <ul className="mt-4 divide-y">
                {data.members.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{m.display_name}</p>
                      <p dir="ltr" className="truncate text-end text-muted-foreground">@{m.username}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{fmt(m.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border bg-card p-5">
            <h2 className="font-display text-xl font-semibold">رسائل الشات</h2>
            {data.messages.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">ما فيه رسائل لسا</p>
            ) : (
              <ul className="mt-4 divide-y">
                {data.messages.map((m) => (
                  <li key={m.id} className="flex items-start justify-between gap-3 py-2.5 text-sm">
                    <div className="min-w-0">
                      <p className="font-semibold">
                        {m.name} <span className="text-xs font-normal text-muted-foreground">{fmt(m.created_at)}</span>
                      </p>
                      <p className="break-words text-muted-foreground">{m.content}</p>
                    </div>
                    <button
                      onClick={async () => {
                        if (!confirm("تمسح هالرسالة؟")) return;
                        await del({ data: { id: m.id } });
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
        </div>
      </div>
    </main>
  );
}
