import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ticketService, commentService, attachmentService } from '../../services/ticketService';
import { useAuth } from '../../context/AuthContext';
import { PageLoader } from '../../components/ui/LoadingSkeleton';

/* ─── helpers ─────────────────────────────────────────── */
const STATUS_MAP = {
  OPEN:        { badge: 'badge-warning',  dot: 'bg-warning',  label: 'Open' },
  IN_PROGRESS: { badge: 'badge-info',     dot: 'bg-info',     label: 'In Progress' },
  RESOLVED:    { badge: 'badge-success',  dot: 'bg-success',  label: 'Resolved' },
  CLOSED:      { badge: 'badge-neutral',  dot: 'bg-neutral',  label: 'Closed' },
  REJECTED:    { badge: 'badge-error',    dot: 'bg-error',    label: 'Rejected' },
};

const PRIORITY_MAP = {
  URGENT: { badge: 'badge-error',   label: 'Urgent' },
  HIGH:   { badge: 'badge-warning', label: 'High' },
  MEDIUM: { badge: 'badge-info',    label: 'Medium' },
  LOW:    { badge: 'badge-success', label: 'Low' },
};

const fmt = (d) =>
  d ? new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—';

const timeAgo = (d) => {
  const m = Math.floor((Date.now() - new Date(d)) / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const avatarColors = [
  'bg-primary text-primary-content',
  'bg-secondary text-secondary-content',
  'bg-accent text-accent-content',
  'bg-info text-info-content',
  'bg-success text-success-content',
];
const getAvatarColor = (name = '') => avatarColors[name.charCodeAt(0) % avatarColors.length];
const getInitials = (name = '') =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

/* ─── sub-components ──────────────────────────────────── */
const MetaItem = ({ icon, label, value }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-xs font-medium text-base-content/40 uppercase tracking-wider flex items-center gap-1">
      {icon}
      {label}
    </span>
    <span className="text-sm font-medium text-base-content">{value}</span>
  </div>
);

/* ─── page ────────────────────────────────────────────── */
const TicketDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();

  const [ticket, setTicket]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [comments, setComments]   = useState([]);
  const [newComment, setNewComment] = useState('');
  const [updating, setUpdating]   = useState(false);
  const [posting, setPosting]     = useState(false);
  const [resolutionModal, setResolutionModal] = useState(false);
  const [resolutionNote, setResolutionNote]   = useState('');

  const isAdmin      = hasRole('ADMIN');
  const isTechnician = hasRole('TECHNICIAN');
  const canUpdate    = isAdmin || isTechnician;

  useEffect(() => { fetchTicketData(); }, [id]);

  const fetchTicketData = async () => {
    setLoading(true);
    try {
      const [ticketData, commentsData] = await Promise.all([
        ticketService.getTicketById(id),
        commentService.getComments(id),
      ]);
      setTicket(ticketData);
      setComments(commentsData);
    } catch (err) {
      setError('Failed to load ticket');
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
      setResolutionModal(false);
      setResolutionNote('');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setPosting(true);
    try {
      await commentService.addComment(id, newComment, false);
      setNewComment('');
      fetchTicketData();
    } catch (err) {
      alert('Failed to add comment');
    } finally {
      setPosting(false);
    }
  };

  if (loading) return <PageLoader />;
  if (error)   return <div className="alert alert-error m-6">{error}</div>;
  if (!ticket) return <div className="alert alert-warning m-6">Ticket not found</div>;

  const status   = STATUS_MAP[ticket.status]   || { badge: 'badge-ghost',  dot: 'bg-base-300', label: ticket.status };
  const priority = PRIORITY_MAP[ticket.priority] || { badge: 'badge-ghost', label: ticket.priority };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">

      {/* ── Back nav ─────────────────────────────────── */}
      <button
        onClick={() => navigate(-1)}
        className="btn btn-ghost btn-sm gap-1.5 mb-5 -ml-1 text-base-content/60 hover:text-base-content"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      {/* ── Header card ──────────────────────────────── */}
      <div className="card bg-base-100 border border-base-200 shadow-sm mb-5">
        <div className="card-body gap-4 p-6">

          {/* Title row */}
          <div className="flex flex-wrap justify-between items-start gap-4">
            <div className="flex-1 min-w-0">
              {/* Ticket ID */}
              <p className="text-xs font-medium text-base-content/40 uppercase tracking-widest mb-1">
                Ticket #{ticket.id}
              </p>
              <h1 className="text-xl font-bold text-base-content leading-snug">{ticket.title}</h1>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mt-3">
                {/* Status with pulse dot */}
                <span className={`badge ${status.badge} gap-1.5 font-medium`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${status.dot} opacity-80`} />
                  {status.label}
                </span>
                <span className={`badge ${priority.badge} badge-outline font-medium`}>
                  {priority.label}
                </span>
                {ticket.category && (
                  <span className="badge badge-ghost">{ticket.category}</span>
                )}
                {ticket.location && (
                  <span className="badge badge-ghost gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {ticket.location}
                  </span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 shrink-0">
              {canUpdate && ticket.status === 'OPEN' && (
                <button
                  className="btn btn-primary btn-sm gap-1.5 rounded-lg"
                  onClick={() => handleStatusUpdate('IN_PROGRESS', 'Starting work')}
                  disabled={updating}
                >
                  {updating ? <span className="loading loading-spinner loading-xs" /> : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  Start Working
                </button>
              )}

              {canUpdate && ticket.status === 'IN_PROGRESS' && (
                <button
                  className="btn btn-success btn-sm gap-1.5 rounded-lg"
                  onClick={() => setResolutionModal(true)}
                  disabled={updating}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Mark Resolved
                </button>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-xs font-medium text-base-content/40 uppercase tracking-widest mb-2">Description</p>
            <p className="text-sm text-base-content/80 whitespace-pre-wrap leading-relaxed bg-base-200/50 rounded-xl px-4 py-3">
              {ticket.description}
            </p>
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-base-200">
            <MetaItem
              label="Created"
              value={fmt(ticket.createdAt)}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            />
            {ticket.assignedToName && (
              <MetaItem
                label="Assigned to"
                value={ticket.assignedToName}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
              />
            )}
            {ticket.resolvedAt && (
              <MetaItem
                label="Resolved"
                value={fmt(ticket.resolvedAt)}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
            )}
            <MetaItem
              label="Comments"
              value={comments.length}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4-.83L3 20l1.17-3.5A7.94 7.94 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              }
            />
          </div>

          {/* Resolution notes */}
          {ticket.resolutionNotes && (
            <div className="flex gap-3 p-4 bg-success/8 border border-success/20 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-success shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-xs font-semibold text-success uppercase tracking-wider mb-1">Resolution Notes</p>
                <p className="text-sm text-base-content/80 leading-relaxed">{ticket.resolutionNotes}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Comments card ─────────────────────────────── */}
      <div className="card bg-base-100 border border-base-200 shadow-sm">
        <div className="card-body p-6 gap-0">

          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4-.83L3 20l1.17-3.5A7.94 7.94 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="font-semibold text-base">Comments</span>
            </div>
            {comments.length > 0 && (
              <span className="badge badge-ghost badge-sm">{comments.length}</span>
            )}
          </div>

          {/* Compose */}
          <div className={`rounded-xl border transition-all duration-200 mb-5 ${newComment ? 'border-primary/40 shadow-sm' : 'border-base-300'}`}>
            <textarea
              className="textarea w-full bg-transparent border-none focus:outline-none resize-none text-sm rounded-xl rounded-b-none"
              placeholder="Add a comment…"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
            />
            <div className="flex items-center justify-end px-3 py-2 border-t border-base-200 bg-base-200/40 rounded-b-xl">
              <button
                className="btn btn-primary btn-sm rounded-lg gap-1.5 px-4"
                onClick={handleAddComment}
                disabled={!newComment.trim() || posting}
              >
                {posting ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
                Post
              </button>
            </div>
          </div>

          {/* List */}
          {comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-base-content/30">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4-.83L3 20l1.17-3.5A7.94 7.94 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-sm">No comments yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="flex gap-3 p-3 rounded-xl hover:bg-base-200/50 transition-colors duration-150"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 select-none ${getAvatarColor(comment.authorName)}`}>
                    {getInitials(comment.authorName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-semibold text-base-content">{comment.authorName}</span>
                      <span className="text-xs text-base-content/40">{timeAgo(comment.createdAt)}</span>
                    </div>
                    <p className="text-sm text-base-content/80 whitespace-pre-wrap leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Resolution modal ──────────────────────────── */}
      {resolutionModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-sm rounded-2xl">
            <h3 className="font-bold text-lg mb-1">Mark as Resolved</h3>
            <p className="text-sm text-base-content/60 mb-4">Add resolution notes to close out this ticket.</p>
            <textarea
              className="textarea textarea-bordered w-full text-sm rounded-xl"
              placeholder="Describe what was done to resolve this issue…"
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              rows={4}
            />
            <div className="modal-action mt-4 gap-2">
              <button
                className="btn btn-ghost flex-1 rounded-xl"
                onClick={() => { setResolutionModal(false); setResolutionNote(''); }}
              >
                Cancel
              </button>
              <button
                className="btn btn-success flex-1 rounded-xl gap-1.5"
                disabled={!resolutionNote.trim() || updating}
                onClick={() => handleStatusUpdate('RESOLVED', resolutionNote)}
              >
                {updating ? <span className="loading loading-spinner loading-sm" /> : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Confirm
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="modal-backdrop bg-black/40" onClick={() => setResolutionModal(false)} />
        </div>
      )}
    </div>
  );
};

export default TicketDetailPage;