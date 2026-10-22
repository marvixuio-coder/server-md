import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "شات الفعالية — MD" },
      { name: "description", content: "شات عام لكل أعضاء MD، اكتب واثبت نفسك وممكن تكسب في الفعالية." },
      { property: "og:title", content: "شات الفعالية — MD" },
      { property: "og:description", content: "شات عام لكل أعضاء MD، اكتب واثبت نفسك وممكن تكسب في الفعالية." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CommunityPage,
});

type Msg = { id: string; name: string; content: string; created_at: string };
const NAME_KEY = "md-community-name";

function CommunityPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setName(localStorage.getItem(NAME_KEY) ?? "");
    let active = true;
    supabase
      .from("community_messages")
      .select("id,name,content,created_at")
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setError("ما قدرنا نجيب الرسائل، حدّث الصفحة");
        else setMessages((data ?? []).reverse());
        setLoading(false);
      });

    const channel = supabase
      .channel("community_messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "community_messages" },
        (payload) => {
          const m = payload.new as Msg;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
        },
      )
      .subscribe();
    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const n = name.trim();
    const c = text.trim();
    if (!n) return setError("اكتب اسمك أول");
    if (!c || sending) return;
    setSending(true);
    setError(null);
    localStorage.setItem(NAME_KEY, n);
    const { data, error } = await supabase
      .from("community_messages")
      .insert({ name: n.slice(0, 30), content: c.slice(0, 500) })
      .select("id,name,content,created_at")
      .single();
    setSending(false);
    if (error) return setError("ما انرسلت الرسالة، جرّب مرة ثانية");
    setText("");
    if (data) setMessages((prev) => (prev.some((x) => x.id === data.id) ? prev : [...prev, data]));
  };

  const myName = name.trim();

  return (
    <main className="min-h-screen bg-glow px-4 py-8">
      <div className="mx-auto flex max-w-2xl flex-col">
        <div className="mb-4">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">→ رجوع</Link>
        </div>

        <div className="animate-rise mb-6 rounded-3xl border bg-card p-6 text-center shadow-[var(--shadow-glow)]">
          <div className="text-4xl">🏆</div>
          <h1 className="mt-3 font-display text-3xl font-bold sm:text-4xl">اثبت نفسك ممكن تكسب في الفعالية</h1>
          <p className="mt-2 text-sm text-muted-foreground">شات عام، كل اللي تكتبه يشوفه الكل ويضل موجود</p>
        </div>

        <div className="flex h-[65vh] flex-col rounded-3xl border bg-card">
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {loading && <p className="mt-10 text-center text-muted-foreground">جاري التحميل...</p>}
            {!loading && messages.length === 0 && (
              <p className="mt-10 text-center text-muted-foreground">ما فيه رسائل لسا، كن أول واحد يكتب!</p>
            )}
            {messages.map((m) => {
              const mine = myName && m.name === myName;
              return (
                <div key={m.id} className={mine ? "flex justify-start" : "flex justify-end"}>
                  <div className={mine ? "max-w-[80%] rounded-2xl bg-primary px-4 py-2 text-primary-foreground" : "max-w-[80%] rounded-2xl bg-secondary px-4 py-2"}>
                    <div className="text-xs font-semibold opacity-80">{m.name}</div>
                    <div className="whitespace-pre-wrap break-words">{m.content}</div>
                    <div className="mt-1 text-[10px] opacity-60">
                      {new Date(m.created_at).toLocaleString("ar", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>

          {error && <div className="px-3 pb-2 text-center text-sm text-destructive">{error}</div>}

          <div className="space-y-2 border-t p-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={30}
              placeholder="اسمك"
              aria-label="اسمك"
              className="w-full rounded-xl border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="flex items-end gap-2">
              <textarea
                rows={1}
                value={text}
                maxLength={500}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                placeholder="اكتب رسالتك للكل..."
                aria-label="رسالتك"
                className="flex-1 resize-none rounded-xl border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                onClick={() => void send()}
                disabled={!text.trim() || sending}
                className="rounded-xl bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
              >
                {sending ? "..." : "إرسال"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
