"use client";

import { useRef, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { motion, useInView, useMotionValue, useReducedMotion } from "framer-motion";
import { type VariantProps } from "class-variance-authority";

import { buttonVariants } from "@/components/ui/button";
import { EASE_OUT, REVEAL_VIEWPORT, glide } from "@/lib/motion";
import { cn } from "@/lib/utils";

type ScrollRevealProps = {
    children: ReactNode;
    className?: string;
    delay?: number;
    direction?: "up" | "left" | "right" | "scale";
};

/** Reveal once on scroll. Distances are deliberately small — calm, not theatrical. */
export const ScrollReveal = ({ children, className = "", delay = 0, direction = "up" }: ScrollRevealProps) => {
    const variants = {
        up: { opacity: 0, y: 20 },
        left: { opacity: 0, x: -20 },
        right: { opacity: 0, x: 20 },
        scale: { opacity: 0, scale: 0.97 },
    };

    return (
        <motion.div
            initial={variants[direction]}
            whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            viewport={REVEAL_VIEWPORT}
            transition={{ duration: 0.7, ease: EASE_OUT, delay }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

/** Subtle pointer-follow wrapper for primary CTAs. Disabled for reduced motion and touch. */
export const Magnetic = ({ children, className, strength = 0.14 }: { children: ReactNode; className?: string; strength?: number }) => {
    const ref = useRef<HTMLDivElement>(null);
    const reduceMotion = useReducedMotion();
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const handlePointerMove = (e: React.PointerEvent) => {
        if (reduceMotion || e.pointerType !== "mouse" || !ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        glide(x, (e.clientX - rect.left - rect.width / 2) * strength, 0.5);
        glide(y, (e.clientY - rect.top - rect.height / 2) * strength, 0.5);
    };

    return (
        <motion.div
            ref={ref}
            style={{ x, y }}
            onPointerMove={handlePointerMove}
            onPointerLeave={() => { glide(x, 0, 0.6); glide(y, 0, 0.6); }}
            className={cn("inline-flex", className)}
        >
            {children}
        </motion.div>
    );
};

type MagneticButtonProps = ComponentPropsWithoutRef<typeof motion.button> & VariantProps<typeof buttonVariants> & {
    children: ReactNode;
    className?: string;
};

export const MagneticButton = ({ children, className, variant = "default", size = "default", ...props }: MagneticButtonProps) => (
    <Magnetic>
        <motion.button type="button" className={cn(buttonVariants({ variant, size }), className)} {...props}>
            {children}
        </motion.button>
    </Magnetic>
);

type TextRevealProps = {
    children: ReactNode;
    className?: string;
    delay?: number;
};

type WordRevealProps = {
    /** Plain text, split on spaces. Words stay real text for screen readers. */
    children: string;
    className?: string;
    delay?: number;
    /** Seconds between words. */
    step?: number;
    /** Render the words in place on first paint (no rise): for the page's LCP headline, which must not wait for JS. */
    instant?: boolean;
};

/** Word-by-word masked rise for display headings. Static under reduced motion. */
export const WordReveal = ({ children, className, delay = 0, step = 0.055, instant = false }: WordRevealProps) => {
    const ref = useRef<HTMLSpanElement>(null);
    const reduce = useReducedMotion();
    const isInView = useInView(ref, { once: true, margin: "0px 0px -12% 0px" });
    const words = children.split(" ").filter(Boolean);

    return (
        <span ref={ref} className={className}>
            {words.map((word, i) => (
                <span key={`${word}-${i}`}>
                    {/* The mask is padded and pulled back so italics and descenders never clip. */}
                    <span className="-mx-[0.16em] -my-[0.14em] inline-block overflow-hidden px-[0.16em] py-[0.14em] align-bottom">
                        {/* Opacity rides with the rise so a word never peeks above the mask edge before its turn. */}
                        <motion.span
                            className="inline-block will-change-transform"
                            initial={reduce || instant ? false : { y: "110%", opacity: 0 }}
                            animate={isInView || reduce || instant ? { y: 0, opacity: 1 } : { y: "110%", opacity: 0 }}
                            transition={{
                                y: { duration: 1.1, ease: EASE_OUT, delay: delay + i * step },
                                opacity: { duration: 0.5, ease: "easeOut", delay: delay + i * step },
                            }}
                        >
                            {word}
                        </motion.span>
                    </span>
                    {i < words.length - 1 ? " " : null}
                </span>
            ))}
        </span>
    );
};

/** Masked line reveal for headings. */
export const TextReveal = ({ children, className = "", delay = 0 }: TextRevealProps) => {
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-40px" });

    return (
        <span ref={ref} className={cn("inline-block overflow-hidden pb-[0.12em] align-bottom", className)}>
            <motion.span
                className="inline-block"
                initial={{ y: "105%" }}
                animate={isInView ? { y: 0 } : { y: "105%" }}
                transition={{ duration: 0.9, ease: EASE_OUT, delay }}
            >
                {children}
            </motion.span>
        </span>
    );
};
