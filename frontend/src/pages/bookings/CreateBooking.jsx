import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { useRealTimeValidation } from '../../utils/validation';

const CreateBooking = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialResourceId = searchParams.get('resourceId') || '';
  
  const [resources, setResources] = useState([]);
  const [selectedResource, setSelectedResource] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingSlots, setFetchingSlots] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');

  const getResourceCapacity = (resource) => {
    const capacity = Number(resource?.capacity);
    return Number.isFinite(capacity) && capacity > 0 ? capacity : null;
  };
  
  const {
    values: formData,
    errors,
    touched,
    setValues: setFormData,
    handleChange,
    handleBlur,
    validateAll,
    isFormValid
  } = useRealTimeValidation({
    resourceId: initialResourceId,
    date: '',
    startTime: '',
    endTime: '',
    purpose: '',
    expectedAttendees: 1,
  });

  useEffect(() => {
    fetchResources();
  }, []);

  useEffect(() => {
    if (selectedResource && selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedResource, selectedDate]);

  useEffect(() => {
    const capacity = getResourceCapacity(selectedResource);

    if (!capacity) {
      return;
    }

    setFormData((prev) => {
      const currentAttendees = Number(prev.expectedAttendees) || 1;
      const nextAttendees = Math.min(Math.max(currentAttendees, 1), capacity);

      return nextAttendees === prev.expectedAttendees
        ? prev
        : { ...prev, expectedAttendees: nextAttendees };
    });
  }, [selectedResource, setFormData]);

  useEffect(() => {
    const resourceId = searchParams.get('resourceId') || '';

    setFormData((prev) => (
      prev.resourceId === resourceId ? prev : { ...prev, resourceId }
    ));

    if (!resourceId) {
      setSelectedResource(null);
      return;
    }

    const matchingResource = resources.find(
      (resource) => String(resource.id) === String(resourceId)
    );

    if (matchingResource) {
      setSelectedResource(matchingResource);
      return;
    }

    fetchResourceDetails(resourceId);
  }, [searchParams, resources]);

  const fetchResources = async () => {
    try {
      const data = await api.getResources();
      const activeResources = data.filter(r => r.status === 'ACTIVE');
      setResources(activeResources);
    } catch (error) {
      console.error('Failed to fetch resources:', error);
    }
  };

  const fetchResourceDetails = async (resourceId) => {
    try {
      const resource = await api.getResource(resourceId);
      setSelectedResource(resource);
    } catch (error) {
      console.error('Failed to fetch resource details:', error);
    }
  };

  const fetchAvailableSlots = async () => {
    if (!selectedResource || !selectedDate) return;
    
    try {
      setFetchingSlots(true);
      const slots = await api.getAvailableSlots(selectedResource.id, selectedDate);
      setAvailableSlots(slots);
    } catch (error) {
      console.error('Failed to fetch available slots:', error);
    } finally {
      setFetchingSlots(false);
    }
  };

  const handleResourceChange = (resourceId) => {
    const resource = resources.find((r) => String(r.id) === String(resourceId));
    const capacity = getResourceCapacity(resource);
    setSelectedResource(resource);
    setFormData((prev) => ({
      ...prev,
      resourceId,
      startTime: '',
      endTime: '',
      expectedAttendees: capacity
        ? Math.min(Math.max(Number(prev.expectedAttendees) || 1, 1), capacity)
        : Number(prev.expectedAttendees) || 1,
    }));
    setAvailableSlots([]);
    setSelectedSlot('');
  };

  const handleSlotSelect = (slot) => {
    const [startTime, endTime] = slot.split(' - ');
    setSelectedSlot(slot);
    setFormData(prev => ({
      ...prev,
      startTime: startTime.trim(),
      endTime: endTime.trim(),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const capacity = getResourceCapacity(selectedResource);

    if (capacity && Number(formData.expectedAttendees) > capacity) {
      return;
    }
    
    // Validate all fields before submission
    if (!validateAll()) {
      return;
    }
    
    setLoading(true);
    
    try {
      await api.createBooking(formData);
      navigate('/bookings?success=true');
    } catch (error) {
      console.error('Failed to create booking:', error);
      const validationErrors = error.response?.data?.validationErrors;
      const validationMessage = validationErrors
        ? Object.values(validationErrors).join(', ')
        : null;
      const message =
        validationMessage ||
        error.response?.data?.message ||
        error.message ||
        'Failed to create booking';
      alert('Failed to create booking: ' + message);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type) => {
    const icons = {
      'LECTURE_HALL': '🏛️',
      'LAB': '🔬',
      'MEETING_ROOM': '🏢',
      'EQUIPMENT': '📱',
    };
    return icons[type] || '📚';
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const selectedResourceCapacity = getResourceCapacity(selectedResource);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">📅 Create New Booking</h1>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Resource Selection */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Select Resource *</span>
              </label>
              <select
                value={formData.resourceId}
                onChange={(e) => handleResourceChange(e.target.value)}
                className="select select-bordered"
                required
              >
                <option value="">Choose a resource...</option>
                {resources.map((resource) => (
                  <option key={resource.id} value={resource.id}>
                    {getTypeIcon(resource.type)} {resource.name} - {resource.location}
                  </option>
                ))}
              </select>
            </div>

            {selectedResource && (
              <div className="alert alert-info">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{getTypeIcon(selectedResource.type)}</span>
                  <div>
                    <p className="font-medium">{selectedResource.name}</p>
                    <p className="text-sm opacity-70">
                      📍 {selectedResource.location} | 👥 {selectedResource.capacity} people
                    </p>
                    {selectedResource.description && (
                      <p className="text-sm mt-1">{selectedResource.description}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Date Selection */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Select Date *</span>
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  const nextDate = e.target.value;
                  setSelectedDate(nextDate);
                  setSelectedSlot('');
                  setAvailableSlots([]);
                  setFormData((prev) => ({
                    ...prev,
                    date: nextDate,
                    startTime: '',
                    endTime: '',
                  }));
                }}
                onBlur={() => handleBlur('date')}
                className={`input input-bordered ${
                  touched.date && errors.date ? 'input-error' : ''
                }`}
                min={getMinDate()}
                required
              />
              {touched.date && errors.date && (
                <label className="label">
                  <span className="label-text-alt text-error text-xs">{errors.date}</span>
                </label>
              )}
            </div>

            {/* Available Slots */}
            {selectedResource && selectedDate && (
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Available Time Slots</span>
                </label>
                
                {fetchingSlots ? (
                  <div className="flex justify-center py-4">
                    <span className="loading loading-spinner loading-md"></span>
                  </div>
                ) : availableSlots.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {availableSlots.map((slot, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSlotSelect(slot)}
                        className={`btn btn-sm ${
                          selectedSlot === slot ? 'btn-primary' : 'btn-outline'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="alert alert-warning">
                    <span>No available slots for the selected date.</span>
                  </div>
                )}
              </div>
            )}

            {/* Booking Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Expected Attendees *</span>
                </label>
                <input
                  type="number"
                  value={formData.expectedAttendees}
                  onChange={(e) => {
                    const rawValue = parseInt(e.target.value, 10);
                    const normalizedValue = Number.isNaN(rawValue) ? 1 : Math.max(rawValue, 1);
                    const boundedValue = selectedResourceCapacity
                      ? Math.min(normalizedValue, selectedResourceCapacity)
                      : normalizedValue;

                    handleChange('expectedAttendees', boundedValue);
                  }}
                  onBlur={() => handleBlur('expectedAttendees')}
                  min="1"
                  max={selectedResourceCapacity ?? undefined}
                  className={`input input-bordered ${
                    touched.expectedAttendees && errors.expectedAttendees ? 'input-error' : ''
                  }`}
                  required
                />
                {touched.expectedAttendees && errors.expectedAttendees && (
                  <label className="label">
                    <span className="label-text-alt text-error text-xs">{errors.expectedAttendees}</span>
                  </label>
                )}
                {selectedResource && (
                  <label className="label">
                    <span className="label-text-alt">
                      Max capacity: {selectedResourceCapacity ?? selectedResource.capacity} people
                    </span>
                  </label>
                )}
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Purpose *</span>
                </label>
                <textarea
                  value={formData.purpose}
                  onChange={(e) => {
                    handleChange('purpose', e.target.value);
                  }}
                  onBlur={() => handleBlur('purpose')}
                  className={`textarea textarea-bordered ${
                    touched.purpose && errors.purpose ? 'input-error' : ''
                  }`}
                  placeholder="Describe purpose of this booking..."
                  rows={3}
                  required
                />
                {touched.purpose && errors.purpose && (
                  <label className="label">
                    <span className="label-text-alt text-error text-xs">{errors.purpose}</span>
                  </label>
                )}
              </div>
            </div>

            {/* Hidden fields for time */}
            <input type="hidden" name="startTime" value={formData.startTime} />
            <input type="hidden" name="endTime" value={formData.endTime} />

            {/* Submit Button */}
            <div className="form-control">
              <button
                type="submit"
                className={`btn btn-primary ${loading ? 'loading' : ''}`}
                disabled={loading || !isFormValid || !selectedSlot}
              >
                {loading ? 'Creating Booking...' : '📅 Create Booking'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateBooking;
