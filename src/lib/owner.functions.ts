import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";

import { passwordMatches } from "./owner-password";

type OwnerSession = { owner?: boolean };

function sessionConfig() {
  const password = process.env["OWNER_SESSION_SECRET"];
  if (!password) throw new Error("OWNER_SESSION_SECRET is not set");
  return {
    password,
    name: "md-owner",
    maxAge: 60 * 60 * 12,
    cookie: { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" },
  };
}

async function isOwner() {
  const session = await useSession<OwnerSession>(sessionConfig());
  return session.data.owner === true;
}

export const unlockOwner = createServerFn({ method: "POST" })
  .validator((data: { password: string }) => ({ password: String(data?.password ?? "").slice(0, 200) }))
  .handler(async ({ data }) => {
    const expected = process.env["OWNER_PASSWORD"];
    if (!expected) throw new Error("OWNER_PASSWORD is not set");
    if (!(await passwordMatches(data.password, expected))) return { ok: false as const };
    const session = await useSession<OwnerSession>(sessionConfig());
    await session.update({ owner: true });
    return { ok: true as const };
  });

export const lockOwner = createServerFn({ method: "POST" }).handler(async () => {
  const session = await useSession<OwnerSession>(sessionConfig());
  await session.clear();
  return { ok: true as const };
});

export const getOwnerDashboard = createServerFn({ method: "GET" }).handler(async () => {
  if (!(await isOwner())) return { unlocked: false as const };
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [members, memberCount, messages, messageCount, authUsers] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select("id,username,display_name,created_at")
      .order("created_at", { ascending: false })
      .limit(500),
    supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
    supabaseAdmin
      .from("community_messages")
      .select("id,name,content,created_at")
      .order("created_at", { ascending: false })
      .limit(300),
    supabaseAdmin.from("community_messages").select("id", { count: "exact", head: true }),
    supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);
  if (members.error || messages.error || authUsers.error)
    console.error(members.error ?? messages.error ?? authUsers.error);

  const lastSignIn = new Map<string, string | null>();
  for (const u of authUsers.data?.users ?? []) lastSignIn.set(u.id, u.last_sign_in_at ?? null);

  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const memberRows = (members.data ?? []).map((m) => ({
    ...m,
    last_sign_in_at: lastSignIn.get(m.id) ?? null,
  }));
  const activeToday = memberRows.filter(
    (m) => m.last_sign_in_at && new Date(m.last_sign_in_at).getTime() > dayAgo,
  ).length;
  const messagesToday = (messages.data ?? []).filter(
    (m) => new Date(m.created_at).getTime() > dayAgo,
  ).length;

  return {
    unlocked: true as const,
    memberCount: memberCount.count ?? 0,
    messageCount: messageCount.count ?? 0,
    activeToday,
    messagesToday,
    members: memberRows,
    messages: messages.data ?? [],
  };
});

export const deleteCommunityMessage = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => ({ id: String(data?.id ?? "") }))
  .handler(async ({ data }) => {
    if (!(await isOwner())) return { ok: false as const };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("community_messages").delete().eq("id", data.id);
    if (error) console.error(error);
    return { ok: !error };
  });

export const deleteAllCommunityMessages = createServerFn({ method: "POST" }).handler(async () => {
  if (!(await isOwner())) return { ok: false as const };
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin
    .from("community_messages")
    .delete()
    .gte("created_at", "1970-01-01");
  if (error) console.error(error);
  return { ok: !error };
});

export const deleteMember = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => ({ id: String(data?.id ?? "") }))
  .handler(async ({ data }) => {
    if (!(await isOwner())) return { ok: false as const };
    if (!/^[0-9a-f-]{36}$/i.test(data.id)) return { ok: false as const };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Profile row is removed by ON DELETE CASCADE.
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.id);
    if (error) console.error(error);
    return { ok: !error };
  });
