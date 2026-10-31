"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { authApi } from "@/lib/api/auth";
import { ApiError, api } from "@/lib/api/client";
import { useSessionState } from "@/hooks/useSessionState";
import { clearTokens, hasValidSession } from "@/lib/api/tokens";
import { AUTH_CARD, AUTH_TITLE, AuthLoading } from "@/components/auth/AuthLayout";
import { ACCENT_LIGHT } from "@/components/home/typography";
import { PasswordChecklist, passwordMeetsPolicy } from "@/components/auth/PasswordChecklist";
import { setUser } from "@/lib/storage/storage";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField, IconInput } from "@/components/shared/FormField";
import { countryName, defaultCountry, PhoneField, phoneExample, phoneStatus, toE164, type PhoneValue } from "@/components/shared/PhoneField";
import { DURATION, EASE_OUT, fadeUp, stagger } from "@/lib/motion";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ArrowRight, Check, Eye, EyeOff, Lock, Mail, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { ROUTES } from "@/lib/config/routes";
import { CONSENT_VERSION } from "@/lib/patient/consent";
import { prefetchPatientHome } from "@/lib/patient/prefetch";
import { cn } from "@/lib/utils";
import { LogoSpinner } from "@/components/shared/LogoLoader";

type AuthMode = "signin" | "signup";

/**
 * Funnel: sign up + consent → Mira's orientation → dashboard (check-in, journal, library).
 * A new account lands on the orientation; a returning one on its dashboard, whatever page sent them to the form
 * (an orientation link must not pull an existing patient back into the chat). Honour internal redirects only
 * (open-redirect safe): sign-in accepts /dashboard targets, sign-up accepts /dashboard and /orientation.
 */
function safeRedirect(redirect: string | null, mode: AuthMode) {
  const allowed = mode === "signup" ? /^\/(dashboard|orientation)(\/|\?|$)/ : /^\/dashboard(\/|\?|$)/;
  if (redirect && allowed.test(redirect)) return redirect;
  return mode === "signup" ? ROUTES.orientation : ROUTES.dashboard;
}

type FormValues = { nickname: string; email: string; password: string; confirmPassword: string };
type FieldName = keyof FormValues | "phone" | "consent";

/** Which control to focus when a field fails validation. */
const FIELD_IDS: Record<FieldName, string> = {
  nickname: "auth-nickname",
  email: "auth-email",
  phone: "auth-phone",
  password: "auth-password",
  confirmPassword: "auth-confirm-password",
  consent: "auth-consent",
};

