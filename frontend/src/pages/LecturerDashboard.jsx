import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LecturerDashboard = () => {
    const [stats, setStats] = useState({
        myBookings: 0,
        myResources: 0,
        upcomingClasses: 0
    });

    const [loading, setLoading] = useState(true);
    const [myBookings, setMyBookings] = useState([]);
    const [myTickets, setMyTickets] = useState([]);
    const [resources, setResources] = useState([]);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const token = localStorage.getItem('token');
                
                // Fetch stats
                const statsResponse = await axios.get('http://localhost:8080/api/lecturer/dashboard/stats', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStats(statsResponse.data);
                
                // Fetch my bookings
                const bookingsResponse = await axios.get('http://localhost:8080/api/user/bookings', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setMyBookings(bookingsResponse.data || []);
                
                // Fetch my tickets
                const ticketsResponse = await axios.get('http://localhost:8080/api/tickets/my-tickets', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setMyTickets(ticketsResponse.data.content || []);
                
                // Fetch available resources
                const resourcesResponse = await axios.get('http://localhost:8080/api/resources', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setResources(resourcesResponse.data || []);
                
            } catch (error) {
                console.error('Error fetching lecturer dashboard data:', error);
                // Set fallback data if API fails
                setStats({ myBookings: 0, myResources: 0, upcomingClasses: 0 });
                setMyBookings([]);
                setMyTickets([]);
                setResources([]);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

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
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Header */}
                <div className="bg-base-100 shadow-sm rounded-lg p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className="avatar">
                                <div className="w-12 rounded-full bg-primary text-primary-content flex items-center justify-center text-xl font-bold">
                                    {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'U'}
                                </div>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">Lecturer Dashboard</h1>
                                <p className="text-sm text-base-content/70">{user?.name || 'User'} • {user?.roles?.[0]?.replace('ROLE_', '') || 'Lecturer'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="stat bg-base-100 shadow-sm rounded-lg">
                        <div className="stat-figure text-primary">
                            📅
                        </div>
                        <div className="stat-title">My Bookings</div>
                        <div className="stat-value text-primary">{stats.myBookings}</div>
                        <div className="stat-desc">Total bookings made</div>
                    </div>
                    <div className="stat bg-base-100 shadow-sm rounded-lg">
                        <div className="stat-figure text-error">
                            🎫
                        </div>
                        <div className="stat-title">My Tickets</div>
                        <div className="stat-value text-error">{myTickets.length}</div>
                        <div className="stat-desc">Support tickets created</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Bookings Section */}
                    <div className="bg-base-100 shadow-sm rounded-lg p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold flex items-center">
                                📅 My Bookings
                            </h2>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => navigate('/bookings')}
                                    className="btn btn-sm btn-ghost"
                                >
                                    View All
                                </button>
                                <button 
                                    onClick={() => navigate('/bookings')}
                                    className="btn btn-sm btn-primary"
                                >
                                    New Booking
                                </button>
                            </div>
                        </div>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {myBookings.length === 0 ? (
                                <p className="text-base-content/60 text-center py-4">No bookings found</p>
                            ) : (
                                myBookings.map((b) => (
                                    <div key={b.id} className="border border-base-300 rounded-lg p-4 hover:border-success hover:bg-base-200 transition-all cursor-pointer">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="font-semibold">{b.resource}</h3>
                                                <p className="text-sm text-base-content/70">{b.purpose}</p>
                                            </div>
                                            <span className={`badge badge-sm ${
                                                b.status === 'APPROVED' ? 'badge-success' : 
                                                b.status === 'PENDING' ? 'badge-warning' : 
                                                b.status === 'CANCELLED' ? 'badge-error' : 'badge-neutral'
                                            }`}>
                                                {b.status}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm text-base-content/70">
                                            <p>{new Date(b.startTime).toLocaleDateString()}</p>
                                            <p>
                                                {new Date(b.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(b.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* My Tickets */}
                    <div className="bg-base-100 shadow-sm rounded-lg p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold flex items-center">
                                🎫 My Tickets
                            </h2>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => navigate('/tickets')}
                                    className="btn btn-sm btn-ghost"
                                >
                                    View All
                                </button>
                                <button 
                                    onClick={() => navigate('/tickets/create')}
                                    className="btn btn-sm btn-primary"
                                >
                                    Create Ticket
                                </button>
                            </div>
                        </div>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {myTickets.length === 0 ? (
                                <p className="text-base-content/60 text-center py-4">No tickets found</p>
                            ) : (
                                myTickets.slice(0, 5).map((ticket) => (
                                    <div key={ticket.id} className="border border-base-300 rounded-lg p-4 hover:border-error hover:bg-base-200 transition-all cursor-pointer">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="font-semibold">{ticket.title}</h3>
                                                <p className="text-sm text-base-content/70">{ticket.category}</p>
                                            </div>
                                            <span className={`badge badge-sm ${
                                                ticket.status === 'OPEN' ? 'badge-error' :
                                                ticket.status === 'IN_PROGRESS' ? 'badge-warning' :
                                                ticket.status === 'RESOLVED' ? 'badge-success' : 'badge-neutral'
                                            }`}>
                                                {ticket.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => navigate(`/tickets/${ticket.id}`)}
                                                className="btn btn-sm btn-outline"
                                            >
                                                View
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Available Resources */}
                <div className="bg-base-100 shadow-sm rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold flex items-center">
                            🏢 Available Resources
                        </h2>
                        <button 
                            onClick={() => navigate('/resources')}
                            className="btn btn-sm btn-ghost"
                        >
                            View All
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {resources.filter(r => r.status === 'ACTIVE').length === 0 ? (
                            <p className="text-base-content/60 text-center py-4 col-span-full">No active resources found</p>
                        ) : (
                            resources.filter(r => r.status === 'ACTIVE').slice(0, 6).map((resource) => (
                                <div key={resource.id} className="border border-base-300 rounded-lg p-4 hover:border-primary hover:bg-base-200 transition-all cursor-pointer">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-semibold">{resource.name}</h3>
                                            <p className="text-sm text-base-content/70">{resource.type} • {resource.location}</p>
                                        </div>
                                        <span className={`badge badge-sm ${resource.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`}>
                                            {resource.status}
                                        </span>
                                    </div>
                                    <div className="flex justify-end">
                                        <button 
                                            onClick={() => navigate(`/resources/${resource.id}`)}
                                            className="btn btn-sm btn-primary"
                                        >
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default LecturerDashboard;
