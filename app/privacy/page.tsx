import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AgentJsonLd } from "@/components/agents/AgentJsonLd";
import { PrivacyPage } from "@/components/legal/PrivacyPage";
import { ROUTES } from "@/lib/config/routes";
import { pageMetadata } from "@/lib/config/site";
import { LANGUAGE_STORAGE_KEY, normalizeLanguage } from "@/lib/i18n/config";
import { trustCopy } from "@/lib/i18n/trust";

async function seoCopy() {
  return trustCopy[normalizeLanguage((await cookies()).get(LANGUAGE_STORAGE_KEY)?.value)];
}

/** Title and description follow the visitor's language, like the page itself. */
export async function generateMetadata(): Promise<Metadata> {
  const { seoTitle, seoDescription } = await seoCopy();
  return pageMetadata({ title: seoTitle, description: seoDescription, path: ROUTES.privacy });
}

export default async function Page() {
  const { seoTitle, seoDescription } = await seoCopy();
  return (
    <>
      <AgentJsonLd path={ROUTES.privacy} name={seoTitle} description={seoDescription} />
      <PrivacyPage />
    </>
  );
}
