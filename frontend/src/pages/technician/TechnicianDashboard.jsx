import React, { useState, useEffect } from 'react';
import { ticketAPI, commentService } from '../../services/ticketService';
import { useAuth } from '../../context/AuthContext';

/* ─── helpers ─────────────────────────────────────────── */
const STATUS_MAP = {
  OPEN:                { badge: 'badge-warning',  dot: 'bg-warning',  label: 'Open' },
  IN_PROGRESS:         { badge: 'badge-info',     dot: 'bg-info',     label: 'In Progress' },
  RESOLVED:            { badge: 'badge-success',  dot: 'bg-success',  label: 'Resolved' },
  PENDING_CONFIRMATION:{ badge: 'badge-accent',   dot: 'bg-accent',   label: 'Pending' },
  CLOSED:              { badge: 'badge-neutral',  dot: 'bg-neutral',  label: 'Closed' },
  REJECTED:            { badge: 'badge-error',    dot: 'bg-error',    label: 'Rejected' },
};

const PRIORITY_MAP = {
  LOW:      { cls: 'text-success',            label: 'Low' },
  MEDIUM:   { cls: 'text-warning',            label: 'Medium' },
  HIGH:     { cls: 'text-error',              label: 'High' },
  CRITICAL: { cls: 'text-error font-bold',    label: 'Critical' },
};

