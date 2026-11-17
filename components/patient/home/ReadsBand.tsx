"use client";

import Link from "next/link";
import { ArrowRight, BookHeart } from "lucide-react";
import { SERIF } from "@/components/home/typography";
import { ArticleCard } from "@/components/patient/library/ArticleCard";
import { Skeleton } from "@/components/patient/ui/primitives";
import { Button } from "@/components/ui/button";
import { useLibrary } from "@/hooks/patient/useLibrary";
import { usePatient } from "@/hooks/patient/usePatient";
import { usePatientCopy } from "@/hooks/usePatientCopy";
import { HOME_ARTICLE_COUNT, showsReads } from "@/lib/patient/content";
import { cn } from "@/lib/utils";

/**
 * A warm band of reading under the day's overview: a few kind words and the way into the library on one side, two recommended articles
 * on the other, each opening at its public source. It appears for the tracks that have a library.
 */
export function ReadsBand() {
  const copy = usePatientCopy().home.reads;
  const { profile } = usePatient();
  const reads = showsReads(profile.track);
  const library = useLibrary(reads);

  // Home stays quiet when there is nothing to recommend or the request failed: the library page explains.
  if (!reads || library.error || (!library.isLoading && library.items.length === 0)) return null;

  return (
    <section data-tour="reads" aria-labelledby="reads-band-title" className="lm-glass mt-5 overflow-hidden lg:mt-6">
      <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.6fr)] lg:items-center lg:gap-10 lg:p-10">
        <div className="min-w-0">
          <p className="lm-eyebrow flex items-center gap-2.5">
            <span className="lm-page-icon">
              <BookHeart className="size-4" aria-hidden />
            </span>
            {copy.curated}
          </p>
          <h2 id="reads-band-title" className={cn(SERIF, "mt-4 text-[clamp(1.625rem,1rem+1.6vw,2.375rem)] font-light leading-[1.12] tracking-[-0.02em] text-ink rtl:font-semibold rtl:leading-[1.35] rtl:tracking-normal")}>
            {copy.title}
          </h2>
          <p className="mt-3 max-w-md text-[0.9375rem] leading-[1.7] text-ink-soft">{copy.subtitle}</p>

          <Button asChild size="lg" className="mt-6">
            <Link href="/dashboard/library">
              {copy.all}
              <ArrowRight className="rtl:-scale-x-100" aria-hidden />
            </Link>
          </Button>
          <p className="mt-4 text-xs text-muted-foreground">{copy.disclaimer}</p>
        </div>

        <ul className="grid gap-5 sm:grid-cols-2" aria-busy={library.isLoading}>
          {library.isLoading
            ? Array.from({ length: HOME_ARTICLE_COUNT }, (_, n) => (
                <li key={n}>
                  <Skeleton className="h-64 w-full rounded-[1.5rem]" />
                </li>
              ))
            : library.items.slice(0, HOME_ARTICLE_COUNT).map((item, index) => (
                <ArticleCard key={item.content.id} item={item} index={index} onOpen={(id) => library.sendEvent(id, "OPENED")} />
              ))}
        </ul>
      </div>
    </section>
  );
}
