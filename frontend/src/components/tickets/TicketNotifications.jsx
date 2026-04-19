import React, { useState, useEffect, useRef } from 'react';
import { ticketService } from '../../services/ticketService';

const TicketNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const dropdownRef = useRef(null);

  // Get read notifications from localStorage
  const getReadNotifications = () => {
    const stored = localStorage.getItem('readTicketNotifications');
    return stored ? JSON.parse(stored) : [];
  };

  // Save read notifications to localStorage
  const saveReadNotifications = (readIds) => {
    localStorage.setItem('readTicketNotifications', JSON.stringify(readIds));
  };

  // Clean up stored read notifications to only include OPEN tickets
  const cleanupReadNotifications = async () => {
    const readNotificationIds = getReadNotifications();
    if (readNotificationIds.length === 0) return;

    try {
      // Get all OPEN tickets to check which stored IDs are still valid OPEN tickets
      const allTickets = await ticketService.getAllTickets({ status: 'OPEN' });
      const tickets = allTickets.content || allTickets;
      const openTickets = Array.isArray(tickets) 
        ? tickets.filter(ticket => ticket.status === 'OPEN')
        : [];
      
      const openTicketIds = openTickets.map(ticket => ticket.id);
      
      // Keep only read notifications that are still OPEN tickets
      const validReadNotifications = readNotificationIds.filter(id => 
        openTicketIds.includes(id)
      );
      
      // Update localStorage with cleaned list
      if (validReadNotifications.length !== readNotificationIds.length) {
        saveReadNotifications(validReadNotifications);
      }
    } catch (err) {
      console.error('Failed to cleanup read notifications:', err);
    }
  };

  // Fetch in-progress tickets notifications
  const fetchNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const allTickets = await ticketService.getAllTickets({ status: 'OPEN' });
      const tickets = allTickets.content || allTickets;
      
      // Additional client-side filtering to ensure only OPEN tickets
      const openTickets = Array.isArray(tickets) 
        ? tickets.filter(ticket => ticket.status === 'OPEN')
        : [];
      
      // Apply read status from localStorage
      const readNotificationIds = getReadNotifications();
      const notificationsWithReadStatus = openTickets.map(ticket => ({
        ...ticket,
        read: readNotificationIds.includes(ticket.id)
      }));
      
      setNotifications(notificationsWithReadStatus);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initial fetch and refresh
  useEffect(() => {
    // Clean up stored read notifications first, then fetch
    cleanupReadNotifications().then(() => {
      fetchNotifications();
    });
    
    // Set up polling for real-time updates (every 30 seconds)
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handle assign ticket from notification
  const handleAssign = async (ticketId) => {
    try {
      // Navigate to ticket management with the specific ticket selected
      window.location.href = `/admin/ticket-management?assign=${ticketId}`;
    } catch (err) {
      console.error('Failed to assign ticket:', err);
      setError('Failed to assign ticket');
    }
  };

  // Handle reject ticket from notification
  const handleReject = async (ticketId, reason = 'Rejected via notification') => {
    try {
      await ticketService.updateStatus(ticketId, 'REJECTED', reason);
      await fetchNotifications(); // Refresh notifications
    } catch (err) {
      console.error('Failed to reject ticket:', err);
      setError('Failed to reject ticket');
    }
  };

  // Mark individual notification as read
  const markAsRead = (notificationId) => {
    const readNotificationIds = getReadNotifications();
    if (!readNotificationIds.includes(notificationId)) {
      readNotificationIds.push(notificationId);
      saveReadNotifications(readNotificationIds);
    }
    
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    );
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    const allNotificationIds = notifications.map(notif => notif.id);
    saveReadNotifications(allNotificationIds);
    
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  // Format date and time
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const dateObj = new Date(dateString);
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'LOW': return 'text-success';
      case 'MEDIUM': return 'text-warning';
      case 'HIGH': return 'text-error';
      case 'CRITICAL': return 'text-error font-bold';
      default: return 'text-neutral';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell */}
      <button
        className="btn btn-ghost btn-circle relative"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Ticket Notifications"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
          />
        </svg>
        
        {/* Notification Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-base-100 rounded-lg shadow-lg border border-base-300 z-50">
          {/* Header */}
          <div className="p-4 border-b border-base-300">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Open Tickets</h3>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <button
                    className="btn btn-xs btn-ghost"
                    onClick={markAllAsRead}
                  >
                    Mark all as read
                  </button>
                )}
                <button
                  className="btn btn-xs btn-ghost"
                  onClick={fetchNotifications}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {error && (
              <div className="p-4">
                <div className="alert alert-error">
                  <span>{error}</span>
                </div>
              </div>
            )}
            
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center">
                <span className="loading loading-spinner loading-md"></span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-base-content/60">
                <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                  />
                </svg>
                <p>No open tickets</p>
              </div>
            ) : (
              <div className="divide-y divide-base-300">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-base-200 transition-colors ${
                      !notification.read ? 'bg-base-200/50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm">#{notification.id} - {notification.title}</h4>
                          {!notification.read && (
                            <span className="w-2 h-2 rounded-full bg-primary"></span>
                          )}
                        </div>
                        <p className="text-xs text-base-content/70 mb-1">
                          User: {notification.userName || 'Unknown'}
                        </p>
                        <p className="text-xs text-base-content/60 mb-2">
                          {formatDateTime(notification.createdAt)}
                        </p>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs badge badge-outline">
                            {notification.category}
                          </span>
                          <span className={`text-xs font-semibold ${getPriorityColor(notification.priority)}`}>
                            {notification.priority}
                          </span>
                        </div>
                        <p className="text-sm line-clamp-2 mb-3">
                          {notification.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <button
                          className="btn btn-xs btn-primary"
                          onClick={() => handleAssign(notification.id)}
                        >
                          Assign
                        </button>
                        <button
                          className="btn btn-xs btn-error"
                          onClick={() => handleReject(notification.id)}
                        >
                          Reject
                        </button>
                      </div>
                      
                      {!notification.read && (
                        <button
                          className="btn btn-xs btn-ghost"
                          onClick={() => markAsRead(notification.id)}
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-base-300">
              <button
                className="btn btn-sm btn-primary w-full"
                onClick={() => {
                  window.location.href = '/admin/ticket-management';
                }}
              >
                View All Tickets
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TicketNotifications;
