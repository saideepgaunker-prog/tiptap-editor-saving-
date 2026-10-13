/**
 * Locale-keyed spoken punctuation for Web Speech dictation (TipTap demo).
 * Languages: en, es, fr, de, fi, it — aligned with Storygroove task scope.
 */

export const SUPPORTED_PUNCTUATION_LANGS = ['en', 'es', 'fr', 'de', 'fi', 'it'];

const WHOLE = 'wholeChunk';
const END = 'endOfChunk';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const rule = (phrase, replacement, tier) => ({ phrase, replacement, tier });

const RULES_BY_LANG = {
  en: [
    rule('new paragraph', '\n\n', WHOLE),
    rule('next paragraph', '\n\n', WHOLE),
    rule('new line', '\n', WHOLE),
    rule('next line', '\n', WHOLE),
    rule('newline', '\n', WHOLE),
    rule('exclamation point', '!', END),
    rule('exclamation mark', '!', END),
    rule('question mark', '?', END),
    rule('full stop', '.', END),
    rule('period', '.', END),
    rule('comma', ',', END),
    rule('em dash', '—', END),
    rule('ellipsis', '…', END),
    rule('dot dot dot', '…', END),
    rule('semicolon', ';', END),
    rule('colon', ':', END),
  ],
  es: [
    rule('nuevo párrafo', '\n\n', WHOLE),
    rule('nuevo parrafo', '\n\n', WHOLE),
    rule('siguiente párrafo', '\n\n', WHOLE),
    rule('siguiente parrafo', '\n\n', WHOLE),
    rule('nueva línea', '\n', WHOLE),
    rule('nueva linea', '\n', WHOLE),
    rule('siguiente línea', '\n', WHOLE),
    rule('siguiente linea', '\n', WHOLE),
    rule('signo de interrogación', '?', END),
    rule('signo de interrogacion', '?', END),
    rule('signo de exclamación', '!', END),
    rule('signo de exclamacion', '!', END),
    rule('interrogación', '?', END),
    rule('interrogacion', '?', END),
    rule('exclamación', '!', END),
    rule('exclamacion', '!', END),
    rule('punto', '.', END),
    rule('coma', ',', END),
    rule('guión largo', '—', END),
    rule('guion largo', '—', END),
    rule('puntos suspensivos', '…', END),
    rule('punto y coma', ';', END),
    rule('dos puntos', ':', END),
  ],
  fr: [
    rule('nouveau paragraphe', '\n\n', WHOLE),
    rule('paragraphe suivant', '\n\n', WHOLE),
    rule('à la ligne', '\n', WHOLE),
    rule('a la ligne', '\n', WHOLE),
    rule('ligne suivante', '\n', WHOLE),
    rule("point d'interrogation", '?', END),
    rule('point d interrogation', '?', END),
    rule("point d'exclamation", '!', END),
    rule('point d exclamation', '!', END),
    rule('point final', '.', END),
    rule('virgule', ',', END),
    rule('tiret cadratin', '—', END),
    rule('tiret long', '—', END),
    rule('points de suspension', '…', END),
    rule('point-virgule', ';', END),
    rule('point virgule', ';', END),
    rule('deux-points', ':', END),
    rule('deux points', ':', END),
  ],
  de: [
    rule('neuer Absatz', '\n\n', WHOLE),
    rule('nächster Absatz', '\n\n', WHOLE),
    rule('neue Zeile', '\n', WHOLE),
    rule('nächste Zeile', '\n', WHOLE),
    rule('Fragezeichen', '?', END),
    rule('Ausrufezeichen', '!', END),
    rule('Punkt', '.', END),
    rule('Komma', ',', END),
    rule('Gedankenstrich', '—', END),
    rule('Auslassungspunkte', '…', END),
    rule('Semikolon', ';', END),
    rule('Strichpunkt', ';', END),
    rule('Doppelpunkt', ':', END),
  ],
  fi: [
    rule('uusi kappale', '\n\n', WHOLE),
    rule('seuraava kappale', '\n\n', WHOLE),
    rule('uusi rivi', '\n', WHOLE),
    rule('seuraava rivi', '\n', WHOLE),
    rule('kysymysmerkki', '?', END),
    rule('huutomerkki', '!', END),
    rule('piste', '.', END),
    rule('pilkku', ',', END),
    rule('ajatusviiva', '—', END),
    rule('kolme pistettä', '…', END),
    rule('puolipiste', ';', END),
    rule('kaksoispiste', ':', END),
  ],
  it: [
    rule('nuovo paragrafo', '\n\n', WHOLE),
    rule('paragrafo successivo', '\n\n', WHOLE),
    rule('nuova riga', '\n', WHOLE),
    rule('riga successiva', '\n', WHOLE),
    rule('a capo', '\n', WHOLE),
    rule('punto interrogativo', '?', END),
    rule('punto esclamativo', '!', END),
    rule('punto fermo', '.', END),
    rule('virgola', ',', END),
    rule('lineetta', '—', END),
    rule('trattino lungo', '—', END),
    rule('puntini di sospensione', '…', END),
    rule('punto e virgola', ';', END),
    rule('due punti', ':', END),
  ],
};

const applyChunkPostProcess = (text, { trim = true } = {}) => {
  let normalized = String(text || '');
  normalized = normalized.replace(/\s+([.,?!;:…—])/g, '$1');
  normalized = normalized.replace(/[ \t]+\n/g, '\n');
  normalized = normalized.replace(/\n[ \t]+/g, '\n');
  normalized = normalized.replace(/[^\S\n]+/g, ' ');
  return trim ? normalized.trim() : normalized;
};

const preserveChunkSuffix = (original, transformed) => {
  const trailing = String(original || '').match(/\s+$/);
  if (!trailing || !transformed) return transformed;
  return `${transformed}${trailing[0]}`;
};

export const resolvePunctuationLang = (bcp47) => {
  const primary = String(bcp47 || '')
    .trim()
    .split('-')[0]
    .toLowerCase();
  return SUPPORTED_PUNCTUATION_LANGS.includes(primary) ? primary : 'en';
};

export const normalizeSpokenCommandsInChunk = (
  chunkText,
  { lang = 'en', trim = true } = {}
) => {
  const chunk = String(chunkText || '');
  if (!chunk) return '';

  const rules = RULES_BY_LANG[resolvePunctuationLang(lang)] || RULES_BY_LANG.en;
  const trimmed = chunk.trim();
  const trimmedLower = trimmed.toLowerCase();

  for (const { phrase, replacement } of rules.filter((r) => r.tier === WHOLE)) {
    if (trimmedLower === phrase.toLowerCase()) {
      return applyChunkPostProcess(replacement, { trim: false });
    }
  }

  const endRules = rules
    .filter((r) => r.tier === END)
    .sort((a, b) => b.phrase.length - a.phrase.length);

  for (const { phrase, replacement } of endRules) {
    const phraseLower = phrase.toLowerCase();
    if (trimmedLower === phraseLower) {
      return applyChunkPostProcess(replacement, { trim });
    }
    const match = trimmed.match(
      new RegExp(`^(.+?)\\s+${escapeRegex(phrase)}\\s*$`, 'i')
    );
    if (match) {
      const transformed = applyChunkPostProcess(match[1] + replacement, {
        trim: false,
      });
      return preserveChunkSuffix(chunk, transformed);
    }
  }

  return applyChunkPostProcess(chunk, { trim });
};
