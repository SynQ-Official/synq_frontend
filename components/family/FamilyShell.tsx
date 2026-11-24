"use client";

import { LocaleLink as Link } from "@/components/shared/LocaleLink";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { House, LogOut, Settings } from "lucide-react";
import { motion, MotionConfig } from "framer-motion";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { EmailVerificationBanner } from "@/components/auth/EmailVerificationBanner";
import { HelpNow } from "@/components/help/HelpNow";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { LogoLoader, LogoSpinner } from "@/components/shared/LogoLoader";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { familyApi } from "@/lib/family/api";
import { familyCopy, type FamilyCopy } from "@/lib/family/copy";
import { SPRING_SOFT } from "@/lib/motion";
import { signInHref } from "@/lib/config/auth-role";
import { errorKind } from "@/lib/family/logic";
import { ensureFamilySession, familySession, familySignOut } from "@/lib/family/session";
import { cn } from "@/lib/utils";

export function useFamilyCopy(): { t: FamilyCopy; lang: "en" | "ar"; dir: "ltr" | "rtl" } {
  const { language, direction } = useLanguage();
  const lang = language === "ar" ? "ar" : "en";
  return { t: familyCopy[lang], lang, dir: direction === "rtl" ? "rtl" : "ltr" };
}

/** Load once (and again on `reload`), with the error kept. Small on purpose: every screen reads fresh server state. */
export function useLoad<T>(load: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<{ data?: T; error?: unknown; loading: boolean }>({ loading: true });
  const [tick, setTick] = useState(0);
  // `deps` (e.g. the child id) decides when to load again; `load` is a fresh closure every render on purpose.
  const key = JSON.stringify(deps);
  useEffect(() => {
    let live = true;
    load().then((data) => { if (live) setState({ data, loading: false }); }, (error: unknown) => { if (live) setState({ error, loading: false }); });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, tick]);
  return { ...state, reload: () => setTick((n) => n + 1), setData: (data: T) => setState({ data, loading: false }) };
}

/** One card surface for the whole portal: the patient app's matte glass, with tinted variants for states. */
export const CARD_LIFT = "shadow-[0_1px_2px_rgb(36_107_112/0.05),0_10px_24px_-12px_rgb(36_107_112/0.12),0_36px_72px_-40px_rgb(36_107_112/0.3)]";

export function Card({ children, className, tone = "plain" }: { children: ReactNode; className?: string; tone?: "plain" | "warn" | "danger" | "calm" }) {
  const tones = {
    plain: "lm-glass",
    warn: cn("border border-gold-100 bg-gold-50/90 backdrop-blur-xl", CARD_LIFT),
    danger: cn("border border-rose-100 bg-rose-50/90 backdrop-blur-xl", CARD_LIFT),
    calm: cn("border border-white/70 bg-gradient-to-br from-teal-50/95 via-white/80 to-sage-50/90 backdrop-blur-xl", CARD_LIFT),
  };
  return <section className={cn("rounded-[var(--radius-card)] p-5 sm:p-6", tones[tone], className)}>{children}</section>;
}

export function Notice({ kind, children }: { kind: "ok" | "error" | "info"; children: ReactNode }) {
  const cls = { ok: "text-sage-700", error: "text-rose-700", info: "text-ink-muted" }[kind];
  return <p role={kind === "error" ? "alert" : "status"} className={cn("text-sm", cls)}>{children}</p>;
}

export function PrimaryButton({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} className={cn("inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-teal-700 px-5 text-sm  text-white shadow-brand transition hover:bg-teal-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500", className)}>
      {children}
    </button>
  );
}

export function SecondaryButton({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} className={cn("inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-line-strong bg-white/80 px-5 text-sm  text-ink transition hover:border-teal-200 hover:bg-white active:scale-[0.98] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500", className)}>
      {children}
    </button>
  );
}

