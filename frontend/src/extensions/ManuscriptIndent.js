import { Extension } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';
import { cleanWordPasteHtml } from '../utils/wordPasteParser';

const FIVE_SPACES = '\u00A0\u00A0\u00A0\u00A0\u00A0';

export const ManuscriptIndent = Extension.create({
  name: 'manuscriptIndent',

  addOptions() {
    return {
      indentSize: 5,
      char: '\u00A0', // Non-breaking space
    };
  },

  addKeyboardShortcuts() {
    return {
      // Tab key: First-line indent (5 non-breaking spaces) if not inside a list or table
      Tab: ({ editor }) => {
        // If in table, task list, bullet list, ordered list, or codeblock, let native handler handle it
        if (
          editor.isActive('table') ||
          editor.isActive('bulletList') ||
          editor.isActive('orderedList') ||
          editor.isActive('taskList') ||
          editor.isActive('codeBlock')
        ) {
          return false;
        }

        const { state, dispatch } = editor.view;
        const { selection, tr } = state;

        // If at start of paragraph or inside paragraph text, insert 5 non-breaking spaces
        tr.insertText(FIVE_SPACES, selection.from, selection.to);
        dispatch(tr);
        return true;
      },

      // Shift+Tab: Remove leading indent
      'Shift-Tab': ({ editor }) => {
        if (
          editor.isActive('table') ||
          editor.isActive('bulletList') ||
          editor.isActive('orderedList') ||
          editor.isActive('taskList') ||
          editor.isActive('codeBlock')
        ) {
          return false;
        }

        const { state, dispatch } = editor.view;
        const { selection, tr } = state;
        const { $from } = selection;

        const currentParagraphNode = $from.parent;
        if (!currentParagraphNode || !currentParagraphNode.isTextblock) {
          return false;
        }

        const startOfParaPos = $from.start();
        const paraText = currentParagraphNode.textContent;

        // Check if paragraph starts with 5 NBSP or standard spaces
        const leadingIndentRegex = /^(\u00A0| ){1,5}/;
        const match = paraText.match(leadingIndentRegex);

        if (match && match[0].length > 0) {
          tr.delete(startOfParaPos, startOfParaPos + match[0].length);
          dispatch(tr);
          return true;
        }

        return false;
      },

      // Enter key: Smart Enter carries 5-space indent if the current paragraph is indented
      // (not for lists, headings, or center/right aligned)
      Enter: ({ editor }) => {
        if (
          editor.isActive('heading') ||
          editor.isActive('bulletList') ||
          editor.isActive('orderedList') ||
          editor.isActive('taskList') ||
          editor.isActive('codeBlock') ||
          editor.isActive('callout') ||
          editor.isActive('table')
        ) {
          return false; // Native behavior
        }

        const { state } = editor.view;
        const { selection } = state;
        const { $from } = selection;
        const parentNode = $from.parent;

        // Check alignment - do not inherit indent if aligned center or right
        const align = parentNode.attrs?.textAlign;
        if (align === 'center' || align === 'right') {
          return false;
        }

        const text = parentNode.textContent;
        const hasLeadingIndent =
          text.startsWith(FIVE_SPACES) ||
          text.startsWith('     ') ||
          text.startsWith('\u00A0\u00A0\u00A0');

        if (hasLeadingIndent) {
          // Split paragraph and insert 5 spaces at the new cursor location
          editor.commands.splitBlock();
          editor.commands.insertContent(FIVE_SPACES);
          return true;
        }

        return false;
      },
    };
  },

  // Handle paste from Word / Google Docs
  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          transformPastedHTML(html) {
            return cleanWordPasteHtml(html);
          },
        },
      }),
    ];
  },
});

export default ManuscriptIndent;

