import React, { useState, useEffect } from 'react';
import { resourceService } from '../../services/resourceService';

const ResourceForm = ({ resource, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'LECTURE_HALL',
    capacity: 1,
    location: '',
    status: 'ACTIVE',
    description: '',
    amenities: [],
    availabilityWindows: []
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [amenityInput, setAmenityInput] = useState('');
  const [availabilityWindow, setAvailabilityWindow] = useState({
    dayOfWeek: 'MONDAY',
    startTime: '09:00',
    endTime: '17:00',
    available: true
  });

  useEffect(() => {
    if (resource) {
      setFormData({
        name: resource.name || '',
        type: resource.type || 'LECTURE_HALL',
        capacity: resource.capacity || 1,
        location: resource.location || '',
        status: resource.status || 'ACTIVE',
        description: resource.description || '',
        amenities: resource.amenities || [],
        availabilityWindows: resource.availabilityWindows || []
      });
    }
  }, [resource]);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAddAmenity = () => {
    if (amenityInput.trim() && !formData.amenities.includes(amenityInput.trim())) {
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, amenityInput.trim()]
      }));
      setAmenityInput('');
    }
  };

  const handleRemoveAmenity = (index) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter((_, i) => i !== index)
    }));
  };

  const handleAddAvailabilityWindow = () => {
    // Validate time format
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(availabilityWindow.startTime) || !timeRegex.test(availabilityWindow.endTime)) {
      setErrors(prev => ({ ...prev, availability: 'Please use HH:MM format for times' }));
      return;
    }

    // Validate that end time is after start time
    if (availabilityWindow.startTime >= availabilityWindow.endTime) {
      setErrors(prev => ({ ...prev, availability: 'End time must be after start time' }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      availabilityWindows: [...prev.availabilityWindows, { ...availabilityWindow }]
    }));

    // Reset availability window form
    setAvailabilityWindow({
      dayOfWeek: 'MONDAY',
      startTime: '09:00',
      endTime: '17:00',
      available: true
    });

    // Clear availability error
    if (errors.availability) {
      setErrors(prev => ({ ...prev, availability: '' }));
    }
  };

  const handleRemoveAvailabilityWindow = (index) => {
    setFormData(prev => ({
      ...prev,
      availabilityWindows: prev.availabilityWindows.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Resource name is required';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (formData.capacity < 1) {
      newErrors.capacity = 'Capacity must be at least 1';
    }

    if (formData.capacity > 1000) {
      newErrors.capacity = 'Capacity seems too high (max 1000)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      if (resource) {
        await resourceService.updateResource(resource.id, formData);
      } else {
        await resourceService.createResource(formData);
      }
      onSubmit();
    } catch (err) {
      console.error('Error saving resource:', err);
      setErrors({ 
        submit: err.response?.data?.message || 'Failed to save resource. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text">Resource Name *</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className={`input input-bordered ${errors.name ? 'input-error' : ''}`}
            placeholder="e.g., Computer Lab 101"
            required
          />
          {errors.name && <label className="label"><span className="label-text-alt text-error">{errors.name}</span></label>}
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Resource Type *</span>
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleInputChange}
            className="select select-bordered"
          >
            <option value="LECTURE_HALL">Lecture Hall</option>
            <option value="LAB">Lab</option>
            <option value="MEETING_ROOM">Meeting Room</option>
            <option value="EQUIPMENT">Equipment</option>
            <option value="OFFICE">Office</option>
            <option value="AUDITORIUM">Auditorium</option>
          </select>
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Location *</span>
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            className={`input input-bordered ${errors.location ? 'input-error' : ''}`}
            placeholder="e.g., Building A, Floor 2"
            required
          />
          {errors.location && <label className="label"><span className="label-text-alt text-error">{errors.location}</span></label>}
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Capacity *</span>
          </label>
          <input
            type="number"
            name="capacity"
            value={formData.capacity}
            onChange={handleInputChange}
            className={`input input-bordered ${errors.capacity ? 'input-error' : ''}`}
            min="1"
            max="1000"
            required
          />
          {errors.capacity && <label className="label"><span className="label-text-alt text-error">{errors.capacity}</span></label>}
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Status *</span>
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            className="select select-bordered"
          >
            <option value="ACTIVE">Active</option>
            <option value="OUT_OF_SERVICE">Out of Service</option>
            <option value="UNDER_MAINTENANCE">Under Maintenance</option>
          </select>
        </div>
      </div>

      {/* Description */}
      <div className="form-control">
        <label className="label">
          <span className="label-text">Description</span>
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          className="textarea textarea-bordered"
          rows="3"
          placeholder="Describe the resource, its features, and any special requirements..."
          maxLength="500"
        />
        <label className="label">
          <span className="label-text-alt">{formData.description.length}/500 characters</span>
        </label>
      </div>

      {/* Amenities */}
      <div className="form-control">
        <label className="label">
          <span className="label-text">Amenities</span>
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={amenityInput}
            onChange={(e) => setAmenityInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAmenity())}
            className="input input-bordered flex-1"
            placeholder="e.g., Projector, Whiteboard, WiFi"
          />
          <button
            type="button"
            onClick={handleAddAmenity}
            className="btn btn-primary"
            disabled={!amenityInput.trim()}
          >
            Add
          </button>
        </div>
        {formData.amenities.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.amenities.map((amenity, index) => (
              <div key={index} className="badge badge-outline gap-2">
                {amenity}
                <button
                  type="button"
                  onClick={() => handleRemoveAmenity(index)}
                  className="btn btn-ghost btn-xs p-0 h-auto min-h-0"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Availability Windows */}
      <div className="form-control">
        <label className="label">
          <span className="label-text">Availability Windows</span>
          <span className="label-text-alt">Optional: Set when this resource is available</span>
        </label>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
          <select
            value={availabilityWindow.dayOfWeek}
            onChange={(e) => setAvailabilityWindow(prev => ({ ...prev, dayOfWeek: e.target.value }))}
            className="select select-bordered select-sm"
          >
            <option value="MONDAY">Monday</option>
            <option value="TUESDAY">Tuesday</option>
            <option value="WEDNESDAY">Wednesday</option>
            <option value="THURSDAY">Thursday</option>
            <option value="FRIDAY">Friday</option>
            <option value="SATURDAY">Saturday</option>
            <option value="SUNDAY">Sunday</option>
          </select>
          
          <input
            type="time"
            value={availabilityWindow.startTime}
            onChange={(e) => setAvailabilityWindow(prev => ({ ...prev, startTime: e.target.value }))}
            className="input input-bordered input-sm"
          />
          
          <input
            type="time"
            value={availabilityWindow.endTime}
            onChange={(e) => setAvailabilityWindow(prev => ({ ...prev, endTime: e.target.value }))}
            className="input input-bordered input-sm"
          />
          
          <button
            type="button"
            onClick={handleAddAvailabilityWindow}
            className="btn btn-primary btn-sm"
          >
            Add Window
          </button>
        </div>

        {errors.availability && (
          <label className="label"><span className="label-text-alt text-error">{errors.availability}</span></label>
        )}

        {formData.availabilityWindows.length > 0 && (
          <div className="space-y-2 mt-2">
            {formData.availabilityWindows.map((window, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-base-200 rounded">
                <span className="badge badge-sm">{window.dayOfWeek}</span>
                <span className="text-sm">{window.startTime} - {window.endTime}</span>
                <span className={`badge badge-xs ${window.available ? 'badge-success' : 'badge-error'}`}>
                  {window.available ? 'Available' : 'Unavailable'}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveAvailabilityWindow(index)}
                  className="btn btn-ghost btn-xs p-0 h-auto min-h-0 ml-auto"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Error Message */}
      {errors.submit && (
        <div className="alert alert-error">
          <svg className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{errors.submit}</span>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-outline"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              {resource ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            resource ? 'Update Resource' : 'Create Resource'
          )}
        </button>
      </div>
    </form>
  );
};

export default ResourceForm;
