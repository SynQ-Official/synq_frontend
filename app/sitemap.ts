import type { MetadataRoute } from "next";
import { SITEMAP_ROUTES, SITE_URL, languageAlternates } from "@/lib/config/site";
import { isLocalizedPath, localizedPath } from "@/lib/i18n/routing";

const absolute = (path: string) => (path === "/" ? SITE_URL : `${SITE_URL}${path}`);

/** Localized pages twice, English and Arabic, each listing both as hreflang alternates; the others once. */
export default function sitemap(): MetadataRoute.Sitemap {
  return SITEMAP_ROUTES.flatMap(({ path, modified, priority, changeFrequency }) => {
    if (!isLocalizedPath(path)) return [{ url: absolute(path), lastModified: modified, changeFrequency, priority }];
    const languages = Object.fromEntries(Object.entries(languageAlternates(path)).map(([key, value]) => [key, absolute(value)]));
    return (["en", "ar"] as const).map((lang) => ({
      url: absolute(localizedPath(path, lang)),
      lastModified: modified,
      changeFrequency,
      priority,
      alternates: { languages },
    }));
  });
}
