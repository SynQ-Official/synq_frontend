import { AGENTS } from "@/components/layout/site-header";
import { cn } from "@/lib/utils";

type Agent = (typeof AGENTS)[number];

/** A calm availability tag: `live` pulses (open to everyone now), `member` is a steady dot. */
export function AgentStatusPill({ agent, label, className }: { agent: Agent; label: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border border-line bg-white/90 px-2.5 py-1 text-[0.75rem]  text-ink-soft", className)}>
      <span aria-hidden className="relative flex h-1.5 w-1.5">
        {agent.status === "live" && <span className={cn("absolute inset-0 rounded-full opacity-70 motion-safe:animate-ping", agent.tone.dot)} />}
        <span className={cn("relative h-1.5 w-1.5 rounded-full", agent.tone.dot)} />
      </span>
      {label}
    </span>
  );
}
