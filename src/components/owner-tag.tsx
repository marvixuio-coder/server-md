import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { OWNER_TAG_LABEL } from "@/lib/owner-tag-label";

export const ownerIdsQueryKey = ["owner-ids"] as const;

/** Set of account ids that have the owner role (public, so the tag shows for everyone). */
export function useOwnerIds() {
  const { data } = useQuery({
    queryKey: ownerIdsQueryKey,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("owner_ids");
      if (error) throw error;
      return new Set((data ?? []) as string[]);
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
  return data ?? new Set<string>();
}

export function OwnerTag({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-0.5 rounded-full bg-owner px-2 py-0.5 align-middle text-[11px] leading-none font-bold text-owner-foreground ${className}`}
    >
      👑 {OWNER_TAG_LABEL}
    </span>
  );
}
