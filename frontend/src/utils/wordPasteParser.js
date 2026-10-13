/**
 * AST-based DOM sanitization for Microsoft Word & Google Docs paste.
 * Strips Mso junk while preserving paragraph breaks, bold/italic, and
 * first-line indent (converted to five non-breaking spaces for Storygroove).
 */

const MANUSCRIPT_TAB_SPACES = 5;
const MANUSCRIPT_INDENT = '\u00A0'.repeat(MANUSCRIPT_TAB_SPACES);

const cssLengthToInches = (raw = '') => {
  const value = String(raw || '').trim().toLowerCase();
  if (!value || value === '0' || value === 'normal' || value === 'none') return 0;
  const num = parseFloat(value.replace(',', '.'));
  if (!Number.isFinite(num)) return 0;
  if (value.endsWith('in')) return num;
  if (value.endsWith('pt')) return num / 72;
  if (value.endsWith('px')) return num / 96;
  if (value.endsWith('cm')) return num / 2.54;
  if (value.endsWith('mm')) return num / 25.4;
  if (value.endsWith('em') || value.endsWith('rem')) return (num * 12) / 72;
  return 0;
};

const spacesFromIndentInches = (inches) => {
  if (!inches || inches <= 0.05) return 0;
  // Word default first-line indent ≈ 0.5in → 5 spaces
  return Math.max(1, Math.round((inches / 0.5) * MANUSCRIPT_TAB_SPACES));
};

const leadingIndentFromStyle = (styleText = '') => {
  const textIndentMatch = styleText.match(/text-indent\s*:\s*([^;]+)/i);
  const msoFirstMatch = styleText.match(/mso-first-line-indent\s*:\s*([^;]+)/i);
  const inches =
    cssLengthToInches(textIndentMatch?.[1] || '') ||
    cssLengthToInches(msoFirstMatch?.[1] || '');
  return spacesFromIndentInches(inches);
};

export const cleanWordPasteHtml = (html) => {
  if (!html || typeof html !== 'string') return '';

  let clean = html;

  clean = clean.replace(/<!--[\s\S]*?-->/gi, '');
  clean = clean.replace(/<\/?\?xml[^>]*>/gi, '');
  clean = clean.replace(/<\/?o:[^>]*>/gi, '');
  clean = clean.replace(/<\/?w:[^>]*>/gi, '');
  clean = clean.replace(/<\/?m:[^>]*>/gi, '');
  clean = clean.replace(/<\/?v:[^>]*>/gi, '');

  const parser = new DOMParser();
  const doc = parser.parseFromString(clean, 'text/html');

  doc.querySelectorAll('style, meta, link, title, script, noscript').forEach((el) => el.remove());

  const allElements = Array.from(doc.body.querySelectorAll('*'));
  allElements.forEach((el) => {
    const className = el.getAttribute('class') || '';
    if (className.toLowerCase().includes('mso')) {
      const cleanedClass = className
        .split(/\s+/)
        .filter((c) => !c.toLowerCase().startsWith('mso') && !/^WordSection/i.test(c))
        .join(' ');
      if (cleanedClass) {
        el.setAttribute('class', cleanedClass);
      } else {
        el.removeAttribute('class');
      }
    }

    const styleAttr = el.getAttribute('style');
    if (styleAttr) {
      const indentSpaces = leadingIndentFromStyle(styleAttr);
      const tag = el.tagName.toLowerCase();

      if (indentSpaces > 0 && (tag === 'p' || tag === 'div')) {
        const indent = '\u00A0'.repeat(indentSpaces);
        const first = el.firstChild;
        if (first && first.nodeType === Node.TEXT_NODE) {
          if (!/^[\u00A0 ]/.test(first.textContent || '')) {
            first.textContent = indent + (first.textContent || '');
          }
        } else if (!el.querySelector('br') || el.textContent.trim()) {
          el.insertBefore(doc.createTextNode(indent), el.firstChild);
        }
      }

      const cleanStyles = styleAttr
        .split(';')
        .map((s) => s.trim())
        .filter((s) => {
          if (!s) return false;
          const lower = s.toLowerCase();
          return (
            !lower.startsWith('mso-') &&
            !lower.startsWith('tab-stops') &&
            !lower.startsWith('page-break') &&
            !lower.startsWith('text-indent') &&
            !lower.startsWith('margin-left') &&
            !lower.startsWith('padding-left')
          );
        })
        .join('; ');

      if (cleanStyles) {
        el.setAttribute('style', cleanStyles);
      } else {
        el.removeAttribute('style');
      }
    }

    // Unwrap empty attribute-less spans
    if (el.tagName.toLowerCase() === 'span' && !el.attributes.length && el.parentNode) {
      const parent = el.parentNode;
      while (el.firstChild) {
        parent.insertBefore(el.firstChild, el);
      }
      parent.removeChild(el);
    }
  });

  doc.body.querySelectorAll('p').forEach((p) => {
    if (!p.innerHTML || p.innerHTML.trim() === '' || p.innerHTML === '&nbsp;') {
      p.innerHTML = '<br>';
    }
  });

  // Normalize accidental multiple leading spaces to manuscript tab when close
  void MANUSCRIPT_INDENT;

  return doc.body.innerHTML;
};
