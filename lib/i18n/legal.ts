import type { LegalConfig } from "@/config/legal";
import type { Lang } from "@/lib/i18n/config";
import { trustCopy } from "@/lib/i18n/trust";

/**
 * Copy for /privacy ("Privacy Policy & Terms of Use"), the legal links, the consent line and the 404 page.
 *
 * Legal text is never written here. Each section reuses statements already published in lib/i18n/trust.ts (so the two can
 * never drift) and names the facts it needs from config/legal.ts. A fact that is `null`, or a section with no approved
 * text, renders <PendingLegalField />: "To be confirmed before launch". Titles are interface labels, not legal wording.
 */

/** Facts a section renders from config/legal.ts, in order. */
export type LegalFact = "controllerName" | "controllerAddress" | "privacyEmail" | "dpoContact" | "hostingCountry" | "hostingProvider" | "aiSubprocessors" | "governingLaw";

export type LegalSection = {
  id: string;
  title: string;
  /** Statements reused verbatim from lib/i18n/trust.ts. */
  points: readonly string[];
  facts?: readonly LegalFact[];
  /** Retention periods from config/legal.ts. */
  retention?: boolean;
  /** "Are journals used to train models?": shown only once config/legal.ts answers it. */
  training?: boolean;
  /** Emergency numbers from config/emergency.ts. */
  emergency?: boolean;
  contact?: boolean;
  /** A part with no approved text yet: shown as one pending line with this label. */
  pending?: string;
};

export type LegalDocument = { id: "privacy" | "terms"; title: string; sections: readonly LegalSection[] };

type LegalUi = {
  /** Shown wherever a fact or a text is not confirmed yet. */
  pending: string;
  title: string;
  seoTitle: string;
  seoDescription: string;
  intro: string;
  version: string;
  lastUpdated: string;
  contents: string;
  facts: Record<LegalFact, string>;
  retention: Record<LegalConfig["retentionPeriods"][number]["category"], string>;
  training: { yes: string; no: string };
  privacy: string;
  terms: string;
  privacyPolicy: string;
  legalNav: string;
  /** `{terms}` and `{privacy}` are replaced by links. */
  agree: string;
  /** Appended to the consent line once config/legal.ts has a version: `{version}` is replaced. */
  agreeVersion: string;
  agreeError: string;
  /** `{privacy}` is replaced by a link. */
  subscribeConsent: string;
  notFound: { seoTitle: string; seoDescription: string; title: string; body: string; home: string; support: string };
};

const point = (lang: Lang, id: string, index: number) => trustCopy[lang].sections.find((section) => section.id === id)!.points[index];
const points = (lang: Lang, id: string) => trustCopy[lang].sections.find((section) => section.id === id)!.points;

