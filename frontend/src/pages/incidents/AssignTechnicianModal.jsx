import React, { useState } from 'react';
import Modal from '../../../components/ui/Modal';

// Mock technician list - replace with API call
const TECHNICIANS = [
  { id: 'tech1', name: 'John Doe', department: 'IT Support' },
  { id: 'tech2', name: 'Jane Smith', department: 'Facilities' },
  { id: 'tech3', name: 'Mike Johnson', department: 'Electrical' },
];

const AssignTechnicianModal = ({ isOpen, onClose, onAssign, loading }) => {
  const [selectedTech, setSelectedTech] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedTech) {
      const tech = TECHNICIANS.find(t => t.id === selectedTech);
      onAssign(selectedTech, tech.name);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign Technician" size="md">
      <form onSubmit={handleSubmit}>
        <div className="form-control mb-4">
          <label className="label">
            <span className="label-text">Select Technician</span>
          </label>
          <div className="flex flex-col gap-2">
            {TECHNICIANS.map(tech => (
              <label key={tech.id} className="label cursor-pointer justify-start gap-3">
                <input
                  type="radio"
                  name="technician"
                  value={tech.id}
                  className="radio radio-primary"
                  onChange={(e) => setSelectedTech(e.target.value)}
                />
                <div>
                  <span className="label-text font-medium">{tech.name}</span>
                  <span className="label-text text-base-content/50 text-sm ml-2">({tech.department})</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <button type="button" className="btn btn-ghost flex-1" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary flex-1" disabled={!selectedTech || loading}>
            {loading ? <span className="loading loading-spinner loading-sm"></span> : 'Assign'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AssignTechnicianModal;