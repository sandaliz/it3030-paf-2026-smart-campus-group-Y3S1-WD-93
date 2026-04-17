import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthCallback = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        const redirectPath = params.get('redirect') || '/';

        if (token) {
            login(token);
            navigate(redirectPath, { replace: true });
        } else {
            console.error('No token found in callback URL');
            navigate('/login', { replace: true });
        }
    }, [login, navigate, location]);

    return (
        <div className="text-center">
            <span className="loading loading-ring loading-lg text-primary scale-150 mb-4"></span>
            <h2 className="text-xl font-semibold animate-pulse">Completing sign in...</h2>
            <p className="text-base-content/60">Finalizing your authentication session.</p>
        </div>
    );
};

export default AuthCallback;
