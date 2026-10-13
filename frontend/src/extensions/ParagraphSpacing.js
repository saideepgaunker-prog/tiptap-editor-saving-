import { Extension } from '@tiptap/core';

export const ParagraphSpacing = Extension.create({
  name: 'paragraphSpacing',

  addOptions() {
    return {
      types: ['paragraph', 'heading'],
      defaultSpacing: '0pt',
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          marginBottom: {
            default: this.options.defaultSpacing,
            parseHTML: (element) => {
              const value = element.style.marginBottom;
              return value || null;
            },
            renderHTML: (attributes) => {
              if (!attributes.marginBottom) {
                return {};
              }
              return {
                style: `margin-bottom: ${attributes.marginBottom}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setParagraphSpacing:
        (marginBottom) =>
        ({ commands, state }) => {
          const type = state.selection.$from.parent.type.name;
          if (!this.options.types.includes(type)) {
            return false;
          }
          return commands.updateAttributes(type, { marginBottom });
        },
      unsetParagraphSpacing:
        () =>
        ({ commands, state }) => {
          const type = state.selection.$from.parent.type.name;
          if (!this.options.types.includes(type)) {
            return false;
          }
          return commands.resetAttributes(type, 'marginBottom');
        },
    };
  },
});

export default ParagraphSpacing;
