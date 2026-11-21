import type { Metadata } from "next";
import { AgentJsonLd } from "@/components/agents/AgentJsonLd";
import { TracksPage } from "@/components/tracks/TracksPage";
import { ROUTES } from "@/lib/config/routes";
import { pageMetadata } from "@/lib/config/site";
import { tracksCopy } from "@/lib/i18n/tracks";
import { requestLanguage } from "@/lib/server/request-language";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await requestLanguage();
  const { seo } = tracksCopy[lang];
  return pageMetadata({ title: seo.title, description: seo.description, path: ROUTES.tracks, lang });
}

export default async function Page() {
  const lang = await requestLanguage();
  const { seo } = tracksCopy[lang];
  return (
    <>
      <AgentJsonLd path={ROUTES.tracks} lang={lang} name={seo.title} description={seo.description} />
      <TracksPage />
    </>
  );
}
