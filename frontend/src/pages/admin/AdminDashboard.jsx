import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from '../../components/admin/AdminSidebar';
import apiInstance from '../../services/axiosInstance';
import { userService } from '../../services/userService';
import BookingNotifications from '../../components/bookings/BookingNotifications';

const normalizeRole = (role) => {
  if (!role) {
    return '';
  }

  return role.startsWith('ROLE_') ? role : `ROLE_${role}`;
};

const normalizeUser = (user) => ({
  ...user,
  roles: Array.isArray(user.roles) ? user.roles.map(normalizeRole) : []
});

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBookings: 0,
    totalTickets: 0,
    pendingBookings: 0,
    openTickets: 0,
    totalResources: 0
  });

  // Data states
  const [pendingBookings, setPendingBookings] = useState([]);
  const [openTickets, setOpenTickets] = useState([]);
  const [allResources, setAllResources] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [allTickets, setAllTickets] = useState([]);

  // Modal states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // User management states
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    username: '',
    roles: ['ROLE_STUDENT']
  });

  // Fetch dashboard stats
  const fetchStats = async () => {
    try {
      const response = await apiInstance.get('/api/admin/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Fetch pending bookings
  const fetchPendingBookings = async () => {
    try {
      const response = await apiInstance.get('/api/admin/dashboard/pending-bookings');
      setPendingBookings(response.data);
    } catch (error) {
      console.error('Error fetching pending bookings:', error);
    }
  };

  // Fetch open tickets
  const fetchOpenTickets = async () => {
    try {
      const response = await apiInstance.get('/api/admin/dashboard/open-tickets');
      setOpenTickets(response.data);
    } catch (error) {
      console.error('Error fetching open tickets:', error);
    }
  };

  // Fetch all resources
  const fetchAllResources = async () => {
    try {
      const response = await apiInstance.get('/api/admin/dashboard/resources');
      setAllResources(response.data);
    } catch (error) {
      console.error('Error fetching resources:', error);
    }
  };

  // Fetch all users
  const fetchAllUsers = async () => {
    try {
      console.log('DEBUG: Fetching users from /api/admin/dashboard/users');
      console.log('DEBUG: Auth token exists:', !!localStorage.getItem('token'));
      
      const response = await apiInstance.get('/api/admin/dashboard/users');
      console.log('DEBUG: Users API response status:', response.status);
      console.log('DEBUG: Users API response headers:', response.headers);
      console.log('DEBUG: Users API response:', response);
      console.log('DEBUG: Users data:', response.data);
      console.log('DEBUG: Is array?', Array.isArray(response.data));
      console.log('DEBUG: Data length:', response.data?.length);
      
      // Check if response data is an error object
      if (response.data && response.data.error) {
        console.error('DEBUG: Server returned error:', response.data.error);
        setAllUsers([]);
        return;
      }
      
      const usersData = Array.isArray(response.data) ? response.data : [];
      console.log('DEBUG: Setting allUsers to:', usersData);
      setAllUsers(usersData);
    } catch (error) {
      console.error('DEBUG: Error fetching users:', error);
      console.error('DEBUG: Error response status:', error.response?.status);
      console.error('DEBUG: Error response data:', error.response?.data);
      console.error('DEBUG: Full error response:', error.response);
      console.error('DEBUG: Error message:', error.message);
      
      // Check for 401/403 errors (authentication/authorization)
      if (error.response?.status === 401) {
        console.error('DEBUG: Authentication failed - user may not be logged in or token expired');
      } else if (error.response?.status === 403) {
        console.error('DEBUG: Authorization failed - user may not have admin role');
      } else if (error.response?.status === 500) {
        console.error('DEBUG: Backend server error - check backend logs for details');
        console.error('DEBUG: Server error details:', JSON.stringify(error.response?.data, null, 2));
      }
      
      setAllUsers([]);
    }
  };

  // Fetch all bookings
  const fetchAllBookings = async () => {
    try {
      const response = await apiInstance.get('/api/admin/dashboard/bookings');
      setAllBookings(response.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  // Fetch all tickets
  const fetchAllTickets = async () => {
    try {
      const response = await apiInstance.get('/api/admin/dashboard/tickets');
      setAllTickets(response.data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  };

  // Approve booking
  const handleApproveBooking = async (bookingId) => {
    try {
      await apiInstance.post(`/api/admin/dashboard/bookings/${bookingId}/approve`);
      fetchPendingBookings();
      fetchAllBookings();
      fetchStats();
    } catch (error) {
      console.error('Error approving booking:', error);
      alert('Failed to approve booking');
    }
  };

  // Reject booking
  const handleRejectBooking = async () => {
    if (!selectedBooking || !rejectionReason.trim()) {
      alert('Please provide rejection reason');
      return;
    }

    try {
      await apiInstance.post(`/api/admin/dashboard/bookings/${selectedBooking.id}/reject`, { reason: rejectionReason });
      setShowRejectModal(false);
      setSelectedBooking(null);
      setRejectionReason('');
      fetchPendingBookings();
      fetchAllBookings();
      fetchStats();
    } catch (error) {
      console.error('Error rejecting booking:', error);
      alert('Failed to reject booking');
    }
  };

  // Toggle user status
  const handleToggleUserStatus = async (userId) => {
    try {
      const targetUser = allUsers.find((listedUser) => listedUser.id === userId);
      if (!targetUser) {
        throw new Error('User not found');
      }

      await userService.updateUserStatus(userId, !targetUser.enabled);
      fetchAllUsers();
      fetchStats();
    } catch (error) {
      console.error('Error toggling user status:', error);
      alert('Failed to update user status');
    }
  };

  // Edit user role
  const handleEditUserRole = (user) => {
    setSelectedUser(user);
    setShowEditUserModal(true);
  };

  // Update user role
  const handleUpdateUserRole = async () => {
    if (!selectedUser) return;
    
    try {
      await userService.updateUserRoles(selectedUser.id, {
        roles: selectedUser.roles.map((role) => role.replace('ROLE_', ''))
      });
      setShowEditUserModal(false);
      setSelectedUser(null);
      fetchAllUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Failed to update user role');
    }
  };

  // View user details
  const handleViewUserDetails = (user) => {
    setSelectedUser(user);
    setShowUserDetailsModal(true);
  };

  // Delete user
  const handleDeleteUser = async (user) => {
    if (!confirm(`Are you sure you want to delete user "${user.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await userService.deleteUser(user.id);
      fetchAllUsers();
      fetchStats();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  // Create new user
  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.username) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await userService.createUser({
        name: newUser.name,
        email: newUser.email,
        password: newUser.username,
        roles: newUser.roles.map((role) => role.replace('ROLE_', ''))
      });
      setShowCreateUserModal(false);
      setNewUser({ name: '', email: '', username: '', roles: ['ROLE_STUDENT'] });
      fetchAllUsers();
      fetchStats();
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Failed to create user');
    }
  };

  // Filter users based on search term
  const filteredUsers = allUsers.filter(user => 
    user.name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.roles?.some(role => role.toLowerCase().includes(userSearchTerm.toLowerCase()))
  );

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format date time
  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      await Promise.all([
        fetchStats(),
        fetchPendingBookings(),
        fetchOpenTickets(),
        fetchAllResources(),
        fetchAllUsers(),
        fetchAllBookings(),
        fetchAllTickets()
      ]);
      setLoading(false);
    };

    fetchAllData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-base-200">
      {/* Sidebar */}
      <AdminSidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-auto">
        {/* Header */}
        <div className="bg-base-100 shadow-sm border-b border-base-300 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-base-content">ADMIN DASHBOARD</h1>
              <p className="text-base-content/70 mt-1">Complete System Overview</p>
            </div>
            <button 
              onClick={() => navigate('/admin/notification-analytics')}
              className="btn btn-primary flex items-center gap-2"
            >
              📊 Notification Analytics
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="stat bg-base-100 shadow-sm">
              <div className="stat-figure text-primary">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
                </svg>
              </div>
              <div className="stat-title">Total Users</div>
              <div className="stat-value text-primary">{stats.totalUsers}</div>
            </div>
            
            <div className="stat bg-base-100 shadow-sm">
              <div className="stat-figure text-info">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                </svg>
              </div>
              <div className="stat-title">Total Bookings</div>
              <div className="stat-value text-info">{stats.totalBookings}</div>
            </div>
            
            <div className="stat bg-base-100 shadow-sm">
              <div className="stat-figure text-warning">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                </svg>
              </div>
              <div className="stat-title">Total Tickets</div>
              <div className="stat-value text-warning">{stats.totalTickets}</div>
            </div>
            
            <div className="stat bg-base-100 shadow-sm">
              <div className="stat-figure text-secondary">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                </svg>
              </div>
              <div className="stat-title">Pending Bookings</div>
              <div className="stat-value text-secondary">{stats.pendingBookings}</div>
            </div>
            
            <div className="stat bg-base-100 shadow-sm">
              <div className="stat-figure text-error">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
              </div>
              <div className="stat-title">Open Tickets</div>
              <div className="stat-value text-error">{stats.openTickets}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Bookings */}
            <div className="bg-base-100 shadow-sm rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                &#x1f4dd; PENDING BOOKINGS
              </h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {pendingBookings.length === 0 ? (
                  <p className="text-base-content/60 text-center py-4">No pending bookings</p>
                ) : (
                  pendingBookings.map((booking) => (
                    <div key={booking.id} className="border border-base-300 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold">{booking.resource}</h3>
                          <p className="text-sm text-base-content/70">
                            {booking.user} - {booking.userRole}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{formatDate(booking.startTime)}</p>
                          <p className="text-xs text-base-content/60">
                            {formatDateTime(booking.startTime)} - {formatDateTime(booking.endTime)}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm mb-3">{booking.purpose}</p>
                      <div className="flex gap-2">
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => handleApproveBooking(booking.id)}
                        >
                          Approve
                        </button>
                        <button
                          className="btn btn-sm btn-error"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setShowRejectModal(true);
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Open Tickets */}
            <div className="bg-base-100 shadow-sm rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                &#x1f9ab; OPEN TICKETS
              </h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {openTickets.length === 0 ? (
                  <p className="text-base-content/60 text-center py-4">No open tickets</p>
                ) : (
                  openTickets.map((ticket) => (
                    <div key={ticket.id} className="border border-base-300 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold">#{ticket.id} - {ticket.title}</h3>
                          <p className="text-sm text-base-content/70">{ticket.category}</p>
                        </div>
                        <div className="text-right">
                          <span className={`badge badge-sm ${
                            ticket.priority === 'HIGH' ? 'badge-error' :
                            ticket.priority === 'MEDIUM' ? 'badge-warning' : 'badge-success'
                          }`}>
                            {ticket.priority}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm mb-3 line-clamp-2">{ticket.description}</p>
                      <div className="flex gap-2">
                        <button className="btn btn-sm btn-primary">Assign</button>
                        <button className="btn btn-sm btn-outline">View</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* User Management CRUD */}
          <div className="bg-base-100 shadow-sm rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center">
                &#x1f465; USER MANAGEMENT
              </h2>
              <div className="flex gap-2">
                <button 
                  className="btn btn-sm btn-primary"
                  onClick={() => setShowCreateUserModal(true)}
                >
                  Add New User
                </button>
                <input 
                  type="text" 
                  placeholder="Search users..." 
                  className="input input-sm input-bordered w-48"
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Roles</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Last Login</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="avatar">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                              <span className="text-primary text-sm font-semibold">
                                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                              </span>
                            </div>
                          </div>
                          <div>
                            <div className="font-semibold">{user.name || 'Unknown'}</div>
                            <div className="text-xs text-base-content/60">{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="text-sm">{user.email}</td>
                      <td>
                        <div className="flex gap-1 flex-wrap">
                          {user.roles.map((role, index) => (
                            <span key={index} className={`badge badge-xs ${
                              role === 'ROLE_ADMIN' ? 'badge-error' :
                              role === 'ROLE_LECTURER' ? 'badge-info' :
                              role === 'ROLE_TECHNICIAN' ? 'badge-warning' :
                              role === 'ROLE_STUDENT' ? 'badge-success' : 'badge-outline'
                            }`}>
                              {role.replace('ROLE_', '')}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-sm ${user.enabled ? 'badge-success' : 'badge-error'}`}>
                          {user.enabled ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="text-sm">
                        {user.createdAt ? formatDate(user.createdAt) : 'N/A'}
                      </td>
                      <td className="text-sm">
                        {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}
                      </td>
                      <td>
                        <div className="dropdown dropdown-left">
                          <label tabIndex={0} className="btn btn-xs btn-ghost btn-circle">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
                            </svg>
                          </label>
                          <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                            <li>
                              <button 
                                className="btn btn-ghost btn-sm"
                                onClick={() => handleEditUserRole(user)}
                              >
                                Edit Role
                              </button>
                            </li>
                            <li>
                              <button 
                                className={`btn btn-ghost btn-sm ${user.enabled ? 'text-warning' : 'text-success'}`}
                                onClick={() => handleToggleUserStatus(user.id)}
                              >
                                {user.enabled ? 'Disable User' : 'Enable User'}
                              </button>
                            </li>
                            <li>
                              <button 
                                className="btn btn-ghost btn-sm"
                                onClick={() => handleViewUserDetails(user)}
                              >
                                View Details
                              </button>
                            </li>
                            <li>
                              <button 
                                className="btn btn-ghost btn-sm text-error"
                                onClick={() => handleDeleteUser(user)}
                              >
                                Delete User
                              </button>
                            </li>
                          </ul>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* All Resources */}
          <div className="bg-base-100 shadow-sm rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center">
                &#x1f3e2; ALL RESOURCES
              </h2>
              <div className="flex gap-2">
                <button className="btn btn-sm btn-primary">Add New Resource</button>
                <button className="btn btn-sm btn-outline">Filter by Type</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Resource Name</th>
                    <th>Type</th>
                    <th>Capacity</th>
                    <th>Status</th>
                    <th>Location</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allResources.slice(0, 5).map((resource) => (
                    <tr key={resource.id}>
                      <td className="font-medium">{resource.name}</td>
                      <td>{resource.type}</td>
                      <td>{resource.capacity || '-'}</td>
                      <td>
                        <span className={`badge badge-sm ${
                          resource.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'
                        }`}>
                          {resource.status}
                        </span>
                      </td>
                      <td>{resource.location || '-'}</td>
                      <td>
                        <button className="btn btn-xs btn-outline">Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          

          {/* All Bookings */}
          <div className="bg-base-100 shadow-sm rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center">
                &#x1f4c5; ALL BOOKINGS
              </h2>
              <div className="flex gap-2">
                <button className="btn btn-sm btn-outline">Filter by Date</button>
                <button className="btn btn-sm btn-outline">Export</button>
              </div>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {allBookings.slice(0, 5).map((booking) => (
                <div key={booking.id} className="border border-base-300 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{booking.resource}</h3>
                      <p className="text-sm text-base-content/70">{booking.user}</p>
                      <p className="text-xs text-base-content/60">
                        {formatDateTime(booking.startTime)} - {formatDateTime(booking.endTime)}
                      </p>
                    </div>
                    <div>
                      <span className={`badge badge-sm ${
                        booking.status === 'APPROVED' ? 'badge-success' :
                        booking.status === 'PENDING' ? 'badge-warning' : 'badge-error'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* All Tickets */}
          <div className="bg-base-100 shadow-sm rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center">
                &#x1f9ab; ALL TICKETS
              </h2>
              <div className="flex gap-2">
                <button className="btn btn-sm btn-outline">Filter by Status</button>
                <button className="btn btn-sm btn-outline">Export Report</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Assigned To</th>
                  </tr>
                </thead>
                <tbody>
                  {allTickets.slice(0, 5).map((ticket) => (
                    <tr key={ticket.id}>
                      <td className="font-mono text-sm">#{ticket.id}</td>
                      <td className="max-w-xs truncate">{ticket.title}</td>
                      <td>
                        <span className={`badge badge-sm ${
                          ticket.status === 'OPEN' ? 'badge-error' :
                          ticket.status === 'IN_PROGRESS' ? 'badge-warning' : 'badge-success'
                        }`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td>{ticket.assignedTo || 'Unassigned'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Booking Modal */}
      {showRejectModal && selectedBooking && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-md">
            <h3 className="font-bold text-lg mb-4">Reject Booking</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Reject booking for <strong>{selectedBooking.resource}</strong>
              </p>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Rejection Reason</span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-20"
                  placeholder="Reason for rejection..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                ></textarea>
              </div>
            </div>
            <div className="modal-action">
              <button className="btn" onClick={() => setShowRejectModal(false)}>Cancel</button>
              <button
                className="btn btn-error"
                onClick={handleRejectBooking}
                disabled={!rejectionReason.trim()}
              >
                Reject Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateUserModal && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-md">
            <h3 className="font-bold text-lg mb-4">Create New User</h3>
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Name</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  placeholder="Enter user name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Email</span>
                </label>
                <input
                  type="email"
                  className="input input-bordered"
                  placeholder="Enter email address"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Username</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  placeholder="Enter username"
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Role</span>
                </label>
                <select
                  className="select select-bordered"
                  value={newUser.roles[0]}
                  onChange={(e) => setNewUser({...newUser, roles: [e.target.value]})}
                >
                  <option value="ROLE_STUDENT">Student</option>
                  <option value="ROLE_LECTURER">Lecturer</option>
                  <option value="ROLE_TECHNICIAN">Technician</option>
                  <option value="ROLE_NON_ACADEMIC">Non-Academic</option>
                  <option value="ROLE_ADMIN">Admin</option>
                </select>
              </div>
            </div>
            <div className="modal-action">
              <button className="btn" onClick={() => setShowCreateUserModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreateUser}>
                Create User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && selectedUser && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-md">
            <h3 className="font-bold text-lg mb-4">Edit User Role</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-4">
                Edit role for <strong>{selectedUser.name}</strong>
              </p>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Role</span>
                </label>
                <select
                  className="select select-bordered"
                  value={selectedUser.roles[0]}
                  onChange={(e) => setSelectedUser({...selectedUser, roles: [e.target.value]})}
                >
                  <option value="ROLE_STUDENT">Student</option>
                  <option value="ROLE_LECTURER">Lecturer</option>
                  <option value="ROLE_TECHNICIAN">Technician</option>
                  <option value="ROLE_NON_ACADEMIC">Non-Academic</option>
                  <option value="ROLE_ADMIN">Admin</option>
                </select>
              </div>
            </div>
            <div className="modal-action">
              <button className="btn" onClick={() => setShowEditUserModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleUpdateUserRole}>
                Update Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showUserDetailsModal && selectedUser && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-md">
            <h3 className="font-bold text-lg mb-4">User Details</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="avatar">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-primary text-lg font-semibold">
                      {selectedUser.name ? selectedUser.name.charAt(0).toUpperCase() : 'U'}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="font-semibold">{selectedUser.name || 'Unknown'}</div>
                  <div className="text-sm text-base-content/60">@{selectedUser.username}</div>
                </div>
              </div>
              
              <div className="divider"></div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Email:</span>
                  <span className="text-sm">{selectedUser.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  <span className={`badge badge-sm ${selectedUser.enabled ? 'badge-success' : 'badge-error'}`}>
                    {selectedUser.enabled ? 'Active' : 'Disabled'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Roles:</span>
                  <div className="flex gap-1">
                    {selectedUser.roles.map((role, index) => (
                      <span key={index} className={`badge badge-xs ${
                        role === 'ROLE_ADMIN' ? 'badge-error' :
                        role === 'ROLE_LECTURER' ? 'badge-info' :
                        role === 'ROLE_TECHNICIAN' ? 'badge-warning' :
                        role === 'ROLE_STUDENT' ? 'badge-success' : 'badge-outline'
                      }`}>
                        {role.replace('ROLE_', '')}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Created:</span>
                  <span className="text-sm">{selectedUser.createdAt ? formatDate(selectedUser.createdAt) : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Last Login:</span>
                  <span className="text-sm">{selectedUser.lastLoginAt ? formatDate(selectedUser.lastLoginAt) : 'Never'}</span>
                </div>
              </div>
            </div>
            <div className="modal-action">
              <button className="btn" onClick={() => setShowUserDetailsModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
