import { Suspense } from "react";
import { FamilyAuth } from "@/components/family/FamilyAuth";
import { FamilyShell } from "@/components/family/FamilyShell";

export default function FamilyRegisterPage() {
  return <FamilyShell guarded={false}><Suspense><FamilyAuth /></Suspense></FamilyShell>;
}
