"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { usePatientCopy } from "@/hooks/usePatientCopy";
import { useLanguage } from "@/contexts/LanguageContext";
import { useReports } from "@/hooks/patient/useReports";
import { useCheckinSchedule, useTodayCheckin } from "@/hooks/patient/useCheckin";
import { fill } from "@/lib/i18n/patient";
import { formatRange, localDay } from "@/lib/patient/format";
import {
  parseReminderPrefs,
  readNotificationIds,
  readNotificationSnapshot,
  readReminderSnapshot,
  saveNotificationIds,
  subscribeReminders,
} from "@/lib/patient/reminders";

export type AppNotification = {
  id: string;
  kind: "checkin" | "report";
  title: string;
  body: string;
  href: string;
  read: boolean;
};

const serverSnapshot = () => "";

export function useReminderPrefs() {
  const raw = useSyncExternalStore(subscribeReminders, readReminderSnapshot, serverSnapshot);
  return useMemo(() => parseReminderPrefs(raw), [raw]);
}

/**
 * The patient's notification center, derived from what is true right now:
 *  - "time for your daily check-in" while today's check-in is missing;
 *  - "your weekly report is ready" for the latest finished week they have not opened.
 * Read state lives on the device. The reminders themselves are sent by the server at the patient's
 * time (see CheckinReminderService); an open app also shows them live (LiveUpdates).
 */
export function useNotifications() {
  const copy = usePatientCopy();
  const { language } = useLanguage();
  const schedule = useCheckinSchedule();
  const today = useTodayCheckin();
  const reports = useReports(2);
  // The read-state snapshot re-renders us whenever it changes on this or another tab.
  const readSnapshot = useSyncExternalStore(subscribeReminders, readNotificationSnapshot, serverSnapshot);

  const items = useMemo<AppNotification[]>(() => {
    const read = new Set<string>(readSnapshot ? (JSON.parse(readSnapshot) as string[]) : []);
    const list: AppNotification[] = [];
    if (today.data === null) {
      const id = `checkin:${localDay()}`;
      list.push({ id, kind: "checkin", title: copy.shell.notifications.checkinTitle, body: copy.shell.notifications.checkinBody, href: "/dashboard/check-in", read: read.has(id) });
    }
    const ready = reports.data?.data.find((report) => report.status === "READY" && report.hasEnoughData);
    if (ready) {
      const id = `report:${ready.weekStart}`;
      list.push({
        id,
        kind: "report",
        title: copy.shell.notifications.reportTitle,
        body: fill(copy.shell.notifications.reportBody, { range: formatRange(ready.weekStart, ready.weekEnd, language) }),
        href: "/dashboard/reports",
        read: read.has(id),
      });
    }
    return list;
  }, [today.data, reports.data, copy, language, readSnapshot]);

  const markRead = useCallback((id: string) => {
    const ids = readNotificationIds();
    ids.add(id);
    saveNotificationIds(ids);
  }, []);

  const markAllRead = useCallback(() => {
    const ids = readNotificationIds();
    items.forEach((item) => ids.add(item.id));
    saveNotificationIds(ids);
  }, [items]);

  // The check-in item follows the reminder choice saved on the server (shown until a schedule says otherwise).
  const remindersOn = schedule.data?.remindersEnabled ?? true;
  const visible = remindersOn ? items : items.filter((item) => item.kind !== "checkin");
  return { items: visible, unreadCount: visible.filter((item) => !item.read).length, markRead, markAllRead };
}
