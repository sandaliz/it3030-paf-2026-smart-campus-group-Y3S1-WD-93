import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const BookingManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedBookings, setSelectedBookings] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [bulkReason, setBulkReason] = useState('');
  
  const [filters, setFilters] = useState({
    status: '',
    resourceId: '',
    userId: '',
    startDate: '',
    endDate: '',
  });
  
  const [pagination, setPagination] = useState({
    page: 0,
    size: 10,
    sortBy: 'createdAt',
    sortDir: 'desc',
    totalPages: 0,
    totalElements: 0,
  });

  useEffect(() => {
    fetchBookings();
  }, [pagination.page, pagination.size, pagination.sortBy, pagination.sortDir, filters]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        size: pagination.size,
        sortBy: pagination.sortBy,
        sortDir: pagination.sortDir,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        ),
      });
      
      const response = await api.getBookingsPaginated(`?${params}`);
      setBookings(response.content || []);
      setPagination(prev => ({
        ...prev,
        totalPages: response.totalPages || 0,
        totalElements: response.totalElements || 0,
      }));
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  const handleSort = (field) => {
    if (pagination.sortBy === field) {
      setPagination(prev => ({
        ...prev,
        sortDir: prev.sortDir === 'asc' ? 'desc' : 'asc',
      }));
    } else {
      setPagination(prev => ({
        ...prev,
        sortBy: field,
        sortDir: 'asc',
      }));
    }
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  const handleBookingSelection = (bookingId) => {
    setSelectedBookings(prev => 
      prev.includes(bookingId) 
        ? prev.filter(id => id !== bookingId)
        : [...prev, bookingId]
    );
  };

  const handleSelectAll = () => {
    const allIds = bookings.map(b => b.id);
    setSelectedBookings(allIds);
  };

  const handleBulkAction = async () => {
    if (selectedBookings.length === 0) {
      alert('Please select at least one booking');
      return;
    }

    if (!bulkAction) {
      alert('Please select an action');
      return;
    }

    try {
      const response = await api.bulkUpdateBookingStatus({
        bookingIds: selectedBookings,
        status: bulkAction,
        reason: bulkReason,
      });
      
      alert(`Successfully ${bulkAction.toLowerCase()}d ${response.updatedCount} bookings`);
      setSelectedBookings([]);
      setBulkAction('');
      setBulkReason('');
      fetchBookings();
    } catch (error) {
      console.error('Failed to perform bulk action:', error);
      alert('Failed to perform bulk action: ' + error.message);
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams(
        Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        )
      );
      
      const response = await api.exportBookings(`?${params}`);
      
      // Create download link
      const blob = new Blob([response], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bookings_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export bookings:', error);
      alert('Failed to export bookings: ' + error.message);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'PENDING': 'badge-warning',
      'APPROVED': 'badge-success',
      'REJECTED': 'badge-error',
      'CANCELLED': 'badge-ghost',
    };
    return badges[status] || 'badge-outline';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString.substring(0, 5);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <h1 className="text-3xl font-bold">📅 Booking Management</h1>
        
        <div className="flex gap-2">
          <button className="btn btn-primary" onClick={handleExport}>
            📥 Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h3 className="card-title">🔍 Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="form-control">
              <label className="label">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="select select-bordered"
              >
                <option value="">All Status</option>
                <option value="PENDING">⏳ Pending</option>
                <option value="APPROVED">✅ Approved</option>
                <option value="REJECTED">❌ Rejected</option>
                <option value="CANCELLED">🚫 Cancelled</option>
              </select>
            </div>
            
            <div className="form-control">
              <label className="label">Resource ID</label>
              <input
                type="text"
                value={filters.resourceId}
                onChange={(e) => handleFilterChange('resourceId', e.target.value)}
                className="input input-bordered"
                placeholder="Resource ID..."
              />
            </div>
            
            <div className="form-control">
              <label className="label">User ID</label>
              <input
                type="text"
                value={filters.userId}
                onChange={(e) => handleFilterChange('userId', e.target.value)}
                className="input input-bordered"
                placeholder="User ID..."
              />
            </div>
            
            <div className="form-control">
              <label className="label">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="input input-bordered"
              />
            </div>
            
            <div className="form-control">
              <label className="label">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="input input-bordered"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedBookings.length > 0 && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h3 className="card-title">⚡ Bulk Actions ({selectedBookings.length} selected)</h3>
            <div className="flex gap-2 items-end">
              <div className="flex gap-2 items-end">
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  className="select select-bordered"
                >
                  <option value="">Select Action</option>
                  <option value="APPROVED">✅ Approve</option>
                  <option value="REJECTED">❌ Reject</option>
                  <option value="CANCELLED">🚫 Cancel</option>
                </select>
                
                {bulkAction && bulkAction !== 'CANCELLED' && (
                  <input
                    type="text"
                    value={bulkReason}
                    onChange={(e) => setBulkReason(e.target.value)}
                    className="input input-bordered"
                    placeholder="Reason (required for approve/reject)"
                  />
                )}
              </div>
              
              <button
                className="btn btn-primary"
                onClick={handleBulkAction}
                disabled={!bulkAction || (bulkAction !== 'CANCELLED' && !bulkReason.trim())}
              >
                Execute
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bookings Table */}
      <div className="card bg-base-100 shadow-xl">
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={selectedBookings.length === bookings.length}
                    onChange={handleSelectAll}
                    className="checkbox"
                  />
                </th>
                <th 
                  className="cursor-pointer"
                  onClick={() => handleSort('date')}
                >
                  Date {pagination.sortBy === 'date' && (pagination.sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th>Resource</th>
                <th>User</th>
                <th>Purpose</th>
                <th>Time</th>
                <th 
                  className="cursor-pointer"
                  onClick={() => handleSort('status')}
                >
                  Status {pagination.sortBy === 'status' && (pagination.sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedBookings.includes(booking.id)}
                      onChange={() => handleBookingSelection(booking.id)}
                      className="checkbox"
                    />
                  </td>
                  <td>{formatDate(booking.date)}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span>{getTypeIcon(booking.resourceType)}</span>
                      <span className="font-medium">{booking.resourceName}</span>
                    </div>
                  </td>
                  <td className="text-sm">{booking.userId}</td>
                  <td>
                    <div className="max-w-xs truncate" title={booking.purpose}>
                      {booking.purpose}
                    </div>
                  </td>
                  <td className="text-sm">
                    {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                  </td>
                  <td>
                    <div className={`badge ${getStatusBadge(booking.status)}`}>
                      {booking.status}
                    </div>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button
                        className="btn btn-xs btn-outline"
                        onClick={() => alert('View details coming soon!')}
                      >
                        👁 View
                      </button>
                      <button
                        className="btn btn-xs btn-warning"
                        onClick={() => alert('Edit functionality coming soon!')}
                      >
                        ✏️ Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <div className="btn-group">
            <button
              className="btn"
              disabled={pagination.page === 0}
              onClick={() => setPagination(prev => ({ ...prev, page: 0 }))}
            >
              First
            </button>
            <button
              className="btn"
              disabled={pagination.page === 0}
              onClick={() => setPagination(prev => ({ ...prev, page: Math.max(0, prev.page - 1) }))}
            >
              Previous
            </button>
            
            <span className="btn btn-active">
              Page {pagination.page + 1} of {pagination.totalPages}
            </span>
            
            <button
              className="btn"
              disabled={pagination.page >= pagination.totalPages - 1}
              onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages - 1, prev.page + 1) }))}
            >
              Next
            </button>
            <button
              className="btn"
              disabled={pagination.page >= pagination.totalPages - 1}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.totalPages - 1 }))}
            >
              Last
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingManagement;
