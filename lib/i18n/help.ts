import { CLINICAL } from "@/config/clinical";
import { COUNTRY_ORDER, EMERGENCY_LINES, type EmergencyCountry, type EmergencyLine } from "@/config/emergency";
import type { Lang } from "@/lib/i18n/config";

/**
 * Copy for "Need help now" (header button, panel, /help) and the footer emergency banner.
 * Clarity, not alarm. Numbers come from config/emergency.ts. Interface Arabic is light Gulf register, gender-neutral.
 */
export type HelpCopy = {
  button: string;
  title: string;
  close: string;
  countries: Record<EmergencyCountry, string>;
  regions: Record<NonNullable<EmergencyLine["region"]>, string>;
  lines: Record<EmergencyLine["labelKey"], string>;
  /** Short service name in the footer banner, for lines without an alias. */
  bannerService: Record<EmergencyLine["labelKey"], string>;
  /** Shown for a "24/7" line. */
  allDay: string;
  limit: string;
  /** Footer banner, before and after the call links. */
  bannerLead: string;
  bannerLimit: string;
  seoTitle: string;
  seoDescription: string;
  backHome: string;
};

const en: HelpCopy = {
  button: "Need help now",
  title: "Need help now?",
  close: "Close",
  countries: { AE: "UAE", TN: "Tunisia" },
  regions: { "abu-dhabi": "Abu Dhabi" },
  lines: {
    ambulance: "Ambulance",
    sakina: "SAKINA, psychological support",
    hope: "HOPE, national psychological support line",
    samu: "SAMU, emergency medical service",
  },
  bannerService: { ambulance: "Ambulance", sakina: "SAKINA", hope: "HOPE", samu: "SAMU" },
  allDay: "24/7",
  limit: "SynQ cannot respond to emergencies. If you can, tell someone near you.",
  bannerLead: "In danger right now?",
  bannerLimit: "SynQ cannot respond to emergencies.",
  seoTitle: "Need help now",
  seoDescription: "Emergency and psychological support numbers in the UAE and Tunisia. SynQ cannot respond to emergencies.",
  backHome: "Back to home",
};

const ar: HelpCopy = {
  button: "تحتاج مساعدة الآن",
  title: "تحتاج مساعدة الآن؟",
  close: "إغلاق",
  countries: { AE: "الإمارات", TN: "تونس" },
  regions: { "abu-dhabi": "أبوظبي" },
  lines: {
    ambulance: "الإسعاف",
    sakina: "SAKINA (سكينة)، للدعم النفسي",
    hope: "HOPE، الخط الوطني للدعم النفسي",
    samu: "SAMU، الإسعاف الطبي",
  },
  bannerService: { ambulance: "الإسعاف", sakina: "SAKINA", hope: "HOPE", samu: "SAMU" },
  allDay: "على مدار الساعة",
  limit: "لا تستطيع SynQ الاستجابة لحالات الطوارئ. إن أمكن، أخبر شخصاً قريباً منك.",
  bannerLead: "في خطر الآن؟",
  bannerLimit: "لا تستطيع SynQ الاستجابة لحالات الطوارئ.",
  seoTitle: "تحتاج مساعدة الآن",
  seoDescription: "أرقام الطوارئ والدعم النفسي في الإمارات وتونس. لا تستطيع SynQ الاستجابة لحالات الطوارئ.",
  backHome: "العودة إلى الرئيسية",
};

export const helpCopy: Record<Lang, HelpCopy> = { en, ar };

/** Optional FAQ clauses: rendered only once config/clinical.ts holds a confirmed value. */
const CLINICAL_CLAUSES = {
  en: { sla: ", who must respond within {hours} hours", cover: " If they don't, a covering clinician is alerted." },
  ar: { sla: "، وعليه أن يستجيب خلال {hours} ساعة", cover: " وإن لم يستجب، يُنبَّه مختص مناوب." },
} as const;

/**
 * Fills a support answer's `{numbers}`, `{sla}` and `{cover}` from config/emergency.ts and config/clinical.ts.
 * A clinical promise that is not confirmed (null) is left out, never guessed.
 */
export function fillHelpAnswer(text: string, language: Lang): string {
  const copy = helpCopy[language];
  const or = language === "ar" ? " أو " : " or ";
  const numbers = COUNTRY_ORDER[language]
    .flatMap((country) => EMERGENCY_LINES.filter((line) => line.country === country && line.inBanner))
    .map((line) => `${line.display} (${line.region ? copy.regions[line.region] : copy.countries[line.country]}, ${copy.bannerService[line.labelKey]})`);
  const list = numbers.length > 1 ? `${numbers.slice(0, -1).join(", ")}${or}${numbers[numbers.length - 1]}` : numbers.join("");
  const clauses = CLINICAL_CLAUSES[language];
  return text
    .replace("{numbers}", list)
    .replace("{sla}", CLINICAL.alertResponseSlaHours === null ? "" : clauses.sla.replace("{hours}", String(CLINICAL.alertResponseSlaHours)))
    .replace("{cover}", CLINICAL.coveringClinicianEnabled ? clauses.cover : "");
}
