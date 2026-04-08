import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const ResourcesList = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const data = await api.getResources();
      setResources(data);
    } catch (error) {
      console.error('Failed to fetch resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = !filterType || resource.type === filterType;
    const matchesStatus = !filterStatus || resource.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getTypeIcon = (type) => {
    const icons = {
      'LECTURE_HALL': '🏛️',
      'LAB': '🔬',
      'MEETING_ROOM': '🏢',
      'EQUIPMENT': '📱',
    };
    return icons[type] || '📚';
  };

  const getStatusBadge = (status) => {
    const badges = {
      'ACTIVE': 'badge-success',
      'OUT_OF_SERVICE': 'badge-error',
      'UNDER_MAINTENANCE': 'badge-warning',
    };
    return badges[status] || 'badge-ghost';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <h1 className="text-3xl font-bold">📚 Resources</h1>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <input
            type="text"
            placeholder="Search resources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input input-bordered flex-1"
          />
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="select select-bordered"
          >
            <option value="">All Types</option>
            <option value="LECTURE_HALL">🏛️ Lecture Halls</option>
            <option value="LAB">🔬 Labs</option>
            <option value="MEETING_ROOM">🏢 Meeting Rooms</option>
            <option value="EQUIPMENT">📱 Equipment</option>
          </select>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="select select-bordered"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">✅ Active</option>
            <option value="OUT_OF_SERVICE">❌ Out of Service</option>
            <option value="UNDER_MAINTENANCE">🔧 Under Maintenance</option>
          </select>
        </div>
      </div>

      {filteredResources.length === 0 ? (
        <div className="alert alert-info">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>No resources found matching your criteria.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((resource) => (
            <div key={resource.id} className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getTypeIcon(resource.type)}</span>
                    <h2 className="card-title text-lg">{resource.name}</h2>
                  </div>
                  <div className={`badge ${getStatusBadge(resource.status)}`}>
                    {resource.status}
                  </div>
                </div>
                
                <div className="space-y-2 mt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm opacity-70">Type:</span>
                    <span className="font-medium">{resource.type.replace('_', ' ')}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm opacity-70">Capacity:</span>
                    <span className="font-medium">{resource.capacity || 'N/A'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm opacity-70">Location:</span>
                    <span className="font-medium text-sm">{resource.location}</span>
                  </div>
                  
                  {resource.description && (
                    <div className="mt-3">
                      <p className="text-sm opacity-70 line-clamp-2">
                        {resource.description}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="card-actions justify-end mt-4">
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => window.location.href = `/bookings/new?resourceId=${resource.id}`}
                  >
                    📅 Book Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResourcesList;
