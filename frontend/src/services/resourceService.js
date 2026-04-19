import api from './axiosInstance';

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
    const response = await api.get('/api/resources', {
      params: { type }
    });
    return response.data;
  },

  // Get resources by status
  getResourcesByStatus: async (status) => {
    const response = await api.get('/api/resources', {
      params: { status }
    });
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
    const response = await api.get('/api/resources', {
      params: filters
    });
    return response.data;
  },

  // Create new resource
  createResource: async (resourceData) => {
    // If resourceData is FormData, send it directly
    if (resourceData instanceof FormData) {
      const response = await api.post('/api/resources', resourceData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    }
    // Regular JSON data
    const response = await api.post('/api/resources', resourceData);
    return response.data;
  },

  // Update resource
  updateResource: async (id, resourceData) => {
    // If resourceData is FormData, send it directly
    if (resourceData instanceof FormData) {
      const response = await api.put(`/api/resources/${id}`, resourceData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    }
    // Regular JSON data
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

  // Track resource share
  trackShare: async (id) => {
    const response = await api.patch(`/api/resources/${id}/share`);
    return response.data;
  },

  // Assign staff to resource
  assignStaffToResource: async (id, staffIds) => {
    const response = await api.patch(`/api/resources/${id}/assign-staff`, { staffIds });
    return response.data;
  },

  // Get resources assigned to current staff
  getResourcesAssignedToMe: async () => {
    const response = await api.get('/api/resources/assigned-to-me');
    return response.data;
  },
};

export default resourceService;
