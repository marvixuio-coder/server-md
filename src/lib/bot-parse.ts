// Pure helpers for the owner bot: parsing typed commands and validating custom ones.

export type ParsedCommand = { name: string; args: string[]; rest: string };

export const BOT_NAME = "🤖 بوت MD";

export const BUILTIN_COMMANDS = [
  { name: "help", usage: "/help", info: "يعرض كل الأوامر" },
  { name: "stats", usage: "/stats", info: "إحصائيات الموقع" },
  { name: "messages", usage: "/messages 10", info: "آخر رسائل شات الفعالية مع رمز كل رسالة" },
  { name: "say", usage: "/say النص", info: "ينزّل رسالة في شات الفعالية باسم البوت" },
  { name: "delmsg", usage: "/delmsg رمز", info: "يمسح رسالة من الشات برمزها" },
  { name: "clearchat", usage: "/clearchat confirm", info: "يمسح كل رسائل الشات" },
  { name: "members", usage: "/members 10", info: "آخر الحسابات وآخر دخول" },
  { name: "delmember", usage: "/delmember يوزر", info: "يمسح حساب" },
  { name: "owners", usage: "/owners", info: "قائمة الأونرز" },
  { name: "addowner", usage: "/addowner يوزر", info: "يخلي حساب أونر (يدخل اللوحة بدون كلمة سر)" },
  { name: "removeowner", usage: "/removeowner يوزر", info: "يشيل الأونر من حساب" },
  { name: "cmds", usage: "/cmds", info: "الأوامر اللي أضفتها أنت" },
  { name: "addcmd", usage: "/addcmd اسم الرد", info: "يضيف أمر جديد يرد بالنص اللي تكتبه" },
  { name: "delcmd", usage: "/delcmd اسم", info: "يمسح أمر أضفته" },
] as const;

const BUILTIN_NAMES = new Set<string>(BUILTIN_COMMANDS.map((c) => c.name));

export function isBuiltinCommand(name: string): boolean {
  return BUILTIN_NAMES.has(name);
}

/** Custom command names: 2–20 chars of a-z, 0-9 or _, and not a built-in name. */
export function isValidCustomCommandName(name: string): boolean {
  return /^[a-z0-9_]{2,20}$/.test(name) && !isBuiltinCommand(name);
}

/** "/Say hello there" -> { name: "say", args: ["hello","there"], rest: "hello there" }. A leading "/" or "!" is optional. */
export function parseCommand(raw: string): ParsedCommand | null {
  const text = raw.trim().replace(/^[/!]/, "").trim();
  if (!text) return null;
  const match = /^(\S+)\s*([\s\S]*)$/.exec(text);
  if (!match) return null;
  const name = (match[1] ?? "").toLowerCase();
  const rest = (match[2] ?? "").trim();
  return { name, rest, args: rest ? rest.split(/\s+/) : [] };
}

/** Clamp a list size argument: default when missing/invalid, never above max. */
export function listSize(arg: string | undefined, fallback = 10, max = 30): number {
  const n = Number.parseInt(arg ?? "", 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(n, max);
}
