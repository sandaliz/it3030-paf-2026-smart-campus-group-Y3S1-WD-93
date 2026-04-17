import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ticketAPI } from '../../services/ticketService';
import { resourceService } from '../../services/resourceService';
import { useAuth } from '../../context/AuthContext';

const UserTicketsPage = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    pendingConfirmation: 0,
    closed: 0,
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);

  // Form state for new ticket
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    category: 'HARDWARE',
    priority: 'MEDIUM',
    location: '',
    resourceId: '',
    contactDetails: '',
    preferredContactMethod: 'EMAIL',
  });
  const [attachments, setAttachments] = useState([]);
  const [attachmentPreviews, setAttachmentPreviews] = useState([]);

  // Handle resource selection with auto-fill location
  const handleResourceChange = (resourceId) => {
    if (resourceId) {
      const selectedResource = resources.find(r => r.id === resourceId);
      if (selectedResource) {
        setNewTicket(prev => ({
          ...prev,
          resourceId: resourceId,
          location: selectedResource.location
        }));
      }
    } else {
      // Clear resource and allow manual location entry
      setNewTicket(prev => ({
        ...prev,
        resourceId: '',
        location: ''
      }));
    }
  };

  // Handle manual location change (clear resource ID if location is manually edited)
  const handleLocationChange = (location) => {
    setNewTicket(prev => ({
      ...prev,
      location: location,
      resourceId: '' // Clear resource ID when location is manually edited
    }));
  };

  const fetchResources = async () => {
    try {
      const response = await resourceService.getAllResources();
      setResources(response);
    } catch (error) {
      console.error('Error fetching resources:', error);
    }
  };

  const fetchTickets = async () => {
    if (!user?.subject) return;
    
    try {
      setLoading(true);
      const response = await ticketAPI.getUserTickets(user.subject, currentPage, pageSize);
      setTickets(response.data.content || response.data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!user?.subject) return;
    
    try {
      const response = await ticketAPI.getUserTickets(user.subject, 0, 1000);
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

  const handleCreateTicket = async () => {
    if (!newTicket.title.trim() || !newTicket.description.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const ticketData = {
        ...newTicket,
        createdBy: user.subject,
        userName: user.name || user.subject,
        attachments: attachments
      };
      
      await ticketAPI.createTicket(ticketData, attachments);
      
      // Reset form
      setNewTicket({
        title: '',
        description: '',
        category: 'HARDWARE',
        priority: 'MEDIUM',
        location: '',
        resourceId: '',
        contactDetails: '',
        preferredContactMethod: 'EMAIL',
      });
      setAttachments([]);
      setAttachmentPreviews([]);
      setShowCreateModal(false);
      
      fetchTickets();
      fetchStats();
    } catch (error) {
      console.error('Error creating ticket:', error);
      alert('Error creating ticket: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleConfirmResolution = async () => {
    if (!selectedTicket) return;
    
    try {
      await ticketAPI.confirmTicketResolution(selectedTicket.id, feedback);
      setShowConfirmModal(false);
      setFeedback('');
      setSelectedTicket(null);
      fetchTickets();
      fetchStats();
    } catch (error) {
      console.error('Error confirming resolution:', error);
      alert('Error confirming resolution. Please try again.');
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate file count
    if (files.length > 3) {
      alert('Maximum 3 files allowed');
      return;
    }
    
    // Validate file types (images only)
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const invalidFiles = files.filter(file => !validTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      alert('Only image files (JPG, PNG, GIF, WebP) are allowed');
      return;
    }
    
    // Validate file sizes (max 5MB each)
    const maxSize = 5 * 1024 * 1024; // 5MB
    const oversizedFiles = files.filter(file => file.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      alert('Each file must be smaller than 5MB');
      return;
    }
    
    setAttachments(files);
    
    // Create previews for images
    const previews = [];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        previews.push({
          name: file.name,
          size: file.size,
          type: file.type,
          url: e.target.result
        });
        if (previews.length === files.length) {
          setAttachmentPreviews(previews);
        }
      };
      reader.readAsDataURL(file);
    });
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
    if (user?.subject) {
      fetchTickets();
      fetchStats();
      fetchResources();
    }
  }, [user]);

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
        <h1 className="text-3xl font-bold mb-2">My Tickets</h1>
        <p className="text-gray-600">Manage your support tickets and track their status</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="stat">
          <div className="stat-title">Total</div>
          <div className="stat-value text-primary">{stats.total}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Open</div>
          <div className="stat-value text-warning">{stats.open}</div>
        </div>
        <div className="stat">
          <div className="stat-title">In Progress</div>
          <div className="stat-value text-info">{stats.inProgress}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Resolved</div>
          <div className="stat-value text-success">{stats.resolved}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Pending</div>
          <div className="stat-value text-accent">{stats.pendingConfirmation}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Closed</div>
          <div className="stat-value text-neutral">{stats.closed}</div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="card bg-base-100 shadow-sm mb-6">
        <div className="card-body">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search tickets..."
                className="input input-bordered w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Link to="/resources" className="btn btn-outline">
                Browse Resources
              </Link>
              <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                Create Ticket
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Resource</th>
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
                      {ticket.resourceId ? (
                        <span className="badge badge-outline">
                          {resources.find(r => r.id === ticket.resourceId)?.name || 'Unknown Resource'}
                        </span>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="text-sm">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button
                          className="btn btn-xs btn-info"
                          onClick={() => setSelectedTicket(ticket)}
                        >
                          View
                        </button>
                        {ticket.status === 'RESOLVED' && (
                          <button
                            className="btn btn-xs btn-success"
                            onClick={() => {
                              setSelectedTicket(ticket);
                              setShowConfirmModal(true);
                            }}
                          >
                            Confirm
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

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-4xl">
            <h3 className="font-bold text-lg mb-4">Create New Ticket</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Title *</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  placeholder="Brief description of issue"
                  value={newTicket.title}
                  onChange={(e) => setNewTicket({...newTicket, title: e.target.value})}
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Category</span>
                </label>
                <select
                  className="select select-bordered"
                  value={newTicket.category}
                  onChange={(e) => setNewTicket({...newTicket, category: e.target.value})}
                >
                  <option value="HARDWARE">Hardware</option>
                  <option value="SOFTWARE">Software</option>
                  <option value="NETWORK">Network</option>
                  <option value="FACILITY">Facility</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Priority</span>
                </label>
                <select
                  className="select select-bordered"
                  value={newTicket.priority}
                  onChange={(e) => setNewTicket({...newTicket, priority: e.target.value})}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Resource (Optional)</span>
                </label>
                <select
                  className="select select-bordered"
                  value={newTicket.resourceId}
                  onChange={(e) => handleResourceChange(e.target.value)}
                >
                  <option value="">Select a resource (if applicable)</option>
                  {resources.map((resource) => (
                    <option key={resource.id} value={resource.id}>
                      {resource.name} - {resource.type} ({resource.location})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Location</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  placeholder="Where is issue located?"
                  value={newTicket.location}
                  onChange={(e) => handleLocationChange(e.target.value)}
                />
                {newTicket.resourceId && (
                  <label className="label">
                    <span className="label-text-alt text-xs text-info">
                      Auto-filled from selected resource
                    </span>
                  </label>
                )}
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Contact Details</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  placeholder="Phone number or email for contact"
                  value={newTicket.contactDetails}
                  onChange={(e) => setNewTicket({...newTicket, contactDetails: e.target.value})}
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Preferred Contact Method</span>
                </label>
                <select
                  className="select select-bordered"
                  value={newTicket.preferredContactMethod}
                  onChange={(e) => setNewTicket({...newTicket, preferredContactMethod: e.target.value})}
                >
                  <option value="EMAIL">Email</option>
                  <option value="PHONE">Phone</option>
                  <option value="SMS">SMS</option>
                  <option value="IN_PERSON">In Person</option>
                </select>
              </div>
            </div>
            <div className="form-control mt-4">
              <label className="label">
                <span className="label-text">Description *</span>
              </label>
              <textarea
                className="textarea textarea-bordered h-24"
                placeholder="Detailed description of issue..."
                value={newTicket.description}
                onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
              ></textarea>
            </div>
            <div className="form-control mt-4">
              <label className="label">
                <span className="label-text">Attachments (Max 3 images, 5MB each)</span>
              </label>
              <input
                type="file"
                className="file-input file-input-bordered"
                multiple
                accept="image/*"
                onChange={handleFileChange}
              />
              {attachmentPreviews.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm font-medium mb-2">Selected files:</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {attachmentPreviews.map((preview, index) => (
                      <div key={index} className="card bg-base-100 shadow-sm">
                        <figure className="h-32">
                          <img
                            src={preview.url}
                            alt={preview.name}
                            className="w-full h-full object-cover rounded-t-lg"
                          />
                        </figure>
                        <div className="card-body p-2">
                          <div className="text-xs truncate font-medium">{preview.name}</div>
                          <div className="text-xs text-base-content/60">
                            {(preview.size / 1024 / 1024).toFixed(2)} MB
                          </div>
                          <button
                            className="btn btn-xs btn-error btn-outline mt-1"
                            onClick={() => {
                              const newAttachments = attachments.filter((_, i) => i !== index);
                              const newPreviews = attachmentPreviews.filter((_, i) => i !== index);
                              setAttachments(newAttachments);
                              setAttachmentPreviews(newPreviews);
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-action">
              <button className="btn" onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={handleCreateTicket}
                disabled={!newTicket.title.trim() || !newTicket.description.trim()}
              >
                Create Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-2xl">
            <h3 className="font-bold text-lg mb-4">Ticket Details</h3>
            <div className="space-y-4">
              <div><strong>ID:</strong> #{selectedTicket.id}</div>
              <div><strong>Title:</strong> {selectedTicket.title}</div>
              <div><strong>Category:</strong> {selectedTicket.category}</div>
              <div><strong>Priority:</strong> {selectedTicket.priority}</div>
              <div><strong>Status:</strong> {selectedTicket.status}</div>
              <div><strong>Description:</strong> {selectedTicket.description}</div>
              <div><strong>Created:</strong> {new Date(selectedTicket.createdAt).toLocaleString()}</div>
              <div><strong>Resource:</strong> {selectedTicket.resourceId ? (
                <span className="badge badge-outline">
                  {resources.find(r => r.id === selectedTicket.resourceId)?.name || 'Unknown Resource'}
                </span>
              ) : (
                <span className="text-gray-400">N/A</span>
              )}</div>
            </div>
            <div className="modal-action">
              <button className="btn" onClick={() => setSelectedTicket(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Resolution Modal */}
      {showConfirmModal && selectedTicket && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-md">
            <h3 className="font-bold text-lg mb-4">Confirm Resolution</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Please confirm that issue has been resolved to your satisfaction.
              </p>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Feedback (Optional)</span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-20"
                  placeholder="Any additional feedback about resolution..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                ></textarea>
              </div>
            </div>
            <div className="modal-action">
              <button className="btn" onClick={() => setShowConfirmModal(false)}>Cancel</button>
              <button
                className="btn btn-success"
                onClick={handleConfirmResolution}
              >
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserTicketsPage;
