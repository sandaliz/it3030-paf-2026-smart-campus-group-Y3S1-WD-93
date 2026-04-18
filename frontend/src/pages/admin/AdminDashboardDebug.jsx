import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiInstance from '../../services/axiosInstance';

const AdminDashboardDebug = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl = '/api/admin/dashboard/stats';
        console.log('Fetching admin dashboard stats from:', apiUrl);
        console.log('Current user:', user);
        console.log('Axios base URL:', axios.defaults.baseURL);
        
        const response = await apiInstance.get(apiUrl);
        console.log('Full response:', response);
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        console.log('Stats response data:', response.data);
        
        setStats(response.data);
        setError(null);
      } catch (err) {
        console.error('Full error object:', err);
        console.error('Error response:', err.response);
        console.error('Error status:', err.response?.status);
        console.error('Error data:', err.response?.data);
        console.error('Error fetching stats:', err);
        setError(err.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    } else {
      setError('User not authenticated');
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="alert alert-error max-w-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Error: {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">ADMIN DASHBOARD (DEBUG)</h1>
      
      <div className="bg-base-100 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">User Info</h2>
        <pre className="bg-base-200 p-4 rounded overflow-auto">
          {JSON.stringify(user, null, 2)}
        </pre>
      </div>

      <div className="bg-base-100 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Dashboard Stats</h2>
        {stats ? (
          <pre className="bg-base-200 p-4 rounded overflow-auto">
            {JSON.stringify(stats, null, 2)}
          </pre>
        ) : (
          <p>No stats data available</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat bg-base-100 shadow-sm">
          <div className="stat-title">Total Users</div>
          <div className="stat-value text-primary">{stats?.totalUsers || 0}</div>
        </div>
        <div className="stat bg-base-100 shadow-sm">
          <div className="stat-title">Total Bookings</div>
          <div className="stat-value text-info">{stats?.totalBookings || 0}</div>
        </div>
        <div className="stat bg-base-100 shadow-sm">
          <div className="stat-title">Total Tickets</div>
          <div className="stat-value text-warning">{stats?.totalTickets || 0}</div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardDebug;
