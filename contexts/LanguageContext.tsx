"use client";

import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { LANGUAGE_STORAGE_KEY, LEGACY_LANGUAGE_STORAGE_KEY, copy, getDirection, normalizeLanguage, type Lang } from "@/lib/i18n/config";
import { isLocalizedPath, localizedPath, splitLangPrefix } from "@/lib/i18n/routing";

type LanguageContextValue = {
  language: Lang;
  setLanguage: (language: Lang) => void;
  direction: "ltr" | "rtl";
  dictionary: (typeof copy)[Lang];
};

const STORAGE_KEY = LANGUAGE_STORAGE_KEY;
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

const LanguageContext = createContext<LanguageContextValue | null>(null);

function readStoredLanguage(): string | null {
  try {
    // legacy: the migration (lib/api/tokens.ts) may not have run yet on this page, so the old key still holds the choice
    return window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_LANGUAGE_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeLanguageCookie(language: Lang) {
  document.cookie = `${STORAGE_KEY}=${language}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
  // legacy: expire the pre-rename cookie (remove after 2026-12-22)
  document.cookie = `${LEGACY_LANGUAGE_STORAGE_KEY}=; path=/; max-age=0; samesite=lax`;
}

function subscribeToLanguageChange(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("synq-language-change", callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("synq-language-change", callback);
  };
}

export function LanguageProvider({
  children,
  initialLanguage = "en",
  routeLanguage = null,
}: {
  children: ReactNode;
  initialLanguage?: Lang;
  /** Set on public pages, whose URL fixes the language (/mira English, /ar/mira Arabic). */
  routeLanguage?: Lang | null;
}) {
  // A localized URL wins over an older stored choice, before the first client snapshot is read.
  useState(() => {
    if (routeLanguage && typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_KEY, routeLanguage);
      } catch {
        // Storage blocked: the snapshot falls back to the server's language.
      }
    }
  });

  // The server renders `initialLanguage` (from the cookie); the client keeps localStorage as its source of truth.
  const getSnapshot = useCallback(() => {
    const stored = readStoredLanguage();
    return stored === null ? initialLanguage : normalizeLanguage(stored);
  }, [initialLanguage]);

  const language = useSyncExternalStore(subscribeToLanguageChange, getSnapshot, () => initialLanguage);

  const setLanguage = useCallback((nextLanguage: Lang) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, nextLanguage);
    } catch {
      // Storage blocked: the cookie still carries the choice.
    }
    writeLanguageCookie(nextLanguage);
    // A public page has one URL per language: switching opens its twin, so the address and the content always agree.
    const { lang, path } = splitLangPrefix(window.location.pathname);
    if (isLocalizedPath(path) && lang !== nextLanguage) {
      window.location.assign(localizedPath(path, nextLanguage) + window.location.search + window.location.hash);
      return;
    }
    window.dispatchEvent(new Event("synq-language-change"));
  }, []);

  useEffect(() => {
    if (!routeLanguage) return;
    // A public page's URL is the reader's latest language, also when the page came from the browser cache, not the proxy.
    writeLanguageCookie(routeLanguage);
    // Back/forward restores this page as it was, while another page may have changed the choice since: the URL still
    // decides, so the stored language is brought back in line with the page on screen.
    const restore = (event: PageTransitionEvent) => {
      if (!event.persisted || readStoredLanguage() === routeLanguage) return;
      try {
        window.localStorage.setItem(STORAGE_KEY, routeLanguage);
      } catch {
        // Storage blocked: the page keeps rendering in its URL's language.
      }
      writeLanguageCookie(routeLanguage);
      window.dispatchEvent(new Event("synq-language-change"));
    };
    window.addEventListener("pageshow", restore);
    return () => window.removeEventListener("pageshow", restore);
  }, [routeLanguage]);

  useEffect(() => {
    // Short tag on <html> ("en", "ar"): the product serves the UAE and Tunisia, not only the US.
    document.documentElement.lang = language;
    document.documentElement.dir = getDirection(language);
    // Keep the cookie aligned for visitors whose preference predates the cookie.
    if (language !== initialLanguage) writeLanguageCookie(language);
  }, [language, initialLanguage]);

  const value = {
    language,
    setLanguage,
    direction: getDirection(language),
    dictionary: copy[language],
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }

  return context;
}
