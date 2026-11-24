import { AuthLayout } from "@/components/auth/AuthLayout";
import { ForgotPasswordScreen } from "@/components/auth/PasswordResetScreens";
import { ROUTES } from "@/lib/config/routes";
import { pageMetadata } from "@/lib/config/site";
import type { Metadata } from "next";

export const metadata: Metadata = pageMetadata({
  title: "Parent account: forgot password",
  description: "Request a link to choose a new password for your SynQ Family parent account.",
  path: ROUTES.familyForgotPassword,
  noindex: true,
});

/** The parent's reset request: the same screen as the patient's, for the parent account type. */
export default function FamilyForgotPasswordPage() {
  return (
    <AuthLayout audience="parent">
      <ForgotPasswordScreen audience="parent" />
    </AuthLayout>
  );
}
