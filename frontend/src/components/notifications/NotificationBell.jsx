import React, { useState, useEffect, useReducer } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationPanel from './NotificationPanel';

/**
 * Notification Bell icon component for navbar
 */
const NotificationBell = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [forceUpdate, forceRerender] = useReducer(x => x + 1, 0);
    const { getTotalUnreadCount, unreadCount, userBookings, userTickets, readNotifications, reactiveCount, currentCount } = useNotifications();

    // Use reactiveCount for accurate total unread count including server notifications
    const totalCount = reactiveCount;

    // Force re-render bell when count changes
    useEffect(() => {
        forceRerender();
    }, [totalCount, readNotifications, reactiveCount]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isOpen && !event.target.closest('.notification-bell-container')) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div className="notification-bell-container relative">
            <div style={{ position: 'relative', display: 'inline-block' }}>
                <button 
                    className="btn btn-ghost btn-circle"
                    onClick={() => setIsOpen(!isOpen)}
                    style={{ position: 'relative', overflow: 'visible' }}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                </button>
                
                {/* Red dot indicator for unread notifications - positioned outside button */}
                {totalCount > 0 && (
                    <div
                        style={{
                            position: 'absolute',
                            top: '-2px',
                            right: '-2px',
                            width: '12px',
                            height: '12px',
                            backgroundColor: '#dc2626',
                            borderRadius: '50%',
                            border: '3px solid white',
                            zIndex: 1000,
                            pointerEvents: 'none',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                        }}
                        title={`${totalCount} unread notifications`}
                    />
                )}
            </div>
            
            {isOpen && (
                <div className="absolute right-0 mt-2 z-50">
                    <NotificationPanel />
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
