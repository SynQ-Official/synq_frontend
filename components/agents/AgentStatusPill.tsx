import { AGENTS } from "@/components/layout/site-header";
import { cn } from "@/lib/utils";

type Agent = (typeof AGENTS)[number];

/** An availability tag with a steady dot. No pulse: public pages carry no endless motion. */
export function AgentStatusPill({ agent, label, className }: { agent: Agent; label: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border border-line bg-white/90 px-2.5 py-1 text-[0.75rem]  text-ink-soft", className)}>
      <span aria-hidden className="relative flex h-1.5 w-1.5">
        <span className={cn("relative h-1.5 w-1.5 rounded-full", agent.tone.dot)} />
      </span>
      {label}
    </span>
  );
}
