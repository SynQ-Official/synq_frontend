import type { Lang } from "@/lib/i18n/config";

/**
 * Copy for the home page's section for clinicians and health authorities: who decides, how patient information is
 * governed, and what happens with a serious case, one line each. The full trust pillars live on /trust.
 * `ar` is typed against the same shape as `en`. Every claim describes behaviour that exists in the product; AI guides
 * and flags, a licensed professional decides.
 */

type Pair = readonly [title: string, line: string];

export type HealthcareCopy = {
  /** Short label for the section rail. */
  rail: string;
  eyebrow: string;
  titleA: string;
  titleB: string;
  intro: string;
  /** In charge, governed, escalated: in the order of `ICONS` in HealthcareSection. */
  pillars: readonly [Pair, Pair, Pair];
  link: string;
};

const en: HealthcareCopy = {
  rail: "For clinicians",
  eyebrow: "For clinicians and health authorities",
  titleA: "AI guides and flags.",
  titleB: "The professional decides.",
  intro: "Everything SynQ produces is built to be reviewed.",
  pillars: [
    ["Clinicians stay in charge", "Weekly and monthly reports, each reviewed and acknowledged. Every diagnostic and treatment decision stays with the professional."],
    ["Information under consent", "Patients choose what is shared, by category. Every access by clinicians and administrators is logged."],
    ["Serious cases reach a person", "Safety checks run throughout. An urgent signal alerts the clinician with a response deadline, then escalates if unanswered."],
  ],
  link: "Read how we protect patient information",
};

const ar: HealthcareCopy = {
  rail: "للمختصين",
  eyebrow: "للمختصين والجهات الصحية",
  titleA: "الذكاء الاصطناعي يوجّه وينبّه.",
  titleB: "والمختص هو من يقرّر.",
  intro: "كل ما تنتجه SynQ مصمَّم ليُراجَع.",
  pillars: [
    ["المختص هو المسؤول", "تقارير أسبوعية وشهرية يراجعها المختص ويؤكد استلامها. وكل قرار تشخيصي أو علاجي يبقى له."],
    ["معلومات بموافقة المريض", "يختار المريض ما يُشارَك، حسب الفئة. ويُسجَّل كل وصول من المختصين والمسؤولين."],
    ["الحالة الخطيرة تصل إلى إنسان", "فحوص الأمان تعمل طوال الوقت. الإشارة العاجلة تنبّه المختص بمهلة للاستجابة، ثم تُصعَّد إن لم يُجَب عنها."],
  ],
  link: "اقرأ كيف نحمي معلومات المرضى",
};

export const healthcareCopy: Record<Lang, HealthcareCopy> = { en, ar };
