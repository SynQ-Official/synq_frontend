"use client";

import { motion } from "framer-motion";
import { REVEAL_VIEWPORT, fadeUp, stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { ACCENT_DARK, ACCENT_LIGHT, BODY, DISPLAY_L } from "./typography";

type SectionHeaderProps = {
  /** Heading id — referenced by the section's `aria-labelledby`. */
  id: string;
  eyebrow: string;
  titleA: string;
  titleB?: string;
  intro?: string;
  align?: "start" | "center";
  /** `split` places the intro in the end column on large screens (editorial). */
  layout?: "stack" | "split";
  /** `h1` when the header opens a page (e.g. /privacy) rather than a home section. */
  as?: "h1" | "h2";
  /** `editorial` is the home-page treatment: serif display, quiet label. Other pages keep `classic`. */
  variant?: "classic" | "editorial";
  /** Surface the header sits on (editorial only). */
  tone?: "light" | "dark";
  /** Editorial only: a "03 / 06" index set at the start of the eyebrow line, before its label. */
  counter?: string;
  className?: string;
};

/** Heading with a weight-carried accent, then the intro. Shared by every home section. */
export function SectionHeader({
  id,
  eyebrow,
  titleA,
  titleB,
  intro,
  align = "start",
  layout = "stack",
  as = "h2",
  variant = "classic",
  tone = "light",
  className,
}: SectionHeaderProps) {
  const centered = align === "center";
  const split = layout === "split" && !centered;
  const editorial = variant === "editorial";
  const dark = tone === "dark";
  const Heading = as === "h1" ? motion.h1 : motion.h2;

  return (
    <motion.header
      variants={stagger(0.08)}
      initial="hidden"
      whileInView="show"
      viewport={REVEAL_VIEWPORT}
      className={cn(
        "relative",
        split ? "grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-end lg:gap-10" : editorial ? "max-w-4xl" : "max-w-3xl",
        centered && "mx-auto text-center",
        className,
      )}
    >
      <div className={cn(split && "lg:col-span-7")}>
        {/* No kicker above the heading: the heading carries the section on its own. `eyebrow` stays as the accessible
            description for screen readers only, so translations keep their meaning. */}
        <span className="sr-only">{eyebrow}</span>
        {editorial ? (
          <Heading id={id} variants={fadeUp()} className={cn(DISPLAY_L, "text-balance", dark ? "text-white" : "text-ink")}>
            {titleA}
            {titleB ? (
              <>
                {" "}
                <span className={dark ? ACCENT_DARK : ACCENT_LIGHT}>{titleB}</span>
              </>
            ) : null}
          </Heading>
        ) : (
          <Heading id={id} variants={fadeUp()} className="home-heading text-balance">
            {titleA}
            {titleB ? (
              <>
                {" "}
                <span className="home-heading-accent">{titleB}</span>
              </>
            ) : null}
          </Heading>
        )}
      </div>

      {intro ? (
        <motion.p
          variants={fadeUp()}
          className={cn(
            editorial ? cn(BODY, "text-pretty", dark && "text-teal-100") : "home-body",
            "max-w-2xl",
            split ? "lg:col-span-5 lg:col-start-8 lg:pb-2" : editorial ? "mt-6" : "mt-5",
            centered && "mx-auto",
          )}
        >
          {intro}
        </motion.p>
      ) : null}
    </motion.header>
  );
}
