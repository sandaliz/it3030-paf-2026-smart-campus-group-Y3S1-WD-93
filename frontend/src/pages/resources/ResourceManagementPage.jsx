import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { resourceService } from '../../services/resourceService';
import ResourceForm from '../../components/forms/ResourceForm';
import { TableRowSkeleton, PageLoader } from '../../components/ui/LoadingSkeleton';
import { useAuth } from '../../context/AuthContext';
import ResourceAnalyticsModal from '../../components/common/ResourceAnalyticsModal';

const ResourceManagementPage = () => {
  const { user, hasRole, hasAnyRole } = useAuth();
  const [resources, setResources] = useState([]);
  const [allResources, setAllResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Check if user can perform add/edit operations
  const canAddEditResources = hasAnyRole(['TECHNICIAN', 'LECTURER', 'ADMIN']);
  const canDeleteResources = hasRole('ADMIN');
  const [showForm, setShowForm] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [selectedResources, setSelectedResources] = useState([]);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showAssignStaffModal, setShowAssignStaffModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [selectedStaffIds, setSelectedStaffIds] = useState([]);
  const [allStaff, setAllStaff] = useState([]);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    location: '',
    minCapacity: ''
  });
  const [debouncedLocation, setDebouncedLocation] = useState('');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [showStaffResourcesModal, setShowStaffResourcesModal] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [staffResourcesMap, setStaffResourcesMap] = useState({});
  const [loadingStaffResources, setLoadingStaffResources] = useState(false);
  const [pagination, setPagination] = useState({
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0
  });

  useEffect(() => {
    fetchResources();
  }, [filters.type, filters.status, filters.minCapacity, debouncedLocation, pagination.page]);

  useEffect(() => {
    fetchAllResources();
  }, []);

  useEffect(() => {
    if (hasRole('ADMIN')) {
      fetchAllStaff();
    }
  }, []);

  const fetchAllResources = async () => {
    try {
      const data = await resourceService.getAllResources();
      setAllResources(data);
    } catch (err) {
      console.error('Error fetching all resources for stats:', err);
    }
  };

  // Debounce location filter
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedLocation(filters.location);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [filters.location]);

  const fetchResources = async () => {
    try {
      // Use searching state for filter operations, loading for initial load
      const hasFilters = Object.values(filters).some(value => value !== '');
      if (hasFilters) {
        setSearching(true);
      } else {
        setLoading(true);
      }
      
      let data;
      
      // Use search if filters are applied, otherwise get paginated results
      if (hasFilters) {
        const searchFilters = {
          ...filters,
          location: debouncedLocation
        };
        data = await resourceService.searchResources(searchFilters);
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
      setSearching(false);
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
      fetchAllResources();
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
      fetchAllResources();
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
    fetchAllResources();
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 0 })); // Reset to first page
  };

  const handleClearFilters = () => {
    setFilters({ type: '', status: '', location: '', minCapacity: '' });
    setSearching(true);
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
      fetchAllResources();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to delete resources');
      setSuccess(null);
      console.error('Error bulk deleting:', err);
    }
  };

  const handleViewStaffResources = async () => {
    if (loadingStaffResources) return;
    setLoadingStaffResources(true);
    try {
      const token = localStorage.getItem('token');
      // Fetch all staff users
      const staffResponse = await axios.get('http://localhost:8080/api/resources/staff', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const staffData = staffResponse.data;
      console.log('Staff data:', staffData);
      setStaffList(staffData);

      // Fetch resources for each staff member
      const resourcesMap = {};
      for (const staff of staffData) {
        try {
          const resourcesResponse = await axios.get(`http://localhost:8080/api/resources/staff/${staff.id}/resources`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log(`Resources for staff ${staff.name} (${staff.id}):`, resourcesResponse.data);
          resourcesMap[staff.id] = resourcesResponse.data || [];
        } catch (error) {
          console.error(`Error fetching resources for staff ${staff.id}:`, error);
          resourcesMap[staff.id] = [];
        }
      }
      setStaffResourcesMap(resourcesMap);
      setShowStaffResourcesModal(true);
    } catch (error) {
      console.error('Error fetching staff data:', error);
      alert('Failed to load staff data');
    } finally {
      setLoadingStaffResources(false);
    }
  };

  const handleAssignStaff = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:8080/api/resources/${selectedResource.id}/assign-staff`, 
        { staffIds: selectedStaffIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Staff assigned successfully');
      setError(null);
      setShowAssignStaffModal(false);
      setSelectedResource(null);
      setSelectedStaffIds([]);
      fetchResources();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to assign staff');
      setSuccess(null);
      console.error('Error assigning staff:', err);
    }
  };

  const fetchAllStaff = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8080/api/resources/staff', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllStaff(response.data || []);
    } catch (err) {
      console.error('Error fetching staff:', err);
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

  const getResourceStats = () => {
    const stats = {
      total: allResources.length,
      byStatus: {
        ACTIVE: 0,
        OUT_OF_SERVICE: 0,
        UNDER_MAINTENANCE: 0
      },
      byType: {
        LECTURE_HALL: 0,
        LAB: 0,
        MEETING_ROOM: 0,
        EQUIPMENT: 0,
        OFFICE: 0,
        AUDITORIUM: 0
      }
    };

    allResources.forEach(resource => {
      stats.byStatus[resource.status] = (stats.byStatus[resource.status] || 0) + 1;
      stats.byType[resource.type] = (stats.byType[resource.type] || 0) + 1;
    });

    return stats;
  };

  const getSelectedTypeStats = (type) => {
    const typeResources = allResources.filter(r => r.type === type);
    const stats = {
      total: typeResources.length,
      byStatus: {
        ACTIVE: 0,
        OUT_OF_SERVICE: 0,
        UNDER_MAINTENANCE: 0
      }
    };

    typeResources.forEach(resource => {
      stats.byStatus[resource.status] = (stats.byStatus[resource.status] || 0) + 1;
    });

    return stats;
  };

  const stats = getResourceStats();
  const selectedTypeStats = selectedType ? getSelectedTypeStats(selectedType) : null;

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
            className="btn btn-info text-white"
            onClick={handleViewStaffResources}
            disabled={loadingStaffResources}
          >
            {loadingStaffResources ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Loading...
              </>
            ) : (
              'Staff Resources'
            )}
          </button>
          <button
            className="btn btn-outline"
            onClick={() => setShowAnalyticsModal(true)}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Share Analytics
          </button>
          <button
            className="btn btn-outline"
            onClick={() => {
              fetchResources();
              fetchAllResources();
            }}
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

      {/* Resource Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card bg-base-100 shadow-lg border border-base-300">
          <div className="card-body p-4">
            <h3 className="text-sm text-base-content/70">Total Resources</h3>
            <p className="text-3xl font-bold">{stats.total}</p>
          </div>
        </div>
        <div className="card bg-base-100 shadow-lg border border-base-300">
          <div className="card-body p-4">
            <h3 className="text-sm text-base-content/70">Active</h3>
            <p className="text-3xl font-bold text-success">{stats.byStatus.ACTIVE}</p>
          </div>
        </div>
        <div className="card bg-base-100 shadow-lg border border-base-300">
          <div className="card-body p-4">
            <h3 className="text-sm text-base-content/70">Out of Service</h3>
            <p className="text-3xl font-bold text-error">{stats.byStatus.OUT_OF_SERVICE}</p>
          </div>
        </div>
        <div className="card bg-base-100 shadow-lg border border-base-300 relative">
          <div className="card-body p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm text-base-content/70">By Type</h3>
                <p className="text-3xl font-bold text-primary">
                  {selectedType ? getResourceIcon(selectedType) : 'View'}
                </p>
                {selectedType && (
                  <p className="text-sm text-base-content/70 capitalize">
                    {selectedType.replace('_', ' ').toLowerCase()}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {selectedType && (
                  <button 
                    className="btn btn-sm btn-error"
                    onClick={() => {
                      setSelectedType(null);
                      handleFilterChange('type', '');
                      setSearching(true);
                    }}
                  >
                    Reset
                  </button>
                )}
                <button 
                  className="btn btn-sm btn-outline"
                  onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                >
                  {showTypeDropdown ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            {selectedType && selectedTypeStats && (
              <div className="mt-3 pt-3 border-t border-base-300 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-base-content/70">Total:</span>
                  <span className="font-semibold">{selectedTypeStats.total}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-base-content/70">Active:</span>
                  <span className="font-semibold text-success">{selectedTypeStats.byStatus.ACTIVE}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-base-content/70">Out of Service:</span>
                  <span className="font-semibold text-error">{selectedTypeStats.byStatus.OUT_OF_SERVICE}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-base-content/70">Maintenance:</span>
                  <span className="font-semibold text-warning">{selectedTypeStats.byStatus.UNDER_MAINTENANCE}</span>
                </div>
              </div>
            )}
          </div>
          {showTypeDropdown && (
            <div className="absolute top-full left-0 right-0 bg-base-100 shadow-xl rounded-lg p-4 z-20 border border-base-300">
              <div className="space-y-2">
                {Object.entries(stats.byType).map(([type, count]) => (
                  <button
                    key={type}
                    className={`w-full flex justify-between items-center p-2 rounded-lg hover:bg-base-200 transition-colors ${
                      selectedType === type ? 'bg-primary/20 border border-primary' : ''
                    }`}
                    onClick={() => {
                      setSelectedType(type);
                      handleFilterChange('type', type);
                      setShowTypeDropdown(false);
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <span>{getResourceIcon(type)}</span>
                      <span className="capitalize">{type.replace('_', ' ').toLowerCase()}</span>
                    </span>
                    <span className="font-semibold">{count}</span>
                  </button>
                ))}
              </div>
            </div>
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
              onClick={handleClearFilters}
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
      <div className="card bg-base-100 shadow-lg relative">
        {searching && (
          <div className="absolute inset-0 bg-base-100/80 z-10 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <span className="loading loading-spinner loading-lg text-primary"></span>
              <span className="text-sm text-base-content/70">Searching...</span>
            </div>
          </div>
        )}
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
                  <th className="w-140">Resource</th>
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
                ) : resources.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <svg className="w-12 h-12 text-base-content/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-base-content/60">No resources found</p>
                        {Object.values(filters).some(value => value !== '') && (
                          <button 
                            className="btn btn-sm btn-outline"
                            onClick={handleClearFilters}
                          >
                            Clear Filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
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
                          {hasRole('ADMIN') && (
                            <button
                              className="btn btn-sm btn-info text-white"
                              onClick={async () => {
                                await fetchAllStaff();
                                setSelectedResource(resource);
                                // Include both assignedStaff and createdBy as assigned
                                const assignedStaffIds = resource.assignedStaff || [];
                                const createdBy = resource.createdBy;
                                console.log('Resource assignedStaff (IDs):', assignedStaffIds);
                                console.log('Resource createdBy:', createdBy);
                                console.log('All staff:', allStaff.map(s => ({ id: s.id, username: s.username })));

                                // Combine assignedStaff and createdBy
                                let allAssignedIds = [...assignedStaffIds];
                                if (createdBy && !allAssignedIds.includes(createdBy)) {
                                  allAssignedIds.push(createdBy);
                                }

                                // Try to match by username first
                                const matchedStaffIds = allStaff
                                  .filter(staff => allAssignedIds.includes(staff.username) || allAssignedIds.includes(staff.id))
                                  .map(staff => staff.id);

                                console.log('Combined assigned IDs:', allAssignedIds);
                                console.log('Matched staff IDs:', matchedStaffIds);
                                setSelectedStaffIds(matchedStaffIds.length > 0 ? matchedStaffIds : allAssignedIds);
                                setShowAssignStaffModal(true);
                              }}
                            >
                              Assign Staff
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

      {/* Analytics Modal */}
      <ResourceAnalyticsModal
        isOpen={showAnalyticsModal}
        onClose={() => setShowAnalyticsModal(false)}
      />

      {/* Assign Staff Modal */}
      {showAssignStaffModal && (
        <div className="modal modal-open" onClick={() => setShowAssignStaffModal(false)}>
          <div className="modal-box max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-xl mb-6 flex items-center gap-3">
              <span className="text-2xl">👥</span>
              Assign Staff to {selectedResource?.name}
            </h3>

            {/* Currently Assigned Staff */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="label font-bold">Currently Assigned Staff</label>
                <span className="badge badge-info badge-sm">
                  {selectedStaffIds.length} assigned
                </span>
              </div>
              {selectedStaffIds.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedStaffIds.map(staffId => {
                    const staff = allStaff.find(s => s.id === staffId);
                    return staff ? (
                      <div key={staffId} className="badge badge-lg badge-success gap-2 pl-3 pr-1">
                        <span>{staff.username || staff.name}</span>
                        <button
                          onClick={() => setSelectedStaffIds(selectedStaffIds.filter(id => id !== staffId))}
                          className="btn btn-xs btn-ghost text-white hover:bg-white/20"
                          title="Revoke assignment"
                        >
                          ✕
                        </button>
                      </div>
                    ) : null;
                  })}
                </div>
              ) : (
                <div className="text-center py-4 border border-dashed border-base-300 rounded-lg opacity-50">
                  <p className="text-sm">No staff assigned yet</p>
                </div>
              )}
            </div>

            {/* Assign More Staff */}
            <div className="form-control">
              <label className="label font-bold">Assign More Staff</label>
              <div className="max-h-48 overflow-y-auto space-y-2 border border-base-300 rounded-lg p-3">
                {allStaff.length === 0 ? (
                  <p className="text-sm opacity-60 text-center py-4">No staff available</p>
                ) : (
                  allStaff
                    .filter(staff => !selectedStaffIds.includes(staff.id))
                    .map((staff) => (
                      <label key={staff.id} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-base-200 rounded-lg transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedStaffIds.includes(staff.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStaffIds([...selectedStaffIds, staff.id]);
                            } else {
                              setSelectedStaffIds(selectedStaffIds.filter(id => id !== staff.id));
                            }
                          }}
                          className="checkbox checkbox-sm checkbox-info"
                        />
                        <div className="flex items-center gap-2">
                          <div className="avatar placeholder">
                            <div className="bg-neutral text-neutral-content rounded-full w-8">
                              <span className="text-xs">{staff.username?.charAt(0)?.toUpperCase() || staff.name?.charAt(0)?.toUpperCase() || '?'}</span>
                            </div>
                          </div>
                          <div>
                            <span className="text-sm font-medium">{staff.username || staff.name}</span>
                            <div className="text-xs opacity-60">{staff.email}</div>
                          </div>
                        </div>
                      </label>
                    ))
                )}
                {allStaff.length > 0 && allStaff.filter(staff => !selectedStaffIds.includes(staff.id)).length === 0 && (
                  <p className="text-sm opacity-60 text-center py-4">All staff already assigned</p>
                )}
              </div>
            </div>
            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setShowAssignStaffModal(false);
                  setSelectedResource(null);
                  setSelectedStaffIds([]);
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleAssignStaff}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Staff Resources Modal */}
      {showStaffResourcesModal && (
        <div className="modal modal-open" onClick={() => setShowStaffResourcesModal(false)}>
          <div className="modal-box max-w-6xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-2xl mb-6 flex items-center gap-3">
              Staff Resources Overview
            </h3>

            {/* Overview Stats */}
            {staffList.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="stats stats-vertical shadow bg-base-200">
                  <div className="stat">
                    <div className="stat-title text-base-content/70">Total Staff</div>
                    <div className="stat-value text-primary text-4xl">{staffList.length}</div>
                    <div className="stat-desc text-base-content/60">Active staff members</div>
                  </div>
                </div>
                <div className="stats stats-vertical shadow bg-base-200">
                  <div className="stat">
                    <div className="stat-title text-base-content/70">Total Assigned Resources</div>
                    <div className="stat-value text-info text-4xl">
                      {Object.values(staffResourcesMap).reduce((sum, resources) => sum + (resources?.length || 0), 0)}
                    </div>
                    <div className="stat-desc text-base-content/60">Across all staff</div>
                  </div>
                </div>
                <div className="stats stats-vertical shadow bg-base-200">
                  <div className="stat">
                    <div className="stat-title text-base-content/70">Top Staff Member</div>
                    <div className="stat-value text-success text-2xl">
                      {[...staffList].sort((a, b) => (staffResourcesMap[b.id]?.length || 0) - (staffResourcesMap[a.id]?.length || 0))[0]?.name || 'N/A'}
                    </div>
                    <div className="stat-desc text-base-content/60">
                      {staffResourcesMap[[...staffList].sort((a, b) => (staffResourcesMap[b.id]?.length || 0) - (staffResourcesMap[a.id]?.length || 0))[0]?.id]?.length || 0} resources
                    </div>
                  </div>
                </div>
              </div>
            )}

            {staffList.length > 0 ? (
              <div className="space-y-6">
                {[...staffList]
                  .sort((a, b) => (staffResourcesMap[b.id]?.length || 0) - (staffResourcesMap[a.id]?.length || 0))
                  .map((staff, index) => (
                  <div key={staff.id} className={`card bg-base-200 border border-base-300 ${index === 0 ? 'ring-2 ring-info ring-offset-2' : ''}`}>
                    <div className="card-body p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="avatar">
                            <div className={`w-14 rounded-full ${index === 0 ? 'bg-gradient-to-br from-info to-primary' : 'bg-info'} text-white flex items-center justify-center font-bold text-xl shadow-lg`}>
                              {staff.name.charAt(0).toUpperCase()}
                              {index === 0 && <span className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">👑</span>}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-bold text-lg flex items-center gap-2">
                              {staff.name}
                              {index === 0 && <span className="badge badge-warning badge-sm">Top Handler</span>}
                            </h4>
                            <p className="text-sm opacity-60">{staff.email}</p>
                            <div className="flex gap-2 mt-1">
                              {staff.roles.map((role) => (
                                <span key={role} className="badge badge-info badge-sm">
                                  {role}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-black text-info">
                            {staffResourcesMap[staff.id]?.length || 0}
                          </p>
                          <p className="text-xs font-bold opacity-60 uppercase">Resources</p>
                        </div>
                      </div>
                      {staffResourcesMap[staff.id] && staffResourcesMap[staff.id].length > 0 ? (
                        <>
                          <div className="overflow-x-auto">
                            <table className="table table-sm">
                              <thead>
                                <tr>
                                  <th>Name</th>
                                  <th>Type</th>
                                  <th>Location</th>
                                  <th>Capacity</th>
                                  <th>Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {staffResourcesMap[staff.id].map((resource) => (
                                  <tr key={resource.id} className="hover">
                                    <td className="font-bold">{resource.name}</td>
                                    <td>
                                      <span className="badge badge-outline">{resource.type?.replace('_', ' ')}</span>
                                    </td>
                                    <td>{resource.location}</td>
                                    <td>{resource.capacity || '-'}</td>
                                    <td>
                                      <span className={`badge ${resource.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`}>
                                        {resource.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <div className="mt-3 pt-3 border-t border-base-300 flex justify-between items-center text-sm">
                            <span className="opacity-60">
                              {staffResourcesMap[staff.id].filter(r => r.status === 'ACTIVE').length} active, 
                              {staffResourcesMap[staff.id].filter(r => r.status === 'UNDER_MAINTENANCE').length} under maintenance
                            </span>
                            <span className="font-bold text-info">
                              {Math.round((staffResourcesMap[staff.id].filter(r => r.status === 'ACTIVE').length / staffResourcesMap[staff.id].length) * 100)}% utilization
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-6 opacity-50">
                          <div className="text-4xl mb-2">📭</div>
                          <p className="text-sm">No resources assigned to this staff member</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">👥</div>
                <p className="font-bold opacity-50">No staff members found</p>
              </div>
            )}
            <div className="modal-action">
              <button
                className="btn"
                onClick={() => setShowStaffResourcesModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceManagementPage;
