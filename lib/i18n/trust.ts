import type { Lang } from "@/lib/i18n/config";

/**
 * Trust is part of the product, so it is written once, here, and shown in full on /privacy (the home page only links to
 * it). Every statement describes behaviour that exists in the product today (consent
 * by category, a pseudonymous patient code, access logs, two-factor for clinician and admin accounts, encrypted
 * clinician notes). Retention periods, hosting location and the full legal text are NOT claimed here: they
 * belong to SynQ's legal owner and must be added by them. `ar` is typed against the same shape as `en`.
 */

export const TRUST_IDS = ["privacy", "security", "responsible-ai", "data-handling", "legal", "terms", "contact"] as const;
export type TrustId = (typeof TRUST_IDS)[number];

export type TrustSection = {
  id: TrustId;
  title: string;
  /** One line, shown under the title. */
  summary: string;
  /** The full statements, shown on /privacy. Empty when the summary says it all (contact). */
  points: readonly string[];
};

export type TrustCopy = {
  seoTitle: string;
  seoDescription: string;
  eyebrow: string;
  titleA: string;
  titleB: string;
  intro: string;
  /** The principle every section answers to. */
  principle: string;
  readMore: string;
  sections: readonly TrustSection[];
  contact: {
    formCta: string;
    formHint: string;
    emailLabel: string;
    phoneLabel: string;
    addressLabel: string;
    urgent: string;
  };
  backHome: string;
};

const en: TrustCopy = {
  seoTitle: "Privacy policy and trust",
  seoDescription:
    "How SynQ protects patient information: privacy, security, responsible AI, data handling, what you choose to share, terms of use and how to reach us.",
  eyebrow: "Privacy policy and trust",
  titleA: "Trust is part of",
  titleB: "the product.",
  intro:
    "SynQ supports patients between consultations, and their clinician stays in charge. Because that depends on very personal information, how it is protected is described here, in plain words.",
  principle: "AI guides and flags; the professional always decides.",
  readMore: "Read more",
  sections: [
    {
      id: "privacy",
      title: "Privacy",
      summary: "You decide what your clinician sees, and you can change it at any time.",
      points: [
        "Your check-ins, journal and orientation belong to you. A clinician sees them only if you agree, category by category: mood, sleep, medication, exercises and orientation results.",
        "You choose how much of your journal is shared: nothing, only the excerpts you select, or the full text. Entries you mark private are never shared.",
        "You can change or stop sharing at any time from your settings.",
        "Before a care relationship begins, a clinician sees a pseudonymous patient code, never a real name.",
      ],
    },
    {
      id: "security",
      title: "Security",
      summary: "Protected accounts, protected access, and a record of who looked at what.",
      points: [
        "Every part of SynQ that holds personal information requires a signed-in account. Visitors only see public pages and a demonstration with fictional data.",
        "Clinician and administrator accounts are protected with two-factor authentication.",
        "Clinicians see only the patients assigned to them, and only what each patient has agreed to share.",
        "Clinician notes are stored encrypted, and access to patient records by clinicians and administrators is logged.",
      ],
    },
    {
      id: "responsible-ai",
      title: "Responsible AI",
      summary: "It never diagnoses, treats or prescribes.",
      points: [
        "Mira's orientation uses questions based on established screening tools. It surfaces signals worth a professional evaluation; it is not a diagnosis.",
        "The journal analysis names themes and emotions. It does not label a person or score them against others.",
        "Every summary and report states its evidence and its limits, and says that a licensed professional makes every diagnostic and treatment decision.",
        "When a serious signal appears, AI does not act alone: the patient sees clear guidance and emergency numbers, and the clinician they connected is alerted to follow up.",
      ],
    },
    {
      id: "data-handling",
      title: "Data handling",
      summary: "Only what is needed to provide orientation and follow-up, and nothing more.",
      points: [
        "SynQ collects what you give it: your account details, your answers to Mira, your daily check-ins and your journal entries.",
        "This information is used to provide orientation and daily follow-up, and to prepare a report for a clinician when you choose to share one.",
        "Text you write is processed by SynQ's AI services to produce the themes, signals and summaries you see.",
        "Questions about your data, including how to access or remove it, can be sent to us using the contact details below.",
      ],
    },
    {
      id: "legal",
      title: "Legal information",
      summary: "The formal details of this policy.",
      points: [],
    },
    {
      id: "terms",
      title: "Terms of use",
      summary: "What SynQ is, what it is not, and what we ask of those who use it.",
      points: [
        "SynQ is not a medical diagnosis, not a substitute for a licensed professional, and not an emergency service.",
        "Use your own account, keep your sign-in details private, and share information about yourself honestly so that it stays useful.",
        "Clinicians remain responsible for every clinical decision they make with SynQ's help.",
      ],
    },
    {
      id: "contact",
      title: "Contact",
      summary: "Patients, clinics, hospitals and health authorities can write to us about privacy, security, data handling or working together.",
      points: [],
    },
  ],
  contact: {
    formCta: "Write to us",
    formHint: "Support and institutional enquiries",
    emailLabel: "Email",
    phoneLabel: "Telephone",
    addressLabel: "Address",
    urgent: "SynQ cannot respond to emergencies. If you are in danger, contact your local emergency services now.",
  },
  backHome: "Back to home",
};

