import React from 'react';

const StatusBadge = ({ status }) => {
  const config = {
    OPEN: { color: 'warning', label: 'Open', icon: '🟡' },
    IN_PROGRESS: { color: 'info', label: 'In Progress', icon: '🔵' },
    RESOLVED: { color: 'success', label: 'Resolved', icon: '✅' },
    CLOSED: { color: 'neutral', label: 'Closed', icon: '🔘' },
    REJECTED: { color: 'error', label: 'Rejected', icon: '❌' }
  };

  const { color, label, icon } = config[status] || { color: 'ghost', label: status, icon: '📋' };

  return (
    <div className={`badge badge-${color} gap-1 badge-sm`}>
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  );
};

export default StatusBadge;