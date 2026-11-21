import { Stethoscope } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { AgentId } from "./agents";

type AgentAvatarProps = {
  agent: AgentId;
  className?: string;
};

/** The SynQ patient-app mark (leaves, a figure and a gold ring with its star), on a white tile. */
export const LUMINA_MARK_SRC = "/assets/lumina-mark.png";
/** Mira's official 3D mark (profile, leaves and gold orbit), background removed. */
export const MIRA_MARK_SRC = "/assets/mira-mark.png";

const MARKS: Record<Exclude<AgentId, "psy">, string> = { mira: MIRA_MARK_SRC, lumina: LUMINA_MARK_SRC };
const MARK_ALT: Record<Exclude<AgentId, "psy">, string> = { mira: "Mira logo", lumina: "Lumina logo" };

/** Agent portraits: each agent's official 3D logo mark on a white tile; the clinician workspace has no mark yet, so it wears a stethoscope. */
export function AgentAvatar({ agent, className }: AgentAvatarProps) {
  return (
    <span aria-hidden className={cn("relative inline-flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[20px] bg-white", className)}>
      {agent === "psy" ? (
        <Stethoscope className="size-[52%] text-sage-700" strokeWidth={1.5} />
      ) : (
        <Image src={MARKS[agent]} alt={MARK_ALT[agent]} width={128} height={128} className="size-[86%] object-contain" />
      )}
    </span>
  );
}
