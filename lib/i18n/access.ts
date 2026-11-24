import type { Lang } from "@/lib/i18n/config";

/**
 * Copy for /invite (opening a clinician's invitation, or joining without one) and /clinic-access (a clinician applies;
 * the SynQ team reviews every application). Every Arabic string is listed for review by an Arabic-speaking clinician.
 */
export type AccessCopy = {
  invite: {
    seoTitle: string;
    seoDescription: string;
    eyebrow: string;
    title: string;
    body: string;
    pasteLabel: string;
    pastePlaceholder: string;
    pasteHint: string;
    pasteSubmit: string;
    pasteError: string;
    signedUp: string;
    signIn: string;
    adults: { title: string; body: string; link: string };
    none: { title: string; body: string; messageLabel: string; message: string; copy: string; copied: string };
    parents: { title: string; body: string; link: string };
    clinicians: { title: string; link: string };
  };
  clinic: {
    seoTitle: string;
    seoDescription: string;
    eyebrow: string;
    title: string;
    body: string;
    noPatientData: string;
    /** The primary action: opens the clinician app's sign-up (its address comes from NEXT_PUBLIC_PSY_URL). */
    signUp: string;
    /** Screen-reader cue for the sign-up link, which opens in a new tab. */
    opensNewTab: string;
    /** Shown instead of the action while the clinician app's address is not configured. */
    signUpUnavailable: string;
    /** The panel beside the form (same shape as the patient auth panel), written for clinics. */
    brand: { eyebrow: string; titleA: string; titleB: string; body: string; points: readonly string[]; quote: string };
  };
};

const en: AccessCopy = {
  invite: {
    seoTitle: "Join SynQ with your clinic invitation",
    seoDescription: "Patients join SynQ through their clinic. Open the invitation e-mail from your clinic, or learn how to ask your clinician.",
    eyebrow: "Clinic invitation",
    title: "Open your clinic invitation",
    body: "Your clinic sends the invitation by e-mail. Open the link in that e-mail to create your private account. The link works once, for your address only.",
    pasteLabel: "Or paste the link from the e-mail",
    pastePlaceholder: "https://…/invitation?token=…",
    pasteHint: "Nothing is sent until you continue. Your clinic's link is checked on the next page.",
    pasteSubmit: "Continue",
    pasteError: "This doesn't look like a SynQ invitation link. Copy the whole link from the e-mail.",
    signedUp: "Already joined?",
    signIn: "Sign in",
    none: {
      title: "No invitation yet?",
      body: "SynQ works through clinics. Ask your clinician whether their clinic offers it. You can send them this message.",
      messageLabel: "Message for your clinician",
      message: "Hello. I would like to use SynQ between our appointments. Does the clinic offer it? If so, could you send me an invitation? Thank you.",
      copy: "Copy the message",
      copied: "Copied",
    },
    parents: {
      title: "Are you a parent?",
      body: "Parents have their own account, separate from their teenager's. Your teenager's clinician approves the link between you.",
      link: "Parent portal",
    },
    adults: {
      title: "No invitation? You don't need one.",
      body: "Adults can create their own account and start with Mira right away. Connect a clinician later, when you choose.",
      link: "Create your account",
    },
    clinicians: { title: "Are you a clinician?", link: "Apply for access" },
  },
  clinic: {
    seoTitle: "Apply as a clinician",
    seoDescription: "Licensed clinicians in the UAE and Tunisia can apply to use SynQ with their patients. The SynQ team reviews every application and replies by e-mail.",
    eyebrow: "For clinicians",
    title: "Apply as a clinician",
    body: "For licensed clinicians in the UAE and Tunisia. You create your account in the clinician app, and your licence is verified before you can see patients.",
    noPatientData: "Please don't include any patient information.",
    opensNewTab: "(opens in a new tab)",
    signUp: "Create your clinician account",
    signUpUnavailable: "Clinician sign-up is not open yet. Please check back soon.",
    brand: {
      eyebrow: "For clinicians",
      titleA: "Follow patients",
      titleB: "between visits.",
      body: "A web workspace for licensed clinicians: patients choose you, you accept who you can follow, and you see only what each one chose to share, plus safety alerts with the evidence behind them.",
      points: ["Every application reviewed by the SynQ team", "Shared data only, plus safety alerts", "SynQ never diagnoses: you decide"],
      quote: "No workspace opens before the SynQ team has reviewed it.",
    },
  },
};