function documents(lang: Lang): readonly [LegalDocument, LegalDocument] {
  const ar = lang === "ar";
  const contactTitle = trustCopy[lang].sections.find((section) => section.id === "contact")!.title;
  return [
    {
      id: "privacy",
      title: ar ? "سياسة الخصوصية" : "Privacy Policy",
      sections: [
        { id: "privacy-who", title: ar ? "من نحن" : "Who we are", points: [], facts: ["controllerName", "controllerAddress", "privacyEmail", "dpoContact"] },
        { id: "privacy-collect", title: ar ? "ما نجمعه" : "What we collect", points: [point(lang, "data-handling", 0)] },
        { id: "privacy-why", title: ar ? "لماذا نستخدمه" : "Why we use it", points: [point(lang, "data-handling", 1)] },
        { id: "privacy-who-sees", title: ar ? "من يرى ماذا" : "Who sees what", points: [...points(lang, "privacy"), point(lang, "security", 2)] },
        {
          id: "privacy-ai",
          title: ar ? "ما يفعله الذكاء الاصطناعي" : "What the AI does",
          points: [point(lang, "data-handling", 2), ...points(lang, "responsible-ai")],
          facts: ["aiSubprocessors"],
          training: true,
        },
        { id: "privacy-where", title: ar ? "أين تُحفظ البيانات" : "Where your data is stored", points: [], facts: ["hostingCountry", "hostingProvider"] },
        { id: "privacy-retention", title: ar ? "مدة الاحتفاظ" : "How long we keep it", points: [], retention: true },
        {
          id: "privacy-rights",
          title: ar ? "حقوقك" : "Your rights",
          points: [point(lang, "privacy", 2), point(lang, "data-handling", 3)],
          pending: ar ? "حقوق الاطلاع والتصحيح والحذف وسحب الموافقة والتصدير، وطريقة ممارستها" : "Rights of access, rectification, deletion, withdrawal of consent and export, and how to exercise them",
        },
        { id: "privacy-minors", title: ar ? "القاصرون وأولياء الأمور" : "Minors and guardians", points: [], pending: ar ? "شروط استخدام القاصرين ودور أولياء الأمور" : "Use by minors and the role of guardians" },
        { id: "privacy-security", title: ar ? "الأمان" : "Security", points: [point(lang, "security", 0), point(lang, "security", 1), point(lang, "security", 3)] },
        { id: "privacy-emergency", title: ar ? "SynQ ليست خدمة طوارئ" : "SynQ is not an emergency service", points: [trustCopy[lang].contact.urgent], emergency: true },
        { id: "privacy-contact", title: contactTitle, points: [], contact: true },
      ],
    },
    {
      id: "terms",
      title: ar ? "شروط الاستخدام" : "Terms of Use",
      sections: [
        { id: "terms-purpose", title: ar ? "الغرض" : "Purpose", points: [], pending: ar ? "الغرض من الخدمة ومن يحق له استخدامها" : "Purpose of the service and who may use it" },
        { id: "terms-scope", title: ar ? "لا تشخيص ولا طوارئ" : "No diagnosis, no emergency service", points: [point(lang, "terms", 0), trustCopy[lang].contact.urgent] },
        { id: "terms-account", title: ar ? "حسابك" : "Your account", points: [point(lang, "terms", 1)] },
        { id: "terms-clinical", title: ar ? "المسؤولية السريرية" : "Clinical responsibility", points: [point(lang, "terms", 2)] },
        { id: "terms-use", title: ar ? "الاستخدام المقبول" : "Acceptable use", points: [], pending: ar ? "قواعد الاستخدام المقبول" : "Acceptable use rules" },
        { id: "terms-liability", title: ar ? "حدود المسؤولية" : "Limitation of liability", points: [], pending: ar ? "حدود مسؤولية SynQ" : "Limits of SynQ's liability" },
        { id: "terms-ip", title: ar ? "الملكية الفكرية" : "Intellectual property", points: [], pending: ar ? "أحكام الملكية الفكرية" : "Intellectual property terms" },
        { id: "terms-law", title: ar ? "القانون الواجب التطبيق" : "Governing law", points: [], facts: ["governingLaw"] },
        { id: "terms-contact", title: contactTitle, points: [], contact: true },
      ],
    },
  ];
}

export const legalDocuments: Record<Lang, readonly [LegalDocument, LegalDocument]> = { en: documents("en"), ar: documents("ar") };

