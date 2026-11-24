"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, MailCheck, TriangleAlert } from "lucide-react";
import { Badge, Card } from "@/components/auth/PasswordResetScreens";
import { useResendVerification, type VerificationAudience } from "@/components/auth/EmailVerificationBanner";
import { LogoSpinner } from "@/components/shared/LogoLoader";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { ensureSession } from "@/lib/api/client";
import { emailVerificationApi } from "@/lib/api/email-verification";
import { verifyFailure } from "@/lib/auth/verification";
import { ensureFamilySession } from "@/lib/family/session";
import { familyApi } from "@/lib/family/api";
import { FAMILY_HOME, signInHref } from "@/lib/config/auth-role";
import { ROUTES } from "@/lib/config/routes";
import { accountVerificationCopy } from "@/lib/i18n/accountVerification";

type Phase = "verifying" | "verified" | "invalid" | "unavailable";

/** The shape the API accepts for a verification token (43 URL-safe characters). */
const TOKEN_SHAPE = /^[A-Za-z0-9_-]{43}$/;

/**
 * The page behind the link in a verification e-mail. The token is read once, the address bar is cleaned straight away,
 * and the one-time call is made once (the ref survives React's double effect run in development).
 */
export function VerifyEmailScreen({ audience }: { audience: VerificationAudience }) {
  const { language } = useLanguage();
  const copy = accountVerificationCopy[language].verify;
  const [phase, setPhase] = useState<Phase>("verifying");
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const { state: resendState, resend } = useResendVerification(audience);
  const started = useRef(false);

  // Resending for an address that is already confirmed means the job is done: show the done state, not a silent no-op.
  const shown: Phase = resendState === "alreadyVerified" ? "verified" : phase;

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const token = new URLSearchParams(window.location.search).get("token")?.trim() ?? "";
    window.history.replaceState(null, "", window.location.pathname);

    const verify = (value: string) => (audience === "parent" ? familyApi.verifyEmail(value) : emailVerificationApi.verify(value));
    const fail = async (kind: "invalid" | "unavailable") => {
      setPhase(kind);
      // A signed-in visitor with a stale link can ask for a fresh one; a signed-out one is pointed at sign-in.
      const ok = audience === "parent" ? await ensureFamilySession() : await ensureSession();
      setSignedIn(ok);
    };

    if (!TOKEN_SHAPE.test(token)) {
      void fail("invalid");
      return;
    }
    verify(token)
      .then(() => setPhase("verified"))
      .catch((error: unknown) => void fail(verifyFailure(error)));
  }, [audience]);

  const continueHref = audience === "parent" ? FAMILY_HOME : ROUTES.dashboard;
  const resendMessage =
    resendState === "sent" ? copy.resendSent : resendState === "throttled" ? copy.resendThrottled : resendState === "error" ? copy.resendError : null;

  if (shown === "verifying") {
    return (
      <Card title={copy.title}>
        <p role="status" className="flex items-center gap-3 text-[1.0625rem] leading-7 text-ink-soft">
          <LogoSpinner size={18} />
          <span>{copy.verifying}</span>
        </p>
      </Card>
    );
  }

  if (shown === "verified") {
    return (
      <Card
        title={copy.doneTitle}
        icon={
          <Badge tone="teal">
            <CheckCircle2 className="size-6" />
          </Badge>
        }
      >
        <p role="status" className="text-[1.0625rem] leading-7 text-ink-soft">{copy.doneBody}</p>
        <Button asChild variant="auth" size="lg" className="min-h-14">
          <Link href={continueHref}>{copy.continue}</Link>
        </Button>
      </Card>
    );
  }

  const expired = shown === "invalid";
  return (
    <Card
      title={expired ? copy.invalidTitle : copy.title}
      icon={
        <Badge tone="gold">
          {expired ? <TriangleAlert className="size-6" /> : <MailCheck className="size-6" />}
        </Badge>
      }
    >
      <p role="alert" className="text-[1.0625rem] leading-7 text-ink-soft">
        {expired ? copy.invalidBody : copy.unavailableBody}
      </p>
      {signedIn === true ? (
        <>
          <Button type="button" variant="auth" size="lg" disabled={resendState === "sending"} aria-busy={resendState === "sending"} onClick={() => void resend()} className="min-h-14">
            {copy.resend}
          </Button>
          {resendMessage && <p role="status" className="text-[0.9375rem] leading-6 text-ink-soft">{resendMessage}</p>}
        </>
      ) : signedIn === false ? (
        <Button asChild variant="auth" size="lg" className="min-h-14">
          <Link href={signInHref(audience)}>{copy.signIn}</Link>
        </Button>
      ) : null}
    </Card>
  );
}
