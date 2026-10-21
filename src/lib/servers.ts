// قائمة سيرفرات ديسكورد — عدّل الأسماء والروابط هنا
export type DiscordServer = {
  name: string;
  description: string;
  invite: string;
  emoji: string;
  tag: string;
};

export const profile = {
  name: "روابطي",
  bio: "كل سيرفراتي على ديسكورد في مكان واحد — اختر وادخل مباشرة",
};

export const servers: DiscordServer[] = [
  {
    name: "السيرفر الرئيسي",
    description: "المجتمع العام، سوالف ونقاشات وفعاليات أسبوعية",
    invite: "https://discord.gg/your-main-invite",
    emoji: "🏠",
    tag: "عام",
  },
  {
    name: "سيرفر القيمنق",
    description: "لعب جماعي، بطولات، وتيمات لكل الألعاب",
    invite: "https://discord.gg/your-gaming-invite",
    emoji: "🎮",
    tag: "ألعاب",
  },
  {
    name: "سيرفر البرمجة",
    description: "مساعدة، مشاريع، ومشاركة أكواد مع المبرمجين",
    invite: "https://discord.gg/your-dev-invite",
    emoji: "💻",
    tag: "تقنية",
  },
  {
    name: "سيرفر التصميم",
    description: "شارك أعمالك واحصل على آراء من المصممين",
    invite: "https://discord.gg/your-design-invite",
    emoji: "🎨",
    tag: "إبداع",
  },
];
