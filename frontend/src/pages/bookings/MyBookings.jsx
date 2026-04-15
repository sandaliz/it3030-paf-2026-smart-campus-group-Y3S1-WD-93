import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchBookings();
    
    if (searchParams.get('success') === 'true') {
      // Show success message
      setTimeout(() => {
        const alert = document.createElement('div');
        alert.className = 'alert alert-success fixed top-4 right-4 w-96 z-50';
        alert.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>Booking created successfully!</span>
        `;
        document.body.appendChild(alert);
        setTimeout(() => alert.remove(), 3000);
      }, 100);
    }
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await api.getMyBookings();
      setBookings(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      await api.cancelBooking(bookingId);
      setBookings(bookings.filter(b => b.id !== bookingId));
      
      // Show success message
      const alert = document.createElement('div');
      alert.className = 'alert alert-info fixed top-4 right-4 w-96 z-50';
      alert.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 h-6 w-6">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span>Booking cancelled successfully!</span>
      `;
      document.body.appendChild(alert);
      setTimeout(() => alert.remove(), 3000);
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      alert('Failed to cancel booking: ' + error.message);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.resourceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.date.includes(searchTerm);
    
    const matchesStatus = !filterStatus || booking.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const badges = {
      'PENDING': 'badge-warning',
      'APPROVED': 'badge-success',
      'REJECTED': 'badge-error',
      'CANCELLED': 'badge-ghost',
    };
    return badges[status] || 'badge-ghost';
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
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
        <h1 className="text-3xl font-bold">📅 My Bookings</h1>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <input
            type="text"
            placeholder="Search bookings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input input-bordered flex-1"
          />
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="select select-bordered"
          >
            <option value="">All Status</option>
            <option value="PENDING">⏳ Pending</option>
            <option value="APPROVED">✅ Approved</option>
            <option value="REJECTED">❌ Rejected</option>
            <option value="CANCELLED">🚫 Cancelled</option>
          </select>
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="alert alert-info">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>
            {bookings.length === 0 ? 'You have no bookings yet.' : 'No bookings found matching your criteria.'}
          </span>
          {bookings.length === 0 && (
            <div className="mt-2">
              <a href="/bookings/new" className="btn btn-primary btn-sm">
                📅 Create Your First Booking
              </a>
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Resource</th>
                <th>Date & Time</th>
                <th>Purpose</th>
                <th>Attendees</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => (
                <tr key={booking.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <span>{getTypeIcon(booking.resourceType)}</span>
                      <div>
                        <div className="font-medium">{booking.resourceName}</div>
                        <div className="text-sm opacity-70">{booking.resourceType.replace('_', ' ')}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="text-sm">
                      <div className="font-medium">{formatDate(booking.date)}</div>
                      <div className="opacity-70">
                        {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="max-w-xs truncate" title={booking.purpose}>
                      {booking.purpose}
                    </div>
                  </td>
                  <td>{booking.expectedAttendees}</td>
                  <td>
                    <div className={`badge ${getStatusBadge(booking.status)}`}>
                      {booking.status}
                    </div>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      {booking.status === 'PENDING' && (
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          className="btn btn-error btn-xs"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        className="btn btn-outline btn-xs"
                        onClick={() => alert('Edit functionality coming soon!')}
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MyBookings;
