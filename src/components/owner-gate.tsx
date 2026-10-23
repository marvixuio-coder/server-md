import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";

import { unlockOwner } from "@/lib/owner.functions";

export function OwnerPasswordBox({ onUnlocked }: { onUnlocked: () => void }) {
  const unlock = useServerFn(unlockOwner);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setBusy(true);
    setError(false);
    try {
      const res = await unlock({ data: { password } });
      if (res.ok) onUnlocked();
      else setError(true);
    } catch {
      setError(true);
    }
    setBusy(false);
  };

  return (
    <form onSubmit={submit} className="flex w-full flex-col items-center gap-4">
      <div className="text-4xl">🔒</div>
      <label
        htmlFor="owner-password"
        dir="ltr"
        className="font-display text-2xl font-bold tracking-wide uppercase"
      >
        owners only
      </label>
      <input
        id="owner-password"
        dir="ltr"
        type="password"
        autoFocus
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        className="w-full rounded-xl border bg-background px-4 py-3 text-center text-sm outline-none focus:border-primary"
      />
      {error && <p className="text-sm text-destructive">كلمة السر غلط</p>}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-full bg-primary py-3 font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
      >
        {busy ? "لحظة..." : "ادخل"}
      </button>
    </form>
  );
}
