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
  const [showScrollTop, setShowScrollTop] = useState(false);

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

  const [sortBy, setSortBy] = useState('name_asc');

  // Get card styling based on resource type
  const getCardStyle = (type) => {
    return 'bg-base-100 text-base-content';
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

  // Handle scroll to show/hide scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sort resources based on sortBy state
  useEffect(() => {
    const sortResources = (resources) => {
      const sorted = [...resources];
      switch (sortBy) {
        case 'popular':
          sorted.sort((a, b) => (b.shareCount || 0) - (a.shareCount || 0));
          break;
        case 'least_popular':
          sorted.sort((a, b) => (a.shareCount || 0) - (b.shareCount || 0));
          break;
        case 'name_asc':
          sorted.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'name_desc':
          sorted.sort((a, b) => b.name.localeCompare(a.name));
          break;
        default:
          break;
      }
      return sorted;
    };

    setAllFilteredResources(prev => sortResources(prev));
  }, [sortBy]);

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
    <div className="min-h-screen bg-base-200">
      {/* Hero Section with Search */}
      <div className="bg-primary/90 text-primary-content">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">What Resources Are You Looking For?</h1>
            <p className="text-base md:text-lg text-primary-content/80 mb-8">
              Browse and book from available resource types including lecture halls, laboratories, meeting rooms, equipment, offices, and auditoriums.
            </p>

            {/* Search and Type Filter */}
            <div className="flex gap-4 mb-4">
              <input
                type="text"
                placeholder="Search resources by name, location, or amenities..."
                className="input input-bordered flex-1 bg-base-100 text-base-content"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <select
                className="select select-bordered bg-base-100 text-base-content"
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
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="flex flex-wrap gap-3 mb-4">
                <select
                  className="select select-bordered bg-base-100 text-base-content flex-1 min-w-32"
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="OUT_OF_SERVICE">Out of Service</option>
                  <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                </select>

                <input
                  type="text"
                  placeholder="Location..."
                  className="input input-bordered bg-base-100 text-base-content flex-1 min-w-40"
                  value={filters.location}
                  onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                />

                <input
                  type="number"
                  placeholder="Min capacity..."
                  className="input input-bordered bg-base-100 text-base-content flex-1 min-w-32"
                  value={filters.minCapacity}
                  onChange={(e) => setFilters(prev => ({ ...prev, minCapacity: e.target.value }))}
                />

                <input
                  type="text"
                  placeholder="Amenities..."
                  className="input input-bordered bg-base-100 text-base-content flex-1 min-w-40"
                  value={filters.amenities}
                  onChange={(e) => setFilters(prev => ({ ...prev, amenities: e.target.value }))}
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between items-center">
              {/* Total Resources Count */}
              <div className="text-lg font-semibold">
                {allFilteredResources.length} Resources Available
              </div>

              <div className="flex items-center gap-3">
                {/* Sort Dropdown */}
                <select
                  className="select select-bordered select-sm bg-base-100 text-base-content"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="popular">Most Popular</option>
                  <option value="least_popular">Least Popular</option>
                  <option value="name_asc">Name (A-Z)</option>
                  <option value="name_desc">Name (Z-A)</option>
                </select>

                <button
                  className="btn btn-sm btn-outline bg-base-100 text-base-content border-base-content/20"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                >
                  {showAdvancedFilters ? 'Less Filters' : 'More Filters'}
                </button>

                <button
                  className="btn btn-sm btn-outline bg-base-100 text-error border-error/50 hover:bg-error/10"
                  onClick={() => {
                    setSearchTerm('');
                    setFilters({
                      type: '',
                      status: '',
                      location: '',
                      minCapacity: '',
                      amenities: ''
                    });
                    setSortBy('name_asc');
                    setSearching(true);
                    setPagination(prev => ({ ...prev, page: 0 }));
                  }}
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
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
                      <div className="flex items-center gap-2 text-sm mt-2 opacity-60">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{resource.createdAt || resource.updatedAt ? new Date(resource.createdAt || resource.updatedAt).toLocaleDateString() : 'N/A'}</span>
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

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 btn btn-circle btn-primary shadow-lg z-50"
          aria-label="Scroll to top"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default ResourceListPage;
