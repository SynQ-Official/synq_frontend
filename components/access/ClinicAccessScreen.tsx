"use client";

import { Card } from "@/components/auth/PasswordResetScreens";
import { PendingLegalField } from "@/components/legal/PendingLegalField";
import { FormField, IconInput } from "@/components/shared/FormField";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { CONTACT } from "@/lib/config/brand";
import { accessCopy } from "@/lib/i18n/access";
import { Building2, Mail, MapPin, Phone, ShieldAlert, Stethoscope, UserRound } from "lucide-react";
import { useState, type FormEvent } from "react";

const CONTROL =
  "w-full rounded-control border border-line-strong bg-white px-4 text-base text-ink shadow-xs outline-none transition-[border-color,box-shadow] hover:border-teal-300 focus:border-teal-500 focus:shadow-focus";

/**
 * /clinic-access: a short request form for clinics and clinicians. There is no API for it, so it opens the visitor's own
 * e-mail app (mailto:) addressed to CONTACT.email; until that address exists, sending is disabled and says why.
 * Nothing typed here is stored or sent to analytics.
 */
export function ClinicAccessScreen() {
  const { language } = useLanguage();
  const copy = accessCopy[language].clinic;
  const [sent, setSent] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!CONTACT.email) return;
    const form = new FormData(event.currentTarget);
    const line = (key: keyof typeof copy.fields) => `${copy.fields[key]}: ${String(form.get(key) ?? "").trim()}`;
    const body = [line("name"), line("role"), line("clinic"), line("country"), line("city"), line("email"), line("phone"), "", String(form.get("message") ?? "")].join("\n");
    window.location.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent(copy.subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  }

  return (
    <Card
      icon={
        <span className="flex size-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
          <Stethoscope className="size-5" strokeWidth={1.5} aria-hidden />
        </span>
      }
      title={copy.title}
    >
      <p className="text-base leading-7 text-ink-soft">{copy.body}</p>
      <p role="note" className="flex items-start gap-2.5 rounded-xl border border-gold-100 bg-gold-50 px-4 py-3 text-base font-medium leading-6 text-ink">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-gold-700" aria-hidden />
        {copy.noPatientData}
      </p>

      <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        <FormField id="ca-name" label={copy.fields.name} compact>
          <IconInput id="ca-name" name="name" icon={UserRound} autoComplete="name" required />
        </FormField>
        <FormField id="ca-role" label={copy.fields.role} compact>
          <select id="ca-role" name="role" required defaultValue="" className={`${CONTROL} h-12`}>
            <option value="" disabled>{copy.choose}</option>
            {copy.roles.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </FormField>
        <FormField id="ca-clinic" label={copy.fields.clinic} compact className="sm:col-span-2">
          <IconInput id="ca-clinic" name="clinic" icon={Building2} autoComplete="organization" required />
        </FormField>
        <FormField id="ca-country" label={copy.fields.country} compact>
          <select id="ca-country" name="country" required defaultValue="" className={`${CONTROL} h-12`}>
            <option value="" disabled>{copy.choose}</option>
            <option value={copy.countries.AE}>{copy.countries.AE}</option>
            <option value={copy.countries.TN}>{copy.countries.TN}</option>
          </select>
        </FormField>
        <FormField id="ca-city" label={copy.fields.city} compact>
          <IconInput id="ca-city" name="city" icon={MapPin} autoComplete="address-level2" required />
        </FormField>
        <FormField id="ca-email" label={copy.fields.email} compact>
          <IconInput id="ca-email" name="email" type="email" icon={Mail} dir="ltr" autoComplete="email" required />
        </FormField>
        <FormField id="ca-phone" label={`${copy.fields.phone} (${copy.fields.optional})`} compact>
          <IconInput id="ca-phone" name="phone" type="tel" icon={Phone} dir="ltr" autoComplete="tel" />
        </FormField>
        <FormField id="ca-message" label={copy.fields.message} compact className="sm:col-span-2">
          <textarea id="ca-message" name="message" required maxLength={2000} className={`${CONTROL} min-h-32 resize-y py-3 leading-6`} />
        </FormField>

        <label htmlFor="ca-consent" className="flex min-h-11 items-start gap-3 text-base leading-6 text-ink sm:col-span-2">
          <input id="ca-consent" name="consent" type="checkbox" required className="mt-1 size-5 shrink-0 accent-teal-700" />
          {copy.consent}
        </label>

        <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center">
          <Button type="submit" size="lg" disabled={!CONTACT.email} className="min-h-12 w-full sm:w-auto">
            {copy.submit}
          </Button>
          {CONTACT.email ? null : <PendingLegalField label={copy.pendingEmail} />}
        </div>
        {sent ? (
          <p role="status" className="rounded-xl border border-sage-100 bg-sage-50 px-4 py-3 text-base font-medium text-sage-700 sm:col-span-2">
            {copy.sent}
          </p>
        ) : null}
      </form>
    </Card>
  );
}
