import api from './axiosInstance';

// User and Technician Management Service
export const userService = {
  // Get all users (admin only)
  getAllUsers: async () => {
    const response = await api.get('/api/admin/users');
    return response.data;
  },

  // Get all technicians (admin only)
  getTechnicians: async () => {
    const response = await api.get('/api/admin/technicians');
    return response.data;
  },

  // Create new user (admin only)
  createUser: async (userData) => {
    const response = await api.post('/api/admin/users', userData);
    return response.data;
  },

  // Update user roles (admin only)
  updateUserRoles: async (userId, roles) => {
    const response = await api.put(`/api/admin/users/${userId}/roles`, { roles });
    return response.data;
  },

  // Update user status (admin only)
  updateUserStatus: async (userId, enabled) => {
    const response = await api.put(`/api/admin/users/${userId}/status`, { enabled });
    return response.data;
  },

  // Delete user (admin only)
  deleteUser: async (userId) => {
    const response = await api.delete(`/api/admin/users/${userId}`);
    return response.data;
  },

  // Get current user profile
  getCurrentUser: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  }
};
