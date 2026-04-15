import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { resourceService } from '../../services/resourceService';
import ResourceForm from '../../components/forms/ResourceForm';
import { TableRowSkeleton, PageLoader } from '../../components/ui/LoadingSkeleton';
import { useAuth } from '../../context/AuthContext';

const ResourceManagementPage = () => {
  const { user, hasRole, hasAnyRole } = useAuth();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Check if user can perform add/edit operations
  const canAddEditResources = hasAnyRole(['TECHNICIAN', 'LECTURER', 'ADMIN']);
  const canDeleteResources = hasRole('ADMIN');
  const [showForm, setShowForm] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [selectedResources, setSelectedResources] = useState([]);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    location: '',
    minCapacity: ''
  });
  const [pagination, setPagination] = useState({
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0
  });

  useEffect(() => {
    fetchResources();
  }, [filters, pagination.page]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      let data;
      
      // Use search if filters are applied, otherwise get paginated results
      const hasFilters = Object.values(filters).some(value => value !== '');
      if (hasFilters) {
        data = await resourceService.searchResources(filters);
        // Convert to paginated format
        data = {
          content: data,
          totalElements: data.length,
          totalPages: 1,
          size: data.length,
          number: 0
        };
      } else {
        data = await resourceService.getResourcesPaginated(
          pagination.page, 
          pagination.size, 
          'name', 
          'asc'
        );
      }
      
      setResources(data.content || data);
      setPagination(prev => ({
        ...prev,
        totalElements: data.totalElements || data.length,
        totalPages: data.totalPages || 1
      }));
      setError(null);
    } catch (err) {
      setError('Failed to load resources');
      console.error('Error fetching resources:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateResource = () => {
    setEditingResource(null);
    setShowForm(true);
  };

  const handleEditResource = (resource) => {
    setEditingResource(resource);
    setShowForm(true);
  };

  const handleDeleteResource = async (resourceId) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) {
      return;
    }

    try {
      await resourceService.deleteResource(resourceId);
      setSuccess('Resource deleted successfully');
      setError(null);
      fetchResources();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to delete resource');
      setSuccess(null);
      console.error('Error deleting resource:', err);
    }
  };

  const handleStatusToggle = async (resourceId, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'OUT_OF_SERVICE' : 'ACTIVE';
    
    try {
      await resourceService.updateResourceStatus(resourceId, newStatus);
      setSuccess(`Resource status updated to ${newStatus.replace('_', ' ')}`);
      setError(null);
      fetchResources();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update resource status');
      setSuccess(null);
      console.error('Error updating status:', err);
    }
  };

  const handleFormSubmit = async () => {
    setShowForm(false);
    setEditingResource(null);
    setSuccess(editingResource ? 'Resource updated successfully' : 'Resource created successfully');
    setError(null);
    fetchResources();
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 0 })); // Reset to first page
  };

  const handleSelectResource = (resourceId) => {
    setSelectedResources(prev => 
      prev.includes(resourceId) 
        ? prev.filter(id => id !== resourceId)
        : [...prev, resourceId]
    );
  };

  const handleSelectAll = () => {
    if (selectedResources.length === resources.length) {
      setSelectedResources([]);
    } else {
      setSelectedResources(resources.map(r => r.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedResources.length === 0) return;
    
    if (!window.confirm(`Are you sure you want to delete ${selectedResources.length} resources?`)) {
      return;
    }

    try {
      await Promise.all(selectedResources.map(id => resourceService.deleteResource(id)));
      setSuccess(`${selectedResources.length} resources deleted successfully`);
      setError(null);
      setSelectedResources([]);
      fetchResources();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to delete resources');
      setSuccess(null);
      console.error('Error bulk deleting:', err);
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'badge-success';
      case 'OUT_OF_SERVICE':
        return 'badge-error';
      case 'UNDER_MAINTENANCE':
        return 'badge-warning';
      default:
        return 'badge-neutral';
    }
  };

  const getResourceIcon = (type) => {
    switch (type) {
      case 'LECTURE_HALL':
        return '🏛️';
      case 'LAB':
        return '🔬';
      case 'MEETING_ROOM':
        return '🤝';
      case 'EQUIPMENT':
        return '📱';
      case 'OFFICE':
        return '🏢';
      case 'AUDITORIUM':
        return '🎭';
      default:
        return '📦';
    }
  };

  if (loading && resources.length === 0) {
    return <PageLoader />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Resource Management</h1>
          <p className="text-base-content/70">Manage campus facilities and equipment</p>
        </div>
        <div className="flex gap-2">
          <button 
            className="btn btn-outline"
            onClick={fetchResources}
            disabled={loading}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          {selectedResources.length > 0 && (
            <button 
              className="btn btn-error"
              onClick={handleBulkDelete}
            >
              Delete Selected ({selectedResources.length})
            </button>
          )}
          {canAddEditResources && (
            <button 
              className="btn btn-primary"
              onClick={handleCreateResource}
            >
              Add New Resource
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card bg-base-100 shadow-lg mb-6">
        <div className="card-body">
          <h3 className="card-title text-lg">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Type</span>
              </label>
              <select 
                className="select select-bordered"
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
              >
                <option value="">All Types</option>
                <option value="LECTURE_HALL">Lecture Hall</option>
                <option value="LAB">Lab</option>
                <option value="MEETING_ROOM">Meeting Room</option>
                <option value="EQUIPMENT">Equipment</option>
                <option value="OFFICE">Office</option>
                <option value="AUDITORIUM">Auditorium</option>
              </select>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Status</span>
              </label>
              <select 
                className="select select-bordered"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="OUT_OF_SERVICE">Out of Service</option>
                <option value="UNDER_MAINTENANCE">Under Maintenance</option>
              </select>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Location</span>
              </label>
              <input
                type="text"
                placeholder="Search location..."
                className="input input-bordered"
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Min Capacity</span>
              </label>
              <input
                type="number"
                placeholder="Min capacity..."
                className="input input-bordered"
                value={filters.minCapacity}
                onChange={(e) => handleFilterChange('minCapacity', e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button 
              className="btn btn-outline btn-sm"
              onClick={() => setFilters({ type: '', status: '', location: '', minCapacity: '' })}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-error mb-6">
          <svg className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div className="alert alert-success mb-6">
          <svg className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{success}</span>
        </div>
      )}

      {/* Resources Table */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>
                    <label>
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        checked={selectedResources.length === resources.length && resources.length > 0}
                        onChange={handleSelectAll}
                      />
                    </label>
                  </th>
                  <th>Resource</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Capacity</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && resources.length === 0 ? (
                  // Show 5 skeleton rows while loading
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRowSkeleton key={index} />
                  ))
                ) : (
                  resources.map((resource) => (
                    <tr key={resource.id}>
                      <td>
                        <label>
                          <input
                            type="checkbox"
                            className="checkbox checkbox-sm"
                            checked={selectedResources.includes(resource.id)}
                            onChange={() => handleSelectResource(resource.id)}
                          />
                        </label>
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{getResourceIcon(resource.type)}</span>
                          <div className="flex-1">
                            <div className="font-semibold">{resource.name}</div>
                            {resource.description && (
                              <div className="text-sm text-base-content/70 line-clamp-1">
                                {resource.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="capitalize">
                          {resource.type.replace('_', ' ').toLowerCase()}
                        </span>
                      </td>
                      <td>{resource.location}</td>
                      <td>{resource.capacity}</td>
                      <td>
                        <div className={`badge ${getStatusBadgeColor(resource.status)} badge-sm`}>
                          {resource.status.replace('_', ' ')}
                        </div>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          {canAddEditResources && (
                            <button
                              className="btn btn-sm btn-outline"
                              onClick={() => handleEditResource(resource)}
                            >
                              Edit
                            </button>
                          )}
                          {canDeleteResources && (
                            <button
                              className="btn btn-sm btn-error"
                              onClick={() => handleDeleteResource(resource.id)}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!Object.values(filters).some(value => value !== '') && pagination.totalPages > 1 && (
            <div className="flex justify-between items-center p-4 border-t">
              <div className="text-sm text-base-content/70">
                Showing {resources.length} of {pagination.totalElements} resources
              </div>
              <div className="join">
                <button
                  className="join-item btn btn-sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 0}
                >
                  Previous
                </button>
                <button className="join-item btn btn-sm btn-active">
                  Page {pagination.page + 1}
                </button>
                <button
                  className="join-item btn btn-sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= pagination.totalPages - 1}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resource Form Modal */}
      {showForm && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-2xl">
            <h3 className="font-bold text-lg">
              {editingResource ? 'Edit Resource' : 'Add New Resource'}
            </h3>
            <ResourceForm
              resource={editingResource}
              onSubmit={handleFormSubmit}
              onCancel={() => setShowForm(false)}
            />
          </div>
          <div className="modal-backdrop" onClick={() => setShowForm(false)}></div>
        </div>
      )}
    </div>
  );
};

export default ResourceManagementPage;
