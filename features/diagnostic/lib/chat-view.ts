import type { MiraSafety } from "../types";
import { questionPosition, type QuestionCount } from "./chapters";
import { hasReadableContent } from "./input";

/** The parts of the conversation state the layout decides from. */
export type ChatViewInput = {
  isSending: boolean;
  isBotTyping: boolean;
  isStarting: boolean;
  safety: MiraSafety;
  progress: number;
  questions: QuestionCount | null;
  options: readonly unknown[];
  completed: boolean;
  result: unknown;
  error: string | null;
  messages: readonly unknown[];
  /** False while no open session can take a message (e.g. a restore that failed): sending would drop the draft. */
  sessionReady?: boolean;
};

/** What the active conversation shows right now, from its state and the visitor's draft (pure, so it is tested). */
export function chatView(chat: ChatViewInput, input: string, showNameIntake: boolean) {
  const busy = chat.isSending || chat.isBotTyping || chat.isStarting;
  const urgent = chat.safety.level === "urgent";
  const position = questionPosition(chat.progress, chat.questions);
  const draft = input.trim();
  const unreadableDraft = draft.length > 0 && !hasReadableContent(input);
  // Mira is asking a choice question (backend input_enabled = false): tapping an option is the only way to answer.
  const choiceOnly = chat.options.length > 0 && !chat.completed && !urgent;
  return {
    busy,
    urgent,
    position,
    unreadableDraft,
    choiceOnly,
    showAlmostThere: !chat.completed && !chat.result && !chat.error && !urgent && chat.progress >= 0.7 && position.remaining > 0,
    canSend: Boolean(draft) && !unreadableDraft && !busy && !chat.completed && !choiceOnly && chat.sessionReady !== false,
    showSuggestions: !chat.completed && !chat.result && !draft && chat.messages.length <= 1 && !showNameIntake && !choiceOnly,
    showOptions: chat.options.length > 0 && !busy && !chat.completed && !urgent,
    multiline: input.includes("\n") || input.length > 90,
  };
}

export type ChatView = ReturnType<typeof chatView>;
