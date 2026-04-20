import React, { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import { ticketService } from '../../services/ticketService';
import { Link } from 'react-router-dom';

const AssignResourceStaffModal = ({ isOpen, resource, onClose, onAssign }) => {
  const [description, setDescription] = useState('');
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDescription('');
      fetchTickets();
    }
  }, [isOpen, resource?.id]);

  const fetchTickets = async () => {
    if (!resource?.id) return;
    
    try {
      setLoadingTickets(true);
      const data = await ticketService.getTicketsByResourceId(resource.id);
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setTickets([]);
    } finally {
      setLoadingTickets(false);
    }
  };

  const getStatusColor = (status) => {
    if (!status) return 'badge-neutral';
    switch (status) {
      case 'OPEN': return 'badge-info';
      case 'IN_PROGRESS': return 'badge-warning';
      case 'RESOLVED': return 'badge-success';
      case 'CLOSED': return 'badge-neutral';
      case 'REJECTED': return 'badge-error';
      default: return 'badge-neutral';
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onAssign([], description);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Resource Management Ticket" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl border border-info/20 bg-info/5 p-4 text-sm">
          <p className="font-semibold">Resource: {resource?.name}</p>
          <p className="mt-1 text-base-content/70">{resource?.description}</p>
          <p className="mt-1 text-base-content/60">Location: {resource?.location || 'N/A'}</p>
        </div>

        {/* Existing Tickets Section */}
        <div className="rounded-xl border border-base-300 bg-base-100 p-4">
          <h4 className="font-semibold mb-3">Existing Tickets</h4>
          {loadingTickets ? (
            <div className="flex justify-center py-4">
              <span className="loading loading-spinner loading-md"></span>
            </div>
          ) : tickets.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {tickets.map(ticket => (
                <div key={ticket.id} className="border border-base-200 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-medium text-sm">{ticket.title}</h5>
                    <span className={`badge badge-xs ${ticket.category === 'RESOURCE_MANAGEMENT' ? 'badge-info' : 'badge-neutral'}`}>
                      {ticket.category}
                    </span>
                  </div>
                  <p className="text-xs text-base-content/70 mb-2 line-clamp-2">{ticket.description}</p>
                  <div className="flex gap-2 text-xs mb-2">
                    <span className={`badge badge-xs ${getStatusColor(ticket.status)}`}>{ticket.status}</span>
                    <span className="badge badge-xs badge-outline">{ticket.priority}</span>
                    <span className="text-base-content/60">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>
                  <Link
                    to={`/tickets/${ticket.id}`}
                    className="btn btn-xs btn-primary"
                    onClick={() => onClose()}
                  >
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-base-content/60">No tickets found for this resource.</p>
          )}
        </div>

        {/* Create New Ticket Section */}
        <div className="border-t border-base-300 pt-4">
          <h4 className="font-semibold mb-3">Create New Ticket</h4>
          <div className="rounded-xl border border-base-300 bg-base-100 p-4">
            <label className="text-sm font-semibold block mb-2">Ticket Description</label>
            <textarea
              className="textarea textarea-bordered w-full"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Add details about the resource assignment request..."
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" className="btn btn-ghost flex-1" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary flex-1"
          >
            Create Ticket
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AssignResourceStaffModal;
