import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import Toast from '../components/ui/Toast';

const StudentDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        activeBookings: 0,
        pendingBookings: 0,
        approvedTickets: 0,
        openTickets: 0
    });

    const [loading, setLoading] = useState(true);
    const [upcomingBookings, setUpcomingBookings] = useState([]);
    const [facilities, setFacilities] = useState([]);
    const [myTickets, setMyTickets] = useState([]);
    const [savedResources, setSavedResources] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [noteModalOpen, setNoteModalOpen] = useState(false);
    const [selectedResource, setSelectedResource] = useState(null);
    const [noteText, setNoteText] = useState('');
    const [toast, setToast] = useState(null);
    const { user } = useAuth();
    const { userBookings, userTickets, markAsRead, markAllAsRead, isNotificationRead, getTotalUnreadCount } = useNotifications();

    // Helper function to extract data from Page response
    const extractData = (response) => response?.data?.content || response?.data || [];

    // Helper function to get token
    const getToken = () => localStorage.getItem('token');

    // Helper function to refresh saved resources
    const refreshSavedResources = async () => {
        try {
            const token = getToken();
            const response = await axios.get('http://localhost:8080/api/saved-resources', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSavedResources(response.data || []);
        } catch (error) {
            console.error('Error refreshing saved resources:', error);
        }
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            const token = getToken();

            // Fetch all data independently
            const fetchData = async () => {
                try {
                    const bookingsResponse = await axios.get('http://localhost:8080/api/bookings/my-bookings', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const bookingsData = extractData(bookingsResponse);
                    setUpcomingBookings(bookingsData);
                    return bookingsData;
                } catch (error) {
                    console.error('Error fetching bookings:', error);
                    return [];
                }
            };

            const fetchNotifications = async () => {
                try {
                    const notificationsResponse = await axios.get('http://localhost:8080/api/notifications', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setNotifications(notificationsResponse.data || []);
                } catch (error) {
                    console.error('Error fetching notifications:', error);
                    setNotifications([]);
                }
            };

            const fetchFacilities = async () => {
                try {
                    const facilitiesResponse = await axios.get('http://localhost:8080/api/resources');
                    setFacilities(extractData(facilitiesResponse));
                } catch (error) {
                    console.error('Error fetching facilities:', error);
                    setFacilities([]);
                }
            };

            const fetchTickets = async () => {
                try {
                    const ticketsResponse = await axios.get('http://localhost:8080/api/tickets/my-tickets', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const ticketsData = extractData(ticketsResponse);
                    setMyTickets(ticketsData);
                    return ticketsData;
                } catch (error) {
                    console.error('Error fetching tickets:', error);
                    setMyTickets([]);
                    return [];
                }
            };

            const bookings = await fetchData();
            const tickets = await fetchTickets();
            await fetchNotifications();
            await fetchFacilities();

            // Update stats based on actual data
            setStats({
                activeBookings: bookings?.filter(b => b.status === 'APPROVED').length || 0,
                pendingBookings: bookings?.filter(b => b.status === 'PENDING').length || 0,
                approvedTickets: tickets?.filter(t => t.status?.toUpperCase() === 'RESOLVED').length || 0,
                openTickets: tickets?.filter(t => t.status?.toUpperCase() === 'OPEN').length || 0
            });

            setLoading(false);

            // Fetch saved resources independently
            try {
                const savedResourcesResponse = await axios.get('http://localhost:8080/api/saved-resources', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSavedResources(savedResourcesResponse.data || []);
            } catch (error) {
                console.error('Error fetching saved resources:', error);
                setSavedResources([]);
            }
        };

        fetchDashboardData();
    }, []);

    // Set up polling for real-time updates (every 30 seconds)
    useEffect(() => {
        const interval = setInterval(() => {
            fetchDashboardData();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    const handleSaveResource = async (resourceId) => {
        try {
            const token = getToken();
            await axios.post(`http://localhost:8080/api/saved-resources/${resourceId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await refreshSavedResources();
            setToast({ message: 'Resource saved! View in dashboard saved resources section', type: 'success' });
        } catch (error) {
            console.error('Error saving resource:', error);
            setToast({ message: 'Failed to save resource', type: 'error' });
        }
    };

    const handleUnsaveResource = async (resourceId) => {
        try {
            const token = getToken();
            await axios.delete(`http://localhost:8080/api/saved-resources/${resourceId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await refreshSavedResources();
            setToast({ message: 'Resource removed from saved', type: 'error' });
        } catch (error) {
            console.error('Error unsaving resource:', error);
            setToast({ message: 'Failed to remove resource', type: 'error' });
        }
    };

    const isResourceSaved = (resourceId) => {
        return savedResources.some(saved => saved.resourceId === resourceId);
    };

    const handleNoteClick = (savedResource) => {
        setSelectedResource(savedResource);
        setNoteText(savedResource.note || '');
        setNoteModalOpen(true);
    };

    const saveNote = async () => {
        try {
            const token = getToken();
            await axios.put(`http://localhost:8080/api/saved-resources/${selectedResource.resourceId}/note`,
                { note: noteText },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            await refreshSavedResources();

            setNoteModalOpen(false);
            setSelectedResource(null);
            setNoteText('');
        } catch (error) {
            console.error('Error saving note:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-base-200 p-4 md:p-8 font-sans flex items-center justify-center">
                <div className="text-center">
                    <div className="loading loading-spinner loading-lg text-primary mb-4"></div>
                    <p className="text-lg font-bold">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-base-200 p-4 md:p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Header Header Header */}
                <div className="flex flex-col md:flex-row justify-between items-center bg-base-100 p-8 rounded-3xl shadow-xl border border-base-300 gap-6">
                    <div className="flex items-center gap-6">
                        <div className="avatar shadow-lg">
                            <div className="w-20 rounded-full bg-gradient-to-tr from-primary to-accent text-white flex items-center justify-center text-3xl font-black">
                                {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'U'}
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                                STUDENT DASHBOARD
                            </h1>
                            <p className="text-xl font-bold opacity-70">{user?.name || 'User'} — <span className="text-secondary italic">{user?.roles?.[0]?.replace('ROLE_', '') || 'Student'}</span></p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => window.location.href = 'http://localhost:5173/tickets'}
                            className="btn btn-secondary px-8 shadow-lg shadow-secondary/20"
                        >
                            Help Center
                        </button>
                    </div>
                </div>

                {/* Activity Section Activity Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Active Bookings', value: stats.activeBookings, color: 'text-primary', bg: 'bg-primary/10', icon: '📅' },
                        { label: 'Pending Bookings', value: stats.pendingBookings, color: 'text-warning', bg: 'bg-warning/10', icon: '⏳' },
                        { label: 'Approved Tickets', value: stats.approvedTickets, color: 'text-success', bg: 'bg-success/10', icon: '✅' },
                        { label: 'My Open Tickets', value: stats.openTickets, color: 'text-error', bg: 'bg-error/10', icon: '🎫' }
                    ].map((stat, i) => (
                        <div key={i} className="stat bg-base-100 shadow-sm rounded-lg border border-base-300">
                            <div className={`stat-figure ${stat.bg}`}>
                                <div className={`text-3xl ${stat.color}`}>{stat.icon}</div>
                            </div>
                            <div className={`stat-title ${stat.color}`}>{stat.label}</div>
                            <div className={`stat-value text-3xl ${stat.color}`}>{stat.value}</div>
                            <div className="stat-desc">Total count</div>
                        </div>
                    ))}
                </div>

                {/* Saved Resources Count */}
                <div className="stat bg-base-100 shadow-sm rounded-lg border border-base-300">
                    <div className="stat-figure bg-secondary/10">
                        <div className="text-3xl text-secondary">❤️</div>
                    </div>
                    <div className="stat-title text-secondary">Saved Resources</div>
                    <div className="stat-value text-3xl text-secondary">{savedResources.length}</div>
                    <div className="stat-desc">Resources saved for later</div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Upcoming Bookings Upcoming Bookings */}
                    <div className="card bg-base-100 shadow-xl border border-base-300 overflow-hidden">
                        <div className="p-8 border-b border-base-200 bg-primary/5">
                            <h3 className="text-xl font-black flex items-center gap-4 uppercase tracking-tighter">
                                <span className="w-2 h-8 bg-primary rounded-full"></span>
                                📅 MY UPCOMING BOOKINGS
                            </h3>
                        </div>
                        <div className="card-body p-6 space-y-4">
                            {upcomingBookings.length > 0 ? (
                                upcomingBookings.map((b) => (
                                    <div key={b.id} className="p-6 bg-base-200 rounded-2xl border border-base-300 flex justify-between items-center group hover:border-primary/50 transition-all">
                                        <div>
                                            <h4 className="font-black text-xl text-primary">{b.resource || b.facilityName} - {b.date}</h4>
                                            <p className="text-sm font-bold opacity-60 uppercase">{b.time || `${b.startTime} - ${b.endTime}`}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className={`text-[10px] font-black px-3 py-1 rounded-full border border-base-300 ${b.status === 'APPROVED' ? 'bg-success/20 text-success border-success/30' : 'bg-warning/20 text-warning border-warning/30'}`}>
                                                    {b.status === 'APPROVED' ? '✅ APPROVED' : '⏳ PENDING'}
                                                </span>
                                            </div>
                                        </div>
                                        <button className="btn btn-sm btn-ghost text-error hover:bg-error/10 font-black">Cancel</button>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 opacity-50">
                                    <p className="font-bold">No upcoming bookings found</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Notifications Recent Notifications */}
                    <div className="card bg-base-100 shadow-xl border border-base-300 overflow-hidden">
                        <div className="p-8 border-b border-base-200 bg-secondary/5">
                            <h3 className="text-xl font-black flex items-center gap-4 uppercase tracking-tighter">
                                <span className="w-2 h-8 bg-secondary rounded-full"></span>
                                &#x1f514; RECENT NOTIFICATIONS
                                {getTotalUnreadCount() > 0 && (
                                    <span className="badge badge-secondary badge-md text-white font-black ml-auto">
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
                                            className={`flex gap-4 p-5 bg-base-200 rounded-2xl border border-base-300 items-start hover:bg-base-100 transition-colors ${
                                                isNotificationRead(n.id) ? 'opacity-60' : ''
                                            }`}
                                        >
                                            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-xl shadow-inner border border-secondary/20">
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
                                            {!isNotificationRead(n.id) && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        markAsRead(n.id);
                                                    }}
                                                    className="btn btn-xs btn-secondary text-white"
                                                >
                                                    Mark read
                                                </button>
                                            )}
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
                                    className="btn btn-sm btn-secondary text-white flex-1 font-black"
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
                </div>

                {/* Quick Actions Quick Actions */}
                <div className="card bg-base-100 shadow-2xl border border-base-300 overflow-hidden">
                    <div className="p-8 border-b border-base-200">
                        <h3 className="text-xl font-black flex items-center gap-4">
                             <span className="w-2 h-8 bg-accent rounded-full"></span>
                             🚀 QUICK ACTIONS
                        </h3>
                    </div>
                    <div className="card-body p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-8 bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl border-2 border-primary/20 hover:border-primary transition-all group flex items-center justify-between cursor-pointer shadow-lg hover:shadow-primary/10">
                                <div className="space-y-2">
                                    <h4 className="text-2xl font-black text-primary">📅 Book a Resource</h4>
                                    <p className="text-sm opacity-60 font-medium">Browse and book labs, halls, or equipment.</p>
                                    <button
                                        onClick={() => navigate('/bookings')}
                                        className="badge badge-primary p-3 mt-4 text-white font-black group-hover:px-6 transition-all"
                                    >
                                        Book Now →
                                    </button>
                                </div>
                                <div className="text-5xl opacity-20 group-hover:opacity-100 group-hover:scale-125 transition-all duration-500">🏢</div>
                            </div>
                            <div className="p-8 bg-gradient-to-br from-error/10 to-error/5 rounded-3xl border-2 border-error/20 hover:border-error transition-all group flex items-center justify-between cursor-pointer shadow-lg hover:shadow-error/10">
                                <div className="space-y-2">
                                    <h4 className="text-2xl font-black text-error">⚠️ Report an Issue</h4>
                                    <p className="text-sm opacity-60 font-medium">Report facility problems or broken gear.</p>
                                    <button 
                                        onClick={() => window.location.href = 'http://localhost:5173/tickets'}
                                        className="badge badge-error p-3 mt-4 text-white font-black group-hover:px-6 transition-all"
                                    >
                                        Report →
                                    </button>
                                </div>
                                <div className="text-5xl opacity-20 group-hover:opacity-100 group-hover:scale-125 transition-all duration-500">🆘</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Saved Resources */}
                <div className="card bg-base-100 shadow-xl border border-base-300 overflow-hidden">
                    <div className="p-8 border-b border-base-200 bg-secondary/5 flex justify-between items-center">
                        <h3 className="text-xl font-black flex items-center gap-4 uppercase tracking-tighter">
                            <span className="w-2 h-8 bg-secondary rounded-full"></span>
                            ❤️ SAVED RESOURCES — Keep notes on your saved resources
                        </h3>
                        <button
                            onClick={() => window.location.href = 'http://localhost:5173/resources'}
                            className="btn btn-sm btn-ghost"
                        >
                            View All Resources
                        </button>
                    </div>
                    <div className="card-body p-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {savedResources.length === 0 ? (
                                <div className="col-span-full text-center py-8 opacity-50">
                                    <p className="font-bold">No saved resources yet</p>
                                </div>
                            ) : (
                                savedResources.slice(0, 6).map((saved) => (
                                    <div key={saved.id} className="card bg-base-200 border border-base-300 hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden">
                                        <div className="h-2 bg-secondary"></div>
                                        <div className="card-body p-6">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="text-xl font-black text-secondary">{saved.name || 'Unknown Resource'}</h4>
                                                    <p className="text-xs font-bold opacity-50 uppercase tracking-widest">{saved.type?.replace('_', ' ') || 'Resource'}</p>
                                                    <p className="text-sm font-bold opacity-70 mt-1">{saved.location || 'Unknown'}</p>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleNoteClick(saved);
                                                    }}
                                                    className="btn btn-sm btn-ghost"
                                                    title="Add/Edit Note"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                            </div>
                                            {saved.note && (
                                                <div className="mb-3 p-2 bg-yellow-100 dark:bg-yellow-900/40 rounded text-sm text-gray-900 dark:text-gray-900">
                                                    {saved.note}
                                                </div>
                                            )}
                                            <div className="flex justify-between items-center mt-4">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleUnsaveResource(saved.resourceId);
                                                    }}
                                                    className="btn btn-sm btn-error"
                                                >
                                                    Remove
                                                </button>
                                                <button
                                                    onClick={() => window.location.href = `http://localhost:5173/resources/${saved.resourceId}`}
                                                    className="btn btn-sm btn-primary"
                                                >
                                                    View Details
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* My Tickets Section My Tickets Section */}
                <div className="card bg-base-100 shadow-xl border border-base-300 mb-12">
                     <div className="p-8 border-b border-base-200 flex justify-between items-center">
                        <h3 className="text-xl font-black flex items-center gap-4">
                             <span className="w-2 h-8 bg-neutral rounded-full"></span>
                             🎫 MY TICKETS
                        </h3>
                        <button 
                            onClick={() => window.location.href = 'http://localhost:5173/tickets'}
                            className="btn btn-sm btn-outline px-6"
                        >
                            Raise Ticket
                        </button>
                    </div>
                    <div className="overflow-x-auto p-4">
                        <table className="table table-lg">
                            <thead>
                                <tr className="text-xs opacity-50 uppercase">
                                    <th>Ticket details</th>
                                    <th>Status</th>
                                    <th className="text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {myTickets.length > 0 ? (
                                    myTickets.map((t) => (
                                        <tr key={t.id} className="hover">
                                            <td className="font-bold">
                                                <p className="text-neutral mb-1">#{t.id.substring(0, 8)}</p>
                                                <p className="text-base-content/70">{t.title}</p>
                                            </td>
                                            <td>
                                                <span className={`badge font-black text-[10px] p-3 text-white ${t.status === 'OPEN' ? 'badge-primary' : 'badge-success'}`}>
                                                    {t.status}
                                                </span>
                                            </td>
                                            <td className="text-right">
                                                <button
                                                    onClick={() => window.location.href = `http://localhost:5173/tickets/${t.id}`}
                                                    className="btn btn-ghost btn-sm text-info font-black"
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3" className="text-center py-8 opacity-50">
                                            <p className="font-bold">No tickets found</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-6 text-center border-t border-base-200">
                        <button className="btn btn-link btn-sm text-xs opacity-40 hover:opacity-100 transition-opacity">Show resolved tickets</button>
                    </div>
                </div>

                {/* Browse Facilities Browse Facilities */}
                <div className="card bg-base-100 shadow-xl border border-base-300 overflow-hidden">
                    <div className="p-8 border-b border-base-200 bg-info/5 flex flex-col md:flex-row justify-between items-center gap-6">
                        <h3 className="text-xl font-black flex items-center gap-4">
                             <span className="w-2 h-8 bg-info rounded-full"></span>
                             🏢 BROWSE FACILITIES
                        </h3>
                        <div className="flex flex-wrap gap-3 w-full md:w-auto">
                            <button
                                onClick={() => window.location.href = 'http://localhost:5173/resources'}
                                className="btn btn-sm btn-ghost"
                            >
                                View All
                            </button>
                        </div>
                    </div>
                    <div className="card-body p-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {facilities.length > 0 ? (
                                facilities.slice(0, 4).map((f, i) => (
                                    <div key={i} className="card bg-base-200 border border-base-300 hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden">
                                         <div className="h-2 bg-info"></div>
                                         <div className="card-body p-6">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="text-xl font-black text-info">{f.name}</h4>
                                                    <p className="text-xs font-bold opacity-50 uppercase tracking-widest">{f.type}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`badge font-black text-[10px] ${f.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'} text-white`}>
                                                        {f.status}
                                                    </span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            isResourceSaved(f.id) ? handleUnsaveResource(f.id) : handleSaveResource(f.id);
                                                        }}
                                                        className={`btn btn-sm ${isResourceSaved(f.id) ? 'btn-secondary' : 'btn-ghost'} transition-all duration-300 hover:scale-125 active:scale-95`}
                                                        title={isResourceSaved(f.id) ? 'Remove from saved' : 'Save resource'}
                                                    >
                                                        <svg className="w-5 h-5" fill={isResourceSaved(f.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-sm font-bold opacity-70 mt-4 mb-6">Capacity: <span className="text-info">{f.capacity}</span> students</p>
                                            <button
                                                onClick={() => navigate('/bookings')}
                                                className={`btn btn-sm ${f.status === 'ACTIVE' ? 'btn-info text-white' : 'btn-ghost border-base-300 text-base-content/40'} btn-block font-black`}
                                            >
                                                {f.type === 'Equipment' ? 'Request' : 'Book Now'}
                                            </button>
                                         </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full text-center py-8 opacity-50">
                                    <p className="font-bold">No facilities available</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>

            {/* Note Modal */}
            {noteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-base-100 rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
                        <h3 className="text-xl font-bold mb-4">Add Note</h3>
                        <p className="text-sm text-base-content/70 mb-4">
                            {selectedResource?.name || 'Resource'}
                        </p>
                        <textarea
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder="Add a note about this resource :)..."
                            className="textarea textarea-bordered w-full h-32 mb-4"
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => {
                                    setNoteModalOpen(false);
                                    setSelectedResource(null);
                                    setNoteText('');
                                }}
                                className="btn btn-ghost"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveNote}
                                className="btn btn-primary"
                            >
                                Save Note
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Toast Notification */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
};

export default StudentDashboard;
