import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import AdminSidebar from '../../components/admin/AdminSidebar';

const ResourceManagement = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'LECTURE_HALL',
    capacity: '',
    location: '',
    status: 'ACTIVE',
    description: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState('asc');

  useEffect(() => {
    fetchResources();
  }, [currentPage, pageSize, sortBy, sortDir, filterType, filterStatus, searchTerm]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        size: pageSize,
        sortBy,
        sortDir,
        ...(filterType && { type: filterType }),
        ...(filterStatus && { status: filterStatus }),
        ...(searchTerm && { search: searchTerm }),
      });
      
      const response = await api.getResources(`?${params}`);
      setResources(response.content || response);
    } catch (error) {
      console.error('Failed to fetch resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await api.createResource(formData);
      setShowModal(false);
      resetForm();
      fetchResources();
    } catch (error) {
      console.error('Failed to create resource:', error);
      alert('Failed to create resource: ' + error.message);
    }
  };

  const handleUpdate = async () => {
    try {
      await api.updateResource(editingResource.id, formData);
      setShowModal(false);
      setEditingResource(null);
      resetForm();
      await fetchResources();
    } catch (error) {
      console.error('Failed to update resource:', error);
      alert('Failed to update resource: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this resource?')) {
      return;
    }
    
    try {
      await api.deleteResource(id);
      fetchResources();
    } catch (error) {
      console.error('Failed to delete resource:', error);
      alert('Failed to delete resource: ' + error.message);
    }
  };

  const handleStatusToggle = async (id, newStatus) => {
    try {
      await api.partialUpdateResource(id, { status: newStatus });
      fetchResources();
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status: ' + error.message);
    }
  };

  const openEditModal = (resource) => {
    setEditingResource(resource);
    setFormData({
      name: resource.name || '',
      type: resource.type || 'LECTURE_HALL',
      capacity: resource.capacity || '',
      location: resource.location || '',
      status: resource.status || 'ACTIVE',
      description: resource.description || '',
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingResource(null);
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'LECTURE_HALL',
      capacity: '',
      location: '',
      status: 'ACTIVE',
      description: '',
    });
  };

  const getTypeIcon = (type) => {
    const icons = {
      'LECTURE_HALL': '🏛️',
      'LAB': '🔬',
      'MEETING_ROOM': '🏢',
      'EQUIPMENT': '📱',
    };
    return icons[type] || '📚';
  };

  const getStatusBadge = (status) => {
    const badges = {
      'ACTIVE': 'badge-success',
      'OUT_OF_SERVICE': 'badge-error',
      'UNDER_MAINTENANCE': 'badge-warning',
    };
    return badges[status] || 'badge-ghost';
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(0); // Reset to first page when searching
  };

  const handleFilterChange = (filterType, value) => {
    if (filterType === 'type') setFilterType(value);
    if (filterType === 'status') setFilterStatus(value);
    setCurrentPage(0); // Reset to first page when filtering
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
    setCurrentPage(0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingResource) {
      handleUpdate();
    } else {
      handleCreate();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200">
        <div className="flex min-h-screen">
          <AdminSidebar />
          <div className="flex-1 p-6 lg:p-8">
            <div className="flex justify-center items-center h-64">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200">
      <div className="flex min-h-screen">
        <AdminSidebar />

        <div className="flex-1 p-6 lg:p-8">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold">📚 Resource Management</h1>
              <p className="text-base-content/70">
                Manage campus facilities, equipment, and assets
              </p>
            </div>

            <div className="flex gap-2">
              <button className="btn btn-primary" onClick={openCreateModal}>
                ➕ Add Resource
              </button>
            </div>
          </div>

      {/* Filters and Search */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="form-control">
              <label className="label">Search</label>
              <input
                type="text"
                placeholder="Search resources..."
                value={searchTerm}
                onChange={handleSearch}
                className="input input-bordered"
              />
            </div>
            
            <div className="form-control">
              <label className="label">Type</label>
              <select
                value={filterType}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="select select-bordered"
              >
                <option value="">All Types</option>
                <option value="LECTURE_HALL">🏛️ Lecture Halls</option>
                <option value="LAB">🔬 Labs</option>
                <option value="MEETING_ROOM">🏢 Meeting Rooms</option>
                <option value="EQUIPMENT">📱 Equipment</option>
              </select>
            </div>
            
            <div className="form-control">
              <label className="label">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="select select-bordered"
              >
                <option value="">All Status</option>
                <option value="ACTIVE">✅ Active</option>
                <option value="OUT_OF_SERVICE">❌ Out of Service</option>
                <option value="UNDER_MAINTENANCE">🔧 Under Maintenance</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Resources Table */}
      <div className="card bg-base-100 shadow-xl">
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th 
                  className="cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  Name {sortBy === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="cursor-pointer"
                  onClick={() => handleSort('type')}
                >
                  Type {sortBy === 'type' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="cursor-pointer"
                  onClick={() => handleSort('capacity')}
                >
                  Capacity {sortBy === 'capacity' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th>Location</th>
                <th 
                  className="cursor-pointer"
                  onClick={() => handleSort('status')}
                >
                  Status {sortBy === 'status' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {resources.map((resource) => (
                <tr key={resource.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getTypeIcon(resource.type)}</span>
                      <span className="font-medium">{resource.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-outline">{resource.type.replace('_', ' ')}</span>
                  </td>
                  <td>{resource.capacity || 'N/A'}</td>
                  <td className="text-sm">{resource.location}</td>
                  <td>
                    <div className={`badge ${getStatusBadge(resource.status)}`}>
                      {resource.status}
                    </div>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => openEditModal(resource)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="btn btn-sm btn-error"
                        onClick={() => handleDelete(resource.id)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">
              {editingResource ? '✏️ Edit Resource' : '➕ Create Resource'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input input-bordered"
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="select select-bordered"
                    required
                  >
                    <option value="LECTURE_HALL">🏛️ Lecture Hall</option>
                    <option value="LAB">🔬 Lab</option>
                    <option value="MEETING_ROOM">🏢 Meeting Room</option>
                    <option value="EQUIPMENT">📱 Equipment</option>
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">Capacity</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    className="input input-bordered"
                    min="1"
                  />
                </div>

                <div className="form-control">
                  <label className="label">Location *</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="input input-bordered"
                    required
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="select select-bordered"
                >
                  <option value="ACTIVE">✅ Active</option>
                  <option value="OUT_OF_SERVICE">❌ Out of Service</option>
                  <option value="UNDER_MAINTENANCE">🔧 Under Maintenance</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="textarea textarea-bordered"
                  rows={3}
                  placeholder="Describe the resource..."
                />
              </div>

              <div className="modal-action">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingResource ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
};

export default ResourceManagement;
