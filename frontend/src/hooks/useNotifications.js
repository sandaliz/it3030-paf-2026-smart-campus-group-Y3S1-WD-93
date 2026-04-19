import { useState, useEffect } from 'react';
import axios from 'axios';
import { bookingService } from '../services/bookingService';
import { ticketService } from '../services/ticketService';

/**
 * Custom hook for managing notifications and real-time updates
 */
export const useNotifications = () => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [userBookings, setUserBookings] = useState([]);
    const [userTickets, setUserTickets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentCount, setCurrentCount] = useState(0);
    
    // Load read notifications from localStorage on mount
    const [readNotifications, setReadNotifications] = useState(() => {
        const saved = localStorage.getItem('readNotifications');
        return saved ? new Set(JSON.parse(saved)) : new Set();
    });

    useEffect(() => {
        // Fetch initial data
        fetchNotificationData();

        // Set up polling for real-time updates
        const interval = setInterval(() => {
            fetchNotificationData();
        }, 30000); // Poll every 30 seconds

        return () => clearInterval(interval);
    }, []);

    // Save readNotifications to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('readNotifications', JSON.stringify([...readNotifications]));
    }, [readNotifications]);

    const fetchNotificationData = async () => {
        setLoading(true);
        try {
            // Fetch user bookings
            const bookings = await bookingService.getMyBookings();
            setUserBookings(bookings || []);

            // Fetch user tickets
            const tickets = await ticketService.getMyTickets();
            setUserTickets(tickets?.content || tickets || []);

            // Fetch unread count after bookings and tickets are updated
            const unreadResponse = await axios.get('/api/notifications/unread-count');
            if (unreadResponse.data && unreadResponse.data.count !== undefined) {
                // Calculate actual unread count considering local read state
                const bookingUnread = (Array.isArray(bookings) ? bookings : []).filter(b => !readNotifications.has(`booking-${b.id}`)).length;
                const ticketUnread = (Array.isArray(tickets) ? tickets : []).filter(t => !readNotifications.has(`ticket-${t.id}`)).length;
                const actualCount = unreadResponse.data.count + bookingUnread + ticketUnread;
                setUnreadCount(actualCount);
            }
        } catch (error) {
            console.error('Error fetching notification data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const response = await axios.get('/api/notifications/unread-count');
            if (response.data && response.data.count !== undefined) {
                // Calculate actual unread count considering local read state
                const bookingUnread = (Array.isArray(userBookings) ? userBookings : []).filter(b => !readNotifications.has(`booking-${b.id}`)).length;
                const ticketUnread = (Array.isArray(userTickets) ? userTickets : []).filter(t => !readNotifications.has(`ticket-${t.id}`)).length;
                const actualCount = response.data.count + bookingUnread + ticketUnread;
                setUnreadCount(actualCount);
            }
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    const markAsRead = (notificationId) => {
        setReadNotifications(prev => {
            const newSet = new Set([...prev, notificationId]);
            return newSet;
        });
    };

    const markAllAsRead = async () => {
        // Mark user bookings and tickets as read
        const allIds = [
            ...userBookings.map(b => `booking-${b.id}`),
            ...userTickets.map(t => `ticket-${t.id}`)
        ];
        setReadNotifications(new Set(allIds));
        
        // Immediately update reactive count for instant UI feedback
        setReactiveCount(0);
        
        // Also mark regular notifications as read via API
        try {
            await axios.put('/api/notifications/read-all');
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    const getTotalUnreadCount = () => {
        const bookingUnread = (Array.isArray(userBookings) ? userBookings : []).filter(b => !readNotifications.has(`booking-${b.id}`)).length;
        const ticketUnread = (Array.isArray(userTickets) ? userTickets : []).filter(t => !readNotifications.has(`ticket-${t.id}`)).length;
        return unreadCount + bookingUnread + ticketUnread;
    };

    // Create a reactive count that updates when dependencies change
    const [reactiveCount, setReactiveCount] = useState(0);
    
    useEffect(() => {
        const bookingUnread = (Array.isArray(userBookings) ? userBookings : []).filter(b => !readNotifications.has(`booking-${b.id}`)).length;
        const ticketUnread = (Array.isArray(userTickets) ? userTickets : []).filter(t => !readNotifications.has(`ticket-${t.id}`)).length;
        const totalCount = unreadCount + bookingUnread + ticketUnread;
        setReactiveCount(totalCount);
    }, [unreadCount, userBookings, userTickets, readNotifications]);

    const refreshNotifications = async () => {
        await fetchNotificationData();
    };

    const isNotificationRead = (notificationId) => {
        return readNotifications.has(notificationId);
    };

    return { 
        unreadCount, 
        userBookings,
        userTickets,
        loading,
        readNotifications,
        fetchUnreadCount,
        fetchNotificationData,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
        getTotalUnreadCount,
        reactiveCount,
        currentCount,
        isNotificationRead
    };
};

export default useNotifications;
