import type { Metadata } from "next";
import { cookies } from "next/headers";
import { NotFoundScreen } from "@/components/shared/NotFoundScreen";
import { LANGUAGE_STORAGE_KEY, normalizeLanguage } from "@/lib/i18n/config";
import { legalUi } from "@/lib/i18n/legal";

/** Its own title and description, in the visitor's language, so the 404 no longer reuses the home page's. */
export async function generateMetadata(): Promise<Metadata> {
  const language = normalizeLanguage((await cookies()).get(LANGUAGE_STORAGE_KEY)?.value);
  const { seoTitle, seoDescription } = legalUi[language].notFound;
  return { title: seoTitle, description: seoDescription, alternates: { canonical: null }, robots: { index: false, follow: true } };
}

export default function NotFound() {
  return <NotFoundScreen />;
}
