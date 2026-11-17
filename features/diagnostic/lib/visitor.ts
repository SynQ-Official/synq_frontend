"use client";

import { useCallback, useSyncExternalStore } from "react";
import { getSessionUser, patientKey, subscribeSession } from "@/lib/api/tokens";

/**
 * The visitor's first name, collected gently at the start of the conversation so Mira's
 * space feels personal. Mira's agent never asks for or stores a name, so this lives purely
 * on the client and is reused only in the UI (chat rail, result page) — never injected into
 * Mira's generated messages, which would require changing her reasoning.
 *
 * Stored under a single key (the same visitor across the flow), so the chat page and the
 * decoupled result route both address the person by name. It lives in sessionStorage: a name typed by an
 * anonymous visitor must not outlast their tab and greet whoever uses this device next.
 */
const NAME_KEY = "vitamind-visitor-name";

export function readVisitorName(): string {
  if (typeof window === "undefined") return "";
  // A signed-in patient already told us who they are (their signup nickname): it always wins
  // over a name left in this browser by an earlier visitor or account.
  const nickname = sanitizeName(getSessionUser()?.nickname ?? "");
  if (nickname) return nickname;
  try {
    // Scoped to the signed-in user: a name typed under one account is never read under another.
    const key = patientKey(NAME_KEY);
    return key ? (window.sessionStorage.getItem(key) ?? "") : "";
  } catch {
    return "";
  }
}

export function sanitizeName(raw: string): string {
  // A first name only: collapse whitespace, strip control chars, cap length.
  return raw.replace(/\s+/g, " ").trim().replace(/[\u0000-\u001f]/g, "").slice(0, 40);
}

const CHANGE_EVENT = "vitamind-visitor-name-change";

function subscribe(onChange: () => void) {
  const onStorage = (event: StorageEvent) => event.key?.startsWith(NAME_KEY) && onChange();
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, onChange);
  // The signed-in user changing (sign-out, another account) re-reads the name at once.
  const unsubscribeSession = subscribeSession(onChange);
  return () => {
    unsubscribeSession();
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

/** Visitor first name with localStorage persistence, same-tab and cross-tab sync ("" during SSR). */
export function useVisitorName() {
  const name = useSyncExternalStore(subscribe, readVisitorName, () => "");

  const setName = useCallback((raw: string) => {
    const clean = sanitizeName(raw);
    try {
      const key = patientKey(NAME_KEY); // nobody signed in: nothing personal is stored
      if (key) {
        if (clean) window.sessionStorage.setItem(key, clean);
        else window.sessionStorage.removeItem(key);
      }
    } catch {
      /* storage unavailable — the name simply won't persist */
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return { name, setName };
}
