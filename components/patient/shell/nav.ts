import { BookHeart, BookOpen, FileText, HeartHandshake, HeartPulse, Headphones, House, Settings, Zap, type LucideIcon } from "lucide-react";

import { showsReads, type HomeTrack } from "@/lib/patient/content";

export type PatientNavGroup = "daily" | "care" | "account";

export type PatientNavKey = "home" | "checkin" | "journal" | "spark" | "library" | "ambiances" | "care" | "reports" | "settings";

/** The patient screens, in the order they appear. `group` is the section of the sidebar they sit under. */
export const PATIENT_NAV: { key: PatientNavKey; href: string; icon: LucideIcon; group: PatientNavGroup }[] = [
  { key: "home", href: "/dashboard", icon: House, group: "daily" },
  { key: "checkin", href: "/dashboard/check-in", icon: HeartPulse, group: "daily" },
  { key: "journal", href: "/dashboard/journal", icon: BookOpen, group: "daily" },
  { key: "spark", href: "/dashboard/spark", icon: Zap, group: "daily" },
  { key: "library", href: "/dashboard/library", icon: BookHeart, group: "care" },
  { key: "ambiances", href: "/dashboard/ambiances", icon: Headphones, group: "care" },
  { key: "care", href: "/dashboard/care", icon: HeartHandshake, group: "care" },
  { key: "reports", href: "/dashboard/reports", icon: FileText, group: "care" },
  { key: "settings", href: "/dashboard/settings", icon: Settings, group: "account" },
];

export function isActive(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * The screens for a track: the library is there for bipolar, schizophrenia and psychosis; Spark, the task
 * assistant, takes its place for ADHD. Neither shows before the track is known. Comfort sounds show only when the server
 * has some for this patient (`withAmbiences`): never for the psychosis track until the clinician has switched them on.
 */
export function navFor(track: HomeTrack | undefined, withAmbiences = false, withCare = false) {
  return PATIENT_NAV.filter((item) => {
    if (item.key === "library") return track !== undefined && showsReads(track);
    if (item.key === "spark") return track === "ADHD";
    if (item.key === "ambiances") return withAmbiences;
    // The care team's messages and medication: only for a patient who has a clinician.
    if (item.key === "care") return withCare;
    return true;
  });
}
