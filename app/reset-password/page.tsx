import { AuthLayout } from "@/components/auth/AuthLayout";
import { ResetPasswordScreen } from "@/components/auth/PasswordResetScreens";
import { isResetLinkUsable } from "@/lib/api/password-reset";
import { ROUTES } from "@/lib/config/routes";
import { pageMetadata } from "@/lib/config/site";
import type { Metadata } from "next";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Reset password",
    description: "Choose a new password for your private SynQ space.",
    path: ROUTES.resetPassword,
    noindex: true,
  }),
  // The link carries a one-time secret: it must never leave in a Referer header.
  referrer: "no-referrer",
};

/** Signed out on purpose: no session, no PatientProvider. The link is checked once, on the server, before anything renders. */
export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const raw = (await searchParams).token;
  const token = typeof raw === "string" && /^[A-Za-z0-9_-]{43}$/.test(raw) ? raw : null;
  const usable = token ? await isResetLinkUsable(token, "patient") : false;
  return (
    <AuthLayout>
      <ResetPasswordScreen token={usable ? token : null} audience="patient" />
    </AuthLayout>
  );
}
