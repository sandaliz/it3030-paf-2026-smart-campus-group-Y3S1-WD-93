import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LoginPage from './pages/LoginPage';
import AuthCallback from './pages/AuthCallback';
import Home from './pages/Home';
import ResourceDetailPage from './pages/resources/ResourceDetailPage'
import ResourceManagementPage from './pages/resources/ResourceManagementPage'
import ResourceListPage from './pages/resources/ResourceListPage'

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

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
