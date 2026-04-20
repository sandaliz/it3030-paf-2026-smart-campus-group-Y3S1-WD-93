import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../notifications/NotificationBell';
import NotificationPanel from '../notifications/NotificationPanel';

const Header = () => {
    const { user, logout } = useAuth();
    const [theme, setTheme] = useState(() => {
        const savedTheme = window.localStorage.getItem('theme');
        return savedTheme === 'night' ? 'night' : 'nord';
    });
    const location = useLocation();

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        window.localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(theme === 'nord' ? 'night' : 'nord');
    };

    const isActive = (path) => {
        return location.pathname === path;
    };

    return (
        <header className="bg-base-100 shadow-lg border-b border-base-300 pt-4">
            <div className="container mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <Link to="/" className="text-3xl font-bold text-primary hover:text-primary-focus transition-colors">
                            UniOps
                        </Link>
                    </div>
                    
                    <div className="flex items-center gap-6">
                        {/* Admin Dashboard Link */}
                        {user && (user.roles && (user.roles.includes('ROLE_ADMIN') || user.roles.includes('ADMIN'))) && (
                            <Link 
                                to="/admin/dashboard" 
                                className={`text-lg font-medium hover:text-primary transition-colors ${isActive('/admin/dashboard') ? 'text-primary' : 'text-base-content/70'}`}
                            >
                                Admin Dashboard
                            </Link>
                        )}
                        
                        {(user && (user.roles && (user.roles.includes('ROLE_STUDENT') || user.roles.includes('ROLE_LECTURER') || user.roles.includes('ROLE_NON_ACADEMIC') || user.roles.includes('STUDENT') || user.roles.includes('LECTURER') || user.roles.includes('NON_ACADEMIC')))) && (
                            <>
                                <Link 
                                    to="/resources" 
                                    className={`text-lg font-medium hover:text-primary transition-colors ${isActive('/resources') ? 'text-primary' : 'text-base-content/70'}`}
                                >
                                    Resources
                                </Link>
                                <Link 
                                    to="/bookings" 
                                    className={`text-lg font-medium hover:text-primary transition-colors ${isActive('/bookings') ? 'text-primary' : 'text-base-content/70'}`}
                                >
                                    Bookings
                                </Link>
                                <Link 
                                    to="/calendar" 
                                    className={`text-lg font-medium hover:text-primary transition-colors ${isActive('/calendar') ? 'text-primary' : 'text-base-content/70'}`}
                                >
                                    Calendar
                                </Link>
                                <Link 
                                    to="/tickets" 
                                    className={`text-lg font-medium hover:text-primary transition-colors ${isActive('/tickets') ? 'text-primary' : 'text-base-content/70'}`}
                                >
                                    Incidents
                                </Link>
                            </>
                        )}
                        
                        {/* Role-Specific Dashboards */}
                        {user && (
                            <div className="dropdown dropdown-end">
                                <div tabIndex={0} role="button" className="btn btn-ghost btn-outline border-primary/30 hover:border-primary">
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                    </svg>
                                    Dashboards
                                </div>
                                <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 p-2 shadow-xl bg-base-100 rounded-box w-64 z-[100] border border-base-300">
                                    {(() => {
                                        // Ensure roles is always an array for safe mapping
                                        const roles = Array.isArray(user.roles) 
                                            ? user.roles.map(r => String(r).replace('ROLE_', '')) 
                                            : [];
                                        
                                        // Priority-based single link
                                        let path = "/student/dashboard";
                                        let label = "Student Dashboard";
                                        
                                        if (roles.includes('ADMIN')) {
                                            path = "/admin/dashboard";
                                            label = "Admin Dashboard";
                                        } else if (roles.includes('BOOKING_MANAGER')) {
                                            path = "/admin/bookings";
                                            label = "Booking Management";
                                        } else if (roles.includes('TICKET_MANAGER')) {
                                            path = "/admin/tickets";
                                            label = "Ticket Analytics";
                                        } else if (roles.includes('TECHNICIAN')) {
                                            path = "/technician/dashboard";
                                            label = "Technician Dashboard";
                                        } else if (roles.includes('RESOURCE_MANAGER')) {
                                            path = "/admin/resources";
                                            label = "Resource Management";
                                        } else if (roles.includes('LECTURER')) {
                                            path = "/lecturer/dashboard";
                                            label = "Lecturer Dashboard";
                                        } else if (roles.includes('NON_ACADEMIC')) {
                                            path = "/staff/dashboard";
                                            label = "Staff Dashboard";
                                        }

                                        return (
                                            <li>
                                                <Link to={path} className={isActive(path) ? 'active' : ''}>
                                                    {label}
                                                </Link>
                                            </li>
                                        );
                                    })()}
                                </ul>
                            </div>
                        )}
                        
                        <div className="flex items-center gap-4 ml-8">
                            {/* Notification Bell - Available for all authenticated users */}
                            {user && (
                                <div className="dropdown dropdown-end">
                                    <div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
                                        <NotificationBell />
                                    </div>
                                    <div tabIndex={0} className="dropdown-content mt-3 p-0 shadow-xl bg-base-100 rounded-box w-80 z-[100] border border-base-300">
                                        <NotificationPanel />
                                    </div>
                                </div>
                            )}
                            
                            <button className="btn btn-outline btn-circle border-base-content/30 hover:border-primary hover:bg-base-200" onClick={toggleTheme}>
                                {theme === 'nord' ? (
                                <svg className="w-5 h-5 text-base-content" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25c0 5.385 4.365 9.75 9.75 9.75 2.896 0 5.498-1.255 7.291-3.247A9.724 9.724 0 0118 18.75a9.733 9.733 0 01-3.748.748 9.753 9.753 0 00-6.5-6.5z"/>
                                </svg>
                            ) : (
                                <svg className="w-5 h-5 text-base-content" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            )}
                            </button>
                            
                            <div className="divider divider-horizontal h-8"></div>
                            
                            {user && (
                                <div className="dropdown dropdown-end">
                                    <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
                                        <div className="w-10 rounded-full">
                                            <img 
                                                alt="User" 
                                                src={user?.picture || 'https://img.icons8.com/clouds/200/user.png'} 
                                            />
                                        </div>
                                    </div>
                                    <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-52">
                                        <li className="menu-title">{user?.name}</li>
                                        <li><p className="text-xs text-base-content/60">{user?.email}</p></li>
                                        <li><div className="divider"></div></li>
                                        <li>
                                            <Link to="/profile" className="menu-item">Profile</Link>
                                        </li>
                                        <li>
                                            <Link to="/settings/notifications" className="menu-item">
                                                <div className="flex items-center gap-2">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                                    </svg>
                                                    Notification Settings
                                                </div>
                                            </Link>
                                        </li>
                                        <li>
                                            <button onClick={logout} className="menu-item text-error">
                                                Sign Out
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
