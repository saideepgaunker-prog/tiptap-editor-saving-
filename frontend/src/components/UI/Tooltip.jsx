import React, { useState } from 'react';

export const Tooltip = ({ text, shortcut, children, position = 'bottom' }) => {
  const [visible, setVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && text && (
        <div
          className={`absolute ${positionClasses[position]} z-50 pointer-events-none px-2 py-1 text-[11px] font-medium text-white bg-slate-900/90 dark:bg-slate-700/95 backdrop-blur-sm rounded shadow-lg whitespace-nowrap flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-100`}
        >
          <span>{text}</span>
          {shortcut && (
            <kbd className="px-1 py-0.5 text-[9px] bg-slate-700 dark:bg-slate-600 rounded text-slate-200 border border-slate-600">
              {shortcut}
            </kbd>
          )}
        </div>
      )}
    </div>
  );
};

export default Tooltip;
