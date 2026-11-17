"use client";

import { Howl } from "howler";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AmbienceSound } from "@/lib/api/patient-types";
import { AMBIENCE_FADE_MS, howlVolume, soundSources } from "@/lib/patient/ambiences";

export type PlayerStatus = "idle" | "loading" | "playing" | "stopping";
export type PlayerError = "config" | "load" | "play";

const MEDIA_BASE = process.env.NEXT_PUBLIC_MEDIA_URL ?? "";
/**
 * Web Audio by default: loops without a gap, but some iPhones stop it when the screen locks. Building with
 * NEXT_PUBLIC_AMBIENCE_HTML5=1 plays through an <audio> element instead (keeps going when locked, may leave a tiny gap).
 */
const HTML5 = process.env.NEXT_PUBLIC_AMBIENCE_HTML5 === "1";

/**
 * What the player reports when a listening session ends: its own id (chosen at the start, so a repeat is harmless), which
 * sound, when it began and the seconds actually played. `closing` is true when the page itself is going away.
 */
export type EndedSession = { id: string; soundId: string; startedAt: Date; durationSec: number; closing: boolean };

/** A fresh id for a session; `randomUUID` needs a secure context, which this app always runs in, with a fallback anyway. */
const newSessionId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => (Number(c) ^ (Math.random() * 16) >> (Number(c) / 4)).toString(16)));

/** Fade out, then free the sound. Independent of React, so it still finishes after the page was left. */
function fadeOutAndUnload(howl: Howl, id: number | undefined, done?: () => void) {
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    howl.stop();
    howl.unload();
    done?.();
  };
  howl.once("fade", finish, id);
  howl.fade((id === undefined ? howl.volume() : howl.volume(id)) as number, 0, AMBIENCE_FADE_MS, id);
  window.setTimeout(finish, AMBIENCE_FADE_MS + 500); // a throttled background tab may never fire the fade event
}

/** Lock-screen and headset controls: they can only stop, which is the one thing a resume could not honour (the timer). */
function announce(title: string, onStop: () => void) {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
  navigator.mediaSession.metadata = new MediaMetadata({ title, artist: "SynQ" });
  navigator.mediaSession.setActionHandler("pause", onStop);
  navigator.mediaSession.setActionHandler("stop", onStop);
}

function clearAnnouncement() {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
  navigator.mediaSession.metadata = null;
  for (const action of ["pause", "stop"] as const) navigator.mediaSession.setActionHandler(action, null);
}

/**
 * Plays one looping sound through Howler. Nothing starts by itself: `play` is only ever called from a tap. The volume is
 * always `howlVolume` (never above the ceiling), playback fades in and out over three seconds, and it ends on its own
 * when the timer (`durationMs`) runs out. Leaving the page fades the sound out too.
 */
export function useAmbiencePlayer({ sound, volume, label, onEnd }: { sound: AmbienceSound | undefined; volume: number; label: string; onEnd?: (session: EndedSession) => void }) {
  const [status, setStatus] = useState<PlayerStatus>("idle");
  const [error, setError] = useState<PlayerError | null>(null);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const howl = useRef<Howl | null>(null);
  const playId = useRef<number | undefined>(undefined);
  const deadline = useRef(0);
  const ticker = useRef<number | undefined>(undefined);
  const loaded = useRef(false);
  const volumeRef = useRef(volume);
  const startedAt = useRef<Date | null>(null);
  const playedSound = useRef("");
  const sessionId = useRef("");
  const onEndRef = useRef(onEnd);

  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);

  /** Reports the session once: only a sound that really started counts, and each start is reported a single time. */
  const endSession = useCallback((closing = false) => {
    const started = startedAt.current;
    startedAt.current = null;
    if (!started) return;
    onEndRef.current?.({ id: sessionId.current, soundId: playedSound.current, startedAt: started, durationSec: Math.round((Date.now() - started.getTime()) / 1000), closing });
  }, []);

  // Closing the tab or leaving the site: no effect cleanup is sure to run, `pagehide` is. The session is reported from
  // here, in a way that survives the page going away; the server ignores it if it was already recorded.
  useEffect(() => {
    const onPageHide = () => endSession(true);
    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, [endSession]);

  const stop = useCallback(() => {
    const current = howl.current;
    if (!current) return;
    howl.current = null;
    window.clearInterval(ticker.current);
    clearAnnouncement();
    setRemainingMs(null);
    if (!loaded.current) {
      current.unload();
      setStatus("idle");
      return;
    }
    endSession();
    setStatus("stopping");
    fadeOutAndUnload(current, playId.current, () => setStatus("idle"));
  }, [endSession]);

  const play = useCallback(
    (durationMs: number) => {
      if (!sound || howl.current) return;
      const src = soundSources(sound.url, MEDIA_BASE);
      if (src.length === 0) {
        setError("config");
        return;
      }
      setError(null);
      setStatus("loading");
      loaded.current = false;

      const fail = (kind: PlayerError) => {
        if (howl.current !== instance) return;
        howl.current = null;
        instance.unload();
        setStatus("idle");
        setError(kind);
      };
      const instance: Howl = new Howl({
        src,
        html5: HTML5,
        loop: true,
        volume: 0,
        onload: () => {
          if (howl.current !== instance) return;
          loaded.current = true;
          startedAt.current = new Date();
          playedSound.current = sound.id;
          sessionId.current = newSessionId();
          const id = instance.play();
          playId.current = id;
          instance.fade(0, howlVolume(volumeRef.current), AMBIENCE_FADE_MS, id);
          deadline.current = Date.now() + durationMs;
          setRemainingMs(durationMs);
          setStatus("playing");
          ticker.current = window.setInterval(() => {
            const left = deadline.current - Date.now();
            if (left <= 0) stop();
            else setRemainingMs(left);
          }, 1000);
          announce(label, stop);
        },
        onloaderror: () => fail("load"),
        onplayerror: () => fail("play"),
      });
      howl.current = instance;
    },
    [sound, label, stop],
  );

  // A volume change lands at once; it also ends a running fade-in, which is fine for a patient who is moving the slider.
  useEffect(() => {
    volumeRef.current = volume;
    const current = howl.current;
    if (!current || !loaded.current || playId.current === undefined) return;
    current.volume(howlVolume(volume), playId.current);
  }, [volume]);

  // Leaving the page fades the sound out instead of cutting it.
  useEffect(
    () => () => {
      window.clearInterval(ticker.current);
      const current = howl.current;
      howl.current = null;
      if (!current) return;
      clearAnnouncement();
      if (loaded.current) {
        endSession();
        fadeOutAndUnload(current, playId.current);
      } else {
        current.unload();
      }
    },
    [endSession],
  );

  return { status, error, remainingMs, play, stop };
}
