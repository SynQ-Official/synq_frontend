// Public surface of the Mira orientation feature (browser → Nest /api/v1/mira/*, see lib/mira-api.ts).
export { DiagnosticPageClient } from "./components/DiagnosticPageClient";
export { DiagnosticHeader } from "./components/DiagnosticHeader";
export { MiraChatExperience } from "./components/MiraChatExperience";
export { MiraMessage } from "./components/MiraMessage";
export { MiraResult } from "./components/MiraResult";
export { OrientationPage } from "./components/OrientationPage";
export { OrientationResultPage } from "./components/OrientationResultPage";
export { OrientationSkeleton } from "./components/OrientationSkeleton";
export { ResultNextSteps, ResultStickyCta } from "./components/ResultNextSteps";
export { TypingIndicator } from "./components/TypingIndicator";
export { useMiraChat } from "./hooks/useMiraChat";
export { createChatId } from "./lib/chat";
export { miraApi } from "./lib/mira-api";
export { readVisitorName, useVisitorName } from "./lib/visitor";
export type {
  MiraAssessmentResult,
  MiraAttemptState,
  MiraChapter,
  MiraMessage as MiraMessageData,
  MiraSafety,
} from "./types";
