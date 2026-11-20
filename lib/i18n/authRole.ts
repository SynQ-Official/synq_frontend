import type { Lang } from "@/lib/i18n/config";

/** Copy of the account-type selector on the shared sign-in page, and the entry points to the two registrations. */
type AuthRoleCopy = {
  legend: string;
  choose: string;
  patient: { title: string; hint: string };
  parent: { title: string; hint: string };
  parentSubtitle: string;
  parentNoAccount: string;
  parentRegister: string;
  signUpParentPrompt: string;
  signUpParentLink: string;
};

export const authRoleCopy: Record<Lang, AuthRoleCopy> = {
  en: {
    legend: "How would you like to sign in?",
    choose: "Choose the account you use. Patients and parents have separate accounts and separate spaces.",
    patient: { title: "Adult patient", hint: "Your own private SynQ space" },
    parent: { title: "Parent / Caregiver", hint: "SynQ Family, to support a child" },
    parentSubtitle: "Sign in to SynQ Family to follow and support your child, with the agreement of their clinician.",
    parentNoAccount: "New to SynQ Family?",
    parentRegister: "Create a parent account",
    signUpParentPrompt: "Supporting a child instead?",
    signUpParentLink: "Create a parent account",
  },
  ar: {
    legend: "كيف تريد تسجيل الدخول؟",
    choose: "اختر الحساب الذي تستخدمه. للمرضى وللأهل حسابات ومساحات منفصلة.",
    patient: { title: "مريض بالغ", hint: "مساحتك الخاصة في SynQ" },
    parent: { title: "ولي أمر / مُعيل", hint: "SynQ للعائلة، لدعم طفل" },
    parentSubtitle: "سجّل الدخول إلى SynQ للعائلة لمتابعة طفلك ودعمه، بموافقة معالجه.",
    parentNoAccount: "جديد في SynQ للعائلة؟",
    parentRegister: "أنشئ حساب ولي أمر",
    signUpParentPrompt: "هل تدعم طفلاً بدلاً من ذلك؟",
    signUpParentLink: "أنشئ حساب ولي أمر",
  },
};
