import { AuthLayout } from "@/components/auth/AuthLayout";
import { AdultConsentScreen } from "@/components/auth/AccountAccessScreens";
import { ROUTES } from "@/lib/config/routes";
import { pageMetadata } from "@/lib/config/site";
import type { Metadata } from "next";

export const metadata: Metadata = pageMetadata({
  title: "Welcome to your adult account",
  description: "Confirm your own adult account and what it means for your care team.",
  path: ROUTES.adultConsent,
  noindex: true,
});

/** Signed out on purpose: no session and no PatientProvider. The adult-consent token only opens this one step. */
export default function AdultConsentPage() {
  return (
    <AuthLayout>
      <AdultConsentScreen />
    </AuthLayout>
  );
}
