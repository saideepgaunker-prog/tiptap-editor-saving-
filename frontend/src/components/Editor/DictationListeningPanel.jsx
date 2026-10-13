import React, { useMemo } from 'react';
import { Mic, Square } from 'lucide-react';
import { getDictationLanguageLabel } from '../../constants/dictationLanguages';

const BAR_COUNT = 16;

/**
 * Footer overlay while dictation is active: mic status + voice level bars + live text.
 */
export const DictationListeningPanel = ({
  listening,
  audioLevel = 0,
  liveTranscript = '',
  languagePreference,
  onStop,
}) => {
  const bars = useMemo(() => {
    // Shape a soft center-weighted waveform from a single level value
    return Array.from({ length: BAR_COUNT }, (_, i) => {
      const mid = (BAR_COUNT - 1) / 2;
      const dist = Math.abs(i - mid) / mid;
      const shape = 1 - dist * 0.55;
      const jitter = 0.35 + ((i * 17) % 10) / 30;
      const h = Math.max(0.12, Math.min(1, audioLevel * shape * jitter + (listening ? 0.08 : 0)));
      return h;
    });
  }, [audioLevel, listening]);

  if (!listening) return null;

  const hasVoice = audioLevel > 0.08;
  const preview =
    liveTranscript.trim() ||
    (hasVoice ? 'Hearing you…' : 'Listening — start speaking');

  return (
    <div
      className="fixed bottom-14 left-1/2 z-40 w-[min(92vw,420px)] -translate-x-1/2 animate-in fade-in slide-in-from-bottom-3 duration-200"
      role="status"
      aria-live="polite"
    >
      <div className="rounded-2xl border border-rose-200/80 dark:border-rose-900/60 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl ring-1 ring-rose-500/10 overflow-hidden">
        <div className="flex items-center gap-3 px-4 pt-3 pb-2">
          <div
            className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              hasVoice
                ? 'bg-rose-500 text-white'
                : 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300'
            }`}
          >
            {hasVoice && (
              <span className="absolute inset-0 rounded-full bg-rose-400/40 animate-ping" />
            )}
            <Mic className="relative h-4 w-4" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wide text-rose-600 dark:text-rose-400">
                Dictation On
              </span>
              <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                {getDictationLanguageLabel(languagePreference)}
              </span>
            </div>
            <p className="mt-0.5 truncate text-sm text-slate-700 dark:text-slate-200">
              {preview}
            </p>
          </div>

          <button
            type="button"
            onClick={onStop}
            className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-slate-800 dark:bg-rose-600 dark:hover:bg-rose-500 transition-colors"
            title="Stop dictation"
          >
            <Square className="h-3 w-3 fill-current" />
            Stop
          </button>
        </div>

        {/* Voice meter — bars grow when sound is detected */}
        <div className="flex h-12 items-end justify-center gap-1 px-4 pb-3">
          {bars.map((h, i) => (
            <span
              key={i}
              className={`w-1.5 rounded-full transition-[height,background-color] duration-75 ${
                hasVoice
                  ? 'bg-gradient-to-t from-rose-500 to-amber-400'
                  : 'bg-slate-200 dark:bg-slate-700'
              }`}
              style={{ height: `${Math.round(h * 100)}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default DictationListeningPanel;
