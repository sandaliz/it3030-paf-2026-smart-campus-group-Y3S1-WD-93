import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LecturerDashboard = () => {
    const [stats, setStats] = useState({
        upcomingLectures: 0,
        totalBookings: 0,
        pendingApprovals: 0,
        openTickets: 0
    });

    const [loading, setLoading] = useState(true);
    const [teachingSchedule, setTeachingSchedule] = useState([]);
    const [studentRequests, setStudentRequests] = useState([]);
    const [openTickets, setOpenTickets] = useState([]);
    const [courseStudents, setCourseStudents] = useState([]);
    const [myBookings, setMyBookings] = useState([]);
    const [facilities, setFacilities] = useState([]);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Get user info from AuthContext (same as student dashboard)
                const token = localStorage.getItem('token');
                
                // Fetch stats
                const statsResponse = await axios.get('http://localhost:8080/api/lecturer/stats', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStats(statsResponse.data);
                
                // Fetch teaching schedule
                const scheduleResponse = await axios.get('http://localhost:8080/api/lecturer/schedule', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setTeachingSchedule(scheduleResponse.data || []);
                
                // Fetch student requests
                const requestsResponse = await axios.get('http://localhost:8080/api/lecturer/student-requests', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStudentRequests(requestsResponse.data || []);
                
                // Fetch open tickets
                const ticketsResponse = await axios.get('http://localhost:8080/api/tickets/lecturer-tickets', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setOpenTickets(ticketsResponse.data || []);
                
                // Fetch course students
                const studentsResponse = await axios.get('http://localhost:8080/api/lecturer/course-students', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCourseStudents(studentsResponse.data || []);
                
                // Fetch my bookings
                const bookingsResponse = await axios.get('http://localhost:8080/api/bookings/my-bookings', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setMyBookings(bookingsResponse.data || []);
                
                // Fetch facilities
                const facilitiesResponse = await axios.get('http://localhost:8080/api/facilities');
                setFacilities(facilitiesResponse.data || []);
                
            } catch (error) {
                console.error('Error fetching lecturer dashboard data:', error);
                // Set fallback data if API fails
                setStats({ upcomingLectures: 0, totalBookings: 0, pendingApprovals: 0, openTickets: 0 });
                setTeachingSchedule([]);
                setStudentRequests([]);
                setOpenTickets([]);
                setCourseStudents([]);
                setMyBookings([]);
                setFacilities([]);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const getFacilityIcon = (type) => {
        const icons = {
            'LECTURE_HALL': '🏛️',
            'LAB': '🔬',
            'MEETING_ROOM': '🏢',
            'EQUIPMENT': '📱',
        };
        return icons[type] || '📚';
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
                                LECTURER DASHBOARD
                            </h1>
                            <p className="text-xl font-bold opacity-70">{user?.name || 'User'} — <span className="text-secondary italic">{user?.roles?.[0]?.replace('ROLE_', '') || 'Lecturer'}</span></p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => window.location.href = 'http://localhost:5173/bookings'}
                            className="btn btn-secondary px-8 shadow-lg shadow-secondary/20"
                        >
                            Help Center
                        </button>
                        <button className="btn btn-outline border-base-300">Profile</button>
                    </div>
                </div>

                {/* Stats Section Stats Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Upcoming Lectures', value: stats.upcomingLectures, color: 'from-blue-600 to-indigo-500' },
                        { label: 'Total Bookings', value: stats.totalBookings, color: 'from-accent to-teal-500' },
                        { label: 'Pending Approvals', value: stats.pendingApprovals, color: 'from-warning to-orange-400' },
                        { label: 'Open Tickets', value: stats.openTickets, color: 'from-error to-rose-400' }
                    ].map((stat, i) => (
                        <div key={i} className={`card bg-gradient-to-br ${stat.color} text-white shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer overflow-hidden group`}>
                            <div className="card-body p-8 items-center text-center relative z-10">
                                <h2 className="text-xs font-black tracking-widest uppercase opacity-80">{stat.label}</h2>
                                <p className="text-5xl font-black mt-2">{stat.value}</p>
                            </div>
                            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                        </div>
                    ))}
                </div>

                {/* Schedule Section Schedule Section */}
                <div className="card bg-base-100 shadow-2xl border border-base-300 overflow-hidden">
                    <div className="bg-primary/5 p-8 border-b border-base-200">
                        <h3 className="text-2xl font-black flex items-center gap-4">
                            <span className="w-3 h-8 bg-primary rounded-full"></span>
                            📅 MY TEACHING SCHEDULE
                        </h3>
                        <p className="text-sm opacity-60 mt-2 font-bold uppercase tracking-wider">Today — Monday, April 15th 2024</p>
                    </div>
                    <div className="overflow-x-auto p-4">
                        <table className="table table-lg w-full">
                            <thead>
                                <tr className="text-primary opacity-70">
                                    <th>Time</th>
                                    <th>Course Name</th>
                                    <th>Location</th>
                                    <th>Attendance</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {teachingSchedule.length > 0 ? (
                                    teachingSchedule.map((item, i) => (
                                        <tr key={i} className="hover:bg-base-200/50 transition-colors">
                                            <td className="font-black text-lg">{item.time}</td>
                                            <td className="font-bold text-primary">{item.course}</td>
                                            <td><span className="badge badge-outline border-base-300 p-3 font-bold">{item.room}</span></td>
                                            <td className="font-mono">{item.attendance}</td>
                                            <td>
                                                <div className="flex items-center gap-2 text-success font-black">
                                                    <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                                                    {item.status}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="text-center py-8 opacity-50">
                                            <p className="font-bold">No teaching schedule found</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Available Resources Section Available Resources Section */}
                <div className="card bg-base-100 shadow-2xl border border-base-300 overflow-hidden">
                    <div className="p-8 border-b border-base-200 bg-accent/5 flex justify-between items-center">
                        <h3 className="text-2xl font-black flex items-center gap-4">
                            <span className="w-3 h-8 bg-accent rounded-full"></span>
                            🏢 AVAILABLE FACILITIES & RESOURCES
                        </h3>
                        <button
                            onClick={() => window.location.href = 'http://localhost:5173/bookings'}
                            className="btn btn-sm btn-accent text-white"
                        >
                            Book a Resource
                        </button>
                    </div>
                    <div className="card-body p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {facilities.length > 0 ? facilities.slice(0, 8).map((facility, i) => (
                                <div key={i} className="card bg-base-200 border border-base-300 hover:shadow-2xl hover:border-accent/50 transition-all p-6 text-center group">
                                    <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                                        {getFacilityIcon(facility.type)}
                                    </div>
                                    <h4 className="text-lg font-black">{facility.name}</h4>
                                    <p className="text-xs font-bold opacity-60 uppercase mt-1">{facility.type?.replace('_', ' ')}</p>
                                    <div className="divider my-3"></div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="opacity-60">Capacity:</span>
                                            <span className="font-bold">{facility.capacity || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="opacity-60">Status:</span>
                                            <span className={`badge badge-xs ${facility.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`}>
                                                {facility.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="col-span-full text-center py-8 opacity-50">
                                    <p className="font-bold">No facilities found</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Student Requests Student Requests */}
                    <div className="card bg-base-100 shadow-xl border border-base-300">
                        <div className="p-8 border-b border-base-200 flex justify-between items-center">
                            <h3 className="text-xl font-black flex items-center gap-3">
                                <span className="w-2 h-6 bg-accent rounded-full"></span>
                                📝 PENDING STUDENT REQUESTS
                            </h3>
                            <span className="badge badge-accent badge-md text-white font-bold">{studentRequests.length} NEW</span>
                        </div>
                        <div className="card-body p-6 space-y-4">
                            {studentRequests.length > 0 ? (
                                studentRequests.map((req) => (
                                    <div key={req.id} className="p-5 bg-base-200 rounded-2xl border border-base-300 hover:border-accent/50 transition-all group">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <p className="text-xs font-black text-accent uppercase tracking-tighter mb-1">{req.course}</p>
                                                <h4 className="font-bold text-lg">{req.request}</h4>
                                                <p className="text-sm opacity-60">Student: {req.student}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 justify-end">
                                            <button className="btn btn-sm btn-success text-white px-6">Approve</button>
                                            <button className="btn btn-sm btn-outline border-error text-error hover:bg-error hover:text-white">Reject</button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 opacity-50">
                                    <p className="font-bold">No student requests found</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Open Tickets Open Tickets */}
                    <div className="card bg-base-100 shadow-xl border border-base-300">
                        <div className="p-8 border-b border-base-200 flex justify-between items-center">
                            <h3 className="text-xl font-black flex items-center gap-3 text-secondary">
                                <span className="w-2 h-6 bg-secondary rounded-full"></span>
                                🎫 MY OPEN TICKETS
                            </h3>
                            <button className="btn btn-sm btn-ghost text-secondary">VIEW HISTORY</button>
                        </div>
                        <div className="card-body p-6 space-y-4">
                            {openTickets.length > 0 ? (
                                openTickets.map((ticket) => (
                                    <div key={ticket.id} className="flex gap-4 p-5 bg-base-200 rounded-2xl border border-base-300 items-center justify-between">
                                        <div>
                                            <h4 className="font-bold">{ticket.title}</h4>
                                            <p className="text-xs opacity-60 uppercase font-black">{ticket.location}</p>
                                        </div>
                                        <span className={`badge font-black p-3 text-xs ${ticket.status === 'IN_PROGRESS' ? 'badge-warning' : 'badge-primary'} text-white`}>
                                            {ticket.status}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 opacity-50">
                                    <p className="font-bold">No open tickets found</p>
                                </div>
                            )}
                            <button 
                                onClick={() => window.location.href = 'http://localhost:5173/tickets'}
                                className="btn btn-secondary btn-block btn-outline mt-4"
                            >
                                Raise New Support Ticket
                            </button>
                        </div>
                    </div>
                </div>

                {/* Course Students Section Course Students Section */}
                <div className="card bg-base-100 shadow-xl border border-base-300 overflow-hidden">
                    <div className="p-8 border-b border-base-200 bg-info/5">
                        <h3 className="text-2xl font-black flex items-center gap-4">
                             <span className="w-3 h-8 bg-info rounded-full"></span>
                             👥 MY COURSE STUDENTS
                        </h3>
                        <p className="text-sm opacity-60 mt-1 font-bold">CS301 - Web Development (30 active students)</p>
                    </div>
                    <div className="overflow-x-auto p-4">
                        <table className="table table-zebra table-lg">
                            <thead>
                                <tr>
                                    <th>Student Name</th>
                                    <th>Account Status</th>
                                    <th>Total Bookings</th>
                                    <th className="text-right">Management</th>
                                </tr>
                            </thead>
                            <tbody>
                                {courseStudents.length > 0 ? (
                                    courseStudents.map((s, i) => (
                                        <tr key={i} className="hover">
                                            <td className="font-bold flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-info/20 flex items-center justify-center text-info font-black">
                                                    {s.name ? s.name[0] : 'U'}
                                                </div>
                                                {s.name}
                                            </td>
                                            <td>
                                                <span className={`badge font-bold p-3 text-white ${s.status === 'Active' ? 'badge-success' : 'badge-error'}`}>
                                                    {s.status}
                                                </span>
                                            </td>
                                            <td className="font-mono font-bold text-center">{s.bookings}</td>
                                            <td className="text-right">
                                                <button className={`btn btn-sm ${s.status === 'Active' ? 'btn-ghost text-info' : 'btn-info text-white'} px-6`}>
                                                    {s.status === 'Active' ? 'View Details' : 'Contact'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="text-center py-8 opacity-50">
                                            <p className="font-bold">No course students found</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Bookings Section Bookings Section */}
                <div className="card bg-base-100 shadow-xl border border-base-300">
                    <div className="p-8 border-b border-base-200 flex justify-between items-center bg-success/5">
                        <h3 className="text-2xl font-black flex items-center gap-4">
                            <span className="w-3 h-8 bg-success rounded-full"></span>
                            📅 MY PERSONAL BOOKINGS
                        </h3>
                        <div className="flex gap-2">
                            <button className="btn btn-sm btn-success text-white">Export Schedule</button>
                            <button className="btn btn-sm btn-ghost">View Calendar</button>
                        </div>
                    </div>
                    <div className="card-body p-6 space-y-4">
                        {myBookings.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {myBookings.map((b, i) => (
                                    <div key={i} className="p-6 bg-base-200 rounded-3xl border border-base-300 flex flex-col justify-between hover:border-success/50 transition-all group">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h4 className="font-black text-lg text-primary">{b.resource || b.facilityName}</h4>
                                                <p className="text-sm font-bold opacity-60 uppercase">{b.purpose}</p>
                                            </div>
                                            <span className={`badge font-black text-xs p-3 text-white ${b.status === 'APPROVED' ? 'badge-success' : 'badge-warning'}`}>
                                                {b.status}
                                            </span>
                                        </div>
                                        <div className="pt-4 border-t border-base-300 mt-4 flex items-center justify-between">
                                            <p className="text-xs font-mono font-bold">{b.time || `${b.startTime} - ${b.endTime}`}</p>
                                            <p className="text-xs bg-base-100 px-3 py-1 rounded-full border border-base-300">{b.date}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 opacity-50">
                                <p className="font-bold">No bookings found</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default LecturerDashboard;
