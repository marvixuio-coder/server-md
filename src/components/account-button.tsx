import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { fetchProfile, profileQueryKey, useAuthUser } from "@/lib/auth-context";

export function AccountButton() {
  const user = useAuthUser();
  const { data: profile } = useQuery({
    queryKey: profileQueryKey(user?.id ?? "none"),
    queryFn: () => fetchProfile(user!.id),
    enabled: !!user,
  });

  if (user === undefined) {
    return <div className="h-11 w-28 animate-pulse rounded-full border bg-card" />;
  }

  if (!user) {
    return (
      <Link
        to="/auth"
        className="flex h-11 items-center gap-2 rounded-full border-2 border-primary bg-card px-4 text-sm font-semibold shadow-[var(--shadow-glow)] transition hover:scale-105"
      >
        <span>👤</span>
        دخول / حساب جديد
      </Link>
    );
  }

  const name = profile?.display_name ?? "حسابي";
  return (
    <Link
      to="/profile"
      aria-label="ملفي الشخصي"
      className="flex h-11 items-center gap-2 rounded-full border-2 border-primary bg-card ps-1 pe-4 text-sm font-semibold shadow-[var(--shadow-glow)] transition hover:scale-105"
    >
      <span className="flex size-8 items-center justify-center rounded-full bg-primary font-display text-base text-primary-foreground">
        {name.charAt(0)}
      </span>
      <span className="max-w-28 truncate">{name}</span>
    </Link>
  );
}
