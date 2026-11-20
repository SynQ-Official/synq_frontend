import { AuthLayout } from "@/components/auth/AuthLayout";
import { ChangePasswordScreen } from "@/components/auth/AccountAccessScreens";
import { ROUTES } from "@/lib/config/routes";
import { pageMetadata } from "@/lib/config/site";
import type { Metadata } from "next";

export const metadata: Metadata = pageMetadata({
  title: "Choose your password",
  description: "Replace the temporary password your care team gave you with one only you know.",
  path: ROUTES.changePassword,
  noindex: true,
});

/** Signed out on purpose: no session and no PatientProvider. The temporary password only opens this one step. */
export default function ChangePasswordPage() {
  return (
    <AuthLayout>
      <ChangePasswordScreen />
    </AuthLayout>
  );
}
