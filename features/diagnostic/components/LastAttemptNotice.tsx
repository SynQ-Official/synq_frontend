"use client";

import { useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Info, X } from "lucide-react";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";

const storageKey = (chatId: string) => `mira:last-attempt-notice:${chatId}`;

/** Closed earlier in this conversation (sessionStorage); unreadable storage counts as not closed. */
function wasClosed(chatId: string) {
  try {
    return sessionStorage.getItem(storageKey(chatId)) === "1";
  } catch {
    return false;
  }
}

/** Nothing to subscribe to: the flag only changes through `close` below, which also sets local state. */
const subscribeNever = () => () => undefined;

/**
 * "This is your final orientation": a slim gold bar over the conversation. It can be closed with one tap, so the chat gets the
 * whole screen, and stays closed for the rest of this conversation. On a phone it is a single line; the full sentence is
 * one tap away on the bar itself.
 */
export function LastAttemptNotice({ chatId, title, body, closeLabel, show, className }: { chatId: string; title: string; body: string; closeLabel: string; show: boolean; className?: string }) {
  // Closed on the server, so the first client paint agrees; the bar then slides in unless it was closed before.
  const closedBefore = useSyncExternalStore(subscribeNever, () => wasClosed(chatId), () => true);
  // Keyed by conversation: closing it in one never hides it in the next.
  const [closedFor, setClosedFor] = useState<string | null>(null);
  const closed = closedBefore || closedFor === chatId;
  const [open, setOpen] = useState(false);

  const close = () => {
    setClosedFor(chatId);
    try {
      sessionStorage.setItem(storageKey(chatId), "1");
    } catch {
      /* private mode: it simply comes back on reload */
    }
  };

  return (
    <AnimatePresence initial={false}>
      {show && !closed && (
        <motion.div
          role="status"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25, ease: EASE_OUT }}
          className={cn("overflow-hidden", className)}
        >
          <div className="flex items-start gap-1 rounded-2xl border border-gold-100 bg-gold-50/90 ps-3.5 pe-1">
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setOpen((value) => !value)}
              className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-start gap-2.5 py-2.5 text-start focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
            >
              <Info className="mt-0.5 size-4 shrink-0 text-gold-700" aria-hidden />
              <span className="min-w-0">
                <span className="block truncate text-sm  text-ink">{title}</span>
                <span className={cn("mt-0.5 text-[0.8125rem] leading-5 text-ink-soft", open ? "block" : "hidden sm:block")}>{body}</span>
              </span>
            </button>
            <button
              type="button"
              onClick={close}
              aria-label={closeLabel}
              title={closeLabel}
              className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-white/70 hover:text-ink focus-visible:outline-2 focus-visible:outline-teal-500"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
