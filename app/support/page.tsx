import type { Metadata } from "next";
import { AgentJsonLd } from "@/components/agents/AgentJsonLd";
import { SupportScreen } from "@/components/support/SupportScreen";
import { ROUTES } from "@/lib/config/routes";
import { SITE, pageMetadata } from "@/lib/config/site";
import { copy, type Lang } from "@/lib/i18n/config";
import { fillHelpAnswer } from "@/lib/i18n/help";
import { localizedPath } from "@/lib/i18n/routing";
import { requestLanguage } from "@/lib/server/request-language";

/** The description promises what the FAQ answers on the page (rendered in the HTML, not only after a click). */
const SEO: Record<Lang, { title: string; description: string }> = {
  en: {
    title: "Help and support for your account and privacy",
    description: "Questions about SynQ, your privacy or your account. Answers on who sees your journal, and what to do in an urgent situation.",
  },
  ar: {
    title: "المساعدة والدعم لحسابك وخصوصيتك",
    description: "أسئلة عن SynQ أو خصوصيتك أو حسابك. إجابات عمّن يرى مفكرتك، وما تفعله في موقف عاجل.",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const lang = await requestLanguage();
  return pageMetadata({ ...SEO[lang], path: ROUTES.support, lang });
}

export default async function SupportPage() {
  // The FAQ on screen follows the page language, so the FAQPage data must too: it has to match what is visible.
  const language = await requestLanguage();
  const faqNode = {
    "@type": "FAQPage",
    "@id": `${SITE.url}${localizedPath(ROUTES.support, language)}#faq`,
    inLanguage: language,
    mainEntity: copy[language].support.faq.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: fillHelpAnswer(answer, language) },
    })),
  };
  return (
    <>
      <AgentJsonLd path={ROUTES.support} lang={language} name={SEO[language].title} description={SEO[language].description} extra={[faqNode]} />
      <SupportScreen />
    </>
  );
}
