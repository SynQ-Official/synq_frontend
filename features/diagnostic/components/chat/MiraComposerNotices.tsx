"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Info, RotateCcw, Sparkles } from "lucide-react";
import { LogoSpinner } from "@/components/shared/LogoLoader";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { SupportCard } from "@/components/patient/ui/SupportCard";
import { copy, type Lang } from "@/lib/i18n/config";
import { fill } from "@/lib/i18n/format";
import { EASE_OUT } from "@/lib/motion";
import type { TurnFailureKind } from "@/lib/patient/turn-errors";
import { MIRA_STREAM_COPY, type MiraStreamCopy } from "../../lib/stream-copy";

/** The calm sentence for why the last reply did not complete, or null when it has a screen of its own. */
export function failureText(failure: TurnFailureKind | null, stream: MiraStreamCopy): string | null {
  switch (failure) {
    case "offline": return stream.offline;
    case "rateLimited": return stream.rateLimited;
    case "busy": return stream.busy;
    case "timeout": return stream.slow;
    case "interrupted": return stream.interrupted;
    default: return null;
  }
}

const collapse = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: "auto" },
  exit: { opacity: 0, height: 0 },
  transition: { duration: 0.2, ease: EASE_OUT },
} as const;

function Collapsible({ show, children }: { show: boolean; children: ReactNode }) {
  return <AnimatePresence initial={false}>{show && children}</AnimatePresence>;
}

type NoticesProps = {
  language: Lang;
  support: string[] | null;
  onHideSupport: () => void;
  failure: TurnFailureKind | null;
  error: string | null;
  onRetry: () => void;
  /** The error banner's retry: resend the draft when there is one, else the unanswered message. */
  onErrorRetry: () => void;
  reconnecting: boolean;
  status: string | null;
  almostThere: number | null;
};

/** Everything said above the message box: support, why a reply failed, errors, hints and the "almost there" note. */
export function MiraComposerNotices({ language, support, onHideSupport, failure, error, onRetry, onErrorRetry, reconnecting, status, almostThere }: NoticesProps) {
  const diagnostic = copy[language].diagnostic;
  const stream = MIRA_STREAM_COPY[language];
  const failed = failureText(failure, stream);
  return (
    <>
      {support && <SupportCard resources={support} labels={stream.support} onHide={onHideSupport} className="mb-3" />}
      <Collapsible show={Boolean(failed) && !error}>
        <motion.div role="status" {...collapse} className="overflow-hidden">
          <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-line bg-ivory px-3.5 py-2.5 text-[0.8125rem] text-ink-soft">
            <Info className="size-4 shrink-0 text-sage-700" aria-hidden />
            <span className="min-w-0 flex-1">{failed}</span>
            <Button type="button" variant="outline" size="sm" onClick={onRetry} className="min-h-9 gap-1.5 rounded-full bg-white">
              <RotateCcw className="size-3.5" aria-hidden />
              {stream.tryAgain}
            </Button>
          </div>
        </motion.div>
      </Collapsible>
      <Collapsible show={Boolean(error)}>
        <motion.div role="alert" {...collapse} className="overflow-hidden">
          <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-rose-100 bg-rose-50 px-3.5 py-2.5">
            <AlertCircle className="size-4 shrink-0 text-rose-700" aria-hidden />
            <p className="min-w-0 flex-1 text-[0.8125rem] font-medium text-rose-700">{error}</p>
            <Button type="button" variant="outline" size="sm" onClick={onErrorRetry} className="min-h-9 gap-1.5 rounded-full border-rose-100 bg-white text-rose-700 hover:border-rose hover:bg-white hover:text-rose-700">
              <RotateCcw className="size-3.5" aria-hidden />
              {diagnostic.retry}
            </Button>
          </div>
        </motion.div>
      </Collapsible>
      {!error && reconnecting && (
        <p role="status" className="mb-3 flex items-center justify-center gap-2 text-[0.8125rem] text-ink-muted">
          <LogoSpinner size={14} />
          {diagnostic.reconnecting}
        </p>
      )}
      {status && <p role="status" className="mb-3 text-center text-xs font-medium text-teal-700">{status}</p>}
      <Collapsible show={almostThere !== null}>
        <motion.p
          role="status"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: EASE_OUT }}
          className="mb-3 flex items-center gap-2 rounded-2xl border border-gold-100 bg-gold-50 px-3.5 py-2 text-[0.8125rem] font-medium text-ink-soft [@media(max-height:44rem)]:hidden"
        >
          <Sparkles className="size-4 shrink-0 text-gold-700" aria-hidden />
          {fill(diagnostic.almostThere, { count: almostThere ?? 0 })}
        </motion.p>
      </Collapsible>
    </>
  );
}
