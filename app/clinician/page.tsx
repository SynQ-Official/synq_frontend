import type { Metadata } from "next";
import { AgentJsonLd } from "@/components/agents/AgentJsonLd";
import { PsyPage } from "@/components/agents/psy/PsyPage";
import { ROUTES } from "@/lib/config/routes";
import { pageMetadata } from "@/lib/config/site";
import { agentPagesCopy } from "@/lib/i18n/agents";
import { requestLanguage } from "@/lib/server/request-language";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await requestLanguage();
  const { seo } = agentPagesCopy[lang].psy;
  return pageMetadata({ title: seo.title, description: seo.description, path: ROUTES.psy, lang });
}

export default async function Page() {
  const lang = await requestLanguage();
  const { seo } = agentPagesCopy[lang].psy;
  return (
    <>
      <AgentJsonLd path={ROUTES.psy} lang={lang} name={seo.title} description={seo.description} />
      <PsyPage />
    </>
  );
}
