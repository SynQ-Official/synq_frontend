import type { Metadata } from "next";
import { LibraryView } from "@/components/patient/library/LibraryView";

export const metadata: Metadata = { title: "Library" };

/** The reading library: every article for the patient's track, opened at its public source. */
export default function LibraryPage() {
  return <LibraryView />;
}
