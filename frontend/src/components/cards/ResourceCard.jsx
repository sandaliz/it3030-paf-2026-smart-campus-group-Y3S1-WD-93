import React from 'react';
import { Link } from 'react-router-dom';

const ResourceCard = ({ resource }) => {
  // Get status badge color based on resource status
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

  // Format capacity text
  const getCapacityText = (capacity) => {
    return capacity === 1 ? '1 person' : `${capacity} people`;
  };

  return (
    <div className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="card-body">
        {/* Header with type icon and status */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getResourceIcon(resource.type)}</span>
            <div>
              <h2 className="card-title text-lg">{resource.name}</h2>
              <p className="text-sm text-base-content/70 capitalize">
                {resource.type.replace('_', ' ').toLowerCase()}
              </p>
            </div>
          </div>
          <div className={`badge ${getStatusBadgeColor(resource.status)} badge-sm`}>
            {resource.status.replace('_', ' ')}
          </div>
        </div>

        {/* Resource details */}
        <div className="space-y-2">
          {/* Location */}
          <div className="flex items-center gap-2 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{resource.location}</span>
          </div>

          {/* Capacity */}
          <div className="flex items-center gap-2 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span>{getCapacityText(resource.capacity)}</span>
          </div>

          {/* Description (if available) */}
          {resource.description && (
            <div className="text-sm text-base-content/70 line-clamp-2">
              {resource.description}
            </div>
          )}

          {/* Amenities (if available) */}
          {resource.amenities && resource.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {resource.amenities.slice(0, 3).map((amenity, index) => (
                <span key={index} className="badge badge-outline badge-xs">
                  {amenity}
                </span>
              ))}
              {resource.amenities.length > 3 && (
                <span className="badge badge-outline badge-xs">
                  +{resource.amenities.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="card-actions justify-between mt-4">
          <Link 
            to={`/resources/${resource.id}`}
            className="btn btn-primary btn-sm"
          >
            View Details
          </Link>
          
          {/* Quick book button (only if resource is active) */}
          {resource.status === 'ACTIVE' && (
            <Link 
              to={`/bookings/new?resourceId=${resource.id}`}
              className="btn btn-outline btn-sm"
            >
              Book Now
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResourceCard;
