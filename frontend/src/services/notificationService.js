import api from './axiosInstance';

// Notification Service
export const notificationService = {
  // Get notification analytics for admin dashboard
  getNotificationAnalytics: async (timeRange = '30d') => {
    const response = await api.get(`/api/notifications/analytics?timeRange=${timeRange}`);
    return response.data;
  },

  // Get all notifications for current user
  getAllNotifications: async () => {
    const response = await api.get('/api/notifications');
    return response.data;
  },

  // Get unread notifications count
  getUnreadCount: async () => {
    const response = await api.get('/api/notifications/unread-count');
    return response.data;
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    const response = await api.put(`/api/notifications/${notificationId}/read`);
    return response.data;
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await api.put('/api/notifications/read-all');
    return response.data;
  },

  // Delete notification
  deleteNotification: async (notificationId) => {
    const response = await api.delete(`/api/notifications/${notificationId}`);
    return response.data;
  }
};
