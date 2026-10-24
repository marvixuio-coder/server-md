import { createServerFn } from "@tanstack/react-start";
import { getRequest, useSession } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";
import { passwordMatches } from "./owner-password";
import {
  BOT_NAME,
  BUILTIN_COMMANDS,
  isValidCustomCommandName,
  listSize,
  parseCommand,
} from "./bot-parse";

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

/** Signed-in account that has the owner role (checked as the user, through RLS-safe has_role). */
async function signedInOwner(): Promise<boolean> {
  const header = getRequest()?.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return false;
  const token = header.slice(7);
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) return false;
  const client = createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        h.set("Authorization", `Bearer ${token}`);
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
  const { data: userData, error } = await client.auth.getUser(token);
  if (error || !userData.user) return false;
  const { data: isOwnerRole } = await client.rpc("has_role", {
    _user_id: userData.user.id,
    _role: "owner",
  });
  return isOwnerRole === true;
}

async function isOwner() {
  const session = await useSession<OwnerSession>(sessionConfig());
  if (session.data.owner === true) return true;
  return signedInOwner();
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

export const checkOwnerAccess = createServerFn({ method: "POST" }).handler(async () => ({
  owner: await isOwner(),
}));

const fmt = (d: string | null | undefined) =>
  d
    ? new Date(d).toLocaleString("ar", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Riyadh",
      })
    : "—";

const shortId = (id: string) => id.replace(/-/g, "").slice(0, 6);

