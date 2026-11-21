import type { Metadata } from "next";
import { NotFoundScreen } from "@/components/shared/NotFoundScreen";
import { legalUi } from "@/lib/i18n/legal";
import { requestLanguage } from "@/lib/server/request-language";

/** Its own title and description, in the visitor's language, so the 404 no longer reuses the home page's. */
export async function generateMetadata(): Promise<Metadata> {
  const language = await requestLanguage();
  const { seoTitle, seoDescription } = legalUi[language].notFound;
  return { title: seoTitle, description: seoDescription, alternates: { canonical: null }, robots: { index: false, follow: true } };
}

export default function NotFound() {
  return <NotFoundScreen />;
}
