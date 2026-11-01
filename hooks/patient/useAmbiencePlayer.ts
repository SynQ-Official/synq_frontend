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
export function useAmbiencePlayer({ sound, volume, label }: { sound: AmbienceSound | undefined; volume: number; label: string }) {
  const [status, setStatus] = useState<PlayerStatus>("idle");
  const [error, setError] = useState<PlayerError | null>(null);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const howl = useRef<Howl | null>(null);
  const playId = useRef<number | undefined>(undefined);
  const deadline = useRef(0);
  const ticker = useRef<number | undefined>(undefined);
  const loaded = useRef(false);
  const volumeRef = useRef(volume);

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
    setStatus("stopping");
    fadeOutAndUnload(current, playId.current, () => setStatus("idle"));
  }, []);

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
      if (loaded.current) fadeOutAndUnload(current, playId.current);
      else current.unload();
    },
    [],
  );

  return { status, error, remainingMs, play, stop };
}
