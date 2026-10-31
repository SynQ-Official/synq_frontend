"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, Lock, Mail, MailCheck, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { AUTH_CARD, AUTH_TITLE } from "@/components/auth/AuthLayout";
import { PasswordChecklist, passwordMeetsPolicy } from "@/components/auth/PasswordChecklist";
import { FormField, IconInput } from "@/components/shared/FormField";
import { LogoSpinner } from "@/components/shared/LogoLoader";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { passwordResetApi, resetFailure } from "@/lib/api/password-reset";
import { ROUTES } from "@/lib/config/routes";
import { DURATION, EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { PASSWORD_MAX_BYTES, passwordResetCopy } from "@/lib/i18n/passwordReset";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_AFTER_SECONDS = 60;
const LINK_CLASS = "rounded-md font-semibold text-teal-700 underline-offset-4 transition-colors duration-200 hover:text-teal-800 hover:underline";

function Card({ icon, title, children }: { icon?: ReactNode; title: string; children: ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.base, ease: EASE_OUT }}
      className={cn(AUTH_CARD, "flex flex-col gap-6")}
    >
      <span aria-hidden className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
      <header className="flex flex-col gap-3">
        {icon}
        <h1 className={cn(AUTH_TITLE, "text-balance")}>{title}</h1>
      </header>
      {children}
    </motion.section>
  );
}

const Badge = ({ tone, children }: { tone: "teal" | "gold"; children: ReactNode }) => (
  <span
    aria-hidden
    className={`flex size-12 items-center justify-center rounded-2xl ${tone === "teal" ? "bg-teal-50 text-teal-700" : "bg-gold-100 text-gold-700"}`}
  >
    {children}
  </span>
);

function Alert({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[0.9375rem] leading-6 text-rose-700">
      {children}
    </p>
  );
}

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

function SubmitLabel({ pending, label, busy }: { pending: boolean; label: string; busy: string }) {
  return pending ? (
    <>
      <LogoSpinner size={18} />
      <span>{busy}</span>
    </>
  ) : (
    <>
      <span>{label}</span>
      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" aria-hidden />
    </>
  );
}