const ar: AccessCopy = {
  invite: {
    seoTitle: "انضم إلى SynQ بدعوة من عيادتك",
    seoDescription: "ينضم المرضى إلى SynQ عن طريق عيادتهم. افتح بريد الدعوة من عيادتك، أو اعرف كيف تطلبها من مختصك.",
    eyebrow: "دعوة العيادة",
    title: "افتح دعوة عيادتك",
    body: "ترسل عيادتك الدعوة بالبريد الإلكتروني. افتح الرابط في ذلك البريد لإنشاء حسابك الخاص. الرابط يعمل مرة واحدة، ولعنوانك فقط.",
    pasteLabel: "أو الصق الرابط من البريد",
    pastePlaceholder: "https://…/invitation?token=…",
    pasteHint: "لا يُرسَل شيء قبل أن تتابع. يُتحقَّق من رابط عيادتك في الصفحة التالية.",
    pasteSubmit: "متابعة",
    pasteError: "لا يبدو هذا رابط دعوة من SynQ. انسخ الرابط كاملاً من البريد.",
    signedUp: "انضممت من قبل؟",
    signIn: "تسجيل الدخول",
    none: {
      title: "ما عندك دعوة بعد؟",
      body: "تعمل SynQ عن طريق العيادات. اسأل مختصك إن كانت عيادته تقدّمها. وتقدر ترسل له هذه الرسالة.",
      messageLabel: "رسالة إلى مختصك",
      message: "مرحباً. أرغب في استخدام SynQ بين مواعيدنا. هل تقدّمها العيادة؟ إن كان كذلك، هل يمكن إرسال دعوة لي؟ شكراً.",
      copy: "انسخ الرسالة",
      copied: "تم النسخ",
    },
    parents: {
      title: "هل أنت ولي أمر؟",
      body: "لأولياء الأمور حسابهم الخاص، منفصل عن حساب الابن أو الابنة. ويوافق مختص الابن أو الابنة على الربط بينكما.",
      link: "بوابة الأهل",
    },
    adults: {
      title: "ما عندك دعوة؟ لا تحتاج إليها.",
      body: "يمكن للبالغين إنشاء حسابهم بأنفسهم والبدء مع ميرا فوراً. واربط حسابك بمختص لاحقاً، متى اخترت.",
      link: "أنشئ حسابك",
    },
    clinicians: { title: "هل أنت مختص؟", link: "قدّم طلب انضمام" },
  },
  clinic: {
    seoTitle: "قدّم طلب انضمام كمختص",
    seoDescription: "يمكن للمختصين المرخّصين في الإمارات وتونس التقدّم لاستخدام SynQ مع مرضاهم. يراجع فريق SynQ كل طلب ويرد بالبريد الإلكتروني.",
    eyebrow: "للمختصين",
    title: "قدّم طلب انضمام كمختص",
    body: "للمختصين المرخّصين في الإمارات وتونس. تُنشئ حسابك في تطبيق المختصين، ويُتحقق من ترخيصك قبل أن تتمكن من رؤية المرضى.",
    noPatientData: "يرجى عدم ذكر أي معلومات عن المرضى.",
    opensNewTab: "(يُفتح في نافذة جديدة)",
    signUp: "إنشاء حساب الطبيب",
    signUpUnavailable: "التسجيل للأطباء غير متاح بعد. يرجى التحقق لاحقاً.",
    brand: {
      eyebrow: "للمختصين",
      titleA: "تابع مرضاك",
      titleB: "بين الزيارات.",
      body: "مساحة عمل على الويب للمختصين المرخّصين: يختارك المرضى، وتقبل من تستطيع متابعته، ولا ترى إلا ما اختار كل منهم مشاركته، مع تنبيهات السلامة وأدلتها.",
      points: ["كل طلب يراجعه فريق SynQ", "البيانات المُشارَكة فقط، مع تنبيهات السلامة", "لا تشخّص SynQ أبداً: القرار لك"],
      quote: "لا تُفتح أي مساحة عمل قبل أن يراجعها فريق SynQ.",
    },
  },
};

export const accessCopy: Record<Lang, AccessCopy> = { en, ar };
