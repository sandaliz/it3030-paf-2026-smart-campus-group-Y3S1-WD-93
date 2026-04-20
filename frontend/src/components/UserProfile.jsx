import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';
import { bookingService } from '../services/bookingService';
import { ticketService } from '../services/ticketService';

const UserProfile = () => {
  const { user, updateUser } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [passwordError, setPasswordError] = useState('');
  const [userBookings, setUserBookings] = useState([]);
  const [userTickets, setUserTickets] = useState([]);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    fetchProfileData();
    fetchUserBookings();
    fetchUserTickets();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const response = await userService.getCurrentUser();
      setProfileData(response);
      setEditForm(response);
    } catch (error) {
      console.error('Failed to fetch profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserBookings = async () => {
    try {
      const bookings = await bookingService.getMyBookings();
      setUserBookings(bookings || []);
    } catch (error) {
      console.error('Failed to fetch user bookings:', error);
    }
  };

  const fetchUserTickets = async () => {
    try {
      const tickets = await ticketService.getMyTickets();
      setUserTickets(tickets?.content || tickets || []);
    } catch (error) {
      console.error('Failed to fetch user tickets:', error);
    }
  };

  const handleEdit = () => {
    setEditing(true);
    setEditForm(profileData);
  };

  const handleCancel = () => {
    setEditing(false);
    setEditForm(profileData);
  };

  const handleSave = async () => {
    // Check password validation if password is being changed
    if (editForm.password && passwordError) {
      alert('Please fix password errors before saving');
      return;
    }

    try {
      const response = await userService.updateProfile(editForm);
      setProfileData(response);
      updateUser(response);
      setEditing(false);
      setPasswordError('');
      alert('Profile updated successfully');
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));

    // Validate password if it's being changed
    if (name === 'password' && value) {
      if (value.length < 8) {
        setPasswordError('Password must be at least 8 characters');
      } else if (!/[A-Z]/.test(value)) {
        setPasswordError('Password must contain at least one uppercase letter');
      } else if (!/[a-z]/.test(value)) {
        setPasswordError('Password must contain at least one lowercase letter');
      } else if (!/\d/.test(value)) {
        setPasswordError('Password must contain at least one number');
      } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
        setPasswordError('Password must contain at least one special character');
      } else {
        setPasswordError('');
      }
    } else if (name === 'password' && !value) {
      setPasswordError('');
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'ADMIN': return 'badge-error';
      case 'LECTURER': return 'badge-info';
      case 'STUDENT': return 'badge-success';
      case 'TECHNICIAN': return 'badge-warning';
      case 'NON_ACADEMIC': return 'badge-secondary';
      default: return 'badge-ghost';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'APPROVED': return 'badge-success';
      case 'PENDING': return 'badge-warning';
      case 'REJECTED': return 'badge-error';
      case 'CANCELLED': return 'badge-ghost';
      case 'OPEN': return 'badge-info';
      case 'IN_PROGRESS': return 'badge-warning';
      case 'RESOLVED': return 'badge-success';
      default: return 'badge-ghost';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="bg-base-100 rounded-lg shadow-lg">
        {/* Header */}
        <div className="bg-primary text-primary-content p-6 rounded-t-lg">
          <h1 className="text-2xl font-bold">User Profile</h1>
          <p className="text-sm opacity-90">Manage your personal information and view your activity</p>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-base-300">
          <div className="flex">
            <button
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'profile' 
                  ? 'border-b-2 border-primary text-primary' 
                  : 'text-base-content/70 hover:text-base-content'
              }`}
              onClick={() => setActiveTab('profile')}
            >
              Profile Information
            </button>
            <button
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'bookings' 
                  ? 'border-b-2 border-primary text-primary' 
                  : 'text-base-content/70 hover:text-base-content'
              }`}
              onClick={() => setActiveTab('bookings')}
            >
              My Bookings
            </button>
            <button
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'tickets' 
                  ? 'border-b-2 border-primary text-primary' 
                  : 'text-base-content/70 hover:text-base-content'
              }`}
              onClick={() => setActiveTab('tickets')}
            >
              My Tickets
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'profile' && (
            <div>
              {/* Profile Picture and Basic Info */}
              <div className="flex items-center space-x-6 mb-8">
                <div className="avatar">
                  <div className="w-24 h-24 rounded-full">
                    <img 
                      src={profileData?.picture || user?.picture || "https://img.icons8.com/clouds/100/user.png"} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{profileData?.name || user?.name}</h2>
                  <p className="text-base-content/70">{profileData?.email || user?.email}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className={`badge ${getRoleBadgeColor(profileData?.roles?.[0] || user?.roles?.[0])}`}>
                      {profileData?.roles?.[0] || user?.roles?.[0]}
                    </span>
                    {profileData?.enabled !== false && (
                      <span className="badge badge-success">Active</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Edit/Save Buttons */}
              <div className="flex justify-end mb-6">
                {editing ? (
                  <div className="space-x-2">
                    <button className="btn btn-ghost" onClick={handleCancel}>
                      Cancel
                    </button>
                    <button className="btn btn-primary" onClick={handleSave}>
                      Save Changes
                    </button>
                  </div>
                ) : (
                  <button className="btn btn-primary" onClick={handleEdit}>
                    Edit Profile
                  </button>
                )}
              </div>

              {/* Profile Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Full Name</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={editForm?.name || ''}
                    onChange={handleInputChange}
                    disabled={!editing}
                    className="input input-bordered w-full"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Email Address</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={editForm?.email || ''}
                    onChange={handleInputChange}
                    disabled={!editing}
                    className="input input-bordered w-full"
                  />
                </div>

                {editing && (
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">New Password (optional)</span>
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={editForm?.password || ''}
                      onChange={handleInputChange}
                      placeholder="Leave blank to keep current password"
                      className={`input input-bordered w-full ${passwordError ? 'input-error' : ''}`}
                    />
                    {passwordError && (
                      <label className="label">
                        <span className="label-text-alt text-error text-xs">{passwordError}</span>
                      </label>
                    )}
                  </div>
                )}

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">User ID</span>
                  </label>
                  <input
                    type="text"
                    value={profileData?.userId || user?.userId || ''}
                    disabled
                    className="input input-bordered w-full bg-base-200"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Authentication Provider</span>
                  </label>
                  <input
                    type="text"
                    value={profileData?.authProvider || user?.authProvider || 'GOOGLE'}
                    disabled
                    className="input input-bordered w-full bg-base-200"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Roles</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(profileData?.roles || user?.roles || []).map(role => (
                      <span key={role} className={`badge ${getRoleBadgeColor(role)}`}>
                        {role}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Account Status</span>
                  </label>
                  <div className="flex items-center space-x-2">
                    <span className={`badge ${profileData?.enabled !== false ? 'badge-success' : 'badge-error'}`}>
                      {profileData?.enabled !== false ? 'Active' : 'Inactive'}
                    </span>
                    <span className="text-sm text-base-content/70">
                      Member since {new Date(profileData?.createdAt || user?.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'bookings' && (
            <div>
              <h3 className="text-xl font-bold mb-4">My Booking History</h3>
              {userBookings.length === 0 ? (
                <div className="text-center py-8 text-base-content/70">
                  <p>No bookings found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table table-zebra w-full">
                    <thead>
                      <tr>
                        <th>Resource</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Status</th>
                        <th>Purpose</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userBookings.map((booking) => (
                        <tr key={booking.id}>
                          <td>{booking.resourceName}</td>
                          <td>{booking.date}</td>
                          <td>{booking.startTime} - {booking.endTime}</td>
                          <td>
                            <span className={`badge ${getStatusBadgeColor(booking.status)}`}>
                              {booking.status}
                            </span>
                          </td>
                          <td>{booking.purpose}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'tickets' && (
            <div>
              <h3 className="text-xl font-bold mb-4">My Support Tickets</h3>
              {userTickets.length === 0 ? (
                <div className="text-center py-8 text-base-content/70">
                  <p>No tickets found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table table-zebra w-full">
                    <thead>
                      <tr>
                        <th>Ticket ID</th>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userTickets.map((ticket) => (
                        <tr key={ticket.id}>
                          <td>#{ticket.id}</td>
                          <td>{ticket.title}</td>
                          <td>{ticket.category}</td>
                          <td>
                            <span className={`badge ${getStatusBadgeColor(ticket.priority)}`}>
                              {ticket.priority}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${getStatusBadgeColor(ticket.status)}`}>
                              {ticket.status}
                            </span>
                          </td>
                          <td>{new Date(ticket.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
