"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Grain } from "@/components/home/Atmosphere";
import { homeSerif } from "@/components/home/fonts";
import { LABEL, SERIF } from "@/components/home/typography";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import { notifySessionChange, useAuthSession } from "@/hooks/useAuthSession";
import { authApi } from "@/lib/api/auth";
import { ROUTES } from "@/lib/config/routes";
import { EASE_IN_OUT, EASE_OUT, fadeUp, stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { AgentAvatar } from "./AgentAvatar";
import { AGENTS, PRIMARY_LINKS, type PrimaryLinkId } from "./agents";
import { initialOf } from "./UserMenu";

/** Two lines that fold into an X — shared by the trigger and the in-panel close so the switch reads as one control. */
function MenuGlyph({ open }: { open: boolean }) {
  return (
    <span aria-hidden className="relative block h-3 w-[1.125rem]">
      <span className={cn("absolute inset-x-0 top-0 h-[1.5px] rounded-full bg-current transition-transform duration-300 ease-out-soft", open && "translate-y-[5.25px] rotate-45")} />
      <span className={cn("absolute inset-x-0 bottom-0 h-[1.5px] rounded-full bg-current transition-transform duration-300 ease-out-soft", open && "-translate-y-[5.25px] -rotate-45")} />
    </span>
  );
}

const ROUND_CONTROL =
  "relative inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500";
const LIGHT_CONTROL = "border-line bg-white/80 text-ink backdrop-blur-sm hover:border-teal-200 hover:text-teal-800";
const DEEP_CONTROL = "border-white/25 bg-white/10 text-white hover:bg-white/20 focus-visible:outline-gold-300";

type MobileNavigationProps = {
  activeId: PrimaryLinkId | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
};

/**
 * Mobile & tablet navigation: a deep-teal sheet that unrolls from the top edge.
 * Agents first (the product), then large numbered destinations, then language and the visitor's own actions —
 * the way in when signed out, their space and sign-out when signed in.
 */
export function MobileNavigation({ activeId, open, onOpenChange, className }: MobileNavigationProps) {
  const { dictionary, direction } = useLanguage();
  const reduce = useReducedMotion();
  const pathname = usePathname();
  const { signedIn, name } = useAuthSession();
  const [leaving, setLeaving] = useState(false);
  const copy = dictionary.header;
  const nav = dictionary.homeLanding.nav;
  const close = () => onOpenChange(false);

  // Never leave a mobile menu open behind the desktop layout.
  useEffect(() => {
    if (!open) return;
    const query = window.matchMedia("(min-width: 1024px)");
    const onChange = (event: MediaQueryListEvent) => event.matches && onOpenChange(false);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [open, onOpenChange]);

  // Deterministic page lock while open (the home page manages body overflow inline, so don't rely on defaults).
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const links = PRIMARY_LINKS.flatMap((link) => (link.href ? [{ ...link, href: link.href }] : []));
  const onSignIn = pathname === ROUTES.signIn;
  const onSignUp = pathname === ROUTES.signUp;

  async function signOut() {
    setLeaving(true);
    try {
      await authApi.logout();
    } catch {
      setLeaving(false); // the server could not end the session: stay signed in so the visitor can retry
      return;
    }
    setLeaving(false);
    notifySessionChange();
    close();
  }

  const reveal = reduce ? { opacity: 1 } : { clipPath: "inset(0% 0% 0% 0%)" };
  const hidden = reduce ? { opacity: 0 } : { clipPath: "inset(0% 0% 100% 0%)" };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Trigger asChild>
        <button type="button" aria-label={nav.menu} className={cn(ROUND_CONTROL, LIGHT_CONTROL, className)}>
          <MenuGlyph open={false} />
        </button>
      </Dialog.Trigger>

      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Content forceMount asChild aria-describedby={undefined}>
              <motion.div
                dir={direction}
                data-lenis-prevent
                initial={hidden}
                animate={{ ...reveal, transition: { duration: 0.7, ease: EASE_IN_OUT } }}
                exit={{ ...hidden, transition: { duration: 0.45, ease: EASE_IN_OUT } }}
                className={cn(
                  homeSerif.variable,
                  "fixed inset-0 z-[60] isolate flex flex-col overflow-y-auto overscroll-contain bg-deep text-white lg:hidden",
                )}
              >
                <Dialog.Title className="sr-only">{dictionary.nav.mainNav}</Dialog.Title>
                <Grain />

                {/* Mirrors the header row so the menu opens "in place". */}
                <div className="pt-[env(safe-area-inset-top)]">
                  <div className="page-container flex h-16 items-center justify-between gap-3">
                    <span className="inline-flex rounded-full bg-white px-3.5 py-1">
                      <BrandLogo size="sm" href={null} />
                    </span>
                    <Dialog.Close asChild>
                      <button type="button" aria-label={nav.close} className={cn(ROUND_CONTROL, DEEP_CONTROL)}>
                        <MenuGlyph open />
                      </button>
                    </Dialog.Close>
                  </div>
                </div>

                <motion.nav
                  aria-label={dictionary.nav.mainNav}
                  variants={stagger(0.07, 0.25)}
                  initial="hidden"
                  animate="show"
                  className="page-container mt-4 flex-1 sm:mt-6"
                >
                  {signedIn && (
                    <motion.p variants={fadeUp(0, 10)} className="mb-7 flex items-center gap-3.5">
                      <span className="flex size-12 items-center justify-center rounded-full bg-white/10 text-[1.125rem] font-medium text-white ring-2 ring-gold/60">
                        {initialOf(name)}
                      </span>
                      <span className={cn(SERIF, "min-w-0 truncate text-[1.5rem] font-light")}>{name}</span>
                    </motion.p>
                  )}

                  {/* The product: one titled group, Mira, Lumina and Psy under it. */}
                  <motion.p variants={fadeUp(0, 10)} className={cn(LABEL, "flex items-center gap-3 text-teal-200")}>
                    <span aria-hidden className="h-px w-8 bg-gold-300" />
                    {copy.menu.title}
                  </motion.p>
                  <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                    {AGENTS.map((agent) => {
                      const item = copy.agents.items[agent.id];
                      const active = pathname === agent.href;
                      return (
                        <motion.li key={agent.id} variants={fadeUp(0, 14)}>
                          <Link
                            href={agent.href}
                            onClick={close}
                            aria-current={active ? "page" : undefined}
                            className="group flex min-h-[4.5rem] items-center gap-4 rounded-[1.5rem] border border-white/15 bg-white/[0.06] p-3 pe-4 outline-none transition-colors duration-300 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-gold-300"
                          >
                            <AgentAvatar agent={agent.id} className="size-14 rounded-2xl" />
                            <span className="min-w-0 flex-1">
                              <span className={cn(SERIF, "block text-[1.5rem] font-light leading-none tracking-[-0.02em] rtl:font-sans rtl:font-semibold rtl:tracking-normal", active && "text-gold-300")}>{item.name}</span>
                              <span className="mt-1.5 block truncate text-[0.8125rem] text-teal-100">{item.role}</span>
                            </span>
                            <ArrowRight className="size-5 shrink-0 text-white/60 transition-[translate,color] duration-300 ease-out-soft group-hover:translate-x-1 group-hover:text-gold-300 rtl:-scale-x-100 rtl:group-hover:-translate-x-1" aria-hidden />
                          </Link>
                        </motion.li>
                      );
                    })}
                  </ul>

                  <ul className="mt-8 border-t border-white/15">
                    {links.map((link, index) => {
                      const active = link.id === activeId;
                      return (
                        <motion.li key={link.id} variants={fadeUp(0, 14)}>
                          <Link
                            href={link.href}
                            onClick={close}
                            aria-current={active ? "page" : undefined}
                            className="group flex min-h-[4.5rem] items-center gap-5 border-b border-white/15 py-3 outline-none focus-visible:bg-white/5 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold-300"
                          >
                            <span className="w-7 shrink-0 text-[0.8125rem] font-medium tabular-nums text-gold-300" aria-hidden>
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            <span
                              className={cn(
                                SERIF,
                                "min-w-0 flex-1 text-[clamp(1.875rem,7vw,2.75rem)] font-light leading-tight tracking-[-0.025em] rtl:tracking-normal",
                                active && "italic text-gold-300 rtl:not-italic",
                              )}
                            >
                              {copy.links[link.id]}
                            </span>
                            <ArrowRight
                              className="size-5 shrink-0 text-white/60 transition-[translate,color] duration-300 ease-out-soft group-hover:translate-x-1 group-hover:text-gold-300 rtl:-scale-x-100 rtl:group-hover:-translate-x-1"
                              aria-hidden
                            />
                          </Link>
                        </motion.li>
                      );
                    })}
                  </ul>
                </motion.nav>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT, delay: 0.55 } }}
                  className="page-container pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-10"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[0.9375rem] font-medium text-teal-100">{dictionary.nav.language}</span>
                    <LanguageSwitcher size="md" />
                  </div>

                  <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
                    {signedIn ? (
                      <>
                        <Link
                          href={ROUTES.dashboard}
                          onClick={close}
                          className="group inline-flex min-h-14 items-center justify-center gap-2.5 rounded-full bg-white px-6 text-[0.9375rem] font-semibold text-ink shadow-[0_18px_36px_-18px_rgb(0_0_0/0.6)] transition-colors duration-300 hover:bg-gold-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300"
                        >
                          {dictionary.dashboard.navigation.overview}
                          <ArrowRight className="size-4 transition-transform duration-300 ease-out-soft group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" aria-hidden />
                        </Link>
                        <button
                          type="button"
                          onClick={() => void signOut()}
                          disabled={leaving}
                          className="inline-flex min-h-14 cursor-pointer items-center justify-center gap-2.5 rounded-full border border-white/25 bg-white/5 px-6 text-[0.9375rem] font-semibold text-white transition-colors duration-300 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300 disabled:opacity-60"
                        >
                          <LogOut className="size-4 rtl:-scale-x-100" aria-hidden />
                          {dictionary.dashboard.navigation.signOut}
                        </button>
                      </>
                    ) : (
                      <>
                        {!onSignIn && (
                          <Link
                            href={ROUTES.signIn}
                            onClick={close}
                            className={cn(
                              "group inline-flex min-h-14 items-center justify-center gap-2.5 rounded-full bg-white px-6 text-[0.9375rem] font-semibold text-ink shadow-[0_18px_36px_-18px_rgb(0_0_0/0.6)] transition-colors duration-300 hover:bg-gold-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300",
                              onSignUp && "sm:col-span-2",
                            )}
                          >
                            {dictionary.nav.signIn}
                            <ArrowRight className="size-4 transition-transform duration-300 ease-out-soft group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" aria-hidden />
                          </Link>
                        )}
                        {!onSignUp && (
                          <Link
                            href={ROUTES.signUp}
                            onClick={close}
                            className={cn(
                              "inline-flex min-h-14 items-center justify-center rounded-full border border-white/25 bg-white/5 px-6 text-[0.9375rem] font-semibold text-white transition-colors duration-300 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300",
                              onSignIn && "sm:col-span-2",
                            )}
                          >
                            {dictionary.nav.signUp}
                          </Link>
                        )}
                      </>
                    )}
                  </div>
                  <p className="mt-7 text-[0.875rem] leading-6 text-teal-100">{dictionary.home.disclaimer}</p>
                </motion.div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
