import { createFileRoute } from "@tanstack/react-router";

import {
  DiscordLogo,
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
        <div className="animate-rise flex size-20 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-[var(--shadow-glow)]">
          <DiscordLogo className="size-11" />
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

        <footer className="mt-14 text-sm text-muted-foreground">نشوفك داخل السيرفر 👋</footer>
      </div>
    </main>
  );
}
