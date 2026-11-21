"use client";

import { CheckCircle2, Lock, Mail, MailWarning, TriangleAlert, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";
import { AuthLoading } from "@/components/auth/AuthLayout";
import { PasswordChecklist, passwordMeetsPolicy, passwordTooLong } from "@/components/auth/PasswordChecklist";
import { Alert, Badge, Card, LINK_CLASS, SubmitLabel, VisibilityToggle } from "@/components/auth/PasswordResetScreens";
import { LinkedText } from "@/components/legal/LegalLinks";
import { FormField, IconInput } from "@/components/shared/FormField";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useLanguage } from "@/contexts/LanguageContext";
import { authApi, hasPendingPasswordChange } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { ROUTES } from "@/lib/config/routes";
import { accountAccessCopy } from "@/lib/i18n/accountAccess";
import { LEGAL } from "@/config/legal";
import { legalUi } from "@/lib/i18n/legal";
import { CONSENT_VERSION } from "@/lib/patient/consent";
import { prefetchPatientHome } from "@/lib/patient/prefetch";

const NICKNAME_MIN = 2;
const NICKNAME_MAX = 30;
const CHECKBOX_CLASS =
  "mt-1 h-[1.125rem] w-[1.125rem] shrink-0 rounded-[0.3125rem] border-line-strong bg-white shadow-none transition-colors duration-200 hover:border-teal-400 focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 data-[state=checked]:border-primary [&_svg]:h-3 [&_svg]:w-3";

type PasswordField = "password" | "confirm";
type PasswordProblem = { field: PasswordField; message: string };
type AuthErrors = {
  passwordRules: string;
  passwordTooLong: string;
  network: string;
  tooManyRequests: string;
  unavailable: string;
  generic: string;
  forbidden: string;
};

/** The same new-password rules as sign-up and reset, checked before anything is sent. */
function checkPasswords(password: string, confirmation: string, mismatch: string, errors: AuthErrors): PasswordProblem | null {
  if (!passwordMeetsPolicy(password)) return { field: "password", message: errors.passwordRules };
  if (passwordTooLong(password)) return { field: "password", message: errors.passwordTooLong };
  if (password !== confirmation) return { field: "confirm", message: mismatch };
  return null;
}

/** The new password and its confirmation, with the checklist: the one pair both screens use. */
function PasswordPair({
  idPrefix,
  label,
  password,
  confirmation,
  onPassword,
  onConfirmation,
  problem,
  disabled,
  autoFocus,
}: {
  idPrefix: string;
  label: string;
  password: string;
  confirmation: string;
  onPassword: (value: string) => void;
  onConfirmation: (value: string) => void;
  problem: PasswordProblem | null;
  disabled: boolean;
  autoFocus?: boolean;
}) {
  const { dictionary } = useLanguage();
  const auth = dictionary.auth;
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const passwordId = `${idPrefix}-password`;
  const confirmId = `${idPrefix}-confirm`;
  return (
    <>
      <div>
        <FormField id={passwordId} label={label} error={problem?.field === "password" ? problem.message : null}>
          <IconInput
            id={passwordId}
            icon={Lock}
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => onPassword(event.target.value)}
            placeholder={auth.passwordPlaceholder}
            autoComplete="new-password"
            autoFocus={autoFocus}
            invalid={problem?.field === "password"}
            aria-describedby={`${passwordId}-rules`}
            disabled={disabled}
            trailing={<VisibilityToggle show={showPassword} toggle={() => setShowPassword((value) => !value)} label={showPassword ? auth.hidePassword : auth.showPassword} />}
          />
        </FormField>
        <PasswordChecklist id={`${passwordId}-rules`} value={password} copy={auth.passwordRules} />
      </div>
      <FormField id={confirmId} label={auth.confirmPassword} error={problem?.field === "confirm" ? problem.message : null}>
        <IconInput
          id={confirmId}
          icon={Lock}
          type={showConfirmation ? "text" : "password"}
          value={confirmation}
          onChange={(event) => onConfirmation(event.target.value)}
          placeholder={auth.confirmPasswordPlaceholder}
          autoComplete="new-password"
          invalid={problem?.field === "confirm"}
          disabled={disabled}
          trailing={<VisibilityToggle show={showConfirmation} toggle={() => setShowConfirmation((value) => !value)} label={showConfirmation ? auth.hideConfirm : auth.showConfirm} />}
        />
      </FormField>
    </>
  );
}

