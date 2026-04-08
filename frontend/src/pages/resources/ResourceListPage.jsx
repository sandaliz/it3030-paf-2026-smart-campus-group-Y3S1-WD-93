import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { resourceService } from '../../services/resourceService';
import { CardSkeleton, PageLoader } from '../../components/ui/LoadingSkeleton';

const ResourceListPage = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // State for filters
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    location: '',
    minCapacity: '',
    amenities: ''
  });

  // Get card styling based on resource type
  const getCardStyle = (type) => {
    switch (type) {
      case 'LECTURE_HALL':
        return 'bg-primary text-primary-content';
      case 'LAB':
        return 'bg-secondary text-secondary-content';
      case 'MEETING_ROOM':
        return 'bg-accent text-accent-content';
      case 'EQUIPMENT':
        return 'bg-warning text-warning-content';
      case 'OFFICE':
        return 'bg-info text-info-content';
      case 'AUDITORIUM':
        return 'bg-error text-error-content';
      default:
        return 'bg-neutral text-neutral-content';
    }
  };

  // Get icon for resource type
  const getResourceIcon = (type) => {
    switch (type) {
      case 'LECTURE_HALL':
        return '🏛️';
      case 'LAB':
        return '🔬';
      case 'MEETING_ROOM':
        return '🤝';
      case 'EQUIPMENT':
        return '📱';
      case 'OFFICE':
        return '🏢';
      case 'AUDITORIUM':
        return '🎭';
      default:
        return '📦';
    }
  };

  // Get status badge styling
  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'badge-success';
      case 'OUT_OF_SERVICE':
        return 'badge-error';
      case 'UNDER_MAINTENANCE':
        return 'badge-warning';
      default:
        return 'badge-neutral';
    }
  };

  useEffect(() => {
    const fetchResources = async () => {
      console.log('Fetching resources with searchTerm:', searchTerm);
      console.log('Filters:', filters);
      try {
        let data;
        
        // Simple approach: Get all resources and filter locally for better control
        const allResources = await resourceService.getAllResources();
        console.log('All resources fetched:', allResources.length);
        
        // Filter resources locally
        data = allResources.filter(resource => {
          // Name search (case-insensitive)
          if (searchTerm.trim() !== '') {
            const searchLower = searchTerm.toLowerCase();
            const nameMatch = resource.name && resource.name.toLowerCase().includes(searchLower);
            const locationMatch = resource.location && resource.location.toLowerCase().includes(searchLower);
            const amenitiesMatch = resource.amenities && typeof resource.amenities === 'string' && resource.amenities.toLowerCase().includes(searchLower);
            
            if (!nameMatch && !locationMatch && !amenitiesMatch) {
              return false;
            }
          }
          
          // Type filter
          if (filters.type && resource.type !== filters.type) {
            return false;
          }
          
          // Status filter
          if (filters.status && resource.status !== filters.status) {
            return false;
          }
          
          // Location filter
          if (filters.location && !resource.location.toLowerCase().includes(filters.location.toLowerCase())) {
            return false;
          }
          
          // Min capacity filter
          if (filters.minCapacity && resource.capacity < parseInt(filters.minCapacity)) {
            return false;
          }
          
          // Amenities filter
          if (filters.amenities && resource.amenities && typeof resource.amenities === 'string' && 
              !resource.amenities.toLowerCase().includes(filters.amenities.toLowerCase())) {
            return false;
          }
          
          return true;
        });
        
        console.log('Filtered resources:', data.length);
        setResources(data);
        setError(null);
      } catch (err) {
        setError('Failed to load resources');
        console.error('Error fetching resources:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchResources();
  }, [searchTerm, filters]);

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Campus Resources</h1>
      
      {/* Search and Filters */}
      <div className="card bg-base-100 shadow-lg mb-6">
        <div className="card-body">
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            {/* Search Bar */}
            <div className="form-control flex-1">
              <label className="label">
                <span className="label-text">Search Resources</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search by name..."
                  className="input input-bordered flex-1"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                
                {/* Type Filter - always visible */}
                <select 
                  className="select select-bordered w-40"
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                >
                  <option value="">All Types</option>
                  <option value="LECTURE_HALL">Lecture Hall</option>
                  <option value="LAB">Lab</option>
                  <option value="MEETING_ROOM">Meeting Room</option>
                  <option value="EQUIPMENT">Equipment</option>
                  <option value="OFFICE">Office</option>
                  <option value="AUDITORIUM">Auditorium</option>
                </select>
                
                {/* Advanced Filters Button */}
                <button 
                  className="btn btn-outline"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                >
                  {showAdvancedFilters ? 'Hide' : 'Advanced'} Filters
                </button>
              </div>
            </div>
          </div>

          {/* Advanced Filters - Collapsible */}
          {showAdvancedFilters && (
            <div className="card bg-base-200/50 p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Status Filter */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Status</span>
                  </label>
                  <select 
                    className="select select-bordered"
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="">All Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="OUT_OF_SERVICE">Out of Service</option>
                    <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                  </select>
                </div>

                {/* Location Filter */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Location</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Filter by location..."
                    className="input input-bordered"
                    value={filters.location}
                    onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>

                {/* Min Capacity Filter */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Min Capacity</span>
                  </label>
                  <input
                    type="number"
                    placeholder="Min capacity..."
                    className="input input-bordered"
                    value={filters.minCapacity}
                    onChange={(e) => setFilters(prev => ({ ...prev, minCapacity: e.target.value }))}
                  />
                </div>

                {/* Amenities Filter */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Amenities</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Filter by amenities..."
                    className="input input-bordered"
                    value={filters.amenities}
                    onChange={(e) => setFilters(prev => ({ ...prev, amenities: e.target.value }))}
                  />
                </div>
              </div>

              {/* Apply and Clear buttons */}
              <div className="flex gap-2 mt-4">
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowAdvancedFilters(false)}
                >
                  Apply Filters
                </button>
                <button 
                  className="btn btn-outline"
                  onClick={() => {
                    setSearchTerm('');
                    setFilters({
                      type: '',
                      status: '',
                      location: '',
                      minCapacity: '',
                      amenities: ''
                    });
                  }}
                >
                  Clear All
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {error && (
        <div className="alert alert-error mb-6">
          <svg className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.length === 0 && loading ? (
          // Show 6 skeleton cards while loading
          Array.from({ length: 6 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))
        ) : (
          resources.map((resource) => (
            <div key={resource.id} className={`card shadow-lg ${getCardStyle(resource.type)}`}>
              <div className="card-body">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl opacity-70">{getResourceIcon(resource.type)}</span>
                  <div className="flex-1">
                    <h2 className="card-title">{resource.name}</h2>
                    <div className={`badge ${getStatusBadge(resource.status)} badge-sm`}>
                      {resource.status.replace('_', ' ')}
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm opacity-70 capitalize">{resource.type.replace('_', ' ').toLowerCase()}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{resource.location}</span>
                    <span className="ml-auto">Capacity: {resource.capacity}</span>
                  </div>
                </div>
                
                <div className="card-actions justify-end">
                  <Link 
                    to={`/resources/${resource.id}`} 
                    className="btn btn-sm"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ResourceListPage;
