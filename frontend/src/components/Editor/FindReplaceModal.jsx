import React, { useState, useEffect, useCallback } from 'react';
import { Search, ArrowUp, ArrowDown, X, CaseSensitive, Regex } from 'lucide-react';

export const FindReplaceModal = ({ isOpen, onClose, editor }) => {
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [isRegex, setIsRegex] = useState(false);
  const [matches, setMatches] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const scanMatches = useCallback(() => {
    if (!editor || !isOpen || !findText.trim()) {
      setMatches([]);
      setCurrentIndex(-1);
      return;
    }

    const { doc } = editor.state;
    const foundMatches = [];

    try {
      const flags = matchCase ? 'g' : 'gi';
      let pattern;
      if (isRegex) {
        pattern = new RegExp(findText, flags);
      } else {
        const escaped = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        pattern = new RegExp(escaped, flags);
      }

      doc.descendants((node, pos) => {
        if (!node.isText) return;
        const text = node.text || '';
        pattern.lastIndex = 0;
        let match;
        while ((match = pattern.exec(text)) !== null) {
          foundMatches.push({
            from: pos + match.index,
            to: pos + match.index + match[0].length,
            text: match[0],
          });
          if (match[0].length === 0) {
            pattern.lastIndex += 1;
          }
        }
      });
    } catch {
      // Invalid regex
    }

    setMatches(foundMatches);
    setCurrentIndex(foundMatches.length > 0 ? 0 : -1);
  }, [editor, findText, matchCase, isRegex, isOpen]);

  useEffect(() => {
    scanMatches();
  }, [scanMatches]);

  useEffect(() => {
    if (!isOpen || currentIndex < 0 || !matches[currentIndex] || !editor) return;
    const { from, to } = matches[currentIndex];
    editor.chain().setTextSelection({ from, to }).scrollIntoView().run();
  }, [currentIndex, matches, editor, isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const handleNext = () => {
    if (matches.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % matches.length);
  };

  const handlePrev = () => {
    if (matches.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + matches.length) % matches.length);
  };

  const handleReplace = () => {
    if (currentIndex < 0 || !matches[currentIndex] || !editor) return;

    const currentMatch = matches[currentIndex];
    editor
      .chain()
      .focus()
      .insertContentAt({ from: currentMatch.from, to: currentMatch.to }, replaceText)
      .run();

    // Rescan after mutation
    setTimeout(scanMatches, 0);
  };

  const handleReplaceAll = () => {
    if (matches.length === 0 || !editor) return;

    const reversed = [...matches].reverse();
    const { tr } = editor.state;

    reversed.forEach((m) => {
      tr.insertText(replaceText, m.from, m.to);
    });

    editor.view.dispatch(tr);
    setMatches([]);
    setCurrentIndex(-1);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-16 right-8 z-50 w-84 rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-200/90 dark:border-slate-700 p-4 animate-in fade-in slide-in-from-top-2 duration-150 ring-1 ring-black/5">
      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-100">
          <div className="p-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Search className="w-3.5 h-3.5" />
          </div>
          <span>Find & Replace</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-2.5">
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder="Find in manuscript..."
            value={findText}
            onChange={(e) => setFindText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (e.shiftKey) handlePrev();
                else handleNext();
              }
            }}
            className="w-full text-xs px-3 py-2 pr-16 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
            autoFocus
          />
          <div className="absolute right-1.5 flex items-center gap-0.5">
            <button
              type="button"
              title="Match Case"
              onClick={() => setMatchCase(!matchCase)}
              className={`p-1 rounded-md text-xs transition-colors ${
                matchCase
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <CaseSensitive className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Regular Expression"
              onClick={() => setIsRegex(!isRegex)}
              className={`p-1 rounded-md text-xs transition-colors ${
                isRegex
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <Regex className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Replace with..."
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
            className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
          />
        </div>

        <div className="flex items-center justify-between pt-0.5 text-xs text-slate-500 dark:text-slate-400">
          <span className="text-[11px]">
            {findText.trim()
              ? matches.length > 0
                ? `${currentIndex + 1} of ${matches.length} matches`
                : 'No matches found'
              : 'Type to search'}
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrev}
              disabled={matches.length === 0}
              className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 transition-colors"
              title="Previous Match"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={matches.length === 0}
              className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 transition-colors"
              title="Next Match"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
          <button
            type="button"
            onClick={handleReplace}
            disabled={matches.length === 0}
            className="px-2.5 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg disabled:opacity-40 transition-colors"
          >
            Replace
          </button>
          <button
            type="button"
            onClick={handleReplaceAll}
            disabled={matches.length === 0}
            className="px-2.5 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-40 shadow-2xs transition-colors"
          >
            Replace All
          </button>
        </div>
      </div>
    </div>
  );
};

export default FindReplaceModal;
