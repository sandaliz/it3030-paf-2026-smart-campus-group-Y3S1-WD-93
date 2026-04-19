import React, { useEffect, useMemo, useState } from 'react';
import Modal from '../../components/ui/Modal';
import { ticketService } from '../../services/ticketService';
import { getAssignedTechnicianIds, getAssignedTechnicianNames } from '../../utils/ticketAssignments';

const AssignTechnicianModal = ({ isOpen, ticket, onClose, onAssign, loading }) => {
  const [selectedTechIds, setSelectedTechIds] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loadingTechs, setLoadingTechs] = useState(false);
  const [loadError, setLoadError] = useState('');

  const assignedTechIds = useMemo(() => getAssignedTechnicianIds(ticket), [ticket]);
  const assignedTechNames = useMemo(() => getAssignedTechnicianNames(ticket), [ticket]);

  useEffect(() => {
    const fetchTechnicians = async () => {
      if (!ticket?.id || !isOpen) {
        return;
      }

      try {
        setLoadingTechs(true);
        setLoadError('');
        const data = await ticketService.getRecommendedTechnicians(ticket.id);
        setTechnicians(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching technician recommendations:', error);
        setTechnicians([]);
        setLoadError('Failed to load technician recommendations.');
      } finally {
        setLoadingTechs(false);
      }
    };

    if (isOpen) {
      fetchTechnicians();
    } else {
      setSelectedTechIds([]);
      setTechnicians([]);
      setLoadError('');
    }
  }, [isOpen, ticket?.id]);

  const alreadyAssigned = technicians.filter((technician) => technician.alreadyAssigned);
  const availableTechnicians = technicians.filter((technician) => !technician.alreadyAssigned);

  const toggleTechnician = (technicianId) => {
    setSelectedTechIds((current) => (
      current.includes(technicianId)
        ? current.filter((id) => id !== technicianId)
        : [...current, technicianId]
    ));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (selectedTechIds.length === 0) {
      return;
    }

    const selectedTechnicians = availableTechnicians.filter((technician) => (
      selectedTechIds.includes(technician.id)
    ));

    onAssign(selectedTechIds, selectedTechnicians);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign Technicians" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl border border-info/20 bg-info/5 p-4 text-sm">
          <p className="font-semibold">Ticket #{ticket?.id}</p>
          <p className="mt-1 text-base-content/70">{ticket?.title}</p>
          <p className="mt-2 text-base-content/60">
            Technicians already assigned to another active ticket are hidden until their current ticket is closed.
          </p>
        </div>

        {assignedTechIds.length > 0 && (
          <div className="rounded-xl border border-base-300 bg-base-200/40 p-4">
            <p className="text-sm font-semibold">Current Team</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {assignedTechNames.map((name) => (
                <span key={name} className="badge badge-outline badge-sm">
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}

        {loadingTechs ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-xl border border-base-300 bg-base-200/50" />
            ))}
          </div>
        ) : loadError ? (
          <div className="alert alert-error text-sm">{loadError}</div>
        ) : (
          <>
            {alreadyAssigned.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-semibold">Already Assigned</p>
                {alreadyAssigned.map((technician) => (
                  <div key={technician.id} className="rounded-xl border border-success/30 bg-success/10 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{technician.name}</span>
                          <span className="badge badge-success badge-sm">Already Assigned</span>
                        </div>
                        <p className="mt-1 text-sm text-base-content/60">{technician.email}</p>
                      </div>
                      <span className="text-xs text-base-content/50">
                        {technician.activeTicketCount} active
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {availableTechnicians.length === 0 ? (
              <div className="alert">
                {assignedTechIds.length > 0
                  ? 'No additional technicians are currently available for this ticket.'
                  : 'No active technicians are available right now.'}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-semibold">Available Technicians</p>
                <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
                  {availableTechnicians.map((technician) => {
                    const selected = selectedTechIds.includes(technician.id);
                    const skills = technician.skills?.length ? technician.skills : ['no skills'];

                    return (
                      <button
                        key={technician.id}
                        type="button"
                        onClick={() => toggleTechnician(technician.id)}
                        className={`w-full rounded-xl border p-4 text-left transition-all ${
                          selected
                            ? 'border-primary bg-primary/10 shadow-sm'
                            : 'border-base-300 bg-base-100 hover:border-primary/40 hover:bg-base-200/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold">{technician.name}</span>
                              {technician.recommended && (
                                <span className="badge badge-success badge-sm">Best Match</span>
                              )}
                              <span className="badge badge-outline badge-sm">
                                Score {technician.matchScore}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-base-content/60">{technician.email}</p>
                          </div>
                          <span className="text-xs text-base-content/50">
                            {technician.activeTicketCount} active
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {skills.map((skill) => (
                            <span
                              key={skill}
                              className={`badge badge-sm ${skill === 'no skills' ? 'badge-ghost' : 'badge-outline'}`}
                            >
                              {skill}
                            </span>
                          ))}
                        </div>

                        <div className="mt-3 space-y-1">
                          {technician.reasons?.map((reason) => (
                            <p key={reason} className="text-xs text-base-content/60">
                              {reason}
                            </p>
                          ))}
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
            disabled={selectedTechIds.length === 0 || loading || loadingTechs}
          >
            {loading ? 'Assigning...' : assignedTechIds.length > 0 ? 'Add Technicians' : 'Assign Technicians'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AssignTechnicianModal;
