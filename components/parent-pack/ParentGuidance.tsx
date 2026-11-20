"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpenCheck, CheckCircle2, Heart, ShieldAlert, Sparkles } from "lucide-react";
import { Checklist, TokenBoard, VisualTimer } from "@/components/parent-pack/GuidanceTools";
import { StatusNote, type Note } from "@/components/parent-pack/ParentPackShell";
import { EmptyState, ErrorState, GlassCard, PageIntro, Skeleton } from "@/components/patient/ui/primitives";
import { Button } from "@/components/ui/button";
import { useGuidance } from "@/hooks/parent-pack/useParentPack";
import { parentPackApi } from "@/lib/parent-pack/api";
import type { Condition, GuidanceResource } from "@/lib/parent-pack/types";
import { cn } from "@/lib/utils";

type Filter = "all" | Condition | "favorites";
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" }, { id: "ADHD", label: "ADHD" }, { id: "BIPOLAR", label: "Bipolar disorder" },
  { id: "PSYCHOSIS", label: "Psychosis & schizophrenia" }, { id: "favorites", label: "Favourites" },
];

/** Educational resources by condition and topic, ordered by the server for this family; opened and favourite state is saved. */
export function ParentGuidance() {
  const guidance = useGuidance();
  const [filter, setFilter] = useState<Filter>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [note, setNote] = useState<Note>(null);
  const resources = useMemo(() => guidance.data ?? [], [guidance.data]);
  const shown = resources.filter((r) => filter === "all" || (filter === "favorites" ? r.favorite : r.condition === filter));
  const open = resources.find((r) => r.id === openId) ?? shown[0];
  const viewed = resources.filter((r) => r.viewedAt).length;

  const patch = (id: string, change: Partial<GuidanceResource>) => guidance.setData((list = []) => list.map((r) => (r.id === id ? { ...r, ...change } : r)));

  // Opening a resource records it once (fire and forget: progress is a convenience, not data the parent must keep).
  useEffect(() => {
    if (!open || open.viewedAt) return;
    patch(open.id, { viewedAt: new Date().toISOString() });
    void parentPackApi.setGuidance(open.id, { viewed: true }).catch(() => undefined);
  }, [open?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleFavorite = async (resource: GuidanceResource) => {
    patch(resource.id, { favorite: !resource.favorite });
    try {
      await parentPackApi.setGuidance(resource.id, { favorite: !resource.favorite });
    } catch {
      patch(resource.id, { favorite: resource.favorite });
      setNote({ tone: "error", text: "We couldn't save your favourite. Please try again." });
    }
  };

  return (
    <>
      <PageIntro eyebrow="Parent Guidance" icon={BookOpenCheck} title="Understand and respond, one situation at a time"
        subtitle={resources.length ? `${viewed} of ${resources.length} resources opened. Resources matching your child's track and this week's observations come first.` : undefined} />

      <p className="mb-5 flex gap-2.5 rounded-2xl border border-line bg-white/60 px-4 py-3 text-[0.8125rem] text-ink-soft">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-ink-muted" aria-hidden />
        Educational content awaiting review by qualified professionals. It is not a clinically validated protocol and never replaces your care team&apos;s advice, especially about medication.
      </p>

      <StatusNote note={note} className="mb-2" />
      <div role="group" aria-label="Filter resources" className="mb-5 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <Button key={f.id} size="sm" variant={filter === f.id ? "default" : "outline"} aria-pressed={filter === f.id} onClick={() => { setFilter(f.id); setOpenId(null); }}>{f.label}</Button>
        ))}
      </div>

      {guidance.error && !guidance.data ? (
        <ErrorState onRetry={() => void guidance.refresh()} />
      ) : !guidance.data ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,22rem)_1fr]" aria-busy><Skeleton className="h-96" /><Skeleton className="h-96" /></div>
      ) : shown.length === 0 ? (
        <EmptyState icon={Heart} title={filter === "favorites" ? "No favourites yet" : "Nothing here yet"} body={filter === "favorites" ? "Tap the heart on a resource to keep it here." : undefined} />
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,22rem)_1fr]">
          <ul className="lm-glass lm-card max-h-[70vh] divide-y divide-line/70 overflow-y-auto p-2" aria-label="Resources">
            {shown.map((r) => (
              <li key={r.id}>
                <button type="button" onClick={() => setOpenId(r.id)} aria-current={open?.id === r.id ? "true" : undefined}
                  className={cn("flex w-full items-start gap-3 rounded-xl px-3 py-3 text-start transition-colors hover:bg-teal-50/70 focus-visible:outline-2 focus-visible:outline-teal-500", open?.id === r.id && "bg-teal-50")}>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.6875rem] font-semibold uppercase tracking-wide text-ink-subtle">{r.topic}</span>
                    <span className="block text-sm font-semibold text-ink">{r.title}</span>
                    {r.suggested && <span className="mt-1 inline-flex items-center gap-1 text-[0.6875rem] font-medium text-gold-700"><Sparkles className="size-3" aria-hidden />Matches this week&apos;s observations</span>}
                  </span>
                  {r.viewedAt && <CheckCircle2 className="mt-1 size-4 shrink-0 text-teal-600" aria-label="Opened" />}
                  {r.favorite && <Heart className="mt-1 size-4 shrink-0 fill-rose text-rose" aria-label="Favourite" />}
                </button>
              </li>
            ))}
          </ul>
          {open && <ResourceDetail resource={open} onFavorite={() => void toggleFavorite(open)} />}
        </div>
      )}
    </>
  );
}

function ResourceDetail({ resource, onFavorite }: { resource: GuidanceResource; onFavorite: () => void }) {
  return (
    <GlassCard as="article" className="p-6" aria-labelledby="guidance-title">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="lm-eyebrow">{resource.topic}</p>
          <h2 id="guidance-title" className="mt-1 text-xl font-semibold text-ink">{resource.title}</h2>
        </div>
        <Button variant="outline" size="sm" onClick={onFavorite} aria-pressed={resource.favorite}>
          <Heart className={cn(resource.favorite && "fill-rose text-rose")} aria-hidden />{resource.favorite ? "Saved" : "Save"}
        </Button>
      </div>
      <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-soft">{resource.summary}</p>
      <ul className="mt-4 space-y-2">
        {resource.points.map((point) => (
          <li key={point} className="flex gap-2.5 text-sm leading-relaxed text-ink"><span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-teal-500" />{point}</li>
        ))}
      </ul>
      {resource.exercise && (
        <section className="mt-6 rounded-2xl border border-teal-100 bg-teal-50/50 p-4" aria-label={resource.exercise.title}>
          <h3 className="mb-3 text-sm font-semibold text-teal-900">Practice: {resource.exercise.title}</h3>
          {resource.exercise.tool === "checklist" && <Checklist key={resource.id} id={resource.id} items={resource.exercise.items ?? []} />}
          {resource.exercise.tool === "token-board" && <TokenBoard key={resource.id} id={resource.id} />}
          {resource.exercise.tool === "visual-timer" && <VisualTimer key={resource.id} />}
        </section>
      )}
      {resource.inspiredBy && <p className="mt-5 text-xs text-ink-subtle">Draws on: {resource.inspiredBy}. Pending clinical review.</p>}
    </GlassCard>
  );
}
