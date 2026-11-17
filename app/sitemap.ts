import type { MetadataRoute } from "next";
import { SITEMAP_ROUTES, SITE_URL } from "@/lib/config/site";

// No <lastmod>: there is no per-page edit date to report, and stamping every page with the deploy date is a claim
// search engines learn to ignore. Add one per route only if it can be true.
export default function sitemap(): MetadataRoute.Sitemap {
  return SITEMAP_ROUTES.map(({ path, priority, changeFrequency }) => ({
    url: path === "/" ? SITE_URL : `${SITE_URL}${path}`,
    changeFrequency,
    priority,
  }));
}
