import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AuthDebug = () => {
    const [authInfo, setAuthInfo] = useState({});
    const [tokenInfo, setTokenInfo] = useState({});
    const [testResult, setTestResult] = useState('');

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = () => {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        setAuthInfo({
            hasToken: !!token,
            tokenLength: token ? token.length : 0,
            tokenPreview: token ? token.substring(0, 50) + '...' : 'No token',
            user: user
        });

        if (token) {
            try {
                const decoded = JSON.parse(atob(token.split('.')[1]));
                setTokenInfo({
                    decoded: decoded,
                    expired: decoded.exp * 1000 < Date.now(),
                    expiresAt: new Date(decoded.exp * 1000).toLocaleString(),
                    issuedAt: new Date(decoded.iat * 1000).toLocaleString()
                });
            } catch (error) {
                setTokenInfo({ error: 'Failed to decode token: ' + error.message });
            }
        }
    };

    const testAPI = async () => {
        setTestResult('Testing API...');
        
        try {
            const response = await axios.get('/api/notification-preferences');
            setTestResult(`SUCCESS: ${JSON.stringify(response.data, null, 2)}`);
        } catch (error) {
            setTestResult(`ERROR: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
        }
    };

    const clearAuth = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.reload();
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Authentication Debug</h2>
            
            <div className="bg-base-200 p-4 rounded-lg mb-4">
                <h3 className="font-semibold mb-2">Authentication Status</h3>
                <div className="text-sm space-y-2">
                    <p><strong>Has Token:</strong> {authInfo.hasToken ? 'Yes' : 'No'}</p>
                    <p><strong>Token Length:</strong> {authInfo.tokenLength}</p>
                    <p><strong>Token Preview:</strong> {authInfo.tokenPreview}</p>
                    <p><strong>User:</strong> {JSON.stringify(authInfo.user, null, 2)}</p>
                </div>
            </div>

            <div className="bg-base-200 p-4 rounded-lg mb-4">
                <h3 className="font-semibold mb-2">Token Information</h3>
                <div className="text-sm space-y-2">
                    {tokenInfo.error ? (
                        <p className="text-error">{tokenInfo.error}</p>
                    ) : (
                        <>
                            <p><strong>Expired:</strong> {tokenInfo.expired ? 'Yes' : 'No'}</p>
                            <p><strong>Expires At:</strong> {tokenInfo.expiresAt}</p>
                            <p><strong>Issued At:</strong> {tokenInfo.issuedAt}</p>
                            <p><strong>Decoded Payload:</strong></p>
                            <pre className="bg-base-300 p-2 rounded text-xs overflow-auto">
                                {JSON.stringify(tokenInfo.decoded, null, 2)}
                            </pre>
                        </>
                    )}
                </div>
            </div>

            <div className="bg-base-200 p-4 rounded-lg mb-4">
                <h3 className="font-semibold mb-2">API Test</h3>
                <div className="flex gap-2 mb-2">
                    <button onClick={testAPI} className="btn btn-primary btn-sm">
                        Test Notification API
                    </button>
                    <button onClick={checkAuthStatus} className="btn btn-secondary btn-sm">
                        Refresh Auth Status
                    </button>
                    <button onClick={clearAuth} className="btn btn-error btn-sm">
                        Clear Auth & Reload
                    </button>
                </div>
                <pre className="text-xs bg-base-300 p-2 rounded overflow-auto max-h-96">
                    {testResult}
                </pre>
            </div>
        </div>
    );
};

export default AuthDebug;
