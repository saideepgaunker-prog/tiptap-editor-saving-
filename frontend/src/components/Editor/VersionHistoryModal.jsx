import React, { useState, useEffect } from 'react';
import { History, Plus, RotateCcw, Trash2, Clock, FileText } from 'lucide-react';
import Modal from '../UI/Modal';
import { getSnapshots, saveSnapshot, deleteSnapshot } from '../../utils/storage';

export const VersionHistoryModal = ({ isOpen, onClose, editor, onRestoreVersion, currentWordCount }) => {
  const [snapshots, setSnapshots] = useState([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);
  const [checkpointName, setCheckpointName] = useState('');

  const refreshSnapshots = () => {
    const list = getSnapshots();
    setSnapshots(list);
    if (list.length > 0 && !selectedSnapshot) {
      setSelectedSnapshot(list[0]);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshSnapshots();
    }
  }, [isOpen]);

  const handleCreateCheckpoint = (e) => {
    e.preventDefault();
    if (!editor) return;
    const html = editor.getHTML();
    const snap = saveSnapshot(checkpointName.trim() || undefined, html, currentWordCount);
    setCheckpointName('');
    refreshSnapshots();
    if (snap) setSelectedSnapshot(snap);
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    const updated = deleteSnapshot(id);
    setSnapshots(updated);
    if (selectedSnapshot?.id === id) {
      setSelectedSnapshot(updated[0] || null);
    }
  };

  const handleRestore = () => {
    if (selectedSnapshot && onRestoreVersion) {
      if (window.confirm(`Restore manuscript to version "${selectedSnapshot.name}"?`)) {
        onRestoreVersion(selectedSnapshot.html);
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Version History & Snapshots" maxWidth="max-w-4xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Snapshot List & Create Checkpoint */}
        <div className="space-y-4 md:border-r border-slate-200/80 dark:border-slate-800 md:pr-4">
          {/* Create new checkpoint form */}
          <form onSubmit={handleCreateCheckpoint} className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Create New Checkpoint
            </label>
            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder="e.g. Chapter 1 Final Polish"
                value={checkpointName}
                onChange={(e) => setCheckpointName(e.target.value)}
                className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 shrink-0 shadow-2xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>
          </form>

          {/* Snapshots List */}
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {snapshots.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No snapshots saved yet. Auto-snapshots are saved periodically, or click "Save" above to create one now.
              </div>
            ) : (
              snapshots.map((snap) => {
                const isSelected = selectedSnapshot?.id === snap.id;
                return (
                  <div
                    key={snap.id}
                    onClick={() => setSelectedSnapshot(snap)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all text-xs flex items-center justify-between ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/60 dark:bg-slate-800 ring-1 ring-indigo-500 shadow-2xs'
                        : 'border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900/40 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex flex-col gap-0.5 overflow-hidden">
                      <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                        {snap.name}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-3 h-3" />
                          {new Date(snap.timestamp).toLocaleDateString()}{' '}
                          {new Date(snap.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span>•</span>
                        <span>{snap.wordCount || 0} words</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(snap.id, e)}
                      title="Delete Snapshot"
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Preview & Restore Action */}
        <div className="md:col-span-2 flex flex-col h-full">
          {selectedSnapshot ? (
            <div className="flex flex-col h-full space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                    {selectedSnapshot.name}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Saved on {new Date(selectedSnapshot.timestamp).toLocaleString()} •{' '}
                    {selectedSnapshot.wordCount || 0} words
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRestore}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore Version</span>
                </button>
              </div>

              {/* Preview Box */}
              <div className="flex-1 max-h-96 overflow-y-auto p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-[#fbfbfd] dark:bg-slate-900/60 shadow-inner">
                <div
                  dangerouslySetInnerHTML={{ __html: selectedSnapshot.html }}
                  className="font-serif leading-relaxed text-slate-800 dark:text-slate-200 text-sm"
                />
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              Select a snapshot from the left to preview.
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default VersionHistoryModal;
