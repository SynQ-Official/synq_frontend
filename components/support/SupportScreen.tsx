"use client";

import { WordReveal } from "@/components/home/AnimationUtilities";
import { Grain } from "@/components/home/Atmosphere";
import { DrawCheck } from "@/components/home/DrawCheck";
import { homeSerif } from "@/components/home/fonts";
import { ACCENT_LIGHT, BODY, BODY_SM, DISPLAY_L, DISPLAY_S, SERIF } from "@/components/home/typography";
import { SiteHeader } from "@/components/layout/site-header";
import { MinimalFooter } from "@/components/layout/MinimalFooter";
import { FormField, IconInput } from "@/components/shared/FormField";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { EmergencyNumbers } from "@/components/help/EmergencyNumbers";
import { PendingLegalField } from "@/components/legal/PendingLegalField";
import { CONTACT } from "@/lib/config/brand";
import { ROUTES } from "@/lib/config/routes";
import { fillHelpAnswer } from "@/lib/i18n/help";
import { EASE_OUT, REVEAL_VIEWPORT, fadeUp, stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { ArrowRight, Clock, Globe2, LifeBuoy, Lock, Mail, MessageSquare, Plus, Send, UserRound } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";
import { SupportThread } from "./SupportThread";

const CHANNEL_ICONS = [Clock, Lock, Globe2] as const;
const MESSAGE_MAX = 2000;
const pad = (n: number) => String(n).padStart(2, "0");

/** One reveal per block as it reaches the reader — nothing waits behind a page-load stagger. */
const reveal = {
    variants: fadeUp(0, 18),
    initial: "hidden",
    whileInView: "show",
    viewport: REVEAL_VIEWPORT,
} as const;

function FaqItem({ item, index, open, onToggle }: { item: { question: string; answer: string }; index: number; open: boolean; onToggle: () => void }) {
    const panelId = useId();
    return (
        <li className="relative border-b border-line-strong/60 last:border-b-0">
            {/* The marker grows in place; it never travels between rows while heights change. */}
            <span aria-hidden className={cn("absolute inset-y-4 start-0 w-0.5 origin-center rounded-full bg-gold transition-transform duration-500 ease-out-soft", open ? "scale-y-100" : "scale-y-0")} />
            <h3>
                <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={onToggle}
                    className="group flex w-full items-start gap-4 py-5 ps-5 text-start outline-none transition-colors hover:bg-white/60 focus-visible:bg-white/70 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-500 sm:gap-5"
                >
                    <span className="mt-1.5 text-[0.8125rem] font-medium tabular-nums text-ink-muted transition-colors duration-300 group-hover:text-gold-700" aria-hidden>
                        {pad(index + 1)}
                    </span>
                    <span className={cn(SERIF, "min-w-0 flex-1 text-[1.1875rem] font-normal leading-snug tracking-[-0.01em] transition-colors duration-300 sm:text-[1.3125rem]", open ? "text-ink" : "text-ink-soft group-hover:text-ink")}>
                        {item.question}
                    </span>
                    <span className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border transition-[background-color,border-color,color,transform] duration-500 ease-out-soft", open ? "rotate-45 border-teal-700 bg-teal-700 text-white" : "border-line-strong bg-white text-teal-700 group-hover:border-teal-300")}>
                        <Plus className="size-4" aria-hidden />
                    </span>
                </button>
            </h3>

            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        id={panelId}
                        role="region"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: EASE_OUT }}
                        className="overflow-hidden"
                    >
                        <p className="pb-6 ps-[3.25rem] pe-3 text-[1rem] sm:pe-12 leading-7 text-ink-soft sm:ps-[3.75rem]">{item.answer}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </li>
    );
}

