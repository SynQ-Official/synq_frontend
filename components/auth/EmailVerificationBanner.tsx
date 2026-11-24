"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { runResend, type ResendResult } from "@/lib/auth/verification";
import { emailVerificationApi } from "@/lib/api/email-verification";
import { familyApi } from "@/lib/family/api";
import { accountVerificationCopy } from "@/lib/i18n/accountVerification";

export type VerificationAudience = "patient" | "parent";

/** The resend call for the account type on screen: the patient's own session, or the parent's (never both). */
function requestVerificationEmail(audience: VerificationAudience) {
  return runResend(() => (audience === "parent" ? familyApi.resendVerification() : emailVerificationApi.resend()));
}

export type ResendState = "idle" | "sending" | ResendResult;

/** One resend at a time; the outcome drives the banner (and hides it once the address is already confirmed). */
export function useResendVerification(audience: VerificationAudience) {
  const [state, setState] = useState<ResendState>("idle");
  const resend = useCallback(async () => {
    setState("sending");
    setState(await requestVerificationEmail(audience));
  }, [audience]);
  return { state, resend };
}

const COLLAPSED_KEY = "synq.verifyBanner.collapsed";

/** Storage blocked or unavailable: the banner simply stays open. */
function readCollapsed(key: string): boolean {
  try {
    return window.sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

/**
 * A persistent, non-blocking notice that the signed-in account's e-mail is not confirmed yet. It never gates the app;
 * it may be folded away for the rest of the browser session only (sessionStorage), and it disappears once confirmed.
 */
export function EmailVerificationBanner({ audience }: { audience: VerificationAudience }) {
  const { language } = useLanguage();
  const copy = accountVerificationCopy[language].banner;
  const { state, resend } = useResendVerification(audience);
  // The banner only mounts once the account is known on the client, so reading storage here cannot mismatch the server.
  // Per audience: folding the patient's banner must not fold the parent's (they can share a browser session).
  const storageKey = `${COLLAPSED_KEY}:${audience}`;
  const [collapsed, setCollapsed] = useState(() => readCollapsed(storageKey));

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      window.sessionStorage.setItem(storageKey, next ? "1" : "0");
    } catch {
      // Storage blocked: the choice lasts until the page reloads.
    }
  };

  if (state === "alreadyVerified") return null;
  const sending = state === "sending";
  const outcome = state === "sent" ? copy.sent : state === "throttled" ? copy.throttled : state === "error" ? copy.error : null;

  return (
    <div role="status" className="mb-5 rounded-2xl border border-gold-100 bg-gold-50/90 px-4 py-3 text-ink">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium">{copy.title}</p>
        <button
          type="button"
          aria-expanded={!collapsed}
          onClick={toggle}
          className="inline-flex min-h-11 items-center rounded-md text-sm font-medium text-teal-700 underline-offset-4 hover:text-teal-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
        >
          {collapsed ? copy.expand : copy.collapse}
        </button>
      </div>
      {!collapsed && (
        <div className="mt-1.5">
          <p className="text-sm leading-6 text-ink-soft">{copy.body}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" size="sm" disabled={sending} aria-busy={sending} onClick={() => void resend()} className="min-h-11">
              {sending ? copy.sending : copy.resend}
            </Button>
            {outcome && <p className="text-sm leading-6 text-ink-soft">{outcome}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

/** Where a sensitive action was refused (EMAIL_NOT_VERIFIED): the reason and a one-tap resend. Login is never blocked by it. */
export function VerifyToUseNotice({ audience }: { audience: VerificationAudience }) {
  const { language } = useLanguage();
  const copy = accountVerificationCopy[language];
  const { state, resend } = useResendVerification(audience);
  const sending = state === "sending";
  const outcome = state === "sent" ? copy.banner.sent : state === "throttled" ? copy.banner.throttled : state === "error" ? copy.banner.error : null;

  return (
    <div role="alert" className="mt-3 rounded-2xl border border-gold-100 bg-gold-50/90 px-4 py-3 text-ink">
      <p className="text-sm font-medium">{copy.gate.message}</p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" size="sm" disabled={sending} aria-busy={sending} onClick={() => void resend()} className="min-h-11">
          {sending ? copy.banner.sending : copy.banner.resend}
        </Button>
        {outcome && <p className="text-sm leading-6 text-ink-soft">{outcome}</p>}
      </div>
    </div>
  );
}
