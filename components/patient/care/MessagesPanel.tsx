"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import Link from "next/link";
import { CheckCheck, MessageCircleHeart, ShieldAlert } from "lucide-react";
import { EmptyState, ErrorState, GlassCard, Skeleton } from "@/components/patient/ui/primitives";
import { LogoSpinner } from "@/components/shared/LogoLoader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { useConsents, useConversation, useSendMessage } from "@/hooks/patient/useCare";
import { usePatientCopy } from "@/hooks/usePatientCopy";
import { ApiError } from "@/lib/api/client";
import type { Consent, SecureMessage } from "@/lib/api/patient-types";
import { fill } from "@/lib/i18n/patient";
import { formatDay } from "@/lib/patient/format";
import { bubbleKind } from "@/lib/patient/messages";
import { cn } from "@/lib/utils";

/** The API's own limit for one message. */
const MAX_LENGTH = 4000;

const clinicianName = (consent: Consent) => `${consent.clinician.firstName} ${consent.clinician.lastName}`.trim();

function Bubble({ message }: { message: SecureMessage }) {
  const copy = usePatientCopy().care.messages;
  const { language } = useLanguage();
  const kind = bubbleKind(message.senderRole);
  const mine = kind === "mine";
  const when = formatDay(message.createdAt, language, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  // From the platform, not from a person: a neutral, centred note that never carries the clinician's name.
  if (kind === "system") {
    return (
      <li className="flex flex-col items-center gap-1">
        <div dir="auto" className="max-w-[90%] whitespace-pre-wrap break-words rounded-2xl border border-dashed border-teal-200 bg-teal-50/60 px-4 py-2 text-center text-sm leading-relaxed text-ink-soft">
          {message.content}
        </div>
        <p className="flex items-center gap-1.5 px-1 text-[0.6875rem] text-muted-foreground">
          <span>{copy.system}</span>
          <span aria-hidden>·</span>
          <time dateTime={message.createdAt}>{when}</time>
        </p>
      </li>
    );
  }
  return (
    <li className={cn("flex flex-col gap-1", mine ? "items-end" : "items-start")}>
      <div
        dir="auto"
        className={cn(
          "max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          mine ? "rounded-ee-md bg-teal-700 text-white" : "rounded-es-md border border-white/80 bg-white/80 text-ink",
        )}
      >
        {message.content}
      </div>
      <p className="flex items-center gap-1.5 px-1 text-[0.6875rem] text-muted-foreground">
        <span>{mine ? copy.you : copy.clinician}</span>
        <span aria-hidden>·</span>
        <time dateTime={message.createdAt}>{when}</time>
        {mine && message.readAt && (
          <span className="inline-flex items-center gap-1 text-sage-700">
            <CheckCheck className="size-3" aria-hidden />
            {copy.read}
          </span>
        )}
      </p>
    </li>
  );
}

/**
 * The secure conversation with a clinician the patient shares with (an ACTIVE relationship they accepted). It always
 * says, above the box where the patient writes, that messages are not read around the clock and that this is not an
 * emergency service, and points to SOS. Nothing is shown as sent until the API stored it.
 */
export function MessagesPanel() {
  const copy = usePatientCopy().care.messages;
  const consents = useConsents();
  const open = (consents.data ?? []).filter((consent) => consent.status === "ACTIVE" && consent.consentedAt);
  const waitingOnPatient = (consents.data ?? []).some((consent) => !consent.consentedAt);
  const [chosen, setChosen] = useState<string | null>(null);
  const assignmentId = open.find((consent) => consent.assignmentId === chosen)?.assignmentId ?? open[0]?.assignmentId ?? null;
  const conversation = useConversation(assignmentId);
  const { send, sending } = useSendMessage();
  const [draft, setDraft] = useState("");
  const [problem, setProblem] = useState<"failed" | "closed" | null>(null);
  const thread = useRef<HTMLOListElement>(null);
  const messages = conversation.data?.messages;

  // The newest message is always in view inside the thread's own scroll area (the page itself is never moved).
  useEffect(() => {
    const element = thread.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [messages?.length]);

  if (consents.error && !consents.data) return <ErrorState message={copy.loadError} onRetry={() => void consents.refresh()} />;
  if (!consents.data) return <Skeleton className="h-72" />;

  if (!assignmentId) {
    return waitingOnPatient ? (
      <EmptyState
        icon={ShieldAlert}
        title={copy.pendingTitle}
        body={copy.pendingBody}
        action={<Button asChild size="sm"><Link href="/dashboard/settings">{copy.pendingCta}</Link></Button>}
      />
    ) : (
      <EmptyState icon={MessageCircleHeart} title={copy.noTeamTitle} body={copy.noTeamBody} />
    );
  }

  const text = draft.trim();
  const notice = conversation.data?.notice;

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    if (!assignmentId || !text || sending) return;
    setProblem(null);
    try {
      if (await send(assignmentId, text)) setDraft("");
    } catch (error) {
      // The draft stays: nothing the patient wrote is lost on a failure.
      setProblem(error instanceof ApiError && error.isConflict ? "closed" : "failed");
    }
  }

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) void submit();
  };

  return (
    <GlassCard aria-label={copy.title} className="flex flex-col gap-4">
      {open.length > 1 ? (
        <div>
          <label htmlFor="care-clinician" className="mb-1.5 block text-sm font-medium text-ink">{copy.chooseClinician}</label>
          <select
            id="care-clinician"
            value={assignmentId}
            onChange={(event) => setChosen(event.target.value)}
            className="field-soft w-full px-4 text-sm"
          >
            {open.map((consent) => <option key={consent.assignmentId} value={consent.assignmentId}>{clinicianName(consent)}</option>)}
          </select>
        </div>
      ) : (
        <p className="text-sm font-medium text-ink" dir="auto">{copy.chooseClinician} {clinicianName(open[0])}</p>
      )}

      {/* Always visible, never behind a toggle: this is not an emergency service. */}
      <div role="note" className="flex items-start gap-2.5 rounded-2xl border border-gold-100 bg-gold-50 p-3.5 text-sm leading-relaxed text-ink">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-gold-700" aria-hidden />
        <p>
          {copy.notice}{" "}
          {notice?.emergencyNumber ? fill(copy.noticeNumber, { number: notice.emergencyNumber }) : copy.noticeNoNumber}{" "}
          <strong className="">{copy.sosHint}</strong>
        </p>
      </div>

      {conversation.error && !conversation.data ? (
        <ErrorState message={copy.loadError} onRetry={() => void conversation.refresh()} />
      ) : !conversation.data ? (
        <Skeleton className="h-48" />
      ) : (
        <ol ref={thread} aria-live="polite" aria-label={copy.title} className="flex max-h-[26rem] min-h-40 flex-col gap-3 overflow-y-auto overscroll-contain pe-1">
          {conversation.data.messages.length === 0 ? (
            <li className="m-auto max-w-xs py-6 text-center text-sm text-muted-foreground">{copy.empty}</li>
          ) : (
            conversation.data.messages.map((message) => <Bubble key={message.id} message={message} />)
          )}
        </ol>
      )}

      <form onSubmit={submit} className="flex flex-col gap-2">
        <label htmlFor="care-message" className="sr-only">{copy.label}</label>
        <Textarea
          id="care-message"
          value={draft}
          onChange={(event) => { setDraft(event.target.value); setProblem(null); }}
          onKeyDown={onKeyDown}
          placeholder={copy.placeholder}
          maxLength={MAX_LENGTH}
          rows={3}
          dir="auto"
          disabled={sending}
          className="field-soft min-h-24 px-4 py-3"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground" aria-hidden>{fill(copy.count, { n: draft.length, max: MAX_LENGTH })}</span>
          <div className="flex items-center gap-3">
            <span role="status" className="text-sm text-rose-700">
              {problem === "closed" ? copy.closed : problem === "failed" ? copy.sendError : ""}
            </span>
            <Button type="submit" disabled={!text || sending} aria-busy={sending}>
              {sending && <LogoSpinner size={18} />}
              {sending ? copy.sending : copy.send}
            </Button>
          </div>
        </div>
      </form>
    </GlassCard>
  );
}
