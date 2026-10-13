import React from 'react';
import {
  Plus,
  Trash2,
  Table as TableIcon,
  Columns,
  Rows,
  Combine,
  Split,
  Heading,
} from 'lucide-react';
import Tooltip from '../UI/Tooltip';

export const TableControls = ({ editor }) => {
  if (!editor || !editor.isActive('table')) return null;

  return (
    <div className="fixed bottom-14 left-1/2 -translate-x-1/2 z-40 bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 backdrop-blur-md px-3 py-1.5 rounded-full shadow-xl border border-slate-200/90 dark:border-slate-700/80 ring-1 ring-black/5 flex items-center gap-1 animate-in fade-in slide-in-from-bottom-2 duration-150">
      <div className="flex items-center gap-1.5 pr-2 border-r border-slate-200 dark:border-slate-700 text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
        <TableIcon className="w-3.5 h-3.5" />
        <span>Table</span>
      </div>

      <Tooltip text="Add Column Left">
        <button
          type="button"
          onClick={() => editor.chain().focus().addColumnBefore().run()}
          className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors text-xs flex items-center gap-0.5 font-medium"
        >
          <Columns className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[10px]">+Left</span>
        </button>
      </Tooltip>

      <Tooltip text="Add Column Right">
        <button
          type="button"
          onClick={() => editor.chain().focus().addColumnAfter().run()}
          className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors text-xs flex items-center gap-0.5 font-medium"
        >
          <Columns className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[10px]">+Right</span>
        </button>
      </Tooltip>

      <Tooltip text="Delete Column">
        <button
          type="button"
          onClick={() => editor.chain().focus().deleteColumn().run()}
          className="p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 transition-colors text-xs flex items-center gap-0.5 font-medium"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="text-[10px]">Col</span>
        </button>
      </Tooltip>

      <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />

      <Tooltip text="Add Row Above">
        <button
          type="button"
          onClick={() => editor.chain().focus().addRowBefore().run()}
          className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors text-xs flex items-center gap-0.5 font-medium"
        >
          <Rows className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[10px]">+Above</span>
        </button>
      </Tooltip>

      <Tooltip text="Add Row Below">
        <button
          type="button"
          onClick={() => editor.chain().focus().addRowAfter().run()}
          className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors text-xs flex items-center gap-0.5 font-medium"
        >
          <Rows className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[10px]">+Below</span>
        </button>
      </Tooltip>

      <Tooltip text="Delete Row">
        <button
          type="button"
          onClick={() => editor.chain().focus().deleteRow().run()}
          className="p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 transition-colors text-xs flex items-center gap-0.5 font-medium"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="text-[10px]">Row</span>
        </button>
      </Tooltip>

      <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />

      <Tooltip text="Merge / Split Cells">
        <button
          type="button"
          onClick={() => editor.chain().focus().mergeOrSplit().run()}
          className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors text-xs flex items-center gap-0.5 font-medium"
        >
          <Combine className="w-3.5 h-3.5 text-indigo-500" />
          <span className="text-[10px]">Merge</span>
        </button>
      </Tooltip>

      <Tooltip text="Toggle Header Row">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeaderRow().run()}
          className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors text-xs flex items-center gap-0.5 font-medium"
        >
          <Heading className="w-3.5 h-3.5 text-indigo-500" />
          <span className="text-[10px]">Header</span>
        </button>
      </Tooltip>

      <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />

      <Tooltip text="Delete Entire Table">
        <button
          type="button"
          onClick={() => editor.chain().focus().deleteTable().run()}
          className="p-1 rounded-md hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-300 transition-colors text-xs flex items-center gap-0.5 font-medium"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="text-[10px]">Delete</span>
        </button>
      </Tooltip>
    </div>
  );
};

export default TableControls;
