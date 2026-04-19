import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SimpleAuthTest = () => {
    const [token, setToken] = useState('');
    const [testResults, setTestResults] = useState('');

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        setToken(storedToken || 'No token found');
    }, []);

    const testNotificationAPI = async () => {
        setTestResults('Testing notification preferences API...');
        
        try {
            // Test with the current axios configuration (which should include the auth header)
            const response = await axios.get('/api/notification-preferences');
            setTestResults(`SUCCESS: Got response with status ${response.status}\nData: ${JSON.stringify(response.data, null, 2)}`);
        } catch (error) {
            let errorMessage = `ERROR: ${error.response?.status || 'No status'}\n`;
            
            if (error.response) {
                errorMessage += `Status: ${error.response.status}\n`;
                errorMessage += `Status Text: ${error.response.statusText}\n`;
                errorMessage += `Data: ${JSON.stringify(error.response.data, null, 2)}\n`;
                errorMessage += `Headers: ${JSON.stringify(error.response.headers, null, 2)}`;
            } else if (error.request) {
                errorMessage += `Request was made but no response received\n`;
                errorMessage += `Request: ${error.request}`;
            } else {
                errorMessage += `Error message: ${error.message}\n`;
                errorMessage += `Error config: ${JSON.stringify(error.config, null, 2)}`;
            }
            
            setTestResults(errorMessage);
            console.error('API test error:', error);
        }
    };

    const testWithManualToken = async () => {
        setTestResults('Testing with manual token...');
        
        try {
            const storedToken = localStorage.getItem('token');
            if (!storedToken) {
                setTestResults('ERROR: No token found in localStorage');
                return;
            }
            
            const response = await axios.get('/api/notification-preferences', {
                headers: {
                    'Authorization': `Bearer ${storedToken}`
                }
            });
            setTestResults(`MANUAL SUCCESS: Got response with status ${response.status}\nData: ${JSON.stringify(response.data, null, 2)}`);
        } catch (error) {
            let errorMessage = `MANUAL ERROR: ${error.response?.status || 'No status'}\n`;
            
            if (error.response) {
                errorMessage += `Status: ${error.response.status}\n`;
                errorMessage += `Status Text: ${error.response.statusText}\n`;
                errorMessage += `Data: ${JSON.stringify(error.response.data, null, 2)}`;
            } else {
                errorMessage += `Error message: ${error.message}`;
            }
            
            setTestResults(errorMessage);
            console.error('Manual API test error:', error);
        }
    };

    const decodeToken = () => {
        try {
            const storedToken = localStorage.getItem('token');
            if (!storedToken) {
                setTestResults('ERROR: No token found in localStorage');
                return;
            }
            
            const parts = storedToken.split('.');
            if (parts.length !== 3) {
                setTestResults('ERROR: Invalid token format');
                return;
            }
            
            const payload = JSON.parse(atob(parts[1]));
            setTestResults(`TOKEN PAYLOAD:\n${JSON.stringify(payload, null, 2)}`);
        } catch (error) {
            setTestResults(`ERROR decoding token: ${error.message}`);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Simple Auth Test</h2>
            
            <div className="bg-base-200 p-4 rounded-lg mb-4">
                <h3 className="font-semibold mb-2">Token Status</h3>
                <p className="text-sm"><strong>Token:</strong> {token.substring(0, 100)}...</p>
            </div>

            <div className="bg-base-200 p-4 rounded-lg mb-4">
                <h3 className="font-semibold mb-2">Tests</h3>
                <div className="flex gap-2 mb-2 flex-wrap">
                    <button onClick={testNotificationAPI} className="btn btn-primary btn-sm">
                        Test Notification API
                    </button>
                    <button onClick={testWithManualToken} className="btn btn-secondary btn-sm">
                        Test with Manual Token
                    </button>
                    <button onClick={decodeToken} className="btn btn-accent btn-sm">
                        Decode Token
                    </button>
                </div>
                <pre className="text-xs bg-base-300 p-2 rounded overflow-auto max-h-96 whitespace-pre-wrap">
                    {testResults}
                </pre>
            </div>
        </div>
    );
};

export default SimpleAuthTest;
