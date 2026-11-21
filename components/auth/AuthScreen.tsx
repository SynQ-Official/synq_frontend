"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { authApi, cancelPasswordChange } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { useSessionState } from "@/hooks/useSessionState";
import { clearTokens, hasValidSession } from "@/lib/api/tokens";
import { AUTH_CARD, AUTH_TITLE, AuthLoading } from "@/components/auth/AuthLayout";
import { ACCENT_LIGHT } from "@/components/home/typography";
import { PasswordChecklist, passwordMeetsPolicy, passwordTooLong } from "@/components/auth/PasswordChecklist";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField, IconInput } from "@/components/shared/FormField";
import { countryName, defaultCountry, PhoneField, phoneExample, phoneStatus, toE164, type PhoneValue } from "@/components/shared/PhoneField";
import { DURATION, EASE_OUT, fadeUp, stagger } from "@/lib/motion";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ArrowRight, Check, Eye, EyeOff, Lock, Mail, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { LocaleLink as Link } from "@/components/shared/LocaleLink";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, useTransition } from "react";
import { ROUTES } from "@/lib/config/routes";
import { CONSENT_VERSION } from "@/lib/patient/consent";
import { LinkedText } from "@/components/legal/LegalLinks";
import { accountAccessCopy } from "@/lib/i18n/accountAccess";
import { LEGAL } from "@/config/legal";
import { legalUi } from "@/lib/i18n/legal";
import { prefetchPatientHome } from "@/lib/patient/prefetch";
import { cn } from "@/lib/utils";
import { LogoSpinner } from "@/components/shared/LogoLoader";
import { RoleSelector } from "@/components/auth/RoleSelector";
import { ensureFamilySession, familySession, familySignIn } from "@/lib/family/session";
import { FAMILY_HOME, FAMILY_REGISTER, parseRole, roleDestination, roleHome, signInHref, type AuthRole } from "@/lib/config/auth-role";
import { authRoleCopy } from "@/lib/i18n/authRole";

type AuthMode = "signin" | "signup";

/**
 * Funnel: sign up + consent → Mira's orientation → dashboard (check-in, journal, library).
 * A new account lands on the orientation; a returning one on its dashboard, whatever page sent them to the form
 * (an orientation link must not pull an existing patient back into the chat). Honour internal redirects only
 * (open-redirect safe): sign-in accepts /dashboard targets, sign-up accepts /dashboard and /orientation.
 */
function safeRedirect(redirect: string | null, mode: AuthMode, role: AuthRole | null) {
  // Sign-in: only the chosen role's own area (a parent is never sent into the patient app, nor the reverse).
  if (mode === "signin") return roleDestination(role ?? "patient", redirect) ?? roleHome(role ?? "patient");
  if (redirect && /^\/(dashboard|orientation)(\/|\?|$)/.test(redirect)) return redirect;
  return ROUTES.orientation;
}

type FormValues = { nickname: string; email: string; password: string; confirmPassword: string };
type FieldName = keyof FormValues | "phone" | "consent" | "terms";

/** The API's own bounds: a nickname is 2 to 30 characters (the profile edit applies the same). */
const NICKNAME_MIN = 2;
const NICKNAME_MAX = 30;

/** The form field a 400 names first: class-validator messages start with the property ("nickname must be…"). */
function rejectedField(error: ApiError): "nickname" | "email" | "password" | "phone" | null {
  const raw = (error.payload as { message?: unknown } | undefined)?.message;
  for (const message of Array.isArray(raw) ? raw : [raw]) {
    if (typeof message !== "string") continue;
    const field = message.trim().split(/\s/)[0];
    if (field === "nickname" || field === "email" || field === "password" || field === "phone") return field;
  }
  return null;
}

/** Which control to focus when a field fails validation. */
const FIELD_IDS: Record<FieldName, string> = {
  nickname: "auth-nickname",
  email: "auth-email",
  phone: "auth-phone",
  password: "auth-password",
  confirmPassword: "auth-confirm-password",
  consent: "auth-consent",
  terms: "auth-terms",
};

