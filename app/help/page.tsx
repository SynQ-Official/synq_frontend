import type { Metadata } from "next";
import Link from "next/link";
import { EmergencyNumbers } from "@/components/help/EmergencyNumbers";
import { MinimalFooter } from "@/components/layout/MinimalFooter";
import { SiteHeader } from "@/components/layout/site-header";
import { ROUTES } from "@/lib/config/routes";
import { pageMetadata } from "@/lib/config/site";
import { LANGS } from "@/lib/i18n/config";
import { helpCopy } from "@/lib/i18n/help";
import { localizedPath } from "@/lib/i18n/routing";
import { requestLanguage } from "@/lib/server/request-language";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await requestLanguage();
  const copy = helpCopy[lang];
  return pageMetadata({ title: copy.seoTitle, description: copy.seoDescription, path: ROUTES.help, lang });
}

/** The "Need help now" button's target: the same numbers, server-rendered, so they reach people without JavaScript. */
export default async function HelpPage() {
  const lang = await requestLanguage();
  const copy = helpCopy[lang];
  const dir = LANGS.find((item) => item.code === lang)!.dir;
  return (
    <div dir={dir} className="flex min-h-dvh flex-col bg-canvas text-ink">
      <SiteHeader variant="public" />
      <main className="page-container flex-1 pb-16 pt-8 sm:pt-12">
        <div className="mx-auto max-w-xl">
          <h1 className="text-[clamp(1.75rem,1.2vw+1.4rem,2.25rem)] leading-tight text-ink">{copy.title}</h1>
          <EmergencyNumbers language={lang} className="mt-6" headingLevel={2} />
          <p className="mt-8">
            <Link href={localizedPath(ROUTES.home, lang)} className="inline-flex min-h-11 items-center rounded-md text-base  text-teal-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500">
              {copy.backHome}
            </Link>
          </p>
        </div>
      </main>
      <MinimalFooter showLanguage={false} className="border-t border-line-strong/60" />
    </div>
  );
}
