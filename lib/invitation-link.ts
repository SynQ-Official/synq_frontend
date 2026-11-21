/** Same shape app/invitation/page.tsx accepts; the API owns every other rule (single use, expiry, bound address). */
const TOKEN = /^[A-Za-z0-9_-]{43}$/;

/** The token from a pasted invitation link, or a bare token. Nothing is sent anywhere: /invitation checks it with the API. */
export function invitationTokenFrom(input: string): string | null {
  const text = input.trim();
  if (TOKEN.test(text)) return text;
  try {
    const token = new URL(text).searchParams.get("token");
    return token && TOKEN.test(token) ? token : null;
  } catch {
    return null;
  }
}
