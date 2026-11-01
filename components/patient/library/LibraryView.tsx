"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowLeft, BookHeart, ShieldCheck } from "lucide-react";
import { ArticleCard } from "@/components/patient/library/ArticleCard";
import { EmptyState, ErrorState, PageIntro, Skeleton } from "@/components/patient/ui/primitives";
import { Button } from "@/components/ui/button";
import { useLibrary } from "@/hooks/patient/useLibrary";
import { usePatient } from "@/hooks/patient/usePatient";
import { usePatientCopy } from "@/hooks/usePatientCopy";
import type { LibraryEmptyReason } from "@/lib/api/patient-types";
import { fill } from "@/lib/i18n/patient";
import { showsReads } from "@/lib/patient/content";

/** The library: the articles the Smart Library matches to the patient's own Journal, each opening at its public source. */
export function LibraryView() {
  const copy = usePatientCopy().library;
  const { profile } = usePatient();
  const reads = showsReads(profile.track);
  const router = useRouter();
  // ADHD has no library: send a typed URL home instead of showing a dead page.
  useEffect(() => {
    if (profile.track === "ADHD") router.replace("/dashboard");
  }, [profile.track, router]);
  const library = useLibrary(reads);

  const back = (
    <Button asChild variant="ghost" size="lg">
      <Link href="/dashboard">
        <ArrowLeft className="rtl:-scale-x-100" aria-hidden />
        {copy.back}
      </Link>
    </Button>
  );

  if (profile.track === "ADHD") return null;

  if (!reads) {
    return (
      <div className="lm-rise">
        <PageIntro eyebrow={copy.eyebrow} icon={BookHeart} title={copy.title} action={back} />
        <EmptyState icon={BookHeart} title={copy.unavailableTitle} body={copy.unavailableBody} />
      </div>
    );
  }

  const topic = copy.topics[profile.track === "BIPOLAR" ? "BIPOLAR" : "SCHIZOPHRENIA"];
  const empty = copy.empty[library.reason as LibraryEmptyReason] ?? copy.empty.NO_RELEVANT_CONTENT;
  const needsEntries = library.reason === "NO_JOURNAL_ENTRIES" || library.reason === "LIMITED_JOURNAL";

  return (
    <div className="lm-rise">
      <PageIntro eyebrow={copy.eyebrow} icon={BookHeart} title={copy.title} subtitle={fill(copy.subtitle, { topic })} action={back} />

      {library.error ? (
        <ErrorState onRetry={() => void library.refresh()} />
      ) : library.isLoading ? (
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-busy>
          {[0, 1, 2].map((n) => (
            <li key={n}>
              <Skeleton className="h-64 w-full rounded-[1.5rem]" />
            </li>
          ))}
        </ul>
      ) : library.items.length === 0 ? (
        <EmptyState
          icon={BookHeart}
          title={empty.title}
          body={empty.body}
          action={
            needsEntries && (
              <Button asChild size="lg">
                <Link href="/dashboard/journal">{copy.writeEntry}</Link>
              </Button>
            )
          }
        />
      ) : (
        <>
          <p className="mb-4 text-[0.8125rem] font-medium text-muted-foreground">
            {copy.forYou} · {fill(copy.count, { n: library.items.length })}
          </p>

          <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {library.items.map((item, index) => (
              <ArticleCard key={item.content.id} item={item} index={index} onOpen={(id) => library.sendEvent(id, "OPENED")} onDismiss={(id) => library.sendEvent(id, "DISMISSED")} />
            ))}
          </ul>

          <div className="mt-8 flex flex-col items-center gap-3 text-center">
            {library.noMore ? (
              <p role="status" className="text-sm text-muted-foreground">{copy.noMore}</p>
            ) : (
              <Button variant="outline" size="lg" onClick={() => void library.loadMore()} disabled={library.loadingMore}>
                {library.loadingMore ? copy.moreLoading : copy.more}
              </Button>
            )}
            {library.moreError && <ErrorState onRetry={() => void library.loadMore()} />}
          </div>
        </>
      )}

      <p className="mt-10 flex items-start gap-3 rounded-2xl bg-white/70 px-4 py-3.5 text-[0.8125rem] leading-6 text-ink-soft">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-teal-700" aria-hidden />
        {copy.disclaimer}
      </p>
    </div>
  );
}
