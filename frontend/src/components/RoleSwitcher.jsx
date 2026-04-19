import React, { useState } from 'react';
import axios from 'axios';

const RoleSwitcher = () => {
    const [testResults, setTestResults] = useState('');
    const [currentRole, setCurrentRole] = useState('');

    const testRoles = [
        {
            email: 'admin@uniops.com',
            role: 'ADMIN',
            description: 'Administrator - Full system access'
        },
        {
            email: 'lecturer@uniops.com', 
            role: 'LECTURER',
            description: 'Lecturer - Can manage courses and students'
        },
        {
            email: 'technician@uniops.com',
            role: 'TECHNICIAN', 
            description: 'Technician - Can manage resources and equipment'
        },
        {
            email: 'student@uniops.com',
            role: 'STUDENT',
            description: 'Student - Can view and book resources'
        }
    ];

    const checkCurrentRole = () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                const roles = payload.roles || [];
                setCurrentRole(roles.join(', '));
                setTestResults(`Current user: ${payload.email}\nCurrent roles: ${roles.join(', ')}`);
            } catch (error) {
                setTestResults('Error decoding token: ' + error.message);
            }
        } else {
            setCurrentRole('Not logged in');
            setTestResults('No token found. Please login first.');
        }
    };

    const simulateRoleChange = (role) => {
        setTestResults(`To test role: ${role.role}\n\nSteps:\n1. Use incognito mode or different browser\n2. Login with: ${role.email}\n3. Or create a new Google account with this email\n\nCurrent OAuth limitation prevents direct role switching without re-authentication.`);
    };

    const clearAuth = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setCurrentRole('');
        setTestResults('Authentication cleared. Please login again.');
    };

    const openIncognito = () => {
        setTestResults('Opening incognito window instructions:\n\n1. Press Ctrl+Shift+N (Chrome) or Ctrl+Shift+P (Firefox)\n2. Navigate to http://localhost:5173/login\n3. Login with different Google account');
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Role Testing Tool</h2>
            
            <div className="bg-base-200 p-4 rounded-lg mb-4">
                <h3 className="font-semibold mb-2">Current Status</h3>
                <p><strong>Current Role:</strong> {currentRole || 'Unknown'}</p>
                <div className="flex gap-2 mt-2">
                    <button onClick={checkCurrentRole} className="btn btn-primary btn-sm">
                        Check Current Role
                    </button>
                    <button onClick={clearAuth} className="btn btn-error btn-sm">
                        Clear Authentication
                    </button>
                    <button onClick={openIncognito} className="btn btn-info btn-sm">
                        Incognito Instructions
                    </button>
                </div>
            </div>

            <div className="bg-base-200 p-4 rounded-lg mb-4">
                <h3 className="font-semibold mb-2">Available Test Roles</h3>
                <div className="space-y-2">
                    {testRoles.map((role, index) => (
                        <div key={index} className="border border-base-300 p-3 rounded">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-semibold">{role.role}</h4>
                                    <p className="text-sm text-gray-600">{role.description}</p>
                                    <p className="text-xs text-gray-500 mt-1">Test email: {role.email}</p>
                                </div>
                                <button 
                                    onClick={() => simulateRoleChange(role)}
                                    className="btn btn-outline btn-sm"
                                >
                                    Test This Role
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-base-200 p-4 rounded-lg mb-4">
                <h3 className="font-semibold mb-2">Test Results</h3>
                <pre className="text-xs bg-base-300 p-2 rounded overflow-auto max-h-96 whitespace-pre-wrap">
                    {testResults}
                </pre>
            </div>

            <div className="bg-base-200 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">How to Test Different Roles</h3>
                <ol className="text-sm list-decimal list-inside space-y-2">
                    <li><strong>Incognito Mode:</strong> Press Ctrl+Shift+N and login with different Google account</li>
                    <li><strong>Different Browser:</strong> Use Edge, Firefox, or another browser to login</li>
                    <li><strong>Clear Google Session:</strong> Sign out from Google and clear browser data</li>
                    <li><strong>Create Test Accounts:</strong> Create new Google accounts for testing different roles</li>
                </ol>
            </div>
        </div>
    );
};

export default RoleSwitcher;
