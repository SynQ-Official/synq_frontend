"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type AudioContextType = {
  isSoundEnabled: boolean;
  setIsSoundEnabled: (enabled: boolean) => void;
};

const AudioContext = createContext<AudioContextType | null>(null);
const STORAGE_KEY = "synq-diagnostic-sound";

export function AudioProvider({ children }: { children: ReactNode }) {
  const [isSoundEnabled, setIsSoundEnabledState] = useState(true);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      queueMicrotask(() => setIsSoundEnabledState(stored !== "off"));
    }
  }, []);

  function setIsSoundEnabled(enabled: boolean) {
    setIsSoundEnabledState(enabled);
    window.localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
  }

  return (
    <AudioContext.Provider value={{ isSoundEnabled, setIsSoundEnabled }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error("useAudio must be used within AudioProvider");
  }
  return context;
}
