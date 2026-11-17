import { BRAND } from "@/lib/config/brand";
import { ORGANIZATION_NODE, SITE, WEBSITE_NODE } from "@/lib/config/site";

type AgentJsonLdProps = { path: string; name: string; description: string };

/**
 * Structured data for a public page (agent, trust, support): the page itself, inside the site and the organisation,
 * with a breadcrumb back to the home page.
 */
export function AgentJsonLd({ path, name, description }: AgentJsonLdProps) {
  const url = `${SITE.url}${path}`;
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      ORGANIZATION_NODE,
      WEBSITE_NODE,
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: `${name} | ${BRAND.name}`,
        description,
        inLanguage: ["en", "ar"],
        isPartOf: { "@id": WEBSITE_NODE["@id"] },
        breadcrumb: { "@id": `${url}#breadcrumb` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: BRAND.name, item: SITE.url },
          { "@type": "ListItem", position: 2, name, item: url },
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      // Static, server-built object: nothing user-controlled is serialised.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
