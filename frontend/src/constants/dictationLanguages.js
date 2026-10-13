/**
 * Dictation locales for the TipTap demo.
 * Covers Storygroove task languages: EN, ES, FR, DE, FI, IT (+ Auto).
 */

export const DICTATION_LANG_AUTO = 'auto';

export const DICTATION_LANGUAGE_GROUPS = [
  {
    groupLabel: 'English',
    languages: [
      { code: 'en-US', label: 'English (US)' },
      { code: 'en-GB', label: 'English (UK)' },
      { code: 'en-AU', label: 'English (Australia)' },
      { code: 'en-CA', label: 'English (Canada)' },
      { code: 'en-IN', label: 'English (India)' },
    ],
  },
  {
    groupLabel: 'Spanish',
    languages: [
      { code: 'es-ES', label: 'Spanish (Spain)' },
      { code: 'es-MX', label: 'Spanish (Mexico)' },
      { code: 'es-US', label: 'Spanish (US)' },
      { code: 'es-AR', label: 'Spanish (Argentina)' },
    ],
  },
  {
    groupLabel: 'French',
    languages: [
      { code: 'fr-FR', label: 'French (France)' },
      { code: 'fr-CA', label: 'French (Canada)' },
      { code: 'fr-BE', label: 'French (Belgium)' },
    ],
  },
  {
    groupLabel: 'German',
    languages: [
      { code: 'de-DE', label: 'German (Germany)' },
      { code: 'de-AT', label: 'German (Austria)' },
      { code: 'de-CH', label: 'German (Switzerland)' },
    ],
  },
  {
    groupLabel: 'Finnish',
    languages: [{ code: 'fi-FI', label: 'Finnish' }],
  },
  {
    groupLabel: 'Italian',
    languages: [
      { code: 'it-IT', label: 'Italian (Italy)' },
      { code: 'it-CH', label: 'Italian (Switzerland)' },
    ],
  },
];

export const FLAT_DICTATION_LANGUAGES = DICTATION_LANGUAGE_GROUPS.flatMap(
  (g) => g.languages
);

const KNOWN = new Set(FLAT_DICTATION_LANGUAGES.map((l) => l.code));

const ALIASES = {
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  fi: 'fi-FI',
  it: 'it-IT',
};

export const isKnownDictationLanguage = (code) => KNOWN.has(code);

export const normalizeDictationLanguageCode = (code) => {
  if (!code || code === DICTATION_LANG_AUTO) return DICTATION_LANG_AUTO;
  const raw = String(code).trim();
  if (KNOWN.has(raw)) return raw;
  const primary = raw.split('-')[0].toLowerCase();
  const aliased = ALIASES[primary];
  if (aliased && KNOWN.has(aliased)) return aliased;
  // Match en-XX → first English variant, etc.
  const match = FLAT_DICTATION_LANGUAGES.find(
    (l) => l.code.toLowerCase() === raw.toLowerCase()
      || l.code.split('-')[0].toLowerCase() === primary
  );
  return match ? match.code : DICTATION_LANG_AUTO;
};

export const getDictationLanguageLabel = (code) => {
  if (!code || code === DICTATION_LANG_AUTO) return 'Auto (browser)';
  const found = FLAT_DICTATION_LANGUAGES.find((l) => l.code === code);
  return found?.label || code;
};

export const resolveSpeechRecognitionLang = (preference) => {
  if (preference && preference !== DICTATION_LANG_AUTO) {
    return preference;
  }
  if (typeof navigator === 'undefined') return 'en-US';
  const browser = navigator.language || 'en-US';
  const normalized = normalizeDictationLanguageCode(browser);
  return normalized === DICTATION_LANG_AUTO ? browser : normalized;
};
