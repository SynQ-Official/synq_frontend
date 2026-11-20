"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { copy, type Lang } from "@/lib/i18n/config";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { Composer, ComposerRefs } from "../../hooks/useComposer";
import type { MiraChat } from "../../hooks/useMiraChat";
import type { ChatView } from "../../lib/chat-view";
import { LastAttemptNotice } from "../LastAttemptNotice";
import { CompactProgress, SessionRail } from "../SessionProgress";
import { MiraChoiceOptions, MiraSuggestions } from "./MiraAnswerAids";
import { MiraComposer } from "./MiraComposer";
import { MiraComposerNotices } from "./MiraComposerNotices";
import { MiraTranscript } from "./MiraTranscript";

export type ActiveChatProps = ComposerRefs & {
  chat: MiraChat;
  composer: Composer;
  view: ChatView;
  chatId: string;
  language: Lang;
  name: string;
  showNameIntake: boolean;
  onName: (name: string) => void;
  onSkipName: () => void;
};

function UrgentBanner({ show, language }: { show: boolean; language: Lang }) {
  const diagnostic = copy[language].diagnostic;
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          role="alert"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3.5 max-sm:mx-3"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-700" aria-hidden />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-rose-700">{diagnostic.urgentTitle}</p>
            <p className="mt-1 text-[0.8125rem] leading-5 text-rose-700/90">{diagnostic.urgentBody}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Below the transcript: what is said about the last reply, the ways to answer, and the message box. */
function ComposerArea({ chat, composer, inputRef, fileRef, view, language }: Pick<ActiveChatProps, "chat" | "composer" | "inputRef" | "fileRef" | "view" | "language">) {
  const { dictating } = composer.dictation;
  return (
    <div className="relative mx-auto w-full max-w-3xl px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 sm:px-8 sm:pb-5">
      {/* Fades the last lines of the transcript into the composer, so the two read as one surface. */}
      <span aria-hidden className="pointer-events-none absolute inset-x-0 -top-6 h-6 bg-gradient-to-t from-[#fffefb] to-transparent" />
      <MiraComposerNotices
        language={language}
        support={chat.support}
        onHideSupport={chat.dismissSupport}
        failure={chat.failure}
        error={chat.error}
        onRetry={chat.retry}
        // A draft is only resent when a session can take it; otherwise Retry reconnects the session and keeps the draft.
        onErrorRetry={() => (composer.input.trim() && chat.sessionReady ? composer.send() : chat.retry())}
        reconnecting={chat.isStarting && chat.messages.length === 0}
        status={dictating ? copy[language].diagnostic.composerDictationLive : composer.hint}
        almostThere={view.showAlmostThere ? view.position.remaining : null}
      />
      <MiraSuggestions show={view.showSuggestions} language={language} onPick={composer.suggest} />
      {view.showOptions && <MiraChoiceOptions options={chat.options} language={language} onChoose={(answer) => void chat.sendMessage(answer)} />}
      <MiraComposer composer={composer} inputRef={inputRef} fileRef={fileRef} view={view} language={language} completed={chat.completed} canStop={chat.isSending && !chat.isStarting} onStop={chat.stop} />
    </div>
  );
}

/**
 * The guided conversation (mira_interface.jpeg). Desktop: a frosted session rail beside the conversation pane.
 * Mobile/tablet: compact progress above the pane. The transcript is the only scroll area while chatting.
 */
export function MiraActiveChatView({ chat, composer, inputRef, fileRef, view, chatId, language, name, showNameIntake, onName, onSkipName }: ActiveChatProps) {
  const dictionary = copy[language];
  const { completed, chapter, progress, questions } = chat;
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: EASE_OUT }}
      className={cn(
        "relative mx-auto grid min-h-0 w-full flex-1 grid-rows-[minmax(0,1fr)] gap-2 px-0 pb-0 pt-2 sm:gap-4 sm:px-6 sm:pb-4 sm:pt-4 lg:min-h-[34rem] lg:gap-5 lg:px-8 lg:pb-6 lg:pt-5",
        completed ? "max-w-4xl" : "max-w-[96rem] lg:grid-cols-[20rem_minmax(0,1fr)] xl:grid-cols-[23rem_minmax(0,1fr)]",
      )}
    >
      {!completed && <SessionRail chapter={chapter} progress={progress} questions={questions} language={language} name={name} className="hidden lg:flex" />}
      <div className="flex min-h-0 min-w-0 flex-col gap-3">
        {!completed && <CompactProgress chapter={chapter} progress={progress} questions={questions} language={language} className="max-sm:mx-3 lg:hidden" />}
        <UrgentBanner show={view.urgent} language={language} />
        <LastAttemptNotice
          chatId={chatId}
          show={Boolean(chat.attempt?.isLastAttempt) && !completed && !view.urgent}
          title={dictionary.diagnostic.lastAttempt.title}
          body={dictionary.diagnostic.lastAttempt.body}
          closeLabel={dictionary.common.close}
          className="max-sm:mx-3"
        />
        <div className="orientation-glass relative flex min-h-0 flex-1 flex-col overflow-hidden max-sm:rounded-b-none max-sm:border-x-0 max-sm:border-b-0">
          <MiraTranscript chat={chat} language={language} name={name} busy={view.busy} showNameIntake={showNameIntake} onName={onName} onSkipName={onSkipName} />
          <ComposerArea chat={chat} composer={composer} inputRef={inputRef} fileRef={fileRef} view={view} language={language} />
        </div>
      </div>
    </motion.div>
  );
}
