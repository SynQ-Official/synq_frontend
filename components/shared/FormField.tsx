"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, type LucideIcon } from "lucide-react";
import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";

type FormFieldProps = {
  id: string;
  label: string;
  error?: string | null;
  hint?: string;
  className?: string;
  compact?: boolean;
  children: ReactNode;
};

/** Label + control + inline error, with one consistent rhythm across every form. */
export function FormField({ id, label, error, hint, className, compact = false, children }: FormFieldProps) {
  return (
    <div className={cn("flex min-w-0 flex-col", compact ? "gap-1" : "gap-1.5", className)}>
      <label htmlFor={id} className={cn("font-medium text-ink-soft", compact ? "text-[0.8125rem]" : "text-sm")}>
        {label}
      </label>
      {children}
      <AnimatePresence initial={false}>
        {error ? (
          <motion.p
            key="error"
            id={`${id}-error`}
            role="alert"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            className="flex items-start gap-1.5 overflow-hidden text-[0.8125rem] leading-5 text-rose-700"
          >
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            {error}
          </motion.p>
        ) : hint ? (
          <p id={`${id}-hint`} className="text-[0.8125rem] leading-5 text-ink-muted">
            {hint}
          </p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

type IconInputProps = InputHTMLAttributes<HTMLInputElement> & {
  icon?: LucideIcon;
  trailing?: ReactNode;
  invalid?: boolean;
};

export const IconInput = forwardRef<HTMLInputElement, IconInputProps>(function IconInput(
  { icon: Icon, trailing, invalid, className, id, "aria-describedby": describedBy, ...props },
  ref,
) {
  return (
    <div className="group relative" dir={props.dir}>
      {Icon ? (
        <Icon
          className="pointer-events-none absolute start-3.5 top-1/2 h-[1.125rem] w-[1.125rem] -translate-y-1/2 text-ink-subtle transition-colors duration-200 group-focus-within:text-teal-600"
          aria-hidden
        />
      ) : null}
      <input
        ref={ref}
        id={id}
        aria-invalid={invalid || undefined}
        aria-describedby={[invalid ? `${id}-error` : null, describedBy].filter(Boolean).join(" ") || undefined}
        className={cn(
          "h-12 w-full min-w-0 rounded-control border border-line-strong bg-white text-[0.9375rem] text-ink shadow-xs outline-none transition-[border-color,box-shadow] duration-200",
          "placeholder:text-ink-subtle hover:border-teal-300 focus:border-teal-500 focus:shadow-focus",
          "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-70",
          "user-invalid:border-rose aria-[invalid=true]:border-rose aria-[invalid=true]:focus:shadow-[0_0_0_4px_rgb(184_112_112/0.16)]",
          Icon ? "ps-11" : "ps-4",
          trailing ? "pe-12" : "pe-4",
          className,
        )}
        {...props}
      />
      {trailing ? <div className="absolute end-1.5 top-1/2 -translate-y-1/2">{trailing}</div> : null}
    </div>
  );
});
