"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, EyeOff } from "lucide-react";
import { SERIF } from "@/components/home/typography";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePatientCopy } from "@/hooks/usePatientCopy";
import { EASE_OUT } from "@/lib/motion";
import type { LibraryItem } from "@/lib/api/patient-types";
import { fill } from "@/lib/i18n/patient";
import { cn } from "@/lib/utils";

/**
 * Covers take the dashboard's three soft tones in turn — teal, gold, sage — so a row of articles reads as one set
 * and each looks like its own small book. The tone carries no meaning; the article is shown exactly as it was sent.
 */
const COVERS = [
  { cover: "from-teal-200 via-teal-100 to-teal-50", numeral: "text-teal-900/15" },
  { cover: "from-gold-100 via-gold-50 to-white", numeral: "text-gold-700/20" },
  { cover: "from-sage-100 via-sage-50 to-white", numeral: "text-sage-700/20" },
] as const;

const two = (n: number) => String(n).padStart(2, "0");

type CardProps = {
  item: LibraryItem;
  index?: number;
  className?: string;
  /** Called when the patient follows the link to the source. */
  onOpen?: (contentId: string) => void;
  /** Called when the patient says the article is not for them; omit to hide the button. */
  onDismiss?: (contentId: string) => void;
};

/**
 * One recommended article as a small cover: a soft gradient with its number in serif, the source's seal, the title
 * (in the patient's language when we have it), the summary and reading time when the backend sent them, and the
 * source document it opens at, in a new tab. Without a URL the card is shown but does not link anywhere.
 */
export function ArticleCard({ item, index = 0, className, onOpen, onDismiss }: CardProps) {
  const { language } = useLanguage();
  const copy = usePatientCopy().library;
  const reduce = useReducedMotion();
  const { content } = item;
  const tone = COVERS[index % COVERS.length];
  const title = (language === "ar" && content.titleAr) || content.title;
  const because = item.because?.[0];

  const inner = (
    <>
      <span className={cn("relative block h-28 overflow-hidden bg-gradient-to-br", tone.cover)}>
        <span
          aria-hidden
          className={cn(SERIF, "pointer-events-none absolute -bottom-6 end-3 select-none text-[7.5rem] font-extralight leading-none tracking-[-0.06em] tabular-nums transition-transform duration-700 ease-out-soft group-hover:-translate-y-1 rtl:tracking-normal", tone.numeral)}
        >
          {two(index + 1)}
        </span>
        {content.sourceOrg && (
          <span className="absolute start-3 top-3 inline-flex rounded-full bg-white/85 px-2.5 py-1 text-[0.75rem]  tracking-[0.06em] text-teal-800">{content.sourceOrg}</span>
        )}
      </span>

      <span className="flex flex-1 flex-col p-4 sm:p-5">
        {because && <span className="mb-2 text-[0.8125rem] font-medium leading-snug text-teal-700">{copy.because[because]}</span>}
        <span dir="auto" className="text-[1.0625rem]  leading-snug text-ink">{title}</span>
        {content.summary && <span dir="auto" className="mt-2 line-clamp-3 text-[0.875rem] leading-6 text-ink-soft">{content.summary}</span>}
        {content.readingTimeMinutes ? (
          <span className="mt-2 text-[0.8125rem] font-medium text-muted-foreground">{fill(copy.minutes, { n: content.readingTimeMinutes })}</span>
        ) : null}

        <span className="mt-auto flex items-end justify-between gap-3 pt-5">
          <span dir="auto" className="min-w-0 text-[0.8125rem] leading-snug text-muted-foreground">
            {content.sourceLabel}
          </span>
          {content.url && (
            <span
              aria-hidden
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700 transition-colors duration-300 group-hover:bg-teal-700 group-hover:text-white"
            >
              <ArrowUpRight className="size-4 transition-transform duration-300 ease-out-soft group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" />
            </span>
          )}
        </span>
        {content.url && (
          <span className="sr-only">
            {copy.readAtSource}{content.sourceOrg ? ` — ${content.sourceOrg}` : ""}. {copy.newTab}
          </span>
        )}
      </span>
    </>
  );

  const surface =
    "group relative flex h-full flex-col overflow-hidden rounded-[1.5rem] bg-white/90 shadow-[0_18px_40px_-30px_rgb(36_107_112/0.35)] outline-none transition-[transform,box-shadow] duration-500 ease-out-soft focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2";

  return (
    <motion.li
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT, delay: Math.min(index, 8) * 0.05 }}
      className={cn("relative", className)}
    >
      {content.url ? (
        <a
          href={content.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onOpen?.(content.id)}
          onAuxClick={() => onOpen?.(content.id)}
          className={cn(surface, "hover:-translate-y-1 hover:shadow-[0_26px_50px_-28px_rgb(36_107_112/0.4)]")}
        >
          {inner}
        </a>
      ) : (
        <div className={surface}>{inner}</div>
      )}
      {onDismiss && (
        <button
          type="button"
          onClick={() => onDismiss(content.id)}
          aria-label={copy.notForMeLabel}
          className="absolute end-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/85 px-2.5 py-1 text-[0.75rem]  text-ink-soft outline-none transition-colors hover:bg-white hover:text-ink focus-visible:ring-2 focus-visible:ring-teal-500"
        >
          <EyeOff className="size-3.5" aria-hidden />
          {copy.notForMe}
        </button>
      )}
    </motion.li>
  );
}
