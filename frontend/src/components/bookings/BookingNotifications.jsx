import React, { useState, useEffect, useRef } from 'react';
import { bookingService } from '../../services/bookingService';

const BookingNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const dropdownRef = useRef(null);

  // Fetch pending bookings notifications
  const fetchNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const pendingBookings = await bookingService.getAllBookings({ status: 'PENDING' });
      setNotifications(pendingBookings);
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
    fetchNotifications();
    
    // Set up polling for real-time updates (every 30 seconds)
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handle approve booking from notification
  const handleApprove = async (bookingId) => {
    try {
      await bookingService.updateBookingStatus(bookingId, 'APPROVED', 'Approved via notification');
      await fetchNotifications(); // Refresh notifications
    } catch (err) {
      console.error('Failed to approve booking:', err);
      setError('Failed to approve booking');
    }
  };

  // Handle reject booking from notification
  const handleReject = async (bookingId, reason = 'Rejected via notification') => {
    try {
      await bookingService.updateBookingStatus(bookingId, 'REJECTED', reason);
      await fetchNotifications(); // Refresh notifications
    } catch (err) {
      console.error('Failed to reject booking:', err);
      setError('Failed to reject booking');
    }
  };

  // Mark individual notification as read
  const markAsRead = (notificationId) => {
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
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  // Format date and time
  const formatDateTime = (date, time) => {
    if (!date) return 'N/A';
    const dateObj = new Date(date);
    const dateStr = dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    
    if (time) {
      const [hourText, minuteText] = time.split(':');
      const hour = Number(hourText);
      const period = hour >= 12 ? 'PM' : 'AM';
      const normalizedHour = hour % 12 || 12;
      return `${dateStr}, ${normalizedHour}:${minuteText} ${period}`;
    }
    
    return dateStr;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell */}
      <button
        className="btn btn-ghost btn-circle relative"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
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
              <h3 className="font-semibold text-lg">Pending Bookings</h3>
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
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" 
                  />
                </svg>
                <p>No pending bookings</p>
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
                          <h4 className="font-semibold text-sm">{notification.resourceName || 'Unknown Resource'}</h4>
                          {!notification.read && (
                            <span className="w-2 h-2 rounded-full bg-primary"></span>
                          )}
                        </div>
                        <p className="text-xs text-base-content/70 mb-1">
                          User: {notification.userId}
                        </p>
                        <p className="text-xs text-base-content/60 mb-2">
                          {formatDateTime(notification.date, notification.startTime)}
                        </p>
                        <p className="text-sm line-clamp-2 mb-3">
                          {notification.purpose}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <button
                          className="btn btn-xs btn-success"
                          onClick={() => handleApprove(notification.id)}
                        >
                          Approve
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
                  window.location.href = '/admin/booking-management';
                }}
              >
                View All Bookings
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BookingNotifications;
