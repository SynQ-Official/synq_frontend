import type { Metadata } from "next";
import { AgentJsonLd } from "@/components/agents/AgentJsonLd";
import { MiraPage } from "@/components/agents/mira/MiraPage";
import { ROUTES } from "@/lib/config/routes";
import { pageMetadata, softwareApplicationNode } from "@/lib/config/site";
import { agentPagesCopy } from "@/lib/i18n/agents";
import { requestLanguage } from "@/lib/server/request-language";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await requestLanguage();
  const { seo } = agentPagesCopy[lang].mira;
  return pageMetadata({ title: seo.title, description: seo.description, path: ROUTES.mira, lang });
}

export default async function Page() {
  const lang = await requestLanguage();
  const { seo } = agentPagesCopy[lang].mira;
  return (
    <>
      <AgentJsonLd
        path={ROUTES.mira}
        lang={lang}
        name={seo.title}
        description={seo.description}
        extra={[softwareApplicationNode({ path: ROUTES.mira, name: "Mira", description: seo.description })]}
      />
      <MiraPage />
    </>
  );
}
