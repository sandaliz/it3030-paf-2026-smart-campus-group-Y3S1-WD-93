import React, { useState, useEffect } from 'react';
import { bookingService } from '../../services/bookingService';
import { resourceService } from '../../services/resourceService';

const BookingForm = ({ onBookingCreated, onCancel }) => {
  const [formData, setFormData] = useState({
    resourceId: '',
    date: '',
    startTime: '',
    endTime: '',
    purpose: '',
    expectedAttendees: 1
  });
  
  const [resources, setResources] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [alternativeResources, setAlternativeResources] = useState([]);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [isLoadingAlternatives, setIsLoadingAlternatives] = useState(false);

  useEffect(() => {
    loadResources();
  }, []);

  useEffect(() => {
    if (formData.resourceId && formData.date) {
      loadAvailableSlots();
    }
  }, [formData.resourceId, formData.date]);

  const loadResources = async () => {
    try {
      const resourcesData = await resourceService.getAllResources();
      setResources(resourcesData.filter(resource => resource.status === 'ACTIVE'));
    } catch (error) {
      console.error('Error loading resources:', error);
    }
  };

  const loadAvailableSlots = async () => {
    if (!formData.resourceId || !formData.date) return;
    
    setIsCheckingAvailability(true);
    try {
      const slots = await bookingService.getAvailableTimeSlots(formData.resourceId, formData.date);
      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error loading available slots:', error);
      setAvailableSlots([]);
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.resourceId) newErrors.resourceId = 'Resource is required';
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.startTime) newErrors.startTime = 'Start time is required';
    if (!formData.endTime) newErrors.endTime = 'End time is required';
    if (!formData.purpose) newErrors.purpose = 'Purpose is required';
    if (formData.expectedAttendees < 1) newErrors.expectedAttendees = 'Must be at least 1 attendee';
    
    // Validate time logic
    if (formData.startTime && formData.endTime) {
      if (formData.startTime >= formData.endTime) {
        newErrors.endTime = 'End time must be after start time';
      }
    }
    
    // Validate date is not in the past
    if (formData.date) {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        newErrors.date = 'Date cannot be in the past';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setShowAlternatives(false);
    setAlternativeResources([]);
    
    try {
      const booking = await bookingService.createBooking(formData);
      onBookingCreated(booking);
      // Reset form
      setFormData({
        resourceId: '',
        date: '',
        startTime: '',
        endTime: '',
        purpose: '',
        expectedAttendees: 1
      });
    } catch (error) {
      console.error('Error creating booking:', error);
      const errorMessage = error.response?.data?.message || '';
      
      // Check if error is due to booking conflict
      if (errorMessage.includes('already booked') || errorMessage.includes('conflict')) {
        setErrors({
          submit: errorMessage
        });
        
        // Load alternative resources
        loadAlternativeResources();
      } else {
        const validationErrors = error.response?.data?.validationErrors;
        const validationMessage = validationErrors
          ? Object.values(validationErrors).join(', ')
          : null;
        setErrors({
          submit: validationMessage || errorMessage || 'Failed to create booking'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const loadAlternativeResources = async () => {
    if (!formData.resourceId || !formData.date || !formData.startTime || !formData.endTime) {
      return;
    }
    
    setIsLoadingAlternatives(true);
    try {
      const alternatives = await bookingService.getAlternativeResources(
        formData.resourceId,
        formData.date,
        formData.startTime,
        formData.endTime,
        formData.expectedAttendees
      );
      setAlternativeResources(alternatives);
      setShowAlternatives(alternatives.length > 0);
    } catch (error) {
      console.error('Error loading alternative resources:', error);
      setAlternativeResources([]);
      setShowAlternatives(false);
    } finally {
      setIsLoadingAlternatives(false);
    }
  };

  const selectAlternativeResource = (resource) => {
    setFormData(prev => ({
      ...prev,
      resourceId: resource.id
    }));
    setShowAlternatives(false);
    setAlternativeResources([]);
    setErrors(prev => ({ ...prev, submit: '' }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'expectedAttendees' ? parseInt(value) || 1 : value
    }));
    
    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3); // Allow booking up to 3 months in advance
    return maxDate.toISOString().split('T')[0];
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title text-2xl font-bold mb-6">Create New Booking</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Resource Selection */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Resource *</span>
            </label>
            <select
              name="resourceId"
              value={formData.resourceId}
              onChange={handleChange}
              className={`select select-bordered ${errors.resourceId ? 'select-error' : ''}`}
              required
            >
              <option value="">Select a resource</option>
              {resources.map(resource => (
                <option key={resource.id} value={resource.id}>
                  {resource.name} ({resource.type}) - {resource.capacity} people - {resource.location}
                </option>
              ))}
            </select>
            {errors.resourceId && (
              <label className="label">
                <span className="label-text-alt text-error">{errors.resourceId}</span>
              </label>
            )}
          </div>

          {/* Date Selection */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Date *</span>
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              min={getTodayDate()}
              max={getMaxDate()}
              className={`input input-bordered ${errors.date ? 'input-error' : ''}`}
              required
            />
            {errors.date && (
              <label className="label">
                <span className="label-text-alt text-error">{errors.date}</span>
              </label>
            )}
          </div>

          {/* Time Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Start Time *</span>
              </label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                min="08:00"
                max="20:00"
                className={`input input-bordered ${errors.startTime ? 'input-error' : ''}`}
                required
              />
              {errors.startTime && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.startTime}</span>
                </label>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">End Time *</span>
              </label>
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                min="08:00"
                max="20:00"
                className={`input input-bordered ${errors.endTime ? 'input-error' : ''}`}
                required
              />
              {errors.endTime && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.endTime}</span>
                </label>
              )}
            </div>
          </div>

          {/* Available Slots Display */}
          {isCheckingAvailability && (
            <div className="flex items-center gap-2">
              <span className="loading loading-spinner loading-sm"></span>
              <span className="text-sm text-gray-600">Checking availability...</span>
            </div>
          )}

          {availableSlots.length > 0 && (
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Available Time Slots</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {availableSlots.map((slot, index) => (
                  <div key={index} className="badge badge-success badge-outline">
                    {slot}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Purpose */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Purpose *</span>
            </label>
            <textarea
              name="purpose"
              value={formData.purpose}
              onChange={handleChange}
              placeholder="Describe the purpose of this booking..."
              className={`textarea textarea-bordered h-24 ${errors.purpose ? 'textarea-error' : ''}`}
              required
            />
            {errors.purpose && (
              <label className="label">
                <span className="label-text-alt text-error">{errors.purpose}</span>
              </label>
            )}
          </div>

          {/* Expected Attendees */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Expected Attendees *</span>
            </label>
            <input
              type="number"
              name="expectedAttendees"
              value={formData.expectedAttendees}
              onChange={handleChange}
              min="1"
              max="100"
              className={`input input-bordered ${errors.expectedAttendees ? 'input-error' : ''}`}
              required
            />
            {errors.expectedAttendees && (
              <label className="label">
                <span className="label-text-alt text-error">{errors.expectedAttendees}</span>
              </label>
            )}
          </div>

          {/* Error Display */}
          {errors.submit && (
            <div className="alert alert-error">
              <span>{errors.submit}</span>
            </div>
          )}

          {/* Alternative Resources Suggestions */}
          {isLoadingAlternatives && (
            <div className="card bg-base-200 border border-base-300">
              <div className="card-body p-4">
                <div className="flex items-center gap-2">
                  <span className="loading loading-spinner loading-sm"></span>
                  <span className="text-sm">Finding alternative resources...</span>
                </div>
              </div>
            </div>
          )}

          {showAlternatives && alternativeResources.length > 0 && (
            <div className="card bg-success/10 border border-success/20">
              <div className="card-body p-4">
                <h3 className="text-lg font-semibold mb-3 text-success">
                  Alternative Resources Available
                </h3>
                <p className="text-sm text-base-content/70 mb-4">
                  The following resources are available at your requested time:
                </p>
                <div className="space-y-2">
                  {alternativeResources.map((resource) => (
                    <div
                      key={resource.id}
                      className="card bg-base-100 border border-base-300 cursor-pointer hover:border-primary hover:shadow-sm transition-all"
                      onClick={() => selectAlternativeResource(resource)}
                    >
                      <div className="card-body p-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold text-primary">{resource.name}</h4>
                            <div className="text-sm text-base-content/70 mt-1">
                              <span className="badge badge-outline badge-sm">{resource.type}</span>
                              <span className="ml-2">Capacity: {resource.capacity} people</span>
                              <span className="ml-2">Location: {resource.location}</span>
                            </div>
                          </div>
                          <button className="btn btn-sm btn-primary">
                            Select
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setShowAlternatives(false);
                      setAlternativeResources([]);
                    }}
                  >
                    Hide alternatives
                  </button>
                </div>
              </div>
            </div>
          )}

          {showAlternatives && alternativeResources.length === 0 && !isLoadingAlternatives && (
            <div className="card bg-warning/10 border border-warning/20">
              <div className="card-body p-4">
                <h3 className="text-lg font-semibold mb-2 text-warning">
                  No Alternative Resources Available
                </h3>
                <p className="text-sm text-base-content/70">
                  Unfortunately, no alternative resources are available at your requested time. 
                  Try selecting a different time or date.
                </p>
                <div className="mt-3">
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setShowAlternatives(false);
                      setAlternativeResources([]);
                    }}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="card-actions justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-ghost"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || isCheckingAvailability}
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Creating...
                </>
              ) : (
                'Create Booking'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingForm;
