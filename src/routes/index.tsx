import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpLeft } from "lucide-react";

import { profile, servers } from "@/lib/servers";

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

function DiscordLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.331c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

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
          {profile.name}
        </h1>
        <p className="animate-rise mt-4 max-w-md text-center text-lg text-muted-foreground">
          {profile.bio}
        </p>

        <div className="animate-rise mt-5 inline-flex items-center gap-2 rounded-full border bg-secondary/60 px-4 py-1.5 text-sm text-muted-foreground">
          <span className="relative flex size-2.5">
            <span className="animate-ping-soft absolute inline-flex size-full rounded-full bg-online" />
            <span className="relative inline-flex size-2.5 rounded-full bg-online" />
          </span>
          {servers.length} سيرفرات متاحة
        </div>

        <ul className="mt-12 grid w-full gap-4 sm:grid-cols-2">
          {servers.map((server, i) => (
            <li
              key={server.invite}
              className="animate-rise"
              style={{ animationDelay: `${150 + i * 90}ms` }}
            >
              <a
                href={server.invite}
                target="_blank"
                rel="noopener noreferrer"
                className="server-card group flex h-full flex-col rounded-2xl border p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-3xl">
                    {server.emoji}
                  </div>
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
                    {server.tag}
                  </span>
                </div>

                <h2 className="mt-4 font-display text-2xl font-semibold">{server.name}</h2>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {server.description}
                </p>

                <div className="mt-5 flex items-center justify-between rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                  <span className="flex items-center gap-2">
                    <DiscordLogo className="size-5" />
                    ادخل السيرفر
                  </span>
                  <ArrowUpLeft className="size-5 transition-transform group-hover:-translate-x-1 group-hover:-translate-y-1" />
                </div>
              </a>
            </li>
          ))}
        </ul>

        <footer className="mt-14 text-sm text-muted-foreground">
          نشوفك داخل السيرفر 👋
        </footer>
      </div>
    </main>
  );
}
