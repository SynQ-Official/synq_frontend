import type { Lang } from "@/lib/i18n/config";

/**
 * Copy for the home page's story, in the order a first-time visitor needs it:
 *
 * Each fact is said once. The hero says what to do, `what` says what SynQ is (you · SynQ · your clinician), and the
 * professional's role is left to `healthcare.ts`, so no section repeats another.
 * - `what`: what SynQ is, as one statement and one picture.
 * - `audience`: who it is for: people living with ADHD, bipolar disorder or psychosis, and the professionals around them.
 * - `agents`: what Mira does (once) and what Lumina does (every day), three lines each.
 * How professionals are involved lives in `healthcare.ts`. Each block only says what the visitor needs to understand the
 * product; the detail lives on /mira, /lumina, /tracks, /trust and /support, and each block links there.
 * `ar` is typed against the same shape as `en`, so a missing key fails the build.
 */

type Pair = readonly [title: string, line: string];

export type HomeStoryCopy = {
  what: {
    rail: string;
    eyebrow: string;
    titleA: string;
    titleB: string;
    /** Read word by word as the reader scrolls. */
    statement: string;
    /** The few words of the statement that carry it, highlighted in gold. */
    highlight: readonly string[];
    nodes: readonly { label: string; title: string; points: readonly string[] }[];
    consent: string;
  };
  audience: {
    rail: string;
    eyebrow: string;
    titleA: string;
    titleB: string;
    intro: string;
    people: { label: string; title: string; conditions: readonly Pair[]; link: string };
    pros: { label: string; title: string; items: readonly Pair[]; cta: string };
  };
  agents: {
    rail: string;
    eyebrow: string;
    titleA: string;
    titleB: string;
    intro: string;
    then: string;
    mira: AgentChapter;
    lumina: AgentChapter;
  };
};

type AgentChapter = { when: string; role: string; lead: string; does: readonly string[]; boundary: string; cta: string };

