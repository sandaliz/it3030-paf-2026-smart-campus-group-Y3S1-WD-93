import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalBookings: 0,
        totalTickets: 0,
        pendingBookings: 0,
        openTickets: 0
    });

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await axios.get('http://localhost:8080/api/admin/stats');
                setStats(response.data);
            } catch (error) {
                console.error('Error fetching admin stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    // Mock data for things without models yet
    const pendingBookings = [
        { id: 1, location: 'Lab 101', requester: 'John (Student)', time: '10:00 AM' },
        { id: 2, location: 'Hall A', requester: 'Dr. Smith', time: '02:00 PM' }
    ];

    const openTickets = [
        { id: 101, title: 'Projector broken', location: 'Lab 101', priority: 'High' },
        { id: 102, title: 'AC not working', location: 'Room 203', priority: 'Medium' }
    ];

    const resources = [
        { id: 'R1', name: 'Lecture Hall A-101', capacity: 100, status: 'ACTIVE' },
        { id: 'R2', name: 'Computer Lab 201', capacity: 30, status: 'ACTIVE' },
        { id: 'R3', name: 'Projector X100', capacity: '-', status: 'MAINT' }
    ];

    return (
        <div className="min-h-screen bg-base-200 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center bg-base-100 p-6 rounded-2xl shadow-sm border border-base-300 gap-4">
                    <div>
                        <h1 className="text-4xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                            ADMIN DASHBOARD
                        </h1>
                        <p className="text-base-content/60 font-medium">Complete Campus System Overview</p>
                    </div>
                    <div className="flex gap-2">
                        <button className="btn btn-primary shadow-lg shadow-primary/20">System Report</button>
                        <button className="btn btn-ghost border-base-300">Settings</button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {[
                        { label: 'Total Users', value: stats.totalUsers, color: 'from-blue-500 to-cyan-400' },
                        { label: 'Total Bookings', value: stats.totalBookings, color: 'from-purple-500 to-indigo-400' },
                        { label: 'Total Tickets', value: stats.totalTickets, color: 'from-orange-500 to-yellow-400' },
                        { label: 'Pending Bookings', value: stats.pendingBookings, color: 'from-pink-500 to-rose-400' },
                        { label: 'Open Tickets', value: stats.openTickets, color: 'from-emerald-500 to-teal-400' }
                    ].map((stat, i) => (
                        <div key={i} className={`card bg-gradient-to-br ${stat.color} text-white shadow-xl hover:scale-105 transition-transform cursor-pointer`}>
                            <div className="card-body p-6 items-center text-center">
                                <h2 className="text-sm font-bold uppercase opacity-80">{stat.label}</h2>
                                <p className="text-4xl font-black">{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Pending Bookings */}
                    <div className="card bg-base-100 shadow-xl border border-base-300">
                        <div className="card-body p-0">
                            <div className="p-6 border-b border-base-200 flex justify-between items-center">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <span className="w-2 h-6 bg-primary rounded-full"></span>
                                    📝 PENDING BOOKINGS
                                </h3>
                                <button className="btn btn-sm btn-ghost text-primary uppercase">View All</button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="table table-zebra">
                                    <thead>
                                        <tr>
                                            <th>Location</th>
                                            <th>Requester</th>
                                            <th>Time</th>
                                            <th className="text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendingBookings.map((b) => (
                                            <tr key={b.id} className="hover">
                                                <td className="font-bold">{b.location}</td>
                                                <td>{b.requester}</td>
                                                <td><span className="badge badge-ghost">{b.time}</span></td>
                                                <td className="text-right space-x-2">
                                                    <button className="btn btn-xs btn-success text-white">Approve</button>
                                                    <button className="btn btn-xs btn-error text-white">Reject</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Open Tickets */}
                    <div className="card bg-base-100 shadow-xl border border-base-300">
                        <div className="card-body p-0">
                            <div className="p-6 border-b border-base-200 flex justify-between items-center">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <span className="w-2 h-6 bg-secondary rounded-full"></span>
                                    🎫 OPEN TICKETS
                                </h3>
                                <button className="btn btn-sm btn-ghost text-secondary uppercase">View All</button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="table table-zebra">
                                    <thead>
                                        <tr>
                                            <th>Title</th>
                                            <th>Location</th>
                                            <th>Priority</th>
                                            <th className="text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {openTickets.map((t) => (
                                            <tr key={t.id} className="hover">
                                                <td className="font-bold">{t.title}</td>
                                                <td>{t.location}</td>
                                                <td>
                                                    <span className={`badge ${t.priority === 'High' ? 'badge-error' : 'badge-warning'} text-white`}>
                                                        {t.priority}
                                                    </span>
                                                </td>
                                                <td className="text-right space-x-2">
                                                    <button className="btn btn-xs btn-outline btn-secondary">Assign</button>
                                                    <button className="btn btn-xs btn-ghost">View</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* All Resources */}
                <div className="card bg-base-100 shadow-xl border border-base-300">
                    <div className="card-body p-0">
                        <div className="p-6 border-b border-base-200 flex flex-col md:flex-row justify-between items-center gap-4">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <span className="w-2 h-6 bg-accent rounded-full"></span>
                                🏢 ALL RESOURCES
                            </h3>
                            <div className="flex gap-2">
                                <div className="join">
                                    <button className="btn btn-sm join-item bg-base-200 border-base-300">Filter by Type</button>
                                    <button className="btn btn-sm join-item btn-accent text-white">+ Add New</button>
                                </div>
                            </div>
                        </div>
                        <div className="overflow-x-auto p-4">
                            <div className="space-y-4">
                                {resources.map((r) => (
                                    <div key={r.id} className="flex flex-col md:flex-row justify-between items-center p-4 bg-base-200/50 rounded-xl border border-base-300 hover:border-accent/40 transition-colors gap-4">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center text-accent font-black">
                                                {r.id}
                                            </div>
                                            <div>
                                                <h4 className="font-bold">{r.name}</h4>
                                                <p className="text-xs text-base-content/60 uppercase">Capacity: {r.capacity}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-8">
                                            <span className={`badge ${r.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'} text-white px-4 py-3 font-bold`}>
                                                {r.status}
                                            </span>
                                            <button className="btn btn-circle btn-ghost btn-sm">Edit</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-8">
                    {/* User Management */}
                    <div className="card bg-base-100 shadow-xl border border-base-300">
                        <div className="card-body p-6">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <span className="w-2 h-6 bg-info rounded-full"></span>
                                👥 ALL USERS
                            </h3>
                            <div className="space-y-6">
                                {[
                                    { name: 'John Doe', role: 'STUDENT', email: 'john@example.com' },
                                    { name: 'Dr. Smith', role: 'LECTURER', email: 'smith@example.com' },
                                    { name: 'Sarah', role: 'TECHNICIAN', email: 'sarah@example.com' }
                                ].map((u, i) => (
                                    <div key={i} className="flex items-center justify-between border-b border-base-200 pb-4 last:border-0 last:pb-0">
                                        <div className="flex items-center gap-3">
                                            <div className="avatar placeholder">
                                                <div className="bg-neutral text-neutral-content rounded-full w-10">
                                                    <span>{u.name[0]}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="font-bold leading-none">{u.name}</p>
                                                <p className="text-xs text-base-content/50 mt-1 uppercase font-bold text-info">{u.role}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <button className="btn btn-ghost btn-xs">Edit Role</button>
                                            <button className="btn btn-ghost btn-xs text-error">Disable</button>
                                        </div>
                                    </div>
                                ))}
                                <button className="btn btn-outline btn-block btn-sm mt-4">Load More Users</button>
                            </div>
                        </div>
                    </div>

                    {/* Booking History */}
                    <div className="card bg-base-100 shadow-xl border border-base-300">
                        <div className="card-body p-6">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <span className="w-2 h-6 bg-success rounded-full"></span>
                                📅 ALL BOOKINGS
                            </h3>
                            <div className="space-y-4">
                                {[
                                    { date: 'Apr 15', item: 'Lab 101 - John', status: 'APPROVED' },
                                    { date: 'Apr 16', item: 'Hall A - Dr. Smith', status: 'PENDING' },
                                    { date: 'Apr 17', item: 'Lab 102 - Group', status: 'CANCELLED' }
                                ].map((b, i) => (
                                    <div key={i} className="flex justify-between items-center p-3 bg-base-200 rounded-lg">
                                        <div>
                                            <p className="font-bold text-sm">{b.item}</p>
                                            <p className="text-xs opacity-60">{b.date}</p>
                                        </div>
                                        <span className={`badge badge-sm font-bold ${
                                            b.status === 'APPROVED' ? 'badge-success' : 
                                            b.status === 'PENDING' ? 'badge-warning' : 'badge-ghost'
                                        } text-white`}>
                                            {b.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="card-actions mt-6">
                                <button className="btn btn-primary btn-sm btn-block">Export Bookings</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