export const legalUi: Record<Lang, LegalUi> = {
  en: {
    pending: "To be confirmed before launch",
    title: "Privacy Policy & Terms of Use",
    seoTitle: "Privacy Policy & Terms of Use",
    seoDescription: "How SynQ handles your information, who sees what, and the terms of use. SynQ is not a diagnosis or an emergency service.",
    intro: "Two documents on one page: how SynQ handles your information, then the terms for using it.",
    version: "Version",
    lastUpdated: "Last updated",
    contents: "On this page",
    facts: {
      controllerName: "Data controller",
      controllerAddress: "Registered address",
      privacyEmail: "Privacy contact",
      dpoContact: "Data protection officer",
      hostingCountry: "Country where data is stored",
      hostingProvider: "Hosting provider",
      aiSubprocessors: "AI service providers",
      governingLaw: "Governing law",
    },
    retention: {
      account: "Account details",
      checkins: "Daily check-ins",
      journal: "Journal entries",
      orientation: "Orientation answers",
      clinicianNotes: "Clinician notes",
      accessLogs: "Access logs",
    },
    training: { yes: "Journal entries are used to train AI models.", no: "Journal entries are not used to train AI models." },
    privacy: "Privacy",
    terms: "Terms",
    privacyPolicy: "Privacy Policy",
    legalNav: "Legal",
    agree: "I agree to the {terms} and {privacy}.",
    agreeVersion: " (version {version})",
    agreeError: "Please accept the Terms and Privacy Policy to create your account.",
    subscribeConsent: "By subscribing, you agree to our {privacy}.",
    notFound: {
      seoTitle: "Page not found",
      seoDescription: "This page does not exist or has moved. Go back to the SynQ home page or contact support.",
      title: "Page not found",
      body: "The page you are looking for does not exist or has moved.",
      home: "Back to home",
      support: "Contact support",
    },
  },
  ar: {
    pending: "يُؤكَّد قبل الإطلاق",
    title: "سياسة الخصوصية وشروط الاستخدام",
    seoTitle: "سياسة الخصوصية وشروط الاستخدام",
    seoDescription: "كيف تتعامل SynQ مع معلوماتك، ومن يرى ماذا، وشروط الاستخدام. SynQ ليست تشخيصاً ولا خدمة طوارئ.",
    intro: "وثيقتان في صفحة واحدة: كيف تتعامل SynQ مع معلوماتك، ثم شروط استخدامها.",
    version: "الإصدار",
    lastUpdated: "آخر تحديث",
    contents: "في هذه الصفحة",
    facts: {
      controllerName: "المسؤول عن معالجة البيانات",
      controllerAddress: "العنوان المسجّل",
      privacyEmail: "التواصل بشأن الخصوصية",
      dpoContact: "مسؤول حماية البيانات",
      hostingCountry: "بلد حفظ البيانات",
      hostingProvider: "مزوّد الاستضافة",
      aiSubprocessors: "مزوّدو خدمات الذكاء الاصطناعي",
      governingLaw: "القانون الواجب التطبيق",
    },
    retention: {
      account: "بيانات الحساب",
      checkins: "التسجيلات اليومية",
      journal: "مدخلات المفكرة",
      orientation: "إجابات التوجيه",
      clinicianNotes: "ملاحظات المختص",
      accessLogs: "سجلات الاطلاع",
    },
    training: { yes: "تُستخدم مدخلات المفكرة لتدريب نماذج الذكاء الاصطناعي.", no: "لا تُستخدم مدخلات المفكرة لتدريب نماذج الذكاء الاصطناعي." },
    privacy: "الخصوصية",
    terms: "الشروط",
    privacyPolicy: "سياسة الخصوصية",
    legalNav: "قانوني",
    agree: "أوافق على {terms} و{privacy}.",
    agreeVersion: " (الإصدار {version})",
    agreeError: "يرجى الموافقة على الشروط وسياسة الخصوصية لإنشاء حسابك.",
    subscribeConsent: "بالاشتراك فإنك توافق على {privacy}.",
    notFound: {
      seoTitle: "الصفحة غير موجودة",
      seoDescription: "هذه الصفحة غير موجودة أو تم نقلها. عد إلى الصفحة الرئيسية لـ SynQ أو تواصل مع الدعم.",
      title: "الصفحة غير موجودة",
      body: "الصفحة التي تبحث عنها غير موجودة أو تم نقلها.",
      home: "العودة إلى الرئيسية",
      support: "تواصل مع الدعم",
    },
  },
};