export function ForgotPasswordScreen() {
  const { language, dictionary } = useLanguage();
  const auth = dictionary.auth;
  const copy = passwordResetCopy[language].forgot;
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (wait <= 0) return;
    const timer = window.setTimeout(() => setWait((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [wait]);

  const send = async (address: string) => {
    setPending(true);
    setError(null);
    try {
      await passwordResetApi.forgot(address);
      setSentTo(address);
      setWait(RESEND_AFTER_SECONDS);
    } catch (reason) {
      setError(resetFailure(reason) === "rate_limited" ? copy.tooMany : copy.unavailable);
    } finally {
      setPending(false);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const address = email.trim();
    if (!EMAIL_RE.test(address)) {
      setFieldError(auth.errors.email);
      document.getElementById("reset-email")?.focus();
      return;
    }
    setFieldError(null);
    void send(address);
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      {sentTo ? (
        <Card
          key="sent"
          title={copy.sentTitle}
          icon={
            <Badge tone="teal">
              <MailCheck className="size-6" />
            </Badge>
          }
        >
          <p role="status" className="text-[1.0625rem] leading-7 text-ink-soft">
            {copy.sentBody}
          </p>
          {error && <Alert>{error}</Alert>}
          <div className="flex flex-col gap-3">
            <Button type="button" variant="outline" size="lg" disabled={wait > 0 || pending} onClick={() => void send(sentTo)} className="min-h-12">
              {wait > 0 ? copy.resendIn(wait) : copy.resend}
            </Button>
            <Link href={ROUTES.signIn} className={`${LINK_CLASS} inline-flex min-h-11 items-center justify-center gap-2 text-[0.9375rem]`}>
              <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
              {copy.back}
            </Link>
          </div>
        </Card>
      ) : (
        <Card key="form" title={copy.title}>
          <p className="text-[1.0625rem] leading-7 text-ink-soft">{copy.subtitle}</p>
          {error && <Alert>{error}</Alert>}
          <form onSubmit={submit} noValidate className="flex flex-col gap-5">
            <FormField id="reset-email" label={auth.email} error={fieldError}>
              <IconInput
                id="reset-email"
                icon={Mail}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={auth.emailPlaceholder}
                autoComplete="email"
                inputMode="email"
                autoFocus
                invalid={Boolean(fieldError)}
                disabled={pending}
              />
            </FormField>
            <Button
              type="submit"
              variant="auth"
              size="lg"
              disabled={pending}
              aria-busy={pending}
              className="group min-h-14 hover:shadow-[0_18px_36px_-14px_rgb(17_76_97/0.65)]"
            >
              <SubmitLabel pending={pending} label={copy.submit} busy={dictionary.auth.processing} />
            </Button>
          </form>
          <Link href={ROUTES.signIn} className={`${LINK_CLASS} inline-flex min-h-11 items-center justify-center gap-2 text-[0.9375rem]`}>
            <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
            {copy.back}
          </Link>
        </Card>
      )}
    </AnimatePresence>
  );
}

/**
 * `token` is null when the server already found the link unusable (missing, malformed, expired, used). The token
 * travelled in the URL once; it is removed from the address bar so it is not kept in the history.
 */
export function ResetPasswordScreen({ token }: { token: string | null }) {
  const { language, dictionary } = useLanguage();
  const auth = dictionary.auth;
  const copy = passwordResetCopy[language].reset;
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [field, setField] = useState<{ id: "reset-password" | "reset-confirm"; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [unusable, setUnusable] = useState(token === null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  const fail = (id: "reset-password" | "reset-confirm", message: string) => {
    setField({ id, message });
    document.getElementById(id)?.focus();
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setError(null);
    setField(null);
    if (!passwordMeetsPolicy(password)) return fail("reset-password", auth.errors.passwordRules);
    if (new TextEncoder().encode(password).length > PASSWORD_MAX_BYTES) return fail("reset-password", copy.tooLong);
    if (password !== confirmation) return fail("reset-confirm", copy.mismatch);

    setPending(true);
    try {
      await passwordResetApi.reset(token, password, confirmation);
      setPassword("");
      setConfirmation("");
      setDone(true);
    } catch (reason) {
      const kind = resetFailure(reason);
      if (kind === "invalid_link") setUnusable(true);
      else setError(kind === "rate_limited" ? copy.tooMany : kind === "validation" ? auth.errors.passwordRules : copy.unavailable);
    } finally {
      setPending(false);
    }
  };

  if (done) {
    return (
      <Card
        title={copy.doneTitle}
        icon={
          <Badge tone="teal">
            <CheckCircle2 className="size-6" />
          </Badge>
        }
      >
        <p role="status" className="text-[1.0625rem] leading-7 text-ink-soft">
          {copy.doneBody}
        </p>
        <Button asChild variant="auth" size="lg" className="min-h-14">
          <Link href={ROUTES.signIn}>{copy.goToSignIn}</Link>
        </Button>
      </Card>
    );
  }

  if (unusable) {
    return (
      <Card
        title={copy.invalidTitle}
        icon={
          <Badge tone="gold">
            <TriangleAlert className="size-6" />
          </Badge>
        }
      >
        <p role="alert" className="text-[1.0625rem] leading-7 text-ink-soft">
          {copy.invalidBody}
        </p>
        <Button asChild variant="auth" size="lg" className="min-h-14">
          <Link href={ROUTES.forgotPassword}>{copy.requestNew}</Link>
        </Button>
        <Link href={ROUTES.signIn} className={`${LINK_CLASS} inline-flex min-h-11 items-center justify-center text-[0.9375rem]`}>
          {copy.backToSignIn}
        </Link>
      </Card>
    );
  }

  return (
    <Card title={copy.title}>
      <p className="text-[1.0625rem] leading-7 text-ink-soft">{copy.subtitle}</p>
      {error && <Alert>{error}</Alert>}
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <div>
          <FormField id="reset-password" label={copy.newPassword} error={field?.id === "reset-password" ? field.message : null}>
            <IconInput
              id="reset-password"
              icon={Lock}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={auth.passwordPlaceholder}
              autoComplete="new-password"
              autoFocus
              invalid={field?.id === "reset-password"}
              aria-describedby="reset-password-rules"
              disabled={pending}
              trailing={<VisibilityToggle show={showPassword} toggle={() => setShowPassword((p) => !p)} label={showPassword ? auth.hidePassword : auth.showPassword} />}
            />
          </FormField>
          <PasswordChecklist id="reset-password-rules" value={password} copy={auth.passwordRules} />
        </div>
        <FormField id="reset-confirm" label={auth.confirmPassword} error={field?.id === "reset-confirm" ? field.message : null}>
          <IconInput
            id="reset-confirm"
            icon={Lock}
            type={showConfirmation ? "text" : "password"}
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder={auth.confirmPasswordPlaceholder}
            autoComplete="new-password"
            invalid={field?.id === "reset-confirm"}
            disabled={pending}
            trailing={<VisibilityToggle show={showConfirmation} toggle={() => setShowConfirmation((p) => !p)} label={showConfirmation ? auth.hidePassword : auth.showPassword} />}
          />
        </FormField>
        <Button
          type="submit"
          variant="auth"
          size="lg"
          disabled={pending}
          aria-busy={pending}
          className="group min-h-14 hover:shadow-[0_18px_36px_-14px_rgb(17_76_97/0.65)]"
        >
          <SubmitLabel pending={pending} label={copy.submit} busy={auth.processing} />
        </Button>
      </form>
    </Card>
  );
}
