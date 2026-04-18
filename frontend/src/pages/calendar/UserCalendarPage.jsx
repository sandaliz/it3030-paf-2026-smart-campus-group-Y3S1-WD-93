import React from 'react';
import { useAuth } from '../../context/AuthContext';
import SharedCalendar from '../../components/calendar/SharedCalendar';

const UserCalendarPage = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-base-200">
      <div className="container mx-auto max-w-7xl">
        <SharedCalendar userRole="user" userId={user?.id} />
      </div>
    </div>
  );
};

export default UserCalendarPage;
