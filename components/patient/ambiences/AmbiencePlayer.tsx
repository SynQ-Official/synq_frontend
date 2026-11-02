"use client";

import { useEffect, useId, useRef, useState } from "react";
import { HeartHandshake, Pause, Play } from "lucide-react";
import { deviceTimeZone } from "@/components/patient/home/CheckinScheduleCard";
import { GlassCard } from "@/components/patient/ui/primitives";
import { AmbienceFeedbackCard } from "@/components/patient/ambiences/AmbienceFeedbackCard";
import { SupportCard } from "@/components/patient/ui/SupportCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/contexts/LanguageContext";
import { MIRA_STREAM_COPY } from "@/features/diagnostic/lib/stream-copy";
import { useAmbiencePlayer, type EndedSession } from "@/hooks/patient/useAmbiencePlayer";
import { usePatientCopy } from "@/hooks/usePatientCopy";
import { ambiencesApi } from "@/lib/api/patient";
import type { AmbienceAnswer, AmbiencePreferencesInput, AmbienceSound, Ambiences } from "@/lib/api/patient-types";
import { fill } from "@/lib/i18n/patient";
import {
  AMBIENCE_MAX_VOLUME,
  clampVolume,
  defaultTimer,
  formatRemaining,
  MIN_RECORDED_SESSION_SEC,
  restoreVolume,
  timerChoices,
  timerDurationMs,
  type TimerChoice,
} from "@/lib/patient/ambiences";
import { cn } from "@/lib/utils";

const OPTION = "flex min-h-12 items-center gap-3 rounded-2xl border px-4 py-2.5 text-[0.9375rem] text-ink transition-colors";

/**
 * The comfort-sound player. Nothing plays until the patient taps Play; it fades in and out over three seconds, never goes
 * above 70 % and always has an end (a timer). The help button stays on screen the whole time, and the required
 * disclaimer (`copy.disclaimer`) sits right under the controls.
 */
