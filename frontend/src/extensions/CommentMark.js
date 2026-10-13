import { Mark, mergeAttributes } from '@tiptap/core';

export const CommentMark = Mark.create({
  name: 'comment',

  excludes: '',

  inclusive: false,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      commentId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-comment-id'),
        renderHTML: (attributes) => {
          if (!attributes.commentId) return {};
          return {
            'data-comment-id': attributes.commentId,
          };
        },
      },
      author: {
        default: 'Editor',
        parseHTML: (element) => element.getAttribute('data-author'),
        renderHTML: (attributes) => ({
          'data-author': attributes.author,
        }),
      },
      createdAt: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-created-at'),
        renderHTML: (attributes) => ({
          'data-created-at': attributes.createdAt,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'mark[data-comment-id]',
      },
      {
        tag: 'span.comment-highlight',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'mark',
      mergeAttributes(
        {
          class: 'comment-highlight',
          title: 'Click to view comment thread',
        },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
      0,
    ];
  },

  addCommands() {
    return {
      setComment:
        (attributes) =>
        ({ commands }) => {
          return commands.setMark(this.name, attributes);
        },
      unsetComment:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
      unsetCommentById:
        (commentId) =>
        ({ tr, state, dispatch }) => {
          if (!commentId) return false;
          const markType = state.schema.marks.comment;
          if (!markType) return false;

          let changed = false;
          state.doc.descendants((node, pos) => {
            if (!node.isText) return;
            node.marks.forEach((mark) => {
              if (mark.type === markType && mark.attrs.commentId === commentId) {
                if (dispatch) {
                  tr.removeMark(pos, pos + node.nodeSize, markType);
                }
                changed = true;
              }
            });
          });

          if (changed && dispatch) {
            dispatch(tr);
          }
          return changed;
        },
    };
  },
});

export default CommentMark;
