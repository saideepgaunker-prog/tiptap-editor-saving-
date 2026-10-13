/**
 * Public entry points for a future Storygroove migration.
 * The demo app uses App.jsx; consumers can import from here instead.
 */
export { default as TipTapEditor } from './components/Editor/TipTapEditor';
export {
  prepareHtmlForEditor,
  normalizeHtmlForOutput,
  extractPlainText,
  calculateStats,
  areManuscriptHtmlEquivalent,
} from './utils/htmlNormalizer';
export { cleanWordPasteHtml } from './utils/wordPasteParser';
export { PRESETS, FONT_FAMILIES, FONT_SIZES, LINE_HEIGHTS, PARAGRAPH_SPACINGS } from './constants/typography';
