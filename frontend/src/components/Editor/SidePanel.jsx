import React, { useState, useEffect } from 'react';
import {
  ListTree,
  MessageSquare,
  Sliders,
  BarChart3,
  History,
  ChevronLeft,
  ChevronRight,
  Hash,
  Sparkles,
  Plus,
  Send,
  CornerDownRight,
  CheckCircle,
  Trash2,
  Target,
  Clock,
  FileText,
  RotateCcw,
  Check,
} from 'lucide-react';
import { PRESETS, FONT_FAMILIES, FONT_SIZES, LINE_HEIGHTS, PARAGRAPH_SPACINGS } from '../../constants/typography';

export const SidePanel = ({
  isOpen,
  onToggle,
  activeTab,
  onSelectTab,
  editor,
  comments = [],
  activeCommentId,
  onSelectComment,
  onAddInlineComment,
  onAddReply,
  onResolveComment,
  onDeleteComment,
  currentPreset,
  applyPreset,
  stats,
  goal,
  onSaveGoal,
  snapshots = [],
  onSaveSnapshot,
  onDeleteSnapshot,
  onRestoreSnapshot,
}) => {
  const [headings, setHeadings] = useState([]);
  const [replyTextMap, setReplyTextMap] = useState({});
  const [checkpointInput, setCheckpointInput] = useState('');
  const [goalTargetInput, setGoalTargetInput] = useState(goal?.target || 1000);

  // Extract headings from editor
  useEffect(() => {
    if (!editor) return;

    const updateHeadings = () => {
      const items = [];
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'heading') {
          items.push({
            pos,
            level: node.attrs.level || 1,
            text: node.textContent || `Untitled Heading ${node.attrs.level || 1}`,
          });
        }
      });
      setHeadings(items);
    };

    updateHeadings();
    editor.on('update', updateHeadings);
    return () => editor.off('update', updateHeadings);
  }, [editor]);

  const handleScrollToPos = (pos) => {
    if (!editor) return;
    editor.chain().setTextSelection(pos).scrollIntoView().focus().run();
  };

  const handleReply = (commentId) => {
    const text = replyTextMap[commentId];
    if (text && text.trim()) {
      onAddReply(commentId, text.trim());
      setReplyTextMap({ ...replyTextMap, [commentId]: '' });
    }
  };

  const handleCreateSnapshot = (e) => {
    e.preventDefault();
    if (!editor) return;
    onSaveSnapshot(checkpointInput.trim() || undefined);
    setCheckpointInput('');
  };

  const handleGoalSubmit = (e) => {
    e.preventDefault();
    onSaveGoal(parseInt(goalTargetInput, 10) || 1000);
  };

  const unresolvedCommentsCount = comments.filter((c) => !c.resolved).length;
  const progressPercent = Math.min(100, Math.round(((stats?.words || 0) / (goal?.target || 1000)) * 100));

  const tabs = [
    { id: 'outline', label: 'Outline', icon: ListTree, badge: headings.length || null },
    { id: 'comments', label: 'Review Notes', icon: MessageSquare, badge: unresolvedCommentsCount || null },
    { id: 'typography', label: 'Typography', icon: Sliders },
    { id: 'stats', label: 'Goals & Stats', icon: BarChart3 },
    { id: 'history', label: 'Snapshots', icon: History, badge: snapshots.length || null },
  ];

  return (
    <div className="flex h-full border-r border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shrink-0 transition-all z-20 shadow-xs">
      {/* Icon Tab Bar */}
      <div className="w-12 py-3 border-r border-slate-100 dark:border-slate-800 flex flex-col items-center justify-between bg-slate-50/60 dark:bg-slate-950/40">
        <div className="flex flex-col items-center gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = isOpen && activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  if (!isOpen) onToggle(true);
                  onSelectTab(tab.id);
                }}
                className={`relative p-2 rounded-xl transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title={tab.label}
              >
                <Icon className="w-4 h-4" />
                {tab.badge !== null && (
                  <span
                    className={`absolute -top-1 -right-1 text-[9px] font-bold px-1 rounded-full min-w-4 text-center leading-4 ${
                      isActive
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Collapse / Expand Toggle */}
        <button
          type="button"
          onClick={() => onToggle(!isOpen)}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
          title={isOpen ? 'Collapse Panel' : 'Expand Panel'}
        >
          {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Panel Content (collapsible) */}
      {isOpen && (
        <div className="w-76 md:w-80 flex flex-col h-full overflow-hidden animate-in slide-in-from-left-2 duration-150">
          {/* Panel Top Title */}
          <div className="px-4 py-3 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                {tabs.find((t) => t.id === activeTab)?.label}
              </span>
            </div>
          </div>

          {/* Tab 1: Document Outline */}
          {activeTab === 'outline' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {headings.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-2.5">
                    <Hash className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                  </div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    No headings in document
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Type a chapter title or section heading (H1, H2, H3) to automatically generate an outline.
                  </p>
                  <button
                    type="button"
                    onClick={() => editor?.chain().focus().insertContent('<h2>New Chapter</h2><p></p>').run()}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-100 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Insert Chapter Title</span>
                  </button>
                </div>
              ) : (
                headings.map((item, idx) => {
                  const indent =
                    item.level === 1
                      ? 'pl-2 font-bold text-slate-900 dark:text-slate-100'
                      : item.level === 2
                      ? 'pl-4 font-semibold text-slate-700 dark:text-slate-200'
                      : 'pl-6 text-slate-600 dark:text-slate-400';

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleScrollToPos(item.pos)}
                      className={`w-full text-left py-1.5 pr-2 rounded-xl text-xs flex items-center gap-2 hover:bg-indigo-50/70 dark:hover:bg-slate-800 transition-all group ${indent}`}
                    >
                      <span className="text-[9px] font-mono font-medium text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 shrink-0">
                        H{item.level}
                      </span>
                      <span className="truncate">{item.text}</span>
                    </button>
                  );
                })
              )}
            </div>
          )}

          {/* Tab 2: Comments & Review Notes */}
          {activeTab === 'comments' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              <div className="flex justify-between items-center pb-1">
                <span className="text-[11px] text-slate-500 font-medium">
                  {comments.length} total note{comments.length === 1 ? '' : 's'}
                </span>
                <button
                  type="button"
                  onClick={onAddInlineComment}
                  className="px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-400 rounded-lg flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Note</span>
                </button>
              </div>

              {comments.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-2">
                    <MessageSquare className="w-5 h-5 text-slate-400" />
                  </div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    No review notes yet
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Highlight text in your manuscript and click "New Note" or use the floating menu to leave feedback.
                  </p>
                </div>
              ) : (
                comments.map((comment) => {
                  const isActive = activeCommentId === comment.id;
                  return (
                    <div
                      key={comment.id}
                      onClick={() => onSelectComment(comment.id)}
                      className={`p-3 rounded-xl border transition-all text-xs cursor-pointer ${
                        comment.resolved
                          ? 'opacity-60 bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                          : isActive
                          ? 'ring-2 ring-indigo-500 border-indigo-400 bg-indigo-50/40 dark:bg-slate-800 shadow-2xs'
                          : 'bg-white dark:bg-slate-800 border-slate-200/90 dark:border-slate-700 shadow-2xs hover:border-slate-300'
                      }`}
                    >
                      {comment.quote && (
                        <div className="mb-2 pl-2 border-l-2 border-indigo-500 text-[11px] italic text-slate-500 line-clamp-2 bg-slate-50 dark:bg-slate-900/40 py-0.5 rounded-r">
                          "{comment.quote}"
                        </div>
                      )}
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {comment.author || 'Reviewer'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-2">
                        {comment.text}
                      </p>

                      {/* Replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 space-y-1.5 mb-2">
                          {comment.replies.map((reply, rIdx) => (
                            <div key={rIdx} className="flex items-start gap-1 pl-1 text-[11px]">
                              <CornerDownRight className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />
                              <div>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">{reply.author}:</span>{' '}
                                <span className="text-slate-600 dark:text-slate-300">{reply.text}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Reply Input */}
                      {!comment.resolved && (
                        <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-700/50">
                          <input
                            type="text"
                            placeholder="Reply..."
                            value={replyTextMap[comment.id] || ''}
                            onChange={(e) => setReplyTextMap({ ...replyTextMap, [comment.id]: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleReply(comment.id);
                            }}
                            className="w-full text-[11px] px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleReply(comment.id)}
                            className="p-1 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="mt-2 flex items-center justify-end gap-2 text-[11px] pt-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onResolveComment(comment.id);
                          }}
                          className="text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5 font-medium"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>{comment.resolved ? 'Reopen' : 'Resolve'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteComment(comment.id);
                          }}
                          className="text-rose-500 hover:text-rose-600 flex items-center gap-0.5 font-medium"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Tab 3: Typography & Formatting Inspector */}
          {activeTab === 'typography' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {/* Presets */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Manuscript Preset
                </label>
                <div className="space-y-1.5">
                  {PRESETS.map((p) => {
                    const isSelected = currentPreset === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => applyPreset(p.id)}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/60 ring-1 ring-indigo-500 text-indigo-900 dark:text-indigo-200'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-semibold">{p.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight">{p.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Fast Font & Spacing Overrides */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Font Family</label>
                  <select
                    value={editor?.getAttributes('textStyle').fontFamily || 'Times New Roman, serif'}
                    onChange={(e) => editor?.chain().focus().setFontFamily(e.target.value).run()}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:ring-1 focus:ring-indigo-500"
                  >
                    {FONT_FAMILIES.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Font Size</label>
                    <select
                      value={editor?.getAttributes('textStyle').fontSize || '12pt'}
                      onChange={(e) => editor?.chain().focus().setFontSize(e.target.value).run()}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:ring-1 focus:ring-indigo-500"
                    >
                      {FONT_SIZES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Line Spacing</label>
                    <select
                      value={editor?.getAttributes('paragraph').lineHeight || '2'}
                      onChange={(e) => editor?.chain().focus().setLineHeight(e.target.value).run()}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:ring-1 focus:ring-indigo-500"
                    >
                      {LINE_HEIGHTS.map((lh) => (
                        <option key={lh.value} value={lh.value}>{lh.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Space After Paragraph</label>
                  <select
                    value={editor?.getAttributes('paragraph').marginBottom || '0pt'}
                    onChange={(e) => editor?.chain().focus().setParagraphSpacing(e.target.value).run()}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:ring-1 focus:ring-indigo-500"
                  >
                    {PARAGRAPH_SPACINGS.map((ps) => (
                      <option key={ps.value} value={ps.value}>{ps.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Writing Stats & Goals */}
          {activeTab === 'stats' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {/* Daily Target Meter */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    Daily Session Goal
                  </span>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {progressPercent}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      progressPercent >= 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-indigo-600'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>{(stats?.words || 0).toLocaleString()} words</span>
                  <span>Target: {(goal?.target || 1000).toLocaleString()}</span>
                </div>

                <form onSubmit={handleGoalSubmit} className="pt-2 border-t border-indigo-100 dark:border-indigo-900/60 flex gap-1.5">
                  <input
                    type="number"
                    min="50"
                    step="50"
                    value={goalTargetInput}
                    onChange={(e) => setGoalTargetInput(e.target.value)}
                    className="w-full px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors shrink-0"
                  >
                    Set
                  </button>
                </form>
              </div>

              {/* Detailed Metrics */}
              <div className="space-y-2 pt-2">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Total Word Count</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">{(stats?.words || 0).toLocaleString()}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Character Count</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">{(stats?.characters || 0).toLocaleString()}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Estimated Reading Time</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">{stats?.readingTimeMinutes || 1} min</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Version Snapshots */}
          {activeTab === 'history' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
              <form onSubmit={handleCreateSnapshot} className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Save Checkpoint</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="e.g. Chapter 1 Final"
                    value={checkpointInput}
                    onChange={(e) => setCheckpointInput(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shrink-0 shadow-2xs"
                  >
                    Save
                  </button>
                </div>
              </form>

              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                {snapshots.length === 0 ? (
                  <p className="text-center text-slate-400 py-6">No snapshots saved yet.</p>
                ) : (
                  snapshots.map((snap) => (
                    <div
                      key={snap.id}
                      className="p-2.5 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">{snap.name}</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Restore manuscript to version "${snap.name}"?`)) {
                                onRestoreSnapshot(snap.html);
                              }
                            }}
                            title="Restore Version"
                            className="p-1 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteSnapshot(snap.id)}
                            title="Delete Snapshot"
                            className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center justify-between">
                        <span>{new Date(snap.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>{snap.wordCount || 0} words</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SidePanel;
