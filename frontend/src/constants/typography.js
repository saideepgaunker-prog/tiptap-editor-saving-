export const FONT_FAMILIES = [
  { label: 'Times New Roman', value: 'Times New Roman, serif', fallback: 'serif' },
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif', fallback: 'sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif', fallback: 'serif' },
  { label: 'EB Garamond', value: '"EB Garamond", serif', fallback: 'serif' },
  { label: 'Merriweather', value: 'Merriweather, Georgia, serif', fallback: 'serif' },
  { label: 'Lora', value: 'Lora, Georgia, serif', fallback: 'serif' },
  { label: 'Inter', value: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', fallback: 'sans-serif' },
  { label: 'JetBrains Mono', value: '"JetBrains Mono", Courier New, monospace', fallback: 'monospace' },
  { label: 'Courier New', value: '"Courier New", Courier, monospace', fallback: 'monospace' },
];

export const FONT_SIZES = [
  { label: '9 pt', value: '9pt' },
  { label: '10 pt', value: '10pt' },
  { label: '11 pt', value: '11pt' },
  { label: '12 pt (Standard)', value: '12pt' },
  { label: '14 pt', value: '14pt' },
  { label: '16 pt', value: '16pt' },
  { label: '18 pt (Heading 3)', value: '18pt' },
  { label: '20 pt', value: '20pt' },
  { label: '24 pt (Heading 2)', value: '24pt' },
  { label: '30 pt (Heading 1)', value: '30pt' },
  { label: '36 pt', value: '36pt' },
];

export const LINE_HEIGHTS = [
  { label: 'Single (1.0)', value: '1' },
  { label: '1.15', value: '1.15' },
  { label: '1.5', value: '1.5' },
  { label: 'Double (2.0 Standard)', value: '2' },
  { label: '2.5', value: '2.5' },
  { label: 'Triple (3.0)', value: '3' },
];

export const PARAGRAPH_SPACINGS = [
  { label: 'None (0 pt)', value: '0pt' },
  { label: '6 pt', value: '6pt' },
  { label: '12 pt (Standard)', value: '12pt' },
  { label: '18 pt', value: '18pt' },
  { label: '24 pt', value: '24pt' },
];

export const PRESETS = [
  {
    id: 'manuscript-standard',
    name: 'Industry Standard Manuscript',
    description: 'Times New Roman 12pt, Double spaced, first-line indent, 0pt after',
    fontFamily: 'Times New Roman, serif',
    fontSize: '12pt',
    lineHeight: '2',
    paragraphSpacing: '0pt',
    align: 'left',
  },
  {
    id: 'modern-novel',
    name: 'Modern Published Book',
    description: 'Georgia 11pt, 1.5 spacing, 6pt after, justified',
    fontFamily: 'Georgia, serif',
    fontSize: '11pt',
    lineHeight: '1.5',
    paragraphSpacing: '6pt',
    align: 'justify',
  },
  {
    id: 'academic-essay',
    name: 'Academic Paper / Essay',
    description: 'EB Garamond 12pt, Double spaced, 0pt after, left aligned',
    fontFamily: '"EB Garamond", serif',
    fontSize: '12pt',
    lineHeight: '2',
    paragraphSpacing: '0pt',
    align: 'left',
  },
  {
    id: 'screenplay-format',
    name: 'Screenplay / Monospace',
    description: 'Courier New 12pt, 1.15 line spacing, 12pt after',
    fontFamily: '"Courier New", Courier, monospace',
    fontSize: '12pt',
    lineHeight: '1.15',
    paragraphSpacing: '12pt',
    align: 'left',
  },
  {
    id: 'clean-sans',
    name: 'Clean Digital Prose',
    description: 'Inter 12pt, 1.6 line spacing, 12pt after',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    fontSize: '12pt',
    lineHeight: '1.6',
    paragraphSpacing: '12pt',
    align: 'left',
  },
];

export const TEXT_COLORS = [
  { name: 'Default Dark', value: '#1e293b' },
  { name: 'Muted Gray', value: '#64748b' },
  { name: 'Classic Black', value: '#000000' },
  { name: 'Crimson Red', value: '#dc2626' },
  { name: 'Burnt Orange', value: '#ea580c' },
  { name: 'Forest Green', value: '#16a34a' },
  { name: 'Navy Blue', value: '#2563eb' },
  { name: 'Royal Purple', value: '#7c3aed' },
  { name: 'Wine Plum', value: '#9333ea' },
  { name: 'Dark Teal', value: '#0d9488' },
];

export const HIGHLIGHT_COLORS = [
  { name: 'No Highlight', value: '' },
  { name: 'Solar Yellow', value: '#fef08a' },
  { name: 'Mint Green', value: '#bbf7d0' },
  { name: 'Sky Blue', value: '#bae6fd' },
  { name: 'Blush Pink', value: '#fbcfe8' },
  { name: 'Lavender Purple', value: '#e9d5ff' },
  { name: 'Peach Orange', value: '#fed7aa' },
  { name: 'Soft Coral', value: '#fecdd3' },
];
