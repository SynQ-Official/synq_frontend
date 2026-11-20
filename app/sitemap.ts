import type { MetadataRoute } from "next";
import { SITEMAP_ROUTES, SITE_MODIFIED, SITE_URL } from "@/lib/config/site";

// lastModified is the build date: there is no per-page edit date, and every deploy ships the whole site.
export default function sitemap(): MetadataRoute.Sitemap {
  return SITEMAP_ROUTES.map(({ path, priority, changeFrequency }) => ({
    url: path === "/" ? SITE_URL : `${SITE_URL}${path}`,
    lastModified: SITE_MODIFIED,
    changeFrequency,
    priority,
  }));
}
