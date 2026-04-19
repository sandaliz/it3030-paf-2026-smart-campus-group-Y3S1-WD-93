import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ticketService } from '../../services/ticketService';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/ui/StatusBadge';
import PriorityBadge from '../../components/ui/PriorityBadge';
import { PageLoader, CardSkeleton } from '../../components/ui/LoadingSkeleton';

const TicketListPage = () => {
  const navigate = useNavigate();
  const { hasRole, user } = useAuth();
  
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ status: '', priority: '' });

  const isAdmin = hasRole('ADMIN');
  const isTechnician = hasRole('TECHNICIAN');

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      let response;
      if (isAdmin) {
        response = await ticketService.getAllTickets(filters);
      } else if (isTechnician) {
        response = await ticketService.getAssignedTickets(filters);
      } else {
        response = await ticketService.getMyTickets(filters);
      }
      setTickets(response.content || response);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, isAdmin, isTechnician]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchTickets();
      return;
    }
    setLoading(true);
    try {
      const results = await ticketService.searchTickets(searchTerm);
      setTickets(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

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

  if (loading && tickets.length === 0) return <PageLoader />;

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      {/* Header */}
      <div className="hero bg-base-200 rounded-lg mb-6 p-6">
        <div className="hero-content flex justify-between w-full flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">Tickets</h1>
            <p className="text-base-content/70 mt-1">
              {isAdmin && 'Manage all support tickets'}
              {isTechnician && 'Tickets assigned to you'}
              {!isAdmin && !isTechnician && 'Your support requests'}
            </p>
          </div>
          <Link to="/tickets/create" className="btn btn-primary">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Ticket
          </Link>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="card bg-base-100 shadow-lg mb-6">
        <div className="card-body">
          <div className="join w-full">
            <input
              type="text"
              placeholder="Search by title, description, or location..."
              className="input input-bordered join-item flex-1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button className="btn btn-primary join-item" onClick={handleSearch}>
              Search
            </button>
            <button className="btn btn-outline join-item" onClick={() => setShowFilters(!showFilters)}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
              <select 
                className="select select-bordered"
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="">All Status</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
              
              <select 
                className="select select-bordered"
                value={filters.priority}
                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
              >
                <option value="">All Priorities</option>
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
              
              <div className="flex gap-2">
                <button className="btn btn-outline flex-1" onClick={() => {
                  setFilters({ status: '', priority: '' });
                  setSearchTerm('');
                }}>
                  Clear
                </button>
                <button className="btn btn-primary flex-1" onClick={() => {
                  setShowFilters(false);
                  fetchTickets();
                }}>
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tickets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && tickets.length === 0 ? (
          Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
        ) : tickets.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="text-6xl mb-4">🎫</div>
            <h3 className="text-xl font-semibold mb-2">No tickets found</h3>
            <p className="text-base-content/70 mb-4">Create your first ticket to get started</p>
            <Link to="/tickets/create" className="btn btn-primary">Create Ticket</Link>
          </div>
        ) : (
          tickets.map((ticket) => (
            <div 
              key={ticket.id} 
              className="card bg-base-100 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
              onClick={() => navigate(`/tickets/${ticket.id}`)}
            >
              <div className="card-body">
                <div className="flex justify-between items-start gap-2">
                  <h2 className="card-title text-lg line-clamp-1 group-hover:text-primary transition-colors">
                    {ticket.title}
                  </h2>
                  <PriorityBadge priority={ticket.priority} />
                </div>
                
                <p className="text-sm text-base-content/70 line-clamp-2 mt-2">
                  {ticket.description}
                </p>
                
                <div className="flex justify-between items-center mt-3">
                  <StatusBadge status={ticket.status} />
                  <span className="text-xs text-base-content/50">
                    {getTimeAgo(ticket.createdAt)}
                  </span>
                </div>
                
                {/* Show rejection reason for rejected tickets */}
                {ticket.status === 'REJECTED' && ticket.rejectionReason && (
                  <div className="mt-2 p-2 bg-error/10 rounded text-xs">
                    <span className="font-semibold text-error">Rejection Reason:</span> {ticket.rejectionReason}
                  </div>
                )}
                
                {/* Show technician details for in-progress tickets */}
                {ticket.status === 'IN_PROGRESS' && (
                  <div className="mt-2 p-2 bg-info/10 rounded text-xs">
                    <span className="font-semibold text-info">Assigned Technician:</span> {ticket.assignedToName || 'Not assigned'}
                    {ticket.assignedToName && ticket.contactDetails && (
                      <div className="mt-1">
                        <span className="font-semibold text-info">Contact:</span> {ticket.contactDetails}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Show resolution notes for resolved tickets */}
                {ticket.status === 'RESOLVED' && ticket.resolutionNotes && (
                  <div className="mt-2 p-2 bg-success/10 rounded text-xs">
                    <span className="font-semibold text-success">Resolution Notes:</span> {ticket.resolutionNotes}
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-xs text-base-content/60 mt-2 pt-2 border-t border-base-200">
                  <span className="badge badge-ghost badge-sm">{ticket.category}</span>
                  <span>•</span>
                  <span>{ticket.location}</span>
                </div>
                
                {ticket.assignedToName && (
                  <div className="text-xs text-base-content/50 mt-1 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {ticket.assignedToName}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TicketListPage;