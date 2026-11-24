import { AuthLayout } from "@/components/auth/AuthLayout";
import { VerifyEmailScreen } from "@/components/auth/VerifyEmailScreen";
import { ROUTES } from "@/lib/config/routes";
import { pageMetadata } from "@/lib/config/site";
import type { Metadata } from "next";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Confirm your parent e-mail",
    description: "Confirm the e-mail address of your SynQ Family parent account.",
    path: ROUTES.familyVerifyEmail,
    noindex: true,
  }),
  // The link carries a one-time secret: it must never leave in a Referer header.
  referrer: "no-referrer",
};

/** The parent's counterpart of /verify-email: same screen, the parent portal's own API and sign-in. */
export default function FamilyVerifyEmailPage() {
  return (
    <AuthLayout audience="parent">
      <VerifyEmailScreen audience="parent" />
    </AuthLayout>
  );
}
