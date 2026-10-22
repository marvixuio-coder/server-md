import { createFileRoute, Link } from "@tanstack/react-router";

import {
  ServerCard,
  ServerName,
  ServerTag,
  ServerText,
} from "@/components/server-card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "روابطي على ديسكورد — ادخل سيرفراتي" },
      { name: "description", content: "كل روابط سيرفرات ديسكورد في صفحة واحدة، اضغط وادخل مباشرة." },
      { property: "og:title", content: "روابطي على ديسكورد" },
      { property: "og:description", content: "كل روابط سيرفرات ديسكورد في صفحة واحدة، اضغط وادخل مباشرة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="bg-glow pointer-events-none absolute inset-0" />
      <div className="bg-grid pointer-events-none absolute inset-0" />

      <div className="relative mx-auto flex max-w-3xl flex-col items-center px-5 pt-20 pb-16">
        <div
          dir="ltr"
          className="animate-rise flex h-32 w-full max-w-md items-center justify-center rounded-3xl border px-6 text-center font-display text-2xl font-bold tracking-wide shadow-[var(--shadow-glow)] sm:text-3xl"
          style={{ backgroundColor: "#000", color: "#fff" }}
        >
          welcome to the MD
        </div>

        <h1 className="animate-rise mt-7 font-display text-5xl font-bold tracking-tight sm:text-6xl">
          MD
        </h1>
        <p className="animate-rise mt-4 max-w-md text-center text-lg text-muted-foreground">
          بي انتظارك في سيرفر ياحلو
        </p>

        <div className="animate-rise mt-5 inline-flex items-center gap-2 rounded-full border bg-secondary/60 px-4 py-1.5 text-sm text-muted-foreground">
          <span className="relative flex size-2.5">
            <span className="animate-ping-soft absolute inline-flex size-full rounded-full bg-online" />
            <span className="relative inline-flex size-2.5 rounded-full bg-online" />
          </span>
          السيرفرات شغالة الحين
        </div>

        {/* كل خانة = سيرفر. لإضافة سيرفر انسخ خانة كاملة وغيّر الرابط والنصوص */}
        <ul className="mt-12 grid w-full gap-4 sm:grid-cols-2">
          <ServerCard href="https://discord.gg/ahRGXk3n2" emoji="🏠" wide>
            <ServerTag>عام</ServerTag>
            <ServerName>discored</ServerName>
            <ServerText>المجتمع العام، سوالف ونقاشات وفعاليات أسبوعية</ServerText>
          </ServerCard>
        </ul>

        <Link
          to="/qr"
          aria-label="اعرض رمز QR"
          className="absolute top-4 left-4 z-10 flex size-16 flex-col items-center justify-center rounded-full border-2 border-primary bg-card shadow-[var(--shadow-glow)] transition hover:scale-105"
        >
          <span className="text-2xl">📱</span>
          <span className="text-xs font-semibold">QR</span>
        </Link>

        <section className="mt-10 grid w-full gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border bg-card p-5 text-center">
            <div className="text-3xl">🎮</div>
            <h3 className="mt-3 font-display text-xl font-semibold">جيمنج</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              فريقك جاهز في أي وقت، العب وتحدّى وكوّن أقوى سكواد 
وحته هنا تقدر تلعب 
            </p>
            <Link
              to="/games"
              aria-label="الألعاب: X O وألغاز"
              className="mx-auto mt-4 flex size-28 flex-col items-center justify-center rounded-full border-4 border-primary bg-background shadow-[var(--shadow-glow)] transition hover:scale-105"
            >
              <div dir="ltr" className="grid grid-cols-3 gap-0.5 text-lg font-bold leading-none">
                <span />
                <span className="text-online">△</span>
                <span />
                <span className="text-primary">□</span>
                <span />
                <span className="text-destructive">○</span>
                <span />
                <span className="text-primary">✕</span>
                <span />
              </div>
              <span className="mt-1 text-xs font-semibold">X O وألغاز</span>
            </Link>
          </div>
          <div className="rounded-2xl border bg-card p-5 text-center">
            <div className="text-3xl">🎉</div>
            <h3 className="mt-3 font-display text-xl font-semibold">فعاليات</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              بطولات ومسابقات وجوائز كل أسبوع، ولا لحظة ملل
            </p>
            <Link
              to="/community"
              aria-label="شات الفعالية"
              className="mx-auto mt-4 flex size-28 flex-col items-center justify-center gap-1 rounded-3xl border-2 border-primary bg-primary/15 transition hover:scale-105"
            >
              <span className="text-4xl">💬</span>
              <span className="text-xs font-semibold">شات الفعالية</span>
            </Link>
          </div>
          <div className="rounded-2xl border bg-card p-5 text-center">
            <div className="text-3xl">🤝</div>
            <h3 className="mt-3 font-display text-xl font-semibold">مجتمع</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              ناس رايقة وسوالف حلوة، تدخل غريب وتطلع واحد منّا
            </p>
            <Link
              to="/chat"
              aria-label="سولف مع روبو MD"
              className="mx-auto mt-4 flex size-28 flex-col items-center justify-center gap-1 rounded-3xl border-2 border-primary bg-primary/15 transition hover:scale-105"
            >
              <span className="text-4xl">🤖</span>
              <span className="text-xs font-semibold">كلّم الروبوت</span>
            </Link>
          </div>
        </section>


        <footer className="mt-14 text-sm text-muted-foreground">نشوفك داخل السيرفر 👋</footer>
      </div>
    </main>
  );
}