export const runBotCommand = createServerFn({ method: "POST" })
  .validator((data: { input: string }) => ({ input: String(data?.input ?? "").slice(0, 1200) }))
  .handler(async ({ data }): Promise<{ locked: true } | { locked: false; reply: string }> => {
    if (!(await isOwner())) return { locked: true };
    const cmd = parseCommand(data.input);
    if (!cmd) return { locked: false, reply: "اكتب أمر، مثلًا /help" };
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const say = (reply: string) => ({ locked: false as const, reply });

    const findProfile = async (raw: string | undefined) => {
      const username = (raw ?? "").replace(/^@/, "").trim().toLowerCase();
      if (!username) return null;
      const { data: p } = await db
        .from("profiles")
        .select("id,username,display_name")
        .eq("username", username)
        .maybeSingle();
      return p;
    };

    switch (cmd.name) {
      case "help": {
        const { data: custom } = await db.from("bot_commands").select("name").order("name");
        const lines = BUILTIN_COMMANDS.map((c) => `${c.usage} — ${c.info}`);
        if (custom?.length) lines.push("", "أوامرك:", ...custom.map((c) => `/${c.name}`));
        return say(lines.join("\n"));
      }

      case "stats": {
        const [members, messages, owners, cmds] = await Promise.all([
          db.from("profiles").select("id", { count: "exact", head: true }),
          db.from("community_messages").select("id", { count: "exact", head: true }),
          db.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "owner"),
          db.from("bot_commands").select("name", { count: "exact", head: true }),
        ]);
        return say(
          [
            `👤 الحسابات: ${members.count ?? 0}`,
            `💬 رسائل الشات: ${messages.count ?? 0}`,
            `👑 الأونرز: ${owners.count ?? 0}`,
            `⚙️ أوامرك: ${cmds.count ?? 0}`,
          ].join("\n"),
        );
      }

      case "messages": {
        const n = listSize(cmd.args[0]);
        const { data: rows } = await db
          .from("community_messages")
          .select("id,name,content,created_at")
          .order("created_at", { ascending: false })
          .limit(n);
        if (!rows?.length) return say("ما فيه رسائل في الشات.");
        return say(
          rows.map((m) => `#${shortId(m.id)} · ${m.name}: ${m.content}  (${fmt(m.created_at)})`).join("\n") +
            "\n\nللمسح: /delmsg الرمز",
        );
      }

      case "say": {
        if (!cmd.rest) return say("اكتب الرسالة بعد الأمر، مثلًا: /say أهلًا بالكل");
        if (cmd.rest.length > 500) return say("الرسالة طويلة، الحد 500 حرف.");
        const { error } = await db.from("community_messages").insert({ name: BOT_NAME, content: cmd.rest });
        return say(error ? "ما قدرت أنزّل الرسالة." : "✅ نزّلت الرسالة في شات الفعالية.");
      }

      case "delmsg": {
        const code = (cmd.args[0] ?? "").replace(/^#/, "").toLowerCase();
        if (code.length < 4) return say("اكتب رمز الرسالة (من /messages)، مثلًا: /delmsg a1b2c3");
        const { data: rows } = await db
          .from("community_messages")
          .select("id,name,content")
          .order("created_at", { ascending: false })
          .limit(1000);
        const matches = (rows ?? []).filter((m) => m.id.replace(/-/g, "").startsWith(code));
        if (matches.length === 0) return say("ما لقيت رسالة بهالرمز.");
        if (matches.length > 1) return say("فيه أكثر من رسالة بهالرمز، اكتب رمز أطول.");
        const target = matches[0]!;
        const { error } = await db.from("community_messages").delete().eq("id", target.id);
        return say(error ? "ما قدرت أمسحها." : `🗑️ مسحت رسالة ${target.name}: ${target.content}`);
      }

      case "clearchat": {
        if (cmd.args[0] !== "confirm" && cmd.args[0] !== "تأكيد")
          return say("هذا يمسح كل رسائل الشات. للتأكيد اكتب: /clearchat confirm");
        const { error } = await db.from("community_messages").delete().gte("created_at", "1970-01-01");
        return say(error ? "ما قدرت أمسح الشات." : "🧹 مسحت كل رسائل الشات.");
      }

      case "members": {
        const n = listSize(cmd.args[0]);
        const [{ data: rows }, users] = await Promise.all([
          db
            .from("profiles")
            .select("id,username,display_name,created_at")
            .order("created_at", { ascending: false })
            .limit(n),
          db.auth.admin.listUsers({ page: 1, perPage: 1000 }),
        ]);
        if (!rows?.length) return say("ما فيه حسابات.");
        const last = new Map((users.data?.users ?? []).map((u) => [u.id, u.last_sign_in_at]));
        return say(
          rows
            .map((m) => `@${m.username} · ${m.display_name} — سجّل ${fmt(m.created_at)} · آخر دخول ${fmt(last.get(m.id))}`)
            .join("\n"),
        );
      }

      case "delmember": {
        const p = await findProfile(cmd.args[0]);
        if (!p) return say("ما لقيت حساب بهاليوزر. مثال: /delmember ahmed");
        const { error } = await db.auth.admin.deleteUser(p.id);
        return say(error ? "ما قدرت أمسح الحساب." : `🗑️ مسحت حساب @${p.username}.`);
      }

      case "owners": {
        const { data: roles } = await db.from("user_roles").select("user_id").eq("role", "owner");
        const ids = (roles ?? []).map((r) => r.user_id);
        if (!ids.length) return say("ما فيه أونرز بحسابات لسا. الدخول بكلمة السر بس.\nأضف واحد: /addowner يوزر");
        const { data: ps } = await db.from("profiles").select("username,display_name").in("id", ids);
        return say("👑 الأونرز:\n" + (ps ?? []).map((p) => `@${p.username} · ${p.display_name}`).join("\n"));
      }

      case "addowner": {
        const p = await findProfile(cmd.args[0]);
        if (!p) return say("ما لقيت حساب بهاليوزر. لازم يكون عنده حساب في الموقع. مثال: /addowner ahmed");
        const { error } = await db
          .from("user_roles")
          .upsert({ user_id: p.id, role: "owner" }, { onConflict: "user_id,role", ignoreDuplicates: true });
        return say(error ? "ما قدرت أضيفه." : `👑 صار @${p.username} أونر. لما يسجّل دخول يقدر يفتح اللوحة بدون كلمة سر.`);
      }

      case "removeowner": {
        const p = await findProfile(cmd.args[0]);
        if (!p) return say("ما لقيت حساب بهاليوزر.");
        const { error } = await db.from("user_roles").delete().eq("user_id", p.id).eq("role", "owner");
        return say(error ? "ما قدرت أشيله." : `تم، @${p.username} ما عاد أونر.`);
      }

      case "cmds": {
        const { data: rows } = await db.from("bot_commands").select("name,reply").order("name");
        if (!rows?.length) return say("ما أضفت أوامر لسا. جرّب: /addcmd rules ممنوع السب");
        return say(rows.map((c) => `/${c.name} → ${c.reply}`).join("\n"));
      }

      case "addcmd": {
        const name = (cmd.args[0] ?? "").replace(/^[/!]/, "").toLowerCase();
        const reply = cmd.rest.slice(cmd.args[0]?.length ?? 0).trim();
        if (!isValidCustomCommandName(name))
          return say("اسم الأمر لازم يكون إنجليزي (حروف وأرقام و _ من 2 إلى 20) وما يكون اسم أمر موجود.\nمثال: /addcmd rules ممنوع السب");
        if (!reply) return say("اكتب الرد بعد اسم الأمر. مثال: /addcmd rules ممنوع السب");
        if (reply.length > 1000) return say("الرد طويل، الحد 1000 حرف.");
        const { error } = await db.from("bot_commands").upsert({ name, reply }, { onConflict: "name" });
        return say(error ? "ما قدرت أضيف الأمر." : `✅ أضفت الأمر /${name}`);
      }

      case "delcmd": {
        const name = (cmd.args[0] ?? "").replace(/^[/!]/, "").toLowerCase();
        const { data: gone } = await db.from("bot_commands").delete().eq("name", name).select("name");
        return say(gone?.length ? `🗑️ مسحت الأمر /${name}` : "ما فيه أمر بهالاسم.");
      }

      default: {
        const { data: custom } = await db.from("bot_commands").select("reply").eq("name", cmd.name).maybeSingle();
        if (custom) return say(custom.reply);
        return say(`ما أعرف الأمر /${cmd.name}. اكتب /help تشوف الأوامر.`);
      }
    }
  });
