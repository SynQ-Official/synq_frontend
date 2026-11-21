import type { Metadata } from "next";
import { INDEX_ROBOTS, ORGANIZATION_NODE, ROOT_SOCIAL, SITE, WEBSITE_NODE } from "@/lib/config/site";
import { HomeExperience } from "@/components/home/HomeExperience";

export const metadata: Metadata = {
  title: { absolute: SITE.title },
  description: SITE.description,
  alternates: { canonical: "/" },
  robots: INDEX_ROBOTS,
  ...ROOT_SOCIAL,
};

const STRUCTURED_DATA = { "@context": "https://schema.org", "@graph": [ORGANIZATION_NODE, WEBSITE_NODE] };

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        // Static, server-built object: nothing user-controlled is serialised.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA).replace(/</g, "\\u003c") }}
      />
      <HomeExperience />
    </>
  );
}