/** A page's title block, the same scale as the patient screens. */
export function PageHeading({ title, lead, children }: { title: ReactNode; lead?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-title  tracking-[-0.02em] text-balance">{title}</h1>
        {lead && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-muted">{lead}</p>}
      </div>
      {children}
    </div>
  );
}

export const inputClass = "mt-1 block w-full rounded-xl border border-line-strong bg-white px-3 py-2.5 text-base text-ink focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100";

/** A refusal or failure in the parent's words (never the raw API text). */
export function LoadError({ error, retry }: { error: unknown; retry?: () => void }) {
  const { t } = useFamilyCopy();
  const kind = errorKind(error);
  const text = kind === "not-active" ? t.notActive : kind === "denied" ? t.denied : t.error;
  return (
    <Card tone="warn">
      <Notice kind="info">{text}</Notice>
      {retry && kind !== "not-active" && kind !== "denied" && <SecondaryButton className="mt-3" onClick={retry}>{t.retry}</SecondaryButton>}
    </Card>
  );
}

/** Rail link with the patient app's gliding pill. */
function RailLink({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className="lm-nav-link isolate">
      {active && <motion.span aria-hidden layoutId="family-rail-pill" transition={SPRING_SOFT} className="lm-rail-pill" />}
      {children}
    </Link>
  );
}

const initialOf = (name: string | null | undefined) => (name?.trim()[0] ?? "·").toUpperCase();

/**
 * Chrome of the parent portal, with its gate: no parent session, no page. The patient app's session is never read here,
 * and this portal never opens inside the patient shell. Same frame as the patient dashboard (rail, canvas, glass cards).
 */
export function FamilyShell({ children, guarded = true }: { children: ReactNode; guarded?: boolean }) {
  const { t, dir } = useFamilyCopy();
  const router = useRouter();
  const pathname = usePathname();
  const signedIn = useSyncExternalStore(familySession.subscribe, familySession.state, () => null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (guarded) void ensureFamilySession();
  }, [guarded]);
  useEffect(() => {
    if (guarded && signedIn === false) router.replace(signInHref("parent", pathname));
  }, [guarded, signedIn, router, pathname]);
  // Popovers render outside this frame, so the surface is also set on <html> for them (as the patient shell does).
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.surface = "clean";
    return () => { delete root.dataset.surface; };
  }, []);

  // Ends the PARENT session only (its own cookie and token): a patient session in the same browser is untouched.
  const signOut = async () => {
    setSigningOut(true);
    await familySignOut().catch(() => undefined);
    router.replace(signInHref("parent"));
  };

  if (!guarded) {
    return (
      <div dir={dir} data-surface="clean" className="lm-canvas min-h-dvh text-ink">
        <header className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 pt-5 sm:px-6">
          <BrandLogo size="sm" href="/" />
          <div className="flex items-center gap-1.5">
            <HelpNow label="short" />
            <LanguageSwitcher variant="menu" />
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 pb-8 text-xs leading-relaxed text-ink-muted sm:px-6">{t.disclaimer}</footer>
      </div>
    );
  }

  if (signedIn !== true) {
    return (
      <div dir={dir} data-surface="clean" className="lm-canvas flex min-h-dvh items-center justify-center" aria-busy>
        <LogoLoader label={t.loading} />
      </div>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <div dir={dir} data-surface="clean" className="lm-canvas min-h-dvh text-ink lg:flex">
        <a href="#family-main" className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:shadow-lg">{t.nav.skip}</a>
        <FamilyRail pathname={pathname} signingOut={signingOut} onSignOut={() => void signOut()} />
        <div className="min-w-0 flex-1">
          <FamilyMobileStrip pathname={pathname} signingOut={signingOut} onSignOut={() => void signOut()} />
          <main id="family-main" className="mx-auto w-full max-w-[88rem] px-4 pb-10 pt-5 sm:px-6 lg:px-8 lg:pt-8">
            <FamilyVerificationNotice />
            {children}
          </main>
          <footer className="mx-auto w-full max-w-[88rem] px-4 pb-8 text-xs leading-relaxed text-ink-muted sm:px-6 lg:px-8">{t.disclaimer}</footer>
        </div>
      </div>
    </MotionConfig>
  );
}

/** A soft notice while the parent's e-mail is unconfirmed; the portal stays usable. Reads the same parent profile as the rail. */
function FamilyVerificationNotice() {
  const me = useLoad(() => familyApi.me().then((r) => r.data), []);
  if (me.data?.isEmailVerified !== false) return null;
  return <EmailVerificationBanner audience="parent" />;
}

