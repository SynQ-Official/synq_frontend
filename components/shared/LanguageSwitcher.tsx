"use client";

import { LayoutGroup, motion } from "framer-motion";
import { Check, Globe } from "lucide-react";
import { useId, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLanguage } from "@/contexts/LanguageContext";
import { LANGS, type Lang } from "@/lib/i18n/config";
import { SPRING_SOFT } from "@/lib/motion";
import { cn } from "@/lib/utils";

type LanguageSwitcherProps = {
  className?: string;
  /** `sm` for headers and shells, `md` for menus where it is a primary control. */
  size?: "sm" | "md";
  /** `segmented` shows every option; `menu` is a discreet globe that opens a list (patient shell). */
  variant?: "segmented" | "menu";
  /** Called after the language changes (e.g. the diagnostic restarts its session). */
  onChange?: (language: Lang) => void;
};

/**
 * The one language control used across SynQ. The active indicator slides between options;
 * each instance scopes its own layout group so two switchers on a page never animate into each other.
 */
export function LanguageSwitcher({ className, size = "sm", variant = "segmented", onChange }: LanguageSwitcherProps) {
  const { language, setLanguage, dictionary } = useLanguage();
  const scope = useId();
  const [open, setOpen] = useState(false);

  if (variant === "menu") {
    const current = LANGS.find((item) => item.code === language);
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={`${dictionary.nav.language} / Language: ${current?.label ?? language}`}
            className={cn(
              "inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-full px-2.5 text-xs  text-ink-muted transition-colors hover:bg-teal-50 hover:text-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 data-[state=open]:bg-teal-50 data-[state=open]:text-teal-800",
              className,
            )}
          >
            <Globe className="size-[1.1rem]" aria-hidden />
            <span lang={current?.bcp47}>{current?.flag}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" sideOffset={8} className="w-44 rounded-2xl p-1.5">
          <ul role="list">
            {LANGS.map((item) => {
              const active = item.code === language;
              return (
                <li key={item.code}>
                  <button
                    type="button"
                    lang={item.bcp47}
                    aria-pressed={active}
                    onClick={() => {
                      setOpen(false);
                      if (active) return;
                      setLanguage(item.code);
                      onChange?.(item.code);
                    }}
                    className={cn(
                      "flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-3 text-sm text-ink transition-colors hover:bg-teal-50 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-500",
                      active && " text-teal-800",
                    )}
                  >
                    {item.label}
                    {active && <Check className="size-4 text-teal-700" aria-hidden />}
                  </button>
                </li>
              );
            })}
          </ul>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <LayoutGroup id={scope}>
      <div
        role="group"
        aria-label={`${dictionary.nav.language} / Language`}
        className={cn("inline-flex shrink-0 items-center gap-0.5 rounded-full border border-line bg-white/80 p-1 backdrop-blur-sm", className)}
      >
        {LANGS.map((item) => {
          const active = item.code === language;
          return (
            <button
              key={item.code}
              type="button"
              onClick={() => {
                if (active) return;
                setLanguage(item.code);
                onChange?.(item.code);
              }}
              aria-pressed={active}
              aria-label={item.label}
              title={item.label}
              lang={item.bcp47}
              className={cn(
                // The ::before extends the hit area to a comfortable touch target without enlarging the control.
                "relative inline-flex cursor-pointer items-center justify-center rounded-full  tracking-wide transition-colors duration-200 before:absolute before:-inset-1.5 before:content-[''] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-500",
                size === "sm" ? "h-8 min-w-10 px-2.5 text-xs" : "h-10 min-w-14 px-4 text-sm",
                active ? "text-white" : "text-ink-muted hover:text-ink",
              )}
            >
              {active ? (
                <motion.span layoutId="language-indicator" className="absolute inset-0 rounded-full bg-primary" transition={SPRING_SOFT} aria-hidden />
              ) : null}
              <span className="relative z-10">{item.flag}</span>
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}