/** What a failed call to the API means for the patient, in their language. */
function failureMessage(error: unknown, errors: AuthErrors): string {
  if (error instanceof ApiError) {
    if (error.status === 0) return errors.network;
    if (error.status === 429) return errors.tooManyRequests;
    if (error.status === 403) return errors.forbidden;
    if (error.status >= 502 && error.status <= 504) return errors.unavailable;
  }
  return errors.generic;
}

const noSubscription = () => () => undefined;

/**
 * /auth/change-password: the first sign-in of an account a clinician created. The temporary password only opens this
 * step; the real session starts when the patient has chosen their own. The proof of the temporary password is held in
 * memory (see `lib/api/auth.ts`), so a reload or a direct visit lands on "please sign in again", never on a form that
 * cannot work.
 */
export function ChangePasswordScreen() {
  const router = useRouter();
  const { language, dictionary } = useLanguage();
  const auth = dictionary.auth;
  const copy = accountAccessCopy[language].changePassword;
  // null on the server, then true / false on the client: the proof exists in this tab's memory or it does not.
  const held = useSyncExternalStore(noSubscription, hasPendingPasswordChange, () => null);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [problem, setProblem] = useState<PasswordProblem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    router.prefetch(ROUTES.dashboard);
  }, [router]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (pending) return; // one request at a time: a double tap must not send the change twice
    setError(null);
    const found = checkPasswords(password, confirmation, copy.mismatch, auth.errors);
    setProblem(found);
    if (found) {
      document.getElementById(`change-${found.field}`)?.focus();
      return;
    }
    setPending(true);
    try {
      await authApi.completePasswordChange(password, confirmation);
      setPassword("");
      setConfirmation("");
      prefetchPatientHome();
      // The dashboard's gate sends the patient on from there (welcome, or Mira when no track is set yet).
      router.replace(ROUTES.dashboard);
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 401) setExpired(true);
      else if (reason instanceof ApiError && reason.status === 400) setProblem({ field: "password", message: copy.rejected });
      else setError(failureMessage(reason, auth.errors));
      setPending(false);
    }
  };

  if (held === null) return <AuthLoading />;

  if (!held || expired) {
    return (
      <Card
        title={copy.expiredTitle}
        icon={
          <Badge tone="gold">
            <TriangleAlert className="size-6" />
          </Badge>
        }
      >
        <p role="alert" className="text-[1.0625rem] leading-7 text-ink-soft">
          {copy.expiredBody}
        </p>
        <Button asChild variant="auth" size="lg" className="min-h-14">
          <Link href={`${ROUTES.signIn}?role=patient`}>{copy.backToSignIn}</Link>
        </Button>
      </Card>
    );
  }

  return (
    <Card title={copy.title}>
      <p className="text-[1.0625rem] leading-7 text-ink-soft">{copy.subtitle}</p>
      {error && <Alert>{error}</Alert>}
      <form onSubmit={submit} noValidate className="flex flex-col gap-5" aria-busy={pending}>
        <PasswordPair
          idPrefix="change"
          label={copy.newPassword}
          password={password}
          confirmation={confirmation}
          onPassword={setPassword}
          onConfirmation={setConfirmation}
          problem={problem}
          disabled={pending}
          autoFocus
        />
        <Button type="submit" variant="auth" size="lg" disabled={pending} aria-busy={pending} className="group min-h-14 hover:shadow-[0_18px_36px_-14px_rgb(17_76_97/0.65)]">
          <SubmitLabel pending={pending} label={copy.submit} busy={auth.processing} />
        </Button>
      </form>
    </Card>
  );
}

