import { cookies, headers } from "next/headers";
import { LANGUAGE_STORAGE_KEY, normalizeLanguage, type Lang } from "@/lib/i18n/config";
import { LANG_HEADER } from "@/lib/i18n/routing";

/** The language fixed by a localized URL (set by proxy.ts), or null on app routes that follow the cookie. */
export async function routeLanguage(): Promise<Lang | null> {
  const value = (await headers()).get(LANG_HEADER);
  return value ? normalizeLanguage(value) : null;
}

/** Language to render this request in: the URL's on public pages, else the visitor's cookie. */
export async function requestLanguage(): Promise<Lang> {
  return (await routeLanguage()) ?? normalizeLanguage((await cookies()).get(LANGUAGE_STORAGE_KEY)?.value);
}
