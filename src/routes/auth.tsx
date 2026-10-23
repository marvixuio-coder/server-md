import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/lib/auth-context";
import { isValidUsername, MIN_PASSWORD_LENGTH, normalizeUsername, usernameToEmail } from "@/lib/username";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول — MD" },
      { name: "description", content: "سجّل دخولك أو أنشئ حسابك في MD باسم مستخدم وكلمة سر." },
      { property: "og:title", content: "تسجيل الدخول — MD" },
      { property: "og:description", content: "سجّل دخولك أو أنشئ حسابك في MD باسم مستخدم وكلمة سر." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const user = useAuthUser();

  useEffect(() => {
    if (user) void navigate({ to: "/profile", replace: true });
  }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isValidUsername(username)) {
      setError("اسم المستخدم لازم يكون من 3 إلى 20 حرف إنجليزي أو رقم أو _");
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`كلمة السر لازم تكون ${MIN_PASSWORD_LENGTH} أحرف على الأقل`);
      return;
    }
    if (mode === "signup" && !displayName.trim()) {
      setError("اكتب اسمك");
      return;
    }

    setBusy(true);
    const email = usernameToEmail(username);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username: normalizeUsername(username), display_name: displayName.trim() },
        },
      });
      if (error) {
        setError(
          /already|registered|exists/i.test(error.message)
            ? "اسم المستخدم هذا مأخوذ، جرّب غيره"
            : "ما قدرنا ننشئ الحساب، جرّب مرة ثانية",
        );
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError("اسم المستخدم أو كلمة السر غلط");
    }
    setBusy(false);
  };

  const field =
    "w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary";

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="bg-glow pointer-events-none absolute inset-0" />
      <div className="relative mx-auto flex max-w-md flex-col px-5 pt-16 pb-16">
        <Link to="/" className="self-start text-sm text-muted-foreground hover:text-foreground">
          → رجوع للرئيسية
        </Link>

        <div className="animate-rise mt-6 rounded-3xl border bg-card p-6 shadow-[var(--shadow-glow)]">
          <h1 className="text-center font-display text-3xl font-bold">
            {mode === "login" ? "أهلًا من جديد" : "حساب جديد"}
          </h1>

          <div className="mt-6 grid grid-cols-2 gap-1 rounded-full border bg-secondary/60 p-1 text-sm font-semibold">
            <button
              type="button"
              onClick={() => { setMode("login"); setError(null); }}
              className={`rounded-full py-2 transition ${mode === "login" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              تسجيل دخول
            </button>
            <button
              type="button"
              onClick={() => { setMode("signup"); setError(null); }}
              className={`rounded-full py-2 transition ${mode === "signup" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              إنشاء حساب
            </button>
          </div>

          <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
            {mode === "signup" && (
              <label className="flex flex-col gap-1.5 text-sm">
                الاسم
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={40}
                  placeholder="اسمك اللي يظهر للناس"
                  className={field}
                />
              </label>
            )}
            <label className="flex flex-col gap-1.5 text-sm">
              اسم المستخدم
              <input
                dir="ltr"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={20}
                autoComplete="username"
                placeholder="username"
                className={`${field} text-left`}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              كلمة السر
              <input
                dir="ltr"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                placeholder="••••••"
                className={`${field} text-left`}
              />
            </label>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <button
              type="submit"
              disabled={busy}
              className="mt-2 rounded-full bg-primary py-3 font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
            >
              {busy ? "لحظة..." : mode === "login" ? "ادخل" : "أنشئ حسابي"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
