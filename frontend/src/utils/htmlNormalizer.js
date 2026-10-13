/**
 * HTML Normalizer for Tiptap ↔ Storygroove Quill HTML compatibility.
 *
 * Legacy / Storygroove expectations:
 * - Alignment classes: class="ql-align-center|right|justify"
 * - Block styles: line-height, margin-bottom (pt)
 * - Inline styles: font-size (pt), font-family
 * - First-line indent as five non-breaking spaces
 * - Empty paragraphs preserved as <p><br></p>
 */

const INVISIBLE_CHAR_RE = /[\uFEFF\u200B\u00A0]/g;

const isVisuallyEmptyBlockInnerHtml = (innerHtml = '') => {
  const withoutCursor = String(innerHtml)
    .replace(/<span[^>]*class="[^"]*\bql-cursor\b[^"]*"[^>]*>[\s\S]*?<\/span>/gi, '')
    .replace(/<br\s*\/?>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#x0?0?feff;/gi, '')
    .replace(/&#65279;/g, '')
    .replace(INVISIBLE_CHAR_RE, '')
    .replace(/\s+/g, '');

  return withoutCursor.length === 0;
};

const ALIGN_CLASS_TO_STYLE = {
  'ql-align-center': 'center',
  'ql-align-right': 'right',
  'ql-align-justify': 'justify',
  'ql-align-left': 'left',
};

const ALIGN_STYLE_TO_CLASS = {
  center: 'ql-align-center',
  right: 'ql-align-right',
  justify: 'ql-align-justify',
  left: 'ql-align-left',
};

const mergeStyleAttr = (existingStyle, additions) => {
  const map = new Map();
  String(existingStyle || '')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((part) => {
      const idx = part.indexOf(':');
      if (idx === -1) return;
      const prop = part.slice(0, idx).trim().toLowerCase();
      const val = part.slice(idx + 1).trim();
      if (prop) map.set(prop, val);
    });

  Object.entries(additions || {}).forEach(([prop, val]) => {
    if (val == null || val === '') {
      map.delete(prop.toLowerCase());
    } else {
      map.set(prop.toLowerCase(), val);
    }
  });

  return Array.from(map.entries())
    .map(([prop, val]) => `${prop}: ${val}`)
    .join('; ');
};

/**
 * Convert Quill HTML into markup Tiptap can parse reliably.
 */
export const prepareHtmlForEditor = (rawHtml) => {
  if (!rawHtml || typeof rawHtml !== 'string') return '<p><br></p>';

  let html = rawHtml;

  // Preserve blank paragraphs Quill / backend may store as empty tags
  html = html.replace(
    /<(p|div|h[1-6])(\s[^>]*)?>([\s\S]*?)<\/\1>/gi,
    (match, tag, attrs = '', inner) => {
      if (!isVisuallyEmptyBlockInnerHtml(inner)) return match;
      return `<${tag}${attrs || ''}><br></${tag}>`;
    }
  );

  // Inject text-align style from Quill alignment classes (keep classes for round-trip)
  html = html.replace(
    /<(p|div|h[1-6]|li|td|th)(\s[^>]*)?>/gi,
    (full, tag, attrs = '') => {
      const classMatch = attrs.match(/\bclass\s*=\s*"([^"]*)"/i);
      if (!classMatch) return full;

      const classes = classMatch[1].split(/\s+/).filter(Boolean);
      let align = null;
      for (const cls of classes) {
        if (ALIGN_CLASS_TO_STYLE[cls]) {
          align = ALIGN_CLASS_TO_STYLE[cls];
          break;
        }
      }
      if (!align) return full;

      const styleMatch = attrs.match(/\bstyle\s*=\s*"([^"]*)"/i);
      if (styleMatch) {
        const current = styleMatch[1];
        if (/text-align\s*:/i.test(current)) return full;
        const merged = mergeStyleAttr(current, { 'text-align': align });
        return full.replace(styleMatch[0], `style="${merged}"`);
      }

      const spacer = attrs && !attrs.endsWith(' ') ? ' ' : '';
      return `<${tag}${attrs}${spacer}style="text-align: ${align};">`;
    }
  );

  return html;
};

/**
 * Normalize editor HTML for Storygroove / Quill storage.
 */
export const normalizeHtmlForOutput = (rawHtml) => {
  if (!rawHtml || typeof rawHtml !== 'string') return '<p><br></p>';

  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, 'text/html');

  const walk = (node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const el = node;
    const tag = el.tagName.toLowerCase();

    // Convert inline text-align to Quill alignment classes
    const textAlign = (el.style.textAlign || '').toLowerCase();
    Object.values(ALIGN_STYLE_TO_CLASS).forEach((cls) => el.classList.remove(cls));
    if (ALIGN_STYLE_TO_CLASS[textAlign]) {
      el.classList.add(ALIGN_STYLE_TO_CLASS[textAlign]);
    }
    // Keep style text-align as well — Quill/CSS both understand it

    // Empty block nodes → <br> so blank lines survive Quill clipboard
    if (/^(p|div|h[1-6])$/.test(tag) && isVisuallyEmptyBlockInnerHtml(el.innerHTML || '')) {
      el.innerHTML = '<br>';
    }

    if (el.getAttribute('class') === '') {
      el.removeAttribute('class');
    }

    Array.from(el.childNodes).forEach((child) => walk(child));
  };

  walk(doc.body);

  let result = doc.body.innerHTML;
  result = result.replace(/<p><\/p>/gi, '<p><br></p>');
  return result;
};

export const extractPlainText = (html) => {
  if (!html) return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  return doc.body.textContent || '';
};

export const calculateStats = (text) => {
  if (!text) {
    return { words: 0, characters: 0, sentences: 0, readingTimeMinutes: 0 };
  }

  const cleanText = text.trim();
  const words = cleanText ? cleanText.split(/\s+/).filter(Boolean).length : 0;
  const characters = cleanText.length;
  const sentences = cleanText ? (cleanText.match(/[.!?]+(?:\s|$)/g) || []).length : 0;
  const readingTimeMinutes = Math.max(1, Math.ceil(words / 200));

  return {
    words,
    characters,
    sentences: Math.max(sentences, words > 0 ? 1 : 0),
    readingTimeMinutes: words > 0 ? readingTimeMinutes : 0,
  };
};

/** Loose equality for dirty checks (matches Storygroove canonicalize intent). */
export const areManuscriptHtmlEquivalent = (a = '', b = '') =>
  normalizeHtmlForOutput(a) === normalizeHtmlForOutput(b);
