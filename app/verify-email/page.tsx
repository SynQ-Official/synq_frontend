import { AuthLayout } from "@/components/auth/AuthLayout";
import { VerifyEmailScreen } from "@/components/auth/VerifyEmailScreen";
import { ROUTES } from "@/lib/config/routes";
import { pageMetadata } from "@/lib/config/site";
import type { Metadata } from "next";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Confirm your e-mail",
    description: "Confirm the e-mail address of your private SynQ account.",
    path: ROUTES.verifyEmail,
    noindex: true,
  }),
  // The link carries a one-time secret: it must never leave in a Referer header.
  referrer: "no-referrer",
};

/** Public on purpose: the token in the link is the proof, so no session is needed to confirm the address. */
export default function VerifyEmailPage() {
  return (
    <AuthLayout>
      <VerifyEmailScreen audience="patient" />
    </AuthLayout>
  );
}
