"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, HeartPulse, NotebookPen, ShieldCheck, Target, Volume2, VolumeX } from "lucide-react";
import { homeSerif } from "@/components/home/fonts";
import { BODY, LABEL, SERIF } from "@/components/home/typography";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { LuminaHero3D } from "@/components/patient/welcome/LuminaHero3D";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePatient } from "@/hooks/patient/usePatient";
import { useCalmTrack } from "@/hooks/useCalmTrack";
import { usePatientCopy } from "@/hooks/usePatientCopy";
import { profileApi } from "@/lib/api/patient";
import { fill } from "@/lib/i18n/patient";
import { markWelcomeSeen } from "@/lib/patient/onboarding";
import { canSpeak, speakWelcome, type SpeakHandle } from "@/lib/patient/voice";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** One icon per pillar of the daily space, in the copy's order: check-in, journal, goals. */
const PILLAR_ICONS = [HeartPulse, NotebookPen, Target];

type Phase = "intro" | "playing" | "done";

/** How long a caption stays before the next one, from its length (reading/speaking pace). */
const holdFor = (text: string, arabic: boolean) => Math.max(1800, text.length * (arabic ? 78 : 64));
const REDIRECT_MS = 3200;

/**
 * The first thing a new patient sees after signing up: a 3D presence, a spoken welcome (with
 * captions, and a silent path) and a hand-off to the first check-in. No navigation, no dashboard
 * chrome — only a language switch and "skip".
 */