const LINK_CLASS =
  "rounded-md  text-teal-700 underline-offset-4 transition-colors duration-200 hover:text-teal-800 hover:underline";

function VisibilityToggle({ show, toggle, label }: { show: boolean; toggle: () => void; label: string }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      aria-pressed={show}
      onClick={toggle}
      className="size-9 min-h-9 rounded-full text-ink-muted hover:bg-teal-50 hover:text-teal-700"
    >
      {show ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
    </Button>
  );
}

export function AuthScreen({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const { dictionary, direction, language } = useLanguage();
  const auth = dictionary.auth;
  const isSignUp = mode === "signup";
  // Sign-up is the patient's; sign-in serves two independent accounts and needs the visitor's explicit choice (`?role=`).
  const role: AuthRole | null = isSignUp ? "patient" : parseRole(searchParams.get("role"));
  const isParent = role === "parent";
  // Each account type has its own session: only the chosen one is consulted, the other is never read as proof.
  const patientIn = useSessionState();
  const parentIn = useSyncExternalStore(familySession.subscribe, familySession.state, () => null);
  useEffect(() => {
    if (isParent) void ensureFamilySession();
  }, [isParent]);
  // Already signed in as the chosen account type with a live session: skip the form and go straight to its space.
  const signedIn = role === null ? false : isParent ? parentIn : patientIn;

  // The access token lives in memory only, so `signedIn` is already the API's own answer (login or refresh accepted):
  // no extra `/me` round trip before skipping the form. A session the API later rejects falls back to the sign-in gate.
  useEffect(() => {
    if (!signedIn) return;
    const target = safeRedirect(searchParams.get("redirect"), mode, role);
    if (target.startsWith("/dashboard")) prefetchPatientHome();
    router.replace(target);
  }, [signedIn, router, searchParams, mode, role]);

  // Both ends of the funnel are one tap away: fetch their code while the visitor types.
  useEffect(() => {
    if (isParent) return void router.prefetch(FAMILY_HOME);
    router.prefetch("/dashboard");
    router.prefetch(ROUTES.orientation);
  }, [router, isParent]);

  const [values, setValues] = useState<FormValues>({ nickname: "", email: "", password: "", confirmPassword: "" });
  const [phone, setPhone] = useState<PhoneValue>(() => ({ country: defaultCountry(), national: "" }));
  const [error, setError] = useState("");
  const [errorField, setErrorField] = useState<FieldName | null>(null);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  // UI preference only — session persistence is unchanged until the backend exposes it.
  const [remember, setRemember] = useState(true);
  // Explicit, never pre-ticked: no consent, no account, so no Mira.
  const [consent, setConsent] = useState(false);
  // Separate from the health-data consent above: acceptance of the Terms and the Privacy Policy, also never pre-ticked.
  const [agreed, setAgreed] = useState(false);

  // Fields the visitor has already left: only those show live feedback, so nothing shouts while they are still typing.
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const touch = (field: FieldName) => setTouched((p) => (p[field] ? p : { ...p, [field]: true }));

  const set = (f: FieldName) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues(p => ({ ...p, [f]: e.target.value }));
    if (errorField === f) { setError(""); setErrorField(null); }
  };
  const fail = (field: FieldName, message: string) => {
    setErrorField(field);
    setError(message);
    touch(field);
    toast.error(isSignUp ? auth.toastSignUp : auth.toastForm, { description: message });
    // Bring the visitor to the problem: focus lands on the field that needs attention.
    requestAnimationFrame(() => document.getElementById(FIELD_IDS[field])?.focus());
  };

  /**
   * Server failures in the visitor's language: the raw API text is English, so it is never shown as is. A 400 that
   * names a field (DTO validation) is reported on that field.
   */
  const apiFailure = (err: unknown): { message: string; field?: FieldName } => {
    if (err instanceof ApiError) {
      if (err.status === 0) return { message: auth.errors.network };
      if (err.status === 400) {
        const field = rejectedField(err);
        const onField = {
          nickname: auth.errors.nicknameLength,
          email: auth.errors.email,
          phone: auth.errors.phone,
          password: isSignUp ? auth.errors.passwordRules : auth.errors.invalidCredentials,
        };
        return field ? { message: onField[field], field } : { message: auth.errors.validation };
      }
      if (err.status === 401) {
        // A clinician-created account whose temporary password ran out: its own message, not "wrong password".
        if (err.code === "TEMPORARY_PASSWORD_EXPIRED") return { message: accountAccessCopy[language].signIn.temporaryPasswordExpired };
        return { message: isSignUp ? auth.errors.generic : auth.errors.invalidCredentials };
      }
      if (err.status === 403) return { message: auth.errors.forbidden };
      if (err.status === 409) return { message: isSignUp ? auth.errors.emailTaken : auth.errors.generic };
      if (err.status === 429) return { message: auth.errors.tooManyRequests };
      if (err.status === 502 || err.status === 503 || err.status === 504) return { message: auth.errors.unavailable };
      return { message: auth.errors.generic };
    }
    if (err instanceof Error && err.message === "This account cannot sign in here.") return { message: auth.errors.cannotSignInHere };
    return { message: auth.errors.generic };
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setError(""); setErrorField(null);
    if (!role) return;
    const nickname = values.nickname.trim();
    if (isSignUp && !nickname) return fail("nickname", auth.errors.nickname);
    if (isSignUp && (nickname.length < NICKNAME_MIN || nickname.length > NICKNAME_MAX)) return fail("nickname", auth.errors.nicknameLength);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) return fail("email", auth.errors.email);
    const e164 = isSignUp ? toE164(phone) : null;
    if (isSignUp && !e164) return fail("phone", phoneMessage(phoneStatus(phone)) ?? auth.errors.phone);
    // Sign-in only needs a password: the policy applies to new passwords, never to an existing account.
    if (!isSignUp && !values.password) return fail("password", auth.errors.passwordRequired);
    if (isSignUp && !passwordMeetsPolicy(values.password)) return fail("password", auth.errors.passwordRules);
    if (isSignUp && passwordTooLong(values.password)) return fail("password", auth.errors.passwordTooLong);
    if (isSignUp && values.password !== values.confirmPassword) return fail("confirmPassword", auth.errors.confirmPassword);
    if (isSignUp && !consent) return fail("consent", auth.errors.consent);
    if (isSignUp && !agreed) return fail("terms", legalUi[language].agreeError);

    startTransition(() => {
      (async () => {
        const email = values.email.trim();
        try {
          const target = safeRedirect(searchParams.get("redirect"), mode, role);
          if (isParent) {
            // The parent's own auth system only: never touches (nor falls back to) the patient session.
            await familySignIn(email, values.password);
            router.push(target);
            return;
          }
          // No leftover session (or half-finished password change) can ride along: only the answer to THIS request opens the space.
          clearTokens();
          cancelPasswordChange();
          if (isSignUp) {
            await authApi.register({ nickname, email, phone: e164 ?? undefined, password: values.password, lang: language, consentVersion: CONSENT_VERSION });
          } else if ((await authApi.login(email, values.password)) === "password_change_required") {
            // A clinician created this account: the temporary password opens only the password change, not the app.
            // No session exists yet, so there is nothing to wait for or prefetch.
            router.push(ROUTES.changePassword);
            return;
          }
          // Navigate only once the session is really established.
          if (!hasValidSession()) throw new Error("session-not-established");
          router.prefetch(target);
          // The first screens' data loads in parallel with the navigation itself.
          if (target.startsWith("/dashboard")) prefetchPatientHome();
          router.push(target);
        } catch (err) {
          if (!isParent) clearTokens(); // a failed parent sign-in must not end a patient session
          const { message, field } = apiFailure(err);
          if (field) return fail(field, message);
          setError(message);
          toast.error(isSignUp ? auth.toastSignUp : auth.toastSignIn, { description: message });
        }
      })();
    });
  };

  const phoneState = phoneStatus(phone);
  const country = countryName(phone.country, language);
  const phoneMessage = (state: ReturnType<typeof phoneStatus>) =>
    state === "tooShort" ? auth.errors.phoneTooShort : state === "tooLong" ? auth.errors.phoneTooLong : state === "invalid" ? auth.errors.phone : null;
  const passwordsMatch = values.confirmPassword.length > 0 && values.password === values.confirmPassword;

  // A submit error wins; otherwise the live verdict, once the visitor has left the field (sign-up only).
  const fieldError = (field: FieldName) => {
    if (errorField === field) return error;
    if (!isSignUp) return null;
    if (field === "phone" && touched.phone) return phoneState === "empty" ? auth.errors.phone : phoneMessage(phoneState);
    if (field === "confirmPassword" && values.confirmPassword.length > 0 && !passwordsMatch && (touched.confirmPassword || values.confirmPassword.length >= values.password.length)) {
      return auth.errors.confirmPassword;
    }
    return null;
  };
  const formError = error && !errorField ? error : "";
  // The switch keeps the visitor's destination and the reason they were sent here.
  const carried = new URLSearchParams();
  for (const key of ["from", "redirect"] as const) {
    const value = searchParams.get(key);
    if (value) carried.set(key, value);
  }
  if (isSignUp) carried.set("role", "patient");
  const switchHref = `${isSignUp ? ROUTES.signIn : ROUTES.signUp}${carried.size ? `?${carried}` : ""}`;
  const roleCopy = authRoleCopy[language];
  // Switching account type keeps only a destination that is valid for the new type, and never a typed password.
  const chooseRole = (next: AuthRole) => {
    setValues((p) => ({ ...p, password: "" }));
    setError(""); setErrorField(null);
    router.replace(signInHref(next, searchParams.get("redirect")), { scroll: false });
  };
  const from = searchParams.get("from");
  const notice = from === "orientation" || from === "lumina" ? auth.notice[from] : null;
  const switchPrompt = isSignUp ? auth.switchToSignIn : auth.subtitleSignIn;
  const switchLink = isSignUp ? auth.switchSignInLink : auth.subtitleSignInLink;

  if (signedIn === null || signedIn) return <AuthLoading />;

  return (
    <motion.section
      dir={direction}
      aria-labelledby="auth-title"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.slow, ease: EASE_OUT, delay: 0.1 }}
      className={AUTH_CARD}
    >
      {/* ── HEADING ──────────────────────────────────────────────────── */}
      <header>
        <h1 id="auth-title" aria-describedby="auth-badge" className={cn(AUTH_TITLE, "text-balance")}>
          {isSignUp ? auth.titleSignUpA : auth.titleSignInA}{" "}
          <span className={ACCENT_LIGHT}>{isSignUp ? auth.titleSignUpB : auth.titleSignInB}</span>
        </h1>
        <span id="auth-badge" className="sr-only">{auth.badge}</span>
        <p className="mt-4 text-pretty text-[1rem] leading-7 text-ink-soft">
          {isSignUp ? auth.subtitleSignUp : role === null ? roleCopy.choose : isParent ? roleCopy.parentSubtitle : auth.subtitleWelcome}
        </p>
        {!isSignUp && <RoleSelector role={role} onChange={chooseRole} language={language} />}
      </header>

      {notice && (
        <p role="note" className="mt-6 flex items-start gap-2.5 rounded-xl border border-teal-100 bg-teal-50 px-3.5 py-3 text-[0.875rem] leading-6 text-teal-900">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-teal-700" aria-hidden />
          {notice}
        </p>
      )}

      {/* ── SERVER ERROR ─────────────────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {formError && (
          <motion.div
            role="alert"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
            className="overflow-hidden"
          >
            <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-700" aria-hidden />
              <p className="text-[0.8125rem] leading-5 text-rose-700">{formError}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── ALTERNATIVE FIRST (sign-in): one tap in, then the email form ──────── */}
      {/* {!isSignUp && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: DURATION.base, ease: EASE_OUT, delay: 0.2 }}
          className="mt-7"
        >
          <Button type="button" variant="outline" size="lg" className="w-full gap-3 hover:text-ink">
            <Icon icon="logos:google-icon" aria-hidden="true" />
            {auth.gmailButton}
          </Button>
          <div className="mt-5 flex items-center gap-3">
            <Separator className="flex-1 bg-line" />
            <span className="shrink-0 text-[0.8125rem] font-medium text-ink-soft">{auth.or}</span>
            <Separator className="flex-1 bg-line" />
          </div>
        </motion.div>
      )} */}

      {/* ── PRIMARY: CREDENTIALS ─────────────────────────────────────── */}
      {role && <motion.form
        key={`${mode}-${role}`}
        noValidate
        onSubmit={handleSubmit}
        variants={stagger(0.05, 0.15)}
        initial="hidden"
        animate="show"
        className={cn("flex flex-col gap-5", isSignUp ? "mt-7" : "mt-6")}
        aria-busy={isPending}
      >
        {isSignUp && (
          <motion.div variants={fadeUp(0, 8)}>
            <FormField id="auth-nickname" label={auth.nickname} error={fieldError("nickname")}>
              <IconInput
                id="auth-nickname"
                icon={UserRound}
                type="text"
                value={values.nickname}
                onChange={set("nickname")}
                placeholder={auth.nicknamePlaceholder}
                autoComplete="nickname"
                minLength={NICKNAME_MIN}
                maxLength={NICKNAME_MAX}
                invalid={errorField === "nickname"}
              />
            </FormField>
          </motion.div>
        )}

        <motion.div variants={fadeUp(0, 8)}>
          <FormField id="auth-email" label={auth.email} error={fieldError("email")}>
            <IconInput
              id="auth-email"
              icon={Mail}
              type="email"
              inputMode="email"
              dir="ltr"
              value={values.email}
              onChange={set("email")}
              placeholder={auth.emailPlaceholder}
              autoComplete="email"
              invalid={errorField === "email"}
            />
          </FormField>
        </motion.div>

        {isSignUp && (
          <motion.div variants={fadeUp(0, 8)}>
            <FormField
              id="auth-phone"
              label={auth.phone}
              error={fieldError("phone")}
              hint={phoneState !== "valid" && phoneExample(phone.country) ? auth.phoneExample.replace("{example}", phoneExample(phone.country)) : undefined}
            >
              <PhoneField
                id="auth-phone"
                value={phone}
                onChange={(next) => { setPhone(next); if (errorField === "phone") { setError(""); setErrorField(null); } }}
                onBlur={() => touch("phone")}
                language={language}
                placeholder={auth.phonePlaceholder}
                invalid={!!fieldError("phone")}
                valid={phoneState === "valid"}
                countryLabel={auth.countryCode}
                searchPlaceholder={auth.countrySearch}
                noResults={auth.countryNoResults}
              />
            </FormField>
            <AnimatePresence initial={false}>
              {phoneState === "valid" && (
                <motion.p
                  role="status"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, ease: EASE_OUT }}
                  className="mt-1.5 flex items-center gap-1.5 overflow-hidden text-[0.8125rem] leading-5 text-teal-700"
                >
                  <Check className="size-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
                  {auth.phoneValid.replace("{country}", country)}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        <motion.div variants={fadeUp(0, 8)}>
          <FormField id="auth-password" label={auth.password} error={fieldError("password")}>
            <IconInput
              id="auth-password"
              icon={Lock}
              type={showPwd ? "text" : "password"}
              value={values.password}
              onChange={set("password")}
              placeholder={auth.passwordPlaceholder}
              autoComplete={isSignUp ? "new-password" : "current-password"}
              invalid={errorField === "password"}
              aria-describedby={isSignUp ? "auth-password-rules" : undefined}
              onBlur={() => touch("password")}
              trailing={<VisibilityToggle show={showPwd} toggle={() => setShowPwd((p) => !p)} label={showPwd ? auth.hidePassword : auth.showPassword} />}
            />
          </FormField>
          {isSignUp && (
            <PasswordChecklist id="auth-password-rules" value={values.password} copy={auth.passwordRules} />
          )}
        </motion.div>

        {isSignUp && (
          <motion.div variants={fadeUp(0, 8)}>
            <FormField id="auth-confirm-password" label={auth.confirmPassword} error={fieldError("confirmPassword")}>
              <IconInput
                id="auth-confirm-password"
                icon={Lock}
                type={showConfirm ? "text" : "password"}
                value={values.confirmPassword}
                onChange={set("confirmPassword")}
                placeholder={auth.confirmPasswordPlaceholder}
                autoComplete="new-password"
                invalid={!!fieldError("confirmPassword")}
                onBlur={() => touch("confirmPassword")}
                className={passwordsMatch ? "border-teal-400" : undefined}
                trailing={<VisibilityToggle show={showConfirm} toggle={() => setShowConfirm((p) => !p)} label={showConfirm ? auth.hideConfirm : auth.showConfirm} />}
              />
            </FormField>
            <AnimatePresence initial={false}>
              {passwordsMatch && (
                <motion.p
                  role="status"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, ease: EASE_OUT }}
                  className="mt-1.5 flex items-center gap-1.5 overflow-hidden text-[0.8125rem] leading-5 text-teal-700"
                >
                  <Check className="size-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
                  {auth.passwordsMatch}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {isSignUp && (
          <motion.div variants={fadeUp(0, 8)}>
            <label htmlFor="auth-consent" className="flex cursor-pointer select-none items-start gap-3 text-[0.9375rem] leading-6 text-ink-soft">
              <Checkbox
                id="auth-consent"
                name="consent"
                checked={consent}
                aria-invalid={errorField === "consent"}
                aria-describedby={errorField === "consent" ? "auth-consent-error" : undefined}
                onCheckedChange={(state) => {
                  setConsent(state === true);
                  if (errorField === "consent") { setError(""); setErrorField(null); }
                }}
                className="mt-1 h-[1.125rem] w-[1.125rem] shrink-0 rounded-[0.3125rem] border-line-strong bg-white shadow-none transition-colors duration-200 hover:border-teal-400 focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 data-[state=checked]:border-primary [&_svg]:h-3 [&_svg]:w-3"
              />
              <span>{auth.consent.label}</span>
            </label>
            {errorField === "consent" && (
              <p id="auth-consent-error" role="alert" className="mt-2 text-[0.8125rem] leading-5 text-rose-700">{error}</p>
            )}
          </motion.div>
        )}

        {isSignUp && (
          <motion.div variants={fadeUp(0, 8)}>
            <div className="flex items-start gap-3 text-[0.9375rem] leading-6 text-ink-soft">
              <Checkbox
                id="auth-terms"
                name="terms"
                checked={agreed}
                aria-labelledby="auth-terms-label"
                aria-invalid={errorField === "terms"}
                aria-describedby={errorField === "terms" ? "auth-terms-error" : undefined}
                onCheckedChange={(state) => {
                  setAgreed(state === true);
                  if (errorField === "terms") { setError(""); setErrorField(null); }
                }}
                className="mt-1 h-[1.125rem] w-[1.125rem] shrink-0 rounded-[0.3125rem] border-line-strong bg-white shadow-none transition-colors duration-200 hover:border-teal-400 focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 data-[state=checked]:border-primary [&_svg]:h-3 [&_svg]:w-3"
              />
              {/* Not a <label>: a click on the two links must open the pages, not toggle the box. */}
              <p id="auth-terms-label">
                <LinkedText
                  template={legalUi[language].agree + (LEGAL.version ? legalUi[language].agreeVersion.replace("{version}", LEGAL.version) : "")}
                  links={{
                    terms: <Link href={ROUTES.terms} target="_blank" className={LINK_CLASS}>{legalUi[language].terms}</Link>,
                    privacy: <Link href={ROUTES.privacy} target="_blank" className={LINK_CLASS}>{legalUi[language].privacyPolicy}</Link>,
                  }}
                />
              </p>
            </div>
            {errorField === "terms" && (
              <p id="auth-terms-error" role="alert" className="mt-2 text-[0.8125rem] leading-5 text-rose-700">{error}</p>
            )}
          </motion.div>
        )}

        {!isSignUp && (
          <motion.div variants={fadeUp(0, 8)} className="-my-1.5 flex flex-wrap items-center justify-between gap-x-4">
            <label htmlFor="auth-remember" className="inline-flex min-h-11 cursor-pointer select-none items-center gap-2.5 text-[0.9375rem] text-ink-soft">
              <Checkbox
                id="auth-remember"
                name="remember"
                checked={remember}
                onCheckedChange={(state) => setRemember(state === true)}
                className="h-[1.125rem] w-[1.125rem] rounded-[0.3125rem] border-line-strong bg-white shadow-none transition-colors duration-200 hover:border-teal-400 focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 data-[state=checked]:border-primary [&_svg]:h-3 [&_svg]:w-3"
              />
              {auth.rememberMe}
            </label>
            {/* The parent API has no password reset: no link to a flow that would not work for a parent account. */}
            {!isParent && (
              <Link href={ROUTES.forgotPassword} className={`${LINK_CLASS} inline-flex min-h-11 items-center text-[0.9375rem] font-medium`}>
                {auth.forgotPassword}
              </Link>
            )}
          </motion.div>
        )}

        <motion.div variants={fadeUp(0, 8)} className="pt-1">
          <Button
            type="submit"
            variant="auth"
            size="lg"
            disabled={isPending}
            aria-busy={isPending}
            className="group min-h-14 hover:shadow-[0_18px_36px_-14px_rgb(17_76_97/0.65)]"
          >
            {isPending ? (
              <>
                <LogoSpinner size={18} />
                <span>{auth.processing}</span>
              </>
            ) : (
              <>
                <span>{isSignUp ? auth.signUpButton : auth.signInButton}</span>
                <ArrowRight
                  className="transition-transform duration-300 ease-out-soft group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"
                  aria-hidden
                />
              </>
            )}
          </Button>
         
        </motion.div>
      </motion.form>}

      {/* ── SWITCH + LEGAL ───────────────────────────────────────────── */}
      <footer className="mt-7 border-t border-line pt-6 text-center">
        {role !== null && (
          <p className="text-[0.9375rem] text-ink-soft">
            {isParent ? roleCopy.parentNoAccount : switchPrompt}{" "}
            <Link href={isParent ? FAMILY_REGISTER : switchHref} className={LINK_CLASS}>
              {isParent ? roleCopy.parentRegister : switchLink}
            </Link>
          </p>
        )}
        {isSignUp && (
          <p className="mt-3 text-[0.9375rem] text-ink-soft">
            {roleCopy.signUpParentPrompt}{" "}
            <Link href={FAMILY_REGISTER} className={LINK_CLASS}>{roleCopy.signUpParentLink}</Link>
          </p>
        )}
        <p className="mx-auto mt-3 max-w-xs text-[0.8125rem] leading-5 text-ink-soft">{auth.legal}</p>
      </footer>
    </motion.section>
  );
}
