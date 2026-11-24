import { AuthLayout } from "@/components/auth/AuthLayout";
import { ResetPasswordScreen } from "@/components/auth/PasswordResetScreens";
import { isResetLinkUsable } from "@/lib/api/password-reset";
import { ROUTES } from "@/lib/config/routes";
import { pageMetadata } from "@/lib/config/site";
import type { Metadata } from "next";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Parent account: reset password",
    description: "Choose a new password for your SynQ Family parent account.",
    path: ROUTES.familyResetPassword,
    noindex: true,
  }),
  // The link carries a one-time secret: it must never leave in a Referer header.
  referrer: "no-referrer",
};

/** Same flow as the patient reset page, checked against the parent audience before anything renders. */
export default async function FamilyResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const raw = (await searchParams).token;
  const token = typeof raw === "string" && /^[A-Za-z0-9_-]{43}$/.test(raw) ? raw : null;
  const usable = token ? await isResetLinkUsable(token, "parent") : false;
  return (
    <AuthLayout audience="parent">
      <ResetPasswordScreen token={usable ? token : null} audience="parent" />
    </AuthLayout>
  );
}
