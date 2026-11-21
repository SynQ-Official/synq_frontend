"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Copy, HeartHandshake, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fill } from "@/lib/i18n/patient";

export type SupportLabels = {
  title: string;
  body: string;
  bodyShort: string;
  call: string;
  copy: string;
  copied: string;
  hide: string;
  hideConfirm: string;
  region: string;
};

/** The first phone-like run in a resource line ("Samaritans 116 123" -> "116123"), or null. */
export function phoneOf(resource: string): string | null {
  const match = resource.match(/\+?\d[\d\s().-]{1,}\d/);
  if (!match) return null;
  const digits = match[0].replace(/[^\d+]/g, "");
  return digits.replace(/\D/g, "").length >= 3 ? digits : null;
}

function ResourceRow({ resource, labels }: { resource: string; labels: SupportLabels }) {
  const [copied, setCopied] = useState(false);
  const phone = phoneOf(resource);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(resource);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl bg-white/80 px-3.5 py-2.5">
      <span className="min-w-0 flex-1 text-[0.9375rem] leading-6 text-ink" dir="auto">{resource}</span>
      <span className="flex shrink-0 items-center gap-2">
        {phone && (
          <Button asChild size="sm" className="min-h-10 rounded-full">
            <a href={`tel:${phone}`}><Phone aria-hidden />{fill(labels.call, { resource: phone })}</a>
          </Button>
        )}
        <Button type="button" size="sm" variant="outline" onClick={() => void copy()} className="min-h-10 rounded-full" aria-label={`${labels.copy}: ${resource}`}>
          {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
          <span aria-live="polite">{copied ? labels.copied : labels.copy}</span>
        </Button>
      </span>
    </li>
  );
}

/**
 * Support for a moment that may be heavy: warm, steady, and impossible to lose by accident. Shown
 * whenever the API answers with emergency resources (a crisis turn, or the agent being unavailable).
 * There is no close icon: hiding needs a second, deliberate tap.
 */
export function SupportCard({ resources, labels, onHide, className = "" }: { resources: readonly string[]; labels: SupportLabels; onHide?: () => void; className?: string }) {
  const reduce = useReducedMotion();
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!confirming) return;
    const timer = window.setTimeout(() => setConfirming(false), 5000);
    return () => window.clearTimeout(timer);
  }, [confirming]);

  return (
    <motion.section
      role="region"
      aria-label={labels.region ?? labels.title}
      aria-live="polite"
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`rounded-3xl border border-rose-200/70 bg-gradient-to-br from-rose-50 via-white to-gold-50/70 p-4 shadow-soft sm:p-5 ${className}`}
    >
      <div className="flex items-start gap-3.5">
        <span className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700" aria-hidden>
          <HeartHandshake className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base  text-ink sm:text-[1.0625rem]">{labels.title}</h2>
          <p className="mt-1 text-sm leading-6 text-ink-soft">{resources.length > 0 ? labels.body : labels.bodyShort}</p>
          {resources.length > 0 && (
            <ul className="mt-3 space-y-2">
              {resources.map((resource) => <ResourceRow key={resource} resource={resource} labels={labels} />)}
            </ul>
          )}
          {onHide && (
            <div className="mt-3.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => (confirming ? onHide() : setConfirming(true))}
                className="min-h-10 rounded-full text-ink-muted"
              >
                {confirming ? labels.hideConfirm : labels.hide}
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}
