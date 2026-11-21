import type { Metadata } from "next";
import { AgentJsonLd } from "@/components/agents/AgentJsonLd";
import { LuminaPage } from "@/components/agents/lumina/LuminaPage";
import { ROUTES } from "@/lib/config/routes";
import { pageMetadata, softwareApplicationNode } from "@/lib/config/site";
import { agentPagesCopy } from "@/lib/i18n/agents";
import { requestLanguage } from "@/lib/server/request-language";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await requestLanguage();
  const { seo } = agentPagesCopy[lang].lumina;
  return pageMetadata({ title: seo.title, description: seo.description, path: ROUTES.lumina, lang });
}

export default async function Page() {
  const lang = await requestLanguage();
  const { seo } = agentPagesCopy[lang].lumina;
  return (
    <>
      <AgentJsonLd
        path={ROUTES.lumina}
        lang={lang}
        name={seo.title}
        description={seo.description}
        extra={[softwareApplicationNode({ path: ROUTES.lumina, name: "Lumina", description: seo.description })]}
      />
      <LuminaPage />
    </>
  );
}