const ar: TrustCopy = {
  seoTitle: "سياسة الخصوصية والثقة",
  seoDescription: "كيف تحمي SynQ معلومات المرضى: الخصوصية والأمان والذكاء الاصطناعي المسؤول ومعالجة البيانات وشروط الاستخدام وسبل التواصل.",
  eyebrow: "سياسة الخصوصية والثقة",
  titleA: "الثقة جزء",
  titleB: "من المنتج.",
  intro:
    "تدعم SynQ المرضى بين المواعيد، ويبقى المختص هو المسؤول. ولأن ذلك يقوم على معلومات شخصية جداً، فإن طريقة حمايتها مشروحة هنا بكلمات واضحة.",
  principle: "الذكاء الاصطناعي يوجّه وينبّه، والمختص هو من يقرّر دائماً.",
  readMore: "اقرأ المزيد",
  sections: [
    {
      id: "privacy",
      title: "الخصوصية",
      summary: "أنت تقرر ما يراه مختصك، ويمكنك تغيير ذلك في أي وقت.",
      points: [
        "فحوصاتك اليومية ومفكرتك وتوجيهك ملك لك. ولا يراها مختص إلا بموافقتك، فئةً فئة: المزاج والنوم والدواء والتمارين ونتائج التوجيه.",
        "أنت تختار مقدار ما يُشارَك من مفكرتك: لا شيء، أو المقتطفات التي تختارها فقط، أو النص كاملاً. والمدخلات التي تجعلها خاصة لا تُشارَك أبداً.",
        "يمكنك تغيير المشاركة أو إيقافها في أي وقت من إعداداتك.",
        "قبل بدء العلاقة العلاجية، يرى المختص رمزاً مستعاراً للمريض ولا يرى اسماً حقيقياً.",
      ],
    },
    {
      id: "security",
      title: "الأمان",
      summary: "حسابات محمية، ووصول محمي، وسجل يبيّن من اطّلع على ماذا.",
      points: [
        "كل جزء في SynQ يحتوي معلومات شخصية يتطلب حساباً مسجَّل الدخول. ولا يرى الزائر سوى الصفحات العامة وعرضاً توضيحياً ببيانات خيالية.",
        "حسابات المختصين والمشرفين محمية بالمصادقة الثنائية.",
        "لا يرى المختص إلا المرضى المسندين إليه، وإلا ما وافق كل مريض على مشاركته.",
        "تُحفظ ملاحظات المختصين مشفّرة، ويُسجَّل اطّلاع المختصين والمشرفين على ملفات المرضى.",
      ],
    },
    {
      id: "responsible-ai",
      title: "الذكاء الاصطناعي المسؤول",
      summary: "لا يشخّص ولا يعالج ولا يصف الأدوية.",
      points: [
        "يعتمد توجيه ميرا على أسئلة مبنية على أدوات فحص معروفة. ويُبرز إشارات تستحق تقييماً مهنياً، وهو ليس تشخيصاً.",
        "يسمّي تحليل المفكرة المواضيع والمشاعر. ولا يصنّف الشخص ولا يقارنه بغيره.",
        "يذكر كل ملخص وتقرير أدلته وحدوده، ويؤكد أن مختصاً مرخَّصاً يتخذ كل قرار تشخيصي وعلاجي.",
        "حين تظهر إشارة خطيرة لا يتصرف الذكاء الاصطناعي وحده: يرى المريض إرشاداً واضحاً وأرقام الطوارئ، ويُنبَّه المختص الذي ربط حسابه به ليتابع الحالة.",
      ],
    },
    {
      id: "data-handling",
      title: "معالجة البيانات",
      summary: "فقط ما يلزم لتقديم التوجيه والمتابعة، ولا شيء غير ذلك.",
      points: [
        "تجمع SynQ ما تقدّمه لها: بيانات حسابك وإجاباتك لميرا وفحوصاتك اليومية ومدخلات مفكرتك.",
        "تُستخدم هذه المعلومات لتقديم التوجيه والمتابعة اليومية، ولإعداد تقرير لمختص حين تختار مشاركته.",
        "يعالج النص الذي تكتبه خدمات الذكاء الاصطناعي في SynQ لإنتاج المواضيع والإشارات والملخصات التي تراها.",
        "يمكن إرسال أسئلتك عن بياناتك، ومنها كيفية الاطلاع عليها أو إزالتها، عبر بيانات التواصل أدناه.",
      ],
    },
    {
      id: "legal",
      title: "المعلومات القانونية",
      summary: "التفاصيل الرسمية لهذه السياسة.",
      points: [],
    },
    {
      id: "terms",
      title: "شروط الاستخدام",
      summary: "ما هي SynQ وما ليست، وما نطلبه ممن يستخدمها.",
      points: [
        "SynQ ليست تشخيصاً طبياً، ولا بديلاً عن مختص مرخَّص، ولا خدمة طوارئ.",
        "استخدم حسابك الخاص، وأبقِ بيانات الدخول سرية، وقدّم معلوماتك بصدق لتبقى مفيدة.",
        "يبقى المختصون مسؤولين عن كل قرار سريري يتخذونه بمساعدة SynQ.",
      ],
    },
    {
      id: "contact",
      title: "التواصل",
      summary: "يستطيع المرضى والعيادات والمستشفيات والجهات الصحية مراسلتنا بشأن الخصوصية والأمان ومعالجة البيانات أو التعاون معاً.",
      points: [],
    },
  ],
  contact: {
    formCta: "راسلنا",
    formHint: "الدعم واستفسارات المؤسسات",
    emailLabel: "البريد الإلكتروني",
    phoneLabel: "الهاتف",
    addressLabel: "العنوان",
    urgent: "لا تستطيع SynQ الاستجابة للطوارئ. إن كنت في خطر فاتصل بخدمات الطوارئ المحلية الآن.",
  },
  backHome: "العودة إلى الرئيسية",
};

export const trustCopy: Record<Lang, TrustCopy> = { en, ar };