const fmt      = (d) => d ? new Date(d).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—';
const fmtFull  = (d) => d ? new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—';
const timeAgo  = (d) => {
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
const getInitials    = (name = '') =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

/* ─── stat card ───────────────────────────────────────── */
const StatCard = ({ label, value, valueClass, icon }) => (
  <div className="bg-base-100 border border-base-200 rounded-xl p-4 flex flex-col gap-2 shadow-sm">
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-base-content/40 uppercase tracking-wider">{label}</span>
      <span className="text-base-content/20">{icon}</span>
    </div>
    <span className={`text-3xl font-bold leading-none ${valueClass}`}>{value}</span>
  </div>
);

/* ─── icons ───────────────────────────────────────────── */
const Icon = {
  search:  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>,
  eye:     <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>,
  play:    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  check:   <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>,
  send:    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>,
  x:       <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>,
};

/* ─── page ────────────────────────────────────────────── */
const TechnicianDashboard = () => {
  const { user } = useAuth();

  const [tickets, setTickets]           = useState([]);
  const [stats, setStats]               = useState({ total:0, open:0, inprogress:0, resolved:0, pendingconfirmation:0, closed:0 });
  const [loading, setLoading]           = useState(true);
  const [searchTerm, setSearchTerm]     = useState('');
  const [currentPage, setCurrentPage]   = useState(0);
  const [pageSize]                       = useState(10);

  // modal states
  const [selectedTicket, setSelectedTicket]   = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal]   = useState(false);
  const [newStatus, setNewStatus]               = useState('');
  const [resolutionNotes, setResolutionNotes]   = useState('');
  const [newComment, setNewComment]             = useState('');
  const [postingComment, setPostingComment]     = useState(false);
  const [updatingStatus, setUpdatingStatus]     = useState(false);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await ticketAPI.getTechnicianTickets(user.subject, currentPage, pageSize);
      setTickets(response.data.content || response.data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await ticketAPI.getTechnicianTickets(user.subject, 0, 1000);
      const all = response.data.content || response.data;
      const s = all.reduce((acc, t) => {
        acc.total++;
        const key = t.status.toLowerCase().replace('_', '');
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, { total:0, open:0, inprogress:0, resolved:0, pendingconfirmation:0, closed:0 });
      setStats(s);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => { fetchTickets(); fetchStats(); }, []);

  const handleUpdateStatus = async () => {
    if (!selectedTicket || !newStatus) return;
    setUpdatingStatus(true);
    try {
      await ticketAPI.updateTicketStatus(selectedTicket.id, newStatus, resolutionNotes);
      setShowStatusModal(false);
      setNewStatus(''); setResolutionNotes(''); setSelectedTicket(null);
      fetchTickets(); fetchStats();
    } catch (error) {
      alert('Error updating status. Please try again.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddComment = async () => {
    if (!selectedTicket || !newComment.trim()) return;
    setPostingComment(true);
    try {
      await commentService.addComment(selectedTicket.id, newComment, false);
      setNewComment('');
      fetchTickets();
    } catch (error) {
      alert('Error adding comment. Please try again.');
    } finally {
      setPostingComment(false);
    }
  };

  const filteredTickets = tickets.filter((t) =>
    t.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(t.id)?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <span className="loading loading-spinner loading-lg text-primary" />
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">

      {/* ── Page header ─────────────────────────────── */}
      <div className="mb-8">
        <p className="text-xs font-medium text-base-content/40 uppercase tracking-widest mb-1">Welcome back, {user?.name?.split(' ')[0] || 'Technician'}</p>
        <h1 className="text-2xl font-bold text-base-content">My Dashboard</h1>
      </div>

      {/* ── Stat cards ──────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <StatCard label="Total"       value={stats.total}               valueClass="text-base-content"  icon="📋" />
        <StatCard label="Open"        value={stats.open}                valueClass="text-warning"       icon="📬" />
        <StatCard label="In Progress" value={stats.inprogress}          valueClass="text-info"          icon="⚙️" />
        <StatCard label="Resolved"    value={stats.resolved}            valueClass="text-success"       icon="✅" />
        <StatCard label="Pending"     value={stats.pendingconfirmation}  valueClass="text-accent"        icon="⏳" />
        <StatCard label="Closed"      value={stats.closed}              valueClass="text-base-content/50" icon="🔒" />
      </div>

      {/* ── Tickets table card ───────────────────────── */}
      <div className="card bg-base-100 border border-base-200 shadow-sm">
        <div className="card-body p-5 gap-0">

          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <h2 className="text-base font-semibold text-base-content">My Assigned Tickets</h2>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40">{Icon.search}</span>
              <input
                type="text"
                placeholder="Search tickets…"
                className="input input-bordered input-sm pl-9 w-64 rounded-lg text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-base-200">
            <table className="table table-sm w-full">
              <thead>
                <tr className="bg-base-200/60 text-xs font-semibold text-base-content/50 uppercase tracking-wider">
                  <th className="rounded-tl-xl">ID</th>
                  <th>Title</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Requester</th>
                  <th>Created</th>
                  <th className="rounded-tr-xl">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-base-content/30 text-sm">
                      No tickets found
                    </td>
                  </tr>
                ) : filteredTickets.map((ticket) => {
                  const st = STATUS_MAP[ticket.status]     || { badge: 'badge-ghost', dot: 'bg-base-300', label: ticket.status };
                  const pr = PRIORITY_MAP[ticket.priority] || { cls: 'text-base-content', label: ticket.priority };

                  return (
                    <tr key={ticket.id} className="hover:bg-base-200/30 transition-colors duration-100 border-b border-base-200 last:border-0">
                      <td>
                        <span className="font-mono text-xs text-base-content/50">#{ticket.id}</span>
                      </td>
                      <td>
                        <div className="font-medium text-sm text-base-content">{ticket.title}</div>
                        {ticket.location && (
                          <div className="text-xs text-base-content/40 flex items-center gap-1 mt-0.5">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                            {ticket.location}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`text-xs font-semibold ${pr.cls}`}>{pr.label}</span>
                      </td>
                      <td>
                        <span className={`badge ${st.badge} badge-sm gap-1 font-medium`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot} opacity-80`} />
                          {st.label}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${getAvatarColor(ticket.userName)}`}>
                            {getInitials(ticket.userName)}
                          </div>
                          <span className="text-xs text-base-content/70">{ticket.userName}</span>
                        </div>
                      </td>
                      <td>
                        <span className="text-xs text-base-content/50">{fmt(ticket.createdAt)}</span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button
                            className="btn btn-xs btn-ghost gap-1 rounded-lg"
                            onClick={() => { setSelectedTicket(ticket); setShowDetailsModal(true); }}
                          >
                            {Icon.eye} View
                          </button>
                          {ticket.status === 'OPEN' && (
                            <button
                              className="btn btn-xs btn-info gap-1 rounded-lg"
                              onClick={() => { setSelectedTicket(ticket); setNewStatus('IN_PROGRESS'); setShowStatusModal(true); }}
                            >
                              {Icon.play} Start
                            </button>
                          )}
                          {ticket.status === 'IN_PROGRESS' && (
                            <button
                              className="btn btn-xs btn-success gap-1 rounded-lg"
                              onClick={() => { setSelectedTicket(ticket); setNewStatus('RESOLVED'); setShowStatusModal(true); }}
                            >
                              {Icon.check} Resolve
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Details modal ─────────────────────────────── */}
      {showDetailsModal && selectedTicket && (() => {
        const st = STATUS_MAP[selectedTicket.status]     || { badge: 'badge-ghost', label: selectedTicket.status };
        const pr = PRIORITY_MAP[selectedTicket.priority] || { cls: 'text-base-content', label: selectedTicket.priority };
        return (
          <div className="modal modal-open">
            <div className="modal-box w-11/12 max-w-2xl rounded-2xl p-0 overflow-hidden">

              {/* Modal header */}
              <div className="flex items-start justify-between p-6 border-b border-base-200">
                <div>
                  <p className="text-xs font-medium text-base-content/40 uppercase tracking-widest mb-1">Ticket #{selectedTicket.id}</p>
                  <h3 className="text-lg font-bold text-base-content leading-snug">{selectedTicket.title}</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className={`badge ${st.badge} badge-sm font-medium`}>{st.label}</span>
                    <span className={`text-xs font-semibold ${pr.cls}`}>{pr.label}</span>
                    {selectedTicket.category && <span className="badge badge-ghost badge-sm">{selectedTicket.category}</span>}
                    {selectedTicket.location && <span className="badge badge-ghost badge-sm">{selectedTicket.location}</span>}
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm btn-circle" onClick={() => setShowDetailsModal(false)}>
                  {Icon.x}
                </button>
              </div>

              <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">

                {/* Description */}
                <div>
                  <p className="text-xs font-medium text-base-content/40 uppercase tracking-widest mb-2">Description</p>
                  <p className="text-sm text-base-content/80 leading-relaxed bg-base-200/50 rounded-xl px-4 py-3 whitespace-pre-wrap">
                    {selectedTicket.description}
                  </p>
                </div>

                {/* Meta */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-base-200">
                  <div>
                    <p className="text-xs text-base-content/40 uppercase tracking-widest mb-1">Created by</p>
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${getAvatarColor(selectedTicket.userName)}`}>
                        {getInitials(selectedTicket.userName)}
                      </div>
                      <span className="text-sm font-medium">{selectedTicket.userName}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-base-content/40 uppercase tracking-widest mb-1">Created</p>
                    <p className="text-sm font-medium">{fmtFull(selectedTicket.createdAt)}</p>
                  </div>
                </div>

                {/* Comments */}
                <div className="pt-4 border-t border-base-200">
                  <p className="text-xs font-medium text-base-content/40 uppercase tracking-widest mb-3">
                    Comments {selectedTicket.comments?.length > 0 && `(${selectedTicket.comments.length})`}
                  </p>

                  {selectedTicket.comments?.length > 0 ? (
                    <div className="flex flex-col gap-1 mb-4">
                      {selectedTicket.comments.map((c) => (
                        <div key={c.id} className="flex gap-3 p-3 rounded-xl hover:bg-base-200/50 transition-colors">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${getAvatarColor(c.userName)}`}>
                            {getInitials(c.userName)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold text-base-content">{c.userName}</span>
                              <span className="text-xs text-base-content/40">{timeAgo(c.createdAt)}</span>
                            </div>
                            <p className="text-sm text-base-content/80 leading-relaxed">{c.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-base-content/30 text-center py-4 mb-4">No comments yet</p>
                  )}

                  {/* Compose */}
                  <div className={`rounded-xl border transition-all duration-200 ${newComment ? 'border-primary/40' : 'border-base-300'}`}>
                    <textarea
                      className="textarea w-full bg-transparent border-none focus:outline-none resize-none text-sm rounded-xl rounded-b-none"
                      placeholder="Add a comment…"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={2}
                    />
                    <div className="flex justify-end px-3 py-2 border-t border-base-200 bg-base-200/40 rounded-b-xl">
                      <button
                        className="btn btn-primary btn-sm rounded-lg gap-1.5 px-4"
                        onClick={handleAddComment}
                        disabled={!newComment.trim() || postingComment}
                      >
                        {postingComment ? <span className="loading loading-spinner loading-xs" /> : Icon.send}
                        Post
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end px-6 py-4 border-t border-base-200 bg-base-200/30">
                <button className="btn btn-ghost btn-sm rounded-xl" onClick={() => setShowDetailsModal(false)}>
                  Close
                </button>
              </div>
            </div>
            <div className="modal-backdrop bg-black/40" onClick={() => setShowDetailsModal(false)} />
          </div>
        );
      })()}

      {/* ── Status modal ──────────────────────────────── */}
      {showStatusModal && selectedTicket && (
        <div className="modal modal-open">
          <div className="modal-box max-w-sm rounded-2xl p-0 overflow-hidden">

            <div className="flex items-start justify-between p-6 border-b border-base-200">
              <div>
                <h3 className="font-bold text-base">Update Status</h3>
                <p className="text-xs text-base-content/50 mt-0.5">Ticket #{selectedTicket.id}</p>
              </div>
              <button className="btn btn-ghost btn-sm btn-circle" onClick={() => setShowStatusModal(false)}>
                {Icon.x}
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="form-control">
                <label className="label pb-1">
                  <span className="label-text text-xs font-medium text-base-content/50 uppercase tracking-wider">New Status</span>
                </label>
                <select
                  className="select select-bordered select-sm rounded-xl text-sm"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="">Select status…</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label pb-1">
                  <span className="label-text text-xs font-medium text-base-content/50 uppercase tracking-wider">Resolution Notes</span>
                  <span className="label-text-alt text-base-content/30 text-xs">Optional</span>
                </label>
                <textarea
                  className="textarea textarea-bordered text-sm rounded-xl resize-none"
                  placeholder="Describe what was done…"
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-2 px-6 py-4 border-t border-base-200 bg-base-200/30">
              <button className="btn btn-ghost flex-1 rounded-xl btn-sm" onClick={() => setShowStatusModal(false)}>
                Cancel
              </button>
              <button
                className="btn btn-success flex-1 rounded-xl btn-sm gap-1.5"
                onClick={handleUpdateStatus}
                disabled={!newStatus || updatingStatus}
              >
                {updatingStatus ? <span className="loading loading-spinner loading-xs" /> : Icon.check}
                Update
              </button>
            </div>
          </div>
          <div className="modal-backdrop bg-black/40" onClick={() => setShowStatusModal(false)} />
        </div>
      )}
    </div>
  );
};

export default TechnicianDashboard;