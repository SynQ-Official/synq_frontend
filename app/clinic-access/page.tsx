import type { Metadata } from "next";
import { ClinicAccessScreen } from "@/components/access/ClinicAccessScreen";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { ROUTES } from "@/lib/config/routes";
import { pageMetadata } from "@/lib/config/site";
import { accessCopy } from "@/lib/i18n/access";
import { requestLanguage } from "@/lib/server/request-language";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await requestLanguage();
  const copy = accessCopy[lang].clinic;
  return pageMetadata({ title: copy.seoTitle, description: copy.seoDescription, path: ROUTES.clinicAccess, lang });
}

/** "Request clinic access": where clinicians land when the clinician app's URL is not configured. */
export default function ClinicAccessPage() {
  return (
    <AuthLayout audience="clinic">
      <ClinicAccessScreen />
    </AuthLayout>
  );
}
