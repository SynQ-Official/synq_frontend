"use client";

import { useState } from "react";
import { LocaleLink as Link } from "@/components/shared/LocaleLink";
import { Bell, FileText, HeartPulse } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNotifications } from "@/hooks/patient/useNotifications";
import { usePatientCopy } from "@/hooks/usePatientCopy";
import { cn } from "@/lib/utils";

/** The in-app notification center; the daily check-in reminder lives here. */
export function NotificationBell({ placement = "strip" }: { placement?: "rail" | "strip" }) {
  const copy = usePatientCopy();
  const { items, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`${copy.shell.notifications.open}${unreadCount ? ` (${unreadCount})` : ""}`}
          className="lm-glass relative inline-flex size-11 items-center justify-center rounded-full text-ink transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
        >
          <Bell className="size-[1.1rem]" aria-hidden />
          {unreadCount > 0 && (
            <span className="absolute end-2 top-2 flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-rose-700/50" style={{ animationDuration: "2.4s" }} />
              <span className="relative inline-flex size-2.5 rounded-full bg-rose-700 ring-2 ring-white" />
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align={placement === "rail" ? "start" : "end"} sideOffset={8} className="lm-glass w-[min(22rem,calc(100vw-2rem))] rounded-2xl p-2">
        <div className="flex items-center justify-between gap-3 px-3 py-2">
          <p className="text-sm  text-ink">{copy.shell.notifications.title}</p>
          {unreadCount > 0 && (
            <button type="button" onClick={markAllRead} className="text-xs font-medium text-teal-700 hover:underline">
              {copy.shell.notifications.markAllRead}
            </button>
          )}
        </div>
        {items.length === 0 ? (
          <p className="px-3 pb-4 pt-2 text-sm text-muted-foreground">{copy.shell.notifications.empty}</p>
        ) : (
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  onClick={() => {
                    markRead(item.id);
                    setOpen(false);
                  }}
                  className={cn("flex items-start gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-white/80", !item.read && "bg-teal-50/70")}
                >
                  <span className={cn("stat-tile mt-0.5 size-9", item.kind === "report" && "stat-tile-gold")}>
                    {item.kind === "checkin" ? <HeartPulse className="size-4" aria-hidden /> : <FileText className="size-4" aria-hidden />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm  leading-snug text-ink">{item.title}</span>
                    <span className="mt-0.5 block text-[0.8125rem] leading-snug text-muted-foreground">{item.body}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
