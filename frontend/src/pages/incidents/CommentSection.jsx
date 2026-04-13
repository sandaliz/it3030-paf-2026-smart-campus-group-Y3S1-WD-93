import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';

const CommentSection = ({ comments, onAddComment, onDeleteComment, isAdmin, isTechnician, currentUserId }) => {
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newComment.trim()) {
      onAddComment(newComment, isInternal);
      setNewComment('');
      setIsInternal(false);
    }
  };

  const canViewInternal = isAdmin || isTechnician;

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMins = Math.floor((now - date) / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const filteredComments = comments.filter(c => {
    if (c.internal && !canViewInternal) return false;
    return true;
  });

  return (
    <div className="card bg-base-100 shadow-lg mt-6">
      <div className="card-body">
        <h3 className="card-title text-lg">
          Comments
          <div className="badge badge-neutral badge-sm">{filteredComments.length}</div>
        </h3>

        {/* Comment Form */}
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="form-control">
            <textarea
              className="textarea textarea-bordered"
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="flex justify-between items-center mt-2">
            <label className="cursor-pointer flex items-center gap-2">
              <input
                type="checkbox"
                className="checkbox checkbox-sm checkbox-primary"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                disabled={!canViewInternal}
              />
              <span className="text-sm">
                {isInternal ? '🔒 Internal Note' : '💬 Public Comment'}
              </span>
              {isInternal && !canViewInternal && (
                <span className="text-xs text-base-content/50">(Only visible to staff)</span>
              )}
            </label>
            
            <button type="submit" className="btn btn-primary btn-sm">
              Post Comment
            </button>
          </div>
        </form>

        {/* Comments List */}
        <div className="divide-y divide-base-200">
          {filteredComments.length === 0 ? (
            <div className="text-center py-8 text-base-content/50">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            filteredComments.map((comment) => (
              <div key={comment.id} className="py-4 first:pt-0">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="avatar placeholder">
                      <div className="bg-primary text-primary-content rounded-full w-8">
                        <span className="text-sm">{comment.authorName?.charAt(0) || 'U'}</span>
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">{comment.authorName}</div>
                      <div className="text-xs text-base-content/50">
                        {getTimeAgo(comment.createdAt)}
                        {comment.edited && <span className="ml-1">(edited)</span>}
                      </div>
                    </div>
                  </div>
                  
                  {comment.internal && (
                    <div className="badge badge-warning badge-sm">Internal</div>
                  )}
                  
                  {(comment.authorId === currentUserId || isAdmin) && (
                    <button
                      className="btn btn-ghost btn-xs text-error"
                      onClick={() => onDeleteComment(comment.id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
                
                <div className="mt-2 ml-10">
                  <p className="text-base-content/80 whitespace-pre-wrap">{comment.content}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentSection;