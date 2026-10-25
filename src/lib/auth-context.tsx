import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";

// undefined = still checking, null = signed out
const AuthContext = createContext<User | null | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      void router.invalidate();
      if (event !== "SIGNED_OUT") void queryClient.invalidateQueries();
    });
    return () => data.subscription.unsubscribe();
  }, [router, queryClient]);

  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
}

export function useAuthUser() {
  return useContext(AuthContext);
}

export function profileQueryKey(userId: string) {
  return ["profile", userId] as const;
}

export async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id,username,display_name,created_at,score,points")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}
