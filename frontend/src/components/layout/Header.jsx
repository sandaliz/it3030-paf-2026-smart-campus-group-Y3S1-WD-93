import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

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
        <header className="bg-base-100 shadow-lg border-b border-base-300">
            <div className="container mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <Link to="/" className="text-3xl font-bold text-primary hover:text-primary-focus transition-colors">
                            UniOps
                        </Link>
                    </div>
                    
                    <div className="flex items-center gap-6">
                        <Link 
                            to="/resources" 
                            className={`text-lg font-medium hover:text-primary transition-colors ${isActive('/resources') ? 'text-primary' : 'text-base-content/70'}`}
                        >
                            Resources
                        </Link>
                        
                        <Link 
                            to="/tickets" 
                            className={`text-lg font-medium hover:text-primary transition-colors ${isActive('/tickets') ? 'text-primary' : 'text-base-content/70'}`}
                        >
                            Incidents
                        </Link>
                        
                        {user?.roles?.includes('ADMIN') ? (
                            <>
                                <div className="dropdown dropdown-end">
                                    <div tabIndex={0} role="button" className="btn btn-ghost btn-outline">
                                        Admin Dashboard
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7 7" />
                                        </svg>
                                    </div>
                                    <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-52">
                                        <li>
                                            <Link to="/admin/dashboard" className="menu-item">
                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 10l2-2m-2 2l-2-2" />
                                                </svg>
                                                Dashboard Overview
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to="/admin/resources" className="menu-item">
                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21l-7-7-7m14 0H5a2 2 0 00-2-2v14a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2z" />
                                                </svg>
                                                Resource Management
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to="/tickets" className="menu-item">
                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2-2v14a2 2 0 002 2h14a2 2 0 002 2V7a2 2 0 00-2-2z" />
                                                </svg>
                                                Ticket List
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to="/admin/analytics" className="menu-item">
                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H7a2 2 0 00-2-2v14a2 2 0 002 2h14a2 2 0 002 2z" />
                                                </svg>
                                                Ticket Analytics
                                            </Link>
                                        </li>
                                    </ul>
                                </div>
                            </>
                        ) : user?.roles?.includes('TECHNICIAN') ? (
                            <>
                                <Link 
                                    to="/technician/dashboard" 
                                    className={`text-lg font-medium hover:text-primary transition-colors ${isActive('/technician/dashboard') ? 'text-primary' : 'text-base-content/70'}`}
                                >
                                    Technician Dashboard
                                </Link>
                                <Link 
                                    to="/tickets" 
                                    className={`text-lg font-medium hover:text-primary transition-colors ${isActive('/tickets') ? 'text-primary' : 'text-base-content/70'}`}
                                >
                                    My Tickets
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link 
                                    to="/user/dashboard" 
                                    className={`text-lg font-medium hover:text-primary transition-colors ${isActive('/user/dashboard') ? 'text-primary' : 'text-base-content/70'}`}
                                >
                                    User Dashboard
                                </Link>
                                <Link 
                                    to="/user/tickets" 
                                    className={`text-lg font-medium hover:text-primary transition-colors ${isActive('/user/tickets') ? 'text-primary' : 'text-base-content/70'}`}
                                >
                                    My Tickets
                                </Link>
                            </>
                        )}
                        
                        <div className="flex items-center gap-4 ml-8">
                            <button className="btn btn-outline btn-circle border-base-content/30 hover:border-primary hover:bg-base-200" onClick={toggleTheme}>
                                {theme === 'nord' ? (
                                <svg className="w-5 h-5 text-base-content" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25c0 5.385 4.365 9.75 9.75 9.75 2.896 0 5.498-1.255 7.291-3.247A9.724 9.724 0 0118 18.75a9.733 9.733 0 01-3.748.748 9.753 9.753 0 00-6.5-6.5z"/>
                                </svg>
                            ) : (
                                <svg className="w-5 h-5 text-base-content" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m18 0l-6-6m6 6l6-6" />
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
