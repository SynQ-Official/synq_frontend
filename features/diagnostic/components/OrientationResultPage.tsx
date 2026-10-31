"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { AudioProvider } from "@/contexts/AudioContext";
import { Button } from "@/components/ui/button";
import { ensureSession } from "@/lib/api/client";
import { createChatId } from "../lib/chat";
import { fingerprintHeaders } from "../lib/fingerprint";
import { useVisitorName } from "../lib/visitor";
import type { MiraAssessmentResult, MiraMessage as MiraMessageData } from "../types";
import { DiagnosticHeader } from "./DiagnosticHeader";
import { MiraResult } from "./MiraResult";
import { OrientationBackdrop } from "./OrientationBackdrop";
import { ResultNextSteps, ResultStickyCta } from "./ResultNextSteps";
import { ROUTES } from "@/lib/config/routes";
import { LogoSpinner } from "@/components/shared/LogoLoader";
import { homeSerif } from "@/components/home/fonts";
import { DISPLAY_M } from "@/components/home/typography";
import { cn } from "@/lib/utils";

type HistoryResponse = {
  session_id: string;
  status: string;
  completed: boolean;
  result: MiraAssessmentResult | null;
  messages: Array<{ role: "user" | "assistant"; content: string; createdAt: string }>;
  error?: string;
};

type LoadState =
  | { phase: "loading" }
  | { phase: "ready"; result: MiraAssessmentResult; transcript: MiraMessageData[]; completedAt: string | null }
  | { phase: "missing" };

/**
 * Dedicated, chat-decoupled orientation result (Phase 3).
 * Reads the durable report from Postgres so a refresh never falls back into the chat flow,
 * and works even if the AI service has forgotten the in-memory session.
 */
export function OrientationResultPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = Array.isArray(params.sessionId) ? params.sessionId[0] : params.sessionId;
  const router = useRouter();
  const { dictionary } = useLanguage();
  const diagnostic = dictionary.diagnostic;

  const [loaded, setState] = useState<LoadState>({ phase: "loading" });
  const state: LoadState = sessionId ? loaded : { phase: "missing" };
  const [isFinalizing, setIsFinalizing] = useState(false);
  const { name: viewerName } = useVisitorName();

  useEffect(() => {
    if (!sessionId) return;
    let active = true;
    (async () => {
      try {
        // After a reload the access token is not in memory yet: restore it first, or the proxy answers 401 and the
        // finished report reads as "not ready".
        await ensureSession();
        const res = await fetch(`/api/mira?resource=history&sessionId=${encodeURIComponent(sessionId)}`, {
          cache: "no-store",
          headers: fingerprintHeaders(),
        });
        const data = (await res.json()) as HistoryResponse;
        if (!active) return;
        if (!res.ok || !data.completed || !data.result) {
          setState({ phase: "missing" });
          return;
        }
        const transcript: MiraMessageData[] = data.messages.map((m, i) => ({
          id: `hist-${i}`,
          role: m.role,
          content: m.content,
          createdAt: m.createdAt,
        }));
        setState({ phase: "ready", result: data.result, transcript, completedAt: data.messages[data.messages.length - 1]?.createdAt ?? null });
      } catch {
        if (active) setState({ phase: "missing" });
      }
    })();
    return () => {
      active = false;
    };
  }, [sessionId]);

  // Download finalizes the session server-side (consumes one attempt), then prints the report.
  const handleDownload = useCallback(async () => {
    if (!sessionId) return;
    setIsFinalizing(true);
    try {
      await fetch("/api/mira", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...fingerprintHeaders() },
        body: JSON.stringify({ action: "finalize", sessionId }),
      });
    } catch {
      /* the download proceeds regardless; the server stamp is best-effort from the client */
    } finally {
      setIsFinalizing(false);
      if (typeof window !== "undefined") window.print();
    }
  }, [sessionId]);

  const handleRestart = useCallback(() => {
    router.push(`${ROUTES.orientation}?chatId=${createChatId()}`);
  }, [router]);

  const showConversion = state.phase === "ready" && state.result.safety.level !== "urgent";

  return (
    <AudioProvider>
      <div className={cn(homeSerif.variable, "relative flex min-h-dvh flex-col print:bg-white")}>
        <OrientationBackdrop />
        <div className="relative z-10 print:hidden">
          <DiagnosticHeader chatId={sessionId ?? ""} />
        </div>
        <main className={cn("relative mx-auto w-full max-w-chat flex-1 px-3 pt-3 sm:px-6 sm:pt-5 lg:px-8 lg:pb-10 print:max-w-none print:px-0", showConversion ? "pb-24" : "pb-6")}>
          {state.phase === "loading" && (
            <div className="relative w-full space-y-4 lg:space-y-5" role="status" aria-live="polite">
              <div className="relative overflow-hidden rounded-[1.75rem] bg-deep text-white shadow-float sm:rounded-[2rem]">
                <div className="p-5 sm:p-8 lg:p-10">
                  <div className="h-7 w-48 max-w-full animate-pulse rounded-full bg-white/10" />
                  <div className="mt-8 h-5 w-64 max-w-full animate-pulse rounded-full bg-white/10" />
                  <div className="mt-6 h-12 w-[30rem] max-w-full animate-pulse rounded-2xl bg-white/10" />
                  <div className="mt-8 flex items-center gap-3 text-[0.9375rem] text-teal-100">
                    <LogoSpinner size={18} />
                    {diagnostic.resultPage.loading}
                  </div>
                </div>
                <div className="grid border-t border-white/15 sm:grid-cols-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="space-y-3 border-white/15 p-4 sm:p-5 [&:not(:first-child)]:border-t sm:[&:not(:first-child)]:border-s sm:[&:not(:first-child)]:border-t-0">
                      <div className="h-3 w-24 animate-pulse rounded-full bg-white/10" />
                      <div className="h-8 w-32 animate-pulse rounded-full bg-white/10" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid gap-4 lg:grid-cols-12 lg:gap-5">
                <div className="h-72 animate-pulse rounded-panel border border-line bg-white/80 lg:col-span-7" />
                <div className="h-72 animate-pulse rounded-panel border border-line bg-white/80 lg:col-span-5" />
              </div>
            </div>
          )}

          {state.phase === "missing" && (
            <div className="relative mx-auto flex min-h-[24rem] max-w-lg items-center">
              <div className="w-full rounded-panel border border-line bg-white p-7 text-center shadow-float sm:p-10">
                <h1 className={cn(DISPLAY_M, "text-ink")}>{diagnostic.resultPage.missingTitle}</h1>
                <p className="mx-auto mt-3 max-w-sm text-[1rem] leading-7 text-ink-soft">{diagnostic.resultPage.missingBody}</p>
                <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
                  <Button asChild variant="default" size="lg">
                    <Link href={ROUTES.orientation}>{diagnostic.resultPage.backToChat}</Link>
                  </Button>
                  <Button type="button" variant="outline" size="lg" onClick={handleRestart}>
                    <RefreshCw aria-hidden />
                    {diagnostic.mira.newSession}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {state.phase === "ready" && (
            <MiraResult
              result={state.result}
              transcript={state.transcript}
              sessionId={sessionId}
              onDownload={handleDownload}
              isFinalizing={isFinalizing}
              viewerName={viewerName}
              completedAt={state.completedAt}
              aside={showConversion ? <ResultNextSteps /> : undefined}
            />
          )}
        </main>
        {showConversion && <ResultStickyCta />}
      </div>
    </AudioProvider>
  );
}
