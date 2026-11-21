import type { Metadata } from "next";
import { AgentJsonLd } from "@/components/agents/AgentJsonLd";
import { PrivacyPage } from "@/components/legal/PrivacyPage";
import { ROUTES } from "@/lib/config/routes";
import { PRIVACY_NOINDEX, pageMetadata } from "@/lib/config/site";
import { legalUi } from "@/lib/i18n/legal";
import { requestLanguage } from "@/lib/server/request-language";

/** Title and description follow the page language. Not indexed while the policy still has fields to confirm. */
export async function generateMetadata(): Promise<Metadata> {
  const lang = await requestLanguage();
  const { seoTitle, seoDescription } = legalUi[lang];
  return pageMetadata({ title: seoTitle, description: seoDescription, path: ROUTES.privacy, lang, noindex: PRIVACY_NOINDEX });
}

export default async function Page() {
  const lang = await requestLanguage();
  const { seoTitle, seoDescription } = legalUi[lang];
  return (
    <>
      <AgentJsonLd path={ROUTES.privacy} lang={lang} name={seoTitle} description={seoDescription} />
      <PrivacyPage />
    </>
  );
}
