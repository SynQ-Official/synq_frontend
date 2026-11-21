import { BRAND } from "@/lib/config/brand";
import { ROUTES } from "@/lib/config/routes";
import { SITE } from "@/lib/config/site";
import { agentPagesCopy } from "@/lib/i18n/agents";
import { legalUi } from "@/lib/i18n/legal";
import { tracksCopy } from "@/lib/i18n/tracks";
import { trustCopy } from "@/lib/i18n/trust";

// Built once at build time from the same copy the pages use, so the summary never drifts from the site.
export const dynamic = "force-static";

const { mira, lumina, psy } = agentPagesCopy.en;
const link = (title: string, path: string, note: string) => `- [${title}](${SITE.url}${path}): ${note}`;

/** /llms.txt (llmstxt.org): a short, factual map of the public site for AI agents. English; the site itself is bilingual (en/ar). */
export function GET() {
  const body = [
    `# ${BRAND.name}`,
    "",
    `> ${SITE.description}`,
    "",
    `${BRAND.name} is not a diagnostic tool and not an emergency service: it supports, and never replaces, the judgment of a licensed clinician. Every page is available in English and Arabic (right-to-left), switched by the visitor's language setting on the same URL.`,
    "",
    "## Products",
    "",
    link("Mira", ROUTES.mira, mira.seo.description),
    link("Lumina", ROUTES.lumina, lumina.seo.description),
    link("Clinician Workspace", ROUTES.psy, psy.seo.description),
    "",
    "## Conditions covered",
    "",
    link("Care paths", ROUTES.tracks, tracksCopy.en.seo.description),
    "",
    "## Trust and support",
    "",
    link("Privacy policy and trust", ROUTES.privacy, trustCopy.en.seoDescription),
    link("Terms of use", ROUTES.terms, legalUi.en.seoDescription),
    link("Support", ROUTES.support, "Questions about SynQ, your privacy or your account, with answers on data sharing and urgent situations."),
    "",
    "## Optional",
    "",
    link("Home", ROUTES.home, "Overview of the platform."),
    "",
  ].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=86400" },
  });
}
