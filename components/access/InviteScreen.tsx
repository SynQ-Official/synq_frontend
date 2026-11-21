"use client";

import { Card, LINK_CLASS } from "@/components/auth/PasswordResetScreens";
import { FormField, IconInput } from "@/components/shared/FormField";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { ROUTES } from "@/lib/config/routes";
import { accessCopy } from "@/lib/i18n/access";
import { invitationTokenFrom } from "@/lib/invitation-link";
import { cn } from "@/lib/utils";
import { Check, Copy, Link2, MailOpen } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const BLOCK = "rounded-[1.75rem] border border-line bg-white p-6 shadow-[var(--shadow-soft)] sm:p-8";

/**
 * /invite: patients join through their clinic (B2B2C). How to open the e-mailed link, a way to paste it, and what to do
 * without an invitation: a short message to send to one's clinician. Parents and clinicians are pointed to their own way in.
 */
export function InviteScreen() {
  const { language } = useLanguage();
  const copy = accessCopy[language].invite;
  const router = useRouter();
  const [link, setLink] = useState("");
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = invitationTokenFrom(link);
    if (!token) return setError(true);
    router.push(`${ROUTES.invitation}?token=${token}`);
  }

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(copy.none.message);
      setCopied(true);
    } catch {
      /* clipboard refused: the message stays selectable on screen */
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card
        icon={
          <span className="flex size-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
            <MailOpen className="size-5" strokeWidth={1.5} aria-hidden />
          </span>
        }
        title={copy.title}
      >
        <p className="text-base leading-7 text-ink-soft">{copy.body}</p>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <FormField id="invite-link" label={copy.pasteLabel} hint={copy.pasteHint} error={error ? copy.pasteError : null}>
            <IconInput
              id="invite-link"
              name="link"
              icon={Link2}
              dir="ltr"
              inputMode="url"
              autoComplete="off"
              placeholder={copy.pastePlaceholder}
              value={link}
              invalid={error}
              onChange={(event) => {
                setLink(event.target.value);
                setError(false);
              }}
            />
          </FormField>
          <Button type="submit" size="lg" className="min-h-12 w-full sm:w-auto sm:self-start">
            {copy.pasteSubmit}
          </Button>
        </form>
        <p className="text-base text-ink-soft">
          {copy.signedUp}{" "}
          <Link href={ROUTES.signIn} className={LINK_CLASS}>
            {copy.signIn}
          </Link>
        </p>
      </Card>

      <section id="no-invitation" aria-labelledby="no-invitation-title" className={cn(BLOCK, "scroll-mt-28")}>
        <h2 id="no-invitation-title" className="text-base  text-ink">{copy.none.title}</h2>
        <p className="mt-2 text-base leading-7 text-ink-soft">{copy.none.body}</p>
        <figure className="mt-4 rounded-2xl border border-line bg-canvas p-4">
          <figcaption className="text-sm  text-ink-soft">{copy.none.messageLabel}</figcaption>
          <blockquote className="mt-2 select-all text-base leading-7 text-ink">{copy.none.message}</blockquote>
        </figure>
        <Button type="button" variant="outline" onClick={() => void copyMessage()} className="mt-4 min-h-11">
          {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
          <span aria-live="polite">{copied ? copy.none.copied : copy.none.copy}</span>
        </Button>
      </section>

      <section aria-labelledby="invite-adults" className={BLOCK}>
        <h2 id="invite-adults" className="text-[1.25rem] text-ink">{copy.adults.title}</h2>
        <p className="mt-2 text-[1rem] leading-7 text-ink-soft">{copy.adults.body}</p>
        <Button asChild size="lg" className="mt-4 min-h-12">
          <Link href={`${ROUTES.signUp}?from=orientation&redirect=${encodeURIComponent(ROUTES.orientation)}`}>{copy.adults.link}</Link>
        </Button>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <section aria-labelledby="invite-parents" className={BLOCK}>
          <h2 id="invite-parents" className="text-base  text-ink">{copy.parents.title}</h2>
          <p className="mt-2 text-base leading-6 text-ink-soft">{copy.parents.body}</p>
          <Link href="/family/register" className={cn(LINK_CLASS, "mt-3 inline-flex min-h-11 items-center")}>
            {copy.parents.link}
          </Link>
        </section>
        <section aria-labelledby="invite-clinicians" className={BLOCK}>
          <h2 id="invite-clinicians" className="text-base  text-ink">{copy.clinicians.title}</h2>
          <Link href={ROUTES.clinicAccess} className={cn(LINK_CLASS, "mt-3 inline-flex min-h-11 items-center")}>
            {copy.clinicians.link}
          </Link>
        </section>
      </div>
    </div>
  );
}
