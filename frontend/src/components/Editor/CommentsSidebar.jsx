import React, { useState } from 'react';
import { MessageSquare, X, CheckCircle, Trash2, Send, CornerDownRight, User } from 'lucide-react';

export const CommentsSidebar = ({
  isOpen,
  onClose,
  comments = [],
  activeCommentId,
  onSelectComment,
  onAddComment,
  onAddReply,
  onResolveComment,
  onDeleteComment,
}) => {
  const [newCommentText, setNewCommentText] = useState('');
  const [replyTextMap, setReplyTextMap] = useState({});

  if (!isOpen) return null;

  const handleReplySubmit = (commentId) => {
    const text = replyTextMap[commentId];
    if (text && text.trim()) {
      onAddReply(commentId, text.trim());
      setReplyTextMap({ ...replyTextMap, [commentId]: '' });
    }
  };

  return (
    <aside className="w-80 border-l border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex flex-col h-full shadow-sm z-20 shrink-0 animate-in slide-in-from-right duration-150">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <MessageSquare className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
            Review Notes ({comments.filter((c) => !c.resolved).length})
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

      {/* Comment List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {comments.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-2.5">
              <MessageSquare className="w-5 h-5 text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">
              No editorial notes yet
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
              Select any text in your manuscript and click "Note" on the floating menu to leave feedback.
            </p>
          </div>
        ) : (
          comments.map((comment) => {
            const isActive = activeCommentId === comment.id;
            return (
              <div
                key={comment.id}
                onClick={() => onSelectComment(comment.id)}
                className={`p-3.5 rounded-xl border transition-all text-xs cursor-pointer ${
                  comment.resolved
                    ? 'opacity-60 bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                    : isActive
                    ? 'ring-2 ring-indigo-500/80 border-indigo-400 bg-indigo-50/40 dark:bg-slate-800 shadow-sm'
                    : 'bg-white dark:bg-slate-800 border-slate-200/90 dark:border-slate-700 shadow-2xs hover:border-slate-300'
                }`}
              >
                {/* Highlighted text quote */}
                {comment.quote && (
                  <div className="mb-2 pl-2.5 border-l-2 border-indigo-500 text-[11px] italic text-slate-500 dark:text-slate-400 line-clamp-2 bg-slate-50 dark:bg-slate-900/40 py-1 rounded-r-md">
                    "{comment.quote}"
                  </div>
                )}

                {/* Author & Timestamp */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-[10px]">
                      {comment.author?.charAt(0) || 'E'}
                    </div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {comment.author || 'Reviewer'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {new Date(comment.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {/* Comment content */}
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {comment.text}
                </p>

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 space-y-2">
                    {comment.replies.map((reply, rIdx) => (
                      <div key={rIdx} className="flex items-start gap-1.5 pl-2 text-[11px]">
                        <CornerDownRight className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />
                        <div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {reply.author}:
                          </span>{' '}
                          <span className="text-slate-600 dark:text-slate-300">{reply.text}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Input */}
                {!comment.resolved && (
                  <div className="mt-2.5 flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                    <input
                      type="text"
                      placeholder="Add reply..."
                      value={replyTextMap[comment.id] || ''}
                      onChange={(e) =>
                        setReplyTextMap({ ...replyTextMap, [comment.id]: e.target.value })
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleReplySubmit(comment.id);
                      }}
                      className="w-full text-[11px] px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleReplySubmit(comment.id)}
                      className="p-1 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Action buttons */}
                <div className="mt-2.5 flex items-center justify-end gap-2 text-[11px] pt-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onResolveComment(comment.id);
                    }}
                    className="text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5 font-medium transition-colors"
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
                    className="text-rose-500 hover:text-rose-600 flex items-center gap-0.5 font-medium transition-colors"
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
    </aside>
  );
};

export default CommentsSidebar;
