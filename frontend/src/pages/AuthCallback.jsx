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

        if (token) {
            login(token);
            // Redirect to home or saved location
            navigate('/', { replace: true });
        } else {
            console.error('No token found in callback URL');
            navigate('/login', { replace: true });
        }
    }, [login, navigate, location]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-base-200">
            <span className="loading loading-ring loading-lg text-primary scale-150 mb-4"></span>
            <h2 className="text-xl font-semibold animate-pulse">Authenticating with Google...</h2>
            <p className="text-base-content/60">Finishing your secure login Session</p>
        </div>
    );
};

export default AuthCallback;
