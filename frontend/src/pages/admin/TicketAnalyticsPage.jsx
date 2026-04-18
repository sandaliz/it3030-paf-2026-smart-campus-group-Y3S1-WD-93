import React from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from '../../components/admin/AdminSidebar';

const TicketAnalyticsPage = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30'); // days
  const [generatingReport, setGeneratingReport] = useState(false);
  
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
    
    const assignedTickets = tickets.filter(t => t.assignedTo);
    const totalAssigned = assignedTickets.length;
    
    const technicianData = Object.entries(technicianCount).map(([technician, count]) => ({
      technician,
      count,
      percentage: totalAssigned > 0 ? ((count / totalAssigned) * 100).toFixed(1) : '0.0',
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

  // Report Generation Functions
  const generateCSVReport = () => {
    setGeneratingReport(true);
    
    try {
      // Create CSV content
      const headers = [
        'Ticket ID', 'Title', 'Category', 'Priority', 'Status', 
        'Created By', 'Assigned To', 'Created Date', 'Updated Date', 'Location'
      ];
      
      const csvContent = [
        headers.join(','),
        ...tickets.map(ticket => [
          ticket.id,
          `"${ticket.title.replace(/"/g, '""')}"`, // Escape quotes
          ticket.category,
          ticket.priority,
          ticket.status,
          `"${ticket.userName || 'N/A'}"`,
          `"${ticket.assignedTo || 'N/A'}"`,
          new Date(ticket.createdAt).toLocaleDateString(),
          new Date(ticket.updatedAt).toLocaleDateString(),
          `"${ticket.location || 'N/A'}"`
        ].join(','))
      ].join('\n');
      
      // Add summary statistics at the top
      const summary = [
        `Ticket Analytics Report - ${new Date().toLocaleDateString()}`,
        `Time Range: Last ${timeRange} days`,
        `Total Tickets: ${stats.total}`,
        `Open Tickets: ${stats.open}`,
        `In Progress: ${stats.inProgress}`,
        `Resolved: ${stats.resolved}`,
        `Closed: ${stats.closed}`,
        `Average Resolution Time: ${resolutionTime.avg} hours`,
        '',
        csvContent
      ].join('\n');
      
      // Create and download CSV file
      const blob = new Blob([summary], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `ticket-analytics-report-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Error generating CSV report:', error);
      alert('Error generating CSV report. Please try again.');
    } finally {
      setGeneratingReport(false);
    }
  };

  const generatePDFReport = () => {
    setGeneratingReport(true);
    
    try {
      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Ticket Analytics Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .summary { display: flex; justify-content: space-around; margin-bottom: 30px; }
            .stat-card { text-align: center; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
            .section { margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .progress-bar { width: 100%; background-color: #f0f0f0; border-radius: 5px; }
            .progress-fill { height: 20px; background-color: #007bff; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Ticket Analytics Report</h1>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
            <p>Time Range: Last ${timeRange} days</p>
          </div>
          
          <div class="summary">
            <div class="stat-card">
              <h3>Total Tickets</h3>
              <p style="font-size: 24px; font-weight: bold;">${stats.total}</p>
            </div>
            <div class="stat-card">
              <h3>Open Tickets</h3>
              <p style="font-size: 24px; font-weight: bold; color: #f39c12;">${stats.open}</p>
            </div>
            <div class="stat-card">
              <h3>Resolved</h3>
              <p style="font-size: 24px; font-weight: bold; color: #27ae60;">${stats.resolved}</p>
            </div>
            <div class="stat-card">
              <h3>Avg Resolution Time</h3>
              <p style="font-size: 24px; font-weight: bold; color: #3498db;">${resolutionTime.avg}h</p>
            </div>
          </div>
          
          <div class="section">
            <h2>Category Distribution</h2>
            <table>
              <tr><th>Category</th><th>Count</th><th>Percentage</th><th>Distribution</th></tr>
              ${categoryStats.map(item => `
                <tr>
                  <td>${item.category}</td>
                  <td>${item.count}</td>
                  <td>${item.percentage}%</td>
                  <td>
                    <div class="progress-bar">
                      <div class="progress-fill" style="width: ${item.percentage}%"></div>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </table>
          </div>
          
          <div class="section">
            <h2>Priority Distribution</h2>
            <table>
              <tr><th>Priority</th><th>Count</th><th>Percentage</th><th>Distribution</th></tr>
              ${priorityStats.map(item => `
                <tr>
                  <td>${item.priority}</td>
                  <td>${item.count}</td>
                  <td>${item.percentage}%</td>
                  <td>
                    <div class="progress-bar">
                      <div class="progress-fill" style="width: ${item.percentage}%"></div>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </table>
          </div>
          
          <div class="section">
            <h2>Status Trend (Last 7 Days)</h2>
            <table>
              <tr><th>Date</th><th>Open</th><th>In Progress</th><th>Resolved</th><th>Closed</th></tr>
              ${statusTrend.map(day => `
                <tr>
                  <td>${day.date}</td>
                  <td>${day.open || 0}</td>
                  <td>${day.inProgress || 0}</td>
                  <td>${day.resolved || 0}</td>
                  <td>${day.closed || 0}</td>
                </tr>
              `).join('')}
            </table>
          </div>
          
          ${technicianStats.length > 0 ? `
          <div class="section">
            <h2>Technician Performance</h2>
            <table>
              <tr><th>Technician</th><th>Tickets Assigned</th><th>Percentage</th><th>Distribution</th></tr>
              ${technicianStats.map(tech => `
                <tr>
                  <td>${tech.technician}</td>
                  <td>${tech.count}</td>
                  <td>${tech.percentage}%</td>
                  <td>
                    <div class="progress-bar">
                      <div class="progress-fill" style="width: ${tech.percentage}%"></div>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </table>
          </div>
          ` : ''}
          
          <div class="section">
            <h2>Detailed Tickets</h2>
            <table>
              <tr>
                <th>ID</th><th>Title</th><th>Category</th><th>Priority</th><th>Status</th>
                <th>Created By</th><th>Assigned To</th><th>Created Date</th><th>Location</th>
              </tr>
              ${tickets.map(ticket => `
                <tr>
                  <td>${ticket.id}</td>
                  <td>${ticket.title}</td>
                  <td>${ticket.category}</td>
                  <td>${ticket.priority}</td>
                  <td>${ticket.status}</td>
                  <td>${ticket.userName || 'N/A'}</td>
                  <td>${ticket.assignedTo || 'N/A'}</td>
                  <td>${new Date(ticket.createdAt).toLocaleDateString()}</td>
                  <td>${ticket.location || 'N/A'}</td>
                </tr>
              `).join('')}
            </table>
          </div>
        </body>
        </html>
      `;
      
      // Create a new window and print
      const printWindow = window.open('', '_blank');
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Wait for content to load, then print
      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
      };
      
    } catch (error) {
      console.error('Error generating PDF report:', error);
      alert('Error generating PDF report. Please try again.');
    } finally {
      setGeneratingReport(false);
    }
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
              <button
                className="btn btn-success"
                onClick={generateCSVReport}
                disabled={generatingReport || tickets.length === 0}
              >
                {generatingReport ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export CSV
                  </>
                )}
              </button>
              <button
                className="btn btn-primary"
                onClick={generatePDFReport}
                disabled={generatingReport || tickets.length === 0}
              >
                {generatingReport ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Generate PDF
                  </>
                )}
              </button>
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
