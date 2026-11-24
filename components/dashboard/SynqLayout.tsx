"use client";

import type { ReactNode } from "react";
import { PatientChrome } from "@/components/patient/shell/PatientShell";

/** Layout of every screen behind sign-in: `/dashboard/*`. */
export default function SynqLayout({ children }: { children: ReactNode }) {
  return <PatientChrome>{children}</PatientChrome>;
}
