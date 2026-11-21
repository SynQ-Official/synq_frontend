"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { LifeBuoy, X } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { ROUTES } from "@/lib/config/routes";
import { helpCopy } from "@/lib/i18n/help";
import { cn } from "@/lib/utils";
import { EmergencyNumbers } from "./EmergencyNumbers";

/**
 * "Need help now": a real link to /help (works without JavaScript), which opens the numbers in a dialog once the page
 * is interactive. Radix gives the focus trap, Escape and aria-modal; focus returns to this link on close.
 * Deliberately sends no analytics event: opening it or calling a number is never recorded.
 */
export function HelpNow({ className, label = "full" }: { className?: string; label?: "full" | "short" }) {
  const { language, direction } = useLanguage();
  const copy = helpCopy[language];
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLAnchorElement>(null);

  return (
    <>
      <Link
        ref={trigger}
        href={ROUTES.help}
        aria-haspopup="dialog"
        onClick={(event) => {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
          event.preventDefault();
          setOpen(true);
        }}
        className={cn(
          "inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-teal-900/15 bg-white/80 px-3.5 text-sm  text-teal-900 transition-colors duration-200 hover:border-teal-700 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 sm:text-sm",
          className,
        )}
      >
        <LifeBuoy className="size-4 shrink-0 text-teal-700" strokeWidth={1.75} aria-hidden />
        <span className={cn(label === "short" && "sr-only sm:not-sr-only")}>{copy.button}</span>
      </Link>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[90] bg-teal-950/40 backdrop-blur-[2px]" />
          <Dialog.Content
            dir={direction}
            data-lenis-prevent
            aria-describedby={undefined}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              trigger.current?.focus();
            }}
            className="fixed inset-x-0 bottom-0 z-[91] max-h-[88dvh] overflow-y-auto overscroll-contain rounded-t-[1.75rem] border border-line bg-canvas p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-float outline-none sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[min(32rem,calc(100vw-2rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[1.75rem] sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <Dialog.Title className="text-[1.375rem] leading-tight text-ink">{copy.title}</Dialog.Title>
              <Dialog.Close
                aria-label={copy.close}
                className="-me-1 -mt-1 inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-white hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
              >
                <X className="size-5" aria-hidden />
              </Dialog.Close>
            </div>
            <EmergencyNumbers language={language} className="mt-5" />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
