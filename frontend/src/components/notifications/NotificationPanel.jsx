import React, { useState, useEffect } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import axios from 'axios';

/**
 * Notification Panel dropdown component
 */
const NotificationPanel = () => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [showAll, setShowAll] = useState(false);
    const { 
        fetchUnreadCount, 
        userBookings, 
        userTickets, 
        loading, 
        markAsRead, 
        markAllAsRead, 
        isNotificationRead,
        getTotalUnreadCount,
        reactiveCount,
        currentCount,
        refreshNotifications
    } = useNotifications();

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);

    const fetchNotifications = async () => {
        try {
            const response = await axios.get('/api/notifications');
            if (response.data) {
                setNotifications(response.data.slice(0, 15)); // Show 10-15 most recent
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const handleMarkAsRead = async (notificationId) => {
        try {
            await axios.put(`/api/notifications/${notificationId}/read`);
            setNotifications(prev => 
                prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
            );
            fetchUnreadCount(); // Update badge count
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await axios.put('/api/notifications/read-all');
            setNotifications(prev => 
                prev.map(n => ({ ...n, isRead: true }))
            );
            fetchUnreadCount(); // Update badge count
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'BOOKING_APPROVED':
                return '🟢';
            case 'BOOKING_REJECTED':
                return '🔴';
            case 'TICKET_ASSIGNED':
                return '📋';
            case 'TICKET_STATUS_CHANGED':
                return '🔄';
            case 'NEW_COMMENT':
                return '💬';
            default:
                return '📢';
        }
    };

    const createBookingNotification = (booking) => ({
        id: `booking-${booking.id}`,
        type: 'USER_BOOKING',
        title: `Booking: ${booking.resourceName}`,
        message: `${booking.date} - ${booking.startTime} to ${booking.endTime}`,
        createdAt: booking.createdAt || new Date().toISOString(),
        isRead: isNotificationRead(`booking-${booking.id}`),
        data: booking
    });

    const createTicketNotification = (ticket) => ({
        id: `ticket-${ticket.id}`,
        type: 'USER_TICKET',
        title: `Ticket: ${ticket.title}`,
        message: `Status: ${ticket.status} | Priority: ${ticket.priority}`,
        createdAt: ticket.createdAt || new Date().toISOString(),
        isRead: isNotificationRead(`ticket-${ticket.id}`),
        data: ticket
    });

    const getAllNotifications = () => {
        const allNotifications = [...notifications];
        
        // Add bookings (all if showAll is true, otherwise last 5)
        const bookingsToShow = showAll ? userBookings : userBookings.slice(0, 5);
        const bookingNotifications = bookingsToShow.map(createBookingNotification);
        allNotifications.push(...bookingNotifications);
        
        // Add tickets (all if showAll is true, otherwise last 5)
        const ticketsToShow = showAll ? userTickets : userTickets.slice(0, 5);
        const ticketNotifications = ticketsToShow.map(createTicketNotification);
        allNotifications.push(...ticketNotifications);
        
        // Sort by creation date (most recent first)
        return allNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    };

    
    return (
        <div className="bg-base-100 rounded-lg shadow-lg w-80">
            <div className="p-4 border-b border-base-200">
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-base-content">Notifications</h3>
                        {currentCount > 0 && (
                            <span className="badge badge-primary badge-sm">
                                {currentCount}
                            </span>
                        )}
                    </div>
                    <button 
                        onClick={() => setIsOpen(false)}
                        className="text-base-content/70 hover:text-base-content/100"
                    >
                        ×
                    </button>
                </div>
            </div>
            
            <div className={`${showAll ? 'max-h-96' : 'max-h-60'} overflow-y-auto`}>
                {loading ? (
                    <div className="p-4 text-center text-base-content/70">
                        <span className="loading loading-spinner loading-sm"></span>
                        <p className="mt-2">Loading notifications...</p>
                    </div>
                ) : getAllNotifications().length === 0 ? (
                    <div className="p-4 text-center text-base-content/70">
                        <p>No notifications</p>
                    </div>
                ) : (
                    getAllNotifications().map((notification, index) => (
                        <div 
                            key={notification.id}
                            className={`p-3 border-b border-base-200 hover:bg-base-50 transition-colors ${
                                notification.isRead ? 'opacity-60' : ''
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <span className="text-lg">
                                    {notification.type === 'USER_BOOKING' ? '??' : 
                                     notification.type === 'USER_TICKET' ? '??' :
                                     getNotificationIcon(notification.type)}
                                </span>
                                <div className="flex-1">
                                    <p className={`font-medium text-sm ${
                                        notification.isRead ? 'text-base-content/70' : 'text-base-content font-medium'
                                    }`}>
                                        {notification.title}
                                    </p>
                                    <p className={`text-xs mt-1 ${
                                        notification.isRead ? 'text-base-content/50' : 'text-base-content/80'
                                    }`}>
                                        {notification.message}
                                    </p>
                                    <p className="text-xs text-base-content/500">
                                        {formatTime(notification.createdAt)}
                                    </p>
                                </div>
                                {!notification.isRead && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (notification.type === 'USER_BOOKING' || notification.type === 'USER_TICKET') {
                                                markAsRead(notification.id);
                                                // Don't refresh - let the hook handle count updates
                                            } else {
                                                handleMarkAsRead(notification.id);
                                            }
                                        }}
                                        className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
                                    >
                                        Mark as read
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
            
            <div className="p-3 border-t border-base-200">
                <div className="flex gap-2">
                    <button 
                        onClick={() => {
                            handleMarkAllAsRead();
                            markAllAsRead();
                            // Don't refresh - let the hook handle count updates
                        }}
                        className="btn btn-sm btn-primary flex-1"
                    >
                        Mark all as read
                    </button>
                    <button 
                        onClick={() => setShowAll(!showAll)}
                        className="btn btn-sm btn-outline flex-1"
                    >
                        {showAll ? 'Show less' : 'View all'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotificationPanel;
