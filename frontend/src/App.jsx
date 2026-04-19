import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Components
const RootRedirect = () => {
  const { user, loading, getDashboardPath } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  // If user is not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user is logged in, redirect to appropriate dashboard
  const dashboardPath = getDashboardPath();
  return <Navigate to={dashboardPath} replace />;
};

// Layout Components
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AuthCallback from './pages/AuthCallback';
import ResourceDetailPage from './pages/resources/ResourceDetailPage'
import ResourceManagementPage from './pages/resources/ResourceManagementPage'
import ResourceListPage from './pages/resources/ResourceListPage'
import BookingPage from './pages/bookings/BookingPage'
import CreateBooking from './pages/bookings/CreateBooking'
import BookingManagementPage from './pages/admin/BookingManagement';
import CalendarPage from './pages/calendar/CalendarPage';
import UserCalendarPage from './pages/calendar/UserCalendarPage';
import TicketListPage from './pages/incidents/TicketListPage';
import CreateTicketPage from './pages/incidents/CreateTicketPage';
import TicketDetailPage from './pages/incidents/TicketDetailPage';
// Role-based Dashboards
import AdminDashboard from './pages/admin/AdminDashboard';
import TicketManagemnet from './pages/admin/TicketManagemnet';
import UserManagement from './pages/admin/UserManagement';
import LecturerDashboard from './pages/LecturerDashboard';
import StudentDashboard from './pages/StudentDashboard';
import StaffDashboard from './pages/StaffDashboard';
import TechnicianDashboard from './pages/technician/TechnicianDashboard';
import NotificationSettings from './components/NotificationSettings';
import TestAuth from './components/TestAuth';
import SimpleAuthTest from './components/SimpleAuthTest';
import AuthDebug from './components/AuthDebug';
import NetworkTest from './components/NetworkTest';
import ConsoleErrorCapture from './components/ConsoleErrorCapture';
import RoleSwitcher from './components/RoleSwitcher';
import UserManagementDebug from './components/UserManagementDebug';

const AppContent = () => {
  const location = useLocation();
  const { user, loading } = useAuth();
  const isAuthPage = ['/login', '/register', '/auth/callback', '/auth/calendar/callback', '/auth/calendar/callback/'].includes(location.pathname);

  const [theme, setTheme] = useState(() => {
    const savedTheme = window.localStorage.getItem('theme');
    return savedTheme === 'night' ? 'night' : 'nord';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem('theme', theme);
  }, [theme]);

  // Only show header/footer if logged in AND not on an auth page
  const showLayout = user && !isAuthPage;

  return (
    <div className="min-h-screen flex flex-col">
      {showLayout && <Header />}
      
      <main className={!showLayout ? "flex-1 flex items-center justify-center bg-base-200" : "flex-1"}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Root route - redirect based on auth status */}
          <Route path="/" element={<RootRedirect />} />
          <Route 
            path="/resources" 
            element={
              <ProtectedRoute>
                <ResourceListPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/resources/:id" 
            element={
              <ProtectedRoute>
                <ResourceDetailPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/resources" 
            element={
              <ProtectedRoute requiredRoles={['ADMIN', 'RESOURCE_MANAGER']}>
                <ResourceManagementPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/bookings" 
            element={
              <ProtectedRoute requiredRoles={['ADMIN', 'LECTURER', 'STUDENT']}>
                <BookingPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/calendar" 
            element={
              <ProtectedRoute requiredRoles={['ADMIN', 'LECTURER', 'STUDENT', 'NON_ACADEMIC', 'TECHNICIAN']}>
                <UserCalendarPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/bookings/new" 
            element={
              <ProtectedRoute requiredRoles={['ADMIN', 'LECTURER', 'STUDENT']}>
                <CreateBooking />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/bookings" 
            element={
              <ProtectedRoute requiredRoles={['ADMIN', 'BOOKING_MANAGER']}>
                <BookingManagementPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/calendar" 
            element={
              <ProtectedRoute requiredRoles={['ADMIN', 'BOOKING_MANAGER']}>
                <CalendarPage />
              </ProtectedRoute>
            } 
          />
         
          {/* Ticket Routes - Module C */}
          <Route path="/tickets" element={
            <ProtectedRoute>
              <TicketListPage />
            </ProtectedRoute>
          } />
          <Route path="/tickets/create" element={
            <ProtectedRoute>
              <CreateTicketPage />
            </ProtectedRoute>
          } />
          <Route path="/tickets/:id" element={
            <ProtectedRoute>
              <TicketDetailPage />
            </ProtectedRoute>
          } />

          {/* Role-based Dashboard Routes */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute requiredRoles={['ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/tickets" element={
            <ProtectedRoute requiredRoles={['TICKET_MANAGER', 'ADMIN']}>
              <TicketManagemnet />
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute requiredRoles={['ADMIN']}>
              <UserManagement />
            </ProtectedRoute>
          } />
          <Route path="/lecturer/dashboard" element={
            <ProtectedRoute requiredRoles={['LECTURER']}>
              <LecturerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/student/dashboard" element={
            <ProtectedRoute requiredRoles={['STUDENT']}>
              <StudentDashboard />
            </ProtectedRoute>
          } />
          <Route path="/staff/dashboard" element={
            <ProtectedRoute requiredRoles={['NON_ACADEMIC']}>
              <StaffDashboard />
            </ProtectedRoute>
          } />
          <Route path="/technician/dashboard" element={
            <ProtectedRoute requiredRoles={['TECHNICIAN']}>
              <TechnicianDashboard />
            </ProtectedRoute>
          } />
          
          {/* Notification Settings - Available to all authenticated users */}
          <Route path="/settings/notifications" element={
            <ProtectedRoute>
              <NotificationSettings />
            </ProtectedRoute>
          } />
          
          {/* Test Auth - Debug authentication issues */}
          <Route path="/test-auth" element={
            <ProtectedRoute>
              <TestAuth />
            </ProtectedRoute>
          } />
          
          {/* Simple Auth Test - More focused debugging */}
          <Route path="/simple-auth-test" element={
            <ProtectedRoute>
              <SimpleAuthTest />
            </ProtectedRoute>
          } />
          
          {/* Auth Debug - Comprehensive authentication debugging */}
          <Route path="/auth-debug" element={
            <ProtectedRoute>
              <AuthDebug />
            </ProtectedRoute>
          } />
          
          {/* Network Test - Fix network connectivity issues */}
          <Route path="/network-test" element={
            <ProtectedRoute>
              <NetworkTest />
            </ProtectedRoute>
          } />
          
          {/* Console Error Capture - Capture exact console errors */}
          <Route path="/error-capture" element={
            <ProtectedRoute>
              <ConsoleErrorCapture />
            </ProtectedRoute>
          } />
          
          {/* Role Switcher - Test different roles */}
          <Route path="/role-switcher" element={
            <ProtectedRoute>
              <RoleSwitcher />
            </ProtectedRoute>
          } />
          
          {/* User Management Debug - Debug user display issues */}
          <Route path="/user-management-debug" element={
            <ProtectedRoute>
              <UserManagementDebug />
            </ProtectedRoute>
          } />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      
      {showLayout && <Footer />}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