export function SupportScreen() {
    const { dictionary, direction, language } = useLanguage();
    const copy = dictionary.support;
    const [openFaq, setOpenFaq] = useState(0);
    const [sent, setSent] = useState(false);
    const [subject, setSubject] = useState("");
    const [topic, setTopic] = useState<number | null>(null);
    const [message, setMessage] = useState("");

    // Title: everything but the last word in ink, the last word as the olive-gold accent.
    const titleWords = copy.title.split(" ");
    const titleLead = titleWords.slice(0, -1).join(" ");
    const titleAccent = titleWords.slice(-1).join(" ");

    const fields = [
        { name: "name", label: copy.name, input: { icon: UserRound, type: "text", placeholder: copy.namePlaceholder, autoComplete: "name" } },
        { name: "email", label: copy.email, input: { icon: Mail, type: "email", placeholder: copy.emailPlaceholder, autoComplete: "email", dir: "ltr" } },
        { name: "subject", label: copy.subject, wide: true, input: { icon: MessageSquare, type: "text", placeholder: copy.subjectPlaceholder } },
    ] as const;

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        // No support API exists: the message goes out through the visitor's own e-mail app, never silently dropped.
        if (!CONTACT.email) return;
        const form = new FormData(event.currentTarget);
        const body = `${form.get("message") ?? ""}\n\n${form.get("name") ?? ""} <${form.get("email") ?? ""}>`;
        window.location.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent(String(form.get("subject") ?? ""))}&body=${encodeURIComponent(body)}`;
        setSent(true);
        event.currentTarget.reset();
        setSubject("");
        setTopic(null);
        setMessage("");
    }

    return (
        <MotionConfig reducedMotion="user">
            <div dir={direction} className={cn(homeSerif.variable, "relative isolate flex min-h-dvh flex-col overflow-x-clip bg-canvas text-ink")}>
                {/* One still wash of light: no drifting blurs behind a page people type on. */}
                <div aria-hidden className="canvas-glow pointer-events-none absolute inset-0 -z-10" />
                <Grain tone="light" />

                <SiteHeader variant="support" />

                <main className="page-container flex-1 pb-20 pt-10 sm:pt-14 lg:pb-28 lg:pt-20">
                    {/* ── Opening: the question, and what to expect ─────────────────────── */}
                    <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
                        <motion.header variants={stagger(0.08)} initial="hidden" animate="show" className="lg:col-span-7">

                            <h1 aria-label={copy.title} className={cn(DISPLAY_L, "mt-6 text-ink")}>
                                <span aria-hidden>
                                    <WordReveal delay={0.1}>{titleLead}</WordReveal>{" "}
                                    <WordReveal className={ACCENT_LIGHT} delay={0.1 + titleLead.split(" ").length * 0.055 + 0.1}>
                                        {titleAccent}
                                    </WordReveal>
                                </span>
                            </h1>

                            <motion.p variants={fadeUp(0.2)} className={cn(BODY, "mt-7 max-w-xl")}>
                                {copy.description}
                            </motion.p>
                        </motion.header>

                        <div className="lg:col-span-5">
                        <motion.div variants={fadeUp(0.25, 22)} initial="hidden" animate="show" className="mb-7">
                            <SupportThread copy={copy.thread} />
                        </motion.div>
                        <motion.ul variants={stagger(0.1, 0.4)} initial="hidden" animate="show" className="divide-y divide-line-strong/60 border-y border-line-strong/60">
                            {copy.channels.map((channel, i) => {
                                const Icon = CHANNEL_ICONS[i] ?? Clock;
                                return (
                                    <motion.li key={channel.title} variants={fadeUp(0, 12)} className="group -mx-3 flex items-start gap-4 rounded-2xl px-3 py-5 transition-[background-color,transform] duration-500 ease-out-soft hover:bg-white/70 hover:translate-x-1 rtl:hover:-translate-x-1">
                                        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-teal-100 bg-white text-teal-700 shadow-xs transition-[background-color,border-color,color,transform] duration-500 ease-out-soft group-hover:-rotate-6 group-hover:scale-105 group-hover:border-teal-700 group-hover:bg-teal-700 group-hover:text-white">
                                            <Icon className="size-5" strokeWidth={1.5} aria-hidden />
                                        </span>
                                        <span className="min-w-0">
                                            <span className="block text-[1rem]  text-ink">{channel.title}</span>
                                            <span className="mt-1 block text-[0.9375rem] leading-6 text-ink-soft">{channel.body}</span>
                                        </span>
                                    </motion.li>
                                );
                            })}
                        </motion.ul>
                        </div>
                    </div>

                    {/* ── Form and answers ───────────────────────────────────────────────── */}
                    <div className="mt-16 grid gap-10 sm:mt-20 lg:grid-cols-12 lg:items-start lg:gap-12">
                        <motion.section {...reveal} className="rounded-panel border border-line bg-white p-6 shadow-[var(--shadow-soft)] transition-[border-color,box-shadow] duration-500 ease-out-soft focus-within:border-teal-200 focus-within:shadow-[var(--shadow-soft-hover)] sm:p-9 lg:col-span-7" aria-labelledby="support-form-title">
                            <div className="mb-8 flex items-start gap-4">
                                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                                    <Mail className="size-5" strokeWidth={1.5} aria-hidden />
                                </span>
                                <div className="min-w-0">
                                    <h2 id="support-form-title" className={cn(DISPLAY_S, "text-ink")}>{copy.formTitle}</h2>
                                    <p className={cn(BODY_SM, "mt-1.5")}>{copy.formDescription}</p>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <p id="support-topics" className="mb-2.5 text-[0.875rem] font-medium text-ink-soft">{copy.topicLabel}</p>
                                    <div role="group" aria-labelledby="support-topics" className="flex flex-wrap gap-2">
                                        {copy.topics.map((label, i) => (
                                            <button
                                                key={label}
                                                type="button"
                                                aria-pressed={topic === i}
                                                onClick={() => {
                                                    setTopic(i);
                                                    setSubject(label);
                                                }}
                                                className={cn(
                                                    "min-h-10 cursor-pointer rounded-full border px-4 text-[0.875rem] font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-300 ease-out-soft hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500",
                                                    topic === i ? "border-transparent bg-primary text-white shadow-brand" : "border-line-strong bg-white text-ink-soft hover:border-teal-300 hover:text-teal-800",
                                                )}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {fields.map((f) => (
                                    <div key={f.name} className={"wide" in f ? "sm:col-span-2" : ""}>
                                        <FormField id={`support-${f.name}`} label={f.label} compact>
                                            {f.name === "subject" ? (
                                                <IconInput
                                                    id="support-subject"
                                                    name="subject"
                                                    required
                                                    {...f.input}
                                                    value={subject}
                                                    onChange={(event) => {
                                                        setSubject(event.target.value);
                                                        setTopic(null);
                                                    }}
                                                />
                                            ) : (
                                                <IconInput id={`support-${f.name}`} name={f.name} required {...f.input} />
                                            )}
                                        </FormField>
                                    </div>
                                ))}

                                <div className="sm:col-span-2">
                                    <FormField id="support-message" label={copy.message} compact>
                                        <textarea
                                            id="support-message"
                                            name="message"
                                            placeholder={copy.messagePlaceholder}
                                            value={message}
                                            onChange={(event) => setMessage(event.target.value)}
                                            maxLength={MESSAGE_MAX}
                                            className="min-h-36 w-full resize-y rounded-control border border-line-strong bg-white px-4 py-3 text-[0.9375rem] leading-6 text-ink shadow-xs outline-none transition-[border-color,box-shadow] placeholder:text-ink-subtle hover:border-teal-300 focus:border-teal-500 focus:shadow-focus"
                                            required
                                        />
                                    </FormField>
                                    <p className="mt-1.5 text-end text-[0.8125rem] tabular-nums text-ink-muted" dir="ltr">
                                        {copy.counter.replace("{n}", String(message.length)).replace("{max}", String(MESSAGE_MAX))}
                                    </p>
                                </div>

                                <div className="flex flex-col gap-4 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
                                    <Button type="submit" size="lg" disabled={!CONTACT.email} className="group w-full min-h-13 px-7 sm:w-auto">
                                        <Send className="size-4 transition-transform duration-300 ease-out-soft group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" aria-hidden />
                                        {copy.send}
                                    </Button>
                                    {CONTACT.email ? null : <PendingLegalField label={copy.sendPending} />}

                                    <AnimatePresence initial={false}>
                                        {sent && (
                                            <motion.p
                                                role="status"
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -6 }}
                                                transition={{ duration: 0.4, ease: EASE_OUT }}
                                                className="flex items-center gap-2.5 rounded-full border border-sage-100 bg-sage-50 px-4 py-2.5 text-[0.9375rem] font-medium text-sage-700"
                                            >
                                                <DrawCheck className="size-5 shrink-0" strokeWidth={2.5} />
                                                {copy.success}
                                            </motion.p>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </form>
                        </motion.section>

                        <motion.section variants={stagger(0.08)} initial="hidden" whileInView="show" viewport={REVEAL_VIEWPORT} aria-labelledby="support-faq-title" className="lg:sticky lg:top-28 lg:col-span-5">
                            <motion.div variants={fadeUp(0, 14)}>
                                <h2 id="support-faq-title" className={cn(DISPLAY_S, "mt-4 text-[clamp(1.75rem,1.2vw+1.4rem,2.25rem)] text-ink")}>
                                    {copy.faqTitle}
                                </h2>
                            </motion.div>

                            <motion.ul variants={fadeUp(0, 14)} className="mt-6 border-y border-line-strong/60">
                                {copy.faq.map((item, i) => (
                                    <FaqItem key={item.question} item={{ question: item.question, answer: fillHelpAnswer(item.answer, language) }} index={i} open={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? -1 : i)} />
                                ))}
                            </motion.ul>

                            <motion.p variants={fadeUp(0, 14)} className="mt-5">
                                <Link href={ROUTES.privacy} className="inline-flex min-h-10 items-center gap-2 rounded-md text-[0.9375rem]  text-teal-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-500">
                                    <span className="home-link-line">{copy.faqMore}</span>
                                    <ArrowRight className="size-4 rtl:-scale-x-100" aria-hidden />
                                </Link>
                            </motion.p>

                            <motion.aside variants={fadeUp(0, 14)} role="note" className="group mt-6 flex items-start gap-4 rounded-panel border border-gold-100 bg-gold-50 p-5 transition-[box-shadow,transform,border-color] duration-500 ease-out-soft hover:-translate-y-0.5 hover:border-gold-300 hover:shadow-[var(--shadow-soft-hover)] sm:p-6">
                                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white text-gold-700 shadow-xs transition-transform duration-500 ease-out-soft group-hover:rotate-12 group-hover:scale-105">
                                    <LifeBuoy className="size-5" strokeWidth={1.5} aria-hidden />
                                </span>
                                <div className="min-w-0">
                                    <p className="text-[1rem] text-ink">{copy.urgentTitle}</p>
                                    <p className="mt-1.5 text-[0.9375rem] leading-6 text-ink-soft">{copy.urgentBody}</p>
                                    <EmergencyNumbers language={language} className="mt-4" />
                                </div>
                            </motion.aside>
                        </motion.section>
                    </div>
                </main>

                <MinimalFooter showLanguage={false} className="border-t border-line-strong/60" />
            </div>
        </MotionConfig>
    );
}
