import { describe, expect, it } from "vitest";
import { invitationTokenFrom } from "@/lib/invitation-link";

const TOKEN = "a".repeat(40) + "_-9";

describe("invitationTokenFrom", () => {
  it("reads the token from a pasted invitation link", () => {
    expect(invitationTokenFrom(`  https://www.synqae.com/invitation?token=${TOKEN}  `)).toBe(TOKEN);
  });
  it("accepts a bare token", () => {
    expect(invitationTokenFrom(TOKEN)).toBe(TOKEN);
  });
  it("rejects anything else", () => {
    expect(invitationTokenFrom("")).toBeNull();
    expect(invitationTokenFrom("hello")).toBeNull();
    expect(invitationTokenFrom("https://www.synqae.com/invitation?token=short")).toBeNull();
    expect(invitationTokenFrom(`https://www.synqae.com/invitation?token=${TOKEN}x`)).toBeNull();
  });
});
