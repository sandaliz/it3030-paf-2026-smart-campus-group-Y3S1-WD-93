import React from 'react';
import { useAuth } from '../../context/AuthContext';

const StudentDashboard = () => {
  const { user } = useAuth();

  const dashboardStats = [
    { title: 'My Bookings', value: '12', icon: '📅', color: 'bg-blue-500' },
    { title: 'My Resources', value: '4', icon: '📊', color: 'bg-green-500' },
    { title: 'Active Tickets', value: '3', icon: '🎫', color: 'bg-yellow-500' }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.name || 'Student'}!</p>
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
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="text-gray-600">Lab 101 booking confirmed</span>
              <span className="text-sm text-gray-500">2 hours ago</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="text-gray-600">Ticket #1234 resolved</span>
              <span className="text-sm text-gray-500">1 day ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
