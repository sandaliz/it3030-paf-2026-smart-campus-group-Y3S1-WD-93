import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * A wrapper component that protects routes based on authentication and roles.
 */
const ProtectedRoute = ({ children, requiredRoles }) => {
    const { user, loading, hasAnyRole } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        );
    }

    // 1. Not logged in -> Redirect to login page
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 2. Logged in but doesn't have required roles -> Redirect to home or unauthorized page
    if (requiredRoles && !hasAnyRole(requiredRoles)) {
        return <Navigate to="/" replace />;
    }

    // 3. Authorized -> Render the component
    return children;
};

export default ProtectedRoute;
