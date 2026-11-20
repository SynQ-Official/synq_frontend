import type { Lang } from "@/lib/i18n/config";

/**
 * Copy for the home page's team section. Names stay in Latin script in both languages (proper nouns, as written by
 * the people themselves). `ar` is typed against the same shape as `en`.
 */

type Member = { name: string; role: string };

export type TeamCopy = {
  /** Short label for the section rail. */
  rail: string;
  eyebrow: string;
  titleA: string;
  titleB: string;
  intro: string;
  /** In the order of `PHOTOS` in TeamSection: Chedi, Roua. */
  members: readonly [Member, Member];
};

const en: TeamCopy = {
  rail: "Team",
  eyebrow: "The people behind SynQ",
  titleA: "Built by a small team,",
  titleB: "close to the care.",
  intro: "The founders who lead SynQ's product, technology and operations.",
  members: [
    { name: "Chedi Ouerghi", role: "CTO & Co-founder" },
    { name: "Roua Bellasoued", role: "CEO & Co-founder" },
  ],
};

const ar: TeamCopy = {
  rail: "الفريق",
  eyebrow: "الفريق وراء SynQ",
  titleA: "فريق صغير،",
  titleB: "قريب من الرعاية.",
  intro: "المؤسسون الذين يقودون منتج SynQ وتقنيتها وعملياتها.",
  members: [
    { name: "Chedi Ouerghi", role: "مدير التقنية ومؤسس مشارك" },
    { name: "Roua Bellasoued", role: "الرئيس التنفيذي ومؤسسة مشاركة" },
  ],
};

export const teamCopy: Record<Lang, TeamCopy> = { en, ar };
