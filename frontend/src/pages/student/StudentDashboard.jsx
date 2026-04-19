import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dashboardService } from '../../services/dashboardService';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    myBookings: 0,
    myResources: 0,
    activeTickets: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsData, activityData] = await Promise.all([
        dashboardService.getStudentStats(),
        dashboardService.getStudentActivity()
      ]);
      
      setStats(statsData);
      setRecentActivity(activityData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Set up polling for real-time updates (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const dashboardStats = [
    { title: 'My Bookings', value: stats.myBookings.toString(), icon: '📅', color: 'bg-blue-500' },
    { title: 'My Resources', value: stats.myResources.toString(), icon: '📊', color: 'bg-green-500' },
    { title: 'Active Tickets', value: stats.activeTickets.toString(), icon: '🎫', color: 'bg-yellow-500' }
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user?.name || 'Student'}!</p>
          </div>
          <div className="text-sm text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboardStats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className={`text-2xl ${stat.color} text-white rounded-full p-3`}>
                {stat.icon}
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="space-y-4">
            <a href="/bookings" className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
              <span className="text-blue-600 mr-2">📅</span>
              <span>My Bookings</span>
            </a>
            <a href="/resources" className="flex items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
              <span className="text-green-600 mr-2">📊</span>
              <span>Browse Resources</span>
            </a>
            <a href="/tickets" className="flex items-center p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors">
              <span className="text-yellow-600 mr-2">🎫</span>
              <span>My Tickets</span>
            </a>
            <a href="/calendar" className="flex items-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
              <span className="text-purple-600 mr-2">📅</span>
              <span>View Calendar</span>
            </a>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="text-gray-600">{activity.description}</span>
                  <span className="text-sm text-gray-500">
                    {activity.timestamp ? new Date(activity.timestamp).toLocaleString() : 'Just now'}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-center py-4">
                No recent activity
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
