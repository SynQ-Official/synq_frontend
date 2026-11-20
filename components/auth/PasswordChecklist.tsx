"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check, Circle } from "lucide-react";
import { PASSWORD_MAX_BYTES } from "@/lib/i18n/passwordReset";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";

export type PasswordRuleKey = "length" | "upper" | "number" | "special";

/** The password policy, in one place: the checklist, the meter and the submit check all read it. */
const RULES: { key: PasswordRuleKey; test: (value: string) => boolean }[] = [
  { key: "length", test: (value) => value.length >= 8 },
  { key: "upper", test: (value) => /[A-Z]/.test(value) },
  { key: "number", test: (value) => /\d/.test(value) },
  { key: "special", test: (value) => /[^A-Za-z0-9\s]/.test(value) },
];

export function passwordRuleResults(value: string) {
  return RULES.map((rule) => ({ key: rule.key, met: rule.test(value) }));
}

export function passwordMeetsPolicy(value: string) {
  return RULES.every((rule) => rule.test(value));
}

/** The API hashes at most 72 UTF-8 bytes (bcrypt), so a new password is capped there: sign-up and reset alike. */
export function passwordTooLong(value: string) {
  return new TextEncoder().encode(value).length > PASSWORD_MAX_BYTES;
}

type Copy = {
  title: string;
  length: string;
  upper: string;
  number: string;
  special: string;
  strengthLabel: string;
  strength: readonly string[];
};

const METER_TONE = ["bg-rose", "bg-rose", "bg-gold-600", "bg-teal-500", "bg-sage-700"] as const;

/** Live rules + a 4-step strength meter, announced politely to assistive technology. */
export function PasswordChecklist({ value, copy, id }: { value: string; copy: Copy; id: string }) {
  const reduce = useReducedMotion();
  const results = passwordRuleResults(value);
  const met = results.filter((rule) => rule.met).length;
  // Empty = 0 (too weak); otherwise the number of rules met, with a bonus step for a long passphrase.
  const level = value ? Math.min(4, met + (value.length >= 12 && met === RULES.length ? 1 : 0)) : 0;

  return (
    <div id={id} className="mt-1 rounded-xl border border-line bg-surface-muted/60 p-3.5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[0.8125rem] font-medium text-ink-soft">{copy.title}</p>
        <p className="text-[0.75rem] font-medium text-ink-muted" aria-live="polite">
          {copy.strengthLabel}: <span className="text-ink">{copy.strength[level]}</span>
        </p>
      </div>

      <div aria-hidden className="mt-2.5 grid grid-cols-4 gap-1.5">
        {[1, 2, 3, 4].map((step) => (
          <span key={step} className="h-1.5 overflow-hidden rounded-full bg-line-strong/60">
            <motion.span
              className={cn("block h-full origin-left rounded-full rtl:origin-right", METER_TONE[level])}
              initial={false}
              animate={{ scaleX: level >= step ? 1 : 0 }}
              transition={reduce ? { duration: 0 } : { duration: 0.35, ease: EASE_OUT }}
            />
          </span>
        ))}
      </div>

      <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
        {results.map(({ key, met: ok }) => (
          <li key={key} className={cn("flex items-center gap-2 text-[0.8125rem] leading-5 transition-colors duration-300", ok ? "text-teal-800" : "text-ink-muted")}>
            <span
              aria-hidden
              className={cn(
                "flex size-4 shrink-0 items-center justify-center rounded-full border transition-[background-color,border-color,color,transform] duration-300",
                ok ? "scale-100 border-teal-600 bg-teal-600 text-white" : "border-line-strong bg-white text-transparent",
              )}
            >
              {ok ? <Check className="size-2.5" strokeWidth={3} /> : <Circle className="size-2" />}
            </span>
            <span>
              {copy[key]}
              <span className="sr-only">{ok ? " ✓" : ""}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
