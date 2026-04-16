import api, { API_BASE_URL } from './axiosInstance';

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

// Backwards-compatible API expected by existing dashboard pages.
export const ticketAPI = {
  getAllTickets: async (page = 0, size = 10) => {
    const data = await ticketService.getAllTickets({ page, size });
    return { data };
  },

  getUserTickets: async (_userId, page = 0, size = 10) => {
    const data = await ticketService.getMyTickets({ page, size });
    return { data };
  },

  getTechnicianTickets: async (_technicianId, page = 0, size = 10) => {
    const data = await ticketService.getAssignedTickets({ page, size });
    return { data };
  },

  createTicket: async (ticketData, attachments = []) => {
    const formData = new FormData();

    Object.entries(ticketData || {}).forEach(([key, value]) => {
      if (value === undefined || value === null || key === 'attachments') {
        return;
      }
      formData.append(key, value);
    });

    attachments.forEach((file) => {
      formData.append('attachments', file);
    });

    const data = await ticketService.createTicket(formData);
    return { data };
  },

  assignTicket: async (id, technicianId, technicianName = '') => {
    const data = await ticketService.assignTechnician(id, technicianId, technicianName);
    return { data };
  },

  rejectTicket: async (id, reason) => {
    const data = await ticketService.updateStatus(id, 'REJECTED', reason);
    return { data };
  },

  updateTicketStatus: async (id, status, reason = '') => {
    const data = await ticketService.updateStatus(id, status, reason);
    return { data };
  },

  confirmTicketResolution: async (id, feedback = '') => {
    const data = await ticketService.confirmResolution(id, feedback);
    return { data };
  },
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
    const payload = typeof content === 'object'
      ? { ...content, isInternal: content.isInternal ?? isInternal }
      : { content, isInternal };
    const response = await api.post(`/api/tickets/${ticketId}/comments`, payload);
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
