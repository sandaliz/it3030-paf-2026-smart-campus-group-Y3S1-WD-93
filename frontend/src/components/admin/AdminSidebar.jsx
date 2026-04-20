import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const AdminSidebar = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const menuItems = [
    {
      path: '/admin/dashboard',
      label: 'Admin Dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l8-8 8 8M5 10v10a1 1 0 001 1h3v-6h4v6h3a1 1 0 001-1V10" />
        </svg>
      ),
    },
    {
      path: '/admin/users',
      label: 'User Management',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5V4H2v16h5m10 0v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2m12 0H7m8-10a4 4 0 11-8 0 4 4 0 018 0z" />
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
      path: '/admin/calendar',
      label: 'Booking Calendar',
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
    <div className="w-64 bg-base-100 h-screen shadow-lg sticky top-0">
      <div className="p-4">
        <h2 className="text-lg font-bold mb-6 text-base-content text-center">Admin Panel</h2>
        
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
