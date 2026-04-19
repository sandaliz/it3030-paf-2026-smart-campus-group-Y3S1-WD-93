import React, { useState, useEffect } from 'react';
import { notificationService } from '../../services/notificationService';

const NotificationAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    totalNotifications: 0,
    readRate: 0,
    averagePerUser: 0,
    notificationsByType: {},
    mostActiveUsers: [],
    loading: true
  });
  const [timeRange, setTimeRange] = useState('30d'); // 7d, 30d, 90d

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setAnalytics(prev => ({ ...prev, loading: true }));
      const data = await notificationService.getNotificationAnalytics(timeRange);
      setAnalytics({
        totalNotifications: data.totalNotifications || 0,
        readRate: data.readRate || 0,
        averagePerUser: data.averagePerUser || 0,
        notificationsByType: data.notificationsByType || {},
        mostActiveUsers: data.mostActiveUsers || [],
        loading: false
      });
    } catch (error) {
      console.error('Failed to fetch notification analytics:', error);
      setAnalytics(prev => ({ ...prev, loading: false }));
    }
  };

  const getMaxCount = () => {
    const counts = Object.values(analytics.notificationsByType);
    return counts.length > 0 ? Math.max(...counts) : 0;
  };

  const getBarWidth = (count) => {
    const max = getMaxCount();
    return max > 0 ? (count / max) * 100 : 0;
  };

  const getBarColor = (type) => {
    switch (type) {
      case 'BOOKING_APPROVED':
      case 'BOOKING_REJECTED':
      case 'BOOKING_UPDATED': return 'bg-blue-500';
      case 'TICKET_CREATED':
      case 'TICKET_UPDATED':
      case 'TICKET_ASSIGNED':
      case 'TICKET_RESOLVED': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const exportReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      timeRange: timeRange,
      ...analytics
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notification-analytics-${timeRange}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (analytics.loading) {
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                📊 Notification Analytics
              </h1>
              <p className="text-sm opacity-90 mt-1">Admin notification statistics and insights</p>
            </div>
            <div className="flex items-center gap-2">
              <select 
                className="select select-bordered select-sm"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              <button className="btn btn-secondary btn-sm" onClick={fetchAnalytics}>
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="stat bg-base-200 border border-base-300 rounded-lg p-6">
              <div className="stat-figure text-primary">
                {analytics.totalNotifications.toLocaleString()}
              </div>
              <div className="stat-title">Notifications Sent</div>
            </div>
            <div className="stat bg-base-200 border border-base-300 rounded-lg p-6">
              <div className="stat-figure text-success">
                {analytics.readRate.toFixed(1)}%
              </div>
              <div className="stat-title">Read Rate</div>
            </div>
            <div className="stat bg-base-200 border border-base-300 rounded-lg p-6">
              <div className="stat-figure text-info">
                {analytics.averagePerUser.toFixed(1)}
              </div>
              <div className="stat-title">Avg per User</div>
            </div>
          </div>

          {/* Notifications by Type */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Notifications by Type</h2>
            <div className="bg-base-200 rounded-lg p-6">
              {Object.keys(analytics.notificationsByType).length === 0 ? (
                <div className="text-center text-base-content/70 py-8">
                  No notification data available
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(analytics.notificationsByType).map(([type, count]) => (
                    <div key={type} className="flex items-center gap-4">
                      <div className="w-48 text-sm font-medium">
                        {type.replace(/_/g, ' ').charAt(0).toUpperCase() + 
                         type.replace(/_/g, ' ').slice(1).toLowerCase()}
                      </div>
                      <div className="flex-1">
                        <div className="w-full bg-base-300 rounded-full h-6">
                          <div 
                            className={`h-6 rounded-full ${getBarColor(type)} transition-all duration-300`}
                            style={{ width: `${getBarWidth(count)}%` }}
                          >
                            <span className="text-xs text-white px-2 leading-6">
                              {count}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Most Active Users */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Most Active Users</h2>
            <div className="bg-base-200 rounded-lg p-6">
              {analytics.mostActiveUsers.length === 0 ? (
                <div className="text-center text-base-content/70 py-8">
                  No user activity data available
                </div>
              ) : (
                <div className="space-y-3">
                  {analytics.mostActiveUsers.map((user, index) => (
                    <div key={user.userId} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-content flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-base-content/70">{user.email}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-primary">{user.notificationCount}</div>
                        <div className="text-sm text-base-content/70">notifications</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            <button className="btn btn-primary" onClick={exportReport}>
              📊 Export Report
            </button>
            <button className="btn btn-secondary" onClick={() => alert('Trends feature coming soon!')}>
              📈 View Trends
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationAnalytics;
