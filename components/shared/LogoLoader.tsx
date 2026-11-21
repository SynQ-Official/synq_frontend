import Image from "next/image";
import { cn } from "@/lib/utils";

/** The official SynQ 3D mark (two profiles, leaves and the gold ring), background removed. */
export const SYNQ_MARK_SRC = "/assets/synq-mark.png";

/**
 * Inline loading indicator: the 3D logo floating and breathing. Replaces generic circular
 * spinners inside buttons, pills and status rows (decorative — the surrounding text or
 * `aria-busy` carries the meaning; pass `label` when it stands alone).
 */
export function LogoSpinner({ size = 20, label, className }: { size?: number; label?: string; className?: string }) {
  return (
    <span
      role={label ? "status" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <Image src={SYNQ_MARK_SRC} alt="" width={Math.min(128, size * 2)} height={Math.min(128, size * 2)} className="vm-loader-mark size-full object-contain" />
    </span>
  );
}

/**
 * Page / Suspense loading state: a larger floating 3D logo with a soft gold-teal halo
 * and an optional caption.
 */
export function LogoLoader({ label, size = 72, className }: { label?: string; size?: number; className?: string }) {
  return (
    <div role="status" aria-live="polite" className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <span className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
        <span aria-hidden className="vm-loader-halo absolute inset-[-18%] rounded-full" />
        <Image src={SYNQ_MARK_SRC} alt="" width={Math.min(256, size * 2)} height={Math.min(256, size * 2)} priority className="vm-loader-mark relative size-full object-contain" />
      </span>
      {label ? <p className="text-sm font-medium text-ink-muted">{label}</p> : <span className="sr-only">Loading</span>}
    </div>
  );
}
