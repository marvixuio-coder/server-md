import { createFileRoute, Link } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "روبو MD — شات ذكاء اصطناعي" },
      { name: "description", content: "سولف مع روبو MD، مساعد السيرفر الذكي." },
      { property: "og:title", content: "روبو MD — شات ذكاء اصطناعي" },
      { property: "og:description", content: "سولف مع روبو MD، مساعد السيرفر الذكي." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ChatPage,
});

const KEY = "md-chat-messages";

function ChatPage() {
  const [initial, setInitial] = useState<UIMessage[] | null>(null);
  useEffect(() => {
    try {
      setInitial(JSON.parse(localStorage.getItem(KEY) || "[]"));
    } catch {
      setInitial([]);
    }
  }, []);
  return (
    <main className="min-h-screen bg-glow px-4 py-8">
      <div className="mx-auto flex max-w-2xl flex-col">
        <div className="mb-4 flex items-center justify-between">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">→ رجوع</Link>
          <div className="flex items-center gap-2 font-display text-xl font-semibold">
            <span className="text-3xl">🤖</span> روبو MD
          </div>
        </div>
        {initial && <ChatWindow initial={initial} />}
      </div>
    </main>
  );
}

function ChatWindow({ initial }: { initial: UIMessage[] }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const { messages, sendMessage, status, setMessages, stop } = useChat({
    id: "md-chat",
    messages: initial,
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onError: (e) => setError(e.message.includes("402") ? "خلص رصيد الذكاء الاصطناعي" : e.message.includes("429") ? "ضغط كبير، جرّب بعد شوي" : "صار خطأ، جرّب مرة ثانية"),
  });
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (status !== "streaming") localStorage.setItem(KEY, JSON.stringify(messages));
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);
  useEffect(() => {
    if (!busy) inputRef.current?.focus();
  }, [busy]);

  const send = () => {
    const text = input.trim();
    if (!text || busy) return;
    setError(null);
    setInput("");
    void sendMessage({ text });
  };

  return (
    <div className="flex h-[75vh] flex-col rounded-3xl border bg-card">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="mt-16 text-center text-muted-foreground">
            <div className="text-6xl">🤖</div>
            <p className="mt-3">هلا! أنا روبو MD، اسألني أي شي</p>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "flex justify-start" : "flex justify-end"}>
            <div className={m.role === "user" ? "max-w-[80%] rounded-2xl bg-primary px-4 py-2 text-primary-foreground" : "prose prose-sm prose-invert max-w-[90%]"}>
              {m.parts.map((p, i) => (p.type === "text" ? <ReactMarkdown key={i}>{p.text}</ReactMarkdown> : null))}
            </div>
          </div>
        ))}
        {status === "submitted" && <div className="text-end text-muted-foreground">🤖 يكتب...</div>}
        {error && <div className="text-center text-sm text-destructive">{error}</div>}
        <div ref={endRef} />
      </div>
      <div className="flex items-end gap-2 border-t p-3">
        <textarea
          ref={inputRef}
          autoFocus
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="اكتب رسالتك..."
          className="flex-1 resize-none rounded-xl border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
        />
        {busy ? (
          <button onClick={() => stop()} className="rounded-xl bg-secondary px-4 py-2">إيقاف</button>
        ) : (
          <button onClick={send} disabled={!input.trim()} className="rounded-xl bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50">إرسال</button>
        )}
      </div>
      {messages.length > 0 && !busy && (
        <button onClick={() => { setMessages([]); localStorage.removeItem(KEY); }} className="pb-3 text-xs text-muted-foreground hover:text-foreground">
          محادثة جديدة
        </button>
      )}
    </div>
  );
}
