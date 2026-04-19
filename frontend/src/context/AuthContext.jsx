import React, { createContext, useState, useEffect, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    const clearSession = () => {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        setToken(null);
        setUser(null);
    };

    const applyToken = (nextToken) => {
        const decoded = jwtDecode(nextToken);
        const currentTime = Date.now() / 1000;

        if (decoded.exp < currentTime) {
            throw new Error('Token expired');
        }

        setUser({
            id: decoded.id || decoded.userId || '',
            username: decoded.username || decoded.sub || '',
            email: decoded.email || '',
            name: decoded.name || decoded.username || 'User',
            roles: Array.isArray(decoded.roles) ? decoded.roles : [],
            picture: decoded.picture || '',
            authProvider: decoded.authProvider || 'LOCAL'
        });

        axios.defaults.headers.common['Authorization'] = `Bearer ${nextToken}`;
    };

    useEffect(() => {
        if (token) {
            try {
                applyToken(token);
            } catch (_error) {
                clearSession();
            }
        } else {
            clearSession();
        }

        setLoading(false);
    }, [token]);

    const login = (newToken) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
    };

    const logout = () => {
        clearSession();
    };

    const getDashboardPath = () => {
        if (!user || !user.roles || user.roles.length === 0) {
            return '/login';
        }

        const roles = user.roles.map((role) => role.replace('ROLE_', ''));

        if (roles.includes('ADMIN')) return '/admin/dashboard';
        if (roles.includes('BOOKING_MANAGER')) return '/admin/bookings';
        if (roles.includes('TICKET_MANAGER')) return '/admin/tickets';
        if (roles.includes('RESOURCE_MANAGER')) return '/admin/resources';
        if (roles.includes('LECTURER')) return '/lecturer/dashboard';
        if (roles.includes('TECHNICIAN')) return '/technician/dashboard';
        if (roles.includes('NON_ACADEMIC')) return '/staff/dashboard';
        return '/student/dashboard';
    };

    const hasRole = (role) => {
        if (!user?.roles) return false;
        const normalizedRole = role.startsWith('ROLE_') ? role : `ROLE_${role}`;
        return user.roles.includes(role) || user.roles.includes(normalizedRole);
    };

    const hasAnyRole = (roles) => {
        if (!roles) return true;
        return roles.some((role) => hasRole(role));
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                loading,
                login,
                logout,
                hasRole,
                hasAnyRole,
                getDashboardPath
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
