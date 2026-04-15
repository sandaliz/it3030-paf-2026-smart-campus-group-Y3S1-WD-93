import React, { useState } from 'react';
import BookingList from '../../components/bookings/BookingList';
import BookingForm from '../../components/bookings/BookingForm';
import { useAuth } from '../../context/AuthContext';

const BookingManagementPage = () => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleBookingCreated = (booking) => {
    setShowForm(false);
    setRefreshKey(prev => prev + 1);
  };

  const handleCancelForm = () => {
    setShowForm(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Booking Management</h1>
        <p className="text-gray-600">Manage all resource bookings and approvals</p>
      </div>

      {/* Admin Actions */}
      <div className="mb-6 flex flex-wrap gap-2">
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary"
          >
            Create Booking
          </button>
        )}
        
        {/* Additional admin actions can be added here */}
        <button className="btn btn-secondary">
          Export Bookings
        </button>
        
        <button className="btn btn-accent">
          View Statistics
        </button>
        
        <button className="btn btn-warning">
          Check Conflicts
        </button>
      </div>

      {/* Booking Form */}
      {showForm && (
        <div className="mb-8">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="flex justify-between items-center mb-4">
                <h2 className="card-title text-2xl font-bold">Create New Booking</h2>
                <button
                  onClick={handleCancelForm}
                  className="btn btn-ghost btn-sm"
                >
                  Cancel
                </button>
              </div>
              <BookingForm
                onBookingCreated={handleBookingCreated}
                onCancel={handleCancelForm}
              />
            </div>
          </div>
        </div>
      )}

      {/* Booking List */}
      <div>
        <BookingList key={refreshKey} userRole="ADMIN" />
      </div>
    </div>
  );
};

export default BookingManagementPage;
