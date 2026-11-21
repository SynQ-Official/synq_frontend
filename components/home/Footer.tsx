"use client";

import { EmergencyNote } from "@/components/legal/EmergencyNote";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import { BRAND } from "@/lib/config/brand";
import { ROUTES } from "@/lib/config/routes";
import { REVEAL_VIEWPORT, fadeUp, stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { LocaleLink as Link } from "@/components/shared/LocaleLink";
import type { ReactNode } from "react";
import { Grain } from "./Atmosphere";
import { LABEL } from "./typography";

/** Route for each label in `footer.links`, `footer.companyLinks` and `footer.legalLinks` (same order). */
const PRODUCT_HREFS = [ROUTES.mira, ROUTES.lumina, ROUTES.tracks, ROUTES.psy] as const;
const HELP_HREFS = [ROUTES.support, ROUTES.signIn, ROUTES.signUp, ROUTES.clinicAccess] as const;
const LEGAL_HREFS = [ROUTES.privacy, ROUTES.terms] as const;
const LINK_CLASS = "inline-flex min-h-11 items-center rounded-md text-[1rem] text-ink-soft transition-colors duration-200 hover:text-teal-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500";

function FooterGroup({ title, hrefs, items }: { title: string; hrefs: readonly string[]; items: readonly string[] }): ReactNode {
    return (
        <motion.nav variants={fadeUp(0, 12)} aria-label={title} className="min-w-0">
            <h2 className={cn(LABEL, "text-ink")}>{title}</h2>
            <ul className="mt-3 flex flex-col">
                {items.map((item, index) => (
                    <li key={item}>
                        <Link href={hrefs[index] ?? ROUTES.home} className={LINK_CLASS}>
                            <span className="home-link-line">{item}</span>
                        </Link>
                    </li>
                ))}
            </ul>
        </motion.nav>
    );
}

/**
 * Closing chapter of the home page, in four clear bands: the brand and what it is, the three link groups (product, help,
 * legal), the emergency numbers, and a bottom bar with the copyright, the programmes that support SynQ and the language.
 */
export const Footer = () => {
    const { dictionary } = useLanguage();
    const copy = dictionary.homeLanding.footer;
    const home = dictionary.home;

    return (
        <footer id="contact" className="relative isolate bg-canvas">
            <Grain tone="light" />
            <motion.div variants={stagger(0.08)} initial="hidden" whileInView="show" viewport={REVEAL_VIEWPORT} className="page-container pb-8 pt-16 md:pt-24">
                <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-8">
                    <motion.div variants={fadeUp(0, 12)} className="lg:col-span-4">
                        <BrandLogo size="lg" priority={false} />
                        <p className="mt-5 max-w-xs text-pretty text-[0.9375rem] leading-7 text-ink-soft">{copy.tagline}</p>
                    </motion.div>

                    <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:col-span-7 lg:col-start-6">
                        <FooterGroup title={copy.product} hrefs={PRODUCT_HREFS} items={copy.links} />
                        <FooterGroup title={copy.company} hrefs={HELP_HREFS} items={copy.companyLinks} />
                        <div className="col-span-2 sm:col-span-1">
                            <FooterGroup title={copy.legal} hrefs={LEGAL_HREFS} items={copy.legalLinks} />
                        </div>
                    </div>
                </div>

                <motion.div variants={fadeUp(0, 8)} className="mt-12">
                    <EmergencyNote />
                </motion.div>

                <motion.div variants={fadeUp(0, 8)} className="mt-8 flex flex-col items-center gap-4 border-t border-line-strong/70 pt-6 text-center md:flex-row md:justify-between md:text-start">
                    <div className="flex flex-col gap-1.5">
                        <p className="text-[0.875rem] text-ink-soft">
                            © {new Date().getFullYear()} {BRAND.name}. {copy.rights}
                        </p>
                        <p className="text-[0.8125rem] leading-5 text-ink-muted">
                            {home.partners} {home.partnerBackedNames.join(" · ")}
                        </p>
                    </div>
                    <LanguageSwitcher />
                </motion.div>
            </motion.div>
        </footer>
    );
};
