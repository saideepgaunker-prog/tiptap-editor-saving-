import React from 'react';
import { BubbleMenu as TiptapBubbleMenu } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Link as LinkIcon,
  MessageSquarePlus,
  Highlighter,
  Heading1,
  Heading2,
  Quote,
} from 'lucide-react';

export const BubbleMenu = ({ editor, onAddComment }) => {
  if (!editor) return null;

  const handleLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL:', previousUrl || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <TiptapBubbleMenu
      editor={editor}
      tippyOptions={{ duration: 100, placement: 'top', animation: 'shift-away' }}
      shouldShow={({ editor: menuEditor, view, state, from, to }) => {
        const { empty } = state.selection;
        if (!view.hasFocus() || empty || !menuEditor.isEditable) {
          return false;
        }
        if (!state.doc.textBetween(from, to).length) {
          return false;
        }
        if (menuEditor.isActive('codeBlock')) return false;
        return true;
      }}
      className="flex items-center gap-0.5 bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 backdrop-blur-md px-1.5 py-1 rounded-xl shadow-xl border border-slate-200/90 dark:border-slate-700/80 ring-1 ring-black/5 z-40"
    >
      <button
        type="button"
        title="Bold"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1.5 rounded-lg transition-colors ${
          editor.isActive('bold')
            ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/70 dark:text-indigo-400 font-bold'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
      >
        <Bold className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        title="Italic"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded-lg transition-colors ${
          editor.isActive('italic')
            ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/70 dark:text-indigo-400'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
      >
        <Italic className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        title="Underline"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`p-1.5 rounded-lg transition-colors ${
          editor.isActive('underline')
            ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/70 dark:text-indigo-400'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
      >
        <UnderlineIcon className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        title="Strikethrough"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`p-1.5 rounded-lg transition-colors ${
          editor.isActive('strike')
            ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/70 dark:text-indigo-400'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
      >
        <Strikethrough className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        title="Highlight"
        onClick={() => editor.chain().focus().toggleHighlight({ color: '#fef08a' }).run()}
        className={`p-1.5 rounded-lg transition-colors ${
          editor.isActive('highlight')
            ? 'text-amber-700 bg-amber-100 dark:bg-amber-950/80 dark:text-yellow-300'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
      >
        <Highlighter className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        title="Code"
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={`p-1.5 rounded-lg transition-colors ${
          editor.isActive('code')
            ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/70 dark:text-indigo-400'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
      >
        <Code className="w-3.5 h-3.5" />
      </button>

      <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />

      <button
        type="button"
        title="Heading 1"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-1.5 rounded-lg transition-colors ${
          editor.isActive('heading', { level: 1 })
            ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/70 dark:text-indigo-400 font-bold'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
      >
        <Heading1 className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        title="Heading 2"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-1.5 rounded-lg transition-colors ${
          editor.isActive('heading', { level: 2 })
            ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/70 dark:text-indigo-400 font-bold'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
      >
        <Heading2 className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        title="Quote"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-1.5 rounded-lg transition-colors ${
          editor.isActive('blockquote')
            ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/70 dark:text-indigo-400'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
      >
        <Quote className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        title="Link"
        onClick={handleLink}
        className={`p-1.5 rounded-lg transition-colors ${
          editor.isActive('link')
            ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/70 dark:text-indigo-400'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
      >
        <LinkIcon className="w-3.5 h-3.5" />
      </button>

      <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />

      <button
        type="button"
        title="Add Inline Comment"
        onClick={onAddComment}
        className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-colors shadow-2xs"
      >
        <MessageSquarePlus className="w-3.5 h-3.5" />
        <span>Note</span>
      </button>
    </TiptapBubbleMenu>
  );
};

export default BubbleMenu;
