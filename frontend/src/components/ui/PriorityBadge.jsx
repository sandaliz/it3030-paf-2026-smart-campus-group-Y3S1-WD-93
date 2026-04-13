import React from 'react';

const PriorityBadge = ({ priority }) => {
  const config = {
    URGENT: { color: 'error', label: 'Urgent', icon: '🔴' },
    HIGH: { color: 'warning', label: 'High', icon: '🟠' },
    MEDIUM: { color: 'info', label: 'Medium', icon: '🔵' },
    LOW: { color: 'success', label: 'Low', icon: '🟢' }
  };

  const { color, label, icon } = config[priority] || { color: 'ghost', label: priority, icon: '⚪' };

  return (
    <div className={`badge badge-${color} badge-outline gap-1 badge-sm`}>
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  );
};

export default PriorityBadge;