"use client";

import Link from "next/link";
import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { AlertCircle, Inbox, type LucideIcon } from "lucide-react";
import { SERIF } from "@/components/home/typography";
import { Button } from "@/components/ui/button";
import { usePatientCopy } from "@/hooks/usePatientCopy";
import { cn } from "@/lib/utils";

/** Restrained glass over the aurora canvas. `lift` adds the hover raise for clickable cards. */
export function GlassCard({
  as: Tag = "section",
  lift = false,
  className,
  ...props
}: { as?: "section" | "div" | "aside" | "article"; lift?: boolean } & HTMLAttributes<HTMLElement>) {
  return <Tag className={cn("lm-glass lm-card", lift && "lm-card-lift", className)} {...props} />;
}

/** The brand presence — a soft breathing orb. */
export function LuminaOrb({ size = 48, breathe = true, className }: { size?: number; breathe?: boolean; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("lm-orb", breathe && "lm-orb-breathe", className)}
      style={{ "--orb": `${size}px` } as CSSProperties}
    />
  );
}

export function Skeleton({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div aria-hidden className={cn("lm-skeleton", className)} style={style} />;
}

/** `id` lets the card point `aria-labelledby` at this heading. */
export function SectionTitle({ id, title, subtitle, action }: { id?: string; title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 id={id} className={cn(SERIF, "text-[1.1875rem] font-normal leading-snug tracking-[-0.01em] text-ink sm:text-xl rtl:font-semibold")}>{title}</h2>
        {subtitle && <p className="mt-0.5 text-[0.8125rem] leading-snug text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/**
 * The one header every patient screen opens with: a small eyebrow with the screen's icon,
 * the title, a line of context and (on the end edge) the screen's own actions.
 */
export function PageIntro({
  title,
  subtitle,
  action,
  eyebrow,
  icon: Icon,
  hideTitle = false,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  eyebrow?: string;
  icon?: LucideIcon;
  hideTitle?: boolean;
  className?: string;
}) {
  return (
    <header className={cn("mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-4", className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="lm-eyebrow mb-2.5 flex items-center gap-2.5">
            {Icon && <span className="lm-page-icon"><Icon className="size-4" aria-hidden /></span>}
            {eyebrow}
          </p>
        )}
        <h1 className={cn(SERIF, "text-[clamp(1.75rem,1.2rem+1.6vw,2.5rem)] font-light leading-[1.1] tracking-[-0.02em] text-ink rtl:font-semibold rtl:tracking-normal", hideTitle && "sr-only")}>{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]">{subtitle}</p>}
      </div>
      {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
    </header>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, body, action }: { icon?: LucideIcon; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line-strong bg-white/40 px-6 py-10 text-center">
      <span className="stat-tile stat-tile-sage"><Icon className="size-5" aria-hidden /></span>
      <p className="text-sm font-semibold text-ink">{title}</p>
      {body && <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">{body}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  const copy = usePatientCopy();
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-100 bg-rose-50/80 px-4 py-3 text-sm text-rose-700">
      <span className="inline-flex items-center gap-2"><AlertCircle className="size-4 shrink-0" aria-hidden />{message ?? copy.common.loadError}</span>
      {onRetry && <Button variant="outline" size="sm" onClick={onRetry}>{copy.common.retry}</Button>}
    </div>
  );
}

