import type { Lang } from "@/lib/i18n/config";

/**
 * Copy for /invite (patients join through their clinic) and /clinic-access (clinics ask for SynQ). B2B2C: there is no
 * public sign-up. Every Arabic string is listed for review by an Arabic-speaking clinician.
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
    none: { title: string; body: string; messageLabel: string; message: string; copy: string; copied: string };
    adults: { title: string; body: string; link: string };
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
    fields: { name: string; role: string; clinic: string; country: string; city: string; email: string; phone: string; optional: string; message: string };
    roles: readonly string[];
    countries: { AE: string; TN: string };
    choose: string;
    consent: string;
    submit: string;
    pendingEmail: string;
    sent: string;
    subject: string;
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
    adults: {
      title: "Are you an adult, with no invitation?",
      body: "You can create your own account and start with Mira. Your clinician can join later, when you choose.",
      link: "Create an adult account",
    },
    parents: {
      title: "Are you a parent?",
      body: "Parents have their own account, separate from their teenager's. Your teenager's clinician approves the link between you.",
      link: "Parent portal",
    },
    clinicians: { title: "Are you a clinician?", link: "Request clinic access" },
  },
  clinic: {
    seoTitle: "Request clinic access",
    seoDescription: "Clinics and clinicians in the UAE and Tunisia can ask to use SynQ with their patients.",
    eyebrow: "For clinics",
    title: "Request clinic access",
    body: "Tell us about your clinic. We reply by e-mail.",
    noPatientData: "Please don't include any patient information.",
    fields: { name: "Full name", role: "Role", clinic: "Clinic", country: "Country", city: "City", email: "Work e-mail", phone: "Phone", optional: "optional", message: "Message" },
    roles: ["Psychiatrist", "Psychologist", "Therapist", "Nurse", "Clinic manager", "Other"],
    countries: { AE: "United Arab Emirates", TN: "Tunisia" },
    choose: "Choose…",
    consent: "I agree to be contacted by SynQ about this request.",
    submit: "Send request",
    pendingEmail: "Clinic contact e-mail",
    sent: "Your e-mail app is opening with your request. Send it from there.",
    subject: "Clinic access request",
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
    adults: {
      title: "هل أنت بالغ وليس عندك دعوة؟",
      body: "تقدر تنشئ حسابك بنفسك وتبدأ مع ميرا. ويمكن لمختصك الانضمام لاحقاً، متى اخترت.",
      link: "أنشئ حساب بالغ",
    },
    parents: {
      title: "هل أنت ولي أمر؟",
      body: "لأولياء الأمور حسابهم الخاص، منفصل عن حساب الابن أو الابنة. ويوافق مختص الابن أو الابنة على الربط بينكما.",
      link: "بوابة الأهل",
    },
    clinicians: { title: "هل أنت مختص؟", link: "طلب انضمام لعيادة" },
  },
  clinic: {
    seoTitle: "طلب انضمام لعيادة",
    seoDescription: "يمكن للعيادات والمختصين في الإمارات وتونس طلب استخدام SynQ مع مرضاهم.",
    eyebrow: "للعيادات",
    title: "طلب انضمام لعيادة",
    body: "أخبرنا عن عيادتك. نرد عليك بالبريد الإلكتروني.",
    noPatientData: "يرجى عدم ذكر أي معلومات عن المرضى.",
    fields: { name: "الاسم الكامل", role: "الدور", clinic: "العيادة", country: "البلد", city: "المدينة", email: "بريد العمل", phone: "الهاتف", optional: "اختياري", message: "الرسالة" },
    roles: ["طبيب نفسي", "أخصائي نفسي", "معالج", "ممرض", "مدير عيادة", "غير ذلك"],
    countries: { AE: "الإمارات العربية المتحدة", TN: "تونس" },
    choose: "اختر…",
    consent: "أوافق على أن تتواصل معي SynQ بشأن هذا الطلب.",
    submit: "إرسال الطلب",
    pendingEmail: "بريد التواصل مع العيادات",
    sent: "يفتح تطبيق البريد الآن بطلبك. أرسله من هناك.",
    subject: "طلب انضمام عيادة",
  },
};

export const accessCopy: Record<Lang, AccessCopy> = { en, ar };
