import React, { useState, useEffect, useRef } from 'react';
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListChecks,
  Table as TableIcon,
  Quote,
  Minus,
  Code,
  Lightbulb,
  AlertTriangle,
  User,
  StickyNote,
} from 'lucide-react';

export const SlashCommandMenu = ({ isOpen, query, coords, editor, onClose, range }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef(null);

  const commandItems = [
    {
      title: 'Heading 1',
      description: 'Big section heading',
      icon: Heading1,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run();
      },
    },
    {
      title: 'Heading 2',
      description: 'Medium section heading',
      icon: Heading2,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run();
      },
    },
    {
      title: 'Heading 3',
      description: 'Small subsection heading',
      icon: Heading3,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run();
      },
    },
    {
      title: 'Bullet List',
      description: 'Create a simple bulleted list',
      icon: List,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run();
      },
    },
    {
      title: 'Numbered List',
      description: 'Create a numbered list sequence',
      icon: ListOrdered,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run();
      },
    },
    {
      title: 'Task Checklist',
      description: 'Track manuscript tasks with checkboxes',
      icon: ListChecks,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleTaskList().run();
      },
    },
    {
      title: 'Grid Table',
      description: 'Insert a 3x3 structured table',
      icon: TableIcon,
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
          .run();
      },
    },
    {
      title: 'Author Note Callout',
      description: 'Add an author note or research idea callout box',
      icon: Lightbulb,
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent({
            type: 'callout',
            attrs: { calloutType: 'idea' },
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Note: ' }] }],
          })
          .run();
      },
    },
    {
      title: 'Plot Warning Callout',
      description: 'Highlight plot continuity warnings or reminders',
      icon: AlertTriangle,
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent({
            type: 'callout',
            attrs: { calloutType: 'warning' },
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Warning: ' }] }],
          })
          .run();
      },
    },
    {
      title: 'Character Profile Box',
      description: 'Insert character trait and backstory callout',
      icon: User,
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent({
            type: 'callout',
            attrs: { calloutType: 'character' },
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Character Notes: ' }] }],
          })
          .run();
      },
    },
    {
      title: 'Blockquote',
      description: 'Capture a meaningful quote or excerpt',
      icon: Quote,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBlockquote().run();
      },
    },
    {
      title: 'Divider Line',
      description: 'Visually separate scenes or sections',
      icon: Minus,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setHorizontalRule().run();
      },
    },
    {
      title: 'Code Block',
      description: 'Display monospace formatted text block',
      icon: Code,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
      },
    },
  ];

  const filteredItems = commandItems.filter((item) =>
    item.title.toLowerCase().includes((query || '').toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].command({ editor, range });
          onClose();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, editor, range, onClose]);

  if (!isOpen || filteredItems.length === 0) return null;

  // Calculate position
  const top = coords ? Math.min(coords.bottom + 8, window.innerHeight - 320) : 200;
  const left = coords ? Math.min(coords.left, window.innerWidth - 300) : 200;

  return (
    <div
      ref={menuRef}
      style={{ top: `${top}px`, left: `${left}px` }}
      className="fixed z-50 w-76 max-h-76 overflow-y-auto rounded-2xl bg-white dark:bg-slate-800 shadow-xl border border-slate-200/90 dark:border-slate-700 p-1.5 animate-in fade-in zoom-in-95 duration-100 ring-1 ring-black/5"
    >
      <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-750 mb-1">
        Insert Block or Element
      </div>
      {filteredItems.map((item, index) => {
        const isSelected = index === selectedIndex;
        const Icon = item.icon;
        return (
          <button
            key={item.title}
            type="button"
            onClick={() => {
              item.command({ editor, range });
              onClose();
            }}
            onMouseEnter={() => setSelectedIndex(index)}
            className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center gap-2.5 transition-all ${
              isSelected
                ? 'bg-indigo-50/90 dark:bg-slate-700/80 text-indigo-900 dark:text-indigo-200 font-medium'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/40'
            }`}
          >
            <div
              className={`p-2 rounded-lg transition-colors ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-slate-800 dark:text-slate-100">{item.title}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-400">{item.description}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default SlashCommandMenu;
