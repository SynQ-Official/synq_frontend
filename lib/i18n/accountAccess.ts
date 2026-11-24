import type { Lang } from "@/lib/i18n/config";

/**
 * Copy of the two screens a clinician's actions lead a patient to: the mandatory password change (an account the
 * clinician created) and the invitation sign-up. Field labels, the password checklist and the generic errors come from
 * `auth`; the legal sentence from `legalUi`.
 */
type AccountAccessCopy = {
  changePassword: {
    title: string;
    subtitle: string;
    newPassword: string;
    submit: string;
    mismatch: string;
    /** The API refused the password itself (it must not be the temporary one). */
    rejected: string;
    expiredTitle: string;
    expiredBody: string;
    backToSignIn: string;
  };
  adultConsent: {
    title: string;
    intro: string;
    points: string[];
    checkbox: string;
    /** Shown when the patient submits without ticking the box. */
    mustConfirm: string;
    submit: string;
    expiredTitle: string;
    expiredBody: string;
    backToSignIn: string;
  };
  invitation: {
    title: string;
    subtitle: string;
    forEmail: string;
    emailNote: string;
    consentOptional: string;
    submit: string;
    invalidTitle: string;
    invalidBody: string;
    unavailableTitle: string;
    unavailableBody: string;
    retry: string;
    accountExists: string;
    nicknameTaken: string;
    goToSignIn: string;
    mismatch: string;
  };
  signIn: {
    /** The temporary password of a clinician-created account ran out before it was used. */
    temporaryPasswordExpired: string;
  };
};

export const accountAccessCopy: Record<Lang, AccountAccessCopy> = {
  en: {
    changePassword: {
      title: "Choose your own password",
      subtitle: "Your care team set up this account with a temporary password. Choose a password only you know to continue.",
      newPassword: "New password",
      submit: "Save and continue",
      mismatch: "The two passwords do not match.",
      rejected: "This password was not accepted. Choose a different one: it cannot be your temporary password.",
      expiredTitle: "Please sign in again",
      expiredBody: "For your safety this step expires after a few minutes. Sign in with your temporary password to continue.",
      backToSignIn: "Back to sign in",
    },
    adultConsent: {
      title: "Welcome to your adult account",
      intro: "Your account is now for adults. Here is what changes:",
      points: [
        "You are now 18.",
        "Family access to your account has ended automatically.",
        "From now on only you decide what is shared with your care team.",
        "You can review sharing in Settings > Privacy.",
        "SynQ does not diagnose.",
      ],
      checkbox: "I understand and want to continue with my own account",
      mustConfirm: "Please tick the box to confirm you understand before continuing.",
      submit: "Continue to my account",
      expiredTitle: "Please sign in again",
      expiredBody: "For your safety this step expires after a few minutes. Sign in again to continue.",
      backToSignIn: "Back to sign in",
    },
    invitation: {
      title: "Create your private space",
      subtitle: "Your clinician invited you to SynQ. Set up your account to get started.",
      forEmail: "Invitation for",
      emailNote: "This invitation only works for this address.",
      consentOptional: "Optional",
      submit: "Create my account",
      invalidTitle: "This invitation can't be used",
      invalidBody: "The link has expired, was already used, or was replaced by a newer invitation. Ask your clinician to send you a new one.",
      unavailableTitle: "We can't check your invitation right now",
      unavailableBody: "SynQ is briefly unavailable. Please try again in a few minutes.",
      retry: "Try again",
      accountExists: "An account already exists for this address. Sign in instead.",
      nicknameTaken: "This nickname is already taken. Please choose another.",
      goToSignIn: "Go to sign in",
      mismatch: "The two passwords do not match.",
    },
    signIn: {
      temporaryPasswordExpired: "Your temporary password has expired. Use “Forgot password” to choose a new one.",
    },
  },
  ar: {
    changePassword: {
      title: "اختر كلمة المرور الخاصة بك",
      subtitle: "أنشأ فريق رعايتك هذا الحساب بكلمة مرور مؤقتة. اختر كلمة مرور لا يعرفها غيرك للمتابعة.",
      newPassword: "كلمة المرور الجديدة",
      submit: "حفظ ومتابعة",
      mismatch: "كلمتا المرور غير متطابقتين.",
      rejected: "لم تُقبل كلمة المرور هذه. اختر كلمة مختلفة: لا يمكن أن تكون كلمة المرور المؤقتة.",
      expiredTitle: "يرجى تسجيل الدخول من جديد",
      expiredBody: "لأمانك، تنتهي صلاحية هذه الخطوة بعد دقائق قليلة. سجّل الدخول بكلمة المرور المؤقتة للمتابعة.",
      backToSignIn: "العودة إلى تسجيل الدخول",
    },
    adultConsent: {
      title: "مرحبًا بك في حسابك للبالغين",
      intro: "حسابك الآن مخصص للبالغين. إليك ما يتغيّر:",
      points: [
        "أنت الآن في الثامنة عشرة من عمرك.",
        "انتهى وصول العائلة إلى حسابك تلقائيًا.",
        "من الآن فصاعدًا أنت وحدك من يقرر ما يُشارَك مع فريق رعايتك.",
        "يمكنك مراجعة المشاركة في الإعدادات > الخصوصية.",
        "SynQ لا يقدّم تشخيصًا.",
      ],
      checkbox: "فهمت، وأريد المتابعة بحسابي الخاص",
      mustConfirm: "يُرجى تحديد المربع لتأكيد فهمك قبل المتابعة.",
      submit: "المتابعة إلى حسابي",
      expiredTitle: "يرجى تسجيل الدخول من جديد",
      expiredBody: "لأمانك، تنتهي صلاحية هذه الخطوة بعد دقائق قليلة. سجّل الدخول من جديد للمتابعة.",
      backToSignIn: "العودة إلى تسجيل الدخول",
    },
    invitation: {
      title: "أنشئ مساحتك الخاصة",
      subtitle: "دعاك طبيبك إلى SynQ. أنشئ حسابك للبدء.",
      forEmail: "الدعوة موجّهة إلى",
      emailNote: "هذه الدعوة صالحة لهذا العنوان فقط.",
      consentOptional: "اختياري",
      submit: "إنشاء حسابي",
      invalidTitle: "لا يمكن استخدام هذه الدعوة",
      invalidBody: "انتهت صلاحية الرابط أو سبق استخدامه أو حلّت محلّه دعوة أحدث. اطلب من طبيبك إرسال دعوة جديدة.",
      unavailableTitle: "لا يمكننا التحقق من دعوتك الآن",
      unavailableBody: "SynQ غير متاح لحظيًا. حاول مجددًا بعد دقائق.",
      retry: "حاول مجددًا",
      accountExists: "يوجد حساب بهذا العنوان بالفعل. سجّل الدخول بدلًا من ذلك.",
      nicknameTaken: "هذا الاسم المستعار مستخدم بالفعل. اختر اسمًا آخر.",
      goToSignIn: "الانتقال إلى تسجيل الدخول",
      mismatch: "كلمتا المرور غير متطابقتين.",
    },
    signIn: {
      temporaryPasswordExpired: "انتهت صلاحية كلمة المرور المؤقتة. استخدم «نسيت كلمة المرور» لاختيار كلمة جديدة.",
    },
  },
};
