import React, { useState, useEffect } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import axios from 'axios';

/**
 * Notification Panel dropdown component
 */
const NotificationPanel = () => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const { fetchUnreadCount } = useNotifications();

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

    return (
        <div className="bg-base-100 rounded-lg shadow-lg w-80">
            <div className="p-4 border-b border-base-200">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-base-content">Notifications</h3>
                    <button 
                        onClick={() => setIsOpen(false)}
                        className="text-base-content/70 hover:text-base-content/100"
                    >
                        ✕
                    </button>
                </div>
            </div>
            
            <div className="max-h-60 overflow-y-auto">
                {notifications.length === 0 ? (
                    <div className="p-4 text-center text-base-content/70">
                        <p>No notifications</p>
                    </div>
                ) : (
                    notifications.map((notification, index) => (
                        <div 
                            key={notification.id}
                            className={`p-3 border-b border-base-200 hover:bg-base-50 cursor-pointer transition-colors ${
                                notification.isRead ? 'opacity-60' : ''
                            }`}
                            onClick={() => handleMarkAsRead(notification.id)}
                        >
                            <div className="flex items-start gap-3">
                                <span className="text-lg">
                                    {getNotificationIcon(notification.type)}
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
                            </div>
                        </div>
                    ))
                )}
            </div>
            
            <div className="p-3 border-t border-base-200">
                <div className="flex gap-2">
                    <button 
                        onClick={handleMarkAllAsRead}
                        className="btn btn-sm btn-primary flex-1"
                    >
                        Mark all as read
                    </button>
                    <a 
                        href="/notifications" 
                        className="btn btn-sm btn-outline flex-1"
                    >
                        View all
                    </a>
                </div>
            </div>
        </div>
    );
};

export default NotificationPanel;
