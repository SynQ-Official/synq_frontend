"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent, type RefObject } from "react";
import { copy, type Lang } from "@/lib/i18n/config";
import { hasReadableContent } from "../lib/input";
import { useDictation } from "./useDictation";

const HINT_MS = 4000;
const ATTACH_MAX_CHARS = 2000;

/** A picked file as composer text: plain text or Markdown only, its first characters. `null` when unusable. */
export function readTextFile(file: File): Promise<string | null> {
  if (!(/\.txt$|\.md$/i.test(file.name) || file.type.startsWith("text/"))) return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? "").slice(0, ATTACH_MAX_CHARS).trim() || null);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

/** Dictated words join the draft with one space, and leave a space for the next ones. */
export const appendDictated = (draft: string, words: string): string => {
  const base = draft.replace(/\s+$/, "");
  return `${base}${base ? " " : ""}${words} `;
};

/** A short-lived line under the composer (unreadable text, dictation, attachments). */
function useHint() {
  const [hint, setHint] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  const show = useCallback((text: string) => {
    setHint(text);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setHint(null), HINT_MS);
  }, []);
  return { hint, show };
}

/** The composer's DOM nodes, owned by the screen (kept out of the composer state, which is read during render). */
export type ComposerRefs = { inputRef: RefObject<HTMLTextAreaElement | null>; fileRef: RefObject<HTMLInputElement | null> };
type ComposerOptions = { language: Lang; canSubmit: boolean; onSend: (text: string) => void; refs: ComposerRefs };

/** The message box: the draft, dictation, a text attachment, and the guard that keeps unreadable text from Mira. */
export function useComposer({ language, canSubmit, onSend, refs }: ComposerOptions) {
  const diagnostic = copy[language].diagnostic;
  const [input, setInput] = useState("");
  const { inputRef } = refs;
  const { hint, show: showHint } = useHint();
  const dictation = useDictation(language, {
    onText: (words) => setInput((prev) => appendDictated(prev, words)),
    onError: (kind) => showHint(kind === "unsupported" ? diagnostic.composerDictationUnsupported : diagnostic.voiceError),
  });
  const { stop: stopDictation } = dictation;

  const clear = useCallback(() => {
    stopDictation();
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
  }, [inputRef, stopDictation]);

  const send = useCallback(() => {
    const text = input.trim();
    if (!text || !canSubmit) return;
    // Only symbols or spaces: nothing Mira could read as an answer. Say so here instead of sending it.
    if (!hasReadableContent(text)) return showHint(diagnostic.unreadableHint);
    clear();
    onSend(text);
  }, [canSubmit, clear, diagnostic.unreadableHint, input, onSend, showHint]);

  const pickFile = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    readTextFile(file).then(
      (text) => {
        if (!text) return showHint(diagnostic.composerAttachHint);
        setInput((prev) => `${prev}${prev.trim() ? "\n\n" : ""}--- ${file.name} ---\n${text}`);
        inputRef.current?.focus();
      },
      () => showHint(diagnostic.voiceError),
    );
  }, [diagnostic.composerAttachHint, diagnostic.voiceError, inputRef, showHint]);

  /** A suggestion chip starts the draft. */
  const suggest = useCallback((chip: string) => {
    setInput(`${chip} `);
    inputRef.current?.focus();
  }, [inputRef]);

  return { input, setInput, hint, dictation, clear, send, pickFile, suggest };
}

export type Composer = ReturnType<typeof useComposer>;
