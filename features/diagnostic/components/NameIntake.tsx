"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { EASE_OUT } from "@/lib/motion";
import { MiraAvatar } from "./MiraMessage";

/** A calm, optional first step: let Mira know the visitor's name so the space feels personal. */
export function NameIntake({ onSubmit, onSkip }: { onSubmit: (name: string) => void; onSkip: () => void }) {
  const { dictionary, language } = useLanguage();
  const t = dictionary.diagnostic.name;
  const [value, setValue] = useState("");

  return (
    <motion.div
      dir={language === "ar" ? "rtl" : "ltr"}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT }}
      className="flex items-start gap-3 rounded-[1.25rem] border border-sage-100 bg-sage-50/60 p-4 sm:gap-3.5 sm:p-5"
    >
      <MiraAvatar size="md" />
      <div className="min-w-0 flex-1">
        <p className="text-[1rem] font-semibold text-ink">{t.prompt}</p>
        <p className="mt-1 text-[0.9375rem] leading-6 text-ink-soft">{t.hint}</p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (value.trim()) onSubmit(value);
            else onSkip();
          }}
          className="mt-3.5 flex flex-col gap-2 sm:flex-row sm:items-center"
        >
          <label htmlFor="visitor-name" className="sr-only">
            {t.placeholder}
          </label>
          <input
            id="visitor-name"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={t.placeholder}
            maxLength={40}
            autoComplete="given-name"
            className="min-h-12 min-w-0 flex-1 rounded-full border border-line bg-white px-5 text-base text-ink outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-ink-subtle focus:border-teal-500 focus:shadow-focus"
          />
          <div className="flex shrink-0 gap-2">
            <Button type="submit" variant="default" className="group min-h-12 rounded-full px-5">
              {t.confirm}
              <ArrowRight className="transition-transform duration-300 group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" aria-hidden />
            </Button>
            <Button type="button" variant="ghost" onClick={onSkip} className="min-h-12 rounded-full text-ink-soft">
              {t.skip}
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
