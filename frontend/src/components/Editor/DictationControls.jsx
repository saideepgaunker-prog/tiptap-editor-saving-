import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Languages, Check, ChevronDown } from 'lucide-react';
import Tooltip from '../UI/Tooltip';
import {
  DICTATION_LANG_AUTO,
  DICTATION_LANGUAGE_GROUPS,
  getDictationLanguageLabel,
} from '../../constants/dictationLanguages';
import {
  writeDictationLanguagePreference,
} from '../../utils/dictationLanguageStorage';
import { isSpeechRecognitionSupported } from '../../extensions/Dictation';

export const DictationControls = ({
  editor,
  listening,
  languagePreference,
  onLanguageChange,
  unsupportedMessage,
}) => {
  const [panelOpen, setPanelOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef(null);

  const supported = isSpeechRecognitionSupported();

  useEffect(() => {
    if (!panelOpen) return undefined;
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [panelOpen]);

  if (!editor) return null;

  const shortLabel =
    languagePreference === DICTATION_LANG_AUTO
      ? 'Auto'
      : String(languagePreference || '')
          .split('-')[0]
          .toUpperCase();

  const filteredGroups = DICTATION_LANGUAGE_GROUPS.map((g) => ({
    ...g,
    languages: g.languages.filter((l) => {
      if (!query.trim()) return true;
      const q = query.trim().toLowerCase();
      return (
        l.label.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q)
      );
    }),
  })).filter((g) => g.languages.length > 0);

  const selectLang = (code) => {
    writeDictationLanguagePreference(code);
    onLanguageChange?.(code);
    editor.commands.setDictationLanguage(code);
    setPanelOpen(false);
    setQuery('');
  };

  const toggleMic = () => {
    if (!supported) {
      window.alert(
        unsupportedMessage ||
          'Voice dictation needs Chrome or Edge (Web Speech API).'
      );
      return;
    }
    editor.commands.toggleDictation();
  };

  return (
    <div
      ref={wrapRef}
      className="relative flex items-center gap-1 pl-1.5 border-l border-slate-200 dark:border-slate-700 ml-1"
    >
      <Tooltip
        text={
          !supported
            ? 'Dictation unsupported in this browser'
            : listening
              ? 'Dictation is ON — click to turn OFF'
              : 'Dictation is OFF — click to turn ON'
        }
      >
        <button
          type="button"
          onClick={toggleMic}
          aria-pressed={listening}
          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all border ${
            listening
              ? 'bg-rose-600 border-rose-600 text-white shadow-sm'
              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300'
          } ${!supported ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          {listening ? (
            <MicOff className="w-3.5 h-3.5" />
          ) : (
            <Mic className="w-3.5 h-3.5" />
          )}
          <span>{listening ? 'On' : 'Off'}</span>
        </button>
      </Tooltip>

      <Tooltip text={`Dictation language: ${getDictationLanguageLabel(languagePreference)}`}>
        <button
          type="button"
          onClick={() => setPanelOpen((o) => !o)}
          className={`flex items-center gap-0.5 px-1.5 py-1 rounded-lg text-[10px] font-semibold tracking-wide transition-all border ${
            panelOpen
              ? 'bg-slate-100 border-slate-300 text-slate-700 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200'
              : 'border-transparent hover:border-slate-200 hover:bg-slate-100 text-slate-600 dark:hover:bg-slate-800 dark:text-slate-300'
          }`}
        >
          <Languages className="w-3 h-3" />
          <span>{shortLabel}</span>
          <ChevronDown className="w-3 h-3 opacity-60" />
        </button>
      </Tooltip>

      {panelOpen && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-64 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
          <div className="px-2.5 py-2 border-b border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Recognition language
            </p>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search language…"
              className="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>
          <div className="max-h-64 overflow-y-auto p-1.5 space-y-2">
            <button
              type="button"
              onClick={() => selectLang(DICTATION_LANG_AUTO)}
              className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs ${
                languagePreference === DICTATION_LANG_AUTO
                  ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
              }`}
            >
              <span>Auto (browser)</span>
              {languagePreference === DICTATION_LANG_AUTO && (
                <Check className="w-3.5 h-3.5" />
              )}
            </button>

            {filteredGroups.map((group) => (
              <div key={group.groupLabel}>
                <div className="px-2 pt-1 pb-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {group.groupLabel}
                </div>
                {group.languages.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => selectLang(lang.code)}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs ${
                      languagePreference === lang.code
                        ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <span>{lang.label}</span>
                    {languagePreference === lang.code && (
                      <Check className="w-3.5 h-3.5" />
                    )}
                  </button>
                ))}
              </div>
            ))}

            {filteredGroups.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4">
                No languages match
              </p>
            )}
          </div>
          <p className="px-2.5 py-2 text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800 leading-relaxed">
            Language only sets recognition. Use the Off / On button to start or
            stop listening.
          </p>
        </div>
      )}
    </div>
  );
};

export default DictationControls;
