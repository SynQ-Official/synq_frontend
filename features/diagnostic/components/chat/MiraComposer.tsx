"use client";

import { motion } from "framer-motion";
import { ChartNoAxesColumn, Heart, Info, Lock, Mic, MicOff, Paperclip, SendHorizontal, ShieldCheck, Sparkle, Square, X } from "lucide-react";
import type { ComponentType } from "react";
import { Button } from "@/components/ui/button";
import { copy, type Lang } from "@/lib/i18n/config";
import { fill } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";
import type { Composer, ComposerRefs } from "../../hooks/useComposer";
import type { ChatView } from "../../lib/chat-view";
import { MIRA_STREAM_COPY } from "../../lib/stream-copy";
import { choiceHint } from "./MiraAnswerAids";

type IconType = ComponentType<{ className?: string }>;
const TRUST_ICONS: IconType[] = [Lock, Sparkle, Heart, ChartNoAxesColumn];

type ComposerProps = ComposerRefs & {
  composer: Composer;
  view: ChatView;
  language: Lang;
  completed: boolean;
  /** A reply is being written: the send button becomes Stop. */
  canStop: boolean;
  onStop: () => void;
};

function SendOrStop({ canStop, canSend, onStop, onSend, language }: { canStop: boolean; canSend: boolean; onStop: () => void; onSend: () => void; language: Lang }) {
  if (canStop) {
    const label = MIRA_STREAM_COPY[language].stop;
    return (
      <motion.button
        type="button"
        onClick={onStop}
        whileTap={{ scale: 0.92 }}
        aria-label={label}
        title={label}
        className="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-teal-200 bg-white text-teal-800 transition-colors duration-200 hover:bg-teal-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
      >
        <Square className="h-4 w-4 fill-current" aria-hidden />
      </motion.button>
    );
  }
  const send = copy[language].diagnostic.send;
  return (
    <motion.button
      type="button"
      onClick={onSend}
      disabled={!canSend}
      whileTap={canSend ? { scale: 0.94 } : undefined}
      aria-label={send}
      title={send}
      className={cn(
        "group inline-flex size-11 shrink-0 items-center justify-center rounded-full transition-[background-color,color,box-shadow] duration-200 ease-out-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500",
        canSend
          ? "cursor-pointer bg-teal-800 text-white shadow-[0_8px_20px_-10px_rgb(17_76_97/0.7)] hover:bg-teal-700"
          : "cursor-not-allowed bg-teal-50 text-teal-300",
      )}
    >
      <SendHorizontal className={cn("size-[1.125rem] transition-transform duration-200 ease-out-soft rtl:-scale-x-100", canSend && "group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5")} aria-hidden />
    </motion.button>
  );
}

function DictateButton({ composer, disabled, language }: { composer: Composer; disabled: boolean; language: Lang }) {
  const diagnostic = copy[language].diagnostic;
  const { dictating, supported, toggle } = composer.dictation;
  const label = dictating ? diagnostic.composerDictationLive : diagnostic.composerDictate;
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggle}
      disabled={disabled}
      aria-label={label}
      title={label}
      aria-pressed={dictating}
      className={cn("size-10 rounded-full", dictating ? "bg-rose-50 text-rose-700 hover:bg-rose-50 hover:text-rose-700" : "text-ink-muted hover:bg-sage-50 hover:text-teal-800")}
    >
      {dictating ? <Square className="fill-current" aria-hidden /> : supported ? <Mic aria-hidden /> : <MicOff aria-hidden />}
    </Button>
  );
}

function Draft({ composer, inputRef, view, language, completed }: Pick<ComposerProps, "composer" | "inputRef" | "view" | "language" | "completed">) {
  const diagnostic = copy[language].diagnostic;
  const { input, setInput, send } = composer;
  return (
    <textarea
      id="mira-input"
      ref={inputRef}
      value={input}
      rows={1}
      onChange={(event) => {
        setInput(event.target.value);
        event.target.style.height = "auto";
        event.target.style.height = `${Math.min(event.target.scrollHeight, 140)}px`;
      }}
      onKeyDown={(event) => {
        if (event.key !== "Enter" || event.shiftKey) return;
        event.preventDefault();
        send();
      }}
      placeholder={completed ? diagnostic.completed.inputDisabled : view.choiceOnly ? choiceHint(language) : diagnostic.placeholder}
      disabled={view.busy || completed || view.choiceOnly}
      aria-describedby="mira-session-meta"
      // `!`: the global :focus-visible outline would draw a square inside the pill; the pill's focus-within ring shows focus.
      className="max-h-[min(140px,22dvh)] min-h-10 min-w-0 flex-1 resize-none bg-transparent px-2 py-2 text-base leading-6 text-ink !outline-none placeholder:text-ink-subtle disabled:cursor-not-allowed disabled:opacity-60 rtl:leading-7"
    />
  );
}

