import { Extension } from '@tiptap/core';
import {
  resolveSpeechRecognitionLang,
  DICTATION_LANG_AUTO,
} from '../constants/dictationLanguages';
import {
  buildNormalizedLiveTranscript,
  capitalizeFirstLetter,
  dictationTextToHtml,
  getDictationSeparator,
  getSpeechRecognitionCtor,
  isSpeechRecognitionSupported,
  needsDictationCapitalization,
  supportsUnspokenPunctuation,
} from '../utils/dictationTranscript';

const emit = (editor, name, payload) => {
  const cb = editor?.storage?.dictation?.callbacks?.[name];
  if (typeof cb === 'function') cb(payload);
};

const stopAudioMeter = (storage) => {
  if (storage.meterRaf) {
    cancelAnimationFrame(storage.meterRaf);
    storage.meterRaf = null;
  }
  if (storage.audioStream) {
    storage.audioStream.getTracks().forEach((t) => t.stop());
    storage.audioStream = null;
  }
  if (storage.audioCtx) {
    try {
      storage.audioCtx.close();
    } catch {
      // ignore
    }
    storage.audioCtx = null;
  }
  storage.analyser = null;
};

const startAudioMeter = async (editor) => {
  const storage = editor.storage.dictation;
  stopAudioMeter(storage);

  if (!navigator?.mediaDevices?.getUserMedia) {
    emit(editor, 'onAudioLevel', 0);
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
      },
      video: false,
    });
    // If user already stopped while permission prompt was open
    if (!storage.listening) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.7;
    source.connect(analyser);

    storage.audioStream = stream;
    storage.audioCtx = ctx;
    storage.analyser = analyser;

    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      if (!storage.listening || !storage.analyser) {
        emit(editor, 'onAudioLevel', 0);
        return;
      }
      storage.analyser.getByteFrequencyData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) sum += data[i];
      const avg = sum / data.length / 255;
      // Boost quieter speech a bit for visible bars
      const level = Math.min(1, avg * 2.4);
      emit(editor, 'onAudioLevel', level);
      storage.meterRaf = requestAnimationFrame(tick);
    };
    storage.meterRaf = requestAnimationFrame(tick);
  } catch {
    emit(editor, 'onAudioLevel', 0);
    emit(editor, 'onError', 'mic-permission');
  }
};

/**
 * TipTap Dictation extension — Web Speech API + mic level meter.
 */
