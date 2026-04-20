import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { resourceService } from '../../services/resourceService';
import ResourceCard from '../../components/cards/ResourceCard';
import { DetailSkeleton, PageLoader } from '../../components/ui/LoadingSkeleton';
import Toast from '../../components/ui/Toast';
import ShareModal from '../../components/common/ShareModal';

const ResourceDetailPage = () => {
  const { id } = useParams();
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [savedResources, setSavedResources] = useState([]);
  const [toast, setToast] = useState(null);

    const [similarResources, setSimilarResources] = useState([]);

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Fetch saved resources on mount
  useEffect(() => {
    const fetchSavedResources = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await axios.get('http://localhost:8080/api/saved-resources', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setSavedResources(response.data || []);
        }
      } catch (error) {
        console.error('Error fetching saved resources:', error);
      }
    };
    fetchSavedResources();
  }, []);

  useEffect(() => {
    fetchResourceDetails();
    fetchSimilarResources();
  }, [id]);

  useEffect(() => {
    if (resource && selectedDate) {
      fetchAvailability();
    }
  }, [resource, selectedDate]);

  const fetchResourceDetails = async () => {
    try {
      setLoading(true);
      const data = await resourceService.getResourceById(id);
      setResource(data);
      setError(null);
    } catch (err) {
      setError('Failed to load resource details');
      console.error('Error fetching resource:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailability = async () => {
    try {
      const data = await resourceService.getResourceAvailability(id, selectedDate);
      setAvailability(data);
    } catch (err) {
      console.error('Error fetching availability:', err);
      setAvailability(null);
    }
  };

  const fetchSimilarResources = async () => {
    try {
      // Fetch resources of same type and status
      const data = await resourceService.searchResources({
        type: resource?.type,
        status: 'ACTIVE'
      });
      // Filter out current resource and limit to 3 similar resources
      const similar = data.filter(r => r.id !== id).slice(0, 3);
      setSimilarResources(similar);
    } catch (err) {
      console.error('Error fetching similar resources:', err);
    }
  };

  const handleSaveResource = async (resourceId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:8080/api/saved-resources/${resourceId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const response = await axios.get('http://localhost:8080/api/saved-resources', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSavedResources(response.data || []);
      setToast({ message: 'Resource saved successfully', type: 'success' });
    } catch (error) {
      console.error('Error saving resource:', error);
      setToast({ message: 'Failed to save resource', type: 'error' });
    }
  };

  const handleUnsaveResource = async (resourceId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8080/api/saved-resources/${resourceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const response = await axios.get('http://localhost:8080/api/saved-resources', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSavedResources(response.data || []);
      setToast({ message: 'Resource removed from saved', type: 'success' });
    } catch (error) {
      console.error('Error unsaving resource:', error);
    }
  };

  const isResourceSaved = (resourceId) => {
    return savedResources.some(saved => saved.resourceId === resourceId);
  };

  const getStatusBadgeColor = (status) => {
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

  const formatDayOfWeek = (day) => {
    const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    return days[parseInt(day) - 1] || day;
  };

  const getDayOfWeekFromDate = (dateString) => {
    const date = new Date(dateString);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  };

  if (loading) {
    return <DetailSkeleton />;
  }

  if (error || !resource) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="alert alert-error">
          <svg className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error || 'Resource not found'}</span>
        </div>
        <Link to="/resources" className="btn btn-primary mt-4">
          Back to Resources
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="breadcrumbs text-sm mb-6">
        <ul>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/resources">Resources</Link></li>
          <li>{resource.name}</li>
        </ul>
      </div>

      {/* Resource Header */}
      <div className="card bg-base-100 shadow-xl mb-8">
        <div className="card-body">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <span className="text-4xl">{getResourceIcon(resource.type)}</span>
              <div>
                <h1 className="text-3xl font-bold">{resource.name}</h1>
                <p className="text-lg text-base-content/70 capitalize">
                  {resource.type.replace('_', ' ').toLowerCase()}
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <div className={`badge ${getStatusBadgeColor(resource.status)} badge-lg`}>
                    {resource.status.replace('_', ' ')}
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{resource.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span>{resource.capacity} people</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex gap-2">
              {resource.status === 'ACTIVE' && (
                <Link
                  to={`/bookings/new?resourceId=${resource.id}`}
                  className="btn btn-primary"
                >
                  Book This Resource
                </Link>
              )}
              <button
                onClick={() => isResourceSaved(resource.id) ? handleUnsaveResource(resource.id) : handleSaveResource(resource.id)}
                className={`btn btn-sm ${isResourceSaved(resource.id) ? 'btn-secondary' : 'btn-ghost'} transition-all duration-300 hover:scale-125 active:scale-95`}
                title={isResourceSaved(resource.id) ? 'Remove from saved' : 'Save resource'}
              >
                <svg className="w-5 h-5" fill={isResourceSaved(resource.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </button>
              <button
                onClick={() => setShowShareModal(true)}
                className="btn btn-outline"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share
              </button>
              <Link to="/resources" className="btn btn-outline">
                Back to List
              </Link>
            </div>
          </div>

          {/* Description */}
          {resource.description && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-base-content/80">{resource.description}</p>
            </div>
          )}

          {/* Amenities */}
          {resource.amenities && resource.amenities.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {resource.amenities.map((amenity, index) => (
                  <span key={index} className="badge badge-outline">
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Availability Section */}
      <div className="card bg-base-100 shadow-xl mb-8">
        <div className="card-body">
          <h2 className="card-title text-xl mb-4">Availability Schedule</h2>
          
          {/* Direct availability windows display */}
          {resource.availabilityWindows && resource.availabilityWindows.length > 0 ? (
            <div>
              <p className="text-base-content/70 mb-4">This resource is available during the following time slots:</p>
              <div className="space-y-2">
                {resource.availabilityWindows
                  .sort((a, b) => {
                    const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
                    return days.indexOf(a.dayOfWeek) - days.indexOf(b.dayOfWeek);
                  })
                  .map((window, index) => (
                    <div key={index} className={`flex items-center gap-3 p-4 rounded-lg border ${window.available ? 'bg-success/10 border-success/30' : 'bg-error/10 border-error/30'}`}>
                      <div className="flex items-center gap-2 flex-1">
                        <span className={`badge ${window.available ? 'badge-success' : 'badge-error'} badge-lg`}>
                          {window.available ? 'Open' : 'Closed'}
                        </span>
                        <span className="font-semibold text-lg">{formatDayOfWeek(window.dayOfWeek)}</span>
                      </div>
                      {window.available && (
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-mono font-medium">{window.startTime} - {window.endTime}</span>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
              
              {/* Check specific date availability */}
              <div className="mt-6 pt-6 border-t border-base-300 text-right">
                <h4 className="font-semibold mb-2">Check Availability for Specific Date</h4>
                <div className="flex gap-2 items-center justify-end">
                  <div className="form-control">
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="input input-bordered input-sm"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  {selectedDate && (
                    <div className="text-xs text-base-content/70 whitespace-nowrap">
                      {getDayOfWeekFromDate(selectedDate)}
                    </div>
                  )}
                  {availability ? (
                    availability.isAvailable ? (
                      <div className="alert alert-success py-1 px-3">
                        <svg className="stroke-current shrink-0 h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs">Available</span>
                      </div>
                    ) : (
                      <div className="alert alert-warning py-1 px-3">
                        <svg className="stroke-current shrink-0 h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="text-xs">Not Available</span>
                      </div>
                    )
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
            <div className="alert alert-info">
              <svg className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>No availability schedule set. This resource may be available anytime.</span>
            </div>
          )}
        </div>
      </div>

      {/* Similar Resources */}
      {similarResources.length > 0 && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-xl mb-4">Similar Resources</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {similarResources.map((similarResource) => (
                <ResourceCard key={similarResource.id} resource={similarResource} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        resource={resource}
      />

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default ResourceDetailPage;
