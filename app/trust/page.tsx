import type { Metadata } from "next";
import { AgentJsonLd } from "@/components/agents/AgentJsonLd";
import { TrustPage } from "@/components/trust/TrustPage";
import { ROUTES } from "@/lib/config/routes";
import { pageMetadata } from "@/lib/config/site";
import { trustCopy } from "@/lib/i18n/trust";

const { seoTitle, seoDescription } = trustCopy.en;

export const metadata: Metadata = pageMetadata({ title: seoTitle, description: seoDescription, path: ROUTES.trust });

export default function Page() {
  return (
    <>
      <AgentJsonLd path={ROUTES.trust} name={seoTitle} description={seoDescription} />
      <TrustPage />
    </>
  );
}
