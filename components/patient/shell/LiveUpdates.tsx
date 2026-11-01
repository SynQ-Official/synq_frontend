"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { AlarmClock, CalendarCheck, CloudOff, Wifi, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useReminderPrefs } from "@/hooks/patient/useNotifications";
import { useEventStream, type JobProgressData, type LiveEvent, type ReportReadyData } from "@/hooks/useEventStream";
import { invalidatePatientData } from "@/hooks/usePatientResource";
import { usePatientCopy } from "@/hooks/usePatientCopy";
import { clearJobs, recordJob } from "@/lib/patient/jobs";
import { EASE_OUT } from "@/lib/motion";

/** How long a short drop stays invisible: most reconnects finish well within it. */
const QUIET_MS = 6_000;
const NOTICE_MS = 15_000;

/**
 * The patient shell's one live connection. It turns what the API pushes into calm, small things:
 *  - `report.ready`   -> the reports refresh and a gentle notice offers them;
 *  - `job.progress`   -> inline progress on the journal (see `useJob`), and its lists refresh when it ends;
 *  - connection drops -> a quiet hint, never an alarm.
 * Mounted once, only while the patient is signed in; unmounting it (sign-out) closes the stream.
 */
export function LiveUpdates() {
  const copy = usePatientCopy();
  const live = copy.live;
  const [notice, setNotice] = useState<{ id: number; weekStart: string } | null>(null);
  const [reminder, setReminder] = useState<{ id: number; title: string; body: string; href: string; bedtime: boolean } | null>(null);
  const seen = useRef(new Set<number>());
  const router = useRouter();
  const prefs = useReminderPrefs();
  const browserAlerts = useRef(false);
  useEffect(() => {
    browserAlerts.current = prefs.browser;
  }, [prefs.browser]);

  const onEvent = useCallback((event: LiveEvent) => {
    if (typeof event.id === "number") {
      if (seen.current.has(event.id)) return;
      seen.current.add(event.id);
      if (seen.current.size > 200) seen.current.delete(seen.current.values().next().value as number);
    }
    if (event.type === "report.ready") {
      const report = event.data as ReportReadyData;
      // A clinician's copy of the report is not for the patient app.
      if (report.audience !== "patient") return;
      invalidatePatientData("reports");
      // `weekStart` arrives as a full timestamp; the reports are keyed by day.
      setNotice({ id: event.id, weekStart: String(report.weekStart).slice(0, 10) });
    } else if (event.type === "notification") {
      const note = event.data as { notificationType?: string; title?: string; body?: string; href?: string };
      // The optional bedtime reminder of the comfort sounds: stored as SYSTEM, pointing at the sounds page.
      const bedtime = note.notificationType === "SYSTEM" && note.href === "/dashboard/ambiances";
      if ((note.notificationType !== "CHECKIN_REMINDER" && !bedtime) || !note.title) return;
      // Only ever a link inside the patient app.
      const href = note.href?.startsWith("/dashboard/") ? note.href : "/dashboard/check-in";
      setReminder({ id: event.id, title: note.title, body: note.body ?? "", href, bedtime });
      // Inside the app only: no check-in refresh, and never a system notification (its text would show on a lock screen).
      if (bedtime) return;
      invalidatePatientData("checkins:schedule");
      // The device's own choice: a system notification too, when the tab is not in view.
      if (browserAlerts.current && typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted" && document.visibilityState !== "visible") {
        const system = new Notification(note.title, { body: note.body, icon: "/logo.png", tag: `vitamind-checkin-${event.id}` });
        system.onclick = () => {
          window.focus();
          router.push(href);
          system.close();
        };
      }
    } else if (event.type === "job.progress") {
      const job = event.data as JobProgressData;
      recordJob(job);
      if (job.kind === "journal.analysis" && (job.status === "completed" || job.status === "failed")) {
        invalidatePatientData("journal");
      }
    }
  }, [router]);

  const { state } = useEventStream({ enabled: true, onEvent });

  useEffect(() => clearJobs, []);

  useEffect(() => {
    if (!reminder) return;
    const timer = window.setTimeout(() => setReminder(null), NOTICE_MS * 2);
    return () => window.clearTimeout(timer);
  }, [reminder]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), NOTICE_MS);
    return () => window.clearTimeout(timer);
  }, [notice]);

  // A brief drop is invisible; a longer one (or the browser going offline) shows a quiet hint.
  const [lingering, setLingering] = useState(false);
  useEffect(() => {
    if (state !== "reconnecting") return;
    const timer = window.setTimeout(() => setLingering(true), QUIET_MS);
    return () => {
      window.clearTimeout(timer);
      setLingering(false);
    };
  }, [state]);
  const troubled = state === "offline" || (state === "reconnecting" && lingering);

  const [back, setBack] = useState(false);
  const hadTrouble = useRef(false);
  useEffect(() => {
    if (troubled) {
      hadTrouble.current = true;
      return;
    }
    if (state !== "open" || !hadTrouble.current) return;
    hadTrouble.current = false;
    setBack(true);
    const timer = window.setTimeout(() => setBack(false), 2_500);
    return () => window.clearTimeout(timer);
  }, [troubled, state]);

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4 lg:bottom-6">
        <AnimatePresence>
          {reminder && (
            <motion.div
              key="reminder"
              role="status"
              aria-live="polite"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.4, ease: EASE_OUT }}
              className="lm-glass pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border border-teal-100 px-4 py-3.5 shadow-lg"
            >
              <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700" aria-hidden>
                <AlarmClock className="size-[1.125rem]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">{reminder.title}</p>
                <p className="mt-0.5 text-sm text-ink-muted">{reminder.body}</p>
                <Link
                  href={reminder.href}
                  onClick={() => setReminder(null)}
                  className="mt-2 inline-flex min-h-9 items-center rounded-full bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
                >
                  {reminder.bedtime ? copy.ambiences.open : copy.checkinSchedule.openCheckin}
                </Link>
              </div>
              <button
                type="button"
                onClick={() => setReminder(null)}
                aria-label={copy.checkinSchedule.dismiss}
                className="-m-1.5 inline-flex size-10 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-teal-50 hover:text-ink focus-visible:outline-2 focus-visible:outline-teal-500"
              >
                <X className="size-4" aria-hidden />
              </button>
            </motion.div>
          )}

          {notice && (
            <motion.div
              key="report"
              role="status"
              aria-live="polite"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.4, ease: EASE_OUT }}
              className="lm-glass pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border border-teal-100 px-4 py-3.5 shadow-lg"
            >
              <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700" aria-hidden>
                <CalendarCheck className="size-[1.125rem]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">{live.report.title}</p>
                <p className="mt-0.5 text-sm text-ink-muted">{live.report.body}</p>
                <Link
                  href="/dashboard/reports"
                  onClick={() => setNotice(null)}
                  className="mt-2 inline-flex min-h-9 items-center rounded-full bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
                >
                  {live.report.open}
                </Link>
              </div>
              <button
                type="button"
                onClick={() => setNotice(null)}
                aria-label={live.report.dismiss}
                className="-m-1.5 inline-flex size-10 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-teal-50 hover:text-ink focus-visible:outline-2 focus-visible:outline-teal-500"
              >
                <X className="size-4" aria-hidden />
              </button>
            </motion.div>
          )}

          {(troubled || back) && (
            <motion.p
              key="connection"
              role="status"
              aria-live="polite"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: EASE_OUT }}
              className="pointer-events-auto inline-flex max-w-md items-center gap-2 rounded-full border border-white/90 bg-white/90 px-4 py-2 text-xs font-medium text-ink-muted shadow-soft backdrop-blur-sm"
            >
              {troubled ? <CloudOff className="size-3.5 shrink-0 text-gold-700" aria-hidden /> : <Wifi className="size-3.5 shrink-0 text-sage-700" aria-hidden />}
              {troubled ? (state === "offline" ? live.connection.offline : live.connection.reconnecting) : live.connection.back}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
