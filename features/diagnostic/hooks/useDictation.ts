"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LANGS, type Lang } from "@/lib/i18n/config";

type RecognitionEvent = { resultIndex: number; results: ArrayLike<{ isFinal: boolean } & ArrayLike<{ transcript: string }>> };
type Recognizer = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type RecognizerClass = new () => Recognizer;

/** The browser's speech recognition (Chrome, Edge and Safari name it differently), or null. */
export function getSpeechRecognition(): RecognizerClass | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition || w.webkitSpeechRecognition || null) as RecognizerClass | null;
}

/** The finished words of a recognition event (interim guesses are left out). */
export function finalTranscript(event: RecognitionEvent): string {
  let chunk = "";
  for (let i = event.resultIndex; i < event.results.length; i++) {
    const result = event.results[i];
    if (result?.isFinal) chunk += result[0]?.transcript ?? "";
  }
  return chunk.trim();
}

type DictationHandlers = { onText: (text: string) => void; onError: (kind: "unsupported" | "failed") => void };

/** Dictation into the composer: words arrive through `onText`; the recognizer stops on unmount. */
export function useDictation(language: Lang, handlers: DictationHandlers) {
  const [dictating, setDictating] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognizer = useRef<Recognizer | null>(null);
  const latest = useRef(handlers);
  useEffect(() => {
    latest.current = handlers;
  });
  useEffect(() => {
    const timer = window.setTimeout(() => setSupported(getSpeechRecognition() !== null), 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => () => recognizer.current?.stop(), []);

  const stop = useCallback(() => {
    recognizer.current?.stop();
    recognizer.current = null;
    setDictating(false);
  }, []);

  const toggle = useCallback(() => {
    if (dictating) return stop();
    const Recognition = getSpeechRecognition();
    if (!Recognition) return latest.current.onError("unsupported");
    try {
      const rec = new Recognition();
      rec.lang = LANGS.find((l) => l.code === language)?.bcp47 ?? "en-US";
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      rec.onresult = (event) => {
        const text = finalTranscript(event);
        if (text) latest.current.onText(text);
      };
      rec.onerror = () => {
        stop();
        latest.current.onError("failed");
      };
      rec.onend = () => {
        recognizer.current = null;
        setDictating(false);
      };
      recognizer.current = rec;
      rec.start();
      setDictating(true);
    } catch {
      latest.current.onError("failed");
    }
  }, [dictating, language, stop]);

  return { dictating, supported, toggle, stop };
}
