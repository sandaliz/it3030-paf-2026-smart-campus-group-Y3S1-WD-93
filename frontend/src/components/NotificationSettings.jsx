import React, { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Notification Settings Panel component
 */
const NotificationSettings = () => {
    const [preferences, setPreferences] = useState({
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
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchPreferences();
    }, []);

    const fetchPreferences = async () => {
        try {
            console.log('Fetching notification preferences...');
            const response = await axios.get('/api/notification-preferences');
            console.log('Fetch response:', response);
            if (response.data) {
                setPreferences(response.data);
            }
        } catch (error) {
            console.error('Error fetching notification preferences:', error);
            console.error('Error response:', error.response);
            console.error('Error status:', error.response?.status);
            console.error('Error data:', error.response?.data);
            setMessage(`Failed to load preferences: ${error.response?.data?.message || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handlePreferenceChange = (field, value) => {
        setPreferences(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage('');
        
        try {
            console.log('Saving preferences:', preferences);
            const response = await axios.put('/api/notification-preferences', preferences);
            console.log('Save response:', response);
            if (response.data) {
                setMessage('Preferences saved successfully!');
                setPreferences(response.data);
            }
        } catch (error) {
            console.error('Error saving preferences:', error);
            console.error('Error response:', error.response);
            console.error('Error status:', error.response?.status);
            console.error('Error data:', error.response?.data);
            setMessage(`Failed to save preferences: ${error.response?.data?.message || error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const PreferenceRow = ({ title, emailField, bellField }) => (
        <div className="flex items-center justify-between p-3 border-b border-base-200">
            <span className="text-sm font-medium text-base-content">{title}</span>
            <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={preferences[emailField]}
                        onChange={(e) => handlePreferenceChange(emailField, e.target.checked)}
                        className="checkbox checkbox-sm"
                    />
                    <span className="text-xs text-base-content/70">Email</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={preferences[bellField]}
                        onChange={(e) => handlePreferenceChange(bellField, e.target.checked)}
                        className="checkbox checkbox-sm"
                    />
                    <span className="text-xs text-base-content/70">Bell</span>
                </label>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="bg-base-100 rounded-lg shadow-lg w-96 p-6">
                <div className="flex items-center justify-center h-32">
                    <span className="loading loading-spinner loading-md"></span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-base-100 rounded-lg shadow-lg w-96">
            <div className="p-4 border-b border-base-200">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{'\ud83d\udd14'}</span>
                    <h3 className="font-semibold text-base-content">Notification Settings</h3>
                </div>
            </div>
            
            <div className="max-h-80 overflow-y-auto">
                {/* Booking Updates */}
                <div className="p-4">
                    <h4 className="font-medium text-sm text-base-content/80 mb-3">Booking Updates</h4>
                    <div className="space-y-1">
                        <PreferenceRow 
                            title="When booking is approved"
                            emailField="bookingApprovedEmail"
                            bellField="bookingApprovedBell"
                        />
                        <PreferenceRow 
                            title="When booking is rejected"
                            emailField="bookingRejectedEmail"
                            bellField="bookingRejectedBell"
                        />
                        <PreferenceRow 
                            title="When booking is cancelled"
                            emailField="bookingCancelledEmail"
                            bellField="bookingCancelledBell"
                        />
                    </div>
                </div>

                {/* Ticket Updates */}
                <div className="p-4 border-t border-base-200">
                    <h4 className="font-medium text-sm text-base-content/80 mb-3">Ticket Updates</h4>
                    <div className="space-y-1">
                        <PreferenceRow 
                            title="When ticket is assigned"
                            emailField="ticketAssignedEmail"
                            bellField="ticketAssignedBell"
                        />
                        <PreferenceRow 
                            title="When status changes"
                            emailField="ticketStatusChangedEmail"
                            bellField="ticketStatusChangedBell"
                        />
                        <PreferenceRow 
                            title="When comment added"
                            emailField="ticketCommentAddedEmail"
                            bellField="ticketCommentAddedBell"
                        />
                    </div>
                </div>

                {/* System Notifications */}
                <div className="p-4 border-t border-base-200">
                    <h4 className="font-medium text-sm text-base-content/80 mb-3">System Notifications</h4>
                    <div className="space-y-1">
                        <PreferenceRow 
                            title="Maintenance announcements"
                            emailField="systemMaintenanceEmail"
                            bellField="systemMaintenanceBell"
                        />
                    </div>
                </div>
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-base-200">
                {message && (
                    <div className={`mb-3 text-xs p-2 rounded ${
                        message.includes('success') 
                            ? 'bg-success/10 text-success' 
                            : 'bg-error/10 text-error'
                    }`}>
                        {message}
                    </div>
                )}
                <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="btn btn-primary w-full"
                >
                    {saving ? (
                        <>
                            <span className="loading loading-spinner loading-sm"></span>
                            Saving...
                        </>
                    ) : (
                        'Save Preferences'
                    )}
                </button>
            </div>
        </div>
    );
};

export default NotificationSettings;
