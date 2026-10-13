import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export const SlashCommandPluginKey = new PluginKey('slashCommand');

export const SlashCommand = Extension.create({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        command: ({ editor, range, props }) => {
          props.command({ editor, range });
        },
      },
      onTrigger: null, // Callback to show React Slash Command Menu
      onClose: null,   // Callback to hide React Slash Command Menu
      onUpdateQuery: null,
    };
  },

  addProseMirrorPlugins() {
    const { onTrigger, onClose, onUpdateQuery } = this.options;

    return [
      new Plugin({
        key: SlashCommandPluginKey,
        state: {
          init() {
            return { active: false, query: '', range: null };
          },
          apply(tr, prev) {
            const { selection } = tr;
            if (!selection.empty) {
              return { active: false, query: '', range: null };
            }

            const { $from } = selection;
            const textBefore = $from.parent.textBetween(
              0,
              $from.parentOffset,
              undefined,
              '\ufffc'
            );

            // Match '/' preceded by start of line or space
            const match = textBefore.match(/(?:^|\s)\/([a-zA-Z0-9_-]*)$/);

            if (match) {
              const slashIndex = textBefore.lastIndexOf('/');
              const query = match[1];
              const from = $from.start() + slashIndex;
              const to = $from.pos;

              return {
                active: true,
                query,
                range: { from, to },
              };
            }

            return { active: false, query: '', range: null };
          },
        },
        view: () => {
          return {
            update: (view, prevState) => {
              const prevPluginState = prevState ? SlashCommandPluginKey.getState(prevState) : null;
              const currentPluginState = view?.state ? SlashCommandPluginKey.getState(view.state) : null;

              if (currentPluginState?.active) {
                // Get screen coordinates of the cursor
                const coords = view.coordsAtPos(currentPluginState.range.from);
                if (onTrigger) {
                  onTrigger({
                    query: currentPluginState.query,
                    range: currentPluginState.range,
                    coords,
                  });
                }
              } else if (prevPluginState?.active && !currentPluginState?.active) {
                if (onClose) {
                  onClose();
                }
              }
            },
          };
        },
      }),
    ];
  },
});

export default SlashCommand;
