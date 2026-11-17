import type { Metadata } from "next";
import { SparkView } from "@/components/patient/spark/SparkView";

export const metadata: Metadata = { title: "Spark" };

/** Spark, the ADHD task assistant: tell it what is on your mind and it sorts the day. */
export default function SparkPage() {
  return <SparkView />;
}
