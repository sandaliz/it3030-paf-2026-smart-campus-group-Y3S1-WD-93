import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import axios from 'axios';

const NotificationsPage = () => {
    const navigate = useNavigate();
    const [regularNotifications, setRegularNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const { 
        userBookings, 
        userTickets, 
        markAsRead, 
        markAllAsRead, 
        isNotificationRead,
        getTotalUnreadCount 
    } = useNotifications();

    useEffect(() => {
        fetchRegularNotifications();
    }, []);

    const fetchRegularNotifications = async () => {
        try {
            const response = await axios.get('/api/notifications');
            setRegularNotifications(response.data || []);
        } catch (error) {
            console.error('Error fetching regular notifications:', error);
            setRegularNotifications([]);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (notificationId, isRegular = false) => {
        if (isRegular) {
            try {
                await axios.put(`/api/notifications/${notificationId}/read`);
                setRegularNotifications(prev => 
                    prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
                );
            } catch (error) {
                console.error('Error marking notification as read:', error);
            }
        } else {
            markAsRead(notificationId);
        }
    };

    const handleMarkAllAsRead = async () => {
        await markAllAsRead();
        setRegularNotifications(prev => 
            prev.map(n => ({ ...n, isRead: true }))
        );
    };

    const getAllNotifications = () => {
        const bookingNotifications = userBookings.map(b => ({
            id: `booking-${b.id}`,
            type: 'USER_BOOKING',
            title: `Booking: ${b.resourceName || b.facilityName}`,
            message: `${b.date} - ${b.startTime} to ${b.endTime}`,
            createdAt: b.createdAt || new Date().toISOString(),
            icon: '&#x1f4c5;',
            isRead: isNotificationRead(`booking-${b.id}`),
            isRegular: false
        }));

        const ticketNotifications = userTickets.map(t => ({
            id: `ticket-${t.id}`,
            type: 'USER_TICKET',
            title: `Ticket: ${t.title}`,
            message: `Status: ${t.status} | Priority: ${t.priority}`,
            createdAt: t.createdAt || new Date().toISOString(),
            icon: '&#x1f39f;',
            isRead: isNotificationRead(`ticket-${t.id}`),
            isRegular: false
        }));

        const regular = regularNotifications.map(n => ({
            ...n,
            icon: getNotificationIcon(n.type),
            isRegular: true
        }));

        return [...bookingNotifications, ...ticketNotifications, ...regular]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'BOOKING_APPROVED':
                return '&#x2705;';
            case 'BOOKING_REJECTED':
                return '&#x1f534;';
            case 'TICKET_ASSIGNED':
                return '&#x1f4cb;';
            case 'TICKET_STATUS_CHANGED':
                return '&#x1f504;';
            case 'NEW_COMMENT':
                return '&#x1f4ac;';
            default:
                return '&#x1f514;';
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-base-200 p-4 md:p-8 font-sans flex items-center justify-center">
                <div className="text-center">
                    <div className="loading loading-spinner loading-lg text-primary mb-4"></div>
                    <p className="text-lg font-bold">Loading notifications...</p>
                </div>
            </div>
        );
    }

    const allNotifications = getAllNotifications();
    const unreadCount = getTotalUnreadCount();

    return (
        <div className="min-h-screen bg-base-200 p-4 md:p-8 font-sans">
            <div className="max-w-4xl mx-auto">
                
                {/* Header */}
                <div className="bg-base-100 rounded-3xl shadow-xl border border-base-300 p-8 mb-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-4xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
                                All Notifications
                            </h1>
                            <p className="text-lg opacity-70">
                                {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All notifications read'}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => navigate(-1)}
                                className="btn btn-ghost border-base-300"
                            >
                                Back
                            </button>
                            {unreadCount > 0 && (
                                <button 
                                    onClick={handleMarkAllAsRead}
                                    className="btn btn-primary text-white"
                                >
                                    Mark All as Read
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Notifications List */}
                <div className="space-y-4">
                    {allNotifications.length > 0 ? (
                        allNotifications.map((notification) => (
                            <div 
                                key={notification.id}
                                className={`card bg-base-100 shadow-lg border border-base-300 hover:shadow-xl transition-all ${
                                    notification.isRead ? 'opacity-60' : ''
                                }`}
                            >
                                <div 
                                    className="card-body p-6 cursor-pointer"
                                    onClick={() => handleMarkAsRead(notification.id, notification.isRegular)}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-2xl shadow-inner border border-primary/20 flex-shrink-0">
                                            {notification.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className={`font-bold text-lg ${
                                                    notification.isRead ? 'text-base-content/70' : 'text-base-content'
                                                }`}>
                                                    {notification.title}
                                                </h3>
                                                <span className="text-xs text-base-content/50 font-mono whitespace-nowrap ml-4">
                                                    {formatTime(notification.createdAt)}
                                                </span>
                                            </div>
                                            <p className={`text-sm ${
                                                notification.isRead ? 'text-base-content/50' : 'text-base-content/80'
                                            }`}>
                                                {notification.message}
                                            </p>
                                            <div className="flex items-center gap-2 mt-3">
                                                <span className={`badge badge-outline text-xs ${
                                                    notification.type === 'USER_BOOKING' ? 'border-blue-300 text-blue-600' :
                                                    notification.type === 'USER_TICKET' ? 'border-purple-300 text-purple-600' :
                                                    'border-gray-300 text-gray-600'
                                                }`}>
                                                    {notification.type.replace('_', ' ')}
                                                </span>
                                                {!notification.isRead && (
                                                    <span className="badge badge-primary badge-xs text-white">NEW</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="card bg-base-100 shadow-lg border border-base-300">
                            <div className="card-body p-12 text-center">
                                <div className="text-6xl mb-4">&#x1f514;</div>
                                <h3 className="text-xl font-bold mb-2">No notifications</h3>
                                <p className="text-base-content/70">
                                    You're all caught up! No new notifications to show.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default NotificationsPage;
