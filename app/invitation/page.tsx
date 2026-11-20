import { AuthLayout } from "@/components/auth/AuthLayout";
import { InvitationScreen, type InvitationView } from "@/components/auth/AccountAccessScreens";
import { checkInvitation } from "@/lib/api/invitation";
import { ROUTES } from "@/lib/config/routes";
import { pageMetadata } from "@/lib/config/site";
import type { Metadata } from "next";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Join SynQ",
    description: "Create your private SynQ account from your clinician's invitation.",
    path: ROUTES.invitation,
    noindex: true,
  }),
  // The link carries a one-time secret: it must never leave in a Referer header.
  referrer: "no-referrer",
};

/**
 * Signed out on purpose: no session, no PatientProvider. The link is checked once, on the server, before anything
 * renders; only a usable link hands its token to the browser (which then removes it from the address bar).
 */
export default async function InvitationPage({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const raw = (await searchParams).token;
  const token = typeof raw === "string" && /^[A-Za-z0-9_-]{43}$/.test(raw) ? raw : null;
  const check = token ? await checkInvitation(token) : ({ state: "invalid" } as const);
  const view: InvitationView = check.state === "usable" && token ? { state: "usable", email: check.email, token } : check.state === "unavailable" ? { state: "unavailable" } : { state: "invalid" };
  return (
    <AuthLayout>
      <InvitationScreen view={view} />
    </AuthLayout>
  );
}
