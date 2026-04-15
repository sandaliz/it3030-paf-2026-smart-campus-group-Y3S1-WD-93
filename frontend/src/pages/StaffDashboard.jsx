import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StaffDashboard = () => {
    const [stats, setStats] = useState({
        equipmentItems: 156,
        activeBookings: 23,
        pendingRequests: 8,
        maintenanceTickets: 5
    });

    const [loading, setLoading] = useState(true);

    // Mock data for things without models yet
    const inventory = [
        { category: 'Projectors', available: 12, total: 15, icon: '📽️' },
        { category: 'Laptops', available: 25, total: 30, icon: '💻' },
        { category: 'Cameras', available: 8, total: 10, icon: '📷' }
    ];

    const deptBookings = [
        { id: 1, resource: 'Conference Room', date: 'Apr 15', time: '10 AM - 12 PM', details: 'Equipment: Projector x2', status: 'ACTIVE' },
        { id: 2, resource: 'Lab 201', date: 'Apr 16', time: '2 PM - 5 PM', details: 'Status: APPROVED', status: 'APPROVED' }
    ];

    const maintenanceRequests = [
        { id: 101, title: 'AC not working - Room 203', status: 'PENDING', priority: 'High' },
        { id: 102, title: 'Lights flickering - Lab 105', status: 'IN_PROGRESS', priority: 'Medium' }
    ];

    const analytics = [
        { name: 'Projectors', usage: 85 },
        { name: 'Laptops', usage: 72 },
        { name: 'Cameras', usage: 45 }
    ];

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await axios.get('http://localhost:8080/api/staff/stats');
                setStats(response.data);
            } catch (error) {
                console.error('Error fetching staff stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

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
                        <button className="btn btn-warning text-white px-8 shadow-lg shadow-warning/20">Add Equipment</button>
                        <button className="btn btn-outline border-base-300">Inventory Logs</button>
                    </div>
                </div>

                {/* Stats Section Stats Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Equipment Items', value: stats.equipmentItems, color: 'from-orange-600 to-yellow-500' },
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

                {/* Equipment Inventory Equipment Inventory */}
                <div className="card bg-base-100 shadow-2xl border border-base-300 overflow-hidden">
                    <div className="p-8 border-b border-base-200 bg-warning/5 flex flex-col md:flex-row justify-between items-center gap-6">
                        <h3 className="text-2xl font-black flex items-center gap-4 uppercase tracking-tighter">
                            <span className="w-3 h-8 bg-warning rounded-full"></span>
                            🔧 EQUIPMENT INVENTORY
                        </h3>
                        <div className="flex gap-2">
                            <select className="select select-bordered select-sm rounded-full">
                                <option disabled selected>Category: All</option>
                                <option>Projectors</option>
                                <option>Laptops</option>
                                <option>Cameras</option>
                            </select>
                            <input type="text" placeholder="🔍 Search..." className="input input-bordered input-sm rounded-full w-48" />
                        </div>
                    </div>
                    <div className="card-body p-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {inventory.map((item, i) => (
                                <div key={i} className="card bg-base-200 border border-base-300 hover:shadow-2xl hover:border-warning/40 transition-all p-6 text-center group">
                                    <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">{item.icon}</div>
                                    <h4 className="text-2xl font-black">{item.category}</h4>
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
                                    <button className="btn btn-sm btn-ghost btn-block mt-6 border-base-300">View Category →</button>
                                </div>
                            ))}
                        </div>
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

                {/* Resource Usage Analytics Resource Usage Analytics */}
                <div className="card bg-base-100 shadow-2xl border border-base-300 overflow-hidden">
                    <div className="p-8 border-b border-base-200 bg-indigo-500/5 flex justify-between items-center">
                        <h3 className="text-2xl font-black flex items-center gap-4">
                             <span className="w-3 h-8 bg-indigo-500 rounded-full"></span>
                             📊 RESOURCE USAGE ANALYTICS
                        </h3>
                        <div className="flex gap-2">
                             <button className="btn btn-sm btn-ghost border-base-300">Generate Report</button>
                             <button className="btn btn-sm btn-primary">Export Data</button>
                        </div>
                    </div>
                    <div className="card-body p-8 space-y-8">
                        <div>
                            <p className="text-sm font-black opacity-60 uppercase mb-4 tracking-widest">Most Used Equipment This Month</p>
                            <div className="space-y-6">
                                {analytics.map((a, i) => (
                                    <div key={i} className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold">{a.name}</span>
                                            <span className="font-black text-indigo-600">{a.usage}%</span>
                                        </div>
                                        <div className="w-full bg-base-200 rounded-full h-3 overflow-hidden border border-base-300">
                                            <div className="bg-indigo-500 h-full rounded-full transition-all duration-1000" style={{ width: `${a.usage}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default StaffDashboard;
