import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { OwnerPasswordBox } from "@/components/owner-gate";
import { checkOwnerAccess, lockOwner, runBotCommand } from "@/lib/owner.functions";

const accessQuery = queryOptions({
  queryKey: ["owner-access"],
  queryFn: () => checkOwnerAccess(),
});

export const Route = createFileRoute("/owner_/bot")({
  // Signed-in owners are recognised by their account, which only the browser knows.
  ssr: false,
  head: () => ({
    meta: [
      { title: "بوت التحكم — MD" },
      { name: "description", content: "بوت أوامر لأصحاب سيرفر MD." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "بوت التحكم — MD" },
      { property: "og:description", content: "بوت أوامر لأصحاب سيرفر MD." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(accessQuery),
  component: BotPage,
});

type Line = { from: "bot" | "me"; text: string };

const QUICK = ["/help", "/stats", "/messages", "/members", "/owners", "/cmds"];

const WELCOME: Line = {
  from: "bot",
  text: "أهلًا يا أونر 👋 أنا بوت MD.\nاكتب أمر وأنا أنفّذه. اكتب /help تشوف كل الأوامر.",
};

function BotPage() {
  const { data } = useSuspenseQuery(accessQuery);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const lock = useServerFn(lockOwner);
  const run = useServerFn(runBotCommand);
  const [lines, setLines] = useState<Line[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [lines]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: accessQuery.queryKey });

  if (!data.owner) {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center gap-4 px-5">
        <div className="bg-glow pointer-events-none absolute inset-0" />
        <div className="relative flex aspect-square w-[min(90vw,22rem)] flex-col items-center justify-center rounded-3xl border bg-card p-8 shadow-[var(--shadow-glow)]">
          <OwnerPasswordBox onUnlocked={refresh} />
        </div>
        <Link to="/" className="relative text-sm text-muted-foreground hover:text-foreground">
          → رجوع للرئيسية
        </Link>
      </main>
    );
  }

  const send = async (raw: string) => {
    const text = raw.trim();
    if (!text || busy) return;
    setInput("");
    setLines((l) => [...l, { from: "me", text }]);
    setBusy(true);
    try {
      const res = await run({ data: { input: text } });
      if (res.locked) {
        setLines((l) => [...l, { from: "bot", text: "انتهت جلستك، ادخل كلمة السر من جديد." }]);
        void refresh();
      } else {
        setLines((l) => [...l, { from: "bot", text: res.reply }]);
      }
    } catch {
      setLines((l) => [...l, { from: "bot", text: "صار خطأ، جرّب مرة ثانية." }]);
    }
    setBusy(false);
    inputRef.current?.focus();
  };

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden">
      <div className="bg-glow pointer-events-none absolute inset-0" />
      <div className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 pt-8 pb-6">
        <div className="flex items-center justify-between gap-4">
          <Link to="/owner" className="text-sm text-muted-foreground hover:text-foreground">
            → رجوع للوحة التحكم
          </Link>
          <button
            onClick={async () => {
              await lock();
              queryClient.removeQueries({ queryKey: accessQuery.queryKey });
              void navigate({ to: "/", replace: true });
            }}
            className="rounded-full border border-destructive/60 px-4 py-1.5 text-sm font-semibold text-destructive hover:bg-destructive/10"
          >
            قفل
          </button>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-2xl">🤖</div>
          <div>
            <h1 className="font-display text-3xl font-bold">بوت MD</h1>
            <p className="text-sm text-muted-foreground">كلّم البوت بالأوامر</p>
          </div>
        </div>

        <div className="mt-6 flex min-h-[22rem] flex-1 flex-col gap-3 overflow-y-auto rounded-2xl border bg-card p-4">
          {lines.map((line, i) => (
            <div
              key={i}
              className={
                line.from === "me"
                  ? "max-w-[85%] self-start rounded-2xl rounded-ss-sm bg-primary px-4 py-2 text-sm text-primary-foreground"
                  : "max-w-[90%] self-end rounded-2xl rounded-se-sm border bg-background px-4 py-2 text-sm whitespace-pre-wrap"
              }
              dir={line.from === "me" && line.text.startsWith("/") ? "ltr" : undefined}
            >
              {line.text}
            </div>
          ))}
          {busy && <div className="self-end text-sm text-muted-foreground">البوت يكتب...</div>}
          <div ref={endRef} />
        </div>

        <div className="mt-3 flex flex-wrap gap-2" dir="ltr">
          {QUICK.map((q) => (
            <button
              key={q}
              onClick={() => void send(q)}
              disabled={busy}
              className="rounded-full border bg-card px-3 py-1 text-xs font-semibold transition hover:border-primary disabled:opacity-60"
            >
              {q}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
          className="mt-3 flex gap-2"
        >
          <input
            ref={inputRef}
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="اكتب أمر... مثلًا /say أهلًا بالكل"
            maxLength={1200}
            className="flex-1 rounded-full border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="rounded-full bg-primary px-6 font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
          >
            إرسال
          </button>
        </form>
      </div>
    </main>
  );
}
