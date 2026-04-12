import React, { useState, useEffect } from 'react';
import { googleCalendarService } from '../../services/googleCalendarService';

const GoogleCalendarConnect = ({ onConnect }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Check if already connected
    setIsConnected(googleCalendarService.isCalendarConnected());
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError('');
    
    try {
      // Redirect to Google OAuth for Calendar access
      const authUrl = googleCalendarService.getGoogleAuthUrl();
      window.location.href = authUrl;
    } catch (err) {
      setError('Failed to initiate Google Calendar connection');
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    googleCalendarService.clearCalendarToken();
    setIsConnected(false);
    if (onConnect) {
      onConnect(false);
    }
  };

  const handleSync = async () => {
    setIsConnecting(true);
    setError('');
    
    try {
      const token = googleCalendarService.getCalendarToken();
      if (!token) {
        setError('Please connect your Google Calendar first');
        setIsConnecting(false);
        return;
      }

      await googleCalendarService.syncAllBookingsToCalendar(token);
      setError('');
      if (onConnect) {
        onConnect(true);
      }
    } catch (err) {
      setError('Failed to sync bookings to Google Calendar');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title text-xl font-bold mb-6">Google Calendar Integration</h2>
        
        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-success' : 'bg-warning'}`}></div>
              <span className="font-medium">
                {isConnected ? 'Connected to Google Calendar' : 'Not Connected'}
              </span>
            </div>
            
            {isConnected ? (
              <button
                onClick={handleDisconnect}
                className="btn btn-error btn-sm"
                disabled={isConnecting}
              >
                Disconnect
              </button>
            ) : (
              <button
                onClick={handleConnect}
                className="btn btn-primary btn-sm"
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Connecting...
                  </>
                ) : (
                  'Connect Google Calendar'
                )}
              </button>
            )}
          </div>

          {/* Sync Button */}
          {isConnected && (
            <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
              <span className="font-medium">Sync Bookings to Calendar</span>
              <button
                onClick={handleSync}
                className="btn btn-secondary btn-sm"
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Syncing...
                  </>
                ) : (
                  'Sync Now'
                )}
              </button>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-6 p-4 bg-info/10 rounded-lg">
            <h3 className="font-semibold mb-2">How it works:</h3>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>Connect your Google Calendar account</li>
              <li>Approved bookings will automatically sync to your calendar</li>
              <li>Booking status changes will update calendar events</li>
              <li>You'll receive email reminders for upcoming bookings</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleCalendarConnect;
