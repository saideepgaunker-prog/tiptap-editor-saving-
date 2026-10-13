import { Node, mergeAttributes } from '@tiptap/core';

const CALLOUT_LABELS = {
  idea: 'Author Idea',
  warning: 'Plot Warning',
  character: 'Character Profile',
  quote: 'Dialogue Note',
  note: 'Chapter Note',
};

export const Callout = Node.create({
  name: 'callout',

  group: 'block',

  content: 'block+',

  defining: true,

  addAttributes() {
    return {
      calloutType: {
        default: 'idea',
        parseHTML: (element) => element.getAttribute('data-callout-type') || 'idea',
        renderHTML: (attributes) => ({
          'data-callout-type': attributes.calloutType,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="callout"]',
      },
      {
        tag: 'div.callout-box',
      },
      {
        tag: 'aside.callout',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const type = node.attrs.calloutType || 'idea';
    return [
      'div',
      mergeAttributes(
        {
          'data-type': 'callout',
          'data-callout-type': type,
          class: `callout-box callout-${type}`,
        },
        HTMLAttributes
      ),
      0,
    ];
  },

  addNodeView() {
    return ({ node }) => {
      const type = node.attrs.calloutType || 'idea';
      const dom = document.createElement('div');
      dom.setAttribute('data-type', 'callout');
      dom.setAttribute('data-callout-type', type);
      dom.className = `callout-box callout-${type}`;

      const header = document.createElement('div');
      header.className = 'callout-header';
      header.contentEditable = 'false';
      const badge = document.createElement('span');
      badge.className = 'callout-badge';
      badge.textContent = CALLOUT_LABELS[type] || CALLOUT_LABELS.note;
      header.appendChild(badge);

      const content = document.createElement('div');
      content.className = 'callout-content';

      dom.appendChild(header);
      dom.appendChild(content);

      return {
        dom,
        contentDOM: content,
        update: (updatedNode) => {
          if (updatedNode.type.name !== 'callout') return false;
          const nextType = updatedNode.attrs.calloutType || 'idea';
          dom.setAttribute('data-callout-type', nextType);
          dom.className = `callout-box callout-${nextType}`;
          badge.textContent = CALLOUT_LABELS[nextType] || CALLOUT_LABELS.note;
          return true;
        },
      };
    };
  },

  addCommands() {
    return {
      setCallout:
        (attributes) =>
        ({ commands }) => {
          return commands.wrapIn(this.name, attributes);
        },
      toggleCallout:
        (attributes) =>
        ({ commands }) => {
          return commands.toggleWrap(this.name, attributes);
        },
      unsetCallout:
        () =>
        ({ commands }) => {
          return commands.lift(this.name);
        },
    };
  },
});

export default Callout;