/** The pill: attach a text file, write or dictate, clear, then send (or stop the reply being written). */
function ComposerInput({ composer, inputRef, fileRef, view, language, completed, canStop, onStop }: ComposerProps) {
  const dictionary = copy[language];
  const locked = completed || view.choiceOnly;
  return (
    <div
      className={cn(
        "flex items-end gap-1 rounded-[1.5rem] border border-line bg-white p-1.5 shadow-[0_1px_2px_rgb(17_76_97/0.04),0_10px_30px_-24px_rgb(17_76_97/0.35)] transition-[border-color,box-shadow] duration-200 ease-out-soft focus-within:border-teal-300 focus-within:shadow-[0_0_0_4px_rgb(91_144_145/0.12)] sm:p-2",
        completed && "cursor-not-allowed bg-white/60 opacity-70",
        // A choice question is answered by tapping; a disabled text box beside the options only confuses.
        view.choiceOnly && "hidden",
      )}
      aria-disabled={completed || undefined}
    >
      <input ref={fileRef} type="file" accept=".txt,.md,text/plain" aria-hidden tabIndex={-1} className="hidden" onChange={composer.pickFile} />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => fileRef.current?.click()}
        disabled={locked}
        aria-label={dictionary.diagnostic.composerAttach}
        title={dictionary.diagnostic.composerAttach}
        className="hidden size-10 rounded-full text-ink-muted hover:bg-sage-50 hover:text-teal-800 sm:inline-flex"
      >
        <Paperclip aria-hidden />
      </Button>
      <Draft composer={composer} inputRef={inputRef} view={view} language={language} completed={completed} />
      {composer.input.trim() && (
        <Button type="button" variant="ghost" size="icon" onClick={composer.clear} aria-label={dictionary.common.close} className="size-10 rounded-full text-ink-subtle hover:text-ink">
          <X aria-hidden />
        </Button>
      )}
      <DictateButton composer={composer} disabled={locked} language={language} />
      <SendOrStop canStop={canStop} canSend={view.canSend} onStop={onStop} onSend={composer.send} language={language} />
    </div>
  );
}

/** Under the pill: the character count (or why the draft cannot be read), the Enter hint, and the trust row. */
function ComposerFooter({ input, view, language, completed }: { input: string; view: ChatView; language: Lang; completed: boolean }) {
  const diagnostic = copy[language].diagnostic;
  return (
    <>
      <div className={cn("mt-2 flex items-center justify-between gap-3 px-3 text-[0.75rem] text-ink-muted", (completed || view.choiceOnly) && "hidden")}>
        {view.unreadableDraft ? (
          <span role="status" className="inline-flex items-center gap-1.5 font-medium text-gold-700">
            <Info className="size-3.5 shrink-0" aria-hidden />
            {diagnostic.unreadableHint}
          </span>
        ) : (
          <span className={cn("tabular-nums", input.length === 0 && "max-sm:hidden")}>
            {input.length > 0
              ? `${input.length.toLocaleString()} / 10,000`
              : view.position.known
                ? fill(diagnostic.questionsHint, { total: view.position.total })
                : diagnostic.skipHint}
          </span>
        )}
        <span className="hidden sm:inline">{diagnostic.enterHint}</span>
      </div>
      {/* Reassurance row: dropped on short screens, where every line belongs to the conversation. */}
      <ul id="mira-session-meta" className="mt-4 hidden flex-wrap items-center justify-center gap-y-2 text-[0.75rem] text-ink-muted md:flex [@media(max-height:50rem)]:!hidden">
        {diagnostic.footerTrust.map((label, i) => {
          const Icon = TRUST_ICONS[i] ?? ShieldCheck;
          return (
            <li key={label} className="inline-flex items-center gap-1.5 px-4 [&:not(:first-child)]:border-s [&:not(:first-child)]:border-line">
              <Icon className="size-3.5 text-sage-700" />
              {label}
            </li>
          );
        })}
      </ul>
    </>
  );
}

export function MiraComposer(props: ComposerProps) {
  return (
    <>
      <label htmlFor="mira-input" className="sr-only">
        {copy[props.language].diagnostic.inputLabel}
      </label>
      <ComposerInput {...props} />
      <ComposerFooter input={props.composer.input} view={props.view} language={props.language} completed={props.completed} />
    </>
  );
}
