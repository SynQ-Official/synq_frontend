import type { Metadata } from "next";
import type { ReactNode } from "react";
import { NO_INDEX } from "@/lib/config/site";

/** The parent portal: its own session (`/api/family-session`), never the patient shell. */
export const metadata: Metadata = { title: "SynQ Family", robots: NO_INDEX };

export default function FamilyLayout({ children }: { children: ReactNode }) {
  return children;
}
