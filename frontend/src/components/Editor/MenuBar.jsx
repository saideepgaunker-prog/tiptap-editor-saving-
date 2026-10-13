import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Save,
  RotateCcw,
  FileDown,
  Printer,
  Sparkles,
  Undo2,
  Redo2,
  Search,
  CheckSquare,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Table,
  Minus,
  Code,
  Lightbulb,
  AlertTriangle,
  User,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Subscript,
  Superscript,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Maximize2,
  Minimize2,
  Sun,
  Moon,
  ListTree,
  MessageSquare,
  Sliders,
  BarChart3,
  History,
  Trash2,
  Layers,
} from 'lucide-react';
import { SAMPLE_MANUSCRIPT_HTML } from '../../constants/sampleManuscript';
import { prepareHtmlForEditor } from '../../utils/htmlNormalizer';

export const MenuBar = ({
  editor,
  onExportDocx,
  onExportHtml,
  onExportMarkdown,
  openFindReplace,
  openVersionHistory,
  theme,
  toggleTheme,
  isZenMode,
  toggleZenMode,
  sidePanelOpen,
  toggleSidePanel,
  selectPanelTab,
  docTitle,
}) => {
  const [activeMenu, setActiveMenu] = useState(null);
  const menuBarRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuClick = (menuName) => {
    setActiveMenu(activeMenu === menuName ? null : menuName);
  };

  const handleMenuHover = (menuName) => {
    if (activeMenu !== null) {
      setActiveMenu(menuName);
    }
  };

  const handleNewDocument = () => {
    if (window.confirm('Create a new blank manuscript? Current draft is saved in history.')) {
      editor?.commands.setContent('<p><br></p>', true);
      editor?.commands.focus();
    }
    setActiveMenu(null);
  };

  const handleResetSample = () => {
    if (window.confirm('Reset manuscript to the sample chapter?')) {
      editor?.commands.setContent(prepareHtmlForEditor(SAMPLE_MANUSCRIPT_HTML), true);
      editor?.commands.focus();
    }
    setActiveMenu(null);
  };

  return (
    <div ref={menuBarRef} className="flex items-center gap-1 px-4 py-1 border-b border-slate-100 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 text-xs text-slate-600 dark:text-slate-300 select-none">
      {/* File Menu */}
      <div className="relative">
        <button
          type="button"
          onClick={() => handleMenuClick('file')}
          onMouseEnter={() => handleMenuHover('file')}
          className={`px-2 py-1 rounded-md transition-colors ${
            activeMenu === 'file' ? 'bg-indigo-50 text-indigo-700 font-semibold dark:bg-slate-800' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          File
        </button>
        {activeMenu === 'file' && (
          <div className="absolute left-0 mt-1 w-56 rounded-xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-200/90 dark:border-slate-700 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 ring-1 ring-black/5">
            <button
              onClick={handleNewDocument}
              className="w-full text-left px-3.5 py-1.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/60"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>New Manuscript</span>
              </div>
            </button>
            <button
              onClick={handleResetSample}
              className="w-full text-left px-3.5 py-1.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/60"
            >
              <div className="flex items-center gap-2">
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Load Sample Novel</span>
              </div>
            </button>
            <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />
            <button
              onClick={() => {
                onExportDocx();
                setActiveMenu(null);
              }}
              className="w-full text-left px-3.5 py-1.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/60"
            >
              <div className="flex items-center gap-2">
                <FileDown className="w-3.5 h-3.5 text-indigo-500" />
                <span>Export Word (.docx)</span>
              </div>
            </button>
            <button
              onClick={() => {
                onExportHtml();
                setActiveMenu(null);
              }}
              className="w-full text-left px-3.5 py-1.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/60"
            >
              <div className="flex items-center gap-2">
                <FileDown className="w-3.5 h-3.5 text-emerald-500" />
                <span>Export Clean HTML</span>
              </div>
            </button>
            <button
              onClick={() => {
                onExportMarkdown();
                setActiveMenu(null);
              }}
              className="w-full text-left px-3.5 py-1.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/60"
            >
              <div className="flex items-center gap-2">
                <FileDown className="w-3.5 h-3.5 text-blue-500" />
                <span>Export Markdown (.md)</span>
              </div>
            </button>
            <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />
            <button
              onClick={() => {
                window.print();
                setActiveMenu(null);
              }}
              className="w-full text-left px-3.5 py-1.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/60"
            >
              <div className="flex items-center gap-2">
                <Printer className="w-3.5 h-3.5 text-slate-400" />
                <span>Print / PDF View</span>
              </div>
              <span className="text-[10px] text-slate-400">Ctrl+P</span>
            </button>
          </div>
        )}
      </div>

      {/* Edit Menu */}
      <div className="relative">
        <button
          type="button"
          onClick={() => handleMenuClick('edit')}
          onMouseEnter={() => handleMenuHover('edit')}
          className={`px-2 py-1 rounded-md transition-colors ${
            activeMenu === 'edit' ? 'bg-indigo-50 text-indigo-700 font-semibold dark:bg-slate-800' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Edit
        </button>
        {activeMenu === 'edit' && (
          <div className="absolute left-0 mt-1 w-52 rounded-xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-200/90 dark:border-slate-700 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 ring-1 ring-black/5">
            <button
              onClick={() => {
                editor?.chain().focus().undo().run();
                setActiveMenu(null);
              }}
              disabled={!editor?.can().undo()}
              className="w-full text-left px-3.5 py-1.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/60 disabled:opacity-40"
            >
              <div className="flex items-center gap-2">
                <Undo2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Undo</span>
              </div>
              <span className="text-[10px] text-slate-400">Ctrl+Z</span>
            </button>
            <button
              onClick={() => {
                editor?.chain().focus().redo().run();
                setActiveMenu(null);
              }}
              disabled={!editor?.can().redo()}
              className="w-full text-left px-3.5 py-1.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/60 disabled:opacity-40"
            >
              <div className="flex items-center gap-2">
                <Redo2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Redo</span>
              </div>
              <span className="text-[10px] text-slate-400">Ctrl+Y</span>
            </button>
            <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />
            <button
              onClick={() => {
                openFindReplace();
                setActiveMenu(null);
              }}
              className="w-full text-left px-3.5 py-1.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/60"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-indigo-500" />
                <span>Find & Replace</span>
              </div>
              <span className="text-[10px] text-slate-400">Ctrl+F</span>
            </button>
            <button
              onClick={() => {
                editor?.chain().focus().selectAll().run();
                setActiveMenu(null);
              }}
              className="w-full text-left px-3.5 py-1.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/60"
            >
              <span>Select All</span>
              <span className="text-[10px] text-slate-400">Ctrl+A</span>
            </button>
          </div>
        )}
      </div>

      {/* Insert Menu */}
      <div className="relative">
        <button
          type="button"
          onClick={() => handleMenuClick('insert')}
          onMouseEnter={() => handleMenuHover('insert')}
          className={`px-2 py-1 rounded-md transition-colors ${
            activeMenu === 'insert' ? 'bg-indigo-50 text-indigo-700 font-semibold dark:bg-slate-800' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Insert
        </button>
        {activeMenu === 'insert' && (
          <div className="absolute left-0 mt-1 w-56 rounded-xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-200/90 dark:border-slate-700 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 ring-1 ring-black/5">
            <button
              onClick={() => {
                editor?.chain().focus().toggleHeading({ level: 1 }).run();
                setActiveMenu(null);
              }}
              className="w-full text-left px-3.5 py-1.5 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700/60"
            >
              <Heading1 className="w-3.5 h-3.5 text-slate-400" />
              <span>Chapter Title (H1)</span>
            </button>
            <button
              onClick={() => {
                editor?.chain().focus().toggleHeading({ level: 2 }).run();
                setActiveMenu(null);
              }}
              className="w-full text-left px-3.5 py-1.5 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700/60"
            >
              <Heading2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Section Heading (H2)</span>
            </button>
            <button
              onClick={() => {
                editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
                setActiveMenu(null);
              }}
              className="w-full text-left px-3.5 py-1.5 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700/60"
            >
              <Table className="w-3.5 h-3.5 text-indigo-500" />
              <span>Grid Table (3x3)</span>
            </button>
            <button
              onClick={() => {
                editor?.chain().focus().toggleTaskList().run();
                setActiveMenu(null);
              }}
              className="w-full text-left px-3.5 py-1.5 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700/60"
            >
              <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
              <span>Checklist Item</span>
            </button>
            <button
              onClick={() => {
                editor?.chain().focus().toggleBlockquote().run();
                setActiveMenu(null);
              }}
              className="w-full text-left px-3.5 py-1.5 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700/60"
            >
              <Quote className="w-3.5 h-3.5 text-slate-400" />
              <span>Blockquote</span>
            </button>
            <button
              onClick={() => {
                editor?.chain().focus().setHorizontalRule().run();
                setActiveMenu(null);
              }}
              className="w-full text-left px-3.5 py-1.5 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700/60"
            >
              <Minus className="w-3.5 h-3.5 text-slate-400" />
              <span>Scene Break / Divider</span>
            </button>
            <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />
            <button
              onClick={() => {
                editor?.chain().focus().insertContent({
                  type: 'callout',
                  attrs: { calloutType: 'idea' },
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Note: ' }] }],
                }).run();
                setActiveMenu(null);
              }}
              className="w-full text-left px-3.5 py-1.5 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700/60"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>Author Idea Callout</span>
            </button>
            <button
              onClick={() => {
                editor?.chain().focus().insertContent({
                  type: 'callout',
                  attrs: { calloutType: 'warning' },
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Warning: ' }] }],
                }).run();
                setActiveMenu(null);
              }}
              className="w-full text-left px-3.5 py-1.5 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700/60"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span>Plot Warning Callout</span>
            </button>
          </div>
        )}
      </div>

      {/* Format Menu */}
      <div className="relative">
        <button
          type="button"
          onClick={() => handleMenuClick('format')}
          onMouseEnter={() => handleMenuHover('format')}
          className={`px-2 py-1 rounded-md transition-colors ${
            activeMenu === 'format' ? 'bg-indigo-50 text-indigo-700 font-semibold dark:bg-slate-800' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Format
        </button>
        {activeMenu === 'format' && (
          <div className="absolute left-0 mt-1 w-52 rounded-xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-200/90 dark:border-slate-700 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 ring-1 ring-black/5">
            <button
              onClick={() => {
                editor?.chain().focus().toggleBold().run();
                setActiveMenu(null);
              }}
              className="w-full text-left px-3.5 py-1.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/60"
            >
              <div className="flex items-center gap-2">
                <Bold className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-bold">Bold</span>
              </div>
              <span className="text-[10px] text-slate-400">Ctrl+B</span>
            </button>
            <button
              onClick={() => {
                editor?.chain().focus().toggleItalic().run();
                setActiveMenu(null);
              }}
              className="w-full text-left px-3.5 py-1.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/60"
            >
              <div className="flex items-center gap-2">
                <Italic className="w-3.5 h-3.5 text-slate-400" />
                <span className="italic">Italic</span>
              </div>
              <span className="text-[10px] text-slate-400">Ctrl+I</span>
            </button>
            <button
              onClick={() => {
                editor?.chain().focus().toggleUnderline().run();
                setActiveMenu(null);
              }}
              className="w-full text-left px-3.5 py-1.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/60"
            >
              <div className="flex items-center gap-2">
                <Underline className="w-3.5 h-3.5 text-slate-400" />
                <span className="underline">Underline</span>
              </div>
              <span className="text-[10px] text-slate-400">Ctrl+U</span>
            </button>
            <button
              onClick={() => {
                editor?.chain().focus().toggleStrike().run();
                setActiveMenu(null);
              }}
              className="w-full text-left px-3.5 py-1.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/60"
            >
              <div className="flex items-center gap-2">
                <Strikethrough className="w-3.5 h-3.5 text-slate-400" />
                <span className="line-through">Strikethrough</span>
              </div>
              <span className="text-[10px] text-slate-400">Ctrl+Shift+X</span>
            </button>
            <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />
            <button
              onClick={() => {
                editor?.chain().focus().setTextAlign('left').run();
                setActiveMenu(null);
              }}
              className="w-full text-left px-3.5 py-1.5 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700/60"
            >
              <AlignLeft className="w-3.5 h-3.5 text-slate-400" />
              <span>Align Left</span>
            </button>
            <button
              onClick={() => {
                editor?.chain().focus().setTextAlign('center').run();
                setActiveMenu(null);
              }}
              className="w-full text-left px-3.5 py-1.5 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700/60"
            >
              <AlignCenter className="w-3.5 h-3.5 text-slate-400" />
              <span>Align Center</span>
            </button>
            <button
              onClick={() => {
                editor?.chain().focus().setTextAlign('justify').run();
                setActiveMenu(null);
              }}
              className="w-full text-left px-3.5 py-1.5 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700/60"
            >
              <AlignJustify className="w-3.5 h-3.5 text-slate-400" />
              <span>Justify</span>
            </button>
          </div>
        )}
      </div>

      {/* View Menu */}
      <div className="relative">
        <button
          type="button"
          onClick={() => handleMenuClick('view')}
          onMouseEnter={() => handleMenuHover('view')}
          className={`px-2 py-1 rounded-md transition-colors ${
            activeMenu === 'view' ? 'bg-indigo-50 text-indigo-700 font-semibold dark:bg-slate-800' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          View
        </button>
        {activeMenu === 'view' && (
          <div className="absolute left-0 mt-1 w-52 rounded-xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-200/90 dark:border-slate-700 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 ring-1 ring-black/5">
            <button
              onClick={() => {
                toggleSidePanel(!sidePanelOpen);
                setActiveMenu(null);
              }}
              className="w-full text-left px-3.5 py-1.5 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700/60"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              <span>{sidePanelOpen ? 'Hide Side Panel' : 'Show Side Panel'}</span>
            </button>
            <button
              onClick={() => {
                toggleZenMode();
                setActiveMenu(null);
              }}
              className="w-full text-left px-3.5 py-1.5 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700/60"
            >
              {isZenMode ? <Minimize2 className="w-3.5 h-3.5 text-amber-500" /> : <Maximize2 className="w-3.5 h-3.5 text-slate-400" />}
              <span>{isZenMode ? 'Exit Zen Mode' : 'Zen Focus Mode'}</span>
            </button>
            <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />
            <button
              onClick={() => {
                toggleTheme();
                setActiveMenu(null);
              }}
              className="w-full text-left px-3.5 py-1.5 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700/60"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-slate-400" />}
              <span>Switch to {theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Panels / Tools Menu */}
      <div className="relative">
        <button
          type="button"
          onClick={() => handleMenuClick('tools')}
          onMouseEnter={() => handleMenuHover('tools')}
          className={`px-2 py-1 rounded-md transition-colors ${
            activeMenu === 'tools' ? 'bg-indigo-50 text-indigo-700 font-semibold dark:bg-slate-800' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Panels
        </button>
        {activeMenu === 'tools' && (
          <div className="absolute left-0 mt-1 w-52 rounded-xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-200/90 dark:border-slate-700 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 ring-1 ring-black/5">
            <button
              onClick={() => {
                toggleSidePanel(true);
                selectPanelTab('outline');
                setActiveMenu(null);
              }}
              className="w-full text-left px-3.5 py-1.5 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700/60"
            >
              <ListTree className="w-3.5 h-3.5 text-indigo-500" />
              <span>Document Outline</span>
            </button>
            <button
              onClick={() => {
                toggleSidePanel(true);
                selectPanelTab('comments');
                setActiveMenu(null);
              }}
              className="w-full text-left px-3.5 py-1.5 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700/60"
            >
              <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
              <span>Review Notes & Comments</span>
            </button>
            <button
              onClick={() => {
                toggleSidePanel(true);
                selectPanelTab('typography');
                setActiveMenu(null);
              }}
              className="w-full text-left px-3.5 py-1.5 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700/60"
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-500" />
              <span>Typography Inspector</span>
            </button>
            <button
              onClick={() => {
                toggleSidePanel(true);
                selectPanelTab('stats');
                setActiveMenu(null);
              }}
              className="w-full text-left px-3.5 py-1.5 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700/60"
            >
              <BarChart3 className="w-3.5 h-3.5 text-indigo-500" />
              <span>Goals & Statistics</span>
            </button>
            <button
              onClick={() => {
                toggleSidePanel(true);
                selectPanelTab('history');
                setActiveMenu(null);
              }}
              className="w-full text-left px-3.5 py-1.5 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700/60"
            >
              <History className="w-3.5 h-3.5 text-indigo-500" />
              <span>Version Checkpoints</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuBar;
