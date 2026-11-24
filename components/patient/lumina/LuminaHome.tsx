"use client";

import { RecommendedExercises } from "@/components/patient/home/RecommendedExercises";
import { useLuminaToday } from "@/hooks/patient/useLumina";
import { showLegacyExercises } from "@/lib/patient/lumina";
import { LuminaToday } from "./LuminaToday";

/**
 * Lumina's card, then (only when the server says NORMAL) the patient app's own exercise ranking. Under SAFETY_YIELD,
 * while loading, or if Lumina failed, no activity recommendation appears anywhere below the calm SOS card.
 */
export function LuminaHome() {
  const today = useLuminaToday();
  return (
    <div className="grid grid-cols-1 gap-5 lg:gap-6">
      <LuminaToday />
      {showLegacyExercises(today.data?.mode) && <RecommendedExercises />}
    </div>
  );
}
