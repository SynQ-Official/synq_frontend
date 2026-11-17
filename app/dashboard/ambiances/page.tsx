import type { Metadata } from "next";
import { AmbiencesView } from "@/components/patient/ambiences/AmbiencesView";

export const metadata: Metadata = { title: "Comfort sounds" };

/** Comfort sounds for the patient's track. Nothing plays until the patient asks. */
export default function AmbiencesPage() {
  return <AmbiencesView />;
}