/** Desktop rail: brand, the parent, every child with an open space, then settings and a separate sign-out. */
function FamilyRail({ pathname, signingOut, onSignOut }: { pathname: string; signingOut: boolean; onSignOut: () => void }) {
  const { t } = useFamilyCopy();
  const me = useLoad(() => familyApi.me().then((r) => r.data), []);
  const kids = useLoad(() => familyApi.children().then((r) => r.data.filter((c) => c.status === "ACTIVE")), []);
  const name = me.data ? `${me.data.firstName} ${me.data.lastName}`.trim() : "";

  return (
    <aside className="lm-rail sticky top-4 m-4 me-0 hidden h-[calc(100dvh-2rem)] w-64 shrink-0 self-start lg:flex lg:flex-col">
      <div className="flex items-center justify-between gap-2 px-5 pb-3 pt-6">
        <span className="inline-flex rounded-2xl bg-white/90 px-3 py-1.5 shadow-sm"><BrandLogo size="sm" href="/family" /></span>
        <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[0.6875rem]  text-teal-800 ring-1 ring-teal-100">{t.nav.family}</span>
      </div>

      <div className="mx-3 flex items-center gap-1 border-b border-line/70 pb-3">
        <Link href="/family/settings" className="flex min-w-0 flex-1 items-center gap-3 rounded-xl p-2 transition-colors hover:bg-teal-50/70">
          <span className="lm-avatar inline-flex size-10 shrink-0 items-center justify-center rounded-full text-sm ">{initialOf(me.data?.firstName)}</span>
          <span className="min-w-0">
            {name ? <span className="block truncate text-sm  leading-tight text-ink" dir="auto">{name}</span> : <Skeleton className="h-3 w-24" />}
            <span className="mt-0.5 block truncate text-xs text-ink-muted">{t.nav.parent}</span>
          </span>
        </Link>
        <LanguageSwitcher variant="menu" />
      </div>

      <div className="px-3 pt-3">
        <HelpNow className="w-full justify-center" />
      </div>

      <nav aria-label={t.nav.label} className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <RailLink href="/family" active={pathname === "/family"}><House className="size-[1.125rem] shrink-0" aria-hidden />{t.nav.home}</RailLink>
        {(kids.data?.length ?? 0) > 0 && (
          <>
            <p className="px-3.5 pb-1 pt-4 text-xs font-medium text-ink-subtle">{t.nav.spaces}</p>
            {kids.data!.map((c) => (
              <RailLink key={c.childId} href={`/family/children/${c.childId}`} active={pathname.startsWith(`/family/children/${c.childId}`)}>
                <span aria-hidden className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-200 to-teal-500 text-xs  text-white">{initialOf(c.firstName)}</span>
                <span className="min-w-0 truncate" dir="auto">{c.firstName}</span>
              </RailLink>
            ))}
          </>
        )}
      </nav>

      <div className="space-y-1 border-t border-line/70 px-3 pb-4 pt-3">
        <RailLink href="/family/settings" active={pathname === "/family/settings"}><Settings className="size-[1.125rem] shrink-0" aria-hidden />{t.nav.settings}</RailLink>
        <div className="pt-2">
          <button type="button" disabled={signingOut} aria-busy={signingOut} onClick={onSignOut} className="lm-signout">
            <span aria-hidden className="lm-signout-icon">{signingOut ? <LogoSpinner size={16} /> : <LogOut className="size-4 rtl:-scale-x-100" />}</span>
            <span className="min-w-0 flex-1 truncate text-start">{t.signOut}</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

/** Small screens have no rail: brand, home, settings, language and sign-out in a slim strip that scrolls away. */
function FamilyMobileStrip({ pathname, signingOut, onSignOut }: { pathname: string; signingOut: boolean; onSignOut: () => void }) {
  const { t } = useFamilyCopy();
  const icon = "inline-flex size-11 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-teal-50 hover:text-teal-800 aria-[current=page]:bg-teal-50 aria-[current=page]:text-teal-800";
  return (
    <div className="lm-topbar flex items-center justify-between gap-3 px-4 pb-3 pt-4 sm:px-6 lg:hidden">
      <BrandLogo size="md" href="/family" />
      <nav aria-label={t.nav.label} className="flex items-center gap-0.5">
        <HelpNow label="short" className="me-1" />
        <Link href="/family" aria-label={t.nav.home} aria-current={pathname === "/family" ? "page" : undefined} className={icon}><House className="size-[1.15rem]" aria-hidden /></Link>
        <Link href="/family/settings" aria-label={t.nav.settings} aria-current={pathname === "/family/settings" ? "page" : undefined} className={icon}><Settings className="size-[1.15rem]" aria-hidden /></Link>
        <LanguageSwitcher variant="menu" />
        <button type="button" onClick={onSignOut} disabled={signingOut} aria-label={t.signOut} className={cn(icon, "hover:bg-rose-50 hover:text-rose-700")}>
          {signingOut ? <LogoSpinner size={16} /> : <LogOut className="size-[1.1rem] rtl:-scale-x-100" aria-hidden />}
        </button>
      </nav>
    </div>
  );
}

