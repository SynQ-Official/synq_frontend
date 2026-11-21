import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ClinicAccessScreen } from "@/components/access/ClinicAccessScreen";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { ROUTES } from "@/lib/config/routes";
import { pageMetadata } from "@/lib/config/site";
import { LANGUAGE_STORAGE_KEY, normalizeLanguage } from "@/lib/i18n/config";
import { accessCopy } from "@/lib/i18n/access";

export async function generateMetadata(): Promise<Metadata> {
  const copy = accessCopy[normalizeLanguage((await cookies()).get(LANGUAGE_STORAGE_KEY)?.value)].clinic;
  return pageMetadata({ title: copy.seoTitle, description: copy.seoDescription, path: ROUTES.clinicAccess });
}

/** "Request clinic access": where clinicians land when the clinician app's URL is not configured. */
export default function ClinicAccessPage() {
  return (
    <AuthLayout>
      <ClinicAccessScreen />
    </AuthLayout>
  );
}
