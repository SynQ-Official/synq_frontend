import type { Metadata } from "next";
import { INDEX_ROBOTS, ORGANIZATION_NODE, ROOT_SOCIAL, SITE, WEBSITE_NODE } from "@/lib/config/site";
import { cookies } from "next/headers";
import { HomeExperience } from "@/components/home/HomeExperience";
import { HOME_INTRO_COOKIE } from "@/lib/config/home";

export const metadata: Metadata = {
  title: { absolute: SITE.title },
  description: SITE.description,
  alternates: { canonical: "/" },
  robots: INDEX_ROBOTS,
  ...ROOT_SOCIAL,
};

const STRUCTURED_DATA = { "@context": "https://schema.org", "@graph": [ORGANIZATION_NODE, WEBSITE_NODE] };

export default async function Page() {
  // The server HTML always holds the full page, whoever asks (visitor, crawler, inspection tool). The first-visit
  // loading screen and intro are only an overlay on top of it: the cookie decides whether it is drawn, never the content.
  const introSeen = (await cookies()).get(HOME_INTRO_COOKIE)?.value === "1";
  return (
    <>
      <script
        type="application/ld+json"
        // Static, server-built object: nothing user-controlled is serialised.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA).replace(/</g, "\\u003c") }}
      />
      <HomeExperience introSeen={introSeen} />
    </>
  );
}
