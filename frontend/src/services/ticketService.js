import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================================
// TICKET SERVICE
// ============================================

export const ticketService = {
  // Get all tickets (Admin)
  getAllTickets: async (params = {}) => {
    const response = await api.get('/api/tickets', { params });
    return response.data;
  },

  // Get current user's tickets
  getMyTickets: async (params = {}) => {
    const response = await api.get('/api/tickets/my-tickets', { params });
    return response.data;
  },

  // Get tickets assigned to technician
  getAssignedTickets: async (params = {}) => {
    const response = await api.get('/api/tickets/assigned-to-me', { params });
    return response.data;
  },

  // Get single ticket
  getTicketById: async (id) => {
    const response = await api.get(`/api/tickets/${id}`);
    return response.data;
  },

  // Create ticket
  createTicket: async (formData) => {
    const response = await api.post('/api/tickets', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Update ticket status
  updateStatus: async (id, status, reason = '') => {
    const response = await api.patch(`/api/tickets/${id}/status`, { status, reason });
    return response.data;
  },

  // Assign technician
  assignTechnician: async (id, technicianId, technicianName) => {
    const response = await api.patch(`/api/tickets/${id}/assign`, null, {
      params: { technicianId, technicianName }
    });
    return response.data;
  },

  // Confirm resolution
  confirmResolution: async (id, feedback = '') => {
    const response = await api.patch(`/api/tickets/${id}/confirm`, { feedback });
    return response.data;
  },

  // Search tickets
  searchTickets: async (keyword, filters = {}) => {
    const response = await api.get('/api/tickets/search', {
      params: { keyword, ...filters }
    });
    return response.data;
  }
};

// ============================================
// COMMENT SERVICE
// ============================================

export const commentService = {
  getComments: async (ticketId) => {
    const response = await api.get(`/api/tickets/${ticketId}/comments`);
    return response.data;
  },

  addComment: async (ticketId, content, isInternal = false) => {
    const response = await api.post(`/api/tickets/${ticketId}/comments`, { content, isInternal });
    return response.data;
  },

  updateComment: async (ticketId, commentId, content) => {
    const response = await api.put(`/api/tickets/${ticketId}/comments/${commentId}`, { content });
    return response.data;
  },

  deleteComment: async (ticketId, commentId) => {
    await api.delete(`/api/tickets/${ticketId}/comments/${commentId}`);
  }
};

// ============================================
// ATTACHMENT SERVICE
// ============================================

export const attachmentService = {
  uploadAttachment: async (ticketId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/api/attachments/upload/${ticketId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  getAttachments: async (ticketId) => {
    const response = await api.get(`/api/attachments/ticket/${ticketId}`);
    return response.data;
  },

  deleteAttachment: async (attachmentId) => {
    await api.delete(`/api/attachments/${attachmentId}`);
  },

  getAttachmentContent: async (attachmentId) => {
    const response = await api.get(`/api/attachments/content/${attachmentId}`);
    return response.data;
  }
};

// ============================================
// NOTIFICATION SERVICE
// ============================================

export const notificationService = {
  getNotifications: async () => {
    const response = await api.get('/api/notifications');
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get('/api/notifications/unread/count');
    return response.data;
  },

  markAsRead: async (notificationId) => {
    await api.patch(`/api/notifications/${notificationId}/read`);
  },

  markAllAsRead: async () => {
    await api.patch('/api/notifications/read-all');
  }
};

// ============================================
// AUTH SERVICE
// ============================================

export const authService = {
  loginWithGoogle: () => {
    window.location.href = `${API_BASE_URL}/oauth2/authorization/google`;
  },

  getCurrentUser: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },

  logout: async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
};

export default ticketService;