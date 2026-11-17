"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { ACCENT_LIGHT, DISPLAY_M, LABEL } from "@/components/home/typography";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { useLuminaEntry } from "../hooks/useLuminaEntry";
import { EASE_OUT, REVEAL_VIEWPORT, fadeUp, stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";

const NEXT_STEPS_ID = "next-steps";

/**
 * After the orientation: the way on to Lumina, once. A title, one paragraph and the button on one side; the three steps on
 * the other. Screen-only (never part of the printed report). The bottom bar on small screens steps aside while this is in view.
 */
export function ResultNextSteps() {
  const { dictionary, direction } = useLanguage();
  const t = dictionary.diagnostic.resultPage.nextSteps;
  const luminaHref = useLuminaEntry();

  // Title: the last word carries the olive-gold accent, as on the home page.
  const titleWords = t.title.split(" ");
  const titleLead = titleWords.slice(0, -1).join(" ");
  const titleAccent = titleWords.slice(-1).join(" ");

  return (
    <motion.section
      id={NEXT_STEPS_ID}
      dir={direction}
      aria-labelledby="next-steps-title"
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={REVEAL_VIEWPORT}
      transition={{ duration: 0.9, ease: EASE_OUT }}
      className="relative overflow-hidden rounded-[1.75rem] border border-line bg-white p-5 shadow-float sm:rounded-[2rem] sm:p-8 lg:p-10 print:hidden"
    >
      <div aria-hidden className="canvas-glow pointer-events-none absolute inset-0" />
      <motion.div variants={stagger(0.08)} initial="hidden" whileInView="show" viewport={REVEAL_VIEWPORT} className="relative grid gap-8 lg:grid-cols-12 lg:items-center lg:gap-12">
        <div className="min-w-0 lg:col-span-6">
          <motion.p variants={fadeUp(0, 12)} className={cn(LABEL, "flex items-center gap-3 text-teal-700")}>
            <span aria-hidden className="h-px w-8 bg-gold" />
            <Sparkles className="size-4 text-gold-700" aria-hidden />
            {t.eyebrow}
          </motion.p>
          <motion.h2 variants={fadeUp(0, 16)} id="next-steps-title" className={cn(DISPLAY_M, "mt-5 text-[clamp(1.875rem,1.6vw+1.3rem,2.75rem)] text-ink")}>
            {titleLead ? <>{titleLead} </> : null}
            <span className={ACCENT_LIGHT}>{titleAccent}</span>
          </motion.h2>
          <motion.p variants={fadeUp(0, 12)} className="mt-4 max-w-xl text-[1rem] leading-7 text-ink-soft sm:text-[1.0625rem] sm:leading-8">
            {t.body}
          </motion.p>

          <motion.div variants={fadeUp(0, 12)} className="mt-7">
            <Button asChild size="lg" className="group min-h-14 w-full px-8 shadow-brand sm:w-auto">
              <Link href={luminaHref}>
                {t.cta}
                <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1" aria-hidden />
              </Link>
            </Button>
          </motion.div>
        </div>

        <ol className="grid min-w-0 gap-3 sm:grid-cols-3 lg:col-span-6 lg:grid-cols-1 xl:grid-cols-3">
          {t.steps.map((step, i) => (
            <motion.li
              key={step}
              variants={fadeUp(0, 12)}
              className={cn(
                "flex items-center gap-3.5 rounded-2xl border p-4 sm:flex-col sm:items-start sm:gap-4 lg:flex-row lg:items-center xl:flex-col xl:items-start",
                i === 0 ? "border-teal-200 bg-teal-50/60" : "border-line bg-white/80",
              )}
            >
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-full text-[0.9375rem] font-medium tabular-nums",
                  i === 0 ? "bg-teal-800 text-white shadow-brand" : "border border-teal-200 bg-white text-teal-700",
                )}
              >
                {i === 0 ? <Check className="size-4" strokeWidth={2.5} aria-hidden /> : i + 1}
              </span>
              <span className={cn("min-w-0 text-[1rem] leading-6", i === 0 ? "font-semibold text-ink" : "font-medium text-ink-soft")}>{step}</span>
            </motion.li>
          ))}
        </ol>
      </motion.div>
    </motion.section>
  );
}

/** Mobile/tablet bottom bar keeping the way into Lumina within reach while reading; it leaves once the full card is on screen. */
export function ResultStickyCta() {
  const { dictionary, direction } = useLanguage();
  const resultPage = dictionary.diagnostic.resultPage;
  const luminaHref = useLuminaEntry();
  const [cardInView, setCardInView] = useState(false);

  useEffect(() => {
    const card = document.getElementById(NEXT_STEPS_ID);
    if (!card || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setCardInView(entry.isIntersecting), { threshold: 0.15 });
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  return (
    <motion.div
      dir={direction}
      initial={{ y: "110%" }}
      animate={{ y: cardInView ? "110%" : 0 }}
      transition={{ duration: 0.5, delay: cardInView ? 0 : 0.2, ease: EASE_OUT }}
      aria-hidden={cardInView}
      className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden print:hidden"
    >
      <div className="mx-auto flex max-w-xl items-center gap-3 rounded-full border border-white/70 bg-white/90 py-2 ps-5 pe-2 shadow-float ring-1 ring-line/50 backdrop-blur-xl">
        <p className="min-w-0 flex-1 truncate text-[0.9375rem] font-semibold text-ink">{resultPage.sticky.title}</p>
        <Button asChild size="lg" className="shrink-0 shadow-brand" tabIndex={cardInView ? -1 : undefined}>
          <Link href={luminaHref}>{resultPage.sticky.cta}</Link>
        </Button>
      </div>
    </motion.div>
  );
}
