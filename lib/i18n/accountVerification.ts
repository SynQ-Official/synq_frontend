import type { Lang } from "@/lib/i18n/config";

/**
 * Copy for sign-up's birth date and country, the e-mail verification pages and the unconfirmed-address banner (patient
 * and parent). One typed shape for both languages: a missing Arabic key is a compile error, not a blank on screen.
 */
export type AccountVerificationCopy = {
  signup: {
    birthDate: string;
    birthDateHint: string;
    birthDateRequired: string;
    birthDateInvalid: string;
    /** Shown live under the field, and at submit, when the birth date says the person is under 18. */
    under18: string;
    /** The guidance under the under-18 message: where a parent goes instead. `under18Link` is the link text. */
    under18Guide: string;
    under18Link: string;
    country: string;
    countryChoose: string;
    countryRequired: string;
    countryInvalid: string;
  };
  banner: {
    title: string;
    body: string;
    resend: string;
    sending: string;
    sent: string;
    throttled: string;
    error: string;
    collapse: string;
    expand: string;
  };
  /** Shown where a sensitive action is refused until the e-mail is confirmed (EMAIL_NOT_VERIFIED). */
  gate: {
    message: string;
  };
  verify: {
    title: string;
    verifying: string;
    doneTitle: string;
    doneBody: string;
    invalidTitle: string;
    invalidBody: string;
    unavailableBody: string;
    /** Signed-in visitors with a stale link can ask for a new one. */
    resend: string;
    resendSent: string;
    resendThrottled: string;
    resendError: string;
    continue: string;
    signIn: string;
  };
};

export const accountVerificationCopy: Record<Lang, AccountVerificationCopy> = {
  en: {
    signup: {
      birthDate: "Date of birth",
      birthDateHint: "SynQ patient accounts are for people aged 18 and over.",
      birthDateRequired: "Enter your date of birth.",
      birthDateInvalid: "Enter a real date of birth.",
      under18: "SynQ patient accounts are for people aged 18 and over.",
      under18Guide: "If you are a parent or guardian, you can support your child with a parent account.",
      under18Link: "Create a parent account",
      country: "Country",
      countryChoose: "Choose your country",
      countryRequired: "Choose your country.",
      countryInvalid: "Choose a country from the list.",
    },
    banner: {
      title: "Confirm your e-mail address",
      body: "We sent a link to your inbox. Open it to confirm your address. You can keep using SynQ meanwhile.",
      resend: "Resend e-mail",
      sending: "Sending…",
      sent: "We sent a new link. Check your inbox and spam folder.",
      throttled: "You asked for a new link a moment ago. Please wait a few minutes, then try again.",
      error: "We couldn't send the e-mail. Please try again.",
      collapse: "Hide",
      expand: "Confirm e-mail",
    },
    gate: {
      message: "Verify your email to use this feature.",
    },
    verify: {
      title: "Confirm your e-mail",
      verifying: "Confirming your e-mail address…",
      doneTitle: "Your e-mail is confirmed",
      doneBody: "Thank you. Your address is confirmed and your account is ready.",
      invalidTitle: "This link has expired",
      invalidBody: "The link is invalid or has already been used. Ask for a new one.",
      unavailableBody: "We couldn't confirm your address just now. Please try again in a few minutes.",
      resend: "Send a new link",
      resendSent: "We sent a new link. Check your inbox and spam folder.",
      resendThrottled: "You asked for a new link a moment ago. Please wait a few minutes, then try again.",
      resendError: "We couldn't send the e-mail. Please try again.",
      continue: "Continue to SynQ",
      signIn: "Sign in to ask for a new link",
    },
  },
  ar: {
    signup: {
      birthDate: "تاريخ الميلاد",
      birthDateHint: "حسابات المرضى في SynQ مخصصة للأشخاص من 18 عاماً فما فوق.",
      birthDateRequired: "أدخل تاريخ ميلادك.",
      birthDateInvalid: "أدخل تاريخ ميلاد صحيحاً.",
      under18: "حسابات المرضى في SynQ مخصصة للأشخاص من 18 عاماً فما فوق.",
      under18Guide: "إذا كنت والداً أو ولي أمر، يمكنك دعم طفلك من خلال حساب ولي أمر.",
      under18Link: "إنشاء حساب ولي أمر",
      country: "البلد",
      countryChoose: "اختر بلدك",
      countryRequired: "اختر بلدك.",
      countryInvalid: "اختر بلداً من القائمة.",
    },
    banner: {
      title: "أكّد عنوان بريدك الإلكتروني",
      body: "أرسلنا رابطاً إلى بريدك الوارد. افتحه لتأكيد عنوانك. يمكنك متابعة استخدام SynQ في الوقت نفسه.",
      resend: "إعادة إرسال الرسالة",
      sending: "جارٍ الإرسال…",
      sent: "أرسلنا رابطاً جديداً. تحقّق من بريدك الوارد والبريد غير المرغوب.",
      throttled: "طلبت رابطاً جديداً منذ لحظات. يرجى الانتظار بضع دقائق ثم المحاولة مرة أخرى.",
      error: "تعذّر إرسال الرسالة. يرجى المحاولة مرة أخرى.",
      collapse: "إخفاء",
      expand: "تأكيد البريد الإلكتروني",
    },
    gate: {
      message: "تحقّق من بريدك الإلكتروني لاستخدام هذه الميزة.",
    },
    verify: {
      title: "تأكيد بريدك الإلكتروني",
      verifying: "جارٍ تأكيد عنوان بريدك الإلكتروني…",
      doneTitle: "تم تأكيد بريدك الإلكتروني",
      doneBody: "شكراً لك. تم تأكيد عنوانك وحسابك جاهز.",
      invalidTitle: "انتهت صلاحية هذا الرابط",
      invalidBody: "الرابط غير صالح أو سبق استخدامه. اطلب رابطاً جديداً.",
      unavailableBody: "تعذّر تأكيد عنوانك الآن. يرجى المحاولة بعد بضع دقائق.",
      resend: "إرسال رابط جديد",
      resendSent: "أرسلنا رابطاً جديداً. تحقّق من بريدك الوارد والبريد غير المرغوب.",
      resendThrottled: "طلبت رابطاً جديداً منذ لحظات. يرجى الانتظار بضع دقائق ثم المحاولة مرة أخرى.",
      resendError: "تعذّر إرسال الرسالة. يرجى المحاولة مرة أخرى.",
      continue: "المتابعة إلى SynQ",
      signIn: "سجّل الدخول لطلب رابط جديد",
    },
  },
};
