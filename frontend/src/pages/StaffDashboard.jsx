import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ResourceForm from '../components/forms/ResourceForm';
import { useNotifications } from '../hooks/useNotifications';

const StaffDashboard = () => {
    const [stats, setStats] = useState({
        equipmentItems: 156,
        activeBookings: 23,
        pendingRequests: 8,
        maintenanceTickets: 5
    });

    const [loading, setLoading] = useState(true);
    const [resources, setResources] = useState([]);
    const [myResources, setMyResources] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [showResourceModal, setShowResourceModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [showAllInventory, setShowAllInventory] = useState(false);
    const [editingResource, setEditingResource] = useState(null);
    const { 
        userBookings, 
        userTickets, 
        markAsRead, 
        markAllAsRead, 
        isNotificationRead,
        getTotalUnreadCount 
    } = useNotifications();

    const deptBookings = [
        { id: 1, resource: 'Conference Room', date: 'Apr 15', time: '10 AM - 12 PM', details: 'Equipment: Projector x2', status: 'ACTIVE' },
        { id: 2, resource: 'Lab 201', date: 'Apr 16', time: '2 PM - 5 PM', details: 'Status: APPROVED', status: 'APPROVED' }
    ];

    const maintenanceRequests = [
        { id: 101, title: 'AC not working - Room 203', status: 'PENDING', priority: 'High' },
        { id: 102, title: 'Lights flickering - Lab 105', status: 'IN_PROGRESS', priority: 'Medium' }
    ];

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const token = localStorage.getItem('token');

                // Fetch all resources for inventory and category view
                const resourcesResponse = await axios.get('http://localhost:8080/api/resources');
                const resourcesData = resourcesResponse.data;
                setResources(resourcesData);

                // Fetch my resources (created by current user)
                const myResourcesResponse = await axios.get('http://localhost:8080/api/resources/my', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const myResourcesData = myResourcesResponse.data || [];
                setMyResources(myResourcesData);

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

                setInventory(Object.values(resourceByType));

                // Update stats based on actual data
                setStats({
                    equipmentItems: myResourcesData.length,
                    activeBookings: 0,
                    pendingRequests: 0,
                    maintenanceTickets: 0
                });
            } catch (error) {
                console.error('Error fetching staff dashboard data:', error);
                // Set fallback data if API fails
                setInventory([
                    { category: 'LECTURE_HALL', available: 12, total: 15, icon: '🏛️' },
                    { category: 'LAB', available: 25, total: 30, icon: '🔬' },
                    { category: 'MEETING_ROOM', available: 8, total: 10, icon: '🏢' }
                ]);
                setMyResources([]);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);


    const handleDeleteResource = async (id) => {
        if (!confirm('Are you sure you want to delete this resource?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:8080/api/resources/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Refresh my resources
            const myResourcesResponse = await axios.get('http://localhost:8080/api/resources/my', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMyResources(myResourcesResponse.data || []);
        } catch (error) {
            console.error('Error deleting resource:', error);
            alert('Failed to delete resource');
        }
    };

    const openCreateResourceModal = () => {
        setEditingResource(null);
        setShowResourceModal(true);
    };

    const openEditResourceModal = (resource) => {
        setEditingResource(resource);
        setShowResourceModal(true);
    };

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
        <div className="min-h-screen bg-base-200 p-4 md:p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Header Header Header */}
                <div className="flex flex-col md:flex-row justify-between items-center bg-base-100 p-8 rounded-3xl shadow-xl border border-base-300 gap-6">
                    <div className="flex items-center gap-6">
                        <div className="avatar shadow-lg ring-offset-base-100 ring-offset-2 ring ring-warning/30 rounded-full">
                            <div className="w-20 rounded-full bg-gradient-to-tr from-warning to-orange-500 text-white flex items-center justify-center text-3xl font-black">
                                SJ
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-black bg-gradient-to-r from-orange-600 to-warning bg-clip-text text-transparent">
                                STAFF DASHBOARD
                            </h1>
                            <p className="text-xl font-bold opacity-70">Sarah Johnson — <span className="text-warning italic font-black">Facilities Manager</span></p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={openCreateResourceModal} className="btn btn-warning text-white px-8 shadow-lg shadow-warning/20">Add Resource</button>
                        <button className="btn btn-outline border-base-300">Inventory Logs</button>
                    </div>
                </div>

                {/* Stats Section Stats Section */}

                {/* Stats Section Stats Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'My Resources', value: stats.equipmentItems, color: 'from-orange-600 to-yellow-500' },
                        { label: 'Active Bookings', value: stats.activeBookings, color: 'from-teal-600 to-emerald-500' },
                        { label: 'Pending Requests', value: stats.pendingRequests, color: 'from-blue-600 to-indigo-500' },
                        { label: 'Maintenance Tickets', value: stats.maintenanceTickets, color: 'from-rose-600 to-pink-500' }
                    ].map((stat, i) => (
                        <div key={i} className={`card bg-gradient-to-br ${stat.color} text-white shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer overflow-hidden group`}>
                            <div className="card-body p-8 items-center text-center relative z-10">
                                <h2 className="text-xs font-black tracking-widest uppercase opacity-80">{stat.label}</h2>
                                <p className="text-5xl font-black mt-2">{stat.value}</p>
                            </div>
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform duration-500">
                                <span className="text-6xl font-black opacity-20">#</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Recent Notifications Section */}
                <div className="card bg-base-100 shadow-xl border border-base-300 overflow-hidden">
                    <div className="p-8 border-b border-base-200 bg-warning/5">
                        <h3 className="text-xl font-black flex items-center gap-4 uppercase tracking-tighter">
                            <span className="w-2 h-8 bg-warning rounded-full"></span>
                            &#x1f514; RECENT NOTIFICATIONS
                            {getTotalUnreadCount() > 0 && (
                                <span className="badge badge-warning badge-md text-white font-black ml-auto">
                                    {getTotalUnreadCount()} NEW
                                </span>
                            )}
                        </h3>
                    </div>
                    <div className="card-body p-6 space-y-4">
                        {(() => {
                            const allNotifications = [
                                ...userBookings.slice(0, 3).map(b => ({
                                    id: `booking-${b.id}`,
                                    type: 'USER_BOOKING',
                                    title: `Booking: ${b.resourceName || b.facilityName}`,
                                    message: `${b.date} - ${b.startTime} to ${b.endTime}`,
                                    createdAt: b.createdAt || new Date().toISOString(),
                                    icon: '&#x1f4c5;'
                                })),
                                ...userTickets.slice(0, 3).map(t => ({
                                    id: `ticket-${t.id}`,
                                    type: 'USER_TICKET',
                                    title: `Ticket: ${t.title}`,
                                    message: `Status: ${t.status} | Priority: ${t.priority}`,
                                    createdAt: t.createdAt || new Date().toISOString(),
                                    icon: '&#x1f39f;'
                                }))
                            ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

                            return allNotifications.length > 0 ? (
                                allNotifications.map((n) => (
                                    <div 
                                        key={n.id} 
                                        className={`flex gap-4 p-5 bg-base-200 rounded-2xl border border-base-300 items-start hover:bg-base-100 transition-colors cursor-pointer ${
                                            isNotificationRead(n.id) ? 'opacity-60' : ''
                                        }`}
                                        onClick={() => markAsRead(n.id)}
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center text-xl shadow-inner border border-warning/20">
                                            {n.icon}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-sm flex justify-between">
                                                {n.title}
                                                <span className="text-[10px] opacity-40 font-mono italic">
                                                    {new Date(n.createdAt).toLocaleTimeString()}
                                                </span>
                                            </h4>
                                            <p className="text-xs opacity-60 mt-1">{n.message}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 opacity-50">
                                    <p className="font-bold">No notifications found</p>
                                </div>
                            );
                        })()}
                        <div className="flex gap-2 mt-4">
                            <button 
                                onClick={() => {
                                    markAllAsRead();
                                }}
                                className="btn btn-sm btn-warning text-white flex-1 font-black"
                            >
                                Mark All as Read
                            </button>
                            <button 
                                onClick={() => window.location.href = '/notifications'}
                                className="btn btn-sm btn-outline flex-1 font-black"
                            >
                                View All
                            </button>
                        </div>
                    </div>
                </div>

                {/* Equipment Inventory Equipment Inventory */}
                <div className="card bg-base-100 shadow-2xl border border-base-300 overflow-hidden">
                    <div className="p-8 border-b border-base-200 bg-warning/5 flex flex-col md:flex-row justify-between items-center gap-6">
                        <h3 className="text-2xl font-black flex items-center gap-4 uppercase tracking-tighter">
                            <span className="w-3 h-8 bg-warning rounded-full"></span>
                             RESOURCE INVENTORY
                        </h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowAllInventory(!showAllInventory)}
                                className="btn btn-sm btn-warning text-white"
                            >
                                {showAllInventory ? 'Show Less' : 'View All Resources'}
                            </button>
                        </div>
                    </div>
                    <div className="card-body p-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {inventory.length > 0 ? (showAllInventory ? inventory : inventory.slice(0, 3)).map((item, i) => (
                                <div key={i} className="card bg-base-200 border border-base-300 hover:shadow-2xl hover:border-warning/40 transition-all p-6 text-center group">
                                    <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">{item.icon}</div>
                                    <h4 className="text-2xl font-black">{item.category.replace('_', ' ')}</h4>
                                    <div className="divider my-4">Status</div>
                                    <div className="flex justify-between items-center px-4">
                                        <div className="text-center">
                                            <p className="text-2xl font-black text-warning">{item.available}</p>
                                            <p className="text-[10px] uppercase font-bold opacity-60">Available</p>
                                        </div>
                                        <div className="w-[1px] h-10 bg-base-300"></div>
                                        <div className="text-center">
                                            <p className="text-2xl font-black opacity-40">{item.total}</p>
                                            <p className="text-[10px] uppercase font-bold opacity-60">Total</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleViewCategory(item.category)}
                                        className="btn btn-sm btn-ghost btn-block mt-6 border-base-300"
                                    >
                                        View Category →
                                    </button>
                                </div>
                            )) : (
                                <div className="col-span-3 text-center py-8 opacity-50">
                                    <p className="font-bold">No resources found</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* My Resources Section My Resources Section */}
                <div className="card bg-base-100 shadow-2xl border border-base-300 overflow-hidden">
                    <div className="p-8 border-b border-base-200 bg-warning/5 flex justify-between items-center">
                        <h3 className="text-2xl font-black flex items-center gap-4 uppercase tracking-tighter">
                            <span className="w-3 h-8 bg-warning rounded-full"></span>
                            MY RESOURCES
                        </h3>
                        <button onClick={openCreateResourceModal} className="btn btn-sm btn-warning text-white">
                            + Add New
                        </button>
                    </div>
                    <div className="card-body p-8">
                        {myResources.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="table table-lg">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Type</th>
                                            <th>Capacity</th>
                                            <th>Location</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {myResources.map((resource) => (
                                            <tr key={resource.id} className="hover">
                                                <td className="font-bold">{resource.name}</td>
                                                <td>
                                                    <span className="badge badge-outline">{resource.type?.replace('_', ' ')}</span>
                                                </td>
                                                <td>{resource.capacity || 'N/A'}</td>
                                                <td>{resource.location}</td>
                                                <td>
                                                    <span className={`badge ${resource.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`}>
                                                        {resource.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => openEditResourceModal(resource)}
                                                            className="btn btn-sm btn-outline"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteResource(resource.id)}
                                                            className="btn btn-sm btn-error text-white"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-8 opacity-50">
                                <p className="font-bold">No resources created by you yet</p>
                                <button onClick={openCreateResourceModal} className="btn btn-sm btn-warning text-white mt-4">
                                    Create Your First Resource
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Department Bookings Department Bookings */}
                    <div className="card bg-base-100 shadow-xl border border-base-300 overflow-hidden">
                        <div className="p-8 border-b border-base-200 bg-teal-500/5 flex justify-between items-center">
                            <h3 className="text-xl font-black flex items-center gap-3">
                                <span className="w-2 h-6 bg-teal-500 rounded-full"></span>
                                📅 DEPARTMENT BOOKINGS
                            </h3>
                            <button className="btn btn-sm btn-ghost text-teal-600">SCHEDULE</button>
                        </div>
                        <div className="card-body p-6 space-y-4">
                            {deptBookings.map((b) => (
                                <div key={b.id} className="p-5 bg-base-200 rounded-2xl border border-base-300 hover:border-teal-500/50 transition-all group">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-bold text-lg">{b.date} - {b.resource}</h4>
                                            <p className="text-sm font-black text-teal-600 uppercase mb-1">{b.time}</p>
                                            <p className="text-xs opacity-60 italic font-medium">{b.details}</p>
                                        </div>
                                        <span className={`badge font-black text-[10px] p-3 text-white ${b.status === 'ACTIVE' ? 'badge-info' : 'badge-success'}`}>
                                            {b.status}
                                        </span>
                                    </div>
                                    <div className="flex gap-2 justify-end mt-4">
                                        <button className="btn btn-xs btn-outline border-base-300">Edit</button>
                                        <button className="btn btn-xs btn-ghost text-error">Cancel</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Maintenance Maintenance */}
                    <div className="card bg-base-100 shadow-xl border border-base-300 overflow-hidden">
                        <div className="p-8 border-b border-base-200 bg-rose-500/5 flex justify-between items-center">
                            <h3 className="text-xl font-black flex items-center gap-3 text-rose-600">
                                <span className="w-2 h-6 bg-rose-500 rounded-full"></span>
                                ⚠️ MAINTENANCE REQUESTS
                            </h3>
                        </div>
                        <div className="card-body p-6 space-y-4">
                            {maintenanceRequests.map((req) => (
                                <div key={req.id} className="p-5 bg-base-200 rounded-2xl border border-base-300 hover:border-rose-500/50 transition-all flex items-center justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white ${req.priority === 'High' ? 'bg-rose-500 shadow-lg shadow-rose-200' : 'bg-warning shadow-lg shadow-warning-200'}`}>
                                            {req.priority === 'High' ? '!' : '?'}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm">{req.title}</h4>
                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mt-1">{req.status}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button className="btn btn-xs btn-outline border-base-300">Assign</button>
                                        <button className="btn btn-xs btn-ghost">View</button>
                                    </div>
                                </div>
                            ))}
                            <button className="btn btn-rose-500 text-white btn-block btn-sm mt-4 shadow-lg shadow-rose-200">New Request +</button>
                        </div>
                    </div>
                </div>

                {/* Resource Usage Analytics */}
                <div className="card bg-base-100 shadow-2xl border border-base-300 overflow-hidden">
                    <div className="p-8 border-b border-base-200 bg-indigo-500/5 flex justify-between items-center">
                        <h3 className="text-2xl font-black flex items-center gap-4">
                             <span className="w-3 h-8 bg-indigo-500 rounded-full"></span>
                             RESOURCE USAGE ANALYTICS
                        </h3>
                        <div className="flex gap-2">
                             <button className="btn btn-sm btn-primary" onClick={() => {
                                 const data = myResources.map(r => ({
                                     name: r.name,
                                     type: r.type,
                                     location: r.location,
                                     capacity: r.capacity,
                                     status: r.status
                                 }));
                                 const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                                 const url = URL.createObjectURL(blob);
                                 const a = document.createElement('a');
                                 a.href = url;
                                 a.download = 'my-resources.json';
                                 a.click();
                             }}>Export Data</button>
                        </div>
                    </div>
                    <div className="card-body p-8 space-y-8">
                        <div>
                            <p className="text-sm font-black opacity-60 uppercase mb-4 tracking-widest">My Resources Overview</p>
                            {myResources.length > 0 ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="stat bg-base-200 rounded-lg p-4">
                                            <div className="stat-title text-xs">Total Resources</div>
                                            <div className="stat-value text-2xl">{myResources.length}</div>
                                        </div>
                                        <div className="stat bg-base-200 rounded-lg p-4">
                                            <div className="stat-title text-xs">Active</div>
                                            <div className="stat-value text-2xl text-green-600">{myResources.filter(r => r.status === 'ACTIVE').length}</div>
                                        </div>
                                        <div className="stat bg-base-200 rounded-lg p-4">
                                            <div className="stat-title text-xs">In Maintenance</div>
                                            <div className="stat-value text-2xl text-orange-600">{myResources.filter(r => r.status === 'UNDER_MAINTENANCE').length}</div>
                                        </div>
                                        <div className="stat bg-base-200 rounded-lg p-4">
                                            <div className="stat-title text-xs">Out of Service</div>
                                            <div className="stat-value text-2xl text-red-600">{myResources.filter(r => r.status === 'OUT_OF_SERVICE').length}</div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm font-bold opacity-60 uppercase">Resources by Type</p>
                                        {['LECTURE_HALL', 'LAB', 'MEETING_ROOM', 'EQUIPMENT'].map(type => {
                                            const count = myResources.filter(r => r.type === type).length;
                                            const percentage = myResources.length > 0 ? (count / myResources.length) * 100 : 0;
                                            return count > 0 ? (
                                                <div key={type} className="space-y-1">
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="font-bold">{type.replace('_', ' ')}</span>
                                                        <span className="font-black text-indigo-600">{count} ({percentage.toFixed(0)}%)</span>
                                                    </div>
                                                    <div className="w-full bg-base-200 rounded-full h-2 overflow-hidden border border-base-300">
                                                        <div className="bg-indigo-500 h-full rounded-full transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
                                                    </div>
                                                </div>
                                            ) : null;
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 opacity-60">
                                    <p>No resources to analyze</p>
                                </div>
                            )}
                        </div>
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
                                            <table className="table table-lg">
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
                                                                <div className="flex gap-2">
                                                                    {resource.createdBy && resource.createdBy.toLowerCase() === localStorage.getItem('username')?.toLowerCase() ? (
                                                                        <>
                                                                            <button
                                                                                onClick={() => {
                                                                                    setShowCategoryModal(false);
                                                                                    openEditResourceModal(resource);
                                                                                }}
                                                                                className="btn btn-sm btn-outline"
                                                                            >
                                                                                Edit
                                                                            </button>
                                                                            <button
                                                                                onClick={() => {
                                                                                    if (confirm('Are you sure you want to delete this resource?')) {
                                                                                        handleDeleteResource(resource.id);
                                                                                        setShowCategoryModal(false);
                                                                                    }
                                                                                }}
                                                                                className="btn btn-sm btn-error text-white"
                                                                            >
                                                                                Delete
                                                                            </button>
                                                                        </>
                                                                    ) : (
                                                                        <span className="text-xs opacity-50">View only</span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <div className="text-center py-8">
                                                <p className="font-bold opacity-50">No resources found in this category</p>
                                                <p className="text-sm opacity-40">Try creating some resources of this type first</p>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="font-bold opacity-50">No resources found in the system</p>
                                        <p className="text-sm opacity-40">Create your first resource to get started</p>
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

                {/* Resource Create/Edit Modal */}
                {showResourceModal && (
                    <div className="modal modal-open">
                        <div className="modal-box w-11/12 max-w-2xl">
                            <ResourceForm
                                resource={editingResource}
                                onSubmit={() => {
                                    setShowResourceModal(false);
                                    // Refresh resources
                                    const token = localStorage.getItem('token');
                                    axios.get('http://localhost:8080/api/resources/my', {
                                        headers: { Authorization: `Bearer ${token}` }
                                    }).then(response => {
                                        setMyResources(response.data || []);
                                    });
                                }}
                                onCancel={() => setShowResourceModal(false)}
                            />
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default StaffDashboard;
