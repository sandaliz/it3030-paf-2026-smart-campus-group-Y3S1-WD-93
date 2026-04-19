import React, { useState, useEffect } from 'react';
import apiInstance from '../services/axiosInstance';

const UserManagementDebug = () => {
    const [debugInfo, setDebugInfo] = useState({
        stats: null,
        users: null,
        usersError: null,
        statsError: null,
        loading: true
    });

    useEffect(() => {
        const debugUserManagement = async () => {
            try {
                // Test stats endpoint
                const statsResponse = await apiInstance.get('/api/admin/dashboard/stats');
                console.log('Stats Response:', statsResponse.data);
                
                // Test users endpoint
                const usersResponse = await apiInstance.get('/api/admin/dashboard/users');
                console.log('Users Response:', usersResponse.data);
                
                setDebugInfo({
                    stats: statsResponse.data,
                    users: usersResponse.data,
                    usersError: null,
                    statsError: null,
                    loading: false
                });
            } catch (error) {
                console.error('Debug Error:', error);
                
                // Check which endpoint failed
                if (error.response?.config?.url?.includes('/stats')) {
                    setDebugInfo(prev => ({
                        ...prev,
                        statsError: error.response?.data || error.message,
                        loading: false
                    }));
                } else if (error.response?.config?.url?.includes('/users')) {
                    setDebugInfo(prev => ({
                        ...prev,
                        usersError: error.response?.data || error.message,
                        loading: false
                    }));
                } else {
                    setDebugInfo(prev => ({
                        ...prev,
                        usersError: 'Unknown error: ' + error.message,
                        loading: false
                    }));
                }
            }
        };

        debugUserManagement();
    }, []);

    if (debugInfo.loading) {
        return (
            <div className="p-6">
                <h2 className="text-xl font-bold mb-4">User Management Debug</h2>
                <div className="flex justify-center">
                    <span className="loading loading-spinner loading-lg"></span>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">User Management Debug</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Stats Debug */}
                <div className="bg-base-100 shadow-sm rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Stats Debug</h3>
                    {debugInfo.statsError ? (
                        <div className="alert alert-error">
                            <span>Stats Error: {JSON.stringify(debugInfo.statsError)}</span>
                        </div>
                    ) : (
                        <div>
                            <pre className="bg-base-200 p-4 rounded text-sm overflow-auto">
                                {JSON.stringify(debugInfo.stats, null, 2)}
                            </pre>
                            <div className="mt-4 space-y-2">
                                <p><strong>Total Users:</strong> {debugInfo.stats?.totalUsers}</p>
                                <p><strong>Total Bookings:</strong> {debugInfo.stats?.totalBookings}</p>
                                <p><strong>Pending Bookings:</strong> {debugInfo.stats?.pendingBookings}</p>
                                <p><strong>Total Tickets:</strong> {debugInfo.stats?.totalTickets}</p>
                                <p><strong>Open Tickets:</strong> {debugInfo.stats?.openTickets}</p>
                                <p><strong>Total Resources:</strong> {debugInfo.stats?.totalResources}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Users Debug */}
                <div className="bg-base-100 shadow-sm rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Users Debug</h3>
                    {debugInfo.usersError ? (
                        <div className="alert alert-error">
                            <span>Users Error: {JSON.stringify(debugInfo.usersError)}</span>
                        </div>
                    ) : (
                        <div>
                            <div className="mb-4">
                                <p><strong>Users Array Type:</strong> {Array.isArray(debugInfo.users) ? 'Array' : typeof debugInfo.users}</p>
                                <p><strong>Users Length:</strong> {Array.isArray(debugInfo.users) ? debugInfo.users.length : 'N/A'}</p>
                                <p><strong>Users Data:</strong></p>
                            </div>
                            <pre className="bg-base-200 p-4 rounded text-sm overflow-auto max-h-96">
                                {JSON.stringify(debugInfo.users, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            </div>

            {/* Analysis */}
            <div className="bg-base-100 shadow-sm rounded-lg p-6 mt-6">
                <h3 className="text-lg font-semibold mb-4">Problem Analysis</h3>
                <div className="space-y-4">
                    <div>
                        <h4 className="font-semibold">Issue Identification:</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                            <li className={debugInfo.stats?.totalUsers > 0 ? "text-green-600" : "text-red-600"}>
                                Stats endpoint working: {debugInfo.stats?.totalUsers > 0 ? 'YES' : 'NO'}
                            </li>
                            <li className={Array.isArray(debugInfo.users) ? "text-green-600" : "text-red-600"}>
                                Users endpoint returns array: {Array.isArray(debugInfo.users) ? 'YES' : 'NO'}
                            </li>
                            <li className={Array.isArray(debugInfo.users) && debugInfo.users.length > 0 ? "text-green-600" : "text-red-600"}>
                                Users array has data: {Array.isArray(debugInfo.users) && debugInfo.users.length > 0 ? 'YES' : 'NO'}
                            </li>
                            <li className={debugInfo.usersError ? "text-red-600" : "text-green-600"}>
                                Users API error: {debugInfo.usersError ? 'YES' : 'NO'}
                            </li>
                        </ul>
                    </div>
                    
                    <div>
                        <h4 className="font-semibold">Likely Causes:</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                            <li>Backend users endpoint returning wrong data format</li>
                            <li>Frontend not processing the users data correctly</li>
                            <li>Authentication/authorization issue with users endpoint</li>
                            <li>Data mapping issue in AdminDashboard component</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserManagementDebug;
