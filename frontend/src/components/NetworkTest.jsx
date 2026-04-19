import React, { useState } from 'react';
import axios from 'axios';

const NetworkTest = () => {
    const [testResults, setTestResults] = useState('');

    const testPingAPI = async () => {
        setTestResults('Testing ping API...');
        try {
            const response = await axios.get('/api/ping');
            setTestResults(`Ping API SUCCESS: ${JSON.stringify(response.data)}`);
        } catch (error) {
            setTestResults(`Ping API ERROR: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
        }
    };

    const testNotificationAPI = async () => {
        setTestResults('Testing notification API...');
        try {
            const response = await axios.get('/api/notification-preferences');
            setTestResults(`Notification API SUCCESS: ${JSON.stringify(response.data)}`);
        } catch (error) {
            setTestResults(`Notification API ERROR: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
        }
    };

    const testDirectBackend = async () => {
        setTestResults('Testing direct backend connection...');
        try {
            const response = await axios.get('http://localhost:8080/api/ping');
            setTestResults(`Direct Backend SUCCESS: ${JSON.stringify(response.data)}`);
        } catch (error) {
            setTestResults(`Direct Backend ERROR: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
        }
    };

    const clearToken = () => {
        localStorage.removeItem('token');
        setTestResults('Token cleared. Please refresh and log in again.');
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Network Test</h2>
            
            <div className="bg-base-200 p-4 rounded-lg mb-4">
                <h3 className="font-semibold mb-2">Network Tests</h3>
                <div className="flex gap-2 mb-2 flex-wrap">
                    <button onClick={testPingAPI} className="btn btn-primary btn-sm">
                        Test Ping API
                    </button>
                    <button onClick={testNotificationAPI} className="btn btn-secondary btn-sm">
                        Test Notification API
                    </button>
                    <button onClick={testDirectBackend} className="btn btn-accent btn-sm">
                        Test Direct Backend
                    </button>
                    <button onClick={clearToken} className="btn btn-error btn-sm">
                        Clear Token & Re-login
                    </button>
                </div>
                <pre className="text-xs bg-base-300 p-2 rounded overflow-auto max-h-96 whitespace-pre-wrap">
                    {testResults}
                </pre>
            </div>

            <div className="bg-base-200 p-4 rounded-lg mb-4">
                <h3 className="font-semibold mb-2">Network Error Fix</h3>
                <p className="text-sm mb-2">
                    The "Network Error" is caused by JWT authentication issues. To fix:
                </p>
                <ol className="text-sm list-decimal list-inside space-y-1">
                    <li>Click "Clear Token & Re-login" above</li>
                    <li>Log out from the application</li>
                    <li>Log back in using Google OAuth</li>
                    <li>This will generate a new JWT token with proper authentication</li>
                    <li>The notification preferences will then work correctly</li>
                </ol>
            </div>
        </div>
    );
};

export default NetworkTest;
