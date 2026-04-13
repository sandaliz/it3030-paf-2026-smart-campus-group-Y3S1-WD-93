import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketService } from '../../services/ticketService';
import { resourceService } from '../../services/resourceService';
import { useAuth } from '../../context/AuthContext';

const CreateTicketPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingResources, setLoadingResources] = useState(false);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [resources, setResources] = useState([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'IT',
    priority: 'MEDIUM',
    location: '',
    resourceId: ''  // This will store the ID, but display the name
  });

  const categories = ['IT', 'ELECTRICAL', 'PLUMBING', 'HVAC', 'FURNITURE', 'CLEANING', 'SECURITY', 'OTHER'];
  const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

  // Fetch resources for dropdown
  useEffect(() => {
    const fetchResources = async () => {
      setLoadingResources(true);
      try {
        const response = await resourceService.getAllResources();
        // Filter only active resources
        const activeResources = response.filter(r => r.status === 'ACTIVE');
        setResources(activeResources);
      } catch (error) {
        console.error('Failed to fetch resources:', error);
      } finally {
        setLoadingResources(false);
      }
    };
    fetchResources();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'resourceId') {
      // When user selects a resource, we store the ID
      // The dropdown shows the name, but value is the ID
      setFormData(prev => ({ ...prev, [name]: value }));
      
      // Optional: Auto-fill location from selected resource
      const selectedResource = resources.find(r => r.id === value);
      if (selectedResource && selectedResource.location) {
        setFormData(prev => ({ 
          ...prev, 
          location: selectedResource.location 
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    
    if (selectedFiles.length + files.length > 3) {
      alert('Maximum 3 attachments allowed');
      return;
    }
    
    const oversizedFiles = selectedFiles.filter(file => file.size > MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
      alert(`File "${oversizedFiles[0].name}" exceeds 5MB limit`);
      return;
    }
    
    const invalidFiles = selectedFiles.filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      alert('Only image files are allowed');
      return;
    }
    
    setFiles([...files, ...selectedFiles]);
    
    selectedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const formDataToSend = new FormData();
      
      // Required fields
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('priority', formData.priority);
      formDataToSend.append('location', formData.location);
      
      // Send the resource ID to backend (not the name)
      if (formData.resourceId) {
        formDataToSend.append('resourceId', formData.resourceId);
      }
      
      files.forEach(file => {
        formDataToSend.append('attachments', file);
      });
      
      const newTicket = await ticketService.createTicket(formDataToSend);
      navigate(`/tickets/${newTicket.id}`);
      
    } catch (error) {
      console.error('Failed to create ticket:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to create ticket';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get resource name by ID (for display)
  const getResourceName = (resourceId) => {
    const resource = resources.find(r => r.id === resourceId);
    return resource ? resource.name : '';
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl animate-fade-in">
      <div className="hero bg-base-200 rounded-lg mb-6 p-6">
        <div className="hero-content text-center">
          <div>
            <h1 className="text-3xl font-bold">Create New Ticket</h1>
            <p className="text-base-content/70 mt-1">Report an issue or request assistance</p>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {/* Title */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-medium">Title *</span>
              </label>
              <input
                type="text"
                name="title"
                placeholder="Brief summary of the issue"
                className="input input-bordered"
                value={formData.title}
                onChange={handleChange}
                required
                maxLength={100}
              />
              <label className="label">
                <span className="label-text-alt">{formData.title.length}/100</span>
              </label>
            </div>

            {/* Description */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-medium">Description *</span>
              </label>
              <textarea
                name="description"
                placeholder="Detailed description of the problem..."
                className="textarea textarea-bordered h-32"
                value={formData.description}
                onChange={handleChange}
                required
                maxLength={1000}
              />
              <label className="label">
                <span className="label-text-alt">{formData.description.length}/1000</span>
              </label>
            </div>

            {/* Category and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Category *</span>
                </label>
                <select
                  name="category"
                  className="select select-bordered"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Priority *</span>
                </label>
                <select
                  name="priority"
                  className="select select-bordered"
                  value={formData.priority}
                  onChange={handleChange}
                  required
                >
                  {priorities.map(pri => (
                    <option key={pri} value={pri}>{pri}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Location */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-medium">Location *</span>
              </label>
              <input
                type="text"
                name="location"
                placeholder="Building, room number, or specific area"
                className="input input-bordered"
                value={formData.location}
                onChange={handleChange}
                required
              />
            </div>

            {/* Resource Selection - Shows Name, Sends ID */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-medium">Related Resource (Optional)</span>
              </label>
              
              {loadingResources ? (
                <div className="flex items-center gap-2">
                  <span className="loading loading-spinner loading-sm"></span>
                  <span className="text-sm text-base-content/70">Loading resources...</span>
                </div>
              ) : (
                <select
                  name="resourceId"
                  className="select select-bordered"
                  value={formData.resourceId}
                  onChange={handleChange}
                >
                  <option value="">-- Select a resource (optional) --</option>
                  {resources.map(resource => (
                    <option key={resource.id} value={resource.id}>
                      {resource.name} ({resource.type} - {resource.location})
                    </option>
                  ))}
                </select>
              )}
              <label className="label">
                <span className="label-text-alt">Select the equipment or facility related to this issue</span>
              </label>
            </div>

            {/* Selected Resource Preview (Optional) */}
            {formData.resourceId && (
              <div className="alert alert-info mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <div>
                  <span className="font-medium">Selected Resource:</span>{' '}
                  {getResourceName(formData.resourceId)}
                  <span className="text-xs block text-base-content/70 mt-1">
                    Resource ID: {formData.resourceId}
                  </span>
                </div>
              </div>
            )}

            {/* Attachments */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-medium">Attachments (Max 3 images)</span>
              </label>
              
              <div className="border-2 border-dashed border-base-300 rounded-lg p-4 text-center">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="file-input file-input-bordered w-full"
                  onChange={handleFileChange}
                  disabled={files.length >= 3}
                />
                <p className="text-xs text-base-content/50 mt-2">
                  Upload up to 3 images (JPG, PNG, GIF - max 5MB each)
                </p>
              </div>
              
              {previews.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {previews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img src={preview} alt={`Preview ${index + 1}`} className="w-20 h-20 object-cover rounded-lg" />
                      <button
                        type="button"
                        className="absolute -top-2 -right-2 btn btn-xs btn-circle btn-error"
                        onClick={() => removeFile(index)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 mt-6">
              <button type="button" className="btn btn-ghost flex-1" onClick={() => navigate(-1)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary flex-1" disabled={loading}>
                {loading ? <span className="loading loading-spinner loading-sm"></span> : 'Create Ticket'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateTicketPage;