import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { bookingService } from '../../services/bookingService';

const CalendarPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    loadBookings();
  }, [currentDate]);

  const loadBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
      const data = await bookingService.getBookingsByDateRange(startDate, endDate);
      setBookings(data || []);
    } catch (err) {
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const getBookingsForDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return bookings.filter((b) => b.date === dateStr);
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="flex min-h-screen bg-base-200">
      <AdminSidebar />
      <div className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Booking Calendar</h1>
          <p className="text-gray-500 mt-1">Overview of all bookings</p>
        </div>

        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        )}

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <button className="btn btn-ghost btn-sm" onClick={prevMonth}>&#8249;</button>
              <h2 className="text-xl font-semibold">{monthName}</h2>
              <button className="btn btn-ghost btn-sm" onClick={nextMonth}>&#8250;</button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <span className="loading loading-spinner loading-lg text-primary"></span>
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1">
                {dayNames.map((d) => (
                  <div key={d} className="text-center text-xs font-semibold text-gray-500 py-2">
                    {d}
                  </div>
                ))}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                  const dayBookings = getBookingsForDay(day);
                  const isToday =
                    new Date().getDate() === day &&
                    new Date().getMonth() === month &&
                    new Date().getFullYear() === year;
                  return (
                    <div
                      key={day}
                      className={`min-h-16 p-1 border rounded-lg ${isToday ? 'border-primary bg-primary/10' : 'border-base-300'}`}
                    >
                      <div className={`text-sm font-medium mb-1 ${isToday ? 'text-primary' : ''}`}>{day}</div>
                      {dayBookings.slice(0, 2).map((b) => (
                        <div
                          key={b.id}
                          className={`text-xs rounded px-1 py-0.5 mb-0.5 truncate ${
                            b.status === 'APPROVED'
                              ? 'bg-success/20 text-success-content'
                              : b.status === 'PENDING'
                              ? 'bg-warning/20 text-warning-content'
                              : 'bg-error/20 text-error-content'
                          }`}
                          title={`${b.resourceName || 'Resource'} - ${b.status}`}
                        >
                          {b.resourceName || b.resourceId}
                        </div>
                      ))}
                      {dayBookings.length > 2 && (
                        <div className="text-xs text-gray-400">+{dayBookings.length - 2} more</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
