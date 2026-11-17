import type { Metadata } from "next";
import { AgentJsonLd } from "@/components/agents/AgentJsonLd";
import { LuminaPage } from "@/components/agents/lumina/LuminaPage";
import { ROUTES } from "@/lib/config/routes";
import { pageMetadata, softwareApplicationNode } from "@/lib/config/site";
import { agentPagesCopy } from "@/lib/i18n/agents";

const { seo } = agentPagesCopy.en.lumina;

export const metadata: Metadata = pageMetadata({ title: seo.title, description: seo.description, path: ROUTES.lumina });

export default function Page() {
  return (
    <>
      <AgentJsonLd
        path={ROUTES.lumina}
        name={seo.title}
        description={seo.description}
        extra={[softwareApplicationNode({ path: ROUTES.lumina, name: "Lumina", description: seo.description })]}
      />
      <LuminaPage />
    </>
  );
}
