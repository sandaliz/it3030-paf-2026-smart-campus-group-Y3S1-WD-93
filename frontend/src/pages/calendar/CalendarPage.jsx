import React from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import SharedCalendar from '../../components/calendar/SharedCalendar';

const CalendarPage = () => {
  return (
    <div className="min-h-screen bg-base-200">
      <div className="flex min-h-screen">
        <AdminSidebar />
        <div className="flex-1">
          <SharedCalendar userRole="admin" />
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
