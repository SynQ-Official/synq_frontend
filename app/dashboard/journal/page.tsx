"use client";

import { useState } from "react";
import { BookHeart } from "lucide-react";
import { JournalCompanion } from "@/components/patient/journal/JournalCompanion";
import { JournalSynthesis } from "@/components/patient/lumina/JournalSynthesis";
import { JournalHistory } from "@/components/patient/journal/JournalHistory";
import { JournalInsights } from "@/components/patient/journal/JournalInsights";
import { JournalWrite } from "@/components/patient/journal/JournalWrite";
import { PageIntro } from "@/components/patient/ui/primitives";
import { usePatientCopy } from "@/hooks/usePatientCopy";

type Tab = "write" | "history" | "insights";
const TABS: Tab[] = ["write", "history", "insights"];

/** Smart Journal: today's page beside its companion, the history, and the longitudinal insights. */
export default function JournalPage() {
  const copy = usePatientCopy();
  const [tab, setTab] = useState<Tab>("write");
  const [insert, setInsert] = useState<{ text: string; nonce: number } | undefined>(undefined);

  const tabs = (
    <div role="tablist" aria-label={copy.journal.title} className="segmented">
      {TABS.map((item) => (
        <button
          key={item}
          id={`journal-tab-${item}`}
          type="button"
          role="tab"
          aria-selected={tab === item}
          aria-controls={`journal-panel-${item}`}
          tabIndex={tab === item ? 0 : -1}
          onClick={() => setTab(item)}
          onKeyDown={(event) => {
            const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
            if (!step) return;
            const dir = document.documentElement.dir === "rtl" ? -1 : 1;
            const next = TABS[(TABS.indexOf(item) + step * dir + TABS.length) % TABS.length];
            setTab(next);
            document.getElementById(`journal-tab-${next}`)?.focus();
          }}
          className="lm-tab"
        >
          {copy.journal.tabs[item]}
        </button>
      ))}
    </div>
  );

  return (
    <div className="lm-rise">
      <PageIntro eyebrow={copy.shell.eyebrows.journal} icon={BookHeart} title={copy.journal.title} subtitle={copy.journal.subtitle} action={tabs} hideTitle />

      <div id={`journal-panel-${tab}`} role="tabpanel" aria-labelledby={`journal-tab-${tab}`}>
        {tab === "write" && (
          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_21rem]">
            <JournalWrite onOpenInsights={() => setTab("insights")} insert={insert} />
            <JournalCompanion onUsePrompt={(text) => setInsert({ text, nonce: Date.now() })} />
          </div>
        )}
        {tab === "history" && <JournalHistory />}
        {tab === "insights" && (
          <div className="grid gap-5">
            <JournalSynthesis />
            <JournalInsights />
          </div>
        )}
      </div>
    </div>
  );
}
