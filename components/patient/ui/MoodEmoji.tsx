import type { MoodLevel } from "@/lib/patient/moods";
import { cn } from "@/lib/utils";

/** Mouth curvature per level, low → high: a soft frown, flat, then a widening smile. */
const MOUTH: Record<MoodLevel["level"], number> = { 1: -3.5, 2: -1.75, 3: 0, 4: 2.5, 5: 4.5 };

/**
 * A mood face drawn as a line icon in the level's own colour: one style on every device, sized by the font size
 * (`text-3xl` etc.) like the emoji it replaced. Decorative: the level's name is always written next to it.
 */
export function MoodEmoji({ level, className }: { level: Pick<MoodLevel, "level" | "color" | "soft">; className?: string }) {
  const curve = MOUTH[level.level];
  return (
    <span aria-hidden className={cn("inline-flex shrink-0 items-center justify-center leading-none", className)}>
      <svg viewBox="0 0 32 32" width="1em" height="1em" fill="none" stroke={level.color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="16" cy="16" r="14.25" fill={level.soft} />
        {level.level === 5 ? (
          <path d="M9.75 13.5q1.75-2 3.5 0M18.75 13.5q1.75-2 3.5 0" />
        ) : (
          <>
            <circle cx="11.5" cy="13" r="1.35" fill={level.color} stroke="none" />
            <circle cx="20.5" cy="13" r="1.35" fill={level.color} stroke="none" />
          </>
        )}
        <path d={`M10.5 ${20.5 - curve / 2}Q16 ${20.5 + curve} 21.5 ${20.5 - curve / 2}`} />
      </svg>
    </span>
  );
}
