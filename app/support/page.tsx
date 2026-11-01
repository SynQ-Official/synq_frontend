import type { Metadata } from "next";
import { AgentJsonLd } from "@/components/agents/AgentJsonLd";
import { SupportScreen } from "@/components/support/SupportScreen";
import { ROUTES } from "@/lib/config/routes";
import { pageMetadata } from "@/lib/config/site";

const TITLE = "Support";
const DESCRIPTION = "Questions about SynQ, your privacy or your account? Write to the team: we reply within one working day.";

export const metadata: Metadata = pageMetadata({ title: TITLE, description: DESCRIPTION, path: ROUTES.support });

export default function SupportPage() {
  return (
    <>
      <AgentJsonLd path={ROUTES.support} name={TITLE} description={DESCRIPTION} />
      <SupportScreen />
    </>
  );
}
