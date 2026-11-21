"use client";

import { ProgressBar } from "@/components/home";
import { PartnerStrip } from "@/components/home/PartnerLogos";
import { SectionRail } from "@/components/home/SectionRail";
import { SmoothScrollProvider } from "@/components/providers/SmoothScrollProvider";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLanguageTransition } from "@/hooks/useLanguageTransition";
import { homeSerif } from "@/components/home/fonts";
import { cn } from "@/lib/utils";
import { CTASection, FooterSection, Header, HealthcareSection, HeroSection, TeamSection, WhatSection } from "@/components/home";

/** The home page. No loading screen and no intro overlay: the server HTML is the first paint (no 00% screen, no layout jump). */
export function HomeExperience() {
  const { direction } = useLanguage();
  // Content re-settles on language change; the fixed header and progress bar stay outside it.
  const contentRef = useLanguageTransition<HTMLDivElement>();

  return (
    <main dir={direction} className={cn(homeSerif.variable, "home-page min-h-dvh w-full overflow-x-clip bg-white text-ink selection:bg-teal-200 selection:text-ink")}>
      <SmoothScrollProvider>
        <ProgressBar />
        <Header />
        <SectionRail />
        <div ref={contentRef}>
          <HeroSection />
          <PartnerStrip />
          <WhatSection />
          <HealthcareSection />
          <TeamSection />
          <CTASection />
          <FooterSection />
        </div>
      </SmoothScrollProvider>
    </main>
  );
}
