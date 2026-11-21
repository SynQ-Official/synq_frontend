import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthLayout, AuthLoading } from "@/components/auth/AuthLayout";
import { FamilyAuth } from "@/components/family/FamilyAuth";
import { ROUTES } from "@/lib/config/routes";
import { pageMetadata } from "@/lib/config/site";

/** The one public page of the parent portal: indexable, unlike the signed-in /family area (noindex in its layout). */
export const metadata: Metadata = pageMetadata({
  title: "Parent account: support your child with their clinician",
  description:
    "Create a SynQ Family parent account, then ask to link your child. Their clinician approves the link and decides what you can see before anything opens.",
  path: ROUTES.familyRegister,
});

/** Parent registration, in the same shell as the patient sign-in, with a panel that explains the approval path. */
export default function FamilyRegisterPage() {
  return (
    <AuthLayout audience="parent">
      <Suspense fallback={<AuthLoading />}>
        <FamilyAuth />
      </Suspense>
    </AuthLayout>
  );
}
