import api from './axiosInstance';
import { bookingService } from './bookingService';
import { resourceService } from './resourceService';
import { ticketService, ticketAPI, authService, notificationService } from './ticketService';

/**
 * Central API facade that aggregates all domain-specific services.
 * This matches the interface expected by the frontend components.
 */
const apiFacade = {
  // --- Resource Methods ---
  getResources: async (paramsOrQuery) => {
    if (typeof paramsOrQuery === 'string') {
      // If it's a query string, use the base api instance directly or parse it
      const response = await api.get(`/api/resources/search${paramsOrQuery}`);
      return response.data;
    }
    // Default to getAllResources if no params, or search if params exist
    return paramsOrQuery ? resourceService.searchResources(paramsOrQuery) : resourceService.getAllResources();
  },
  getResource: (id) => resourceService.getResourceById(id),
  createResource: (data) => resourceService.createResource(data),
  updateResource: (id, data) => resourceService.updateResource(id, data),
  deleteResource: (id) => resourceService.deleteResource(id),
  partialUpdateResource: (id, data) => resourceService.updateResource(id, data), // Many components use this for status updates

  // --- Booking Methods ---
  getMyBookings: () => bookingService.getMyBookings(),
  createBooking: (data) => bookingService.createBooking(data),
  cancelBooking: (id) => bookingService.cancelBooking(id),
  getAvailableSlots: (resourceId, date) => bookingService.getAvailableTimeSlots(resourceId, date),
  
  getBookingsPaginated: async (paramsOrQuery) => {
    if (typeof paramsOrQuery === 'string') {
      const response = await api.get(`/api/bookings/admin/paginated${paramsOrQuery}`);
      return response.data;
    }
    return bookingService.getPaginatedBookings(paramsOrQuery.page, paramsOrQuery.size, paramsOrQuery);
  },
  bulkUpdateBookingStatus: (data) => bookingService.bulkUpdateBookingStatus(data.bookingIds, data.status, data.reason),
  exportBookings: async (paramsOrQuery) => {
    const url = typeof paramsOrQuery === 'string' 
      ? `/api/bookings/admin/export${paramsOrQuery}`
      : '/api/bookings/admin/export';
    const response = await api.get(url, {
      params: typeof paramsOrQuery === 'object' ? paramsOrQuery : {},
      responseType: 'blob'
    });
    return response.data;
  },

  // --- Ticket Methods ---
  ...ticketAPI,
  ...ticketService,

  // --- Auth Methods ---
  ...authService,

  // --- Notification Methods ---
  ...notificationService,

  // --- Direct Axios Access ---
  axios: api
};

export default apiFacade;
