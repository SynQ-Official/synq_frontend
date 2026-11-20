const ITEM = "inline-flex items-center gap-2.5 whitespace-nowrap px-6 text-[0.9375rem] font-semibold text-ink-soft sm:px-9";

type PartnerLogosProps = {
  hidden?: boolean;
  hotLabel: string;
  hotNames: readonly string[];
  backedLabel: string;
  backedNames: readonly string[];
};

export function PartnerLogos({ hidden, hotLabel, hotNames, backedLabel, backedNames }: PartnerLogosProps) {
  return (
    <>
      <span aria-hidden={hidden} className={ITEM}>
        <span className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-teal-700">{hotLabel}</span>
        <span className="h-5 w-px bg-line-strong" aria-hidden />
        <span>{hotNames.join("  ·  ")}</span>
      </span>
      <span aria-hidden={hidden} className={ITEM}>
        <span className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-gold-700">{backedLabel}</span>
        <span className="h-5 w-px bg-line-strong" aria-hidden />
        <span>{backedNames.join("  ·  ")}</span>
      </span>
    </>
  );
}
