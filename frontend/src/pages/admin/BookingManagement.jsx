import React, { useEffect, useMemo, useState } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { bookingService } from '../../services/bookingService';

const INITIAL_FILTERS = {
  status: '',
  resourceId: '',
  userId: '',
  startDate: '',
  endDate: ''
};

const BookingManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [bookingToReject, setBookingToReject] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  useEffect(() => {
    loadBookings();
  }, []);

  const bookingStats = useMemo(() => {
    return bookings.reduce(
      (stats, booking) => {
        stats.total += 1;
        stats[booking.status] = (stats[booking.status] || 0) + 1;
        return stats;
      },
      {
        total: 0,
        PENDING: 0,
        APPROVED: 0,
        REJECTED: 0,
        CANCELLED: 0
      }
    );
  }, [bookings]);

  const loadBookings = async (nextFilters = filters) => {
    setLoading(true);
    setError('');

    try {
      const sanitizedFilters = Object.fromEntries(
        Object.entries(nextFilters).filter(([, value]) => value !== '')
      );
      const data = await bookingService.getAllBookings(sanitizedFilters);
      setBookings(data);
    } catch (fetchError) {
      console.error('Failed to fetch bookings:', fetchError);
      setError(fetchError.response?.data?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    loadBookings(filters);
  };

  const handleClearFilters = () => {
    setFilters(INITIAL_FILTERS);
    loadBookings(INITIAL_FILTERS);
  };

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    setError('');
    
    try {
      // Get filtered bookings for report
      const sanitizedFilters = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== '')
      );
      
      // Generate report using the existing export endpoint
      const reportBlob = await bookingService.exportBookings(sanitizedFilters);
      
      // Create download link
      const url = window.URL.createObjectURL(reportBlob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with current date
      const currentDate = new Date().toISOString().split('T')[0];
      const filterSuffix = Object.keys(sanitizedFilters).length > 0 ? '_filtered' : '';
      link.download = `booking_report_${currentDate}${filterSuffix}.csv`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setSuccess('Report generated and downloaded successfully!');
    } catch (reportError) {
      console.error('Failed to generate report:', reportError);
      setError(reportError.response?.data?.message || 'Failed to generate report');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleApprove = async (bookingId) => {
    setSubmittingId(bookingId);
    setError('');
    setSuccess('');

    try {
      await bookingService.updateBookingStatus(bookingId, 'APPROVED', 'Approved by admin');
      setSuccess('Booking approved successfully.');
      await loadBookings();
      if (selectedBooking?.id === bookingId) {
        const updatedBooking = await bookingService.getBookingById(bookingId);
        setSelectedBooking(updatedBooking);
      }
    } catch (updateError) {
      console.error('Failed to approve booking:', updateError);
      setError(updateError.response?.data?.message || 'Failed to approve booking');
    } finally {
      setSubmittingId('');
    }
  };

  const openRejectModal = (booking) => {
    setBookingToReject(booking);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!bookingToReject) {
      return;
    }

    if (!rejectionReason.trim()) {
      setError('A rejection reason is required.');
      return;
    }

    setSubmittingId(bookingToReject.id);
    setError('');
    setSuccess('');

    try {
      await bookingService.updateBookingStatus(
        bookingToReject.id,
        'REJECTED',
        rejectionReason.trim()
      );
      setSuccess('Booking rejected successfully.');
      setShowRejectModal(false);
      await loadBookings();

      if (selectedBooking?.id === bookingToReject.id) {
        const updatedBooking = await bookingService.getBookingById(bookingToReject.id);
        setSelectedBooking(updatedBooking);
      }
    } catch (updateError) {
      console.error('Failed to reject booking:', updateError);
      setError(updateError.response?.data?.message || 'Failed to reject booking');
    } finally {
      setSubmittingId('');
    }
  };

  const openDetails = (booking) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
  };

  const getStatusBadgeClass = (status) => {
    const styles = {
      PENDING: 'badge-warning',
      APPROVED: 'badge-success',
      REJECTED: 'badge-error',
      CANCELLED: 'badge-ghost'
    };

    return styles[status] || 'badge-outline';
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

  const formatTime = (time) => {
    if (!time) {
      return '-';
    }

    const [hourText, minuteText] = time.split(':');
    const hour = Number(hourText);
    const period = hour >= 12 ? 'PM' : 'AM';
    const normalizedHour = hour % 12 || 12;
    return `${normalizedHour}:${minuteText} ${period}`;
  };

  return (
    <div className="min-h-screen bg-base-200">
      <div className="flex min-h-screen">
        <AdminSidebar />

        <div className="flex-1 p-6 lg:p-8">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Booking Management</h1>
              <p className="text-base-content/70">
                Review created bookings, track their status, and approve or reject pending requests.
              </p>
            </div>

            <div className="flex gap-2">
              <button 
                className="btn btn-success" 
                onClick={handleGenerateReport} 
                disabled={isGeneratingReport || loading}
              >
                {isGeneratingReport ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Generate Report
                  </>
                )}
              </button>
              <button className="btn btn-outline" onClick={() => loadBookings()} disabled={loading}>
                Refresh
              </button>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="card bg-base-100 shadow-md">
              <div className="card-body p-4">
                <p className="text-sm text-base-content/70">Total Bookings</p>
                <p className="text-3xl font-bold">{bookingStats.total}</p>
              </div>
            </div>
            <div className="card bg-base-100 shadow-md">
              <div className="card-body p-4">
                <p className="text-sm text-base-content/70">Pending</p>
                <p className="text-3xl font-bold text-warning">{bookingStats.PENDING}</p>
              </div>
            </div>
            <div className="card bg-base-100 shadow-md">
              <div className="card-body p-4">
                <p className="text-sm text-base-content/70">Approved</p>
                <p className="text-3xl font-bold text-success">{bookingStats.APPROVED}</p>
              </div>
            </div>
            <div className="card bg-base-100 shadow-md">
              <div className="card-body p-4">
                <p className="text-sm text-base-content/70">Rejected</p>
                <p className="text-3xl font-bold text-error">{bookingStats.REJECTED}</p>
              </div>
            </div>
            <div className="card bg-base-100 shadow-md">
              <div className="card-body p-4">
                <p className="text-sm text-base-content/70">Cancelled</p>
                <p className="text-3xl font-bold">{bookingStats.CANCELLED}</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="alert alert-error mb-6">
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert alert-success mb-6">
              <span>{success}</span>
            </div>
          )}

          <div className="card bg-base-100 shadow-md mb-6">
            <div className="card-body">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="card-title">Filters</h2>
                <button className="btn btn-ghost btn-sm" onClick={handleClearFilters}>
                  Clear
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                <label className="form-control">
                  <span className="label-text mb-2">Status</span>
                  <select
                    className="select select-bordered"
                    value={filters.status}
                    onChange={(event) => handleFilterChange('status', event.target.value)}
                  >
                    <option value="">All statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </label>

                <label className="form-control">
                  <span className="label-text mb-2">Resource ID</span>
                  <input
                    className="input input-bordered"
                    placeholder="Filter by resource"
                    value={filters.resourceId}
                    onChange={(event) => handleFilterChange('resourceId', event.target.value)}
                  />
                </label>

                <label className="form-control">
                  <span className="label-text mb-2">User ID</span>
                  <input
                    className="input input-bordered"
                    placeholder="Filter by user"
                    value={filters.userId}
                    onChange={(event) => handleFilterChange('userId', event.target.value)}
                  />
                </label>

                <label className="form-control">
                  <span className="label-text mb-2">Start Date</span>
                  <input
                    className="input input-bordered"
                    type="date"
                    value={filters.startDate}
                    onChange={(event) => handleFilterChange('startDate', event.target.value)}
                  />
                </label>

                <label className="form-control">
                  <span className="label-text mb-2">End Date</span>
                  <input
                    className="input input-bordered"
                    type="date"
                    value={filters.endDate}
                    onChange={(event) => handleFilterChange('endDate', event.target.value)}
                  />
                </label>
              </div>

              <div className="mt-4 flex justify-end">
                <button className="btn btn-primary" onClick={handleApplyFilters} disabled={loading}>
                  Apply Filters
                </button>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-md">
            <div className="card-body p-0">
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>Resource</th>
                      <th>User ID</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Purpose</th>
                      <th>Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="7" className="py-12 text-center">
                          <span className="loading loading-spinner loading-lg"></span>
                        </td>
                      </tr>
                    ) : bookings.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-12 text-center text-base-content/60">
                          No bookings found for the current filters.
                        </td>
                      </tr>
                    ) : (
                      bookings.map((booking) => (
                        <tr key={booking.id}>
                          <td>
                            <div className="font-semibold">{booking.resourceName || 'Unknown resource'}</div>
                            <div className="text-xs text-base-content/60">{booking.resourceType || '-'}</div>
                          </td>
                          <td>{booking.userId}</td>
                          <td>{formatDate(booking.date)}</td>
                          <td>
                            {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                          </td>
                          <td>
                            <div className="max-w-xs truncate" title={booking.purpose}>
                              {booking.purpose}
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${getStatusBadgeClass(booking.status)}`}>
                              {booking.status}
                            </span>
                          </td>
                          <td>
                            <div className="flex justify-end gap-2">
                              <button
                                className="btn btn-sm btn-outline"
                                onClick={() => openDetails(booking)}
                              >
                                View
                              </button>

                              {booking.status === 'PENDING' && (
                                <>
                                  <button
                                    className="btn btn-sm btn-success"
                                    onClick={() => handleApprove(booking.id)}
                                    disabled={submittingId === booking.id}
                                  >
                                    {submittingId === booking.id ? 'Working...' : 'Approve'}
                                  </button>
                                  <button
                                    className="btn btn-sm btn-error"
                                    onClick={() => openRejectModal(booking)}
                                    disabled={submittingId === booking.id}
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showDetailsModal && selectedBooking && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="text-lg font-bold">Booking Details</h3>

            <div className="mt-4 space-y-3 text-sm">
              <div>
                <span className="font-semibold">Booking ID:</span> {selectedBooking.id}
              </div>
              <div>
                <span className="font-semibold">Resource:</span> {selectedBooking.resourceName} (
                {selectedBooking.resourceType || '-'})
              </div>
              <div>
                <span className="font-semibold">User ID:</span> {selectedBooking.userId}
              </div>
              <div>
                <span className="font-semibold">Date:</span> {formatDate(selectedBooking.date)}
              </div>
              <div>
                <span className="font-semibold">Time:</span> {formatTime(selectedBooking.startTime)} -{' '}
                {formatTime(selectedBooking.endTime)}
              </div>
              <div>
                <span className="font-semibold">Expected Attendees:</span>{' '}
                {selectedBooking.expectedAttendees ?? '-'}
              </div>
              <div>
                <span className="font-semibold">Purpose:</span> {selectedBooking.purpose}
              </div>
              <div>
                <span className="font-semibold">Status:</span>{' '}
                <span className={`badge ${getStatusBadgeClass(selectedBooking.status)}`}>
                  {selectedBooking.status}
                </span>
              </div>
              {selectedBooking.rejectionReason && (
                <div>
                  <span className="font-semibold">Rejection Reason:</span>{' '}
                  {selectedBooking.rejectionReason}
                </div>
              )}
              <div>
                <span className="font-semibold">Created At:</span>{' '}
                {selectedBooking.createdAt
                  ? new Date(selectedBooking.createdAt).toLocaleString()
                  : '-'}
              </div>
              <div>
                <span className="font-semibold">Updated At:</span>{' '}
                {selectedBooking.updatedAt
                  ? new Date(selectedBooking.updatedAt).toLocaleString()
                  : '-'}
              </div>
            </div>

            <div className="modal-action">
              <button className="btn" onClick={() => setShowDetailsModal(false)}>
                Close
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowDetailsModal(false)}></div>
        </div>
      )}

      {showRejectModal && bookingToReject && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="text-lg font-bold">Reject Booking</h3>
            <p className="mt-2 text-sm text-base-content/70">
              Add a reason for rejecting this booking so the requester can see it.
            </p>

            <label className="form-control mt-4">
              <span className="label-text mb-2">Rejection reason</span>
              <textarea
                className="textarea textarea-bordered min-h-28"
                placeholder="Enter rejection reason"
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
              />
            </label>

            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setShowRejectModal(false);
                  setBookingToReject(null);
                  setRejectionReason('');
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-error"
                onClick={handleReject}
                disabled={submittingId === bookingToReject.id}
              >
                {submittingId === bookingToReject.id ? 'Rejecting...' : 'Reject Booking'}
              </button>
            </div>
          </div>
          <div
            className="modal-backdrop"
            onClick={() => {
              setShowRejectModal(false);
              setBookingToReject(null);
              setRejectionReason('');
            }}
          ></div>
        </div>
      )}
    </div>
  );
};

export default BookingManagement;
