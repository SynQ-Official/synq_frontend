import type { Metadata } from "next";
import { cookies } from "next/headers";
import { InviteScreen } from "@/components/access/InviteScreen";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { ROUTES } from "@/lib/config/routes";
import { pageMetadata } from "@/lib/config/site";
import { LANGUAGE_STORAGE_KEY, normalizeLanguage } from "@/lib/i18n/config";
import { accessCopy } from "@/lib/i18n/access";

export async function generateMetadata(): Promise<Metadata> {
  const copy = accessCopy[normalizeLanguage((await cookies()).get(LANGUAGE_STORAGE_KEY)?.value)].invite;
  return pageMetadata({ title: copy.seoTitle, description: copy.seoDescription, path: ROUTES.invite });
}

/** "I have a clinic invitation": the public way in for patients (B2B2C, no public sign-up). */
export default function InvitePage() {
  return (
    <AuthLayout>
      <InviteScreen />
    </AuthLayout>
  );
}
