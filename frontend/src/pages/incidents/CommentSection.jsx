import React, { useState } from 'react';

const CommentSection = ({ comments, onAddComment, onDeleteComment, isAdmin, isTechnician, currentUserId }) => {
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const handleSubmit = () => {
    if (newComment.trim()) {
      onAddComment(newComment, isInternal);
      setNewComment('');
      setIsInternal(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    await onDeleteComment(id);
    setDeletingId(null);
  };

  const canViewInternal = isAdmin || isTechnician;

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMins = Math.floor((now - date) / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  // Deterministic avatar color cycling through DaisyUI semantic classes
  const avatarColors = [
    'bg-primary text-primary-content',
    'bg-secondary text-secondary-content',
    'bg-accent text-accent-content',
    'bg-info text-info-content',
    'bg-success text-success-content',
  ];
  const getAvatarColor = (name = '') =>
    avatarColors[name.charCodeAt(0) % avatarColors.length];

  const getInitials = (name = '') =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  const filteredComments = comments.filter((c) => {
    if (c.internal && !canViewInternal) return false;
    return true;
  });

  return (
    <div className="card bg-base-100 shadow-sm border border-base-200 mt-6">
      <div className="card-body gap-0 p-5">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            {/* Chat icon */}
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4-.83L3 20l1.17-3.5A7.94 7.94 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h3 className="font-semibold text-base-content text-base">Comments</h3>
          </div>
          {filteredComments.length > 0 && (
            <span className="badge badge-ghost badge-sm font-medium">
              {filteredComments.length}
            </span>
          )}
        </div>

        {/* Compose box */}
        <div className={`rounded-xl border transition-all duration-200 mb-6 ${newComment ? 'border-primary/40 shadow-sm' : 'border-base-300'}`}>
          <textarea
            className="textarea w-full bg-transparent border-none focus:outline-none resize-none text-sm rounded-xl rounded-b-none"
            placeholder="Write a comment…"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
          />

          {/* Compose footer */}
          <div className="flex items-center justify-between px-3 py-2 border-t border-base-200 bg-base-200/40 rounded-b-xl">
            {/* Internal toggle */}
            <label className={`flex items-center gap-2 cursor-pointer select-none ${!canViewInternal ? 'opacity-40 pointer-events-none' : ''}`}>
              <div
                onClick={() => canViewInternal && setIsInternal(!isInternal)}
                className={`relative w-8 h-4 rounded-full transition-colors duration-200 ${isInternal ? 'bg-warning' : 'bg-base-300'}`}
              >
                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform duration-200 ${isInternal ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
              <span className={`text-xs font-medium ${isInternal ? 'text-warning' : 'text-base-content/60'}`}>
                {isInternal ? 'Internal note' : 'Public comment'}
              </span>
              {isInternal && (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              )}
            </label>

            <button
              onClick={handleSubmit}
              disabled={!newComment.trim()}
              className="btn btn-primary btn-sm rounded-lg gap-1.5 px-4"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Post
            </button>
          </div>
        </div>

        {/* Comments list */}
        {filteredComments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-base-content/30">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4-.83L3 20l1.17-3.5A7.94 7.94 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm">No comments yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {filteredComments.map((comment, idx) => {
              const isOwn = comment.authorId === currentUserId;
              const canDelete = isOwn || isAdmin;

              return (
                <div
                  key={comment.id}
                  className={`group relative flex gap-3 p-3 rounded-xl transition-colors duration-150
                    ${comment.internal
                      ? 'bg-warning/5 border border-warning/20'
                      : 'hover:bg-base-200/50'
                    }`}
                >
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 select-none mt-0.5 ${getAvatarColor(comment.authorName)}`}>
                    {getInitials(comment.authorName)}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    {/* Meta row */}
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-semibold text-base-content leading-none">
                        {comment.authorName}
                      </span>
                      <span className="text-xs text-base-content/40">
                        {getTimeAgo(comment.createdAt)}
                      </span>
                      {comment.edited && (
                        <span className="text-xs text-base-content/30 italic">edited</span>
                      )}
                      {comment.internal && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-warning bg-warning/10 border border-warning/20 rounded-full px-2 py-0.5 leading-none">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          Internal
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <p className="text-sm text-base-content/80 whitespace-pre-wrap leading-relaxed">
                      {comment.content}
                    </p>
                  </div>

                  {/* Delete button — visible on hover */}
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      disabled={deletingId === comment.id}
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute top-3 right-3 w-6 h-6 rounded-md flex items-center justify-center text-error hover:bg-error/10"
                      title="Delete comment"
                    >
                      {deletingId === comment.id ? (
                        <span className="loading loading-spinner loading-xs" />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentSection;