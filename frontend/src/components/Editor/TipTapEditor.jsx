import React, { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { Color } from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import CharacterCount from '@tiptap/extension-character-count';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import UniqueID from '@tiptap/extension-unique-id';
import { FileHandler } from '@tiptap/extension-file-handler';
import Image from '@tiptap/extension-image';

import FontSize from '../../extensions/FontSize';
import FontFamily from '../../extensions/FontFamily';
import LineSpacing from '../../extensions/LineSpacing';
import ParagraphSpacing from '../../extensions/ParagraphSpacing';
import ManuscriptIndent from '../../extensions/ManuscriptIndent';
import ManuscriptTextAlign from '../../extensions/ManuscriptTextAlign';
import Callout from '../../extensions/Callout';
import CommentMark from '../../extensions/CommentMark';
import SlashCommand from '../../extensions/SlashCommand';
import Dictation from '../../extensions/Dictation';
import {
  DICTATION_LANG_AUTO,
} from '../../constants/dictationLanguages';
import { readDictationLanguagePreference } from '../../utils/dictationLanguageStorage';

import MenuBar from './MenuBar';
import Toolbar from './Toolbar';
import SidePanel from './SidePanel';
import BubbleMenu from './BubbleMenu';
import SlashCommandMenu from './SlashCommandMenu';
import TableControls from './TableControls';
import FindReplaceModal from './FindReplaceModal';
import StatsBar from './StatsBar';
import VersionHistoryModal from './VersionHistoryModal';
import DictationListeningPanel from './DictationListeningPanel';

import {
  prepareHtmlForEditor,
  normalizeHtmlForOutput,
  extractPlainText,
  calculateStats,
  areManuscriptHtmlEquivalent,
} from '../../utils/htmlNormalizer';
import {
  saveSnapshot,
  getSnapshots,
  deleteSnapshot,
  getSettings,
  saveSettings,
  getStoredComments,
  saveStoredComments,
  getWordGoal,
  saveWordGoal,
} from '../../utils/storage';
import {
  getOrCreateDemoUserId,
  readLocalManuscript,
} from '../../utils/draftSync';
import { useManuscriptAutosave } from '../../hooks/useManuscriptAutosave';
import {
  exportToDocx,
  exportToHtmlFile,
  exportToMarkdownFile,
} from '../../utils/docxExporter';
import { PRESETS } from '../../constants/typography';
import { SAMPLE_MANUSCRIPT_HTML } from '../../constants/sampleManuscript';
import { Feather, RefreshCw, Layers, Edit3, BookOpen, Minimize2, WifiOff } from 'lucide-react';

/**
 * Standalone Tiptap manuscript editor MVP.
 *
 * Migration-friendly props (optional — demo App uses local + Mongo sync):
 * - content / onChange: controlled HTML (Storygroove-style)
 * - readOnly, title, onTitleChange
 * - persistLocal: when false, skips local/Mongo autosave (parent owns persistence)
 */
export const TipTapEditor = forwardRef(function TipTapEditor(
  {
    initialContent,
    content,
    onChange,
    title: defaultTitle = 'Untitled Manuscript',
    onTitleChange,
    readOnly = false,
    persistLocal = true,
  },
  ref
) {
  const isControlled = typeof content === 'string';
  const demoUserId = useRef(getOrCreateDemoUserId()).current;
  const [docTitle, setDocTitle] = useState(defaultTitle);

  const [settings, setSettings] = useState(() => getSettings());
  const [theme, setTheme] = useState(settings.theme || 'light');
  const [isZenMode, setIsZenMode] = useState(false);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(true);
  const [activePanelTab, setActivePanelTab] = useState('outline');
  const [currentPreset, setCurrentPreset] = useState(settings.preset || 'manuscript-standard');
  const [pageWidth, setPageWidth] = useState('max-w-[860px]');

  const [isFindReplaceOpen, setIsFindReplaceOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);

  const [slashState, setSlashState] = useState({
    isOpen: false,
    query: '',
    range: null,
    coords: null,
  });

  const [comments, setComments] = useState(() => getStoredComments());
  const [activeCommentId, setActiveCommentId] = useState(null);

  const [goal, setGoal] = useState(() => getWordGoal());
  const [snapshots, setSnapshots] = useState(() => getSnapshots());

  const [stats, setStats] = useState({ words: 0, characters: 0, sentences: 0, readingTimeMinutes: 0 });
  const [dictationListening, setDictationListening] = useState(false);
  const [dictationLang, setDictationLang] = useState(
    () => readDictationLanguagePreference() || DICTATION_LANG_AUTO
  );
  const [dictationTranscript, setDictationTranscript] = useState('');
  const [dictationAudioLevel, setDictationAudioLevel] = useState(0);

  const autoSnapshotTimerRef = useRef(null);
  const loadedInitialHtml = useRef(false);
  const applyingExternalContent = useRef(false);
  const editorRef = useRef(null);
  const docTitleRef = useRef(docTitle);
  const onChangeRef = useRef(onChange);

  docTitleRef.current = docTitle;
  onChangeRef.current = onChange;

  const resolveInitialHtml = () => {
    if (isControlled) return content;
    if (typeof initialContent === 'string') return initialContent;
    if (persistLocal) {
      const local = readLocalManuscript(demoUserId);
      if (local?.html) return local.html;
    }
    return SAMPLE_MANUSCRIPT_HTML;
  };

  const pendingBootRef = useRef(null);

  const applyBootContent = useCallback(({ html, title }) => {
    if (title) {
      setDocTitle(title);
      onTitleChange?.(title);
    }
    if (!html) return;
    if (!editorRef.current) {
      pendingBootRef.current = { html, title };
      return;
    }
    const current = normalizeHtmlForOutput(editorRef.current.getHTML());
    if (areManuscriptHtmlEquivalent(current, html)) return;
    applyingExternalContent.current = true;
    editorRef.current.commands.setContent(prepareHtmlForEditor(html), false);
    applyingExternalContent.current = false;
    setStats(calculateStats(extractPlainText(html)));
  }, [onTitleChange]);

  const {
    saveStatus,
    lastSavedTime,
    recoveredFromLocal,
    notifyContentChanged,
    flushNow,
  } = useManuscriptAutosave({
    enabled: persistLocal && !isControlled && !readOnly,
    getHtml: () =>
      editorRef.current
        ? normalizeHtmlForOutput(editorRef.current.getHTML())
        : null,
    getTitle: () => docTitleRef.current,
    onResolvedContent: applyBootContent,
  });

  const notifyContentChangedRef = useRef(notifyContentChanged);
  notifyContentChangedRef.current = notifyContentChanged;

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const updateSettings = useCallback((newPartial) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newPartial };
      saveSettings(updated);
      return updated;
    });
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    updateSettings({ theme: nextTheme });
  };

  const toggleZenMode = () => {
    const next = !isZenMode;
    setIsZenMode(next);
    updateSettings({ zenMode: next });
  };

  const handleTitleChange = (value) => {
    setDocTitle(value);
    onTitleChange?.(value);
    if (editorRef.current && persistLocal && !isControlled) {
      const normalized = normalizeHtmlForOutput(editorRef.current.getHTML());
      notifyContentChangedRef.current?.(normalized, value);
    }
  };

  const handleSaveGoal = (targetNum) => {
    const newGoal = { ...goal, target: targetNum };
    setGoal(newGoal);
    saveWordGoal(newGoal);
  };

  const getNormalizedHtml = useCallback((ed) => {
    if (!ed) return '<p><br></p>';
    return normalizeHtmlForOutput(ed.getHTML());
  }, []);

  const editor = useEditor({
    editable: !readOnly,
    autofocus: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
        dropcursor: {
          color: '#6366f1',
          width: 2,
        },
      }),
      Underline,
      Subscript,
      Superscript,
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-indigo-600 dark:text-indigo-400 underline cursor-pointer hover:text-indigo-700',
        },
      }),
      ManuscriptTextAlign,
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'manuscript-table',
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      CharacterCount,
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            return 'Chapter or Section Title...';
          }
          return 'Begin typing your story... (Type / for formatting commands)';
        },
      }),
      Typography,
      FontSize,
      FontFamily,
      LineSpacing,
      ParagraphSpacing,
      ManuscriptIndent,
      Callout,
      CommentMark,
      UniqueID.configure({
        attributeName: 'id',
        types: ['heading', 'paragraph', 'blockquote', 'callout'],
      }),
      Image.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-md my-4',
        },
      }),
      FileHandler.configure({
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
        onDrop: (currentEditor, files, pos) => {
          files.forEach((file) => {
            const reader = new FileReader();
            reader.onload = () => {
              currentEditor
                .chain()
                .insertContentAt(pos, {
                  type: 'image',
                  attrs: { src: reader.result },
                })
                .focus()
                .run();
            };
            reader.readAsDataURL(file);
          });
        },
        onPaste: (currentEditor, files) => {
          files.forEach((file) => {
            const reader = new FileReader();
            reader.onload = () => {
              currentEditor
                .chain()
                .focus()
                .setImage({ src: reader.result })
                .run();
            };
            reader.readAsDataURL(file);
          });
        },
      }),
      Dictation.configure({
        lang: dictationLang,
      }),
      SlashCommand.configure({
        onTrigger: ({ query, range, coords }) => {
          setSlashState({ isOpen: true, query, range, coords });
        },
        onClose: () => {
          setSlashState((prev) => ({ ...prev, isOpen: false }));
        },
      }),
    ],
    content: prepareHtmlForEditor(resolveInitialHtml()),
    onUpdate: ({ editor: ed }) => {
      if (applyingExternalContent.current) return;

      const text = extractPlainText(ed.getHTML());
      setStats(calculateStats(text));

      const normalized = normalizeHtmlForOutput(ed.getHTML());
      onChangeRef.current?.(normalized);
      notifyContentChangedRef.current?.(normalized, docTitleRef.current);
    },
  });

  useEffect(() => {
    editorRef.current = editor;
    if (editor && pendingBootRef.current) {
      const pending = pendingBootRef.current;
      pendingBootRef.current = null;
      applyBootContent(pending);
    }
  }, [editor, applyBootContent]);

  // Keep Dictation extension storage + live callbacks in sync (avoids stale closures)
  useEffect(() => {
    if (!editor?.storage?.dictation) return;
    editor.storage.dictation.langPreference = dictationLang;
    editor.storage.dictation.callbacks = {
      onListeningChange: (isListening) => {
        setDictationListening(Boolean(isListening));
        if (!isListening) {
          setDictationTranscript('');
          setDictationAudioLevel(0);
        }
      },
      onLanguageChange: (lang) => {
        setDictationLang(lang || DICTATION_LANG_AUTO);
      },
      onTranscript: (text) => {
        setDictationTranscript(String(text || ''));
      },
      onAudioLevel: (level) => {
        setDictationAudioLevel(Number(level) || 0);
      },
      onError: (err) => {
        console.warn('[Dictation]', err);
        if (err === 'not-allowed' || err === 'mic-permission') {
          window.alert(
            'Microphone permission denied. Allow mic access (browser lock icon → Site settings) and try again.'
          );
        } else if (err === 'network') {
          window.alert(
            'Speech recognition needs a network connection in Chrome/Edge. Check your internet and try again.'
          );
        }
      },
      onUnsupported: () => {
        window.alert(
          'Voice dictation needs Chrome or Edge (Web Speech API is not available here).'
        );
      },
    };
  }, [editor, dictationLang]);

  // Sync controlled content from parent (Storygroove-style)
  useEffect(() => {
    if (!editor || !isControlled) return;
    const current = normalizeHtmlForOutput(editor.getHTML());
    if (areManuscriptHtmlEquivalent(current, content)) return;

    applyingExternalContent.current = true;
    editor.commands.setContent(prepareHtmlForEditor(content || '<p><br></p>'), false);
    applyingExternalContent.current = false;

    const text = extractPlainText(editor.getHTML());
    setStats(calculateStats(text));
  }, [content, editor, isControlled]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(!readOnly);
    }
  }, [editor, readOnly]);

  useEffect(() => {
    if (editor && !loadedInitialHtml.current) {
      loadedInitialHtml.current = true;
      const text = extractPlainText(editor.getHTML());
      setStats(calculateStats(text));
    }
  }, [editor]);

  useEffect(() => {
    if (!editor || !persistLocal) return undefined;

    autoSnapshotTimerRef.current = setInterval(() => {
      const html = getNormalizedHtml(editor);
      const text = extractPlainText(html);
      const computedStats = calculateStats(text);
      if (computedStats.words > 0) {
        saveSnapshot(
          `Auto-Snapshot (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
          html,
          computedStats.words
        );
        setSnapshots(getSnapshots());
      }
    }, 5 * 60 * 1000);

    return () => {
      if (autoSnapshotTimerRef.current) clearInterval(autoSnapshotTimerRef.current);
    };
  }, [editor, persistLocal, getNormalizedHtml]);

  useImperativeHandle(
    ref,
    () => ({
      getHtml: () => getNormalizedHtml(editor),
      setHtml: (nextHtml) => {
        if (!editor) return;
        applyingExternalContent.current = true;
        editor.commands.setContent(prepareHtmlForEditor(nextHtml || '<p><br></p>'), false);
        applyingExternalContent.current = false;
        const text = extractPlainText(editor.getHTML());
        setStats(calculateStats(text));
      },
      getEditor: () => editor,
      focus: () => editor?.commands.focus(),
      undo: () => editor?.chain().focus().undo().run(),
      redo: () => editor?.chain().focus().redo().run(),
    }),
    [editor, getNormalizedHtml]
  );

  const handleSaveNewSnapshot = (name) => {
    if (!editor) return;
    const html = getNormalizedHtml(editor);
    const snap = saveSnapshot(name, html, stats.words);
    if (snap) {
      setSnapshots(getSnapshots());
    }
  };

  const handleDeleteSnapshot = (id) => {
    const updated = deleteSnapshot(id);
    setSnapshots(updated);
  };

  const handleRestoreSnapshot = (restoredHtml) => {
    if (!editor) return;
    applyingExternalContent.current = true;
    editor.commands.setContent(prepareHtmlForEditor(restoredHtml), true);
    applyingExternalContent.current = false;
    const normalized = getNormalizedHtml(editor);
    onChangeRef.current?.(normalized);
    notifyContentChanged(normalized, docTitleRef.current);
    flushNow();
    setIsVersionHistoryOpen(false);
  };

  const handleAddInlineComment = () => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    if (from === to) {
      alert('Please select the text in your manuscript you want to comment on first.');
      return;
    }

    const selectedText = editor.state.doc.textBetween(from, to, ' ');
    const commentPrompt = window.prompt(`Add editorial note for: "${selectedText.slice(0, 30)}..."`);
    if (!commentPrompt || !commentPrompt.trim()) return;

    const newCommentId = 'comment_' + Date.now();
    editor
      .chain()
      .focus()
      .setComment({
        commentId: newCommentId,
        author: 'Editor',
        createdAt: new Date().toISOString(),
      })
      .run();

    const newComment = {
      id: newCommentId,
      quote: selectedText,
      text: commentPrompt.trim(),
      author: 'Editor',
      createdAt: new Date().toISOString(),
      resolved: false,
      replies: [],
    };

    const updated = [newComment, ...comments];
    setComments(updated);
    saveStoredComments(updated);
    setIsSidePanelOpen(true);
    setActivePanelTab('comments');
    setActiveCommentId(newCommentId);
  };

  const handleAddReply = (commentId, replyText) => {
    const updated = comments.map((c) => {
      if (c.id === commentId) {
        return {
          ...c,
          replies: [
            ...(c.replies || []),
            { author: 'Author', text: replyText, createdAt: new Date().toISOString() },
          ],
        };
      }
      return c;
    });
    setComments(updated);
    saveStoredComments(updated);
  };

  const handleResolveComment = (commentId) => {
    const updated = comments.map((c) =>
      c.id === commentId ? { ...c, resolved: !c.resolved } : c
    );
    setComments(updated);
    saveStoredComments(updated);
  };

  const handleDeleteComment = (commentId) => {
    const updated = comments.filter((c) => c.id !== commentId);
    setComments(updated);
    saveStoredComments(updated);

    if (editor) {
      editor.commands.unsetCommentById(commentId);
    }
    if (activeCommentId === commentId) {
      setActiveCommentId(null);
    }
  };

  const applyPreset = (presetId) => {
    const preset = PRESETS.find((p) => p.id === presetId);
    if (!preset || !editor) return;

    setCurrentPreset(presetId);
    updateSettings({ preset: presetId });

    const { from, to } = editor.state.selection;
    const hadSelection = from !== to;

    editor
      .chain()
      .focus()
      .command(({ tr, dispatch }) => {
        if (dispatch) {
          // Apply block attrs across the document
          tr.doc.descendants((node, pos) => {
            if (node.type.name === 'paragraph' || node.type.name === 'heading') {
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                lineHeight: preset.lineHeight,
                marginBottom: preset.paragraphSpacing,
                textAlign: preset.align === 'left' ? null : preset.align,
              });
            }
          });
        }
        return true;
      })
      .selectAll()
      .setFontFamily(preset.fontFamily)
      .setFontSize(preset.fontSize)
      .run();

    if (hadSelection) {
      editor.chain().setTextSelection({ from, to }).run();
    } else {
      editor.chain().setTextSelection(from).run();
    }
  };

  const handleExportDocx = () => {
    if (!editor) return;
    exportToDocx(editor, docTitle);
  };

  const handleExportHtml = () => {
    if (!editor) return;
    exportToHtmlFile(getNormalizedHtml(editor), docTitle);
  };

  const handleExportMarkdown = () => {
    if (!editor) return;
    exportToMarkdownFile(editor, docTitle);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setIsFindReplaceOpen(true);
      }
      if (e.key === 'Escape' && isZenMode) {
        setIsZenMode(false);
        updateSettings({ zenMode: false });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isZenMode, updateSettings]);

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${theme === 'dark' ? 'dark bg-slate-950 text-slate-100' : 'bg-[#f8f9fc] text-slate-900'}`}>
      {isZenMode && (
        <div className="fixed top-4 right-6 z-50 flex items-center gap-2.5 bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-100 backdrop-blur-md px-4 py-2 rounded-full shadow-2xl border border-slate-200/90 dark:border-slate-700 animate-in fade-in slide-in-from-top-2 duration-150 ring-1 ring-black/5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Focus / Read Mode</span>
          </div>
          <button
            type="button"
            onClick={toggleZenMode}
            className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs font-bold transition-all shadow-2xs hover:scale-105"
            title="Exit Focus Mode (Press Escape)"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Exit Focus Mode (Esc)</span>
          </button>
        </div>
      )}

      {!isZenMode && (
        <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-5 py-2 flex items-center justify-between transition-colors shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-2.5 py-1 bg-gradient-to-r from-indigo-50 to-indigo-100/60 dark:from-indigo-950/60 dark:to-indigo-900/40 border border-indigo-200/60 dark:border-indigo-800/60 rounded-lg text-indigo-600 dark:text-indigo-400 font-bold text-xs shadow-2xs">
              <Feather className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="tracking-tight">Tiptap MVP</span>
            </div>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
            <input
              type="text"
              value={docTitle}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Untitled Manuscript..."
              className="text-sm font-semibold bg-transparent border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-indigo-500 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-100 focus:outline-none transition-all max-w-[240px] sm:max-w-md"
            />
          </div>

          <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center bg-slate-100/80 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80 text-[11px]">
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-600 text-white font-semibold shadow-2xs">
                <Edit3 className="w-3 h-3" />
                <span>Editing</span>
              </span>
              <button
                type="button"
                onClick={toggleZenMode}
                className="flex items-center gap-1 px-2 py-0.5 rounded-md text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                title="Switch to Zen / Read Mode (Hides Toolbars)"
              >
                <BookOpen className="w-3 h-3" />
                <span>Focus</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all ${
                isSidePanelOpen
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-950/70 dark:border-indigo-800 dark:text-indigo-400'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
              }`}
              title="Toggle Side Panel"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{isSidePanelOpen ? 'Side Panel Active' : 'Show Panel'}</span>
            </button>

            <div className="hidden md:flex items-center bg-slate-100/80 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80 text-[11px]">
              <button
                type="button"
                onClick={() => setPageWidth('max-w-[760px]')}
                className={`px-2 py-0.5 rounded-md transition-all ${
                  pageWidth === 'max-w-[760px]'
                    ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                title="Book Width (760px)"
              >
                Book
              </button>
              <button
                type="button"
                onClick={() => setPageWidth('max-w-[860px]')}
                className={`px-2 py-0.5 rounded-md transition-all ${
                  pageWidth === 'max-w-[860px]'
                    ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                title="Manuscript Width (860px)"
              >
                Manuscript
              </button>
              <button
                type="button"
                onClick={() => setPageWidth('max-w-[1080px]')}
                className={`px-2 py-0.5 rounded-md transition-all ${
                  pageWidth === 'max-w-[1080px]'
                    ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                title="Wide Width (1080px)"
              >
                Wide
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100/80 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
              {saveStatus === 'loading' ? (
                <>
                  <RefreshCw className="w-3 h-3 text-slate-400 animate-spin" />
                  <span className="text-slate-500 font-medium">Loading...</span>
                </>
              ) : saveStatus === 'saving' ? (
                <>
                  <RefreshCw className="w-3 h-3 text-amber-500 animate-spin" />
                  <span className="text-amber-600 dark:text-amber-400 font-medium">Autosaving...</span>
                </>
              ) : saveStatus === 'offline' ? (
                <>
                  <WifiOff className="w-3 h-3 text-amber-600" />
                  <span className="text-amber-700 dark:text-amber-400 font-medium">Offline</span>
                </>
              ) : saveStatus === 'error' ? (
                <span className="text-rose-600 dark:text-rose-400 font-medium">Sync error</span>
              ) : saveStatus === 'unsaved' ? (
                <span className="text-slate-500 dark:text-slate-400 font-medium">Unsaved</span>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-slate-600 dark:text-slate-300 font-medium">
                    {recoveredFromLocal ? 'Local draft' : 'Saved'}
                  </span>
                </>
              )}
            </div>

            <div className="font-semibold text-slate-700 dark:text-slate-200 bg-slate-100/80 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200/80 dark:border-slate-700 shadow-2xs">
              {stats.words.toLocaleString()} <span className="font-normal text-slate-500 dark:text-slate-400">words</span>
            </div>
          </div>
        </header>
      )}

      {!isZenMode && (
        <MenuBar
          editor={editor}
          onExportDocx={handleExportDocx}
          onExportHtml={handleExportHtml}
          onExportMarkdown={handleExportMarkdown}
          openFindReplace={() => setIsFindReplaceOpen(true)}
          openVersionHistory={() => setIsVersionHistoryOpen(true)}
          theme={theme}
          toggleTheme={toggleTheme}
          isZenMode={isZenMode}
          toggleZenMode={toggleZenMode}
          sidePanelOpen={isSidePanelOpen}
          toggleSidePanel={setIsSidePanelOpen}
          selectPanelTab={(tab) => {
            setIsSidePanelOpen(true);
            setActivePanelTab(tab);
          }}
          docTitle={docTitle}
        />
      )}

      {!isZenMode && (
        <Toolbar
          editor={editor}
          isZenMode={isZenMode}
          toggleZenMode={toggleZenMode}
          theme={theme}
          toggleTheme={toggleTheme}
          showOutline={isSidePanelOpen && activePanelTab === 'outline'}
          toggleOutline={() => {
            if (isSidePanelOpen && activePanelTab === 'outline') {
              setIsSidePanelOpen(false);
            } else {
              setIsSidePanelOpen(true);
              setActivePanelTab('outline');
            }
          }}
          showComments={isSidePanelOpen && activePanelTab === 'comments'}
          toggleComments={() => {
            if (isSidePanelOpen && activePanelTab === 'comments') {
              setIsSidePanelOpen(false);
            } else {
              setIsSidePanelOpen(true);
              setActivePanelTab('comments');
            }
          }}
          openFindReplace={() => setIsFindReplaceOpen(true)}
          openVersionHistory={() => setIsVersionHistoryOpen(true)}
          onExportDocx={handleExportDocx}
          onExportHtml={handleExportHtml}
          onExportMarkdown={handleExportMarkdown}
          currentPreset={currentPreset}
          applyPreset={applyPreset}
          dictationListening={dictationListening}
          dictationLang={dictationLang}
          onDictationLangChange={setDictationLang}
        />
      )}

      <div className="flex-1 flex overflow-hidden relative">
        {!isZenMode && (
          <SidePanel
            isOpen={isSidePanelOpen}
            onToggle={setIsSidePanelOpen}
            activeTab={activePanelTab}
            onSelectTab={setActivePanelTab}
            editor={editor}
            comments={comments}
            activeCommentId={activeCommentId}
            onSelectComment={setActiveCommentId}
            onAddInlineComment={handleAddInlineComment}
            onAddReply={handleAddReply}
            onResolveComment={handleResolveComment}
            onDeleteComment={handleDeleteComment}
            currentPreset={currentPreset}
            applyPreset={applyPreset}
            stats={stats}
            goal={goal}
            onSaveGoal={handleSaveGoal}
            snapshots={snapshots}
            onSaveSnapshot={handleSaveNewSnapshot}
            onDeleteSnapshot={handleDeleteSnapshot}
            onRestoreSnapshot={handleRestoreSnapshot}
          />
        )}

        <main className={`flex-1 overflow-y-auto flex flex-col items-center p-4 sm:p-6 lg:py-8 lg:px-10 transition-all ${isZenMode ? 'p-6 sm:p-12 max-w-4xl mx-auto' : ''}`}>
          <div
            className={`w-full ${pageWidth} min-h-[1100px] bg-white dark:bg-slate-900 shadow-[0_4px_24px_-2px_rgba(0,0,0,0.06),0_1px_4px_rgba(0,0,0,0.04)] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-8 sm:p-14 lg:p-16 transition-all relative ${
              isZenMode ? 'shadow-2xl border-indigo-500/30 ring-1 ring-indigo-500/20' : ''
            }`}
            onClick={() => {
              if (editor && !editor.isFocused) {
                editor.commands.focus();
              }
            }}
          >
            <div className="flex items-center justify-between pb-6 mb-8 border-b border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400 font-mono select-none">
              <span className="truncate max-w-[200px] sm:max-w-sm">{docTitle}</span>
              <div className="flex items-center gap-2">
                <span>Page 1</span>
                <span>•</span>
                <span>{currentPreset}</span>
              </div>
            </div>

            {editor && (
              <BubbleMenu
                editor={editor}
                onAddComment={handleAddInlineComment}
              />
            )}

            {slashState.isOpen && (
              <SlashCommandMenu
                isOpen={slashState.isOpen}
                query={slashState.query}
                coords={slashState.coords}
                editor={editor}
                range={slashState.range}
                onClose={() => setSlashState((prev) => ({ ...prev, isOpen: false }))}
              />
            )}

            <EditorContent editor={editor} className="manuscript-editor-content focus:outline-none" />
          </div>
        </main>
      </div>

      <TableControls editor={editor} />

      <FindReplaceModal
        isOpen={isFindReplaceOpen}
        onClose={() => setIsFindReplaceOpen(false)}
        editor={editor}
      />

      <VersionHistoryModal
        isOpen={isVersionHistoryOpen}
        onClose={() => setIsVersionHistoryOpen(false)}
        editor={editor}
        currentWordCount={stats.words}
        onRestoreVersion={handleRestoreSnapshot}
      />

      <DictationListeningPanel
        listening={dictationListening}
        audioLevel={dictationAudioLevel}
        liveTranscript={dictationTranscript}
        languagePreference={dictationLang}
        onStop={() => editor?.commands.stopDictation()}
      />

      <StatsBar
        stats={stats}
        saveStatus={saveStatus}
        lastSavedTime={lastSavedTime}
        goal={goal}
        onSaveGoal={handleSaveGoal}
      />
    </div>
  );
});

export default TipTapEditor;
