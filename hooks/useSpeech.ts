"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LANGS, type Lang } from "@/lib/i18n/config";
import { useAudio } from "@/contexts/AudioContext";

export type SpeechState = "idle" | "loading" | "speaking" | "error" | "unsupported";

let activeSpeaker: symbol | null = null;
let stopListenerAttached = false;

export function stopAllSpeech() {
  activeSpeaker = null;
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
}

function ensureLangStop() {
  if (stopListenerAttached || typeof window === "undefined") return;
  stopListenerAttached = true;
  window.addEventListener("synq-language-change", stopAllSpeech);
}

function pickVoice(voices: SpeechSynthesisVoice[], bcp47: string) {
  const target = bcp47.toLowerCase();
  const prefix = target.split("-")[0];
  return (
    voices.find((v) => v.lang.toLowerCase() === target) ||
    voices.find((v) => v.lang.toLowerCase().startsWith(prefix)) ||
    null
  );
}

function cleanForSpeech(text: string) {
  return text
    .replace(/[*_#`>|]+/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 4500);
}

/**
 * Per-message text-to-speech with explicit states.
 * English uses an English voice (en-US), Arabic uses Modern Standard Arabic
 * (ar-SA). Only one message speaks at a time; switching language stops all.
 */
export function useSpeech(text: string, lang: Lang) {
  const [state, setState] = useState<SpeechState>("idle");
  const { isSoundEnabled, setIsSoundEnabled } = useAudio();
  const idRef = useRef<symbol>(Symbol("speech"));
  const textRef = useRef(text);
  const langRef = useRef(lang);
  const stateRef = useRef<SpeechState>("idle");

  useEffect(() => {
    textRef.current = text;
    langRef.current = lang;
  }, [lang, text]);

  useEffect(() => {
    ensureLangStop();
    const speakerId = idRef.current;
    return () => {
      if (activeSpeaker === speakerId) stopAllSpeech();
    };
  }, []);

  useEffect(() => {
    if (!isSoundEnabled) {
      if (activeSpeaker === idRef.current) stopAllSpeech();
      stateRef.current = "idle";
    }
  }, [isSoundEnabled]);

  const setTrackedState = useCallback((next: SpeechState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const stop = useCallback(() => {
    if (activeSpeaker === idRef.current) stopAllSpeech();
    setTrackedState("idle");
  }, [setTrackedState]);

  const speak = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setTrackedState("unsupported");
      return;
    }
    // Explicit listen is a deliberate gesture: it (re)enables the master
    // voice switch so header toggle and message controls stay consistent.
    if (!isSoundEnabled) setIsSoundEnabled(true);
    const clean = cleanForSpeech(textRef.current);
    if (!clean) {
      setTrackedState("error");
      return;
    }
    const id = idRef.current;
    const bcp47 = LANGS.find((l) => l.code === langRef.current)?.bcp47 ?? "en-US";
    setTrackedState("loading");
    stopAllSpeech();
    activeSpeaker = id;

    const start = () => {
      if (activeSpeaker !== id) return;
      try {
        const utterance = new SpeechSynthesisUtterance(clean);
        utterance.lang = bcp47;
        utterance.rate = langRef.current === "en" ? 0.95 : 0.9;
        utterance.pitch = 1;
        const voices = window.speechSynthesis.getVoices();
        const voice = pickVoice(voices, bcp47);
        if (voice) utterance.voice = voice;
        utterance.onend = () => {
          if (activeSpeaker === id) {
            activeSpeaker = null;
            setTrackedState("idle");
          }
        };
        utterance.onerror = () => {
          if (activeSpeaker === id) {
            activeSpeaker = null;
            setTrackedState("error");
          }
        };
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
        setTrackedState("speaking");
      } catch {
        if (activeSpeaker === id) {
          activeSpeaker = null;
          setTrackedState("error");
        }
      }
    };

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      start();
    } else {
      const timer = setTimeout(() => {
        if (activeSpeaker === id) {
          activeSpeaker = null;
          setTrackedState("error");
        }
      }, 2500);
      window.speechSynthesis.onvoiceschanged = () => {
        clearTimeout(timer);
        window.speechSynthesis.onvoiceschanged = null;
        start();
      };
    }
  }, [isSoundEnabled, setIsSoundEnabled, setTrackedState]);

  const toggle = useCallback(() => {
    if (stateRef.current === "speaking" || stateRef.current === "loading") stop();
    else speak();
  }, [speak, stop]);

  return { state: isSoundEnabled ? state : "idle", speak, stop, toggle };
}
