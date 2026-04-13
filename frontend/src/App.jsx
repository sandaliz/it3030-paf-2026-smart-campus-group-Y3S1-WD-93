import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Layout Components
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

// Pages
import LoginPage from './pages/LoginPage';
import AuthCallback from './pages/AuthCallback';
import Home from './pages/Home';
import ResourceDetailPage from './pages/resources/ResourceDetailPage'
import ResourceManagementPage from './pages/resources/ResourceManagementPage'
import ResourceListPage from './pages/resources/ResourceListPage'
import TicketListPage from './pages/incidents/TicketListPage';
import CreateTicketPage from './pages/incidents/CreateTicketPage';
import TicketDetailPage from './pages/incidents/TicketDetailPage';
//import UserDashboard from './pages/user/UserDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
//import TechnicianDashboard from './pages/technician/TechnicianDashboard';
//import TicketAnalyticsPage from './pages/admin/TicketAnalyticsPage';
//import UserTicketsPage from './pages/user/UserTicketsPage';

function App() {
  const [theme, setTheme] = useState(() => {
    const savedTheme = window.localStorage.getItem('theme');
    return savedTheme === 'night' ? 'night' : 'nord';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'nord' ? 'night' : 'nord');
  };

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Header />
          
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/auth/callback" element={<AuthCallback />} />

              {/* Protected Routes */}
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                } 
              />
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
                  <ProtectedRoute requiredRoles={['ADMIN']}>
                    <ResourceManagementPage />
                  </ProtectedRoute>
                } 
              />
              {/* <Route 
                path="/admin/analytics" 
                element={
                  <ProtectedRoute requiredRoles={['ADMIN']}>
                    <TicketAnalyticsPage />
                  </ProtectedRoute>
                } 
              /> */}
              {/* <Route 
                path="/technician/dashboard" 
                element={
                  <ProtectedRoute requiredRoles={['TECHNICIAN']}>
                    <TechnicianDashboard />
                  </ProtectedRoute>
                } 
              /> */}
              {/* <Route 
                path="/user/dashboard" 
                element={
                  <ProtectedRoute>
                    <UserDashboard />
                  </ProtectedRoute>
                } 
              /> */}
              <Route 
                path="/user/tickets" 
                element={
                  <ProtectedRoute>
                    <UserTicketsPage />
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

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;