"use client";

import { LayoutGroup, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuthSession } from "@/hooks/useAuthSession";
import { ROUTES } from "@/lib/config/routes";
import { SPRING_SOFT } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { PRIMARY_LINKS, activeLinkId } from "./agents";
import { HelpNow } from "@/components/help/HelpNow";
import { HeaderShell } from "./HeaderShell";
import { MobileNavigation } from "./MobileNavigation";
import { ProductMenu } from "./ProductMenu";
import { UserMenu } from "./UserMenu";

export const NAV_ITEM =
  "relative inline-flex h-10 cursor-pointer items-center rounded-full px-3 text-sm font-medium transition-colors xl:px-3.5 duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500";

/** Sliding surface behind the current / hovered destination. */
function ActivePill() {
  return (
    <motion.span
      layoutId="site-nav-pill"
      transition={SPRING_SOFT}
      aria-hidden
      className="absolute inset-0 rounded-full border border-line bg-white shadow-xs"
    />
  );
}

/**
 * Public header: the Companions menu (Mira, Lumina, Clinician Workspace), care paths, privacy and support, then "Need help now" and one way in.
 * Part of the page at the top, a quiet surface on scroll.
 */
export function MarketingHeader() {
  const pathname = usePathname();
  const { dictionary } = useLanguage();
  const copy = dictionary.header;
  const [menuOpen, setMenuOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const { signedIn, name } = useAuthSession();
  const [hovered, setHovered] = useState<string | null>(null);

  const activeId = activeLinkId(pathname);
  // The pill follows the pointer, rests on the current page, and sits under "Companions" while its list is open.
  const pillId = productOpen ? "product" : (hovered ?? activeId);

  // The end of the header follows the visitor: their own menu when signed in, otherwise the way in (and, for an adult
  // with no account, "Create account") and on an auth page, the other auth page (never a link to where they already are).
  const onSignIn = pathname === ROUTES.signIn;
  const onSignUp = pathname === ROUTES.signUp;
  const primary = onSignIn ? { href: ROUTES.signUp, label: dictionary.nav.signUp } : { href: ROUTES.signIn, label: dictionary.nav.signIn };
  const showSecondary = !onSignIn && !onSignUp;

  return (
    <HeaderShell
      position={pathname === ROUTES.home ? "fixed" : "sticky"}
      surface="capsule"
      solid={menuOpen || productOpen || userOpen}
      innerClassName="grid grid-cols-[minmax(0,1fr)_auto] lg:grid-cols-[auto_minmax(0,1fr)_auto]"
    >
      <BrandLogo size="md" className="justify-self-start" />

      <nav aria-label={dictionary.nav.mainNav} className="relative hidden justify-self-center lg:block" onPointerLeave={() => setHovered(null)}>
        <LayoutGroup id="site-nav">
          <ul className="relative flex items-center gap-0.5 rounded-full border border-line/60 bg-white/60 p-1 shadow-[inset_0_1px_0_rgb(255_255_255/0.9),0_6px_20px_-14px_rgb(17_76_97/0.5)] backdrop-blur-md">
            {PRIMARY_LINKS.map((link) => {
              const showPill = pillId === link.id;
              const tone = activeId === link.id || showPill ? "text-ink" : "text-ink-soft hover:text-ink";

              if (!link.href) {
                return (
                  <li key={link.id} onPointerEnter={() => setHovered(link.id)}>
                    <ProductMenu
                      triggerClassName={cn(NAV_ITEM, tone)}
                      indicator={showPill ? <ActivePill /> : null}
                      current={activeId === link.id}
                      onOpenChange={setProductOpen}
                    />
                  </li>
                );
              }

              const current = activeId === link.id;
              return (
                <li key={link.id} onPointerEnter={() => setHovered(link.id)}>
                  <Link href={link.href} aria-current={current ? "page" : undefined} className={cn(NAV_ITEM, tone)}>
                    {showPill && <ActivePill />}
                    <span className="relative">{copy.links[link.id]}</span>
                    {current && (
                      <span aria-hidden className="absolute bottom-1 start-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary rtl:translate-x-1/2" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </LayoutGroup>
      </nav>

      <div className="flex shrink-0 items-center gap-1.5 justify-self-end whitespace-nowrap sm:gap-2.5 xl:gap-3">
        <LanguageSwitcher className="hidden sm:inline-flex" />
        <HelpNow label="short" />
        {signedIn ? (
          <div className="hidden lg:block">
            <UserMenu name={name || dictionary.dashboard.navigation.overview} onOpenChange={setUserOpen} />
          </div>
        ) : (
          <>
            {showSecondary && (
              <Link
                href={ROUTES.signUp}
                className="hidden min-h-11 items-center rounded-full px-4 text-sm text-ink-soft transition-colors duration-200 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 xl:inline-flex"
              >
                <span className="home-link-line">{dictionary.nav.signUp}</span>
              </Link>
            )}
            {/* Phones and tablets: a compact way in beside the menu button (the full CTA takes over from lg). */}
            <Link
              href={primary.href}
              className="inline-flex h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-ink px-4 text-[0.8125rem]  text-white shadow-[0_8px_20px_-10px_rgb(17_76_97/0.7)] transition-[background-color,transform] duration-300 ease-out-soft hover:bg-teal-800 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 sm:px-5 sm:text-sm lg:hidden"
            >
              {primary.label}
            </Link>
            <Link
              href={primary.href}
              className="group hidden min-h-11 items-center gap-3 rounded-full bg-ink py-1 ps-5 pe-1 text-sm  text-white shadow-[0_10px_24px_-12px_rgb(17_76_97/0.7)] transition-[background-color,box-shadow,transform] duration-300 ease-out-soft hover:bg-teal-800 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 lg:inline-flex"
            >
              {primary.label}
              <span className="flex size-9 items-center justify-center rounded-full bg-white/15 transition-[background-color,color,transform] duration-300 ease-out-soft group-hover:bg-gold group-hover:text-ink">
                <ArrowRight className="size-4 transition-transform duration-300 ease-out-soft group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" aria-hidden />
              </span>
            </Link>
          </>
        )}
        <MobileNavigation activeId={activeId} open={menuOpen} onOpenChange={setMenuOpen} className="lg:hidden" />
      </div>
    </HeaderShell>
  );
}
