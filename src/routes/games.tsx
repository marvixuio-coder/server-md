import { createFileRoute, Link } from "@tanstack/react-router";
import { TicTacToe } from "@/components/tic-tac-toe";
import { Riddles } from "@/components/riddles";

export const Route = createFileRoute("/games")({
  head: () => ({
    meta: [
      { title: "ألعاب MD — X O وألغاز" },
      { name: "description", content: "العب X O ضد الذكاء الاصطناعي وحل الألغاز." },
      { property: "og:title", content: "ألعاب MD — X O وألغاز" },
      { property: "og:description", content: "العب X O ضد الذكاء الاصطناعي وحل الألغاز." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Games,
});

function Games() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="bg-glow pointer-events-none absolute inset-0" />
      <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-8 px-5 pt-16 pb-16">
        <Link to="/" className="self-start rounded-full border px-4 py-1.5 text-sm hover:bg-secondary">
          → رجوع
        </Link>
        <h1 className="font-display text-4xl font-bold">بدأ التحدي 🎮</h1>
        <div className="grid w-full gap-4 sm:grid-cols-2">
        <section className="aspect-square rounded-2xl border bg-card p-5 text-center">
          <h2 className="font-display text-2xl font-bold">X O</h2>
          <p className="mt-2 mb-5 text-sm text-muted-foreground">العب ضد الذكاء الاصطناعي</p>
          <TicTacToe />
        </section>
        <section className="aspect-square overflow-y-auto rounded-2xl border bg-card p-5 text-center">
          <h2 className="mb-5 font-display text-2xl font-bold">ألغاز 🧩</h2>
          <Riddles />
        </section>
        </div>
      </div>
    </main>
  );
}
