"use client";

import { CinematicIntro, LoadingScreen, ProgressBar } from "@/components/home";
import { SectionRail } from "@/components/home/SectionRail";
import { SmoothScrollProvider } from "@/components/providers/SmoothScrollProvider";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLanguageTransition } from "@/hooks/useLanguageTransition";
import { homeSerif } from "@/components/home/fonts";
import { HOME_INTRO_COOKIE } from "@/lib/config/home";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { CTASection, FooterSection, Header, HealthcareSection, HeroSection, WhatSection } from "@/components/home";

type Phase = "loading" | "intro" | "main";

export function HomeExperience({ introSeen }: { introSeen: boolean }) {
  const { direction } = useLanguage();
  const [phase, setPhase] = useState<Phase>(introSeen ? "main" : "loading");
  // Content re-settles on language change; the fixed header and progress bar stay outside it.
  const contentRef = useLanguageTransition<HTMLDivElement>();
  const HOME_INTRO_STORAGE_KEY = "mindsens_home_intro_seen";

  // Visitors who saw the intro before the cookie existed are recognised once, then remembered by cookie.
  useEffect(() => {
    let seenBefore = false;
    try {
      seenBefore = localStorage.getItem(HOME_INTRO_STORAGE_KEY) === "1";
      localStorage.setItem(HOME_INTRO_STORAGE_KEY, "1");
    } catch {
      /* storage blocked: the intro simply plays */
    }
    document.cookie = `${HOME_INTRO_COOKIE}=1; path=/; max-age=31536000; samesite=lax`;
    if (!seenBefore) return;
    const timer = window.setTimeout(() => setPhase((current) => (current === "loading" ? "main" : current)), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.body.style.overflow = phase === "main" ? "auto" : "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [phase]);

  return (
    <main
      dir={direction}
      className={cn(homeSerif.variable, "home-page min-h-dvh w-full overflow-x-clip bg-white text-ink selection:bg-teal-200 selection:text-ink")}
    >
      <AnimatePresence>
        {phase === "loading" && (
          <LoadingScreen key="loading" onComplete={() => setPhase("intro")} onSkip={() => setPhase("main")} />
        )}
        {phase === "intro" && (
          <CinematicIntro key="intro" onComplete={() => setPhase("main")} />
        )}
        {phase === "main" && (
          <motion.div
            key="main"
            initial={introSeen ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative w-full"
          >
            <SmoothScrollProvider>
              <ProgressBar />
              <Header />
              <SectionRail />
              <div ref={contentRef}>
                <HeroSection />
                <WhatSection />
                <HealthcareSection />
                <CTASection />
                <FooterSection />
              </div>
            </SmoothScrollProvider>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
