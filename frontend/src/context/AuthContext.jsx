import React, { createContext, useState, useEffect, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            try {
                const decoded = jwtDecode(token);
                // Check if token is expired
                const currentTime = Date.now() / 1000;
                if (decoded.exp < currentTime) {
                    logout();
                } else {
                    const userRoles = Array.isArray(decoded.roles) ? decoded.roles : [];
                    console.log('DEBUG: JWT decoded:', decoded);
                    console.log('DEBUG: User roles from token:', userRoles);
                    console.log('DEBUG: Email:', decoded.sub || decoded.email);
                    
                    setUser({
                        email: decoded.sub || decoded.email || '',
                        name: decoded.name || 'User',
                        roles: userRoles,
                        picture: decoded.picture || ''
                    });
                    // Set default axios header
                    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    console.log('User session restored:', decoded.sub);
                }
            } catch (error) {
                console.error('Invalid or expired token', error);
                logout();
            }
        } else {
            delete axios.defaults.headers.common['Authorization'];
            setUser(null);
        }
        setLoading(false);
    }, [token]);

    const login = (newToken) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    const getDashboardPath = () => {
        console.log('DEBUG: getDashboardPath called, user:', user);
        
        if (!user || !user.roles || user.roles.length === 0) {
            console.log('DEBUG: No user or roles, returning login page');
            return '/login';
        }
        
        const roles = user.roles.map(r => r.replace('ROLE_', ''));
        console.log('DEBUG: Normalized roles:', roles);
        
        // Use priority order
        if (roles.includes('ADMIN')) {
            console.log('DEBUG: Found ADMIN role, returning admin dashboard');
            return '/admin/dashboard';
        }
        if (roles.includes('BOOKING_MANAGER')) {
            console.log('DEBUG: Found BOOKING_MANAGER role, returning admin bookings');
            return '/admin/bookings';
        }
        if (roles.includes('TICKET_MANAGER')) {
            console.log('DEBUG: Found TICKET_MANAGER role, returning tickets');
            return '/tickets';
        }
        if (roles.includes('RESOURCE_MANAGER')) {
            console.log('DEBUG: Found RESOURCE_MANAGER role, returning admin resources');
            return '/admin/resources';
        }
        if (roles.includes('LECTURER')) {
            console.log('DEBUG: Found LECTURER role, returning lecturer dashboard');
            return '/lecturer/dashboard';
        }
        if (roles.includes('TECHNICIAN')) {
            console.log('DEBUG: Found TECHNICIAN role, returning technician dashboard');
            return '/technician/dashboard';
        }
        if (roles.includes('NON_ACADEMIC')) {
            console.log('DEBUG: Found NON_ACADEMIC role, returning staff dashboard');
            return '/staff/dashboard';
        }
        
        console.log('DEBUG: No matching roles found, returning resources page as fallback');
        return '/resources';
    };

    const hasRole = (role) => {
        if (!user?.roles) return false;
        const normalizedRole = role.startsWith('ROLE_') ? role : `ROLE_${role}`;
        return user.roles.includes(role) || user.roles.includes(normalizedRole);
    };

    const hasAnyRole = (roles) => {
        if (!roles) return true;
        return roles.some(role => hasRole(role));
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            token, 
            loading, 
            login, 
            logout, 
            hasRole, 
            hasAnyRole,
            getDashboardPath 
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
