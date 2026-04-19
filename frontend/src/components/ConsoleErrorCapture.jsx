import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ConsoleErrorCapture = () => {
    const [consoleErrors, setConsoleErrors] = useState([]);
    const [networkErrors, setNetworkErrors] = useState([]);
    const [authStatus, setAuthStatus] = useState({});
    const [testResults, setTestResults] = useState('');

    useEffect(() => {
        // Capture console errors
        const originalError = console.error;
        console.error = (...args) => {
            setConsoleErrors(prev => [...prev, {
                timestamp: new Date().toISOString(),
                message: args.join(' '),
                type: 'error'
            }]);
            originalError.apply(console, args);
        };

        // Capture console warnings
        const originalWarn = console.warn;
        console.warn = (...args) => {
            setConsoleErrors(prev => [...prev, {
                timestamp: new Date().toISOString(),
                message: args.join(' '),
                type: 'warning'
            }]);
            originalWarn.apply(console, args);
        };

        // Capture network errors
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            try {
                const response = await originalFetch.apply(window, args);
                if (!response.ok) {
                    setNetworkErrors(prev => [...prev, {
                        timestamp: new Date().toISOString(),
                        url: args[0],
                        status: response.status,
                        statusText: response.statusText,
                        type: 'fetch'
                    }]);
                }
                return response;
            } catch (error) {
                setNetworkErrors(prev => [...prev, {
                    timestamp: new Date().toISOString(),
                    url: args[0],
                    error: error.message,
                    type: 'fetch-error'
                }]);
                throw error;
            }
        };

        // Capture axios errors
        const axiosInterceptor = axios.interceptors.response.use(
            response => response,
            error => {
                setNetworkErrors(prev => [...prev, {
                    timestamp: new Date().toISOString(),
                    url: error.config?.url,
                    method: error.config?.method,
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    data: error.response?.data,
                    message: error.message,
                    type: 'axios-error'
                }]);
                return Promise.reject(error);
            }
        );

        return () => {
            console.error = originalError;
            console.warn = originalWarn;
            window.fetch = originalFetch;
            axios.interceptors.response.eject(axiosInterceptor);
        };
    }, []);

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = () => {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        setAuthStatus({
            hasToken: !!token,
            tokenLength: token ? token.length : 0,
            tokenPreview: token ? token.substring(0, 50) + '...' : 'No token',
            user: user,
            tokenDecoded: token ? tryDecodeToken(token) : null
        });
    };

    const tryDecodeToken = (token) => {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return { error: 'Invalid token format' };
            return JSON.parse(atob(parts[1]));
        } catch (error) {
            return { error: 'Failed to decode token: ' + error.message };
        }
    };

    const testNotificationAPI = async () => {
        setTestResults('Testing notification preferences API...');
        try {
            const response = await axios.get('/api/notification-preferences');
            setTestResults(`SUCCESS: ${JSON.stringify(response.data, null, 2)}`);
        } catch (error) {
            setTestResults(`ERROR: ${error.response?.status} - ${error.response?.data?.message || error.message}\n\nFull Error:\n${JSON.stringify(error, null, 2)}`);
        }
    };

    const testSavePreferences = async () => {
        setTestResults('Testing save preferences...');
        try {
            const testPreferences = {
                bookingApprovedEmail: true,
                bookingApprovedBell: true,
                bookingRejectedEmail: true,
                bookingRejectedBell: true,
                bookingCancelledEmail: true,
                bookingCancelledBell: true,
                ticketAssignedEmail: true,
                ticketAssignedBell: true,
                ticketStatusChangedEmail: true,
                ticketStatusChangedBell: true,
                ticketCommentAddedEmail: true,
                ticketCommentAddedBell: false,
                systemMaintenanceEmail: false,
                systemMaintenanceBell: true
            };
            
            const response = await axios.put('/api/notification-preferences', testPreferences);
            setTestResults(`SAVE SUCCESS: ${JSON.stringify(response.data, null, 2)}`);
        } catch (error) {
            setTestResults(`SAVE ERROR: ${error.response?.status} - ${error.response?.data?.message || error.message}\n\nFull Error:\n${JSON.stringify(error, null, 2)}`);
        }
    };

    const clearErrors = () => {
        setConsoleErrors([]);
        setNetworkErrors([]);
        setTestResults('');
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
    };

    const getFullErrorReport = () => {
        return `=== CONSOLE ERRORS ===\n${consoleErrors.map(e => `[${e.timestamp}] ${e.type.toUpperCase()}: ${e.message}`).join('\n')}\n\n=== NETWORK ERRORS ===\n${networkErrors.map(e => `[${e.timestamp}] ${e.type}: ${e.url || e.error} ${e.status || ''} ${e.statusText || ''}`).join('\n')}\n\n=== AUTH STATUS ===\n${JSON.stringify(authStatus, null, 2)}\n\n=== TEST RESULTS ===\n${testResults}`;
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Console Error Capture</h2>
            
            <div className="bg-base-200 p-4 rounded-lg mb-4">
                <h3 className="font-semibold mb-2">Authentication Status</h3>
                <div className="text-sm space-y-2">
                    <p><strong>Has Token:</strong> {authStatus.hasToken ? 'Yes' : 'No'}</p>
                    <p><strong>Token Length:</strong> {authStatus.tokenLength}</p>
                    <p><strong>Token Preview:</strong> {authStatus.tokenPreview}</p>
                    <p><strong>User:</strong> {JSON.stringify(authStatus.user, null, 2)}</p>
                    <p><strong>Token Decoded:</strong></p>
                    <pre className="bg-base-300 p-2 rounded text-xs overflow-auto">
                        {JSON.stringify(authStatus.tokenDecoded, null, 2)}
                    </pre>
                </div>
            </div>

            <div className="bg-base-200 p-4 rounded-lg mb-4">
                <h3 className="font-semibold mb-2">API Tests</h3>
                <div className="flex gap-2 mb-2 flex-wrap">
                    <button onClick={testNotificationAPI} className="btn btn-primary btn-sm">
                        Test Get Preferences
                    </button>
                    <button onClick={testSavePreferences} className="btn btn-secondary btn-sm">
                        Test Save Preferences
                    </button>
                    <button onClick={clearErrors} className="btn btn-accent btn-sm">
                        Clear Errors
                    </button>
                    <button onClick={() => copyToClipboard(getFullErrorReport())} className="btn btn-info btn-sm">
                        Copy Full Report
                    </button>
                </div>
                <pre className="text-xs bg-base-300 p-2 rounded overflow-auto max-h-96 whitespace-pre-wrap">
                    {testResults}
                </pre>
            </div>

            <div className="bg-base-200 p-4 rounded-lg mb-4">
                <h3 className="font-semibold mb-2">Console Errors ({consoleErrors.length})</h3>
                <div className="max-h-64 overflow-auto">
                    {consoleErrors.map((error, index) => (
                        <div key={index} className={`text-xs p-2 mb-1 rounded ${error.type === 'error' ? 'bg-error/10 text-error' : 'bg-warning/10 text-warning'}`}>
                            <span className="font-mono">[{error.timestamp}]</span> {error.message}
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-base-200 p-4 rounded-lg mb-4">
                <h3 className="font-semibold mb-2">Network Errors ({networkErrors.length})</h3>
                <div className="max-h-64 overflow-auto">
                    {networkErrors.map((error, index) => (
                        <div key={index} className="text-xs p-2 mb-1 rounded bg-error/10 text-error">
                            <span className="font-mono">[{error.timestamp}]</span> {error.type}: {error.url || error.error}
                            {error.status && <span> - {error.status} {error.statusText}</span>}
                            {error.data && <pre className="mt-1">{JSON.stringify(error.data, null, 2)}</pre>}
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-base-200 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Instructions</h3>
                <ol className="text-sm list-decimal list-inside space-y-2">
                    <li>Navigate to the notification settings page</li>
                    <li>Try to load or save preferences</li>
                    <li>Come back to this page to see captured errors</li>
                    <li>Click "Copy Full Report" and send me the complete error report</li>
                    <li>This will help me identify the exact issue and fix it</li>
                </ol>
            </div>
        </div>
    );
};

export default ConsoleErrorCapture;
