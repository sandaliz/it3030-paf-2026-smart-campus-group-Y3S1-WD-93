import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Booking API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Booking API service
export const bookingService = {
  // Create a new booking
  createBooking: async (bookingData) => {
    try {
      console.log('Creating booking with data:', bookingData);
      const response = await api.post('/api/bookings', bookingData);
      console.log('Booking creation response:', response);
      return response.data;
    } catch (error) {
      console.error('Booking creation error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
      throw error;
    }
  },

  // Get user's bookings
  getMyBookings: async () => {
    const response = await api.get('/api/bookings/my-bookings');
    return response.data;
  },

  // Get all bookings (admin only)
  getAllBookings: async (filters = {}) => {
    const response = await api.get('/api/bookings/admin/all', {
      params: filters
    });
    return response.data;
  },

  // Get booking by ID
  getBookingById: async (bookingId) => {
    const response = await api.get(`/api/bookings/${bookingId}`);
    return response.data;
  },

  // Get bookings by date range
  getBookingsByDateRange: async (startDate, endDate) => {
    const response = await api.get('/api/bookings/date-range', {
      params: { startDate, endDate }
    });
    return response.data;
  },

  // Update booking (full update)
  updateBooking: async (bookingId, updateData) => {
    const response = await api.put(`/api/bookings/${bookingId}`, updateData);
    return response.data;
  },

  // Partial update booking
  partialUpdateBooking: async (bookingId, updateData) => {
    const response = await api.patch(`/api/bookings/${bookingId}`, updateData);
    return response.data;
  },

  // Update booking status (admin only)
  updateBookingStatus: async (bookingId, status, reason) => {
    const response = await api.patch(`/api/bookings/admin/${bookingId}/status`, {
      status,
      reason
    });
    return response.data;
  },

  // Reschedule booking
  rescheduleBooking: async (bookingId, newDate, newStartTime, newEndTime) => {
    const response = await api.patch(`/api/bookings/${bookingId}/reschedule`, null, {
      params: {
        newDate,
        newStartTime,
        newEndTime
      }
    });
    return response.data;
  },

  // Update booking details
  updateBookingDetails: async (bookingId, purpose, expectedAttendees) => {
    const response = await api.patch(`/api/bookings/${bookingId}/details`, null, {
      params: {
        purpose,
        expectedAttendees
      }
    });
    return response.data;
  },

  // Cancel booking
  cancelBooking: async (bookingId) => {
    await api.delete(`/api/bookings/${bookingId}`);
  },

  // Permanent delete booking (admin only)
  permanentDeleteBooking: async (bookingId) => {
    await api.delete(`/api/bookings/admin/${bookingId}/permanent`);
  },

  // Delete all user bookings (admin only)
  deleteAllUserBookings: async (userId) => {
    await api.delete(`/api/bookings/admin/user/${userId}/bookings`);
  },

  // Delete all cancelled bookings (admin only)
  deleteAllCancelledBookings: async () => {
    const response = await api.delete('/api/bookings/admin/cleanup/cancelled');
    return response.data;
  },

  // Check availability
  checkAvailability: async (resourceId, date, startTime, endTime) => {
    const response = await api.get('/api/bookings/check-availability', {
      params: {
        resourceId,
        date,
        startTime,
        endTime
      }
    });
    return response.data;
  },

  // Get available time slots
  getAvailableTimeSlots: async (resourceId, date) => {
    const response = await api.get('/api/bookings/available-slots', {
      params: {
        resourceId,
        date
      }
    });
    return response.data;
  },

  // Get resource bookings
  getResourceBookings: async (resourceId, date) => {
    const response = await api.get(`/api/bookings/resource/${resourceId}`, {
      params: { date }
    });
    return response.data;
  },

  // Get available resources
  getAvailableResources: async (filters = {}) => {
    const response = await api.get('/api/bookings/available-resources', {
      params: filters
    });
    return response.data;
  },

  // Get booking statistics (admin only)
  getBookingStatistics: async () => {
    const response = await api.get('/api/bookings/admin/stats');
    return response.data;
  },

  // Get paginated bookings (admin only)
  getPaginatedBookings: async (page = 0, size = 10, filters = {}) => {
    const response = await api.get('/api/bookings/admin/paginated', {
      params: {
        page,
        size,
        ...filters
      }
    });
    return response.data;
  },

  // Bulk update booking status (admin only)
  bulkUpdateBookingStatus: async (bookingIds, status, reason) => {
    const response = await api.patch('/api/bookings/admin/bulk-status', {
      bookingIds,
      status,
      reason
    });
    return response.data;
  },

  // Get booking conflicts (admin only)
  getBookingConflicts: async (startDate, endDate) => {
    const response = await api.get('/api/bookings/admin/conflicts', {
      params: {
        startDate,
        endDate
      }
    });
    return response.data;
  },

  // Export bookings to CSV (admin only)
  exportBookings: async (filters = {}) => {
    const response = await api.get('/api/bookings/admin/export', {
      params: filters,
      responseType: 'blob'
    });
    return response.data;
  },

  // Get resource utilization report (admin only)
  getResourceUtilization: async (startDate, endDate) => {
    const response = await api.get('/api/bookings/admin/utilization', {
      params: {
        startDate,
        endDate
      }
    });
    return response.data;
  },

  // Get user booking history (admin only)
  getUserBookingHistory: async (userId, page = 0, size = 10) => {
    const response = await api.get(`/api/bookings/admin/user/${userId}/history`, {
      params: {
        page,
        size
      }
    });
    return response.data;
  },

  // Create recurring bookings (admin only)
  createRecurringBookings: async (bookingRequests) => {
    const response = await api.post('/api/bookings/admin/recurring', {
      bookings: bookingRequests
    });
    return response.data;
  }
};

export default bookingService;
