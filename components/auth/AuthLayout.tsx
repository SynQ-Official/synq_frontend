"use client";

import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { AuthBrandPanel } from "@/components/auth/AuthBrandPanel";
import { homeSerif } from "@/components/home/fonts";
import { SiteHeader } from "@/components/layout/site-header";
import { GridBackdrop } from "@/components/shared/GridBackdrop";
import { LegalLinks } from "@/components/legal/LegalLinks";
import { LogoLoader } from "@/components/shared/LogoLoader";
import { Toaster } from "@/components/ui/sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLanguageTransition } from "@/hooks/useLanguageTransition";
import { BRAND } from "@/lib/config/brand";
import { cn } from "@/lib/utils";

/**
 * Shell for /auth/*: the same capsule header as every public page (it adapts — here it offers the other
 * auth page), a still hairline-grid canvas, and the form first with the brand story beside it on desktop.
 * Mobile/tablet: the form is the whole experience; the layout mirrors by reading direction via grid order.
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  const { direction, dictionary } = useLanguage();
  const scope = useLanguageTransition<HTMLElement>();

  return (
    <div dir={direction} className={cn(homeSerif.variable, "relative isolate flex min-h-dvh flex-col overflow-x-clip bg-canvas text-ink")}>
      <GridBackdrop />
      {/* Validation and sign-in failures surface here as well as inline, so they are never missed. */}
      <Toaster position="top-center" richColors closeButton dir={direction} />

      <SiteHeader variant="public" />

      <main
        ref={scope}
        className="page-container relative flex flex-1 flex-col pb-12 pt-6 sm:pb-16 sm:pt-10 lg:grid lg:grid-cols-[minmax(0,30rem)_minmax(0,1fr)] lg:items-stretch lg:gap-10 lg:pt-6 xl:gap-16"
      >
        <div className="mx-auto flex w-full max-w-[28rem] flex-1 flex-col justify-start sm:justify-center md:max-w-[34rem] lg:max-w-none lg:py-4">{children}</div>
        <AuthBrandPanel />
      </main>

      <footer className="page-container relative flex flex-wrap items-center justify-center gap-x-4 gap-y-1 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-[0.875rem] text-ink-soft sm:justify-between">
        <p className="inline-flex items-center gap-2">
          <ShieldCheck className="size-4 shrink-0 text-sage-700" aria-hidden />
          © {new Date().getFullYear()} {BRAND.name}
        </p>
        <LegalLinks />
        <Link href="/support" className="inline-flex min-h-10 items-center rounded-md transition-colors duration-200 hover:text-teal-700">
          <span className="home-link-line">{dictionary.nav.support}</span>
        </Link>
      </footer>
    </div>
  );
}

/**
 * Shown while the page works out whether the visitor already has a session (and while it redirects them). It covers
 * the whole screen — header, form and brand panel included — so a signed-in visitor never sees the sign-in page at all.
 */
export function AuthLoading() {
  return (
    <div role="status" aria-live="polite" className="fixed inset-0 z-[100] flex items-center justify-center bg-canvas">
      <LogoLoader size={64} className="w-full" />
    </div>
  );
}