export type InvitationView =
  | { state: "usable"; email: string; token: string }
  | { state: "invalid" }
  | { state: "unavailable" };

type InvitationField = "nickname" | PasswordField | "terms";

/**
 * /invitation: the page a clinician's invitation e-mail leads to. The link was checked on the server before this
 * renders (`checkInvitation`); the address is the one the invitation was sent to and cannot be changed, because the API
 * only accepts that one. The token travelled in the URL once and is removed from the address bar.
 */
export function InvitationScreen({ view }: { view: InvitationView }) {
  const router = useRouter();
  const { language, dictionary } = useLanguage();
  const auth = dictionary.auth;
  const copy = accountAccessCopy[language].invitation;
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  // Not pre-ticked. Only Mira needs it, and Mira asks again when it is missing, so it is optional here.
  const [consent, setConsent] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [field, setField] = useState<{ id: InvitationField; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [unusable, setUnusable] = useState(false);
  const [existing, setExisting] = useState(false);

  useEffect(() => {
    if (view.state === "usable") window.history.replaceState(null, "", window.location.pathname);
  }, [view.state]);
  useEffect(() => {
    router.prefetch(ROUTES.dashboard);
    router.prefetch(ROUTES.orientation);
  }, [router]);

  const fail = (id: InvitationField, message: string) => {
    setField({ id, message });
    document.getElementById(id === "nickname" ? "invite-nickname" : id === "terms" ? "invite-terms" : `invite-${id}`)?.focus();
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (pending || view.state !== "usable") return;
    setError(null);
    setField(null);
    const name = nickname.trim();
    if (name.length < NICKNAME_MIN || name.length > NICKNAME_MAX) return fail("nickname", auth.errors.nicknameLength);
    const found = checkPasswords(password, confirmation, copy.mismatch, auth.errors);
    if (found) return fail(found.field, found.message);
    if (!agreed) return fail("terms", legalUi[language].agreeError);

    setPending(true);
    try {
      const next = await authApi.acceptInvitation({
        token: view.token,
        email: view.email,
        nickname: name,
        password,
        confirmPassword: confirmation,
        lang: language,
        consentVersion: consent ? CONSENT_VERSION : undefined,
      });
      setPassword("");
      setConfirmation("");
      const target = next === "TRACK" ? ROUTES.dashboard : ROUTES.orientation;
      if (target === ROUTES.dashboard) prefetchPatientHome();
      router.replace(target);
    } catch (reason) {
      setPending(false);
      if (reason instanceof ApiError) {
        if (reason.code === "INVITATION_INVALID") return setUnusable(true);
        if (reason.code === "ACCOUNT_EXISTS") return setExisting(true);
        if (reason.code === "NICKNAME_TAKEN") return fail("nickname", copy.nicknameTaken);
        if (reason.status === 400) return setError(auth.errors.validation);
      }
      setError(failureMessage(reason, auth.errors));
    }
  };

  if (view.state === "unavailable") {
    return (
      <Card
        title={copy.unavailableTitle}
        icon={
          <Badge tone="gold">
            <MailWarning className="size-6" />
          </Badge>
        }
      >
        <p role="alert" className="text-[1.0625rem] leading-7 text-ink-soft">
          {copy.unavailableBody}
        </p>
        <Button type="button" variant="auth" size="lg" className="min-h-14" onClick={() => router.refresh()}>
          {copy.retry}
        </Button>
      </Card>
    );
  }

  if (view.state === "invalid" || unusable) {
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
        <Link href={`${ROUTES.signIn}?role=patient`} className={`${LINK_CLASS} inline-flex min-h-11 items-center justify-center text-[0.9375rem]`}>
          {copy.goToSignIn}
        </Link>
      </Card>
    );
  }

  if (existing) {
    return (
      <Card
        title={copy.accountExists}
        icon={
          <Badge tone="teal">
            <CheckCircle2 className="size-6" />
          </Badge>
        }
      >
        <Button asChild variant="auth" size="lg" className="min-h-14">
          <Link href={`${ROUTES.signIn}?role=patient`}>{copy.goToSignIn}</Link>
        </Button>
      </Card>
    );
  }

  return (
    <Card title={copy.title}>
      <p className="text-[1.0625rem] leading-7 text-ink-soft">{copy.subtitle}</p>
      {error && <Alert>{error}</Alert>}
      <form onSubmit={submit} noValidate className="flex flex-col gap-5" aria-busy={pending}>
        <FormField id="invite-email" label={copy.forEmail} hint={copy.emailNote}>
          <IconInput id="invite-email" icon={Mail} type="email" dir="ltr" value={view.email} readOnly aria-readonly autoComplete="email" />
        </FormField>
        <FormField id="invite-nickname" label={auth.nickname} error={field?.id === "nickname" ? field.message : null}>
          <IconInput
            id="invite-nickname"
            icon={UserRound}
            type="text"
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            placeholder={auth.nicknamePlaceholder}
            autoComplete="nickname"
            minLength={NICKNAME_MIN}
            maxLength={NICKNAME_MAX}
            autoFocus
            invalid={field?.id === "nickname"}
            disabled={pending}
          />
        </FormField>
        <PasswordPair
          idPrefix="invite"
          label={auth.password}
          password={password}
          confirmation={confirmation}
          onPassword={setPassword}
          onConfirmation={setConfirmation}
          problem={field && (field.id === "password" || field.id === "confirm") ? { field: field.id, message: field.message } : null}
          disabled={pending}
        />
        <label htmlFor="invite-consent" className="flex cursor-pointer select-none items-start gap-3 text-[0.9375rem] leading-6 text-ink-soft">
          <Checkbox id="invite-consent" name="consent" checked={consent} onCheckedChange={(state) => setConsent(state === true)} className={CHECKBOX_CLASS} />
          <span>
            <span className="me-1.5 text-[0.8125rem] font-medium text-ink-muted">({copy.consentOptional})</span>
            {auth.consent.label}
          </span>
        </label>
        <div>
          <div className="flex items-start gap-3 text-[0.9375rem] leading-6 text-ink-soft">
            <Checkbox
              id="invite-terms"
              name="terms"
              checked={agreed}
              aria-labelledby="invite-terms-label"
              aria-invalid={field?.id === "terms"}
              aria-describedby={field?.id === "terms" ? "invite-terms-error" : undefined}
              onCheckedChange={(state) => {
                setAgreed(state === true);
                if (field?.id === "terms") setField(null);
              }}
              className={CHECKBOX_CLASS}
            />
            {/* Not a <label>: a click on the two links must open the pages, not toggle the box. */}
            <p id="invite-terms-label">
              <LinkedText
                template={legalUi[language].agree + (LEGAL.version ? legalUi[language].agreeVersion.replace("{version}", LEGAL.version) : "")}
                links={{
                  terms: <Link href={ROUTES.terms} target="_blank" className={LINK_CLASS}>{legalUi[language].terms}</Link>,
                  privacy: <Link href={ROUTES.privacy} target="_blank" className={LINK_CLASS}>{legalUi[language].privacyPolicy}</Link>,
                }}
              />
            </p>
          </div>
          {field?.id === "terms" && (
            <p id="invite-terms-error" role="alert" className="mt-2 text-[0.8125rem] leading-5 text-rose-700">{field.message}</p>
          )}
        </div>
        <Button type="submit" variant="auth" size="lg" disabled={pending} aria-busy={pending} className="group min-h-14 hover:shadow-[0_18px_36px_-14px_rgb(17_76_97/0.65)]">
          <SubmitLabel pending={pending} label={copy.submit} busy={auth.processing} />
        </Button>
      </form>
    </Card>
  );
}
