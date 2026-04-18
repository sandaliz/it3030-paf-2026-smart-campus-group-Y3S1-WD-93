import React, { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import { userService } from '../../services/userService';

const AssignTechnicianModal = ({ isOpen, onClose, onAssign, loading }) => {
  const [selectedTech, setSelectedTech] = useState('');
  const [technicians, setTechnicians] = useState([]);
  const [loadingTechs, setLoadingTechs] = useState(true);
  const [hoveredTech, setHoveredTech] = useState(null);

  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        setLoadingTechs(true);
        const techniciansData = await userService.getTechnicians();
        setTechnicians(techniciansData);
      } catch (error) {
        console.error('Error fetching technicians:', error);
      } finally {
        setLoadingTechs(false);
      }
    };

    if (isOpen) {
      fetchTechnicians();
    }

    // Reset selection when modal opens
    if (!isOpen) setSelectedTech('');
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedTech) {
      const tech = technicians.find((t) => t.id === selectedTech);
      onAssign(selectedTech, tech.name);
    }
  };

  // Generate avatar initials from name
  const getInitials = (name = '') =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  // Deterministic avatar color based on name (cycles through Nord accent palette)
  const avatarColors = [
    'bg-primary text-primary-content',
    'bg-secondary text-secondary-content',
    'bg-accent text-accent-content',
    'bg-info text-info-content',
    'bg-success text-success-content',
  ];
  const getAvatarColor = (name = '') => {
    const idx = name.charCodeAt(0) % avatarColors.length;
    return avatarColors[idx];
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign Technician" size="md">
      {/* Header description */}
      <p className="text-sm text-base-content/60 mb-5 -mt-1">
        Select a technician from the list below to assign them to this task.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Technician list */}
        <div className="form-control">
          <label className="label pb-2">
            <span className="label-text font-semibold tracking-wide text-xs uppercase text-base-content/50">
              Available Technicians
            </span>
            {!loadingTechs && technicians.length > 0 && (
              <span className="label-text-alt badge badge-ghost badge-sm">
                {technicians.length} available
              </span>
            )}
          </label>

          {/* Scrollable technician list */}
          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1 custom-scroll">
            {loadingTechs ? (
              /* Skeleton loaders */
              Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl bg-base-200 animate-pulse"
                >
                  <div className="w-10 h-10 rounded-full bg-base-300 shrink-0" />
                  <div className="flex flex-col gap-2 flex-1">
                    <div className="h-3 w-28 bg-base-300 rounded" />
                    <div className="h-2.5 w-40 bg-base-300 rounded" />
                  </div>
                </div>
              ))
            ) : technicians.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-base-content/40">
                {/* Empty state icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-10 h-10 opacity-30"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 20h5v-1a4 4 0 00-5.196-3.796M9 20H4v-1a4 4 0 015.196-3.796M15 7a4 4 0 11-8 0 4 4 0 018 0zm6 4a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="text-sm font-medium">No technicians available</span>
              </div>
            ) : (
              technicians.map((tech) => {
                const isSelected = selectedTech === tech.id;
                const isHovered = hoveredTech === tech.id;

                return (
                  <label
                    key={tech.id}
                    htmlFor={`tech-${tech.id}`}
                    onMouseEnter={() => setHoveredTech(tech.id)}
                    onMouseLeave={() => setHoveredTech(null)}
                    className={`
                      flex items-center gap-3 p-3 rounded-xl cursor-pointer
                      border transition-all duration-150
                      ${
                        isSelected
                          ? 'bg-primary/10 border-primary shadow-sm'
                          : isHovered
                          ? 'bg-base-200 border-base-300'
                          : 'bg-base-100 border-base-200'
                      }
                    `}
                  >
                    {/* Hidden radio */}
                    <input
                      type="radio"
                      id={`tech-${tech.id}`}
                      name="technician"
                      value={tech.id}
                      className="sr-only"
                      onChange={(e) => setSelectedTech(e.target.value)}
                    />

                    {/* Avatar */}
                    <div
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center
                        text-sm font-bold shrink-0 select-none
                        ${getAvatarColor(tech.name)}
                      `}
                    >
                      {getInitials(tech.name)}
                    </div>

                    {/* Info */}
                    <div className="flex flex-col min-w-0 flex-1">
                      <span
                        className={`font-semibold text-sm truncate ${
                          isSelected ? 'text-primary' : 'text-base-content'
                        }`}
                      >
                        {tech.name}
                      </span>
                      <span className="text-xs text-base-content/50 truncate">{tech.email}</span>
                    </div>

                    {/* Selected check */}
                    <div
                      className={`
                        w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0
                        transition-all duration-150
                        ${
                          isSelected
                            ? 'border-primary bg-primary'
                            : 'border-base-300 bg-transparent'
                        }
                      `}
                    >
                      {isSelected && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-3 h-3 text-primary-content"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414L8.414 15 3.293 9.879a1 1 0 011.414-1.414L8.414 12.172l6.879-6.879a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </div>

        {/* Selected summary pill */}
        {selectedTech && (() => {
          const tech = technicians.find((t) => t.id === selectedTech);
          return tech ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 text-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 text-primary shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5.121 17.804A8 8 0 1118.88 6.196M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="text-base-content/70">Assigning to</span>
              <span className="font-semibold text-primary truncate">{tech.name}</span>
            </div>
          ) : null;
        })()}

        {/* Divider */}
        <div className="divider my-0" />

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            className="btn btn-ghost flex-1 rounded-xl"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary flex-1 rounded-xl gap-2"
            disabled={!selectedTech || loading}
          >
            {loading ? (
              <>
                <span className="loading loading-spinner loading-sm" />
                Assigning…
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Assign Technician
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AssignTechnicianModal;