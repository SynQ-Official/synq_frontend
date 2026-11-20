import { describe, expect, it } from "vitest";
import { questionPosition } from "./chapters";
import { chatView, type ChatViewInput } from "./chat-view";

const idle: ChatViewInput = {
  isSending: false,
  isBotTyping: false,
  isStarting: false,
  safety: { level: "routine", flags: [] },
  progress: 0,
  questions: { answered: 0, total: 26 },
  options: [],
  completed: false,
  result: null,
  error: null,
  messages: [{}],
  sessionReady: true,
};

describe("questionPosition", () => {
  it("uses the agent's own total, whatever it is", () => {
    expect(questionPosition(0, { answered: 3, total: 16 })).toMatchObject({ known: true, answered: 3, current: 4, total: 16 });
  });

  it("flags an estimate when the agent has not reported a count", () => {
    expect(questionPosition(0.5, null).known).toBe(false);
  });
});

describe("chatView.canSend", () => {
  it("sends a readable draft on an open session", () => {
    expect(chatView(idle, "hello", false).canSend).toBe(true);
  });

  it("keeps the draft when no session can take it", () => {
    expect(chatView({ ...idle, sessionReady: false }, "hello", false).canSend).toBe(false);
  });
});
