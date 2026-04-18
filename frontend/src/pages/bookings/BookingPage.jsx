import React, { useState } from 'react';
import BookingForm from '../../components/bookings/BookingForm';
import BookingList from '../../components/bookings/BookingList';
import { useAuth } from '../../context/AuthContext';

const BookingPage = () => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleBookingCreated = (booking) => {
    setShowForm(false);
    setRefreshKey(prev => prev + 1); // Force refresh of booking list
  };

  const handleCancelForm = () => {
    setShowForm(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Bookings</h1>
        <p className="text-gray-600">Manage your resource bookings</p>
      </div>

      {/* Action Buttons */}
      <div className="mb-6">
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary"
          >
            Create New Booking
          </button>
        )}
      </div>

      {/* Booking Form */}
      {showForm && (
        <div className="mb-8">
          <BookingForm
            onBookingCreated={handleBookingCreated}
            onCancel={handleCancelForm}
          />
        </div>
      )}

      {/* Booking List */}
      <div>
        <BookingList
          key={refreshKey}
          userRole={user?.roles?.some((role) => role.replace('ROLE_', '') === 'ADMIN') ? 'ADMIN' : 'USER'}
        />
      </div>
    </div>
  );
};

export default BookingPage;
