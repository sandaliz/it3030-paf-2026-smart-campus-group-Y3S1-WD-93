import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { bookingService } from '../../services/bookingService';

const localizer = momentLocalizer(moment);

const SharedCalendar = ({ userRole = 'user', userId = null }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadBookings();
  }, [userRole, userId]);

  const loadBookings = async () => {
    setLoading(true);
    setError('');
    try {
      let data;
      if (userRole === 'admin' || userRole === 'booking_manager') {
        // Admin sees all bookings
        data = await bookingService.getAllBookings();
      } else {
        // Users see only their bookings
        data = await bookingService.getMyBookings();
      }
      
      console.log('Calendar - Raw booking data:', data);
      console.log('Calendar - Number of bookings:', data?.length || 0);
      setBookings(data || []);
    } catch (error) {
      console.error('Failed to load bookings:', error);
      setError('Failed to load bookings. Please try again.');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: '#f59e0b',
      APPROVED: '#10b981',
      REJECTED: '#ef4444',
      CANCELLED: '#6b7280'
    };
    return colors[status] || '#3b82f6';
  };

  const getStatusBorderColor = (status) => {
    const colors = {
      PENDING: '#d97706',
      APPROVED: '#059669',
      REJECTED: '#dc2626',
      CANCELLED: '#4b5563'
    };
    return colors[status] || '#2563eb';
  };

  const calendarEvents = useMemo(() => {
    if (!bookings || bookings.length === 0) {
      console.log('Calendar - No bookings to process');
      return [];
    }
    
    console.log('Calendar - Processing bookings:', bookings);
    
    const events = bookings.filter(booking => booking && booking.date).map(booking => {
      try {
        const startDate = moment(`${booking.date} ${booking.startTime || '00:00'}`);
        const endDate = moment(`${booking.date} ${booking.endTime || '23:59'}`);
        
        console.log('Calendar - Processing booking:', booking);
        console.log('Calendar - Start date:', startDate.format(), 'Valid:', startDate.isValid());
        console.log('Calendar - End date:', endDate.format(), 'Valid:', endDate.isValid());
        
        // Validate dates
        if (!startDate.isValid() || !endDate.isValid()) {
          console.warn('Invalid date for booking:', booking);
          return null;
        }
        
        const event = {
          id: booking.id,
          title: `${booking.resourceName || 'Resource'} - ${booking.purpose || 'Booking'}`,
          start: startDate.toDate(),
          end: endDate.toDate(),
          resource: booking,
          status: booking.status,
          backgroundColor: getStatusColor(booking.status),
          borderColor: getStatusBorderColor(booking.status),
          textColor: '#ffffff'
        };
        
        console.log('Calendar - Created event:', event);
        return event;
      } catch (error) {
        console.error('Error processing booking:', booking, error);
        return null;
      }
    }).filter(Boolean); // Remove null entries
    
    console.log('Calendar - Final events:', events);
    return events;
  }, [bookings]);

  const eventStyleGetter = (event) => {
    return {
      style: {
        backgroundColor: event.backgroundColor,
        borderColor: event.borderColor,
        color: event.textColor,
        borderRadius: '4px',
        border: '1px solid',
        padding: '2px 4px',
        fontSize: '12px',
        fontWeight: '500'
      }
    };
  };

  const handleSelectEvent = (event) => {
    setSelectedBooking(event.resource);
    setShowModal(true);
  };

  const handleNavigate = (newDate) => {
    setDate(newDate);
  };

  const handleViewChange = (newView) => {
    setView(newView);
  };

  const formatTime = (time) => {
    if (!time) return '-';
    const [hourText, minuteText] = time.split(':');
    const hour = Number(hourText);
    const period = hour >= 12 ? 'PM' : 'AM';
    const normalizedHour = hour % 12 || 12;
    return `${normalizedHour}:${minuteText} ${period}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">
          {userRole === 'admin' || userRole === 'booking_manager' ? 'Booking Calendar' : 'My Bookings Calendar'}
        </h1>
        <p className="text-base-content/70">
          {userRole === 'admin' || userRole === 'booking_manager' 
            ? 'View and manage all bookings in calendar format with color-coded status indicators.'
            : 'View your personal bookings in calendar format with color-coded status indicators.'
          }
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f59e0b' }}></div>
              <span className="text-sm">Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10b981' }}></div>
              <span className="text-sm">Approved</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ef4444' }}></div>
              <span className="text-sm">Rejected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#6b7280' }}></div>
              <span className="text-sm">Cancelled</span>
            </div>
          </div>
          
          {/* Debug info */}
          <div className="text-xs text-base-content/60 bg-base-200 px-2 py-1 rounded">
            Debug: {bookings.length} bookings loaded, {calendarEvents.length} events created
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            className={`btn btn-sm ${view === Views.MONTH ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setView(Views.MONTH)}
          >
            Month
          </button>
          <button
            className={`btn btn-sm ${view === Views.WEEK ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setView(Views.WEEK)}
          >
            Week
          </button>
          <button
            className={`btn btn-sm ${view === Views.DAY ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setView(Views.DAY)}
          >
            Day
          </button>
          <button
            className="btn btn-sm btn-outline"
            onClick={loadBookings}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          <span>{error}</span>
          <button className="btn btn-sm btn-ghost ml-auto" onClick={loadBookings}>
            Retry
          </button>
        </div>
      )}

      <div className="card bg-base-100 shadow-md">
        <div className="card-body p-0">
          <div style={{ height: '600px', position: 'relative' }}>
            {loading && (
              <div className="absolute inset-0 bg-base-100 bg-opacity-90 flex items-center justify-center z-10">
                <div className="text-center">
                  <span className="loading loading-spinner loading-lg text-primary"></span>
                  <p className="mt-2 text-base-content/70">Loading calendar...</p>
                </div>
              </div>
            )}
            <Calendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              view={view}
              date={date}
              onNavigate={handleNavigate}
              onView={handleViewChange}
              onSelectEvent={handleSelectEvent}
              eventPropGetter={eventStyleGetter}
              popup={true}
              tooltipAccessor="title"
              timeslots={4}
              step={15}
              showMultiDayTimes={true}
              messages={{
                next: "Next",
                previous: "Previous",
                today: "Today",
                month: "Month",
                week: "Week",
                day: "Day",
                agenda: "Agenda",
                date: "Date",
                time: "Time",
                event: "Event",
                noEventsInRange: "No bookings found in this period"
              }}
            />
          </div>
        </div>
      </div>

      {showModal && selectedBooking && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="text-lg font-bold mb-4">Booking Details</h3>
            
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-semibold">Booking ID:</span> {selectedBooking.id}
              </div>
              <div>
                <span className="font-semibold">Resource:</span> {selectedBooking.resourceName || 'Unknown'}
                {selectedBooking.resourceType && (
                  <span className="text-base-content/60"> ({selectedBooking.resourceType})</span>
                )}
              </div>
              <div>
                <span className="font-semibold">User ID:</span> {selectedBooking.userId}
              </div>
              <div>
                <span className="font-semibold">Date:</span> {formatDate(selectedBooking.date)}
              </div>
              <div>
                <span className="font-semibold">Time:</span> {formatTime(selectedBooking.startTime)} - {formatTime(selectedBooking.endTime)}
              </div>
              {selectedBooking.expectedAttendees && (
                <div>
                  <span className="font-semibold">Expected Attendees:</span> {selectedBooking.expectedAttendees}
                </div>
              )}
              <div>
                <span className="font-semibold">Purpose:</span> {selectedBooking.purpose || 'Not specified'}
              </div>
              <div>
                <span className="font-semibold">Status:</span>{' '}
                <span className={`badge ${getStatusBadgeClass(selectedBooking.status)}`}>
                  {selectedBooking.status}
                </span>
              </div>
              {selectedBooking.rejectionReason && (
                <div>
                  <span className="font-semibold">Rejection Reason:</span> {selectedBooking.rejectionReason}
                </div>
              )}
              <div>
                <span className="font-semibold">Created:</span>{' '}
                {selectedBooking.createdAt 
                  ? new Date(selectedBooking.createdAt).toLocaleString()
                  : 'Unknown'
                }
              </div>
            </div>

            <div className="modal-action">
              <button className="btn" onClick={() => setShowModal(false)}>
                Close
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowModal(false)}></div>
        </div>
      )}
    </div>
  );
};

export default SharedCalendar;
