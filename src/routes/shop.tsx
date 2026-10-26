import { createFileRoute, Link } from "@tanstack/react-router";

import { MyPoints, ShopButton } from "@/components/shop";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "SHOP — متجر MD" },
      { name: "description", content: "اشترِ VIP بنقاطك أو ارسل طلب OG في سيرفر MD." },
      { property: "og:title", content: "SHOP — متجر MD" },
      { property: "og:description", content: "اشترِ VIP بنقاطك أو ارسل طلب OG في سيرفر MD." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Shop,
});

function Shop() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="bg-glow pointer-events-none absolute inset-0" />
      <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-6 px-5 pt-16 pb-16">
        <Link to="/" className="self-start rounded-full border px-4 py-1.5 text-sm hover:bg-secondary">
          → رجوع
        </Link>
        <section className="server-card animate-rise relative flex w-full flex-col rounded-2xl border p-5">
          <span className="absolute end-5 top-5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
            <MyPoints />
          </span>
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-3xl">🛒</div>
          <h1 className="mt-4 font-display text-2xl font-semibold tracking-wide">SHOP</h1>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            اجمع سكور من الألعاب، وكل 100 سكور حوّلها لـ 5 نقاط من صفحة الألعاب، واشترِ بنقاطك
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col rounded-2xl border-2 border-primary bg-card p-5 text-center">
              <div className="text-4xl">👑</div>
              <h2 className="mt-3 font-display text-2xl font-bold">VIP</h2>
              <p className="mt-2 text-sm text-muted-foreground">رتبة VIP في السيرفر ومميزات ما يحصّلها غيرك</p>
              <p className="mt-3 font-display text-3xl font-bold text-primary">700 نقطة</p>
              <ShopButton kind="vip_buy">شراء VIP</ShopButton>
            </div>
            <div className="flex flex-col rounded-2xl border-2 border-primary bg-card p-5 text-center">
              <div className="text-4xl">🔥</div>
              <h2 className="mt-3 font-display text-2xl font-bold">OG</h2>
              <p className="mt-2 text-sm text-muted-foreground">رتبة OG للي معنا من البداية</p>
              <p className="mt-3 font-display text-3xl font-bold text-primary">طلب</p>
              <ShopButton kind="og_claim" proofLabel="الإثبات: بقالك قد إيه في السيرفر؟">
                ارسل طلب OG
              </ShopButton>
            </div>
          </div>
        </section>
        <Link to="/games" className="text-sm font-semibold text-primary hover:underline">
          🎮 روح العب واجمع سكور
        </Link>
      </div>
    </main>
  );
}
