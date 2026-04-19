import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TestAuth = () => {
    const [authStatus, setAuthStatus] = useState('Checking...');
    const [token, setToken] = useState('');
    const [user, setUser] = useState(null);
    const [apiTest, setApiTest] = useState('');

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = () => {
        const storedToken = localStorage.getItem('token');
        setToken(storedToken || 'No token found');
        
        if (storedToken) {
            try {
                const decoded = JSON.parse(atob(storedToken.split('.')[1]));
                setUser(decoded);
                setAuthStatus('Authenticated');
            } catch (error) {
                setAuthStatus('Invalid token');
                console.error('Token decode error:', error);
            }
        } else {
            setAuthStatus('No token');
        }
    };

    const testAPI = async () => {
        setApiTest('Testing...');
        try {
            const response = await axios.get('/api/notification-preferences');
            setApiTest(`Success: ${JSON.stringify(response.data, null, 2)}`);
        } catch (error) {
            setApiTest(`Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
            console.error('API test error:', error);
        }
    };

    const testOtherAPI = async () => {
        setApiTest('Testing other API...');
        try {
            const response = await axios.get('/api/notifications');
            setApiTest(`Other API Success: ${JSON.stringify(response.data, null, 2)}`);
        } catch (error) {
            setApiTest(`Other API Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
            console.error('Other API test error:', error);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Authentication Test</h2>
            
            <div className="bg-base-200 p-4 rounded-lg mb-4">
                <h3 className="font-semibold mb-2">Auth Status: {authStatus}</h3>
                <div className="text-sm">
                    <p><strong>Token:</strong> {token.substring(0, 50)}...</p>
                    {user && (
                        <div>
                            <p><strong>User ID:</strong> {user.userId || user.sub}</p>
                            <p><strong>Username:</strong> {user.username || user.sub}</p>
                            <p><strong>Email:</strong> {user.email}</p>
                            <p><strong>Roles:</strong> {JSON.stringify(user.roles)}</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-base-200 p-4 rounded-lg mb-4">
                <h3 className="font-semibold mb-2">API Test</h3>
                <div className="flex gap-2 mb-2">
                    <button 
                        onClick={testAPI}
                        className="btn btn-primary"
                    >
                        Test Notification Preferences API
                    </button>
                    <button 
                        onClick={testOtherAPI}
                        className="btn btn-secondary"
                    >
                        Test Other API
                    </button>
                </div>
                <pre className="text-xs bg-base-300 p-2 rounded overflow-auto max-h-96">
                    {apiTest}
                </pre>
            </div>
        </div>
    );
};

export default TestAuth;
