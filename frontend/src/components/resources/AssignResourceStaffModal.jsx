import React, { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import { resourceService } from '../../services/resourceService';
import { userService } from '../../services/userService';

const AssignResourceStaffModal = ({ isOpen, resource, onClose, onAssign, onUnassign }) => {
  const [staffList, setStaffList] = useState([]);
  const [selectedStaffIds, setSelectedStaffIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unassigning, setUnassigning] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStaff = async () => {
      if (!resource?.id || !isOpen) {
        return;
      }

      try {
        setLoading(true);
        setError('');
        // Fetch NON_ACADEMIC staff from the user service
        const data = await userService.getStaff();
        setStaffList(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching staff:', error);
        setStaffList([]);
        setError('Failed to load staff list.');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchStaff();
      setSelectedStaffIds(resource.assignedStaff || []);
    } else {
      setSelectedStaffIds([]);
      setStaffList([]);
      setError('');
    }
  }, [isOpen, resource?.id, resource?.assignedStaff]);

  const toggleStaff = (staffId) => {
    setSelectedStaffIds((current) =>
      current.includes(staffId)
        ? current.filter((id) => id !== staffId)
        : [...current, staffId]
    );
  };

  const handleUnassign = async (staffId) => {
    try {
      setUnassigning(staffId);
      const updatedStaffIds = selectedStaffIds.filter(id => id !== staffId);
      await resourceService.assignStaffToResource(resource.id, updatedStaffIds);
      setSelectedStaffIds(updatedStaffIds);
      if (onUnassign) {
        onUnassign();
      }
    } catch (error) {
      console.error('Error unassigning staff:', error);
      setError('Failed to unassign staff');
    } finally {
      setUnassigning(null);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onAssign(selectedStaffIds);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign Staff" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl border border-info/20 bg-info/5 p-4 text-sm">
          <p className="font-semibold">Resource: {resource?.name}</p>
          <p className="mt-1 text-base-content/70">{resource?.description}</p>
        </div>

        {(resource?.assignedStaff && resource.assignedStaff.length > 0 || selectedStaffIds.length > 0) && (
          <div className="rounded-xl border border-base-300 bg-base-200/40 p-4">
            <p className="text-sm font-semibold">Currently Assigned Staff</p>
            <div className="mt-3 space-y-2">
              {selectedStaffIds.map((staffId) => {
                const staff = staffList.find(s => s.id === staffId);
                return (
                  <div key={staffId} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="badge badge-success badge-sm">{staff?.name || staffId}</span>
                      {staff?.email && <span className="text-xs text-base-content/60">{staff.email}</span>}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUnassign(staffId)}
                      disabled={unassigning === staffId}
                      className="btn btn-xs btn-error btn-outline"
                      title="Remove assignment"
                    >
                      {unassigning === staffId ? 'Removing...' : 'Remove'}
                    </button>
                  </div>
                );
              })}
              {selectedStaffIds.length === 0 && resource?.assignedStaff?.length > 0 && (
                <p className="text-xs text-base-content/50 italic">All staff removed from assignment</p>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-xl border border-base-300 bg-base-200/50" />
            ))}
          </div>
        ) : error ? (
          <div className="alert alert-error text-sm">{error}</div>
        ) : (
          <>
            {staffList.length === 0 ? (
              <div className="alert">No staff members available.</div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-semibold">Available Staff</p>
                <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
                  {staffList.map((staff) => {
                    const selected = selectedStaffIds.includes(staff.id);
                    const alreadyAssigned = resource?.assignedStaff?.includes(staff.id);

                    return (
                      <button
                        key={staff.id}
                        type="button"
                        onClick={() => toggleStaff(staff.id)}
                        disabled={alreadyAssigned}
                        className={`w-full rounded-xl border p-4 text-left transition-all ${
                          selected
                            ? 'border-primary bg-primary/10 shadow-sm'
                            : alreadyAssigned
                            ? 'border-success/30 bg-success/10 opacity-60'
                            : 'border-base-300 bg-base-100 hover:border-primary/40 hover:bg-base-200/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold">{staff.name}</span>
                              {alreadyAssigned && (
                                <span className="badge badge-success badge-sm">Already Assigned</span>
                              )}
                            </div>
                            <p className="mt-1 text-sm text-base-content/60">{staff.email}</p>
                          </div>
                          {selected && (
                            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        <div className="flex gap-3 pt-2">
          <button type="button" className="btn btn-ghost flex-1" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary flex-1"
            disabled={selectedStaffIds.length === 0 || loading}
          >
            Assign Staff
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AssignResourceStaffModal;
