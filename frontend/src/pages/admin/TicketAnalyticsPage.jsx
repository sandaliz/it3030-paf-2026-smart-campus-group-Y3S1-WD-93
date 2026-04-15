import React, { useState, useEffect } from 'react';
import { ticketAPI } from '../../services/ticketService';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from '../../components/admin/AdminSidebar';

const TicketAnalyticsPage = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30'); // days
  
  // Analytics data
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
    rejected: 0,
    pendingConfirmation: 0,
  });

  const [categoryStats, setCategoryStats] = useState([]);
  const [priorityStats, setPriorityStats] = useState([]);
  const [statusTrend, setStatusTrend] = useState([]);
  const [technicianStats, setTechnicianStats] = useState([]);
  const [resolutionTime, setResolutionTime] = useState({ avg: 0, min: 0, max: 0 });

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await ticketAPI.getAllTickets(0, 1000);
      const allTickets = response.data.content || response.data;
      
      // Filter tickets based on time range
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(timeRange));
      const filteredTickets = allTickets.filter(ticket => 
        new Date(ticket.createdAt) >= cutoffDate
      );
      
      setTickets(filteredTickets);
      calculateStats(filteredTickets);
      calculateCategoryStats(filteredTickets);
      calculatePriorityStats(filteredTickets);
      calculateStatusTrend(filteredTickets);
      calculateTechnicianStats(filteredTickets);
      calculateResolutionTime(filteredTickets);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (tickets) => {
    const stats = tickets.reduce((acc, ticket) => {
      acc.total++;
      acc[ticket.status.toLowerCase()] = (acc[ticket.status.toLowerCase()] || 0) + 1;
      return acc;
    }, { total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0, rejected: 0, pendingConfirmation: 0 });
    
    setStats(stats);
  };

  const calculateCategoryStats = (tickets) => {
    const categoryCount = tickets.reduce((acc, ticket) => {
      acc[ticket.category] = (acc[ticket.category] || 0) + 1;
      return acc;
    }, {});
    
    const categoryData = Object.entries(categoryCount).map(([category, count]) => ({
      category,
      count,
      percentage: ((count / tickets.length) * 100).toFixed(1),
    }));
    
    setCategoryStats(categoryData);
  };

  const calculatePriorityStats = (tickets) => {
    const priorityCount = tickets.reduce((acc, ticket) => {
      acc[ticket.priority] = (acc[ticket.priority] || 0) + 1;
      return acc;
    }, {});
    
    const priorityData = Object.entries(priorityCount).map(([priority, count]) => ({
      priority,
      count,
      percentage: ((count / tickets.length) * 100).toFixed(1),
    }));
    
    setPriorityStats(priorityData);
  };

  const calculateStatusTrend = (tickets) => {
    // Group tickets by date
    const dateGroups = tickets.reduce((acc, ticket) => {
      const date = new Date(ticket.createdAt).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = { open: 0, resolved: 0, closed: 0 };
      }
      acc[date][ticket.status.toLowerCase()] = (acc[date][ticket.status.toLowerCase()] || 0) + 1;
      return acc;
    }, {});
    
    const trendData = Object.entries(dateGroups)
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-7); // Last 7 days
    
    setStatusTrend(trendData);
  };

  const calculateTechnicianStats = (tickets) => {
    const technicianCount = tickets.reduce((acc, ticket) => {
      if (ticket.assignedTo) {
        acc[ticket.assignedTo] = (acc[ticket.assignedTo] || 0) + 1;
      }
      return acc;
    }, {});
    
    const technicianData = Object.entries(technicianCount).map(([technician, count]) => ({
      technician,
      count,
      percentage: ((count / tickets.filter(t => t.assignedTo).length) * 100).toFixed(1),
    }));
    
    setTechnicianStats(technicianData);
  };

  const calculateResolutionTime = (tickets) => {
    const resolvedTickets = tickets.filter(ticket => 
      ticket.status === 'RESOLVED' || ticket.status === 'CLOSED'
    );
    
    if (resolvedTickets.length === 0) {
      setResolutionTime({ avg: 0, min: 0, max: 0 });
      return;
    }
    
    const resolutionTimes = resolvedTickets.map(ticket => {
      const created = new Date(ticket.createdAt);
      const resolved = new Date(ticket.updatedAt); // Assuming updatedAt is resolution time
      return (resolved - created) / (1000 * 60 * 60); // Hours
    });
    
    const avg = resolutionTimes.reduce((sum, time) => sum + time, 0) / resolutionTimes.length;
    const min = Math.min(...resolutionTimes);
    const max = Math.max(...resolutionTimes);
    
    setResolutionTime({
      avg: avg.toFixed(1),
      min: min.toFixed(1),
      max: max.toFixed(1),
    });
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const getStatusColor = (status) => {
    const colors = {
      open: 'text-warning',
      inProgress: 'text-info',
      resolved: 'text-success',
      closed: 'text-neutral',
      rejected: 'text-error',
      pendingConfirmation: 'text-accent',
    };
    return colors[status] || 'text-neutral';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      LOW: 'text-success',
      MEDIUM: 'text-warning',
      HIGH: 'text-error',
      CRITICAL: 'text-error font-bold',
    };
    return colors[priority] || 'text-neutral';
  };

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
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-base-100 shadow-sm border-b border-base-300 p-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-base-content">Ticket Analytics</h1>
            <div className="flex gap-2">
              <select
                className="select select-bordered"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
            </div>
          </div>
        </div>

        {/* Analytics Content */}
        <div className="flex-1 p-6 overflow-auto">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="stat bg-base-100 shadow-sm">
              <div className="stat-title">Total Tickets</div>
              <div className="stat-value text-primary">{stats.total}</div>
              <div className="stat-desc">In selected period</div>
            </div>
            <div className="stat bg-base-100 shadow-sm">
              <div className="stat-title">Open Tickets</div>
              <div className="stat-value text-warning">{stats.open}</div>
              <div className="stat-desc">Awaiting action</div>
            </div>
            <div className="stat bg-base-100 shadow-sm">
              <div className="stat-title">Resolved</div>
              <div className="stat-value text-success">{stats.resolved}</div>
              <div className="stat-desc">Successfully completed</div>
            </div>
            <div className="stat bg-base-100 shadow-sm">
              <div className="stat-title">Avg Resolution Time</div>
              <div className="stat-value text-info">{resolutionTime.avg}h</div>
              <div className="stat-desc">Min: {resolutionTime.min}h, Max: {resolutionTime.max}h</div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Category Distribution */}
            <div className="card bg-base-100 shadow-sm">
              <div className="card-body">
                <h3 className="card-title">Category Distribution</h3>
                <div className="space-y-2">
                  {categoryStats.map((item) => (
                    <div key={item.category} className="flex justify-between items-center">
                      <span className="font-medium">{item.category}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-base-200 rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm">{item.count} ({item.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Priority Distribution */}
            <div className="card bg-base-100 shadow-sm">
              <div className="card-body">
                <h3 className="card-title">Priority Distribution</h3>
                <div className="space-y-2">
                  {priorityStats.map((item) => (
                    <div key={item.priority} className="flex justify-between items-center">
                      <span className={`font-medium ${getPriorityColor(item.priority)}`}>
                        {item.priority}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-base-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              item.priority === 'LOW' ? 'bg-success' :
                              item.priority === 'MEDIUM' ? 'bg-warning' :
                              item.priority === 'HIGH' ? 'bg-error' : 'bg-error'
                            }`}
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm">{item.count} ({item.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Status Trend */}
          <div className="card bg-base-100 shadow-sm mb-6">
            <div className="card-body">
              <h3 className="card-title">Status Trend (Last 7 Days)</h3>
              <div className="overflow-x-auto">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Open</th>
                      <th>In Progress</th>
                      <th>Resolved</th>
                      <th>Closed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statusTrend.map((day) => (
                      <tr key={day.date}>
                        <td>{day.date}</td>
                        <td className="text-warning">{day.open || 0}</td>
                        <td className="text-info">{day.inProgress || 0}</td>
                        <td className="text-success">{day.resolved || 0}</td>
                        <td className="text-neutral">{day.closed || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Technician Performance */}
          {technicianStats.length > 0 && (
            <div className="card bg-base-100 shadow-sm">
              <div className="card-body">
                <h3 className="card-title">Technician Performance</h3>
                <div className="space-y-2">
                  {technicianStats.map((tech) => (
                    <div key={tech.technician} className="flex justify-between items-center">
                      <span className="font-medium">{tech.technician}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-base-200 rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${tech.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm">{tech.count} tickets ({tech.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketAnalyticsPage;
