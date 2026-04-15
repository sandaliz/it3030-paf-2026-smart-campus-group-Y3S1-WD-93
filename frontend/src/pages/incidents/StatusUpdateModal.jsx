import React, { useState } from 'react';
import Modal from '../../../components/ui/Modal';

const StatusUpdateModal = ({ isOpen, onClose, onUpdate, currentStatus, loading }) => {
  const [status, setStatus] = useState('');
  const [reason, setReason] = useState('');

  const getAvailableStatuses = () => {
    switch (currentStatus) {
      case 'OPEN':
        return ['IN_PROGRESS', 'REJECTED'];
      case 'IN_PROGRESS':
        return ['RESOLVED'];
      case 'RESOLVED':
        return ['CLOSED'];
      default:
        return [];
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (status) {
      onUpdate(status, reason);
    }
  };

  const statusLabels = {
    IN_PROGRESS: 'Start Working',
    RESOLVED: 'Mark as Resolved',
    CLOSED: 'Close Ticket',
    REJECTED: 'Reject Ticket'
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Update Ticket Status" size="md">
      <form onSubmit={handleSubmit}>
        <div className="form-control mb-4">
          <label className="label">
            <span className="label-text">Select New Status</span>
          </label>
          <div className="flex flex-col gap-2">
            {getAvailableStatuses().map(s => (
              <label key={s} className="label cursor-pointer justify-start gap-3">
                <input
                  type="radio"
                  name="status"
                  value={s}
                  className="radio radio-primary"
                  onChange={(e) => setStatus(e.target.value)}
                />
                <span className="label-text">{statusLabels[s] || s}</span>
              </label>
            ))}
          </div>
        </div>

        {(status === 'RESOLVED' || status === 'REJECTED') && (
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">Reason / Resolution Notes</span>
            </label>
            <textarea
              className="textarea textarea-bordered"
              placeholder={status === 'RESOLVED' ? 'Describe how the issue was resolved...' : 'Reason for rejection...'}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              required
            />
          </div>
        )}

        <div className="flex gap-3 mt-4">
          <button type="button" className="btn btn-ghost flex-1" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary flex-1" disabled={!status || loading}>
            {loading ? <span className="loading loading-spinner loading-sm"></span> : 'Update Status'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default StatusUpdateModal;