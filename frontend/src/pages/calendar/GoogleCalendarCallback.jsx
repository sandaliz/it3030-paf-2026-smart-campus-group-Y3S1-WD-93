import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { googleCalendarService } from '../../services/googleCalendarService';

const GoogleCalendarCallback = () => {
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      setError(error);
      setStatus('error');
      return;
    }

    if (code) {
      handleCallback(code);
    } else {
      setError('No authorization code received');
      setStatus('error');
    }
  }, [searchParams]);

  const handleCallback = async (code) => {
    try {
      setStatus('exchanging');
      
      // Exchange authorization code for access token
      const response = await googleCalendarService.exchangeCodeForToken(code);
      
      if (response.accessToken) {
        googleCalendarService.storeCalendarToken(response.accessToken);
        setStatus('success');
        
        // Redirect to bookings page after successful connection
        setTimeout(() => {
          navigate('/bookings?calendar=connected');
        }, 2000);
      } else {
        setError('Failed to obtain access token');
        setStatus('error');
      }
    } catch (err) {
      setError(err.message || 'Failed to connect Google Calendar');
      setStatus('error');
    }
  };

  const handleGoBack = () => {
    navigate('/bookings');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary mb-4">Google Calendar Connection</h1>
          <p className="text-gray-600 mb-8">
            {status === 'processing' && 'Processing your authorization...'}
            {status === 'exchanging' && 'Exchanging authorization code...'}
            {status === 'success' && 'Successfully connected to Google Calendar!'}
          </p>
        </div>

        {status === 'processing' && (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {status === 'success' && (
          <div className="bg-success/10 border border-success/20 rounded-lg p-6 text-center">
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-success text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-success mb-2">Connection Successful!</h2>
            <p className="text-gray-600 mb-4">
              Your Google Calendar has been connected successfully. You'll be redirected to your bookings page.
            </p>
            <div className="animate-pulse">
              <span className="text-sm text-gray-500">Redirecting...</span>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-error/10 border border-error/20 rounded-lg p-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-error text-white mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-error mb-2">Connection Failed</h2>
              <p className="text-gray-600 mb-4">
                {error || 'Failed to connect to Google Calendar. Please try again.'}
              </p>
              <button
                onClick={handleGoBack}
                className="btn btn-primary"
              >
                Go Back to Bookings
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleCalendarCallback;
