export const getAssignedTechnicianIds = (ticket) => {
  if (!ticket) {
    return [];
  }

  if (Array.isArray(ticket.assignedTechnicianIds)) {
    return ticket.assignedTechnicianIds.filter(Boolean);
  }

  return [];
};

export const getAssignedTechnicianNames = (ticket) => {
  if (!ticket) {
    return [];
  }

  if (Array.isArray(ticket.assignedTechnicianNames) && ticket.assignedTechnicianNames.length > 0) {
    return ticket.assignedTechnicianNames.filter(Boolean);
  }

  const summary = ticket.assignedToName || ticket.assignedTo;
  if (typeof summary !== 'string' || !summary.trim()) {
    return [];
  }

  return summary
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);
};

export const formatAssignedTechnicians = (ticket, fallback = 'Unassigned') => {
  const names = getAssignedTechnicianNames(ticket);
  return names.length > 0 ? names.join(', ') : fallback;
};
