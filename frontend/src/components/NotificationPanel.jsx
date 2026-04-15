import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

const NotificationPanel = () => {
    const { user, token } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    // Initial load of notifications
    useEffect(() => {
        if (user && token) {
            fetchNotifications();
            
            // Connect to WebSocket
            const socket = new SockJS('http://localhost:8080/ws');
            const stompClient = Stomp.over(socket);
            
            // Optional: Disable logging in production
            // stompClient.debug = () => {};

            stompClient.connect({}, () => {
                console.log('Connected to WebSocket');
                
                // Subscribe to user-specific notifications
                stompClient.subscribe(`/topic/notifications/${user.email}`, (message) => {
                    const newNotification = JSON.parse(message.body);
                    setNotifications(prev => [newNotification, ...prev]);
                    setUnreadCount(prev => prev + 1);
                    
                    // Optional: Show a browser notification or a toast here
                    if (Notification.permission === "granted") {
                        new Notification("New Smart Campus Alert", { body: newNotification.message });
                    }
                });
            }, (error) => {
                console.error('WebSocket Error:', error);
            });

            return () => {
                if (stompClient.connected) {
                    stompClient.disconnect();
                }
            };
        }
    }, [user, token]);

    const fetchNotifications = async () => {
        try {
            const response = await axios.get('http://localhost:8080/api/notifications');
            setNotifications(response.data);
            const unread = response.data.filter(n => n.status === 'UNREAD').length;
            setUnreadCount(unread);
        } catch (error) {
            console.error('Error fetching notifications', error);
        }
    };

    const markAsRead = async (id) => {
        try {
            await axios.patch(`http://localhost:8080/api/notifications/${id}/read`);
            setNotifications(notifications.map(n =>
                n.id === id ? { ...n, status: 'READ' } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read', error);
        }
    };

    const markAllRead = async () => {
        try {
            await axios.post('http://localhost:8080/api/notifications/mark-all-read');
            setNotifications(notifications.map(n => ({ ...n, status: 'READ' })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all as read', error);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (!user) return null;

    return (
        <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-ghost btn-circle" onClick={() => setIsOpen(!isOpen)}>
                <div className="indicator">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadCount > 0 && (
                        <span className="badge badge-sm badge-primary indicator-item">{unreadCount}</span>
                    )}
                </div>
            </label>
            <div tabIndex={0} className="mt-3 z-[1] card card-compact dropdown-content w-80 bg-base-100 shadow-2xl border border-base-300">
                <div className="card-body p-0">
                    <div className="flex items-center justify-between p-4 border-b border-base-200">
                        <h3 className="font-bold text-lg">Notifications</h3>
                        {unreadCount > 0 && (
                            <button onClick={markAllRead} className="text-xs text-primary hover:underline">Mark all read</button>
                        )}
                    </div>
                    
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-base-content/40">
                                <p>No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div 
                                    key={notification.id} 
                                    className={`p-4 border-b border-base-200 transition-colors hover:bg-base-200 cursor-pointer ${notification.status === 'UNREAD' ? 'bg-primary/5' : ''}`}
                                    onClick={() => notification.status === 'UNREAD' && markAsRead(notification.id)}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                                            notification.type === 'BOOKING' ? 'bg-info/20 text-info' :
                                            notification.type === 'TICKET' ? 'bg-warning/20 text-warning' :
                                            'bg-success/20 text-success'
                                        }`}>
                                            {notification.type}
                                        </span>
                                        <span className="text-[10px] text-base-content/40">{formatDate(notification.createdAt)}</span>
                                    </div>
                                    <p className={`text-sm ${notification.status === 'UNREAD' ? 'font-semibold' : 'text-base-content/70'}`}>
                                        {notification.message}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                    
                    <div className="p-2 bg-base-200 text-center">
                        <button className="btn btn-ghost btn-xs w-full">View All</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationPanel;
