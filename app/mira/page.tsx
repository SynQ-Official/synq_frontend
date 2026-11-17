import type { Metadata } from "next";
import { AgentJsonLd } from "@/components/agents/AgentJsonLd";
import { MiraPage } from "@/components/agents/mira/MiraPage";
import { ROUTES } from "@/lib/config/routes";
import { pageMetadata, softwareApplicationNode } from "@/lib/config/site";
import { agentPagesCopy } from "@/lib/i18n/agents";

const { seo } = agentPagesCopy.en.mira;

export const metadata: Metadata = pageMetadata({ title: seo.title, description: seo.description, path: ROUTES.mira });

export default function Page() {
  return (
    <>
      <AgentJsonLd
        path={ROUTES.mira}
        name={seo.title}
        description={seo.description}
        extra={[softwareApplicationNode({ path: ROUTES.mira, name: "Mira", description: seo.description })]}
      />
      <MiraPage />
    </>
  );
}
