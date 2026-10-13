import React from 'react';
import {
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Minus,
  Table as TableIcon,
  Link as LinkIcon,
  Unlink,
  Search,
  MessageSquare,
  ListTree,
  Maximize2,
  Minimize2,
  Moon,
  Sun,
  FileDown,
  History,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import Dropdown from '../UI/Dropdown';
import Tooltip from '../UI/Tooltip';
import ColorPicker from '../UI/ColorPicker';
import DictationControls from './DictationControls';
import {
  FONT_FAMILIES,
  FONT_SIZES,
  LINE_HEIGHTS,
  PARAGRAPH_SPACINGS,
  PRESETS,
  TEXT_COLORS,
  HIGHLIGHT_COLORS,
} from '../../constants/typography';

export const Toolbar = ({
  editor,
  isZenMode,
  toggleZenMode,
  theme,
  toggleTheme,
  showOutline,
  toggleOutline,
  showComments,
  toggleComments,
  openFindReplace,
  openVersionHistory,
  onExportDocx,
  onExportHtml,
  onExportMarkdown,
  currentPreset,
  applyPreset,
  dictationListening = false,
  dictationLang,
  onDictationLangChange,
}) => {
  if (!editor) return null;

  // Formatting states
  const isBold = editor.isActive('bold');
  const isItalic = editor.isActive('italic');
  const isUnderline = editor.isActive('underline');
  const isStrike = editor.isActive('strike');
  const isSubscript = editor.isActive('subscript');
  const isSuperscript = editor.isActive('superscript');
  const isCode = editor.isActive('code');
  const isBlockquote = editor.isActive('blockquote');
  const isBulletList = editor.isActive('bulletList');
  const isOrderedList = editor.isActive('orderedList');
  const isTaskList = editor.isActive('taskList');
  const isTable = editor.isActive('table');
  const isLink = editor.isActive('link');

  // Alignments
  const isAlignLeft = editor.isActive({ textAlign: 'left' });
  const isAlignCenter = editor.isActive({ textAlign: 'center' });
  const isAlignRight = editor.isActive({ textAlign: 'right' });
  const isAlignJustify = editor.isActive({ textAlign: 'justify' });

  // Current values
  const currentFontFamily = editor.getAttributes('textStyle').fontFamily || 'Times New Roman, serif';
  const currentFontSize = editor.getAttributes('textStyle').fontSize || '12pt';
  const currentTextColor = editor.getAttributes('textStyle').color || '';
  const currentHighlight = editor.getAttributes('highlight').color || '';
  const currentLineHeight = editor.getAttributes('paragraph').lineHeight || '2';
  const currentParagraphSpacing = editor.getAttributes('paragraph').marginBottom || '0pt';

  // Heading options
  const headingOptions = [
    { label: 'Normal Body', value: 'paragraph' },
    { label: 'Heading 1', value: 'h1' },
    { label: 'Heading 2', value: 'h2' },
    { label: 'Heading 3', value: 'h3' },
    { label: 'Heading 4', value: 'h4' },
  ];

  const currentHeadingValue = editor.isActive('heading', { level: 1 })
    ? 'h1'
    : editor.isActive('heading', { level: 2 })
    ? 'h2'
    : editor.isActive('heading', { level: 3 })
    ? 'h3'
    : editor.isActive('heading', { level: 4 })
    ? 'h4'
    : 'paragraph';

  const handleHeadingChange = (value) => {
    if (value === 'paragraph') {
      editor.chain().focus().setParagraph().run();
    } else {
      const level = parseInt(value.replace('h', ''), 10);
      editor.chain().focus().toggleHeading({ level }).run();
    }
  };

  const handleLink = () => {
    if (isLink) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter link URL:', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-3.5 py-1.5 flex flex-wrap items-center gap-1.5 shadow-2xs transition-colors">
      {/* Undo / Redo Group */}
      <div className="flex items-center space-x-0.5 bg-slate-50 dark:bg-slate-800/60 p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-750">
        <Tooltip text="Undo" shortcut="Ctrl+Z">
          <button
            type="button"
            disabled={!editor.can().undo()}
            onClick={() => editor.chain().focus().undo().run()}
            className="p-1.5 rounded-md hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent transition-all shadow-none hover:shadow-2xs"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
        <Tooltip text="Redo" shortcut="Ctrl+Y">
          <button
            type="button"
            disabled={!editor.can().redo()}
            onClick={() => editor.chain().focus().redo().run()}
            className="p-1.5 rounded-md hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent transition-all shadow-none hover:shadow-2xs"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
      </div>

      <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />

      {/* Preset selector */}
      <Dropdown
        icon={Sparkles}
        label="Preset"
        value={currentPreset}
        options={PRESETS.map((p) => ({
          label: p.name,
          value: p.id,
          description: p.description,
        }))}
        onChange={applyPreset}
        className="w-36"
      />

      {/* Heading Level Dropdown */}
      <Dropdown
        value={currentHeadingValue}
        options={headingOptions}
        onChange={handleHeadingChange}
        className="w-32"
      />

      {/* Font Family Dropdown */}
      <Dropdown
        value={currentFontFamily}
        options={FONT_FAMILIES}
        onChange={(font) => editor.chain().focus().setFontFamily(font).run()}
        className="w-36"
      />

      {/* Font Size Dropdown */}
      <Dropdown
        value={currentFontSize}
        options={FONT_SIZES}
        onChange={(size) => editor.chain().focus().setFontSize(size).run()}
        className="w-24"
      />

      <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />

      {/* Inline Formatting Group */}
      <div className="flex items-center space-x-0.5 bg-slate-50 dark:bg-slate-800/60 p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-750">
        <Tooltip text="Bold" shortcut="Ctrl+B">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded-md transition-all ${
              isBold
                ? 'bg-white dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold shadow-2xs ring-1 ring-slate-200 dark:ring-indigo-800'
                : 'hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
        <Tooltip text="Italic" shortcut="Ctrl+I">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded-md transition-all ${
              isItalic
                ? 'bg-white dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold shadow-2xs ring-1 ring-slate-200 dark:ring-indigo-800'
                : 'hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
        <Tooltip text="Underline" shortcut="Ctrl+U">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1.5 rounded-md transition-all ${
              isUnderline
                ? 'bg-white dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold shadow-2xs ring-1 ring-slate-200 dark:ring-indigo-800'
                : 'hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            <UnderlineIcon className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
        <Tooltip text="Strikethrough" shortcut="Ctrl+Shift+X">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-1.5 rounded-md transition-all ${
              isStrike
                ? 'bg-white dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold shadow-2xs ring-1 ring-slate-200 dark:ring-indigo-800'
                : 'hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
        <Tooltip text="Subscript">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleSubscript().run()}
            className={`p-1.5 rounded-md transition-all ${
              isSubscript
                ? 'bg-white dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold shadow-2xs ring-1 ring-slate-200 dark:ring-indigo-800'
                : 'hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            <SubscriptIcon className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
        <Tooltip text="Superscript">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleSuperscript().run()}
            className={`p-1.5 rounded-md transition-all ${
              isSuperscript
                ? 'bg-white dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold shadow-2xs ring-1 ring-slate-200 dark:ring-indigo-800'
                : 'hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            <SuperscriptIcon className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
        <Tooltip text="Code">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`p-1.5 rounded-md transition-all ${
              isCode
                ? 'bg-white dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold shadow-2xs ring-1 ring-slate-200 dark:ring-indigo-800'
                : 'hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
      </div>

      {/* Colors */}
      <div className="flex items-center space-x-1">
        <ColorPicker
          type="color"
          currentColor={currentTextColor}
          colors={TEXT_COLORS}
          onChange={(color) => {
            if (color) {
              editor.chain().focus().setColor(color).run();
            } else {
              editor.chain().focus().unsetColor().run();
            }
          }}
        />
        <ColorPicker
          type="highlight"
          currentColor={currentHighlight}
          colors={HIGHLIGHT_COLORS}
          onChange={(color) => {
            if (color) {
              editor.chain().focus().toggleHighlight({ color }).run();
            } else {
              editor.chain().focus().unsetHighlight().run();
            }
          }}
        />
      </div>

      <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />

      {/* Alignments Group */}
      <div className="flex items-center space-x-0.5 bg-slate-50 dark:bg-slate-800/60 p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-750">
        <Tooltip text="Align Left">
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`p-1.5 rounded-md transition-all ${
              isAlignLeft || (!isAlignCenter && !isAlignRight && !isAlignJustify)
                ? 'bg-white dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold shadow-2xs ring-1 ring-slate-200 dark:ring-indigo-800'
                : 'hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
        <Tooltip text="Align Center">
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`p-1.5 rounded-md transition-all ${
              isAlignCenter
                ? 'bg-white dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold shadow-2xs ring-1 ring-slate-200 dark:ring-indigo-800'
                : 'hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
        <Tooltip text="Align Right">
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`p-1.5 rounded-md transition-all ${
              isAlignRight
                ? 'bg-white dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold shadow-2xs ring-1 ring-slate-200 dark:ring-indigo-800'
                : 'hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
        <Tooltip text="Justify">
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            className={`p-1.5 rounded-md transition-all ${
              isAlignJustify
                ? 'bg-white dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold shadow-2xs ring-1 ring-slate-200 dark:ring-indigo-800'
                : 'hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            <AlignJustify className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
      </div>

      {/* Spacing Controls */}
      <div className="flex items-center gap-1">
        <Dropdown
          label="Line"
          value={currentLineHeight}
          options={LINE_HEIGHTS}
          onChange={(val) => editor.chain().focus().setLineHeight(val).run()}
          className="w-24"
        />
        <Dropdown
          label="Space After"
          value={currentParagraphSpacing}
          options={PARAGRAPH_SPACINGS}
          onChange={(val) => editor.chain().focus().setParagraphSpacing(val).run()}
          className="w-28"
        />
      </div>

      <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />

      {/* Lists & Block Elements Group */}
      <div className="flex items-center space-x-0.5 bg-slate-50 dark:bg-slate-800/60 p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-750">
        <Tooltip text="Bullet List">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded-md transition-all ${
              isBulletList
                ? 'bg-white dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold shadow-2xs ring-1 ring-slate-200 dark:ring-indigo-800'
                : 'hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
        <Tooltip text="Numbered List">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 rounded-md transition-all ${
              isOrderedList
                ? 'bg-white dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold shadow-2xs ring-1 ring-slate-200 dark:ring-indigo-800'
                : 'hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
        <Tooltip text="Task Checklist">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            className={`p-1.5 rounded-md transition-all ${
              isTaskList
                ? 'bg-white dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold shadow-2xs ring-1 ring-slate-200 dark:ring-indigo-800'
                : 'hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            <ListChecks className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
        <Tooltip text="Blockquote">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-1.5 rounded-md transition-all ${
              isBlockquote
                ? 'bg-white dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold shadow-2xs ring-1 ring-slate-200 dark:ring-indigo-800'
                : 'hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
        <Tooltip text="Insert Divider">
          <button
            type="button"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="p-1.5 rounded-md hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all shadow-none hover:shadow-2xs"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
        <Tooltip text="Insert Table (3x3)">
          <button
            type="button"
            onClick={() =>
              editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
            }
            className={`p-1.5 rounded-md transition-all ${
              isTable
                ? 'bg-white dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold shadow-2xs ring-1 ring-slate-200 dark:ring-indigo-800'
                : 'hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
        <Tooltip text={isLink ? 'Remove Link' : 'Add Link'}>
          <button
            type="button"
            onClick={handleLink}
            className={`p-1.5 rounded-md transition-all ${
              isLink
                ? 'bg-white dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold shadow-2xs ring-1 ring-slate-200 dark:ring-indigo-800'
                : 'hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            {isLink ? <Unlink className="w-3.5 h-3.5" /> : <LinkIcon className="w-3.5 h-3.5" />}
          </button>
        </Tooltip>
      </div>

      {/* Right-aligned Utility Actions */}
      <div className="ml-auto flex items-center space-x-1">
        <Tooltip text="Find & Replace" shortcut="Ctrl+F">
          <button
            type="button"
            onClick={openFindReplace}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        </Tooltip>

        <DictationControls
          editor={editor}
          listening={dictationListening}
          languagePreference={dictationLang}
          onLanguageChange={onDictationLangChange}
        />

        <Tooltip text="Document Outline">
          <button
            type="button"
            onClick={toggleOutline}
            className={`p-1.5 rounded-lg transition-all border ${
              showOutline
                ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-950/70 dark:border-indigo-800 dark:text-indigo-400'
                : 'border-transparent hover:border-slate-200 hover:bg-slate-100 text-slate-600 dark:hover:bg-slate-800 dark:text-slate-300'
            }`}
          >
            <ListTree className="w-3.5 h-3.5" />
          </button>
        </Tooltip>

        <Tooltip text="Comments & Review">
          <button
            type="button"
            onClick={toggleComments}
            className={`p-1.5 rounded-lg transition-all border ${
              showComments
                ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-950/70 dark:border-indigo-800 dark:text-indigo-400'
                : 'border-transparent hover:border-slate-200 hover:bg-slate-100 text-slate-600 dark:hover:bg-slate-800 dark:text-slate-300'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </button>
        </Tooltip>

        <Tooltip text="Snapshots & History">
          <button
            type="button"
            onClick={openVersionHistory}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          >
            <History className="w-3.5 h-3.5" />
          </button>
        </Tooltip>

        {/* Export Dropdown */}
        <Dropdown
          icon={FileDown}
          label="Export"
          options={[
            { label: 'Word Document (.docx)', value: 'docx' },
            { label: 'Clean HTML (.html)', value: 'html' },
            { label: 'Markdown (.md)', value: 'md' },
            { label: 'Print / PDF View', value: 'print' },
          ]}
          onChange={(format) => {
            if (format === 'docx') onExportDocx();
            if (format === 'html') onExportHtml();
            if (format === 'md') onExportMarkdown();
            if (format === 'print') window.print();
          }}
          className="w-28"
          showCheck={false}
        />

        <Tooltip text={isZenMode ? 'Exit Zen Mode' : 'Zen Focus Mode'}>
          <button
            type="button"
            onClick={toggleZenMode}
            className={`p-1.5 rounded-lg transition-all border ${
              isZenMode
                ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-400'
                : 'border-transparent hover:border-slate-200 hover:bg-slate-100 text-slate-600 dark:hover:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {isZenMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </Tooltip>

        <Tooltip text={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}>
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        </Tooltip>
      </div>
    </div>
  );
};

export default Toolbar;
