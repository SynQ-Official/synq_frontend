import { sleep } from "@/lib/async";

/** How long Mira "reads" a message before she starts reflecting on it. */
export const READING_MS = 650;

/**
 * Human-paced reply: a short "typing" beat scaled to the reply's length. When the
 * service was already slow, the visitor has waited enough — only a brief beat remains.
 */
export function typingDelay(text: string, waitedMs: number): number {
  const natural = Math.min(2600, Math.max(900, 450 + text.length * 11));
  return waitedMs > 2500 ? Math.min(natural, 600) : Math.max(350, natural - waitedMs * 0.5);
}

/** A reply that arrived whole: finish the reading beat, switch to "typing", then a beat proportional to its length. */
export async function paceWholeReply(text: string, sentAt: number, onTyping: () => void, now: () => number = () => performance.now()): Promise<void> {
  const waited = now() - sentAt;
  if (waited < READING_MS) await sleep(READING_MS - waited);
  onTyping();
  await sleep(typingDelay(text, now() - sentAt));
}
