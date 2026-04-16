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
import AuthCallback from './pages/AuthCallback';
import GoogleCalendarCallback from './pages/calendar/GoogleCalendarCallback';
import Home from './pages/Home';
import ResourceDetailPage from './pages/resources/ResourceDetailPage'
import ResourceManagementPage from './pages/admin/ResourceManagement'
import ResourceListPage from './pages/resources/ResourceListPage'
import BookingPage from './pages/bookings/BookingPage'
import BookingManagementPage from './pages/admin/BookingManagement'
import TicketListPage from './pages/incidents/TicketListPage';
import CreateTicketPage from './pages/incidents/CreateTicketPage';
import TicketDetailPage from './pages/incidents/TicketDetailPage';
// Role-based Dashboards
import AdminDashboard from './pages/admin/AdminDashboard';
import TicketAnalyticsPage from './pages/admin/TicketAnalyticsPage';
import LecturerDashboard from './pages/LecturerDashboard';
import StudentDashboard from './pages/StudentDashboard';
import StaffDashboard from './pages/StaffDashboard';

const AppContent = () => {
  const location = useLocation();
  const { user, loading } = useAuth();
  const isAuthPage = ['/login', '/auth/callback', '/auth/calendar/callback', '/auth/calendar/callback/'].includes(location.pathname);

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
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/auth/calendar/callback" element={<GoogleCalendarCallback />} />

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
              <ProtectedRoute>
                <BookingPage />
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
            <ProtectedRoute requiredRoles={['TECHNICIAN', 'TICKET_MANAGER', 'ADMIN']}>
              <TicketAnalyticsPage />
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
              <StudentDashboard />
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