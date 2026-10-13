import React, { useState, useEffect } from 'react';
import { ListTree, X, ChevronRight, Hash } from 'lucide-react';

export const DocumentOutline = ({ isOpen, onClose, editor }) => {
  const [headings, setHeadings] = useState([]);

  useEffect(() => {
    if (!editor || !isOpen) return;

    const extractHeadings = () => {
      const items = [];
      const { doc } = editor.state;

      doc.descendants((node, pos) => {
        if (node.type.name === 'heading') {
          const level = node.attrs.level || 1;
          const text = node.textContent;
          items.push({
            pos,
            id: node.attrs?.id || null,
            level,
            text: text || `Untitled Heading ${level}`,
          });
        }
      });

      setHeadings(items);
    };

    extractHeadings();

    // Listen to transaction updates
    editor.on('update', extractHeadings);
    return () => {
      editor.off('update', extractHeadings);
    };
  }, [editor, isOpen]);

  if (!isOpen) return null;

  const handleScrollToHeading = (pos) => {
    if (!editor) return;
    editor.chain().setTextSelection(pos).scrollIntoView().focus().run();
  };

  return (
    <aside className="w-72 border-r border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex flex-col h-full shadow-sm z-20 shrink-0 animate-in slide-in-from-left duration-150">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <ListTree className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
            Document Outline
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {headings.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-2.5">
              <Hash className="w-5 h-5 text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">
              No headings found
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
              Add H1, H2, or H3 headings in your manuscript to generate a dynamic table of contents.
            </p>
          </div>
        ) : (
          headings.map((item, idx) => {
            const indentPadding =
              item.level === 1
                ? 'pl-2'
                : item.level === 2
                ? 'pl-4'
                : item.level === 3
                ? 'pl-6'
                : 'pl-8';

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleScrollToHeading(item.pos)}
                className={`w-full text-left py-1.5 pr-2 rounded-lg text-xs flex items-center gap-1.5 hover:bg-indigo-50/70 dark:hover:bg-slate-800 transition-all group ${indentPadding}`}
              >
                <span className="text-[10px] font-mono text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 font-medium shrink-0">
                  H{item.level}
                </span>
                <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 shrink-0 transition-transform group-hover:translate-x-0.5" />
                <span
                  className={`truncate ${
                    item.level === 1
                      ? 'font-bold text-slate-900 dark:text-slate-100'
                      : item.level === 2
                      ? 'font-semibold text-slate-700 dark:text-slate-200'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {item.text}
                </span>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
};

export default DocumentOutline;
