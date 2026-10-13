import { Extension } from '@tiptap/core';

/**
 * Text-align with Quill ql-align-* class parsing for Storygroove HTML.
 */
export const ManuscriptTextAlign = Extension.create({
  name: 'textAlign',

  addOptions() {
    return {
      types: ['heading', 'paragraph'],
      alignments: ['left', 'center', 'right', 'justify'],
      defaultAlignment: null,
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          textAlign: {
            default: this.options.defaultAlignment,
            parseHTML: (element) => {
              const styleAlign = (element.style.textAlign || '').toLowerCase();
              if (this.options.alignments.includes(styleAlign)) {
                return styleAlign;
              }

              const className = element.getAttribute('class') || '';
              if (className.includes('ql-align-center')) return 'center';
              if (className.includes('ql-align-right')) return 'right';
              if (className.includes('ql-align-justify')) return 'justify';
              if (className.includes('ql-align-left')) return 'left';

              return this.options.defaultAlignment;
            },
            renderHTML: (attributes) => {
              if (!attributes.textAlign) {
                return {};
              }

              const cls =
                attributes.textAlign === 'center'
                  ? 'ql-align-center'
                  : attributes.textAlign === 'right'
                  ? 'ql-align-right'
                  : attributes.textAlign === 'justify'
                  ? 'ql-align-justify'
                  : attributes.textAlign === 'left'
                  ? 'ql-align-left'
                  : null;

              return {
                style: `text-align: ${attributes.textAlign}`,
                ...(cls ? { class: cls } : {}),
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setTextAlign:
        (alignment) =>
        ({ commands, state }) => {
          if (!this.options.alignments.includes(alignment)) {
            return false;
          }
          const type = state.selection.$from.parent.type.name;
          if (!this.options.types.includes(type)) {
            return false;
          }
          return commands.updateAttributes(type, { textAlign: alignment });
        },
      unsetTextAlign:
        () =>
        ({ commands, state }) => {
          const type = state.selection.$from.parent.type.name;
          if (!this.options.types.includes(type)) {
            return false;
          }
          return commands.resetAttributes(type, 'textAlign');
        },
      toggleTextAlign:
        (alignment) =>
        ({ editor, commands }) => {
          if (!this.options.alignments.includes(alignment)) {
            return false;
          }
          if (editor.isActive({ textAlign: alignment })) {
            return commands.unsetTextAlign();
          }
          return commands.setTextAlign(alignment);
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-l': () => this.editor.commands.setTextAlign('left'),
      'Mod-Shift-e': () => this.editor.commands.setTextAlign('center'),
      'Mod-Shift-r': () => this.editor.commands.setTextAlign('right'),
      'Mod-Shift-j': () => this.editor.commands.setTextAlign('justify'),
    };
  },
});

export default ManuscriptTextAlign;
