import type { Metadata } from "next";
import { cookies } from "next/headers";
import { LegalPage } from "@/components/legal/LegalPage";
import { ROUTES } from "@/lib/config/routes";
import { pageMetadata } from "@/lib/config/site";
import { LANGUAGE_STORAGE_KEY, normalizeLanguage } from "@/lib/i18n/config";
import { legalCopy } from "@/lib/i18n/legal";

/** Title and description follow the visitor's language, like the page itself. */
export async function generateMetadata(): Promise<Metadata> {
  const language = normalizeLanguage((await cookies()).get(LANGUAGE_STORAGE_KEY)?.value);
  const { seoTitle, seoDescription } = legalCopy.privacy[language];
  return pageMetadata({ title: seoTitle, description: seoDescription, path: ROUTES.privacy });
}

export default function Page() {
  return <LegalPage kind="privacy" />;
}
