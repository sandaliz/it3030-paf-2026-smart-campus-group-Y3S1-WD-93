import api from './axiosInstance';

// Google Calendar API service
export const googleCalendarService = {
  // Add a booking to Google Calendar
  addBookingToCalendar: async (bookingId, googleAccessToken) => {
    try {
      const response = await api.post(`/api/calendar/add-booking/${bookingId}`, null, {
        headers: {
          'X-Google-Access-Token': googleAccessToken,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error adding booking to calendar:', error);
      throw error;
    }
  },

  // Sync all bookings to Google Calendar
  syncAllBookingsToCalendar: async (googleAccessToken) => {
    try {
      const response = await api.post('/api/calendar/sync-all', null, {
        headers: {
          'X-Google-Access-Token': googleAccessToken,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error syncing bookings to calendar:', error);
      throw error;
    }
  },

  // Get calendar events for date range
  getCalendarEvents: async (startDate, endDate, googleAccessToken) => {
    try {
      const response = await api.get('/api/calendar/events', {
        params: { startDate, endDate },
        headers: {
          'X-Google-Access-Token': googleAccessToken,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error getting calendar events:', error);
      throw error;
    }
  },

  // Remove a booking from Google Calendar
  removeBookingFromCalendar: async (bookingId, googleAccessToken) => {
    try {
      const response = await api.delete(`/api/calendar/remove-booking/${bookingId}`, {
        headers: {
          'X-Google-Access-Token': googleAccessToken,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error removing booking from calendar:', error);
      throw error;
    }
  },

  // Get Google OAuth URL for calendar access
  getGoogleAuthUrl: () => {
    const clientId =
      import.meta.env.VITE_GOOGLE_CALENDAR_CLIENT_ID ||
      import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/calendar/callback`;
    const scope = 'https://www.googleapis.com/auth/calendar';

    if (!clientId) {
      throw new Error('Google Calendar client ID is not configured');
    }
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scope)}&` +
      `access_type=offline&` +
      `prompt=consent`;
    
    return authUrl;
  },

  // Exchange authorization code for access token
  exchangeCodeForToken: async (code) => {
    try {
      const response = await api.post('/api/auth/calendar/token', { code });
      return response.data;
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      throw error;
    }
  },

  // Store Google Calendar access token
  storeCalendarToken: (token) => {
    localStorage.setItem('googleCalendarToken', token);
  },

  // Get stored Google Calendar access token
  getCalendarToken: () => {
    return localStorage.getItem('googleCalendarToken');
  },

  // Clear Google Calendar access token
  clearCalendarToken: () => {
    localStorage.removeItem('googleCalendarToken');
  },

  // Check if Google Calendar is connected
  isCalendarConnected: () => {
    return !!localStorage.getItem('googleCalendarToken');
  },
};

export default googleCalendarService;
