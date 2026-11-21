"use client";

import { Users, UserRound } from "lucide-react";
import { authRoleCopy } from "@/lib/i18n/authRole";
import type { AuthRole } from "@/lib/config/auth-role";
import type { Lang } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

/**
 * "How would you like to sign in?": two native radios (arrow keys, focus and screen readers for free). Nothing is
 * pre-selected unless the URL says so: the visitor states which account they use, SynQ never guesses.
 */
export function RoleSelector({ role, onChange, language }: { role: AuthRole | null; onChange: (role: AuthRole) => void; language: Lang }) {
  const copy = authRoleCopy[language];
  const options = [
    { value: "patient", icon: UserRound, ...copy.patient },
    { value: "parent", icon: Users, ...copy.parent },
  ] as const;
  return (
    <fieldset className="mt-6">
      <legend className="text-[0.9375rem]  text-ink">{copy.legend}</legend>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {options.map(({ value, icon: Icon, title, hint }) => (
          <label key={value} className="cursor-pointer">
            <input type="radio" name="auth-role" value={value} checked={role === value} onChange={() => onChange(value)} className="peer sr-only" />
            <span
              className={cn(
                "flex min-h-20 items-start gap-3 rounded-2xl border bg-white/80 p-4 transition-colors",
                "peer-focus-visible:ring-2 peer-focus-visible:ring-teal-500 peer-focus-visible:ring-offset-2",
                role === value ? "border-teal-600 bg-teal-50" : "border-line-strong hover:border-teal-400",
              )}
            >
              <Icon className="mt-0.5 size-5 shrink-0 text-teal-700" aria-hidden />
              <span>
                <span className="block text-[0.9375rem]  text-ink">{title}</span>
                <span className="block text-[0.8125rem] leading-5 text-ink-soft">{hint}</span>
              </span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
