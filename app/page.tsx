import type { Metadata } from "next";
import { ORGANIZATION_NODE, WEBSITE_NODE, homeMetadata } from "@/lib/config/site";
import { HomeExperience } from "@/components/home/HomeExperience";
import { requestLanguage } from "@/lib/server/request-language";

export async function generateMetadata(): Promise<Metadata> {
  return homeMetadata(await requestLanguage());
}

const STRUCTURED_DATA = { "@context": "https://schema.org", "@graph": [ORGANIZATION_NODE, WEBSITE_NODE] };

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        // Static, server-built object: nothing user-controlled is serialised.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA).replace(/</g, "\u003c") }}
      />
      <HomeExperience />
    </>
  );
}
