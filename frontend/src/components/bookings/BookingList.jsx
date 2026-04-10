import React, { useState, useEffect } from 'react';
import { bookingService } from '../../services/bookingService';

const BookingList = ({ userRole = 'USER' }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    resourceId: '',
    startDate: '',
    endDate: ''
  });
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadBookings();
  }, [userRole]);

  const loadBookings = async () => {
    setLoading(true);
    setError('');
    try {
      let bookingsData;
      if (userRole === 'ADMIN') {
        bookingsData = await bookingService.getAllBookings(filters);
      } else {
        bookingsData = await bookingService.getMyBookings();
      }
      setBookings(bookingsData);
    } catch (error) {
      console.error('Error loading bookings:', error);
      setError(error.response?.data?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const applyFilters = () => {
    loadBookings();
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      resourceId: '',
      startDate: '',
      endDate: ''
    });
    setTimeout(loadBookings, 0);
  };

  const handleStatusUpdate = async (bookingId, newStatus, reason = '') => {
    try {
      await bookingService.updateBookingStatus(bookingId, newStatus, reason);
      loadBookings(); // Reload bookings
      setShowDetails(false);
    } catch (error) {
      console.error('Error updating status:', error);
      setError(error.response?.data?.message || 'Failed to update booking status');
    }
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    
    try {
      await bookingService.cancelBooking(bookingId);
      loadBookings(); // Reload bookings
      setShowDetails(false);
    } catch (error) {
      console.error('Error cancelling booking:', error);
      setError(error.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      PENDING: 'badge-warning',
      APPROVED: 'badge-success',
      REJECTED: 'badge-error',
      CANCELLED: 'badge-ghost'
    };
    
    return (
      <span className={`badge ${statusClasses[status] || 'badge-ghost'}`}>
        {status}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          {userRole === 'ADMIN' ? 'All Bookings' : 'My Bookings'}
        </h2>
        <div className="text-sm text-gray-600">
          {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      {/* Filters (Admin Only) */}
      {userRole === 'ADMIN' && (
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h3 className="card-title text-lg">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Status</span>
                </label>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="select select-bordered select-sm"
                >
                  <option value="">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Resource ID</span>
                </label>
                <input
                  type="text"
                  name="resourceId"
                  value={filters.resourceId}
                  onChange={handleFilterChange}
                  placeholder="Resource ID"
                  className="input input-bordered input-sm"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Start Date</span>
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  className="input input-bordered input-sm"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">End Date</span>
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  className="input input-bordered input-sm"
                />
              </div>
            </div>

            <div className="card-actions justify-end gap-2">
              <button onClick={clearFilters} className="btn btn-ghost btn-sm">
                Clear
              </button>
              <button onClick={applyFilters} className="btn btn-primary btn-sm">
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <div className="card bg-base-100 shadow-md">
          <div className="card-body text-center">
            <div className="text-gray-500">
              {userRole === 'ADMIN' ? 'No bookings found' : 'You have no bookings yet'}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
              <div className="card-body">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="card-title text-lg">{booking.resourceName}</h3>
                      {getStatusBadge(booking.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Date:</span> {formatDate(booking.date)}
                      </div>
                      <div>
                        <span className="font-medium">Time:</span> {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                      </div>
                      <div>
                        <span className="font-medium">Attendees:</span> {booking.expectedAttendees}
                      </div>
                      <div className="md:col-span-2 lg:col-span-3">
                        <span className="font-medium">Purpose:</span> {booking.purpose}
                      </div>
                    </div>

                    {booking.rejectionReason && (
                      <div className="mt-2 p-2 bg-error/10 rounded text-sm">
                        <span className="font-medium text-error">Rejection Reason:</span> {booking.rejectionReason}
                      </div>
                    )}

                    <div className="text-xs text-gray-500 mt-2">
                      Created: {new Date(booking.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => {
                        setSelectedBooking(booking);
                        setShowDetails(true);
                      }}
                      className="btn btn-sm btn-outline"
                    >
                      View Details
                    </button>
                    
                    {userRole === 'ADMIN' && booking.status === 'PENDING' && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleStatusUpdate(booking.id, 'APPROVED', 'Approved by admin')}
                          className="btn btn-xs btn-success"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt('Rejection reason:');
                            if (reason) {
                              handleStatusUpdate(booking.id, 'REJECTED', reason);
                            }
                          }}
                          className="btn btn-xs btn-error"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    
                    {(booking.status === 'PENDING' || booking.status === 'APPROVED') && (
                      <button
                        onClick={() => handleCancel(booking.id)}
                        className="btn btn-xs btn-ghost text-error"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Details Modal */}
      {showDetails && selectedBooking && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Booking Details</h3>
            
            <div className="py-4 space-y-3">
              <div>
                <span className="font-medium">Booking ID:</span> {selectedBooking.id}
              </div>
              <div>
                <span className="font-medium">Resource:</span> {selectedBooking.resourceName} ({selectedBooking.resourceType})
              </div>
              <div>
                <span className="font-medium">Date:</span> {formatDate(selectedBooking.date)}
              </div>
              <div>
                <span className="font-medium">Time:</span> {formatTime(selectedBooking.startTime)} - {formatTime(selectedBooking.endTime)}
              </div>
              <div>
                <span className="font-medium">Expected Attendees:</span> {selectedBooking.expectedAttendees}
              </div>
              <div>
                <span className="font-medium">Purpose:</span> {selectedBooking.purpose}
              </div>
              <div>
                <span className="font-medium">Status:</span> {getStatusBadge(selectedBooking.status)}
              </div>
              {selectedBooking.rejectionReason && (
                <div>
                  <span className="font-medium">Rejection Reason:</span> {selectedBooking.rejectionReason}
                </div>
              )}
              <div>
                <span className="font-medium">Created:</span> {new Date(selectedBooking.createdAt).toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Last Updated:</span> {new Date(selectedBooking.updatedAt).toLocaleString()}
              </div>
            </div>
            
            <div className="modal-action">
              <button onClick={() => setShowDetails(false)} className="btn">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingList;
