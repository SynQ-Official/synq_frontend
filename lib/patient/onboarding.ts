const WELCOME_SEEN_KEY = "synq_welcome_seen";

/** The immersive welcome is forced once per patient; after that they may leave the first conversation. */
export function hasSeenWelcome(userId: string): boolean {
  try {
    return window.localStorage.getItem(`${WELCOME_SEEN_KEY}:${userId}`) === "1";
  } catch {
    return false;
  }
}

export function markWelcomeSeen(userId: string) {
  try {
    window.localStorage.setItem(`${WELCOME_SEEN_KEY}:${userId}`, "1");
  } catch {
    /* storage unavailable — the welcome may show again, which is harmless */
  }
}
