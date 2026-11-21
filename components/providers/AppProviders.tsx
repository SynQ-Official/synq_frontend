"use client";

import { type ReactNode } from "react";
import { MotionConfig } from "framer-motion";
import { LanguageProvider } from "@/contexts/LanguageContext";
import type { Lang } from "@/lib/i18n/config";

export function AppProviders({ children, initialLanguage, routeLanguage }: { children: ReactNode; initialLanguage: Lang; routeLanguage?: Lang | null }) {
  return (
    <LanguageProvider initialLanguage={initialLanguage} routeLanguage={routeLanguage}>
      {/* Honors prefers-reduced-motion for every Framer Motion transform. */}
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LanguageProvider>
  );
}
