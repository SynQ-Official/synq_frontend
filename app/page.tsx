import type { Metadata } from "next";
import { INDEX_ROBOTS, ORGANIZATION_NODE, ROOT_SOCIAL, SITE, WEBSITE_NODE } from "@/lib/config/site";
import { cookies, headers } from "next/headers";
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

/** Search and link-preview crawlers, and speed audits: they carry no cookie, so they would otherwise only ever get the intro. */
const CRAWLER = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|embedly|pinterest|lighthouse|pagespeed/i;

export default async function Page() {
  // The first visit plays a loading screen + cinematic intro before the page shows. A crawler gets the real page
  // in the server HTML instead (same content, no intro) so the h1, copy and links are indexed without running it.
  const crawler = CRAWLER.test((await headers()).get("user-agent") ?? "");
  const introSeen = crawler || (await cookies()).get(HOME_INTRO_COOKIE)?.value === "1";
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
