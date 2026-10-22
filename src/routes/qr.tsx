import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/qr")({
  head: () => ({
    meta: [
      { title: "رمز QR — سيرفر MD" },
      { name: "description", content: "امسح رمز QR بجوالك وادخل سيرفر MD على ديسكورد." },
      { property: "og:title", content: "رمز QR — سيرفر MD" },
      { property: "og:description", content: "امسح رمز QR بجوالك وادخل سيرفر MD على ديسكورد." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: QrPage,
});

function QrPage() {
  return (
    <main className="min-h-screen bg-glow px-4 py-8">
      <div className="mx-auto flex max-w-md flex-col items-center">
        <Link to="/" className="self-start text-sm text-muted-foreground hover:text-foreground">→ رجوع</Link>
        <div className="animate-rise mt-10 flex flex-col items-center gap-4 rounded-3xl border bg-card p-6">
          <img
            src="https://api.qrserver.com/v1/create-qr-code/?size=360x360&margin=10&data=https%3A%2F%2Fdiscord.gg%2FahRGXk3n2"
            alt="رمز QR لدخول السيرفر"
            width={260}
            height={260}
            className="rounded-xl bg-background"
          />
          <p className="text-sm text-muted-foreground">امسح الرمز بجوالك وادخل السيرفر</p>
        </div>
      </div>
    </main>
  );
}
