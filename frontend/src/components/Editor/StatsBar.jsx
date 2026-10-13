import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  FileText,
  Target,
  Sparkles,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { getWordGoal } from '../../utils/storage';

export const StatsBar = ({ stats, saveStatus, lastSavedTime, goal: goalProp, onSaveGoal }) => {
  const [localGoal, setLocalGoal] = useState(() => getWordGoal());
  const goal = goalProp || localGoal;
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [targetInput, setTargetInput] = useState(goal.target || 1000);
  const [hasCelebrated, setHasCelebrated] = useState(false);

  useEffect(() => {
    setTargetInput(goal.target || 1000);
  }, [goal.target]);

  const words = stats?.words || 0;
  const progressPercent = Math.min(100, Math.round((words / (goal.target || 1000)) * 100));

  useEffect(() => {
    if (progressPercent >= 100 && !hasCelebrated && words > 0) {
      setHasCelebrated(true);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.9 },
      });
    }
  }, [progressPercent, hasCelebrated, words]);

  const handleSaveGoal = (e) => {
    e.preventDefault();
    const target = parseInt(targetInput, 10) || 1000;
    if (onSaveGoal) {
      onSaveGoal(target);
    } else {
      const newGoal = { ...goal, target };
      setLocalGoal(newGoal);
    }
    setShowGoalModal(false);
    if (words < target) {
      setHasCelebrated(false);
    }
  };

  return (
    <footer className="sticky bottom-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 px-5 py-2 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 select-none shadow-2xs transition-colors">
      <div className="flex items-center gap-2">
        {saveStatus === 'loading' ? (
          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Loading manuscript...</span>
          </div>
        ) : saveStatus === 'saving' ? (
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Saving draft...</span>
          </div>
        ) : saveStatus === 'offline' ? (
          <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Offline — saved locally</span>
          </div>
        ) : saveStatus === 'error' ? (
          <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Sync failed — kept locally</span>
          </div>
        ) : saveStatus === 'unsaved' ? (
          <div className="flex items-center gap-1.5 text-slate-400 font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Unsaved changes</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>
              All changes saved{' '}
              {lastSavedTime && (
                <span className="text-[11px] opacity-75 font-normal text-slate-500 dark:text-slate-400">
                  ({new Date(lastSavedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })})
                </span>
              )}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {words.toLocaleString()}
          </span>
          <span className="text-slate-500 dark:text-slate-400">words</span>
        </div>

        <div className="hidden sm:inline-block text-slate-500 dark:text-slate-400">
          <span>{(stats?.characters || 0).toLocaleString()} chars</span>
        </div>

        <div className="hidden md:flex items-center gap-1 text-slate-500 dark:text-slate-400">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{stats?.readingTimeMinutes || 0} min read</span>
        </div>

        <div
          onClick={() => setShowGoalModal(true)}
          className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-all bg-slate-100/80 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200/80 dark:border-slate-700 shadow-2xs hover:border-slate-300"
          title="Click to change session target goal"
        >
          <Target className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <div className="w-20 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                progressPercent >= 100
                  ? 'bg-emerald-500'
                  : 'bg-gradient-to-r from-indigo-500 to-indigo-600'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
            {progressPercent}%
          </span>
        </div>
      </div>

      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-xs p-4 animate-in fade-in duration-100">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-2xl border border-slate-200/90 dark:border-slate-700 max-w-xs w-full animate-in zoom-in-95 duration-100 ring-1 ring-black/5">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Daily Word Target
                </h4>
                <p className="text-[10px] text-slate-400">Set your writing target for this session</p>
              </div>
            </div>
            <form onSubmit={handleSaveGoal} className="space-y-3">
              <div>
                <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1 font-medium">Target Word Count:</label>
                <input
                  type="number"
                  min="50"
                  step="50"
                  value={targetInput}
                  onChange={(e) => setTargetInput(e.target.value)}
                  className="w-full text-sm px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                <button
                  type="button"
                  onClick={() => setShowGoalModal(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-2xs transition-colors"
                >
                  Save Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </footer>
  );
};

export default StatsBar;
