"use client";

import { LogoSpinner } from "@/components/shared/LogoLoader";
import { copy, type Lang } from "@/lib/i18n/config";
import { FinishingScreen } from "../FinishingScreen";

/**
 * The orientation is finished: it lives on its own route. Finished just now, the hand-over takes a proper beat (the
 * finishing screen); restored, it only shows a short wait while the report opens.
 */
export function MiraCompletedView({ finishedLive, total, href, language }: { finishedLive: boolean; total: number; href: string | null; language: Lang }) {
  if (finishedLive) return <FinishingScreen total={total} href={href} />;
  return (
    <div className="relative flex min-h-[24rem] flex-1 items-center justify-center px-4" role="status">
      <span className="orientation-glass inline-flex items-center gap-3 rounded-full px-5 py-3 text-sm font-medium text-ink">
        <LogoSpinner size={16} />
        {copy[language].diagnostic.resultPage.loading}
      </span>
    </div>
  );
}
