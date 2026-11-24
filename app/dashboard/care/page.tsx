"use client";

import { useState } from "react";
import { HeartHandshake } from "lucide-react";
import { CareRelationships, CareRequestCard } from "@/components/patient/care/CareRelationships";
import { MedicationsPanel } from "@/components/patient/care/MedicationsPanel";
import { MessagesPanel } from "@/components/patient/care/MessagesPanel";
import { PageIntro } from "@/components/patient/ui/primitives";
import { usePatientCopy } from "@/hooks/usePatientCopy";
import { cn } from "@/lib/utils";

type Tab = "messages" | "medications";

/** The care team's side of the app: the secure conversation with the clinician and the medication they prescribed. */
export default function CarePage() {
  const copy = usePatientCopy();
  const [view, setView] = useState<Tab>("messages");

  return (
    <div className="lm-rise">
      <PageIntro eyebrow={copy.shell.eyebrows.care} icon={HeartHandshake} title={copy.care.title} subtitle={copy.care.subtitle} />

      <CareRequestCard />
      <CareRelationships />

      <div role="tablist" aria-label={copy.care.title} className="mb-5 inline-flex gap-1 rounded-full border border-white/80 bg-white/60 p-1">
        {(["messages", "medications"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            id={`care-tab-${tab}`}
            aria-selected={view === tab}
            aria-controls={`care-panel-${tab}`}
            onClick={() => setView(tab)}
            className={cn(
              "min-h-9 rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500",
              view === tab ? "bg-teal-600 text-white shadow-brand" : "text-ink-soft hover:bg-white/80",
            )}
          >
            {copy.care.tabs[tab]}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`care-panel-${view}`} aria-labelledby={`care-tab-${view}`}>
        {view === "messages" ? <MessagesPanel /> : <MedicationsPanel />}
      </div>
    </div>
  );
}
