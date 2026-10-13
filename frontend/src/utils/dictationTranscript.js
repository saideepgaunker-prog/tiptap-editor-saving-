import { normalizeSpokenCommandsInChunk } from './spokenPunctuation';

export const buildLiveTranscript = (results) => {
  let committed = '';
  let interim = '';

  if (!results || typeof results.length !== 'number') {
    return { committed, interim, live: '' };
  }

  for (let i = 0; i < results.length; i++) {
    const chunk = results[i]?.[0]?.transcript || '';
    if (results[i].isFinal) committed += chunk;
    else interim += chunk;
  }

  return { committed, interim, live: committed + interim };
};

export const buildNormalizedLiveTranscript = (
  results,
  { lang = 'en', useSpokenCommands = true } = {}
) => {
  if (!useSpokenCommands) return buildLiveTranscript(results);

  let committed = '';
  let interim = '';

  if (!results || typeof results.length !== 'number') {
    return { committed, interim, live: '' };
  }

  for (let i = 0; i < results.length; i++) {
    const chunk = results[i]?.[0]?.transcript || '';
    if (results[i].isFinal) {
      committed += normalizeSpokenCommandsInChunk(chunk, { lang, trim: false });
    } else {
      interim += chunk;
    }
  }

  return { committed, interim, live: committed + interim };
};

export const getSpeechRecognitionCtor = () => {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

export const isSpeechRecognitionSupported = () =>
  Boolean(getSpeechRecognitionCtor());

export const supportsUnspokenPunctuation = () => {
  const Recognition = getSpeechRecognitionCtor();
  if (!Recognition) return false;
  if ('unspokenPunctuation' in Recognition.prototype) return true;
  try {
    return 'unspokenPunctuation' in new Recognition();
  } catch {
    return false;
  }
};

export const needsDictationCapitalization = (priorContext) => {
  const prior = String(priorContext || '');
  if (!prior.trim()) return true;
  return /[.!?]\s*$|\n\s*$/.test(prior);
};

export const capitalizeFirstLetter = (text) =>
  String(text || '').replace(/^(\s*)(\p{L})/u, (_, ws, letter) =>
    ws + letter.toLocaleUpperCase()
  );

export const getDictationSeparator = (priorContext) => {
  const before = String(priorContext || '');
  if (!before.trim().length) return '';
  if (/\s$/.test(before)) return '';
  if (/[([{—–-]$/.test(before)) return '';
  return ' ';
};

/**
 * Convert plain dictation text (may include \n) into TipTap-friendly HTML fragments.
 */
export const dictationTextToHtml = (text) => {
  const raw = String(text || '');
  if (!raw) return '';

  const paragraphs = raw.split(/\n\n+/);
  if (paragraphs.length === 1 && !raw.includes('\n')) {
    return escapeHtml(raw);
  }

  return paragraphs
    .map((p) => {
      const withBreaks = escapeHtml(p).replace(/\n/g, '<br>');
      return `<p>${withBreaks || '<br>'}</p>`;
    })
    .join('');
};

const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