export function AmbiencePlayer({ ambiences, sounds, update }: { ambiences: Ambiences; sounds: AmbienceSound[]; update: (input: AmbiencePreferencesInput) => Promise<unknown> }) {
  const copy = usePatientCopy().ambiences;
  const { language, direction } = useLanguage();
  const { track, preferences, emergencyResources } = ambiences;
  const ids = { sound: useId(), timer: useId(), bedtime: useId(), reminder: useId(), toggle: useId(), help: useId() };

  const [soundId, setSoundId] = useState(preferences.favoriteSoundId ?? sounds[0].id);
  // Whatever comes back from the server goes through the same cap (0 to 70 %) before it is shown or applied.
  const [volume, setVolume] = useState(restoreVolume(preferences.volume));
  const bedtime = preferences.eveningTime && preferences.timezone ? { time: preferences.eveningTime, timeZone: preferences.timezone } : null;
  const choices = timerChoices(track, Boolean(bedtime));
  const [timerPick, setTimerPick] = useState<TimerChoice>(defaultTimer(track, Boolean(bedtime)));
  // The bedtime timer goes with the bedtime.
  const timer = choices.includes(timerPick) ? timerPick : defaultTimer(track, Boolean(bedtime));
  const [bedtimeInput, setBedtimeInput] = useState(preferences.eveningTime ?? "");
  const [helpOpen, setHelpOpen] = useState(false);
  const [everPlayed, setEverPlayed] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const helpRef = useRef<HTMLDivElement>(null);

  // The session whose answer may be asked (5 minutes or more). Recording is best effort: a failure never interrupts listening.
  const [askAbout, setAskAbout] = useState<string | null>(null);
  const recordSession = (session: EndedSession) => {
    if (session.durationSec < MIN_RECORDED_SESSION_SEC) return;
    const input = { id: session.id, soundId: session.soundId, startedAt: session.startedAt.toISOString(), durationSec: session.durationSec };
    // The page is closing: send a request that outlives it (nobody is left to answer a question). Same id, so a repeat is harmless.
    if (session.closing) {
      ambiencesApi.recordSessionOnClose(input);
      return;
    }
    ambiencesApi
      .recordSession(input)
      .then(({ data }) => setAskAbout(data.canAnswer ? data.id : null))
      .catch(() => undefined);
  };

  const sound = sounds.find((s) => s.id === soundId) ?? sounds[0];
  const player = useAmbiencePlayer({ sound, volume, label: sound.label[language], onEnd: recordSession });
  const busy = player.status !== "idle";
  const running = player.status === "playing";

  useEffect(() => {
    if (helpOpen) helpRef.current?.focus();
  }, [helpOpen]);

  const save = (input: AmbiencePreferencesInput) => {
    setSaveFailed(false);
    update(input).catch(() => setSaveFailed(true));
  };

  const toggle = () => {
    if (player.status === "idle") {
      setEverPlayed(true);
      player.play(timerDurationMs(timer, bedtime));
    } else if (player.status !== "stopping") {
      player.stop();
    }
  };

  const status =
    player.status === "loading" ? copy.statusLoading : player.status === "playing" ? copy.statusPlaying : player.status === "stopping" ? copy.statusFading : everPlayed ? copy.statusStopped : "";

  /** Always on screen, sticky, whatever is playing: the way to help is never more than one tap away. */
  const helpBar = (
    <>
      <div className="sticky top-3 z-30 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-sm text-ink-soft">
          {/* Opaque on purpose: this bar sticks over the page while it scrolls, and translucent text over text is unreadable. */}
          <span role="status" aria-live="polite" className={cn("truncate rounded-full bg-white px-3.5 py-2 text-ink shadow-soft", !status && "sr-only")}>
            {status}
          </span>
          {running && player.remainingMs !== null && (
            <span className="truncate rounded-full bg-white px-3 py-2 tabular-nums text-ink shadow-soft">{fill(copy.remaining, { time: formatRemaining(player.remainingMs) })}</span>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="lg"
          aria-expanded={helpOpen}
          aria-controls={helpOpen ? ids.help : undefined}
          onClick={() => setHelpOpen((open) => !open)}
          className="min-h-11 shrink-0 rounded-full border-rose-200 bg-white/90 text-rose-800 hover:bg-rose-50"
        >
          <HeartHandshake aria-hidden />
          {copy.help}
        </Button>
      </div>
      {helpOpen && (
        <div id={ids.help} ref={helpRef} tabIndex={-1} className="outline-none">
          <SupportCard resources={emergencyResources} labels={MIRA_STREAM_COPY[language].support} onHide={() => setHelpOpen(false)} />
        </div>
      )}
    </>
  );

  const switchRow = (
    <div className="flex items-center justify-between gap-4">
      <label htmlFor={ids.toggle} className="text-base font-medium text-ink">{copy.switchLabel}</label>
      <Switch
        id={ids.toggle}
        checked={preferences.enabled}
        onCheckedChange={(checked) => {
          if (!checked) player.stop();
          save({ enabled: checked });
        }}
      />
    </div>
  );

  if (!preferences.enabled) {
    return (
      <div className="space-y-5">
        {helpBar}
        <GlassCard className="space-y-3 p-5 sm:p-6">
          {switchRow}
          <p className="font-medium text-ink">{copy.offTitle}</p>
          <p className="text-sm leading-6 text-ink-soft">{copy.offBody}</p>
          {saveFailed && <p role="alert" className="text-sm text-rose-700">{copy.errors.save}</p>}
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {helpBar}
      <GlassCard className="space-y-6 p-5 sm:p-6">
        {switchRow}

        <div>
          <p id={ids.sound} className="mb-2 text-sm font-medium text-ink-soft">{copy.soundLegend}</p>
          <RadioGroup
            aria-labelledby={ids.sound}
            value={sound.id}
            dir={direction}
            disabled={busy}
            onValueChange={(id) => {
              setSoundId(id);
              save({ favoriteSoundId: id });
            }}
            className="grid gap-2 sm:grid-cols-2"
          >
            {sounds.map((s) => (
              <label key={s.id} className={cn(OPTION, s.id === sound.id ? "border-teal-300 bg-teal-50/70" : "border-white/60 bg-white/60", busy ? "cursor-not-allowed opacity-60" : "cursor-pointer")}>
                <RadioGroupItem value={s.id} />
                <span>{s.label[language]}</span>
              </label>
            ))}
          </RadioGroup>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Button
            type="button"
            size="lg"
            onClick={toggle}
            // Never `disabled`: a disabled button loses the keyboard focus, and the next Enter would go nowhere.
            // While loading, another press cancels; while fading out it is ignored.
            aria-busy={player.status === "loading" || player.status === "stopping"}
            aria-disabled={player.status === "stopping"}
            className="min-h-14 min-w-40 rounded-full px-8 text-base aria-disabled:opacity-60"
          >
            {running ? <Pause aria-hidden /> : <Play aria-hidden />}
            {running ? copy.pause : player.status === "loading" ? copy.loading : player.status === "stopping" ? copy.statusFading : copy.play}
          </Button>
          {player.error && <p role="alert" className="text-sm text-rose-700">{copy.errors[player.error]}</p>}
        </div>

        <div>
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <span className="text-sm font-medium text-ink-soft" aria-hidden>{copy.volume}</span>
            <span className="tabular-nums text-sm text-ink" aria-hidden>{fill(copy.volumeValue, { n: volume })}</span>
          </div>
          <Slider
            aria-label={`${copy.volume} ${fill(copy.volumeValue, { n: volume })}`}
            min={0}
            max={AMBIENCE_MAX_VOLUME}
            step={5}
            value={[volume]}
            dir={direction}
            className="h-10"
            onValueChange={([next]) => setVolume(clampVolume(next))}
            onValueCommit={([next]) => save({ volume: clampVolume(next) })}
          />
          <p className="mt-1 text-xs text-ink-muted">{copy.volumeCeiling}</p>
        </div>

        <div>
          <p id={ids.timer} className="mb-2 text-sm font-medium text-ink-soft">{copy.timerLegend}</p>
          <RadioGroup
            aria-labelledby={ids.timer}
            value={String(timer)}
            dir={direction}
            disabled={busy}
            onValueChange={(value) => setTimerPick(value === "bedtime" ? "bedtime" : (Number(value) as TimerChoice))}
            className="flex flex-wrap gap-2"
          >
            {choices.map((choice) => (
              <label key={choice} className={cn(OPTION, choice === timer ? "border-teal-300 bg-teal-50/70" : "border-white/60 bg-white/60", busy ? "cursor-not-allowed opacity-60" : "cursor-pointer")}>
                <RadioGroupItem value={String(choice)} />
                <span>{choice === "bedtime" ? fill(copy.timerBedtime, { time: bedtime?.time ?? "" }) : fill(copy.timerMinutes, { n: choice })}</span>
              </label>
            ))}
          </RadioGroup>
        </div>

        {track === "BIPOLAR" && (
          <div className="rounded-2xl bg-white/60 p-4">
            <p className="font-medium text-ink">{copy.bedtimeTitle}</p>
            <p className="mt-0.5 text-sm leading-6 text-ink-soft">{copy.bedtimeBody}</p>
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <div>
                <label htmlFor={ids.bedtime} className="mb-1 block text-sm text-ink-soft">{copy.bedtimeLabel}</label>
                <Input id={ids.bedtime} type="time" dir="ltr" value={bedtimeInput} onChange={(event) => setBedtimeInput(event.target.value)} className="w-36" />
              </div>
              <Button
                type="button"
                variant="outline"
                size="lg"
                disabled={!bedtimeInput || bedtimeInput === preferences.eveningTime}
                onClick={() => save({ eveningTime: bedtimeInput, timezone: deviceTimeZone() })}
                className="min-h-11 rounded-full"
              >
                {bedtimeInput && bedtimeInput === preferences.eveningTime ? copy.bedtimeSaved : copy.bedtimeSave}
              </Button>
              {bedtime && (
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  onClick={() => {
                    setBedtimeInput("");
                    save({ eveningTime: null });
                  }}
                  className="min-h-11 rounded-full text-ink-muted"
                >
                  {copy.bedtimeClear}
                </Button>
              )}
            </div>
            <div className="mt-4 flex items-start justify-between gap-4 border-t border-ink/10 pt-3">
              <div className="min-w-0">
                <label htmlFor={ids.reminder} className="text-sm font-medium text-ink">{copy.reminderLabel}</label>
                <p className="text-xs text-ink-muted">{copy.reminderNote}</p>
              </div>
              <Switch id={ids.reminder} checked={preferences.eveningReminder} disabled={!bedtime} onCheckedChange={(checked) => save({ eveningReminder: checked })} />
            </div>
          </div>
        )}

        {saveFailed && <p role="alert" className="text-sm text-rose-700">{copy.errors.save}</p>}

        <div className="border-t border-ink/10 pt-4">
          <p className="text-sm font-medium leading-6 text-ink">{copy.disclaimer}</p>
          <p className="mt-1 text-xs text-ink-muted">{fill(copy.credit, { author: sound.author, licence: sound.licence })}</p>
        </div>
      </GlassCard>

      {askAbout && (
        <AmbienceFeedbackCard
          track={track}
          onAnswer={async (answer: AmbienceAnswer) => {
            await ambiencesApi.answer(askAbout, answer);
          }}
          onClose={() => setAskAbout(null)}
        />
      )}
    </div>
  );
}
