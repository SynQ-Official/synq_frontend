"use client";

import type { ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { usePatientCopy } from "@/hooks/usePatientCopy";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";

const SIZES = { md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" } as const;

/**
 * Glass modal for the patient app: soft overlay, animated in and out, RTL-safe close button,
 * focus trapped and restored by Radix. Content scrolls inside on small screens.
 */
export function PatientModal({
  open,
  onOpenChange,
  title,
  description,
  size = "lg",
  hideTitle = false,
  className,
  layoutId,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  size?: keyof typeof SIZES;
  /** Keep the title for screen readers only (the body renders its own heading). */
  hideTitle?: boolean;
  className?: string;
  /** Shared-element id so a card can morph into the modal. */
  layoutId?: string;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  const copy = usePatientCopy();

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                data-patient-overlay
                className="fixed inset-0 z-50 bg-teal-900/35 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduce ? 0 : 0.2 }}
              />
            </Dialog.Overlay>
            <div data-patient-modal className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
              <Dialog.Content asChild forceMount aria-describedby={description ? undefined : undefined}>
                <motion.div
                  layoutId={reduce ? undefined : layoutId}
                  className={cn(
                    "lm-glass pointer-events-auto relative max-h-[calc(100dvh-1.5rem)] w-full overflow-y-auto overscroll-contain bg-white/90 p-5 shadow-2xl sm:max-h-[calc(100dvh-3rem)] sm:p-7",
                    SIZES[size],
                    className,
                  )}
                  initial={layoutId ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={layoutId ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
                  transition={{ duration: reduce ? 0 : 0.32, ease: EASE_OUT }}
                >
                  <Dialog.Title className={hideTitle ? "sr-only" : "pe-10 text-lg  text-ink"}>{title}</Dialog.Title>
                  {description ? (
                    <Dialog.Description className="mt-1 pe-10 text-sm text-muted-foreground">{description}</Dialog.Description>
                  ) : (
                    <Dialog.Description className="sr-only">{title}</Dialog.Description>
                  )}
                  <Dialog.Close
                    aria-label={copy.common.close}
                    className="absolute end-3 top-3 z-10 inline-flex size-9 items-center justify-center rounded-full bg-white/80 text-ink-muted shadow-xs transition-colors hover:bg-white hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
                  >
                    <X className="size-4" aria-hidden />
                  </Dialog.Close>
                  {children}
                </motion.div>
              </Dialog.Content>
            </div>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
