import React, { useEffect, useState } from 'react';
import Modal from '../../components/ui/Modal';
import { ticketService } from '../../services/ticketService';

const AssignTechnicianModal = ({ isOpen, ticket, onClose, onAssign, loading }) => {
  const [selectedTech, setSelectedTech] = useState('');
  const [technicians, setTechnicians] = useState([]);
  const [loadingTechs, setLoadingTechs] = useState(false);

  useEffect(() => {
    const fetchTechnicians = async () => {
      if (!ticket?.id || !isOpen) {
        return;
      }

      try {
        setLoadingTechs(true);
        const data = await ticketService.getRecommendedTechnicians(ticket.id);
        setTechnicians(data);
      } catch (error) {
        console.error('Error fetching technician recommendations:', error);
        setTechnicians([]);
      } finally {
        setLoadingTechs(false);
      }
    };

    if (isOpen) {
      fetchTechnicians();
    } else {
      setSelectedTech('');
      setTechnicians([]);
    }
  }, [isOpen, ticket?.id]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!selectedTech) {
      return;
    }

    const tech = technicians.find((item) => item.id === selectedTech);
    onAssign(selectedTech, tech);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign Technician" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl border border-info/20 bg-info/5 p-4 text-sm">
          <p className="font-semibold">Ticket #{ticket?.id}</p>
          <p className="text-base-content/70 mt-1">{ticket?.title}</p>
          <p className="text-base-content/60 mt-2">
            Recommendations are ranked by skill match and current workload.
          </p>
        </div>

        {loadingTechs ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-24 rounded-xl border border-base-300 bg-base-200/50 animate-pulse" />
            ))}
          </div>
        ) : technicians.length === 0 ? (
          <div className="alert">No active technicians are available right now.</div>
        ) : (
          <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
            {technicians.map((technician) => {
              const selected = selectedTech === technician.id;
              const skills = technician.skills?.length ? technician.skills : ['no skills'];

              return (
                <button
                  key={technician.id}
                  type="button"
                  onClick={() => setSelectedTech(technician.id)}
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
        )}

        <div className="flex gap-3 pt-2">
          <button type="button" className="btn btn-ghost flex-1" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary flex-1" disabled={!selectedTech || loading}>
            {loading ? 'Assigning...' : 'Assign Technician'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AssignTechnicianModal;
