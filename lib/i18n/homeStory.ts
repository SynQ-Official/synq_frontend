import type { Lang } from "@/lib/i18n/config";

/**
 * Copy for the home page's "What SynQ is" section: one statement, then short films for each audience.
 * How professionals are involved lives in `healthcare.ts`; the detail lives on /mira, /lumina, /tracks, /trust and /support.
 * `ar` is typed against the same shape as `en`, so a missing key fails the build.
 */

type FilmCopy = { title: string; line: string };

export type HomeStoryCopy = {
  what: {
    rail: string;
    eyebrow: string;
    titleA: string;
    titleB: string;
    statement: string;
    /** The few words of the statement that carry it, highlighted in gold. */
    highlight: readonly string[];
    /** Three figures under the statement: [number, what it counts]. */
    facts: readonly (readonly [value: string, label: string])[];
    /** Accessible name of the film switcher. */
    filmsLabel: string;
    /** One chapter per film, in the order of `FILMS` in WhatSection: patient, parent, clinician. */
    films: readonly [patient: FilmCopy, parent: FilmCopy, clinician: FilmCopy];
  };
};

const en: HomeStoryCopy = {
  what: {
    rail: "What it is",
    eyebrow: "What SynQ is",
    titleA: "One platform,",
    titleB: "between you and your care.",
    statement:
      "SynQ is a mental health support platform for people living with ADHD, bipolar disorder or psychosis. Mira orients you, Lumina keeps your days between consultations, and a licensed clinician follows your care through what you choose to share.",
    highlight: ["mental", "health", "support", "platform", "Mira", "Lumina", "licensed", "clinician", "choose"],
    facts: [
      ["3", "conditions followed"],
      ["2", "AI companions"],
      ["1", "licensed clinician who decides"],
    ],
    filmsLabel: "SynQ films",
    films: [
      { title: "For patients", line: "A first conversation with Mira, then a daily space with Lumina." },
      { title: "For parents", line: "A calmer home, shaped around your child." },
      { title: "For clinicians", line: "Reports to review, and every decision stays yours." },
    ],
  },
};

const ar: HomeStoryCopy = {
  what: {
    rail: "ما هي",
    eyebrow: "ما هي SynQ",
    titleA: "منصة واحدة،",
    titleB: "بينك وبين رعايتك.",
    statement:
      "SynQ منصة دعم للصحة النفسية لمن يعيشون مع اضطراب فرط الحركة وتشتت الانتباه أو الاضطراب ثنائي القطب أو الذهان. ميرا توجّهك، ولومينا تحفظ أيامك بين الاستشارات، ومختص مرخَّص يتابع رعايتك من خلال ما تختار مشاركته.",
    highlight: ["دعم", "للصحة", "النفسية", "ميرا", "ولومينا", "مختص", "مرخَّص", "تختار"],
    facts: [
      ["3", "حالات نتابعها"],
      ["2", "رفيقان بالذكاء الاصطناعي"],
      ["1", "مختص مرخَّص يقرّر"],
    ],
    filmsLabel: "أفلام SynQ",
    films: [
      { title: "للمرضى", line: "محادثة أولى مع ميرا، ثم مساحة يومية مع لومينا." },
      { title: "للأهل", line: "بيت أهدأ، يُصمَّم حول طفلك." },
      { title: "للمختصين", line: "تقارير تراجعها، وكل قرار يبقى لك." },
    ],
  },
};

export const homeStoryCopy: Record<Lang, HomeStoryCopy> = { en, ar };
