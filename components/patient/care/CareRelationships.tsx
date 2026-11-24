"use client";

import { useState } from "react";
import { HeartHandshake } from "lucide-react";
import { GlassCard, Skeleton } from "@/components/patient/ui/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useConsents, useRequestCare } from "@/hooks/patient/useCare";
import { usePatientCopy } from "@/hooks/usePatientCopy";
import { ApiError } from "@/lib/api/client";
import type { Consent } from "@/lib/api/patient-types";
import { fill } from "@/lib/i18n/patient";
import { VerifyToUseNotice } from "@/components/auth/EmailVerificationBanner";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REASON_MAX = 500;

/** "Ask a clinician to follow you": the answer is neutral by design, whatever the address is. */
export function CareRequestCard() {
  const s = usePatientCopy().care.relationships;
  const { request, sending } = useRequestCare();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sent" | "invalid" | "adultsOnly" | "limited" | "error" | "unverified">("idle");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (sending) return;
    const address = email.trim();
    if (!EMAIL_PATTERN.test(address)) return setStatus("invalid");
    setStatus("idle");
    try {
      await request(address);
      setEmail("");
      setStatus("sent");
    } catch (error) {
      if (error instanceof ApiError && error.code === "EMAIL_NOT_VERIFIED") setStatus("unverified");
      else if (error instanceof ApiError && error.status === 403) setStatus("adultsOnly");
      else if (error instanceof ApiError && error.status === 429) setStatus("limited");
      else setStatus("error");
    }
  }

  return (
    <GlassCard aria-labelledby="care-request-title" className="mb-5 p-5">
      <h2 id="care-request-title" className="text-base text-ink">{s.requestTitle}</h2>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.requestBody}</p>
      <form onSubmit={submit} noValidate className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <label htmlFor="care-request-email" className="mb-1.5 block text-sm font-medium text-ink">{s.emailLabel}</label>
          <Input
            id="care-request-email"
            type="email"
            dir="ltr"
            autoComplete="email"
            inputMode="email"
            value={email}
            placeholder={s.emailPlaceholder}
            onChange={(event) => { setEmail(event.target.value); setStatus("idle"); }}
            aria-invalid={status === "invalid"}
            aria-describedby="care-request-status"
            className="field-soft px-4"
          />
        </div>
        <Button type="submit" disabled={sending || email.trim().length === 0}>
          <HeartHandshake className="size-4" aria-hidden />
          {sending ? s.requestSending : s.requestSubmit}
        </Button>
      </form>
      <p id="care-request-status" role="status" className="mt-3 text-sm leading-relaxed text-ink-soft">
        {status === "sent" ? s.requestSent : status === "invalid" ? s.invalidEmail : status === "adultsOnly" ? s.requestAdultsOnly : status === "limited" ? s.requestLimited : status === "error" ? s.requestError : ""}
      </p>
      {status === "unverified" && <VerifyToUseNotice audience="patient" />}
    </GlassCard>
  );
}

/** A relationship the patient can end, or a request of theirs they can cancel, with an explicit confirm step. */
function RelationshipRow({ consent, onNotice }: { consent: Consent; onNotice: (text: string) => void }) {
  const s = usePatientCopy().care.relationships;
  const { endCare, refresh } = useConsents();
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const name = `${consent.clinician.firstName} ${consent.clinician.lastName}`.trim();
  const isRequest = consent.status === "PENDING" && consent.requestedByPatientAt !== null;

  async function confirm() {
    setBusy(true);
    setFailed(false);
    try {
      await endCare(consent.assignmentId, reason.trim() || undefined);
      setConfirming(false);
      setReason("");
      onNotice(isRequest ? s.cancelled : s.ended);
    } catch (error) {
      if (error instanceof ApiError && (error.status === 404 || error.status === 409)) {
        // The relationship changed on the server meanwhile: show what it is now.
        setConfirming(false);
        onNotice(s.notOpen);
        void refresh();
      } else {
        setFailed(true);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="rounded-2xl border border-white/80 bg-white/65 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm text-ink" dir="auto">{name}</p>
          <p className="text-xs text-muted-foreground" dir="auto">{consent.clinician.role}</p>
        </div>
        {isRequest && <span className="chip chip-pending">{s.waiting}</span>}
      </div>

      {!confirming ? (
        <Button className="mt-3" size="sm" variant="outline" disabled={busy} onClick={() => setConfirming(true)}>
          {isRequest ? s.cancelAction : s.endAction}
        </Button>
      ) : (
        <div className="mt-3 rounded-xl bg-rose-50/60 p-3">
          <p className="text-sm font-medium text-ink">{isRequest ? s.cancelTitle : s.endTitle}</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-soft">{isRequest ? s.cancelBody : s.endBody}</p>
          <label htmlFor={`${consent.assignmentId}-reason`} className="mt-3 block text-xs font-medium text-ink">{s.reasonLabel}</label>
          <Textarea
            id={`${consent.assignmentId}-reason`}
            value={reason}
            maxLength={REASON_MAX}
            rows={2}
            disabled={busy}
            aria-describedby={`${consent.assignmentId}-reason-hint`}
            onChange={(event) => setReason(event.target.value)}
            className="mt-1 bg-white/80"
          />
          <p id={`${consent.assignmentId}-reason-hint`} className="mt-1 flex justify-between gap-2 text-xs text-muted-foreground">
            <span>{s.reasonHint}</span>
            <span>{fill(s.reasonMax, { n: reason.length })}</span>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="destructive" disabled={busy} onClick={() => void confirm()}>
              {isRequest ? s.confirmCancel : s.confirmEnd}
            </Button>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => { setConfirming(false); setReason(""); }}>{s.keep}</Button>
          </div>
        </div>
      )}
      {failed && <p role="alert" className="mt-2 text-xs text-rose-700">{s.endError}</p>}
    </li>
  );
}

/** The patient's current care relationships (PENDING or ACTIVE), each with its end or cancel action. */
export function CareRelationships() {
  const s = usePatientCopy().care.relationships;
  const consents = useConsents();
  // Lives here, not in the row: the row disappears when the list refetches, and the outcome must stay visible.
  const [notice, setNotice] = useState("");
  if (!consents.data) return consents.error ? null : <Skeleton className="mb-5 h-20" />;
  const open = consents.data.filter((consent) => consent.status === "PENDING" || consent.status === "ACTIVE");
  if (open.length === 0) return null;
  return (
    <GlassCard as="section" aria-labelledby="care-relationships-title" className="mb-5 p-5">
      <h2 id="care-relationships-title" className="text-base text-ink">{s.title}</h2>
      <p role="status" className="mt-2 min-h-4 text-xs text-teal-700">{notice}</p>
      <ul className="mt-3 space-y-3">
        {open.map((consent) => <RelationshipRow key={consent.assignmentId} consent={consent} onNotice={setNotice} />)}
      </ul>
    </GlassCard>
  );
}
