"use client";

import Link from "next/link";
import { Check, Copy, House, ShieldCheck, Volume2, VolumeX } from "lucide-react";
import { useState } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAudio } from "@/contexts/AudioContext";
import { stopAllSpeech } from "@/hooks/useSpeech";
import { useSessionState } from "@/hooks/useSessionState";
import type { Lang } from "@/lib/i18n/config";
import { ROUTES } from "@/lib/config/routes";
import { cn } from "@/lib/utils";
import { stopDiagnosticVoice, warmUpDiagnosticVoice } from "../lib/voice";

/** Diagnostic uses the shared application header; only its controls are specific. */
export function DiagnosticHeader({ chatId, onLanguageChange }: { chatId: string; onLanguageChange?: (language: Lang) => void }) {
  const { dictionary } = useLanguage();
  const { isSoundEnabled, setIsSoundEnabled } = useAudio();
  const [copied, setCopied] = useState(false);
  const diagnostic = dictionary.diagnostic;
  // A signed-in patient returns to their own space; a visitor to the public home.
  const signedIn = useSessionState() === true;
  const backLabel = signedIn ? dictionary.nav.backToDashboard : dictionary.nav.backHome;

  const handleCopySession = async () => {
    try {
      await navigator.clipboard.writeText(chatId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  function toggleSound() {
    const next = !isSoundEnabled;
    setIsSoundEnabled(next);
    if (next) warmUpDiagnosticVoice();
    else {
      stopAllSpeech();
      stopDiagnosticVoice();
    }
  }

  return (
    <SiteHeader
      variant="app"
      center={
        <div className="hidden items-center gap-2 md:flex">
          <span title={diagnostic.confidential} className="inline-flex min-h-9 items-center gap-2 rounded-full px-3 text-[0.8125rem] font-medium text-ink-soft">
            <ShieldCheck className="size-4 shrink-0 text-sage-700" aria-hidden />
            <span className="max-lg:sr-only">{diagnostic.confidential}</span>
          </span>
          <span aria-hidden className="h-4 w-px bg-line-strong/70" />
          <button
            type="button"
            onClick={handleCopySession}
            aria-label={`${diagnostic.copySession}: ${chatId}`}
            title={copied ? diagnostic.copiedMessage : diagnostic.copySession}
            className="group inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-full px-3 text-[0.8125rem] text-ink-muted transition-[background-color,color] duration-200 ease-out-soft hover:bg-teal-50 hover:text-teal-800 focus-visible:outline-2 focus-visible:outline-teal-500"
          >
            <span className="size-1.5 rounded-full bg-sage" aria-hidden />
            <span dir="ltr" className="font-mono text-[0.75rem] tracking-wide">{chatId.slice(0, 8)}</span>
            {copied ? <Check className="size-3.5 text-sage-700" aria-hidden /> : <Copy className="size-3.5 opacity-70 transition-opacity group-hover:opacity-100" aria-hidden />}
            <span aria-live="polite" className="sr-only">{copied ? diagnostic.copiedMessage : ""}</span>
          </button>
        </div>
      }
      actions={
        <>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggleSound}
            aria-pressed={isSoundEnabled}
            aria-label={isSoundEnabled ? diagnostic.mute : diagnostic.unmute}
            title={isSoundEnabled ? diagnostic.mute : diagnostic.unmute}
            className={cn(
              "size-10 min-h-10 rounded-full transition-colors duration-200",
              isSoundEnabled ? "bg-teal-50 text-teal-800 hover:bg-teal-100" : "text-ink-muted hover:bg-teal-50 hover:text-ink",
            )}
          >
            {isSoundEnabled ? <Volume2 aria-hidden /> : <VolumeX aria-hidden />}
          </Button>

          <LanguageSwitcher onChange={onLanguageChange} />

          <span aria-hidden className="mx-1 hidden h-5 w-px bg-line-strong/70 sm:block" />

          <Link
            href={signedIn ? ROUTES.dashboard : ROUTES.home}
            aria-label={backLabel}
            className="group inline-flex min-h-10 items-center gap-2 rounded-full border border-line bg-white/80 px-3 text-sm font-medium text-ink transition-[background-color,border-color,color] duration-200 ease-out-soft hover:border-teal-200 hover:bg-white hover:text-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 sm:px-4"
          >
            <House className="size-4 text-teal-700" aria-hidden />
            <span className="hidden sm:inline">{backLabel}</span>
          </Link>
        </>
      }
    />
  );
}
