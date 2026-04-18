import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const AdminSidebar = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const menuItems = [
    {
      path: '/admin/ticket-analytics',
      label: 'Ticket Analytics',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 10l2-2m-2 2l-2-2" />
        </svg>
      ),
    },
    {
      path: '/admin/bookings',
      label: 'Booking Management',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      path: '/admin/resources',
      label: 'Resource Management',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21l-7-7-7m14 0H5a2 2 0 00-2-2v14a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2z" />
        </svg>
      ),
    },
    {
      path: '/admin/tickets',
      label: 'Ticket Management',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H7a2 2 0 00-2-2v14a2 2 0 002 2h14a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="w-64 bg-base-100 min-h-screen shadow-lg">
      <div className="p-4">
        <h2 className="text-lg font-bold mb-6 text-base-content">Admin Panel</h2>
        
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                isActive(item.path)
                  ? 'bg-primary text-primary-content'
                  : 'hover:bg-base-200 text-base-content'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default AdminSidebar;
