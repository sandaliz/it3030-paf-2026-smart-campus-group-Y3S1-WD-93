import { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Custom hook for managing notifications and real-time updates
 */
export const useNotifications = () => {
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        // Fetch initial unread count
        fetchUnreadCount();

        // Set up polling for real-time updates
        const interval = setInterval(() => {
            fetchUnreadCount();
        }, 30000); // Poll every 30 seconds

        return () => clearInterval(interval);
    }, []);

    const fetchUnreadCount = async () => {
        try {
            const response = await axios.get('/api/notifications/unread-count');
            if (response.data && response.data.count !== undefined) {
                setUnreadCount(response.data.count);
            }
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    return { unreadCount, fetchUnreadCount };
};

export default useNotifications;
