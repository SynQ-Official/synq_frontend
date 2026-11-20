import { Suspense } from "react";
import { ChildSpace } from "@/components/family/ChildSpace";
import { FamilyShell } from "@/components/family/FamilyShell";

/** The child id is only a lookup key: the API checks it against the parent session on every call. */
export default async function FamilyChildPage({ params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  return <FamilyShell><Suspense><ChildSpace childId={childId} /></Suspense></FamilyShell>;
}
