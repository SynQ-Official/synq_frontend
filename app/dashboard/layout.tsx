import type { Metadata } from "next";
import SynqLayout from "@/components/dashboard/SynqLayout";
import { NO_INDEX } from "@/lib/config/site";

// The signed-in space is personal: never indexed, never in previews.
export const metadata: Metadata = { title: "Your space", robots: NO_INDEX };

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SynqLayout>{children}</SynqLayout>;
}
