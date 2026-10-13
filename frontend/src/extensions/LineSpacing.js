import { Extension } from '@tiptap/core';

export const LineSpacing = Extension.create({
  name: 'lineSpacing',

  addOptions() {
    return {
      types: ['paragraph', 'heading'],
      defaultLineHeight: '2',
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          lineHeight: {
            default: this.options.defaultLineHeight,
            parseHTML: (element) => {
              const value = element.style.lineHeight;
              return value || null;
            },
            renderHTML: (attributes) => {
              if (!attributes.lineHeight) {
                return {};
              }
              return {
                style: `line-height: ${attributes.lineHeight}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setLineHeight:
        (lineHeight) =>
        ({ commands, state }) => {
          const type = state.selection.$from.parent.type.name;
          if (!this.options.types.includes(type)) {
            return false;
          }
          return commands.updateAttributes(type, { lineHeight });
        },
      unsetLineHeight:
        () =>
        ({ commands, state }) => {
          const type = state.selection.$from.parent.type.name;
          if (!this.options.types.includes(type)) {
            return false;
          }
          return commands.resetAttributes(type, 'lineHeight');
        },
    };
  },
});

export default LineSpacing;
