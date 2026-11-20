"use client";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuthSession } from "@/hooks/useAuthSession";
import { agentEntryHref } from "@/lib/config/routes";
import { EASE_OUT, fadeUp, stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Stethoscope, UserRound, UsersRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Magnetic, WordReveal } from "./AnimationUtilities";
import { Grain, Motes, Swash } from "./Atmosphere";
import dynamic from "next/dynamic";
import { Marquee } from "./Interactions";
import { PartnerLogos } from "./PartnerLogos";
import { ACCENT_LIGHT, BODY, DISPLAY_XL, LABEL } from "./typography";

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

export const Hero = () => {
    const { dictionary } = useLanguage();
    const copy = dictionary.homeLanding.hero;
    const home = dictionary.home;
    const reduce = useReducedMotion();
    const { signedIn } = useAuthSession();
    const { lead, accent } = splitAccent(copy.titleB);
    const audiences = [
        { label: copy.audiences.clinicians, href: "#healthcare", Icon: Stethoscope },
        { label: copy.audiences.parents, href: agentEntryHref("mira", signedIn), Icon: UsersRound },
        { label: copy.audiences.adults, href: agentEntryHref("mira", signedIn), Icon: UserRound },
    ];

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

    // A soft light follows the pointer across the mist.
    const mx = useMotionValue(50);
    const my = useMotionValue(36);
    const sx = mx;
    const sy = my;
    const spotlight = useMotionTemplate`radial-gradient(38rem circle at ${sx}% ${sy}%, rgb(255 255 255 / 0.9), rgb(255 255 255 / 0.2) 45%, transparent 70%)`;

    const onPointerMove = (event: React.PointerEvent<HTMLElement>) => {
        if (reduce || event.pointerType !== "mouse" || !heroRef.current) return;
        const rect = heroRef.current.getBoundingClientRect();
        mx.set(((event.clientX - rect.left) / rect.width) * 100);
        my.set(((event.clientY - rect.top) / Math.min(rect.height, 900)) * 100);
    };

    return (
        <section
            ref={heroRef}
            id="home"
            onPointerMove={onPointerMove}
            className="relative isolate overflow-hidden pb-10 md:pb-16 bg-[radial-gradient(60%_46rem_at_0%_12%,rgb(191_221_225/0.5),transparent_70%),radial-gradient(55%_42rem_at_100%_16%,rgb(230_213_170/0.42),transparent_70%),linear-gradient(180deg,#ffffff_0%,var(--color-canvas)_100%)]"
        >
            <Grain tone="light" />
            <motion.div aria-hidden style={{ background: spotlight }} className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[100svh] min-h-[44rem]" />

            {/* The landscape — WebGL hills that drift with the pointer and advance as you scroll */}
            <motion.div style={{ y: hillsY }} aria-hidden className="absolute inset-x-0 top-0 -z-10 h-[100svh] min-h-[44rem] [mask-image:linear-gradient(to_bottom,transparent,black_30%,black_78%,transparent)]">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: hillsReady ? 1 : 0 }} transition={{ duration: 2.2, ease: "easeOut" }} className="absolute inset-0">
                    {hillsReady && <GLSLHills progress={scrollYProgress} cameraZ={118} />}
                </motion.div>
            </motion.div>
            <FirstLight progress={scrollYProgress} />
            <Motes />

            {/* ===== First screen ===== */}
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
                                <span className="relative inline-block">
                                    <WordReveal className={ACCENT_LIGHT} delay={1} step={0.07}>
                                        {accent}
                                    </WordReveal>
                                    <Swash />
                                </span>
                            </span>
                        </h1>

                        <motion.div variants={stagger(0.12, 1.5)} initial="hidden" animate="show">
                            <motion.p variants={fadeUp(0, 16)} className={cn(BODY, "mx-auto mt-10 max-w-2xl")}>
                                {copy.subtitle}
                            </motion.p>

                            <motion.div variants={fadeUp(0, 16)} className="mx-auto mt-10 grid w-full max-w-5xl grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                                {audiences.map(({ label, href, Icon }, index) => (
                                    <Magnetic key={label} className="w-full" strength={index === 0 ? 0.12 : 0.18}>
                                        <Button asChild variant="outline" size="lg" className="group min-h-14 w-full justify-between border-line-strong bg-white/75 px-4 backdrop-blur hover:border-teal-300 hover:bg-white sm:px-5">
                                            <Link href={href}>
                                                <span className="flex items-center gap-3">
                                                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700 transition-transform duration-300 group-hover:scale-110">
                                                        <Icon className="size-4" aria-hidden />
                                                    </span>
                                                    <span>{label}</span>
                                                </span>
                                                <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1" aria-hidden />
                                            </Link>
                                        </Button>
                                    </Magnetic>
                                ))}
                            </motion.div>
                        </motion.div>
                    </div>
                </motion.div>

                {/* Bottom of the first screen: a cue to keep going, and our partners drifting by */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 2 }} className="pb-7">
                    <a href="#what" className="group mx-auto mb-6 flex w-fit flex-col items-center gap-3 rounded-md text-[0.75rem] font-semibold uppercase tracking-[0.18em] text-ink-soft transition-colors hover:text-teal-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-500 rtl:tracking-normal">
                        {copy.discover}
                        <span aria-hidden className="relative h-10 w-px overflow-hidden bg-line-strong">
                            <motion.span
                                className="absolute inset-x-0 top-0 h-1/2 bg-gold"
                                animate={reduce ? undefined : { y: ["-100%", "200%"] }}
                                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                            />
                        </span>
                    </a>
                    <div role="group" aria-labelledby="partners-label" className="flex flex-col items-center gap-2.5 border-y border-line/80 bg-white/40 py-3.5 backdrop-blur-sm sm:flex-row sm:gap-0">
                        <p id="partners-label" className={cn(LABEL, "shrink-0 px-4 text-ink-soft sm:ps-8 lg:ps-12")}>
                            {home.partners}
                        </p>
                        <Marquee seconds={70} className="w-full min-w-0 flex-1">
                            {/* The ticker repeats the partner groups; only the first copy is announced to readers. */}
                            {Array.from({ length: reduce ? 1 : 8 }, (_, index) => (
                                <PartnerLogos
                                    key={index}
                                    hidden={index > 0}
                                    hotLabel={home.partners}
                                    hotNames={home.partnerHotNames}
                                    backedLabel={home.partnerBackedLabel}
                                    backedNames={home.partnerBackedNames}
                                />
                            ))}
                        </Marquee>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};
