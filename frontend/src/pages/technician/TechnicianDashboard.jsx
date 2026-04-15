import React, { useState, useEffect } from 'react';
import { ticketAPI } from '../../services/ticketService';
import { commentService } from '../../services/ticketService';
import { useAuth } from '../../context/AuthContext';

const TechnicianDashboard = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    pendingConfirmation: 0,
    closed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);

  // Modal states
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [newComment, setNewComment] = useState('');

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
      const allTickets = response.data.content || response.data;
      const stats = allTickets.reduce((acc, ticket) => {
        acc.total++;
        acc[ticket.status.toLowerCase()] = (acc[ticket.status.toLowerCase()] || 0) + 1;
        return acc;
      }, { total: 0, open: 0, inProgress: 0, resolved: 0, pendingConfirmation: 0, closed: 0 });
      setStats(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedTicket || !newStatus) {
      alert('Please select a ticket and new status');
      return;
    }

    try {
      await ticketAPI.updateTicketStatus(selectedTicket.id, newStatus, resolutionNotes);
      setShowStatusModal(false);
      setNewStatus('');
      setResolutionNotes('');
      setSelectedTicket(null);
      fetchTickets();
      fetchStats();
    } catch (error) {
      console.error('Error updating ticket status:', error);
      alert('Error updating ticket status. Please try again.');
    }
  };

  const handleAddComment = async () => {
    if (!selectedTicket || !newComment.trim()) {
      alert('Please select a ticket and enter comment');
      return;
    }

    try {
      await commentService.addComment(selectedTicket.id, {
        content: newComment,
        userId: user.subject,
        userName: user.name || user.subject,
      });
      setNewComment('');
      fetchTickets();
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Error adding comment. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      OPEN: 'badge-warning',
      IN_PROGRESS: 'badge-info',
      RESOLVED: 'badge-success',
      CLOSED: 'badge-neutral',
      PENDING_CONFIRMATION: 'badge-accent',
      REJECTED: 'badge-error',
    };
    return colors[status] || 'badge-neutral';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      LOW: 'text-success',
      MEDIUM: 'text-warning',
      HIGH: 'text-error',
      CRITICAL: 'text-error font-bold',
    };
    return colors[priority] || 'text-neutral';
  };

  useEffect(() => {
    fetchTickets();
    fetchStats();
  }, []);

  const filteredTickets = tickets.filter(ticket =>
    ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Technician Dashboard</h1>
        <p className="text-gray-600">Manage your assigned tickets and track your work</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="stat bg-base-100 shadow-sm">
          <div className="stat-title">Total Tickets</div>
          <div className="stat-value text-primary">{stats.total}</div>
        </div>
        <div className="stat bg-base-100 shadow-sm">
          <div className="stat-title">Open</div>
          <div className="stat-value text-warning">{stats.open}</div>
        </div>
        <div className="stat bg-base-100 shadow-sm">
          <div className="stat-title">In Progress</div>
          <div className="stat-value text-info">{stats.inProgress}</div>
        </div>
        <div className="stat bg-base-100 shadow-sm">
          <div className="stat-title">Resolved</div>
          <div className="stat-value text-success">{stats.resolved}</div>
        </div>
        <div className="stat bg-base-100 shadow-sm">
          <div className="stat-title">Pending</div>
          <div className="stat-value text-accent">{stats.pendingConfirmation}</div>
        </div>
        <div className="stat bg-base-100 shadow-sm">
          <div className="stat-title">Closed</div>
          <div className="stat-value text-neutral">{stats.closed}</div>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">My Assigned Tickets</h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search tickets..."
                className="input input-bordered w-full max-w-xs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Created By</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover">
                    <td className="font-mono text-sm">#{ticket.id}</td>
                    <td>
                      <div>
                        <div className="font-semibold">{ticket.title}</div>
                        <div className="text-sm text-gray-500">{ticket.category}</div>
                      </div>
                    </td>
                    <td>
                      <span className={`font-semibold ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td>
                      <div className={`badge ${getStatusColor(ticket.status)} badge-sm`}>
                        {ticket.status.replace('_', ' ')}
                      </div>
                    </td>
                    <td>
                      <span className="text-sm">{ticket.userName}</span>
                    </td>
                    <td className="text-sm">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button
                          className="btn btn-xs btn-info"
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setShowDetailsModal(true);
                          }}
                        >
                          View
                        </button>
                        {ticket.status === 'OPEN' && (
                          <button
                            className="btn btn-xs btn-warning"
                            onClick={() => {
                              setSelectedTicket(ticket);
                              setNewStatus('IN_PROGRESS');
                              setShowStatusModal(true);
                            }}
                          >
                            Start Work
                          </button>
                        )}
                        {ticket.status === 'IN_PROGRESS' && (
                          <button
                            className="btn btn-xs btn-success"
                            onClick={() => {
                              setSelectedTicket(ticket);
                              setNewStatus('RESOLVED');
                              setShowStatusModal(true);
                            }}
                          >
                            Mark Resolved
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Ticket Details Modal */}
      {showDetailsModal && selectedTicket && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-4xl">
            <h3 className="font-bold text-lg mb-4">Ticket Details</h3>
            <div className="space-y-4">
              <div><strong>ID:</strong> #{selectedTicket.id}</div>
              <div><strong>Title:</strong> {selectedTicket.title}</div>
              <div><strong>Category:</strong> {selectedTicket.category}</div>
              <div><strong>Priority:</strong> {selectedTicket.priority}</div>
              <div><strong>Status:</strong> {selectedTicket.status}</div>
              <div><strong>Description:</strong> {selectedTicket.description}</div>
              <div><strong>Created:</strong> {new Date(selectedTicket.createdAt).toLocaleString()}</div>
              <div><strong>Created By:</strong> {selectedTicket.userName}</div>
              <div><strong>Location:</strong> {selectedTicket.location || 'N/A'}</div>
              
              {/* Comments Section */}
              <div className="mt-6">
                <h4 className="font-bold mb-2">Comments</h4>
                <div className="space-y-2">
                  {selectedTicket.comments?.map((comment) => (
                    <div key={comment.id} className="bg-base-200 p-3 rounded-lg">
                      <div className="flex justify-between">
                        <span className="font-medium">{comment.userName}</span>
                        <span className="text-sm text-gray-500">
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="mt-1">{comment.content}</p>
                    </div>
                  ))}
                </div>
                
                {/* Add Comment */}
                <div className="mt-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Add Comment</span>
                    </label>
                    <textarea
                      className="textarea textarea-bordered h-20"
                      placeholder="Enter your comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    ></textarea>
                  </div>
                  <button
                    className="btn btn-primary mt-2"
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                  >
                    Add Comment
                  </button>
                </div>
              </div>
            </div>
            <div className="modal-action">
              <button className="btn" onClick={() => setShowDetailsModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {showStatusModal && selectedTicket && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-md">
            <h3 className="font-bold text-lg mb-4">Update Ticket Status</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Update status for ticket <strong>#{selectedTicket.id}</strong>
              </p>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">New Status</span>
                </label>
                <select
                  className="select select-bordered"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="">Select new status...</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Resolution Notes</span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-20"
                  placeholder="Resolution notes..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                ></textarea>
              </div>
            </div>
            <div className="modal-action">
              <button className="btn" onClick={() => setShowStatusModal(false)}>Cancel</button>
              <button
                className="btn btn-success"
                onClick={handleUpdateStatus}
                disabled={!newStatus}
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TechnicianDashboard;