export const Dictation = Extension.create({
  name: 'dictation',

  addOptions() {
    return {
      lang: DICTATION_LANG_AUTO,
      continuous: true,
    };
  },

  addStorage() {
    return {
      recognition: null,
      listening: false,
      langPreference: DICTATION_LANG_AUTO,
      insertFrom: null,
      insertTo: null,
      sessionUsesUnspokenPunctuation: false,
      resolvedLang: 'en-US',
      priorText: '',
      liveTranscript: '',
      callbacks: {},
      audioStream: null,
      audioCtx: null,
      analyser: null,
      meterRaf: null,
      restartTimer: null,
    };
  },

  addCommands() {
    return {
      setDictationLanguage:
        (langPreference) =>
        ({ editor }) => {
          const next = langPreference || DICTATION_LANG_AUTO;
          editor.storage.dictation.langPreference = next;
          emit(editor, 'onLanguageChange', next);
          // Changing language does NOT turn dictation on.
          // If already listening, restart recognition with the new lang.
          if (editor.storage.dictation.listening) {
            editor.commands.stopDictation();
            if (editor.storage.dictation.restartTimer) {
              clearTimeout(editor.storage.dictation.restartTimer);
            }
            editor.storage.dictation.restartTimer = setTimeout(() => {
              editor.commands.startDictation();
            }, 180);
          }
          return true;
        },

      startDictation:
        () =>
        ({ editor }) => {
          const Recognition = getSpeechRecognitionCtor();
          if (!Recognition) {
            emit(editor, 'onUnsupported');
            return false;
          }

          if (editor.storage.dictation.listening) {
            return true;
          }

          if (editor.storage.dictation.recognition) {
            try {
              editor.storage.dictation.recognition.onend = null;
              editor.storage.dictation.recognition.abort();
            } catch {
              // ignore
            }
            editor.storage.dictation.recognition = null;
          }

          const recognition = new Recognition();
          recognition.interimResults = true;
          recognition.continuous = true;
          recognition.maxAlternatives = 1;

          const resolvedLang = resolveSpeechRecognitionLang(
            editor.storage.dictation.langPreference || this.options.lang
          );
          recognition.lang = resolvedLang;
          editor.storage.dictation.resolvedLang = resolvedLang;

          let unspoken = false;
          if (supportsUnspokenPunctuation()) {
            try {
              recognition.unspokenPunctuation = true;
              unspoken = true;
            } catch {
              unspoken = false;
            }
          }
          editor.storage.dictation.sessionUsesUnspokenPunctuation = unspoken;

          editor.commands.focus();
          const { from } = editor.state.selection;
          editor.storage.dictation.insertFrom = from;
          editor.storage.dictation.insertTo = from;
          editor.storage.dictation.priorText = editor.state.doc.textBetween(
            Math.max(0, from - 80),
            from,
            '\n'
          );
          editor.storage.dictation.liveTranscript = '';

          const applyLiveText = (liveText) => {
            const storage = editor.storage.dictation;
            const start = storage.insertFrom;
            if (start == null || !editor.isEditable) return;

            const prior = storage.priorText || '';
            let text = String(liveText || '');
            const end = storage.insertTo != null ? storage.insertTo : start;

            storage.liveTranscript = text;
            emit(editor, 'onTranscript', text);

            if (!text) {
              if (end > start) {
                editor
                  .chain()
                  .focus()
                  .insertContentAt({ from: start, to: end }, '')
                  .setTextSelection(start)
                  .run();
                storage.insertTo = start;
              }
              return;
            }

            const sep = getDictationSeparator(prior);
            if (needsDictationCapitalization(prior)) {
              text = capitalizeFirstLetter(text);
            }
            const payload = sep + text;
            const content = /\n/.test(payload)
              ? dictationTextToHtml(payload)
              : payload;

            const ok = editor
              .chain()
              .focus()
              .insertContentAt({ from: start, to: Math.max(start, end) }, content, {
                updateSelection: true,
              })
              .run();

            if (ok) {
              storage.insertTo = editor.state.selection.to;
            }
          };

          recognition.onstart = () => {
            editor.storage.dictation.listening = true;
            emit(editor, 'onListeningChange', true);
            startAudioMeter(editor);
          };

          recognition.onresult = (event) => {
            const { live } = buildNormalizedLiveTranscript(event.results, {
              lang: resolvedLang,
              useSpokenCommands:
                !editor.storage.dictation.sessionUsesUnspokenPunctuation,
            });
            applyLiveText(live);
          };

          recognition.onerror = (event) => {
            const err = event?.error || 'unknown';
            if (err === 'aborted') return;
            if (err === 'no-speech') {
              // Keep listening; Chrome often fires this between phrases.
              return;
            }
            emit(editor, 'onError', err);
            editor.storage.dictation.listening = false;
            stopAudioMeter(editor.storage.dictation);
            emit(editor, 'onListeningChange', false);
            emit(editor, 'onAudioLevel', 0);
            emit(editor, 'onTranscript', '');
          };

          recognition.onend = () => {
            const storage = editor.storage.dictation;
            if (storage.listening) {
              // Chrome ends continuous sessions — restart while still on.
              try {
                recognition.start();
                return;
              } catch {
                storage.listening = false;
                storage.recognition = null;
                storage.insertFrom = null;
                storage.insertTo = null;
                stopAudioMeter(storage);
                emit(editor, 'onListeningChange', false);
                emit(editor, 'onAudioLevel', 0);
              }
            } else {
              storage.recognition = null;
              storage.insertFrom = null;
              storage.insertTo = null;
              stopAudioMeter(storage);
              emit(editor, 'onListeningChange', false);
              emit(editor, 'onAudioLevel', 0);
            }
          };

          try {
            // Mark listening before start so UI can show "connecting"
            editor.storage.dictation.listening = true;
            editor.storage.dictation.recognition = recognition;
            emit(editor, 'onListeningChange', true);
            emit(editor, 'onTranscript', '');
            recognition.start();
          } catch (err) {
            editor.storage.dictation.listening = false;
            editor.storage.dictation.recognition = null;
            emit(editor, 'onError', err?.message || 'start-failed');
            emit(editor, 'onListeningChange', false);
            return false;
          }

          return true;
        },

      stopDictation:
        () =>
        ({ editor }) => {
          const storage = editor.storage.dictation;
          if (storage.restartTimer) {
            clearTimeout(storage.restartTimer);
            storage.restartTimer = null;
          }
          storage.listening = false;
          const { recognition } = storage;
          if (recognition) {
            try {
              recognition.onend = null;
              recognition.onresult = null;
              recognition.onerror = null;
              recognition.stop();
            } catch {
              try {
                recognition.abort();
              } catch {
                // ignore
              }
            }
            storage.recognition = null;
          }
          storage.insertFrom = null;
          storage.insertTo = null;
          storage.liveTranscript = '';
          stopAudioMeter(storage);
          emit(editor, 'onListeningChange', false);
          emit(editor, 'onAudioLevel', 0);
          emit(editor, 'onTranscript', '');
          return true;
        },

      toggleDictation:
        () =>
        ({ editor }) => {
          if (editor.storage.dictation.listening) {
            return editor.commands.stopDictation();
          }
          return editor.commands.startDictation();
        },
    };
  },

  onDestroy() {
    const storage = this.editor.storage.dictation;
    if (storage.restartTimer) clearTimeout(storage.restartTimer);
    if (storage.recognition) {
      try {
        storage.recognition.abort();
      } catch {
        // ignore
      }
    }
    stopAudioMeter(storage);
  },
});

export { isSpeechRecognitionSupported };

export default Dictation;
