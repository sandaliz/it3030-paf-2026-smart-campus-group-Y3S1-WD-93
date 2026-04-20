import React, { useEffect, useState } from 'react';
import Modal from '../ui/Modal';

const AssignResourceStaffModal = ({ isOpen, resource, onClose, onAssign }) => {
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDescription('');
    }
  }, [isOpen]);

  const handleSubmit = (event) => {
    event.preventDefault();
    onAssign([], description);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Resource Management Ticket" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl border border-info/20 bg-info/5 p-4 text-sm">
          <p className="font-semibold">Resource: {resource?.name}</p>
          <p className="mt-1 text-base-content/70">{resource?.description}</p>
          <p className="mt-1 text-base-content/60">Location: {resource?.location || 'N/A'}</p>
        </div>

        <div className="rounded-xl border border-base-300 bg-base-100 p-4">
          <label className="text-sm font-semibold block mb-2">Ticket Description</label>
          <textarea
            className="textarea textarea-bordered w-full"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Add details about the resource assignment request..."
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" className="btn btn-ghost flex-1" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary flex-1"
          >
            Create Ticket
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AssignResourceStaffModal;
