import type { Metadata } from "next";
import { InviteScreen } from "@/components/access/InviteScreen";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { ROUTES } from "@/lib/config/routes";
import { pageMetadata } from "@/lib/config/site";
import { accessCopy } from "@/lib/i18n/access";
import { requestLanguage } from "@/lib/server/request-language";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await requestLanguage();
  const copy = accessCopy[lang].invite;
  return pageMetadata({ title: copy.seoTitle, description: copy.seoDescription, path: ROUTES.invite, lang });
}

/** "I have a clinic invitation": the public way in for patients (B2B2C, no public sign-up). */
export default function InvitePage() {
  return (
    <AuthLayout>
      <InviteScreen />
    </AuthLayout>
  );
}
