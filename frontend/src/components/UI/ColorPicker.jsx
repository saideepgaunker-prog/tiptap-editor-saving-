import React, { useState, useRef, useEffect } from 'react';
import { Palette, Highlighter, X } from 'lucide-react';

export const ColorPicker = ({
  type = 'color', // 'color' or 'highlight'
  currentColor,
  colors = [],
  onChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customHex, setCustomHex] = useState('');
  const popoverRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const Icon = type === 'highlight' ? Highlighter : Palette;
  const title = type === 'highlight' ? 'Highlight Color' : 'Text Color';

  return (
    <div className={`relative inline-block ${className}`} ref={popoverRef}>
      <button
        type="button"
        title={title}
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1 border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 shadow-2xs"
      >
        <Icon className="w-3.5 h-3.5" />
        <span
          className="w-3 h-3 rounded-full border border-slate-300 dark:border-slate-600 shadow-2xs"
          style={{ backgroundColor: currentColor || (type === 'highlight' ? 'transparent' : '#1e293b') }}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-52 rounded-xl bg-white dark:bg-slate-800 shadow-xl border border-slate-200/90 dark:border-slate-700 p-3 z-50 animate-in fade-in duration-100 ring-1 ring-black/5">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-700">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{title}</span>
            <button
              type="button"
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              title="Reset / Remove"
              className="text-[10px] text-rose-500 hover:text-rose-600 flex items-center gap-0.5 font-medium"
            >
              <X className="w-3 h-3" /> Reset
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-3">
            {colors.map((c) => {
              const isSelected = currentColor === c.value;
              return (
                <button
                  key={c.name}
                  type="button"
                  title={c.name}
                  onClick={() => {
                    onChange(c.value);
                    setIsOpen(false);
                  }}
                  className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all hover:scale-105 shadow-2xs ${
                    isSelected
                      ? 'ring-2 ring-indigo-500 ring-offset-1 border-indigo-500'
                      : 'border-slate-200 dark:border-slate-600'
                  }`}
                  style={{
                    backgroundColor: c.value || '#ffffff',
                    backgroundImage: !c.value
                      ? 'linear-gradient(45deg, #ef4444 50%, transparent 50%)'
                      : undefined,
                  }}
                />
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                placeholder="#HEX"
                value={customHex}
                onChange={(e) => setCustomHex(e.target.value)}
                className="w-full text-xs px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => {
                  if (customHex) {
                    onChange(customHex.startsWith('#') ? customHex : `#${customHex}`);
                    setIsOpen(false);
                  }
                }}
                className="px-2.5 py-1 text-xs font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors shadow-2xs"
              >
                Set
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorPicker;