const LINK_CLASS =
  "rounded-md font-semibold text-teal-700 underline-offset-4 transition-colors duration-200 hover:text-teal-800 hover:underline";

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
  // Already signed in with a live session: skip the form and go straight to the patient space.
  const signedIn = useSessionState();

  // A token in storage is not proof of a session: the API confirms it before the form is skipped. A rejected
  // (stale) token is dropped and the form is shown, so the visitor is never sent on without a real sign-in.
  const [staleSession, setStaleSession] = useState(false);
  useEffect(() => {
    if (!signedIn) return;
    let cancelled = false;
    api
      .get("/me")
      .then(() => {
        if (cancelled) return;
        const target = safeRedirect(searchParams.get("redirect"), mode);
        if (target.startsWith("/dashboard")) prefetchPatientHome();
        router.replace(target);
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        if (!(reason instanceof ApiError) || reason.status !== 0) clearTokens();
        setStaleSession(true);
      });
    return () => {
      cancelled = true;
    };
  }, [signedIn, router, searchParams, mode]);

  // Both ends of the funnel are one tap away: fetch their code while the patient types.
  useEffect(() => {
    router.prefetch("/dashboard");
    router.prefetch(ROUTES.orientation);
  }, [router]);

  const [values, setValues] = useState<FormValues>({ nickname: "", email: "", password: "", confirmPassword: "" });
  const [phone, setPhone] = useState<PhoneValue>(() => ({ country: defaultCountry(language), national: "" }));
  const [error, setError] = useState("");
  const [errorField, setErrorField] = useState<FieldName | null>(null);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  // UI preference only — session persistence is unchanged until the backend exposes it.
  const [remember, setRemember] = useState(true);
  // Explicit, never pre-ticked: no consent, no account, so no Mira.
  const [consent, setConsent] = useState(false);

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

  /** Server failures in the visitor's language: the raw API text is English, so it is never shown as is. */
  const apiMessage = (err: unknown) => {
    if (err instanceof ApiError) {
      if (err.status === 0) return auth.errors.network;
      if (err.status === 401) return isSignUp ? auth.errors.generic : auth.errors.invalidCredentials;
      if (err.status === 409) return isSignUp ? auth.errors.emailTaken : auth.errors.generic;
      if (err.status === 429) return auth.errors.tooManyRequests;
      return auth.errors.generic;
    }
    if (err instanceof Error && err.message === "This account cannot sign in here.") return auth.errors.cannotSignInHere;
    return auth.errors.generic;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setError(""); setErrorField(null);
    if (isSignUp && !values.nickname.trim()) return fail("nickname", auth.errors.nickname);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) return fail("email", auth.errors.email);
    const e164 = isSignUp ? toE164(phone) : null;
    if (isSignUp && !e164) return fail("phone", phoneMessage(phoneStatus(phone)) ?? auth.errors.phone);
    // Sign-in only needs a password: the policy applies to new passwords, never to an existing account.
    if (!isSignUp && !values.password) return fail("password", auth.errors.passwordRequired);
    if (isSignUp && !passwordMeetsPolicy(values.password)) return fail("password", auth.errors.passwordRules);
    if (isSignUp && values.password !== values.confirmPassword) return fail("confirmPassword", auth.errors.confirmPassword);
    if (isSignUp && !consent) return fail("consent", auth.errors.consent);

    startTransition(() => {
      (async () => {
        const email = values.email.trim();
        try {
          const target = safeRedirect(searchParams.get("redirect"), mode);
          // No leftover session can ride along: only the answer to THIS request opens the space.
          clearTokens();
          const session = isSignUp
            ? await authApi.register({ nickname: values.nickname.trim(), email, phone: e164 ?? undefined, password: values.password, lang: language, consentVersion: CONSENT_VERSION })
            : await authApi.login(email, values.password);
          // Navigate only once the session is really established.
          if (!hasValidSession()) throw new Error("session-not-established");
          router.prefetch(target);
          if (session.user) setUser({ id: session.user.id, fullName: session.user.nickname || email, email, password: "", disease: "ADHD", createdAt: new Date().toISOString() });
          // The first screens' data loads in parallel with the navigation itself.
          if (target.startsWith("/dashboard")) prefetchPatientHome();
          router.push(target);
        } catch (err) {
          clearTokens();
          const message = apiMessage(err);
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
  const switchHref = `${isSignUp ? ROUTES.signIn : ROUTES.signUp}${carried.size ? `?${carried}` : ""}`;
  const from = searchParams.get("from");
  const notice = from === "orientation" || from === "lumina" ? auth.notice[from] : null;
  const switchPrompt = isSignUp ? auth.switchToSignIn : auth.subtitleSignIn;
  const switchLink = isSignUp ? auth.switchSignInLink : auth.subtitleSignInLink;

  if (signedIn === null || (signedIn && !staleSession)) return <AuthLoading />;

  return (
    <motion.section
      dir={direction}
      aria-labelledby="auth-title"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.slow, ease: EASE_OUT, delay: 0.1 }}
      className={AUTH_CARD}
    >
      <span aria-hidden className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
      {/* ── HEADING ──────────────────────────────────────────────────── */}
      <header>
        <p className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-3 py-1.5 text-[0.8125rem] font-medium text-ink-soft shadow-sm">
          <ShieldCheck className="size-3.5 text-teal-600" aria-hidden />
          {auth.badge}
        </p>
        <h1
          id="auth-title"
          className={cn(AUTH_TITLE, "mt-6")}
        >
          {isSignUp ? auth.titleSignUpA : auth.titleSignInA}{" "}
          <span className={ACCENT_LIGHT}>{isSignUp ? auth.titleSignUpB : auth.titleSignInB}</span>
        </h1>
        <p className="mt-3 text-[1rem] leading-7 text-ink-soft">
          {isSignUp ? auth.subtitleSignUp : auth.subtitleWelcome}
        </p>
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
      <motion.form
        key={mode}
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
            <Link href={ROUTES.forgotPassword} className={`${LINK_CLASS} inline-flex min-h-11 items-center text-[0.9375rem] font-medium`}>
              {auth.forgotPassword}
            </Link>
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
      </motion.form>

      {/* ── SWITCH + LEGAL ───────────────────────────────────────────── */}
      <footer className="mt-7 border-t border-line pt-6 text-center">
        <p className="text-[0.9375rem] text-ink-soft">
          {switchPrompt}{" "}
          <Link href={switchHref} className={LINK_CLASS}>
            {switchLink}
          </Link>
        </p>
        <p className="mx-auto mt-3 max-w-xs text-[0.8125rem] leading-5 text-ink-soft">{auth.legal}</p>
      </footer>
    </motion.section>
  );
}
