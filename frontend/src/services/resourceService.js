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
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Resource API service
export const resourceService = {
  // Get all resources
  getAllResources: async () => {
    const response = await api.get('/api/resources');
    return response.data;
  },

  // Get paginated resources
  getResourcesPaginated: async (page = 0, size = 10, sortBy = 'name', sortDir = 'asc') => {
    const response = await api.get('/api/resources/paginated', {
      params: { page, size, sortBy, sortDir }
    });
    return response.data;
  },

  // Get resource by ID
  getResourceById: async (id) => {
    const response = await api.get(`/api/resources/${id}`);
    return response.data;
  },

  // Get resources by type
  getResourcesByType: async (type) => {
    const response = await api.get(`/api/resources/type/${type}`);
    return response.data;
  },

  // Get resources by status
  getResourcesByStatus: async (status) => {
    const response = await api.get(`/api/resources/status/${status}`);
    return response.data;
  },

  // Get resources by location
  getResourcesByLocation: async (location) => {
    const response = await api.get('/api/resources/location', {
      params: { location }
    });
    return response.data;
  },

  // Get resources by minimum capacity
  getResourcesByMinCapacity: async (minCapacity) => {
    const response = await api.get('/api/resources/capacity', {
      params: { minCapacity }
    });
    return response.data;
  },

  // Search resources with filters
  searchResources: async (filters = {}) => {
    const response = await api.get('/api/resources/search', {
      params: filters
    });
    return response.data;
  },

  // Create new resource
  createResource: async (resourceData) => {
    const response = await api.post('/api/resources', resourceData);
    return response.data;
  },

  // Update resource
  updateResource: async (id, resourceData) => {
    const response = await api.put(`/api/resources/${id}`, resourceData);
    return response.data;
  },

  // Delete resource
  deleteResource: async (id) => {
    await api.delete(`/api/resources/${id}`);
  },

  // Update resource status
  updateResourceStatus: async (id, status) => {
    const response = await api.patch(`/api/resources/${id}/status`, { status });
    return response.data;
  },

  // Bulk create resources
  bulkCreateResources: async (resourcesData) => {
    const response = await api.post('/api/resources/bulk', resourcesData);
    return response.data;
  },

  // Get resource availability
  getResourceAvailability: async (id, date) => {
    const response = await api.get(`/api/resources/${id}/availability`, {
      params: { date }
    });
    return response.data;
  },

  // Check resource availability
  checkResourceAvailability: async (id, date, startTime, endTime) => {
    const response = await api.get(`/api/resources/${id}/availability/check`, {
      params: { date, startTime, endTime }
    });
    return response.data;
  },

  // Get resource audit log
  getResourceAudit: async (id) => {
    const response = await api.get(`/api/resources/${id}/audit`);
    return response.data;
  },
};

export default resourceService;
