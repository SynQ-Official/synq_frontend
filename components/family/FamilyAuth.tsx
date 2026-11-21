"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { FAMILY_HOME, roleDestination, signInHref } from "@/lib/config/auth-role";
import { FAMILY_TERMS_VERSION } from "@/lib/family/copy";
import { errorKind } from "@/lib/family/logic";
import { familyRegister } from "@/lib/family/session";
import { AUTH_CARD, AUTH_TITLE } from "@/components/auth/AuthLayout";
import { cn } from "@/lib/utils";
import { inputClass, Notice, PrimaryButton, useFamilyCopy } from "./FamilyShell";

/**
 * Parent registration. Signing in is not here: the one canonical sign-in page is `/auth/signin?role=parent`
 * (`/family/sign-in` only redirects to it), so there is a single login form for both account types.
 */
export function FamilyAuth() {
  const { t, lang } = useFamilyCopy();
  const router = useRouter();
  const params = useSearchParams();
  const [form, setForm] = useState({ email: "", password: "", firstName: "", lastName: "", phone: "", terms: false });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 8) return setError(t.auth.errors.password);
    if (!form.terms) return setError(t.auth.errors.terms);
    setBusy(true);
    try {
      await familyRegister({ email: form.email.trim(), password: form.password, firstName: form.firstName.trim(), lastName: form.lastName.trim(), phone: form.phone.trim() || undefined, lang, termsVersion: FAMILY_TERMS_VERSION });
      // Only the parent's own area: a redirect can never send a parent into the patient app.
      router.replace(roleDestination("parent", params.get("redirect")) ?? FAMILY_HOME);
    } catch (err) {
      setError(errorKind(err) === "exists" ? t.auth.errors.exists : t.auth.errors.generic);
    } finally {
      setBusy(false);
    }
  };

  return (
    // The same card and display title as the patient sign-in: one auth system, two account types.
    <div className={AUTH_CARD}>
      <h1 className={cn(AUTH_TITLE, "text-balance")}>{t.auth.registerTitle}</h1>
      <p className="mt-3 text-base leading-7 text-ink-soft">{t.auth.registerLead}</p>
      <div className="mt-7">
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium">{t.auth.firstName}<input required className={inputClass} value={form.firstName} onChange={set("firstName")} autoComplete="given-name" /></label>
            <label className="block text-sm font-medium">{t.auth.lastName}<input required className={inputClass} value={form.lastName} onChange={set("lastName")} autoComplete="family-name" /></label>
          </div>
          <label className="block text-sm font-medium">{t.auth.email}<input type="email" required dir="ltr" className={inputClass} value={form.email} onChange={set("email")} autoComplete="email" /></label>
          <label className="block text-sm font-medium">{t.auth.password}<input type="password" required dir="ltr" className={inputClass} value={form.password} onChange={set("password")} autoComplete="new-password" /></label>
          <label className="block text-sm font-medium">{t.auth.phone}<input type="tel" dir="ltr" className={inputClass} value={form.phone} onChange={set("phone")} autoComplete="tel" /></label>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1 size-4" checked={form.terms} onChange={set("terms")} /> {t.auth.terms}
          </label>
          {error && <Notice kind="error">{error}</Notice>}
          <PrimaryButton type="submit" disabled={busy} className="w-full">{t.auth.submitRegister}</PrimaryButton>
        </form>
      </div>
      <div className="mt-6 flex flex-col gap-1 border-t border-line pt-5 text-sm">
        <Link className="inline-flex min-h-11 items-center text-teal-700 underline-offset-4 hover:underline" href={signInHref("parent", params.get("redirect"))}>{t.auth.toSignIn}</Link>
        <Link className="inline-flex min-h-11 items-center text-ink-muted underline-offset-4 hover:underline" href={signInHref("patient")}>{t.auth.patientLink}</Link>
      </div>
    </div>
  );
}
