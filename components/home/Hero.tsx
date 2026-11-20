"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { useAuthSession } from "@/hooks/useAuthSession";
import { ROUTES, agentEntryHref } from "@/lib/config/routes";
import { EASE_OUT, SPRING_SOFT, fadeUp, stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { LayoutGroup, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Stethoscope, UserRound, UsersRound, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { WordReveal } from "./AnimationUtilities";
import { Grain } from "./Atmosphere";
import dynamic from "next/dynamic";
import { ACCENT_LIGHT, BODY, DISPLAY_XL } from "./typography";

/** three.js is the heaviest part of the page and sits behind the headline: it loads after first paint. */
const GLSLHills = dynamic(() => import("./GLSLHills").then((m) => m.GLSLHills), { ssr: false });

/** "deserves better care" → plain lead + the last two words as the olive-gold accent. */
function splitAccent(text: string, accentWords = 2) {
    const words = text.split(" ");
    const cut = Math.max(0, words.length - accentWords);
    return { lead: words.slice(0, cut).join(" "), accent: words.slice(cut).join(" ") };
}

/**
 * First light: a warm champagne glow climbs behind the hills as the page opens, the same sun the page sets on in its last
 * section. Gradients only, one transform each, and it eases off as you scroll away.
 */
function FirstLight({ progress }: { progress: ReturnType<typeof useScroll>["scrollYProgress"] }) {
    const reduce = useReducedMotion();
    const y = useTransform(progress, [0, 1], [0, reduce ? 0 : -70]);
    const fade = useTransform(progress, [0, 0.9], [1, reduce ? 1 : 0.2]);

    return (
        <motion.div aria-hidden style={{ y, opacity: fade }} className="pointer-events-none absolute inset-x-0 top-[38svh] -z-20 h-[74svh]">
            <motion.div
                initial={reduce ? false : { opacity: 0, scale: 0.72, y: 140 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 3.6, delay: 0.2, ease: EASE_OUT }}
                className="absolute inset-x-[6%] top-0 h-full rounded-[50%] bg-[radial-gradient(closest-side,rgb(243_232_198/0.85),rgb(230_213_170/0.45)_44%,rgb(201_175_111/0.16)_70%,transparent_84%)]"
            />
        </motion.div>
    );
}

type Audience = { label: string; href: string; Icon: LucideIcon };

/**
 * One frosted capsule split in three: a soft surface glides to whichever audience is hovered or focused, its icon lifts
 * and the arrow slides in. Stacks into a single card with hairlines on phones, a row from `sm`.
 */
function AudienceChooser({ items }: { items: readonly Audience[] }) {
    const reduce = useReducedMotion();
    const [hot, setHot] = useState(0);
    return (
        <LayoutGroup id="hero-audiences">
            <ul
                onPointerLeave={() => setHot(0)}
                className="grid grid-cols-1 divide-y divide-line/70 rounded-[1.75rem] border border-line-strong/70 bg-white/55 p-1.5 shadow-[inset_0_1px_0_rgb(255_255_255/0.9),0_18px_40px_-24px_rgb(17_76_97/0.45)] backdrop-blur-md sm:grid-cols-3 sm:divide-y-0 sm:rounded-full"
            >
                {items.map(({ label, href, Icon }, index) => {
                    const active = hot === index;
                    return (
                        <li key={label} className="relative min-w-0">
                            <Link
                                href={href}
                                onPointerEnter={() => setHot(index)}
                                onFocus={() => setHot(index)}
                                className="group relative flex min-h-14 items-center gap-3 rounded-[1.375rem] px-3 text-start text-[0.9375rem] font-semibold text-ink outline-none focus-visible:ring-2 focus-visible:ring-teal-500 sm:rounded-full sm:px-4"
                            >
                                {active && (
                                    <motion.span
                                        layoutId="hero-audience-surface"
                                        transition={reduce ? { duration: 0 } : SPRING_SOFT}
                                        aria-hidden
                                        className="absolute inset-0 rounded-[inherit] bg-white shadow-[0_10px_24px_-14px_rgb(17_76_97/0.5)]"
                                    />
                                )}
                                <span
                                    className={cn(
                                        "relative flex size-9 shrink-0 items-center justify-center rounded-full transition-[background-color,color,transform] duration-300 ease-out motion-reduce:transition-none",
                                        active ? "-translate-y-0.5 bg-teal-700 text-white" : "bg-teal-50 text-teal-700",
                                    )}
                                >
                                    <Icon className="size-4" aria-hidden />
                                </span>
                                <span className="relative min-w-0 flex-1 truncate">{label}</span>
                                <ArrowRight
                                    aria-hidden
                                    className={cn(
                                        "relative size-4 shrink-0 text-teal-700 transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none rtl:-scale-x-100",
                                        active ? "translate-x-0 opacity-100" : "-translate-x-1.5 opacity-40 rtl:translate-x-1.5",
                                    )}
                                />
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </LayoutGroup>
    );
}

export const Hero = () => {
    const { dictionary } = useLanguage();
    const copy = dictionary.homeLanding.hero;
    const reduce = useReducedMotion();
    const { signedIn } = useAuthSession();
    const { lead, accent } = splitAccent(copy.titleB);

    // The WebGL hills compile their shaders on the main thread: they wait until the headline has landed,
    // so the big type never stutters while it rises.
    const [hillsReady, setHillsReady] = useState(false);
    useEffect(() => {
        const timer = window.setTimeout(() => setHillsReady(true), 1600);
        return () => window.clearTimeout(timer);
    }, []);

    const heroRef = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "70% start"] });

    // Leaving the hero: the headline recedes, the camera glides forward over the hills.
    const copyY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -110]);
    const copyScale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 0.94]);
    const copyOpacity = useTransform(scrollYProgress, [0, 0.85], [1, reduce ? 1 : 0]);
    const hillsY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 90]);

    return (
        <section
            ref={heroRef}
            id="home"
            className="relative isolate overflow-hidden bg-[radial-gradient(60%_46rem_at_0%_12%,rgb(191_221_225/0.5),transparent_70%),radial-gradient(55%_42rem_at_100%_16%,rgb(230_213_170/0.42),transparent_70%),linear-gradient(180deg,#ffffff_0%,var(--color-canvas)_100%)]"
        >
            <Grain tone="light" />

            {/* The one visual: WebGL hills that advance as you scroll */}
            <motion.div style={{ y: hillsY }} aria-hidden className="absolute inset-x-0 top-0 -z-10 h-[100svh] min-h-[44rem] [mask-image:linear-gradient(to_bottom,transparent,black_30%,black_78%,transparent)]">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: hillsReady ? 1 : 0 }} transition={{ duration: 2.2, ease: "easeOut" }} className="absolute inset-0">
                    {hillsReady && <GLSLHills progress={scrollYProgress} cameraZ={118} />}
                </motion.div>
            </motion.div>
            <FirstLight progress={scrollYProgress} />

            <div className="relative z-10 flex min-h-[100svh] flex-col">
                <motion.div
                    style={{ y: copyY, scale: copyScale, opacity: copyOpacity }}
                    className="flex flex-1 flex-col items-center justify-center px-4 pb-8 pt-32 text-center sm:px-6 sm:pt-36 lg:px-8"
                >
                    <div className="w-full max-w-6xl">
                        <h1 className={cn(DISPLAY_XL, "mx-auto text-ink")}>
                            <span className="block">
                                <WordReveal delay={0.45} step={0.07}>{copy.titleA}</WordReveal>
                            </span>
                            <span className="block">
                                {lead ? (
                                    <>
                                        <WordReveal delay={0.7} step={0.07}>{lead}</WordReveal>{" "}
                                    </>
                                ) : null}
                                <WordReveal className={ACCENT_LIGHT} delay={1} step={0.07}>
                                    {accent}
                                </WordReveal>
                            </span>
                        </h1>

                        <motion.div variants={stagger(0.12, 1.5)} initial="hidden" animate="show">
                            <motion.p variants={fadeUp(0, 16)} className={cn(BODY, "mx-auto mt-10 max-w-2xl")}>
                                {copy.subtitle}
                            </motion.p>

                            <motion.div variants={fadeUp(0, 16)} className="mx-auto mt-10 w-full max-w-3xl">
                                <AudienceChooser
                                    items={[
                                        { label: copy.audiences.clinicians, href: ROUTES.psy, Icon: Stethoscope },
                                        { label: copy.audiences.parents, href: agentEntryHref("mira", signedIn), Icon: UsersRound },
                                        { label: copy.audiences.adults, href: agentEntryHref("mira", signedIn), Icon: UserRound },
                                    ]}
                                />
                            </motion.div>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};
