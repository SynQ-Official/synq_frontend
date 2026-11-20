import type { Lang } from "@/lib/i18n/config";
import { trustCopy } from "@/lib/i18n/trust";

/**
 * Copy for /terms, the legal part of /privacy, the legal links and the 404 page.
 *
 * Legal text is never written here. Whatever the trust copy already says is reused by reference (so it can never drift from
 * it), and every section without an approved text is a `todo`: a visible block telling the legal advisor what is
 * missing. Titles and the short `todo` descriptions are interface labels, not legal wording.
 */

export type LegalSection = {
  id: string;
  title: string;
  /** Statements reused verbatim from lib/i18n/trust.ts. */
  points: readonly string[];
  /** What the legal advisor must provide. Present = the section has no approved text yet. */
  todo?: string;
  /** Show the contact details block (email, phone, address, support link). */
  contact?: boolean;
};

export type LegalPageCopy = {
  seoTitle: string;
  seoDescription: string;
  eyebrow: string;
  title: string;
  /** One line under the title, reused from the trust copy. */
  intro: string;
  sections: readonly LegalSection[];
};

type LegalUi = {
  todoLabel: string;
  privacy: string;
  terms: string;
  privacyPolicy: string;
  legalNav: string;
  contactEmail: string;
  /** `{terms}` and `{privacy}` are replaced by links. */
  agree: string;
  agreeError: string;
  /** `{privacy}` is replaced by a link. */
  subscribeConsent: string;
  /** `{number}` is replaced by EMERGENCY.number. */
  emergency: string;
  contactMissing: string;
  notFound: { seoTitle: string; seoDescription: string; title: string; body: string; home: string; support: string };
};

const sectionOf = (lang: Lang, id: string) => trustCopy[lang].sections.find((section) => section.id === id)!;

/**
 * The parts of the privacy policy only the legal advisor can write, shown on /privacy as visible blocks so nothing is
 * mistaken for final wording. Everything already approved lives in the trust copy.
 */
export const privacyLegalDetails: Record<Lang, readonly { id: string; title: string; todo: string }[]> = {
  en: [
    { id: "controller", title: "Data controller", todo: "Name, registered address and contact details of the data controller." },
    { id: "legal-basis", title: "Legal basis", todo: "Legal basis for each purpose of processing." },
    { id: "hosting", title: "Hosting and countries", todo: "Where the data is hosted and in which countries it is processed." },
    { id: "retention", title: "Retention", todo: "Retention period for each category of data." },
    { id: "rights", title: "Your rights", todo: "Formal wording of the rights of access, rectification and deletion, and how to exercise them." },
    { id: "updated", title: "Last updated", todo: "Date of the last update." },
  ],
  ar: [
    { id: "controller", title: "المسؤول عن معالجة البيانات", todo: "اسم المسؤول عن معالجة البيانات وعنوانه المسجّل وبيانات التواصل معه." },
    { id: "legal-basis", title: "الأساس القانوني", todo: "الأساس القانوني لكل غرض من أغراض المعالجة." },
    { id: "hosting", title: "الاستضافة والدول", todo: "مكان استضافة البيانات والدول التي تُعالَج فيها." },
    { id: "retention", title: "مدة الاحتفاظ", todo: "مدة الاحتفاظ بكل فئة من البيانات." },
    { id: "rights", title: "حقوقك", todo: "الصياغة الرسمية لحقوق الاطلاع والتصحيح والحذف وكيفية ممارستها." },
    { id: "updated", title: "آخر تحديث", todo: "تاريخ آخر تحديث." },
  ],
};

function termsCopy(lang: Lang): LegalPageCopy {
  const trust = trustCopy[lang];
  const terms = sectionOf(lang, "terms");
  const contact = sectionOf(lang, "contact");

  if (lang === "ar") {
    return {
      seoTitle: "شروط الاستخدام وأحكام الخدمة",
      seoDescription: "شروط استخدام SynQ: ما هي الخدمة وما ليست، وحسابك، والمسؤوليات، وسبل التواصل معنا.",
      eyebrow: "قانوني",
      title: terms.title,
      intro: terms.summary,
      sections: [
        { id: "purpose", title: "الغرض", points: [], todo: "الغرض من الخدمة ومن يحق له استخدامها." },
        { id: "scope", title: "ليست خدمة طوارئ ولا تشخيص", points: [terms.points[0], trust.contact.urgent] },
        { id: "account", title: "حسابك", points: [terms.points[1]] },
        { id: "responsibilities", title: "المسؤوليات", points: [terms.points[2]], todo: "حدود مسؤولية SynQ." },
        { id: "ip", title: "الملكية الفكرية", points: [], todo: "أحكام الملكية الفكرية." },
        { id: "law", title: "القانون الواجب التطبيق", points: [], todo: "القانون الواجب التطبيق والمحاكم المختصة." },
        { id: "contact", title: contact.title, points: [], contact: true },
      ],
    };
  }
  return {
    seoTitle: "Terms of use and service conditions",
    seoDescription: "SynQ terms of use: what the service is and is not (not a diagnosis or an emergency service), your account, responsibilities and how to reach us.",
    eyebrow: "Legal",
    title: terms.title,
    intro: terms.summary,
    sections: [
      { id: "purpose", title: "Purpose", points: [], todo: "Purpose of the service and who may use it." },
      { id: "scope", title: "Not an emergency or diagnostic service", points: [terms.points[0], trust.contact.urgent] },
      { id: "account", title: "Your account", points: [terms.points[1]] },
      { id: "responsibilities", title: "Responsibilities", points: [terms.points[2]], todo: "Limits of SynQ's responsibility." },
      { id: "ip", title: "Intellectual property", points: [], todo: "Intellectual property terms." },
      { id: "law", title: "Governing law", points: [], todo: "Governing law and competent courts." },
      { id: "contact", title: contact.title, points: [], contact: true },
    ],
  };
}

export const legalCopy: Record<"terms", Record<Lang, LegalPageCopy>> = {
  terms: { en: termsCopy("en"), ar: termsCopy("ar") },
};

export const legalUi: Record<Lang, LegalUi> = {
  en: {
    todoLabel: "TODO — text to be provided by the legal advisor",
    privacy: "Privacy",
    terms: "Terms",
    privacyPolicy: "Privacy Policy",
    legalNav: "Legal",
    contactEmail: "Email",
    agree: "I agree to the {terms} and {privacy}.",
    agreeError: "Please accept the Terms and Privacy Policy to create your account.",
    subscribeConsent: "By subscribing, you agree to our {privacy}.",
    emergency: "In danger? Call {number} (Tunisia)",
    contactMissing: "Contact email for privacy requests.",
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
    todoLabel: "TODO — النص يقدّمه المستشار القانوني",
    privacy: "الخصوصية",
    terms: "الشروط",
    privacyPolicy: "سياسة الخصوصية",
    legalNav: "قانوني",
    contactEmail: "البريد الإلكتروني",
    agree: "أوافق على {terms} و{privacy}.",
    agreeError: "يرجى الموافقة على الشروط وسياسة الخصوصية لإنشاء حسابك.",
    subscribeConsent: "بالاشتراك فإنك توافق على {privacy}.",
    emergency: "في خطر؟ اتصل بالرقم {number} (تونس)",
    contactMissing: "بريد التواصل لطلبات الخصوصية.",
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
