import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LecturerDashboard = () => {
    const [stats, setStats] = useState({
        myBookings: 0,
        myResources: 0,
        upcomingClasses: 0,
        savedResources: 0
    });

    const [loading, setLoading] = useState(true);
    const [myBookings, setMyBookings] = useState([]);
    const [myTickets, setMyTickets] = useState([]);
    const [resources, setResources] = useState([]);
    const [savedResources, setSavedResources] = useState([]);
    const [noteModalOpen, setNoteModalOpen] = useState(false);
    const [selectedResource, setSelectedResource] = useState(null);
    const [noteText, setNoteText] = useState('');
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
                const bookingsResponse = await axios.get('http://localhost:8080/api/bookings/my-bookings', {
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
                
                // Fetch saved resources
                const savedResourcesResponse = await axios.get('http://localhost:8080/api/saved-resources', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSavedResources(savedResourcesResponse.data || []);
                setStats(prev => ({ ...prev, savedResources: (savedResourcesResponse.data || []).length }));
                
            } catch (error) {
                console.error('Error fetching lecturer dashboard data:', error);
                // Set fallback data if API fails
                setStats({ myBookings: 0, myResources: 0, upcomingClasses: 0, savedResources: 0 });
                setMyBookings([]);
                setMyTickets([]);
                setResources([]);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const handleSaveResource = async (resourceId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://localhost:8080/api/saved-resources/${resourceId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // Refresh saved resources
            const savedResourcesResponse = await axios.get('http://localhost:8080/api/saved-resources', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSavedResources(savedResourcesResponse.data || []);
        } catch (error) {
            console.error('Error saving resource:', error);
        }
    };

    const handleUnsaveResource = async (resourceId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:8080/api/saved-resources/${resourceId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // Refresh saved resources
            const savedResourcesResponse = await axios.get('http://localhost:8080/api/saved-resources', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSavedResources(savedResourcesResponse.data || []);
        } catch (error) {
            console.error('Error unsaving resource:', error);
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
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:8080/api/saved-resources/${selectedResource.resourceId}/note`, 
                { note: noteText },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            // Refresh saved resources
            const savedResourcesResponse = await axios.get('http://localhost:8080/api/saved-resources', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSavedResources(savedResourcesResponse.data || []);
            
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="stat bg-base-100 shadow-sm rounded-lg">
                        <div className="stat-figure text-primary">
                            📅
                        </div>
                        <div className="stat-title">My Bookings</div>
                        <div className="stat-value text-primary">{myBookings.length}</div>
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
                    <div className="stat bg-base-100 shadow-sm rounded-lg">
                        <div className="stat-figure text-secondary">
                            ❤️
                        </div>
                        <div className="stat-title">Saved Resources</div>
                        <div className="stat-value text-secondary">{savedResources.length}</div>
                        <div className="stat-desc">Resources saved for later</div>
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
                                    <div key={b.id} className="border-2 border-base-content/30 rounded-lg p-4 hover:border-success hover:bg-base-200 transition-all cursor-pointer">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="font-semibold">{b.resourceName || 'Unknown Resource'}</h3>
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
                                            <p>{b.date ? new Date(b.date).toLocaleDateString() : 'N/A'}</p>
                                            <p>
                                                {b.startTime} - {b.endTime}
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
                                    <div key={ticket.id} className="border-2 border-base-content/30 rounded-lg p-4 hover:border-error hover:bg-base-200 transition-all cursor-pointer">
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

                {/* Saved Resources */}
                <div className="bg-base-100 shadow-sm rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold flex items-center">
                            ❤️   Saved Resources — Keep notes on your saved resources
                        </h2>
                        <button
                            onClick={() => navigate('/resources')}
                            className="btn btn-sm btn-ghost"
                        >
                            View All Resources
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {savedResources.length === 0 ? (
                            <p className="text-base-content/60 text-center py-4 col-span-full">No saved resources yet</p>
                        ) : (
                            savedResources.slice(0, 6).map((saved) => (
                                <div key={saved.id} className="border-2 border-base-content/30 rounded-lg p-4 hover:border-error hover:bg-base-200 transition-all cursor-pointer">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-semibold">{saved.name || 'Unknown Resource'}</h3>
                                            <p className="text-sm text-base-content/70">{saved.type?.replace('_', ' ') || 'Resource'} • {saved.location || 'Unknown'}</p>
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
                                    <div className="flex justify-between items-center">
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
                                            onClick={() => navigate(`/resources/${saved.resourceId}`)}
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
                                <div key={resource.id} className="border-2 border-base-content/30 rounded-lg p-4 hover:border-primary hover:bg-base-200 transition-all cursor-pointer">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-semibold">{resource.name}</h3>
                                            <p className="text-sm text-base-content/70">{resource.type} • {resource.location}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`badge badge-sm ${resource.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`}>
                                                {resource.status}
                                            </span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    isResourceSaved(resource.id) ? handleUnsaveResource(resource.id) : handleSaveResource(resource.id);
                                                }}
                                                className={`btn btn-sm ${isResourceSaved(resource.id) ? 'btn-secondary' : 'btn-ghost'} transition-all duration-300 hover:scale-125 active:scale-95`}
                                                title={isResourceSaved(resource.id) ? 'Remove from saved' : 'Save resource'}
                                            >
                                                <svg className="w-5 h-5" fill={isResourceSaved(resource.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                                </svg>
                                            </button>
                                        </div>
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
        </div>
    );
};

export default LecturerDashboard;
