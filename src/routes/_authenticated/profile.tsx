import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { OwnerTag, useOwnerIds } from "@/components/owner-tag";
import { supabase } from "@/integrations/supabase/client";
import { fetchProfile, profileQueryKey, useAuthUser } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "ملفي الشخصي — MD" },
      { name: "description", content: "ملفك الشخصي في MD: اسمك واسم المستخدم حقك." },
      { property: "og:title", content: "ملفي الشخصي — MD" },
      { property: "og:description", content: "ملفك الشخصي في MD: اسمك واسم المستخدم حقك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const user = useAuthUser();
  const owners = useOwnerIds();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: profile, isLoading } = useQuery({
    queryKey: profileQueryKey(user?.id ?? "none"),
    queryFn: () => fetchProfile(user!.id),
    enabled: !!user,
  });
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (profile) setName(profile.display_name);
  }, [profile]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setSaving(true);
    setMsg(null);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: name.trim() })
      .eq("id", user.id);
    setSaving(false);
    setMsg(error ? "ما قدرنا نحفظ، جرّب مرة ثانية" : "تم الحفظ ✓");
    if (!error) void queryClient.invalidateQueries({ queryKey: profileQueryKey(user.id) });
  };

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  };

  const joined = profile
    ? new Date(profile.created_at).toLocaleDateString("ar", { year: "numeric", month: "long", day: "numeric" })
    : "";

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="bg-glow pointer-events-none absolute inset-0" />
      <div className="relative mx-auto flex max-w-md flex-col px-5 pt-16 pb-16">
        <Link to="/" className="self-start text-sm text-muted-foreground hover:text-foreground">
          → رجوع للرئيسية
        </Link>

        <div className="animate-rise mt-6 rounded-3xl border bg-card p-6 text-center shadow-[var(--shadow-glow)]">
          {isLoading || !profile ? (
            <p className="py-10 text-muted-foreground">لحظة...</p>
          ) : (
            <>
              <div className="mx-auto flex size-24 items-center justify-center rounded-full border-4 border-primary bg-primary/15 font-display text-4xl font-bold">
                {profile.display_name.charAt(0)}
              </div>
              <h1 className="mt-4 flex flex-wrap items-center justify-center gap-2 font-display text-3xl font-bold">
                {profile.display_name}
                {owners.has(profile.id) && <OwnerTag className="text-sm" />}
              </h1>
              <p dir="ltr" className="mt-1 text-muted-foreground">@{profile.username}</p>
              <p className="mt-3 text-sm text-muted-foreground">عضو من {joined}</p>

              <form onSubmit={save} className="mt-8 flex flex-col gap-2 text-start">
                <label className="text-sm" htmlFor="display-name">غيّر اسمك</label>
                <div className="flex gap-2">
                  <input
                    id="display-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={40}
                    className="min-w-0 flex-1 rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
                  />
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                  >
                    حفظ
                  </button>
                </div>
                {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
              </form>

              <button
                onClick={signOut}
                className="mt-8 w-full rounded-full border border-destructive/60 py-2.5 text-sm font-semibold text-destructive transition hover:bg-destructive/10"
              >
                تسجيل خروج
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
