"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { useAuthSession } from "@/hooks/useAuthSession";
import { ROUTES, agentEntryHref } from "@/lib/config/routes";
import { REVEAL_VIEWPORT, fadeUp, stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Check, Mail } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { Magnetic, WordReveal } from "./AnimationUtilities";
import { CURTAIN } from "./HomeSection";
import { LABEL, SERIF } from "./typography";

/** The one italic word of the closing headline, in champagne. */
const ACCENT_CHAMPAGNE = "italic text-gold-100 rtl:not-italic";

/**
 * A sunrise behind the horizon: a warm disc of champagne and gold climbs from below as the section arrives, and its light
 * slowly breathes. Gradients only — no blur filter, so it stays cheap.
 */
function Horizon({ progress }: { progress: ReturnType<typeof useScroll>["scrollYProgress"] }) {
    const reduce = useReducedMotion();
    const rise = useTransform(progress, [0, 0.7], [reduce ? 0 : 38, 0]);
    const grow = useTransform(progress, [0, 0.7], [reduce ? 1 : 0.76, 1]);
    const y = useTransform(rise, (value) => `${value}%`);
    const breathe = reduce ? undefined : { scale: [1, 1.07, 1], opacity: [0.86, 1, 0.86] };

    return (
        <motion.div aria-hidden style={{ y, scale: grow }} className="pointer-events-none absolute -bottom-[70vmin] left-1/2 -z-10 size-[130vmin] -translate-x-1/2">
            {/* The glow of the sun, spreading into the teal */}
            <motion.div
                className="absolute -inset-[16%] rounded-full bg-[radial-gradient(closest-side,rgb(230_213_170/0.55),rgb(201_175_111/0.28)_46%,transparent_72%)]"
                animate={breathe}
                transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* The disc itself: champagne at the heart, gold at the rim */}
            <motion.div
                className="absolute inset-0 rounded-full bg-[radial-gradient(closest-side,#f3e8c6_0%,#e6d5aa_34%,#c9af6f_70%,rgb(201_175_111/0.35)_88%,transparent_100%)]"
                animate={breathe}
                transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
            />
        </motion.div>
    );
}

/** Closing chapter: a rising horizon, oversized type, and one round button that follows the hand. */
export const CTASection = () => {
    const { dictionary } = useLanguage();
    const copy = dictionary.homeLanding.cta;
    const { signedIn } = useAuthSession();
    const ref = useRef<HTMLElement>(null);
    const reduce = useReducedMotion();
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });

    return (
        <section
            id="cta"
            ref={ref}
            className={cn(
                "relative isolate overflow-hidden bg-deep pb-14 pt-28 text-white md:pb-16 md:pt-44",
                CURTAIN,
            )}
        >
            <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
            <Horizon progress={scrollYProgress} />

            <div className="page-container">
                <motion.div variants={stagger(0.09, 0.05)} initial="hidden" whileInView="show" viewport={REVEAL_VIEWPORT}>
                    <div className="grid grid-cols-1 items-end gap-14 lg:grid-cols-12 lg:gap-10">
                        <div className="lg:col-span-8">
                            <motion.p variants={fadeUp()} className={cn(LABEL, "flex items-center gap-3 text-teal-200")}>
                                <span aria-hidden className="h-px w-10 bg-gold-300" />
                                {copy.eyebrow}
                            </motion.p>

                            <h2 className={cn(SERIF, "mt-8 text-[clamp(3.25rem,8.2vw+0.5rem,8.5rem)] font-light leading-[0.96] tracking-[-0.04em] text-white rtl:tracking-normal")}>
                                <span className="block">
                                    <WordReveal>{copy.titleA}</WordReveal>
                                </span>
                                <span className="block">
                                    <WordReveal className={ACCENT_CHAMPAGNE} delay={0.15}>
                                        {copy.titleB}
                                    </WordReveal>
                                </span>
                            </h2>
                        </div>

                        <div className="flex flex-col items-start gap-10 lg:col-span-4 lg:items-end lg:text-end">
                            <motion.p variants={fadeUp()} className="max-w-md text-[clamp(1.0625rem,0.3vw+1rem,1.25rem)] leading-[1.75] text-teal-100">
                                {copy.body}
                            </motion.p>

                            <motion.div variants={fadeUp(0, 24)} className="relative m-4 lg:m-0">
                                {/* A slow dashed ring turns around the button */}
                                <motion.span
                                    aria-hidden
                                    className="pointer-events-none absolute -inset-4 rounded-full border border-dashed border-white/30"
                                    animate={reduce ? undefined : { rotate: 360 }}
                                    transition={{ duration: 36, repeat: Infinity, ease: "linear" }}
                                />
                                <Magnetic strength={0.3}>
                                    <Link
                                        href={agentEntryHref("mira", signedIn)}
                                        className="group relative grid size-40 place-items-center overflow-hidden rounded-full bg-white text-ink shadow-[0_24px_48px_-28px_rgb(0_0_0/0.45)] transition-transform duration-500 ease-out-soft hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-gold-300 md:size-48"
                                    >
                                        {/* Warmth floods in from the pointer's side of the disc */}
                                        <span aria-hidden className="absolute inset-0 origin-bottom scale-y-0 rounded-full bg-gold-300 transition-transform duration-700 ease-out-soft group-hover:scale-y-100" />
                                        <span className="relative z-10 flex flex-col items-center gap-3 px-6 text-center text-[0.9375rem] font-semibold leading-snug">
                                            {copy.primary}
                                            <ArrowRight className="size-5 transition-transform duration-500 ease-out-soft group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1" aria-hidden />
                                        </span>
                                    </Link>
                                </Magnetic>
                            </motion.div>
                        </div>
                    </div>

                    <motion.div variants={fadeUp(0, 12)} className="mt-24 flex flex-col gap-6 rounded-3xl border border-gold/40 bg-teal-900/85 px-6 py-5 md:mt-32 lg:flex-row lg:items-center lg:justify-between">
                        <ul className="flex flex-wrap items-center gap-x-8 gap-y-3 text-[0.9375rem] text-white/90">
                            {copy.benefits.map((text) => (
                                <li key={text} className="flex items-center gap-2.5">
                                    <Check className="size-4 text-gold-300" aria-hidden />
                                    {text}
                                </li>
                            ))}
                        </ul>
                        <Link
                            href={ROUTES.support}
                            className="group inline-flex w-fit items-center gap-3 rounded-md text-[0.9375rem] font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-300"
                        >
                            <span className="flex size-9 items-center justify-center rounded-full border border-white/25 bg-white/5 transition-[transform,background-color] duration-300 group-hover:scale-110 group-hover:bg-white/15">
                                <Mail className="size-3.5" aria-hidden />
                            </span>
                            <span className="home-link-line">{copy.demo}</span>
                        </Link>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
};