const en: HomeStoryCopy = {
  what: {
    rail: "What it is",
    eyebrow: "What SynQ is",
    titleA: "One platform,",
    titleB: "between you and your care.",
    statement:
      "SynQ is a mental health support platform for people living with ADHD, bipolar disorder or psychosis. Mira orients you, Lumina keeps your days between consultations, and a licensed clinician follows your care through what you choose to share.",
    highlight: ["mental", "health", "support", "platform", "Mira", "Lumina", "licensed", "clinician", "choose"],
    nodes: [
      { label: "You", title: "Everyday life", points: ["Check-in", "Journal", "Goals"] },
      { label: "SynQ", title: "Mira and Lumina", points: ["Orient", "Follow", "Flag"] },
      { label: "Your clinician", title: "Clinical care", points: ["Reviews", "Decides", "Follows up"] },
    ],
    consent: "Only with your consent",
  },
  audience: {
    rail: "Who it is for",
    eyebrow: "Who it is for",
    titleA: "Three conditions,",
    titleB: "and the people who treat them.",
    intro: "Each condition has its own daily rhythm. Choose the path that fits yours, or see how professionals and organisations are involved.",
    people: {
      label: "For people",
      title: "Living with",
      conditions: [
        ["ADHD", "Spark helps organise the day"],
        ["Bipolar disorder", "A library of approved resources"],
        ["Psychosis", "Resources and a calm daily structure"],
      ],
      link: "Explore the care tracks",
    },
    pros: {
      label: "For professionals",
      title: "And those who care for them",
      items: [
        ["Psychiatrists and psychologists", "Follow each patient between consultations."],
        ["Clinics and hospitals", "Organise follow-up across a care team."],
        ["Health authorities", "Consent-based, logged, built to be reviewed."],
      ],
      cta: "How professionals are involved",
    },
  },
  agents: {
    rail: "Mira & Lumina",
    eyebrow: "Two AI companions",
    titleA: "One to begin,",
    titleB: "one for every day.",
    intro: "Both come with your account, in English and Arabic: one conversation to begin, then a space that stays with you.",
    then: "Then, every day",
    mira: {
      when: "Once · about 2 minutes",
      role: "Orientation",
      lead: "A guided first conversation that notices what matters.",
      does: ["Five everyday situations, tap or type your answer", "A safety check the whole time", "A plain summary to bring to a clinician"],
      boundary: "An orientation, not a diagnosis.",
      cta: "Discover Mira",
    },
    lumina: {
      when: "Every day · under a minute",
      role: "Daily space",
      lead: "Your space between consultations, kept and understood.",
      does: ["A quick check-in and a private journal", "Your trends, compared with your own baseline", "A monthly report, shared only if you agree"],
      boundary: "A daily space, not an emergency service: in danger, contact local emergency services.",
      cta: "Discover Lumina",
    },
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
    nodes: [
      { label: "أنت", title: "الحياة اليومية", points: ["الفحص اليومي", "المفكرة", "الأهداف"] },
      { label: "SynQ", title: "ميرا ولومينا", points: ["توجّه", "تتابع", "تنبّه"] },
      { label: "مختصك", title: "الرعاية السريرية", points: ["يراجع", "يقرّر", "يتابع"] },
    ],
    consent: "بموافقتك فقط",
  },
  audience: {
    rail: "لمن هي",
    eyebrow: "لمن هي",
    titleA: "ثلاث حالات،",
    titleB: "ومن يعتنون بأصحابها.",
    intro: "لكل حالة إيقاعها اليومي. اختر المسار الذي يناسبك، أو اطّلع على كيفية مشاركة المختصين والمؤسسات.",
    people: {
      label: "للأشخاص",
      title: "من يعيشون مع",
      conditions: [
        ["فرط الحركة وتشتت الانتباه", "سبارك ينظّم يومك"],
        ["الاضطراب ثنائي القطب", "مكتبة موارد معتمدة"],
        ["الذهان", "موارد وبنية يومية هادئة"],
      ],
      link: "استكشف مسارات الرعاية",
    },
    pros: {
      label: "للمختصين",
      title: "ومن يعتنون بهم",
      items: [
        ["الأطباء النفسيون والأخصائيون النفسيون", "متابعة كل مريض بين الاستشارات."],
        ["العيادات والمستشفيات", "تنظيم المتابعة ضمن فريق رعاية."],
        ["الجهات الصحية", "قائمة على الموافقة، مسجَّلة، ومصمَّمة لتُراجَع."],
      ],
      cta: "كيف يشارك المختصون",
    },
  },
  agents: {
    rail: "ميرا ولومينا",
    eyebrow: "رفيقان بالذكاء الاصطناعي",
    titleA: "واحدة للبداية،",
    titleB: "وأخرى لكل يوم.",
    intro: "كلتاهما ضمن حسابك، بالعربية والإنجليزية: محادثة للبداية، ثم مساحة تبقى معك.",
    then: "ثم، كل يوم",
    mira: {
      when: "مرة واحدة · نحو دقيقتين",
      role: "التوجيه",
      lead: "محادثة أولى موجَّهة تلتقط ما يهم.",
      does: ["خمسة مواقف يومية، اختر أو اكتب إجابتك", "فحص أمان طوال الوقت", "ملخص واضح تحمله إلى مختص"],
      boundary: "توجيه، وليس تشخيصاً.",
      cta: "اكتشف ميرا",
    },
    lumina: {
      when: "كل يوم · أقل من دقيقة",
      role: "المساحة اليومية",
      lead: "مساحتك بين الاستشارات، محفوظة ومفهومة.",
      does: ["فحص يومي سريع ومفكرة خاصة", "اتجاهاتك مقارنةً بخطّك المرجعي", "تقرير شهري لا يُشارَك إلا بموافقتك"],
      boundary: "مساحة يومية، وليست خدمة طوارئ: عند الخطر تواصل مع خدمات الطوارئ المحلية.",
      cta: "اكتشف لومينا",
    },
  },
};

export const homeStoryCopy: Record<Lang, HomeStoryCopy> = { en, ar };
