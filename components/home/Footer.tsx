"use client";

import { BrandLogo } from "@/components/shared/BrandLogo";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { BRAND } from "@/lib/config/brand";
import { ROUTES } from "@/lib/config/routes";
import { REVEAL_VIEWPORT, fadeUp, stagger } from "@/lib/motion";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Grain } from "./Atmosphere";
import { LABEL, SERIF } from "./typography";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

/** Route for each label in `footer.links` / `footer.companyLinks` (same order). */
const PRODUCT_HREFS = [ROUTES.mira, ROUTES.lumina, ROUTES.tracks, `${ROUTES.home}#healthcare`, ROUTES.trust] as const;
const ACCOUNT_HREFS = [ROUTES.support, ROUTES.signIn, ROUTES.signUp] as const;
const LINK_CLASS = "inline-flex min-h-10 items-center rounded-md text-[1rem] text-ink-soft transition-colors duration-200 hover:text-teal-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500";

function FooterGroup({ title, children }: { title: string; children: ReactNode }) {
    return (
        <motion.nav variants={fadeUp(0, 12)} aria-label={title}>
            <h2 className={cn(LABEL, "text-ink")}>{title}</h2>
            <ul className="mt-4">{children}</ul>
        </motion.nav>
    );
}

/** Closing chapter of the home page: mission, navigation, updates, language. */
export const Footer = () => {
    const { dictionary } = useLanguage();
    const copy = dictionary.homeLanding.footer;

    return (
        <footer id="contact" className="relative isolate bg-canvas">
            <Grain tone="light" />
            <motion.div
                variants={stagger(0.08)}
                initial="hidden"
                whileInView="show"
                viewport={REVEAL_VIEWPORT}
                className="page-container pb-10 pt-20 md:pt-28"
            >
                <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-10">
                    <motion.div variants={fadeUp(0, 12)} className="lg:col-span-5">
                        <BrandLogo size="lg" priority={false} />
                        <p className={cn(SERIF, "mt-8 max-w-md text-[clamp(1.5rem,1vw+1.2rem,2.125rem)] font-light leading-[1.25] tracking-[-0.02em] text-ink rtl:tracking-normal")}>
                            {copy.description}
                        </p>
                    </motion.div>

                    {/* Two short groups sit side by side at every size — no stacked single-link columns. */}
                    <div className="grid grid-cols-2 gap-8 lg:col-span-3 lg:col-start-7">
                        <FooterGroup title={copy.product}>
                            {copy.links.map((item, index) => (
                                <li key={item}>
                                    <Link href={PRODUCT_HREFS[index] ?? ROUTES.home} className={LINK_CLASS}>
                                        <span className="home-link-line">{item}</span>
                                    </Link>
                                </li>
                            ))}
                        </FooterGroup>
                        <FooterGroup title={copy.company}>
                            {copy.companyLinks.map((item, index) => (
                                <li key={item}>
                                    <Link href={ACCOUNT_HREFS[index] ?? ROUTES.support} className={LINK_CLASS}>
                                        <span className="home-link-line">{item}</span>
                                    </Link>
                                </li>
                            ))}
                        </FooterGroup>
                    </div>

                    <motion.div variants={fadeUp(0, 12)} className="lg:col-span-3">
                        <label htmlFor="footer-updates-email" className={cn(LABEL, "text-ink")}>
                            {copy.updates}
                        </label>
                        <div className="mt-4 flex min-w-0 gap-2">
                            <input
                                id="footer-updates-email"
                                type="email"
                                inputMode="email"
                                autoComplete="email"
                                placeholder={copy.email}
                                className="h-12 min-w-0 flex-1 rounded-full border border-line-strong bg-white px-4 text-sm text-ink outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-ink-subtle hover:border-teal-300 focus:border-teal-500 focus:shadow-focus"
                            />
                            <Button type="button" size="icon" className="group h-12 w-12 min-h-12 shrink-0" aria-label={copy.updates}>
                                <ArrowRight className="transition-transform duration-300 ease-out-soft group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" aria-hidden />
                            </Button>
                        </div>
                    </motion.div>
                </div>

                <motion.div
                    variants={fadeUp(0, 8)}
                    className="mt-16 flex flex-col-reverse items-center gap-5 border-t border-line-strong/70 pt-6 sm:flex-row sm:justify-between"
                >
                    <p className="text-[0.875rem] text-ink-soft">
                        © {new Date().getFullYear()} {BRAND.name}. {copy.rights}
                    </p>
                    <LanguageSwitcher />
                </motion.div>
            </motion.div>
        </footer>
    );
};
