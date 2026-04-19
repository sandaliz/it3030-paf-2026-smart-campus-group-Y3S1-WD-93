import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../services/dashboardService';
import { useAuth } from '../context/AuthContext';

const StaffDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        activeBookings: 0,
        pendingRequests: 0,
        maintenanceTickets: 0
    });

    const [loading, setLoading] = useState(true);
    const [resources, setResources] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [recentActivity, setRecentActivity] = useState([]);
    const [maintenanceRequests, setMaintenanceRequests] = useState([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const token = localStorage.getItem('token');

                // Fetch staff stats from backend
                try {
                    const statsData = await dashboardService.getStaffStats();
                    setStats({
                        activeBookings: 0,
                        pendingRequests: statsData.resourceRequests || 0,
                        maintenanceTickets: statsData.pendingApprovals || 0
                    });
                } catch (error) {
                    console.error('Error fetching stats:', error);
                }

                // Fetch recent activity from backend
                try {
                    const activityData = await dashboardService.getStaffActivity();
                    setRecentActivity(activityData || []);
                } catch (error) {
                    console.error('Error fetching activity:', error);
                }

                // Fetch all resources for inventory and category view
                try {
                    const resourcesResponse = await axios.get('http://localhost:8080/api/resources');
                    const resourcesData = resourcesResponse.data;
                    setResources(resourcesData);

                    // Transform all resources to inventory format by type (system-wide view)
                    const resourceByType = resourcesData.reduce((acc, resource) => {
                        const type = resource.type || 'OTHER';
                        if (!acc[type]) {
                            acc[type] = { category: type, available: 0, total: 0, icon: getTypeIcon(type) };
                        }
                        acc[type].total += 1;
                        if (resource.status === 'ACTIVE') {
                            acc[type].available += 1;
                        }
                        return acc;
                    }, {});

                    const inventoryData = Object.values(resourceByType);
                    setInventory(inventoryData);
                } catch (error) {
                    console.error('Error fetching resources:', error);
                }

                // Fetch maintenance requests (tickets assigned to staff)
                try {
                    const ticketsResponse = await axios.get('http://localhost:8080/api/tickets', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const ticketsData = ticketsResponse.data?.content || [];
                    setMaintenanceRequests(ticketsData.slice(0, 5).map(t => ({
                        id: t.id,
                        title: t.title,
                        status: t.status,
                        priority: t.priority
                    })));
                } catch (error) {
                    console.error('Error fetching tickets:', error);
                }

            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);


    const handleViewCategory = (category) => {
        setSelectedCategory(category);
        setShowCategoryModal(true);
    };

    const getTypeIcon = (type) => {
        const icons = {
            'LECTURE_HALL': '🏛️',
            'LAB': '🔬',
            'MEETING_ROOM': '🏢',
            'EQUIPMENT': '📱',
            'OTHER': '📚'
        };
        return icons[type] || '📚';
    };

    return (
        <div className="min-h-screen bg-base-300 p-4 md:p-8 font-sans" data-theme="dark">
            {loading && (
                <div className="fixed inset-0 bg-base-300/80 flex items-center justify-center z-50">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                </div>
            )}
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Header */}
                <div className="bg-base-200 shadow-sm rounded-lg p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className="avatar">
                                <div className="w-12 rounded-full bg-primary text-primary-content flex items-center justify-center text-xl font-bold">
                                    {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'ST'}
                                </div>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">Staff Dashboard</h1>
                                <p className="text-sm text-base-content/70">{user?.name || 'Staff Member'}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => window.location.reload()} className="btn btn-sm btn-ghost">
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="stat bg-base-200 shadow-sm rounded-lg">
                        <div className="stat-figure text-secondary">
                            📅
                        </div>
                        <div className="stat-title">Active Bookings</div>
                        <div className="stat-value text-secondary">{stats.activeBookings}</div>
                        <div className="stat-desc">Current bookings</div>
                    </div>
                    <div className="stat bg-base-200 shadow-sm rounded-lg">
                        <div className="stat-figure text-warning">
                            ⏳
                        </div>
                        <div className="stat-title">Pending Requests</div>
                        <div className="stat-value text-warning">{stats.pendingRequests}</div>
                        <div className="stat-desc">Awaiting approval</div>
                    </div>
                    <div className="stat bg-base-200 shadow-sm rounded-lg">
                        <div className="stat-figure text-error">
                            🎫
                        </div>
                        <div className="stat-title">Maintenance Tickets</div>
                        <div className="stat-value text-error">{stats.maintenanceTickets}</div>
                        <div className="stat-desc">Open tickets</div>
                    </div>
                </div>

                {/* Recent Activity Section */}
                <div className="bg-base-200 shadow-sm rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold flex items-center">
                            📋 Recent Activity
                        </h2>
                    </div>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {recentActivity.length > 0 ? (
                            recentActivity.slice(0, 5).map((activity, index) => (
                                <div key={index} className="border-2 border-base-content/30 rounded-lg p-4 hover:border-primary hover:bg-base-300 transition-all cursor-pointer">
                                    <p className="font-semibold">{activity.description}</p>
                                    <p className="text-sm text-base-content/70 mt-1">
                                        {activity.timestamp ? new Date(activity.timestamp).toLocaleString() : 'Just now'}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <p className="text-base-content/60 text-center py-4">No recent activity</p>
                        )}
                    </div>
                </div>

                {/* Maintenance Requests */}
                <div className="bg-base-200 shadow-sm rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold flex items-center">
                            ⚠️ Maintenance Requests
                        </h2>
                    </div>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {maintenanceRequests.map((req) => (
                            <div key={req.id} className="border-2 border-base-content/30 rounded-lg p-4 hover:border-error hover:bg-base-300 transition-all cursor-pointer">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-semibold">{req.title}</h3>
                                        <p className="text-sm text-base-content/70">Priority: {req.priority}</p>
                                    </div>
                                    <span className={`badge badge-sm ${
                                        req.status === 'OPEN' ? 'badge-error' :
                                        req.status === 'IN_PROGRESS' ? 'badge-warning' :
                                        req.status === 'RESOLVED' ? 'badge-success' : 'badge-neutral'
                                    }`}>
                                        {req.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <div className="flex gap-2 justify-end mt-2">
                                    <button onClick={() => navigate(`/tickets/${req.id}`)} className="btn btn-sm btn-outline">
                                        Assign
                                    </button>
                                    <button onClick={() => navigate(`/tickets/${req.id}`)} className="btn btn-sm btn-ghost">
                                        View
                                    </button>
                                </div>
                            </div>
                        ))}
                        {maintenanceRequests.length === 0 && (
                            <p className="text-base-content/60 text-center py-4">No maintenance requests</p>
                        )}
                        <button onClick={() => navigate('/tickets/create')} className="btn btn-sm btn-primary btn-block mt-2">
                            New Request
                        </button>
                    </div>
                </div>

                {/* Resource Inventory */}
                <div className="bg-base-100 shadow-sm rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold flex items-center">
                            🏢 Resource Inventory
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {inventory.length > 0 ? inventory.map((item, i) => (
                            <div key={i} className="border-2 border-base-content/30 rounded-lg p-4 hover:border-primary hover:bg-base-200 transition-all cursor-pointer text-center">
                                <div className="text-4xl mb-2">{item.icon}</div>
                                <h3 className="font-semibold">{item.category.replace('_', ' ')}</h3>
                                <div className="flex justify-between items-center mt-3 px-2">
                                    <div className="text-center">
                                        <p className="text-lg font-bold text-success">{item.available}</p>
                                        <p className="text-xs text-base-content/70">Available</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg font-bold">{item.total}</p>
                                        <p className="text-xs text-base-content/70">Total</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleViewCategory(item.category)}
                                    className="btn btn-sm btn-ghost btn-block mt-3"
                                >
                                    View Category
                                </button>
                            </div>
                        )) : (
                            <p className="text-base-content/60 text-center py-4 col-span-full">No resources found</p>
                        )}
                    </div>
                </div>

                {/* Category View Modal */}
                {showCategoryModal && (
                    <div className="modal modal-open">
                        <div className="modal-box max-w-4xl">
                            <h3 className="font-bold text-lg mb-4">
                                {getTypeIcon(selectedCategory)} {selectedCategory?.replace('_', ' ')} Resources
                            </h3>
                            <div className="overflow-x-auto">
                                {resources && resources.length > 0 ? (
                                    <>
                                        {resources.filter(r => r.type === selectedCategory).length > 0 ? (
                                            <table className="table">
                                                <thead>
                                                    <tr>
                                                        <th>Name</th>
                                                        <th>Capacity</th>
                                                        <th>Location</th>
                                                        <th>Status</th>
                                                        <th>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {resources
                                                        .filter(r => r.type === selectedCategory)
                                                        .map((resource) => (
                                                        <tr key={resource.id} className="hover">
                                                            <td className="font-bold">{resource.name}</td>
                                                            <td>{resource.capacity || 'N/A'}</td>
                                                            <td>{resource.location}</td>
                                                            <td>
                                                                <span className={`badge ${resource.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`}>
                                                                    {resource.status}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <button
                                                                    onClick={() => navigate(`/resources/${resource.id}`)}
                                                                    className="btn btn-sm btn-ghost"
                                                                >
                                                                    View Details
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <div className="text-center py-8">
                                                <p className="text-base-content/60">No resources found in this category</p>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-base-content/60">No resources found in the system</p>
                                    </div>
                                )}
                            </div>
                            <div className="modal-action">
                                <button
                                    className="btn"
                                    onClick={() => setShowCategoryModal(false)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StaffDashboard;
