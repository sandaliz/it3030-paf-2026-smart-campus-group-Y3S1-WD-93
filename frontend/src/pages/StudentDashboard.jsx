import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';

const StudentDashboard = () => {
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
    const { user } = useAuth();
    const navigate = useNavigate();
    const { 
        userBookings, 
        userTickets, 
        markAsRead, 
        markAllAsRead, 
        isNotificationRead,
        getTotalUnreadCount 
    } = useNotifications();


    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Get user info from AuthContext (same as profile component)
                const token = localStorage.getItem('token');

                // Fetch stats
                const statsResponse = await axios.get('http://localhost:8080/api/student/stats', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStats(statsResponse.data);

                // Fetch upcoming bookings
                const bookingsResponse = await axios.get('http://localhost:8080/api/bookings/my-bookings', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUpcomingBookings(bookingsResponse.data || []);

                
                // Fetch facilities
                const facilitiesResponse = await axios.get('http://localhost:8080/api/facilities');
                setFacilities(facilitiesResponse.data || []);

                // Fetch my tickets
                const ticketsResponse = await axios.get('http://localhost:8080/api/tickets/my-tickets', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setMyTickets(ticketsResponse.data || []);

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                // Set fallback data if API fails
                setStats({ activeBookings: 0, pendingBookings: 0, approvedTickets: 0, openTickets: 0 });
                setUpcomingBookings([]);
                setFacilities([]);
                setMyTickets([]);
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
                        <button className="btn btn-secondary px-8 shadow-lg shadow-secondary/20">Help Center</button>
                        <button className="btn btn-outline border-base-300">Profile</button>
                    </div>
                </div>

                {/* Activity Section Activity Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Active Bookings', value: stats.activeBookings, color: 'from-blue-600 to-cyan-500' },
                        { label: 'Pending Bookings', value: stats.pendingBookings, color: 'from-orange-500 to-yellow-400' },
                        { label: 'Approved Tickets', value: stats.approvedTickets, color: 'from-emerald-500 to-teal-400' },
                        { label: 'My Open Tickets', value: stats.openTickets, color: 'from-purple-600 to-pink-500' }
                    ].map((stat, i) => (
                        <div key={i} className={`card bg-gradient-to-br ${stat.color} text-white shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden group`}>
                            <div className="card-body p-8 items-center text-center relative z-10">
                                <h2 className="text-xs font-black tracking-widest uppercase opacity-80">{stat.label}</h2>
                                <p className="text-5xl font-black mt-2">{stat.value}</p>
                            </div>
                            <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                        </div>
                    ))}
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
                                            className={`flex gap-4 p-5 bg-base-200 rounded-2xl border border-base-300 items-start hover:bg-base-100 transition-colors cursor-pointer ${
                                                isNotificationRead(n.id) ? 'opacity-60' : ''
                                            }`}
                                            onClick={() => markAsRead(n.id)}
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
                                        onClick={() => window.location.href = 'http://localhost:5173/bookings'}
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

                {/* Browse Facilities Browse Facilities */}
                <div className="card bg-base-100 shadow-xl border border-base-300 overflow-hidden">
                    <div className="p-8 border-b border-base-200 bg-info/5 flex flex-col md:flex-row justify-between items-center gap-6">
                        <h3 className="text-xl font-black flex items-center gap-4">
                             <span className="w-2 h-8 bg-info rounded-full"></span>
                             🏢 BROWSE FACILITIES
                        </h3>
                        <div className="flex flex-wrap gap-3 w-full md:w-auto">
                            <input type="text" placeholder="🔍 Search resources..." className="input input-bordered input-sm rounded-full flex-1 md:w-64" />
                            <select className="select select-bordered select-sm rounded-full">
                                <option disabled selected>Filter Type</option>
                                <option>All</option>
                                <option>Labs</option>
                                <option>Halls</option>
                                <option>Equip</option>
                            </select>
                        </div>
                    </div>
                    <div className="card-body p-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {facilities.length > 0 ? (
                                facilities.map((f, i) => (
                                    <div key={i} className="card bg-base-200 border border-base-300 hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden">
                                         <div className="h-2 bg-info"></div>
                                         <div className="card-body p-6">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="text-xl font-black text-info">{f.name}</h4>
                                                    <p className="text-xs font-bold opacity-50 uppercase tracking-widest">{f.type}</p>
                                                </div>
                                                <span className={`badge font-black text-[10px] ${f.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'} text-white`}>
                                                    {f.status}
                                                </span>
                                            </div>
                                            <p className="text-sm font-bold opacity-70 mt-4 mb-6">Capacity: <span className="text-info">{f.capacity}</span> students</p>
                                            <button 
                                                onClick={() => window.location.href = 'http://localhost:5173/bookings'}
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
                                                <p className="text-neutral mb-1">#{t.id}</p>
                                                <p className="text-base-content/70">{t.title}</p>
                                            </td>
                                            <td>
                                                <span className={`badge font-black text-[10px] p-3 text-white ${t.status === 'OPEN' ? 'badge-primary' : 'badge-success'}`}>
                                                    {t.status}
                                                </span>
                                            </td>
                                            <td className="text-right">
                                                <button className="btn btn-ghost btn-sm text-info font-black">View Details</button>
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

            </div>
        </div>
    );
};

export default StudentDashboard;
