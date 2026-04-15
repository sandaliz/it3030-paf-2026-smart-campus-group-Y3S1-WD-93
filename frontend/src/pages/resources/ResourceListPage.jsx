import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { resourceService } from '../../services/resourceService';
import { CardSkeleton, PageLoader } from '../../components/ui/LoadingSkeleton';
import { useAuth } from '../../context/AuthContext';
import lectureHallImage from '../../assets/images/lecture-hall.jpg';
import laboratoryImage from '../../assets/images/laboratory.jpg';
import meetingRoomImage from '../../assets/images/meeting-room.jpg';
import equipmentImage from '../../assets/images/equipment.jpg';
import officeImage from '../../assets/images/office.jpg';
import auditoriumImage from '../../assets/images/auditorium.jpg';

const ResourceListPage = () => {
  const { user, hasRole, hasAnyRole } = useAuth();
  const [allFilteredResources, setAllFilteredResources] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [debouncedLocation, setDebouncedLocation] = useState('');
  const [debouncedMinCapacity, setDebouncedMinCapacity] = useState('');
  const [debouncedAmenities, setDebouncedAmenities] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [pagination, setPagination] = useState({
    page: 0,
    size: 12,
    totalElements: 0,
    totalPages: 0
  });

  // Check if user can book resources
  const canBookResources = hasAnyRole(['STUDENT', 'LECTURER', 'STAFF', 'ADMIN']);
  
  // Check if resource is currently available
  const isResourceAvailable = (resource) => {
    if (resource.status !== 'ACTIVE') {
      return false;
    }
    
    if (!resource.availabilityWindows || resource.availabilityWindows.length === 0) {
      return true; // If no availability windows set, assume always available
    }
    
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
    const currentTime = now.toTimeString('en-US', { hour12: false }).slice(0, 5); // HH:MM format
    
    return resource.availabilityWindows.some(window => {
      return window.dayOfWeek === currentDay && 
             window.available === true &&
             currentTime >= window.startTime && 
             currentTime <= window.endTime;
    });
  };
  
  // Handle booking
  const handleBookResource = (resource) => {
    if (!isResourceAvailable(resource)) {
      alert('This resource is not available at the current time. Please check the availability schedule.');
      return;
    }
    
    // For now, just navigate to resource details with booking intent
    // In a full implementation, this would open a booking modal/form
    window.location.href = `/resources/${resource.id}?booking=true`;
  };

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

  // Resource type information with descriptions and images
  const resourceTypeInfo = {
    LECTURE_HALL: {
      name: 'Lecture Halls',
      description: 'Spacious venues equipped with modern presentation technology for lectures, seminars, and academic events. Perfect for large group learning sessions.',
      image: lectureHallImage
    },
    LAB: {
      name: 'Laboratories',
      description: 'Fully equipped science and computer labs with specialized equipment for hands-on learning and research activities.',
      image: laboratoryImage
    },
    MEETING_ROOM: {
      name: 'Meeting Rooms',
      description: 'Professional meeting spaces with video conferencing capabilities for team collaborations, discussions, and presentations.',
      image: meetingRoomImage
    },
    EQUIPMENT: {
      name: 'Equipment',
      description: 'A wide range of audio-visual equipment, projectors, computers, and other devices available for borrowing and use.',
      image: equipmentImage
    },
    OFFICE: {
      name: 'Offices',
      description: 'Private office spaces and administrative areas for faculty, staff, and student organization meetings.',
      image: officeImage
    },
    AUDITORIUM: {
      name: 'Auditoriums',
      description: 'Grand performance and event spaces with excellent acoustics and seating for concerts, ceremonies, and large-scale events.',
      image: auditoriumImage
    }
  };

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms delay for faster response

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Debounce location filter
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedLocation(filters.location);
    }, 300); // 300ms delay for faster response

    return () => clearTimeout(timer);
  }, [filters.location]);

  // Debounce min capacity filter
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedMinCapacity(filters.minCapacity);
    }, 300); // 300ms delay for faster response

    return () => clearTimeout(timer);
  }, [filters.minCapacity]);

  // Debounce amenities filter
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedAmenities(filters.amenities);
    }, 300); // 300ms delay for faster response

    return () => clearTimeout(timer);
  }, [filters.amenities]);

  // Reset page when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 0 }));
  }, [debouncedSearchTerm, filters.type, filters.status, debouncedLocation, debouncedMinCapacity, debouncedAmenities]);

  // Fetch and filter resources (only when filters change, not page change)
  useEffect(() => {
    const fetchResources = async () => {
      // Use searching state for filter operations, loading for initial load
      const hasFilters = debouncedSearchTerm.trim() !== '' || filters.type !== '' || filters.status !== '' || debouncedLocation !== '' || debouncedMinCapacity !== '' || debouncedAmenities !== '';
      if (hasFilters) {
        setSearching(true);
      } else {
        setLoading(true);
      }
      
      try {
        // Get all resources from API
        const allResources = await resourceService.getAllResources();
        
        // Filter resources locally
        const filteredData = allResources.filter(resource => {
          // Name search (case-insensitive)
          if (debouncedSearchTerm.trim() !== '') {
            const searchLower = debouncedSearchTerm.toLowerCase();
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
          if (debouncedLocation && !resource.location.toLowerCase().includes(debouncedLocation.toLowerCase())) {
            return false;
          }
          
          // Min capacity filter
          if (debouncedMinCapacity && resource.capacity < parseInt(debouncedMinCapacity)) {
            return false;
          }
          
          // Amenities filter
          if (debouncedAmenities && resource.amenities && typeof resource.amenities === 'string' && 
              !resource.amenities.toLowerCase().includes(debouncedAmenities.toLowerCase())) {
            return false;
          }
          
          return true;
        });
        
        setAllFilteredResources(filteredData);
        setError(null);
      } catch (err) {
        setError('Failed to load resources');
      } finally {
        setLoading(false);
        setSearching(false);
      }
    }

    fetchResources();
  }, [debouncedSearchTerm, filters.type, filters.status, debouncedLocation, debouncedMinCapacity, debouncedAmenities]);

  // Paginate filtered resources (instant, no API call)
  useEffect(() => {
    const totalElements = allFilteredResources.length;
    const totalPages = Math.ceil(totalElements / pagination.size);
    const startIndex = pagination.page * pagination.size;
    const paginatedData = allFilteredResources.slice(startIndex, startIndex + pagination.size);
    
    setResources(paginatedData);
    setPagination(prev => ({
      ...prev,
      totalElements,
      totalPages
    }));
  }, [allFilteredResources, pagination.page]);

  // Group resources by type for display
  const groupResourcesByType = (resourceList) => {
    const grouped = {};
    Object.keys(resourceTypeInfo).forEach(type => {
      grouped[type] = resourceList.filter(r => r.type === type);
    });
    return grouped;
  };

  const groupedResources = groupResourcesByType(allFilteredResources);

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
              <label className="label mb-2">
                <span className="label-text">Search Resources</span>
              </label>
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="Search by name..."
                  className="input input-bordered flex-1"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                
                {/* Clear Filters Button */}
                {(searchTerm.trim() !== '' || filters.type !== '' || filters.status !== '' || filters.location !== '' || filters.minCapacity !== '' || filters.amenities !== '') && (
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
                      setSearching(true);
                      setPagination(prev => ({ ...prev, page: 0 }));
                    }}
                  >
                    Clear
                  </button>
                )}
                
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

              {/* Clear button */}
              <div className="flex gap-2 mt-4">
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
                    setSearching(true);
                    setPagination(prev => ({ ...prev, page: 0 }));
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

      {Object.keys(groupedResources).map((type) => {
        const typeInfo = resourceTypeInfo[type];
        const typeResources = groupedResources[type];
        
        if (typeResources.length === 0) return null;
        
        return (
          <div key={type} className="mb-12">
            {/* Type Header with Image */}
            <div className="relative h-64 rounded-xl overflow-hidden mb-6 shadow-lg">
              <img 
                src={typeInfo.image} 
                alt={typeInfo.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-4xl">{getResourceIcon(type)}</span>
                  <h2 className="text-4xl font-bold text-white">{typeInfo.name}</h2>
                </div>
                <p className="text-white/90 text-lg">{typeInfo.description}</p>
                <p className="text-white/70 text-sm mt-2">{typeResources.length} available</p>
              </div>
            </div>

            {/* Resource Cards for this type */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
              {searching && (
                <div className="absolute inset-0 bg-base-100/80 z-10 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                    <span className="text-sm text-base-content/70">Searching...</span>
                  </div>
                </div>
              )}
              {typeResources.map((resource) => (
                <div key={resource.id} className={`card shadow-lg ${getCardStyle(resource.type)}`}>
                  <div className="card-body">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl opacity-70">{getResourceIcon(resource.type)}</span>
                      <div className="flex-1">
                        <h3 className="card-title">{resource.name}</h3>
                        <div className={`badge ${getStatusBadge(resource.status)} badge-sm`}>
                          {resource.status.replace('_', ' ')}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{resource.location}</span>
                        <span className="ml-auto">Capacity: {resource.capacity}</span>
                      </div>
                    </div>
                    
                    <div className="card-actions justify-end gap-2">
                      <Link 
                        to={`/resources/${resource.id}`} 
                        className="btn btn-sm btn-outline"
                      >
                        View Details
                      </Link>
                      {canBookResources && resource.status === 'ACTIVE' && (
                        <button 
                          onClick={() => handleBookResource(resource)}
                          className="btn btn-sm btn-primary"
                        >
                          Book Now
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* No results message */}
      {Object.values(groupedResources).every(arr => arr.length === 0) && !loading && (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-base-content/30 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-base-content/60 mb-4">No resources found</p>
          {(debouncedSearchTerm.trim() !== '' || filters.type !== '' || filters.status !== '' || debouncedLocation !== '' || debouncedMinCapacity !== '' || debouncedAmenities !== '') && (
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
                setSearching(true);
                setPagination(prev => ({ ...prev, page: 0 }));
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ResourceListPage;
