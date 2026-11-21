import { BRAND } from "@/lib/config/brand";
import { ORGANIZATION_NODE, SITE, SITEMAP_ROUTES, SITE_MODIFIED, WEBSITE_NODE } from "@/lib/config/site";
import type { Lang } from "@/lib/i18n/config";
import { localizedPath } from "@/lib/i18n/routing";

type AgentJsonLdProps = {
  path: string;
  /** Language of this response: the page URL and inLanguage follow it. */
  lang?: Lang;
  name: string;
  description: string;
  /** Page-specific schema.org nodes (SoftwareApplication, FAQPage…) added to the graph; they must match what the page shows. */
  extra?: ReadonlyArray<Record<string, unknown>>;
};

/**
 * Structured data for a public page (agent, trust, support): the page itself, inside the site and the organisation,
 * with a breadcrumb back to the home page.
 */
export function AgentJsonLd({ path, lang = "en", name, description, extra = [] }: AgentJsonLdProps) {
  const url = `${SITE.url}${localizedPath(path, lang)}`;
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
        inLanguage: lang,
        dateModified: SITEMAP_ROUTES.find((route) => route.path === path)?.modified ?? SITE_MODIFIED,
        isPartOf: { "@id": WEBSITE_NODE["@id"] },
        breadcrumb: { "@id": `${url}#breadcrumb` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: BRAND.name, item: `${SITE.url}${localizedPath("/", lang)}` },
          { "@type": "ListItem", position: 2, name, item: url },
        ],
      },
      ...extra,
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
