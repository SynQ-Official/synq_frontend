"use client";

import { Grain } from "@/components/home/Atmosphere";
import { homeSerif } from "@/components/home/fonts";
import { BODY, DISPLAY_L } from "@/components/home/typography";
import { MinimalFooter } from "@/components/layout/MinimalFooter";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { ROUTES } from "@/lib/config/routes";
import { legalUi } from "@/lib/i18n/legal";
import { cn } from "@/lib/utils";
import { LocaleLink as Link } from "@/components/shared/LocaleLink";

/** The 404 page: its own title (see app/not-found.tsx), a plain sentence, and two ways out. */
export function NotFoundScreen() {
  const { language, direction } = useLanguage();
  const copy = legalUi[language].notFound;

  return (
    <div dir={direction} className={cn(homeSerif.variable, "relative isolate flex min-h-dvh flex-col overflow-x-clip bg-canvas text-ink")}>
      <div aria-hidden className="canvas-glow pointer-events-none absolute inset-0 -z-10" />
      <Grain tone="light" />
      <SiteHeader variant="public" />

      <main className="page-container flex flex-1 flex-col items-start justify-center py-16 sm:py-24">
        <h1 className={cn(DISPLAY_L, "text-ink")}>{copy.title}</h1>
        <p className={cn(BODY, "mt-6 max-w-xl")}>{copy.body}</p>
        <div className="mt-9 flex flex-wrap items-center gap-3">
          <Button asChild size="lg" className="min-h-12 px-7 shadow-brand">
            <Link href={ROUTES.home}>{copy.home}</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="min-h-12 border-line-strong bg-white px-7">
            <Link href={ROUTES.support}>{copy.support}</Link>
          </Button>
        </div>
      </main>

      <MinimalFooter showLanguage={false} className="border-t border-line-strong/60" />
    </div>
  );
}
