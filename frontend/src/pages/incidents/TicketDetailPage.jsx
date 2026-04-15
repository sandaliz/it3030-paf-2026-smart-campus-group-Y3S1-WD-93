import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ticketService, commentService, attachmentService } from '../../services/ticketService';
import { useAuth } from '../../context/AuthContext';
import { PageLoader, CardSkeleton } from '../../components/ui/LoadingSkeleton';

const TicketDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [updating, setUpdating] = useState(false);

  const isAdmin = hasRole('ADMIN');
  const isTechnician = hasRole('TECHNICIAN');
  const canUpdateStatus = isAdmin || isTechnician;

  useEffect(() => {
    fetchTicketData();
  }, [id]);

  const fetchTicketData = async () => {
    setLoading(true);
    try {
      const [ticketData, commentsData, attachmentsData] = await Promise.all([
        ticketService.getTicketById(id),
        commentService.getComments(id),
        attachmentService.getAttachments(id)
      ]);
      setTicket(ticketData);
      setComments(commentsData);
      setAttachments(attachmentsData);
    } catch (err) {
      setError('Failed to load ticket');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (status, reason) => {
    setUpdating(true);
    try {
      await ticketService.updateStatus(id, status, reason);
      fetchTicketData();
    } catch (err) {
      alert('Failed to update status: ' + err.response?.data?.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      await commentService.addComment(id, newComment, false);
      setNewComment('');
      fetchTicketData();
    } catch (err) {
      alert('Failed to add comment');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      OPEN: 'badge-warning',
      IN_PROGRESS: 'badge-info',
      RESOLVED: 'badge-success',
      CLOSED: 'badge-neutral',
      REJECTED: 'badge-error'
    };
    return colors[status] || 'badge-ghost';
  };

  const getPriorityBadge = (priority) => {
    const colors = {
      URGENT: 'badge-error',
      HIGH: 'badge-warning',
      MEDIUM: 'badge-info',
      LOW: 'badge-success'
    };
    return colors[priority] || 'badge-ghost';
  };

  if (loading) return <PageLoader />;
  if (error) return <div className="alert alert-error m-4">{error}</div>;
  if (!ticket) return <div className="alert alert-warning m-4">Ticket not found</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back Button */}
      <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm mb-4">
        ← Back
      </button>

      {/* Ticket Header */}
      <div className="card bg-base-100 shadow-lg mb-6">
        <div className="card-body">
          <div className="flex flex-wrap justify-between items-start gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{ticket.title}</h1>
              <div className="flex flex-wrap gap-2 mt-2">
                <div className={`badge ${getStatusBadge(ticket.status)} gap-1`}>
                  {ticket.status}
                </div>
                <div className={`badge ${getPriorityBadge(ticket.priority)} badge-outline`}>
                  {ticket.priority}
                </div>
                <div className="badge badge-ghost">{ticket.category}</div>
                <div className="badge badge-ghost">{ticket.location}</div>
              </div>
            </div>
            
            {canUpdateStatus && ticket.status === 'OPEN' && (
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => handleStatusUpdate('IN_PROGRESS', 'Starting work')}
                disabled={updating}
              >
                Start Working
              </button>
            )}
            
            {canUpdateStatus && ticket.status === 'IN_PROGRESS' && (
              <button 
                className="btn btn-success btn-sm"
                onClick={() => {
                  const reason = prompt('Resolution notes:');
                  if (reason) handleStatusUpdate('RESOLVED', reason);
                }}
                disabled={updating}
              >
                Mark Resolved
              </button>
            )}
          </div>

          {/* Description */}
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t text-sm">
            <div>
              <span className="text-gray-500">Created:</span>
              <div className="font-medium">{new Date(ticket.createdAt).toLocaleString()}</div>
            </div>
            {ticket.assignedToName && (
              <div>
                <span className="text-gray-500">Assigned to:</span>
                <div className="font-medium">{ticket.assignedToName}</div>
              </div>
            )}
            {ticket.resolvedAt && (
              <div>
                <span className="text-gray-500">Resolved:</span>
                <div className="font-medium">{new Date(ticket.resolvedAt).toLocaleString()}</div>
              </div>
            )}
          </div>

          {/* Resolution Notes */}
          {ticket.resolutionNotes && (
            <div className="mt-4 p-3 bg-success bg-opacity-10 rounded-lg">
              <h3 className="font-semibold text-success">Resolution Notes</h3>
              <p className="text-gray-700">{ticket.resolutionNotes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Comments Section */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <h3 className="card-title text-lg">Comments</h3>
          
          {/* Comment Form */}
          <div className="form-control">
            <textarea
              className="textarea textarea-bordered"
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
            />
            <button 
              className="btn btn-primary btn-sm mt-2 w-32"
              onClick={handleAddComment}
              disabled={!newComment.trim()}
            >
              Post Comment
            </button>
          </div>

          {/* Comments List */}
          <div className="divide-y divide-base-200 mt-4">
            {comments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No comments yet</div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="py-4 first:pt-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{comment.authorName}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(comment.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-gray-700">{comment.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailPage;