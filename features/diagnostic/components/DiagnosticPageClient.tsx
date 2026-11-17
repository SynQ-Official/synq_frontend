"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { homeSerif } from "@/components/home/fonts";
import { cn } from "@/lib/utils";
import { DiagnosticHeader } from "./DiagnosticHeader";
import { OrientationBackdrop } from "./OrientationBackdrop";
import { OrientationSkeleton } from "./OrientationSkeleton";
import { MiraChatExperience } from "./MiraChatExperience";
import { createChatId } from "../lib/chat";
import type { Lang } from "@/lib/i18n/config";
import { ROUTES } from "@/lib/config/routes";
import { useOrientationGate } from "../hooks/useOrientationGate";
import { useSessionUserId } from "@/hooks/useSessionState";

export function DiagnosticPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Support legacy ?chatId, plus /diagnostic?{sessionID} via ?sessionId / ?sessionID / ?diagnostic
  const chatId =
    searchParams.get("chatId") ||
    searchParams.get("sessionId") ||
    searchParams.get("sessionID") ||
    searchParams.get("diagnostic") ||
    searchParams.get("session");
  const [languageSwitch, setLanguageSwitch] = useState<{ id: number; language: Lang } | null>(null);
  // Mira needs an account (no plan) and runs once per account. Settled before the chat mounts, so no
  // session is ever started for a visitor, or for an account that already finished.
  const gate = useOrientationGate();
  const userId = useSessionUserId();

  useEffect(() => {
    if (gate === "signed-out") router.replace(`${ROUTES.signUp}?from=orientation&redirect=${encodeURIComponent(ROUTES.orientation)}`);
    else if (gate === "done") router.replace(ROUTES.dashboard);
  }, [gate, router]);

  useEffect(() => {
    // Only once the account is known and eligible: while the session is still loading, or when the visitor is being
    // sent to sign up / the dashboard, a second `replace` here would race that redirect.
    if (chatId || gate !== "open") return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("chatId", createChatId());
    router.replace(`${ROUTES.orientation}?${params.toString()}`);
  }, [chatId, gate, router, searchParams]);

  if (!chatId || gate !== "open") return <OrientationSkeleton />;

  return (
    // One viewport-tall column: shared header in flow, experience fills the rest and owns the only scroll area.
    <div className={cn(homeSerif.variable, "relative flex h-dvh flex-col overflow-hidden")}>
      <OrientationBackdrop />
      <DiagnosticHeader chatId={chatId} onLanguageChange={(nextLanguage) => setLanguageSwitch({ id: Date.now(), language: nextLanguage })} />
      {/* ACTIVE: Mira v5 flow (REST /api/mira → Nest /api/v1/mira/* → Mira agent /api/v1/mira/*). */}
      {/* Keyed by account: if the signed-in user ever changes under this page, the whole conversation state remounts empty. */}
      <MiraChatExperience key={userId} chatId={chatId} languageSwitch={languageSwitch} locked={false} />
    </div>
  );
}