export function WelcomeExperience() {
  const copy = usePatientCopy();
  const w = copy.welcome;
  const router = useRouter();
  const reduce = useReducedMotion();
  const calm = useCalmTrack();
  const { language } = useLanguage();
  const { profile, name, refreshProfile } = usePatient();
  const [phase, setPhase] = useState<Phase>("intro");
  const [visible, setVisible] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [withSound, setWithSound] = useState(true);
  const voice = useRef<SpeakHandle | null>(null);
  const timers = useRef<number[]>([]);

  const lines = w.lines.map((line) => fill(line, { name }));
  const soundPossible = canSpeak();

  const clear = useCallback(() => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
  }, []);

  const stopVoice = useCallback(() => {
    voice.current?.cancel();
    voice.current = null;
    setSpeaking(false);
  }, []);

  const go = useCallback(() => {
    clear();
    stopVoice();
    markWelcomeSeen(profile.id);
    // The welcome is the whole onboarding now: finish it, then start with the first check-in.
    void (profile.hasCompletedOnboarding ? Promise.resolve() : profileApi.completeOnboarding().then(refreshProfile)).catch(() => undefined);
    router.replace(profile.hasCompletedOnboarding ? "/dashboard" : "/dashboard/check-in");
  }, [clear, stopVoice, profile.id, profile.hasCompletedOnboarding, refreshProfile, router]);

  useEffect(() => () => {
    clear();
    voice.current?.cancel();
  }, [clear]);

  const play = useCallback(
    (sound: boolean) => {
      clear();
      stopVoice();
      setWithSound(sound);
      setPhase("playing");
      setVisible(0);

      // Captions follow the speech pace whether or not it is audible.
      let at = 250;
      lines.forEach((line, index) => {
        timers.current.push(window.setTimeout(() => setVisible(index + 1), at));
        at += holdFor(line, language === "ar");
      });
      let captionsDone = false;
      let speechDone = !sound;
      const finish = () => captionsDone && speechDone && setPhase("done");
      timers.current.push(window.setTimeout(() => { captionsDone = true; finish(); }, at));

      if (sound) {
        void speakWelcome(fill(w.voiceText, { name }), language, {
          onStart: () => setSpeaking(true),
          onEnd: () => { setSpeaking(false); speechDone = true; finish(); },
          onError: () => { setSpeaking(false); speechDone = true; finish(); },
        }).then((handle) => {
          voice.current = handle;
          if (!handle) { speechDone = true; finish(); }
        });
      }
    },
    // The captions/voice text depend on the language and name at the moment of pressing play.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [language, name, clear, stopVoice, w],
  );

  // Once the welcome is finished, hand over to the first check-in.
  useEffect(() => {
    if (phase !== "done") return;
    const timer = window.setTimeout(go, REDIRECT_MS);
    return () => window.clearTimeout(timer);
  }, [phase, go]);

  return (
    <div className={cn(homeSerif.variable, "lm-canvas relative flex min-h-dvh flex-col overflow-hidden")}>
      <header className="relative z-10 flex items-center justify-between gap-3 px-5 py-4 sm:px-8">
        <BrandLogo size="sm" href={null} />
        <div className="flex items-center gap-3">
          {phase === "intro" && <LanguageSwitcher />}
          <Button variant="ghost" size="sm" onClick={go}>{w.skip}</Button>
        </div>
      </header>

      {/* One centred column on every screen: the presence in the middle, the words beneath it.
          Top-aligned rather than vertically centred, so nothing jumps when the intro gives way to the captions. */}
      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col items-center px-5 pb-10 pt-[clamp(0.5rem,3vh,2.5rem)] text-center sm:px-8 lg:pb-14">
        <div className="relative flex flex-col items-center">
          <motion.div
            className="relative aspect-square w-[min(14rem,30vh)] sm:w-[min(17rem,32vh)] lg:w-[min(20rem,34vh)]"
            animate={{ scale: phase === "intro" ? 1 : 1.05 }}
            transition={{ duration: reduce ? 0 : 1.2, ease: EASE_OUT }}
          >
            <div aria-hidden className="pointer-events-none absolute -inset-[35%] rounded-full bg-[radial-gradient(circle,var(--lm-g1),var(--lm-g4)_45%,transparent_70%)] opacity-80 blur-2xl" />
            {/* While the voice speaks, soft rings breathe out from the presence (none on calm tracks or under reduced motion). */}
            {!reduce && !calm &&
              [0, 1].map((ring) => (
                <motion.span
                  key={ring}
                  aria-hidden
                  className="pointer-events-none absolute inset-[8%] rounded-full border border-teal-400/40"
                  initial={{ opacity: 0 }}
                  animate={speaking ? { scale: [1, 1.38], opacity: [0.55, 0] } : { scale: 1, opacity: 0 }}
                  transition={speaking ? { duration: 2.6, repeat: Infinity, ease: "easeOut", delay: ring * 1.3 } : { duration: 0.6 }}
                />
              ))}
            <LuminaHero3D speaking={speaking} />
          </motion.div>
          {/* A soft floor shadow grounds the presence on the page. */}
          <span aria-hidden className="-mt-3 h-5 w-[min(9rem,55%)] rounded-[50%] bg-teal-900/15 blur-lg" />
        </div>

        <div className="mt-6 flex w-full min-w-0 flex-col items-center sm:mt-8">
          <AnimatePresence mode="wait">
            {phase === "intro" ? (
              <motion.div key="intro" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.5, ease: EASE_OUT }} className="flex w-full flex-col items-center">
                <p className={cn(LABEL, "flex items-center gap-3 text-teal-700")}>
                  <span aria-hidden className="h-px w-8 bg-gold-300" />
                  {w.eyebrow}
                  <span aria-hidden className="h-px w-8 bg-gold-300" />
                </p>
                <h1 className={cn(SERIF, "mt-4 max-w-[18ch] text-[clamp(2.125rem,2.4vw+1.4rem,3.5rem)] font-light leading-[1.06] tracking-[-0.03em] text-ink rtl:font-semibold rtl:tracking-normal")}>
                  {w.tap}
                </h1>
                <p className={cn(BODY, "mt-4 max-w-xl")}>{w.intro}</p>

                {/* Phones: three compact chips (titles only). From sm: three centred columns with a short line each. */}
                <ul className="mt-6 flex w-full max-w-2xl flex-wrap justify-center gap-2 sm:mt-8 sm:grid sm:grid-cols-3 sm:gap-x-8 sm:gap-y-3">
                  {w.pillars.map((pillar, index) => {
                    const Icon = PILLAR_ICONS[index] ?? HeartPulse;
                    return (
                      <li
                        key={pillar.title}
                        className="inline-flex items-center gap-2 rounded-full bg-white/75 py-1.5 pe-3.5 ps-1.5 ring-1 ring-line sm:flex sm:flex-col sm:items-center sm:gap-2.5 sm:rounded-none sm:bg-transparent sm:p-0 sm:text-center sm:ring-0"
                      >
                        <span aria-hidden className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/80 text-teal-700 sm:size-10 sm:shadow-sm sm:ring-1 sm:ring-line">
                          <Icon className="size-4 sm:size-[1.125rem]" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[0.9375rem] font-semibold text-ink">{pillar.title}</span>
                          <span className="mt-0.5 block text-[0.875rem] leading-6 text-ink-soft max-sm:hidden">{pillar.body}</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>

                <div className="mt-8 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
                  {soundPossible && (
                    <Button variant="hero" size="lg" onClick={() => play(true)} className="w-full sm:w-auto">
                      <Volume2 aria-hidden />{w.withSound}
                    </Button>
                  )}
                  <Button variant={soundPossible ? "outline" : "hero"} size="lg" onClick={() => play(false)} className="w-full sm:w-auto">{w.noSound}</Button>
                </div>
                <p className="mt-5 inline-flex items-center gap-2 text-[0.8125rem] text-ink-soft">
                  <ShieldCheck className="size-4 shrink-0 text-teal-700" aria-hidden />
                  {w.safe}
                </p>
              </motion.div>
            ) : (
              <motion.div key="play" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex w-full flex-col items-center gap-8">
                {/* Room for all three lines up front: the buttons stay put while the captions arrive. */}
                <div aria-live="polite" className="flex min-h-[17rem] w-full max-w-2xl flex-col items-center space-y-4 sm:min-h-[15rem]">
                  {lines.slice(0, visible).map((line, index) => (
                    <motion.p
                      key={line}
                      initial={{ opacity: 0, y: 10, filter: reduce ? "none" : "blur(6px)" }}
                      animate={{ opacity: index === visible - 1 || phase === "done" ? 1 : 0.7, y: 0, filter: "blur(0px)" }}
                      transition={{ duration: 0.7, ease: EASE_OUT }}
                      className={index === 0 ? cn(SERIF, "text-[clamp(1.875rem,1.8vw+1.3rem,2.75rem)] font-light leading-[1.1] text-ink rtl:font-semibold") : cn(BODY, "max-w-xl")}
                      dir="auto"
                    >
                      {line}
                    </motion.p>
                  ))}
                </div>

                <div className="flex w-full flex-col items-center gap-3 sm:w-auto">
                  <Button variant="hero" size="lg" onClick={go} className="relative w-full overflow-hidden sm:w-auto">
                    {phase === "done" && !reduce && (
                      <motion.span aria-hidden className="absolute inset-y-0 start-0 bg-white/25" initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: REDIRECT_MS / 1000, ease: "linear" }} />
                    )}
                    <span className="relative inline-flex items-center gap-2">{w.continue}<ArrowRight className="rtl:-scale-x-100" aria-hidden /></span>
                  </Button>
                  <div className="flex items-center gap-1">
                    {withSound && soundPossible && phase === "playing" && (
                      <Button variant="ghost" size="sm" onClick={() => { stopVoice(); setWithSound(false); }}>
                        <VolumeX aria-hidden />{w.mute}
                      </Button>
                    )}
                    {phase === "done" && soundPossible && (
                      <Button variant="ghost" size="sm" onClick={() => play(true)}><Volume2 aria-hidden />{w.replay}</Button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
