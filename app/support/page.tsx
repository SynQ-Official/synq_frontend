import type { Metadata } from "next";
import { AgentJsonLd } from "@/components/agents/AgentJsonLd";
import { SupportScreen } from "@/components/support/SupportScreen";
import { ROUTES } from "@/lib/config/routes";
import { SITE, pageMetadata } from "@/lib/config/site";
import { LANGUAGE_STORAGE_KEY, copy, normalizeLanguage } from "@/lib/i18n/config";
import { cookies } from "next/headers";

const TITLE = "Support";
const DESCRIPTION =
  "Questions about SynQ, your privacy or your account? Write to the team: we reply within one working day. Quick answers on sharing and urgent situations.";

export const metadata: Metadata = pageMetadata({ title: TITLE, description: DESCRIPTION, path: ROUTES.support });

export default async function SupportPage() {
  // The FAQ on screen follows the visitor's language, so the FAQPage data must too: it has to match what is visible.
  const language = normalizeLanguage((await cookies()).get(LANGUAGE_STORAGE_KEY)?.value);
  const faqNode = {
    "@type": "FAQPage",
    "@id": `${SITE.url}${ROUTES.support}#faq`,
    inLanguage: language,
    mainEntity: copy[language].support.faq.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
  return (
    <>
      <AgentJsonLd path={ROUTES.support} name={TITLE} description={DESCRIPTION} extra={[faqNode]} />
      <SupportScreen />
    </>
  );
}
