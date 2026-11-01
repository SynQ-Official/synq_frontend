"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowLeft, Headphones } from "lucide-react";
import { AmbiencePlayer } from "@/components/patient/ambiences/AmbiencePlayer";
import { ErrorState, PageIntro, Skeleton } from "@/components/patient/ui/primitives";
import { Button } from "@/components/ui/button";
import { useAmbiences } from "@/hooks/patient/useAmbiences";
import { usePatientCopy } from "@/hooks/usePatientCopy";

/** The comfort-sound page. A patient with no sounds (no track, or psychosis before the clinician switched it on) never sees it. */
export function AmbiencesView() {
  const copy = usePatientCopy().ambiences;
  const router = useRouter();
  const { ambiences, sounds, available, error, refresh, update } = useAmbiences();

  // A typed URL goes home instead of showing a page that has nothing to offer.
  useEffect(() => {
    if (ambiences && !available) router.replace("/dashboard");
  }, [ambiences, available, router]);

  if (ambiences && !available) return null;

  // Until the answer is in, the heading stays neutral: it must not name a track the patient may not be offered.
  const track = ambiences?.track ?? "UNSPECIFIED";

  return (
    <div className="lm-rise">
      <PageIntro
        eyebrow={copy.eyebrow}
        icon={Headphones}
        title={copy.title[track]}
        subtitle={ambiences ? copy.subtitle[track] : undefined}
        action={
          <Button asChild variant="ghost" size="lg">
            <Link href="/dashboard">
              <ArrowLeft className="rtl:-scale-x-100" aria-hidden />
              {copy.back}
            </Link>
          </Button>
        }
      />
      {error ? (
        <ErrorState onRetry={() => void refresh()} />
      ) : !ambiences ? (
        <Skeleton className="h-96 w-full rounded-[1.5rem]" />
      ) : (
        <AmbiencePlayer ambiences={ambiences} sounds={sounds} update={update} />
      )}
    </div>
  );
}
