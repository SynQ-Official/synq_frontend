"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChartLine, Cloud, Lightbulb, Smile, Sparkle } from "lucide-react";
import type { ComponentType } from "react";
import { LABEL } from "@/components/home/typography";
import { copy, type Lang } from "@/lib/i18n/config";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { MiraOption } from "../../hooks/useMiraChat";

type IconType = ComponentType<{ className?: string }>;

/** Icon per suggestion chip, in the dictionary's order. */
const SUGGESTION_ICONS: IconType[] = [Smile, Cloud, ChartLine, Lightbulb];

/** Ways to begin, before the first answer: a tap starts the draft. */
export function MiraSuggestions({ show, language, onPick }: { show: boolean; language: Lang; onPick: (chip: string) => void }) {
  const diagnostic = copy[language].diagnostic;
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6, transition: { duration: 0.15 } }}
          transition={{ duration: 0.4, ease: EASE_OUT, delay: 0.15 }}
          className="mb-3 px-1 [@media(max-height:44rem)]:hidden"
        >
          <p className={cn(LABEL, "mb-2.5 flex items-center gap-2 px-1 text-ink-muted")}>
            {diagnostic.suggestionsLabel}
            <Sparkle className="h-3.5 w-3.5 text-gold-600" aria-hidden />
          </p>
          <div className="flex flex-wrap gap-2 sm:gap-2.5">
            {diagnostic.suggestions.map((chip, i) => {
              const Icon = SUGGESTION_ICONS[i] ?? Sparkle;
              return (
                <motion.button
                  key={chip}
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onPick(chip)}
                  className="group inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-line bg-white px-4 text-[0.875rem] text-ink-soft transition-[border-color,background-color,color] duration-200 hover:border-teal-200 hover:bg-sage-50 hover:text-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
                >
                  <Icon className="size-4 shrink-0 text-sage-700 transition-colors duration-200 group-hover:text-teal-700" />
                  {chip}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const choiceHint = (language: Lang): string => (language === "ar" ? "اختر الإجابة الأنسب" : "Tap the answer that fits best");

/** A choice question: the answer is one of these, tapped (typing is not accepted meanwhile). */
export function MiraChoiceOptions({ options, language, onChoose }: { options: MiraOption[]; language: Lang; onChoose: (answer: string) => void }) {
  return (
    <div role="group" aria-labelledby="mira-options-label" className="mb-3 rounded-[1.25rem] border border-line bg-ivory p-3 sm:p-4">
      <p id="mira-options-label" className={cn(LABEL, "mb-3 px-1 text-ink-soft")}>{choiceHint(language)}</p>
      {/* Short answers: two per row on phones, one row from tablet up; long ones wrap inside their button. */}
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-2.5">
        {options.map((option) => (
          <motion.button
            key={option.id}
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => onChoose(`${option.emoji} ${option.text}`.trim())}
            className="group inline-flex min-h-12 min-w-0 cursor-pointer items-center gap-2.5 rounded-2xl border border-line bg-white py-2 ps-2 pe-4 text-start text-[0.9375rem] font-medium text-ink transition-[border-color,background-color,color] duration-200 hover:border-teal-300 hover:bg-sage-50 hover:text-teal-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 active:border-teal-600 sm:min-w-32"
          >
            <span aria-hidden className="inline-flex size-8 shrink-0 items-center justify-center rounded-xl border border-sage-100 bg-sage-50 text-sm font-semibold text-teal-800 transition-colors duration-200 group-hover:border-teal-700 group-hover:bg-teal-800 group-hover:text-white">
              {option.label}
            </span>
            {option.emoji ? <span aria-hidden>{option.emoji}</span> : null}
            <span className="min-w-0 break-words">{option.text}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
