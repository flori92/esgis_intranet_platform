import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/auth/LoginPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import MainLayout from './components/layout/MainLayout';
import AdminRoutes from './routes/AdminRoutes';
import ProfessorRoutes from './routes/ProfessorRoutes';
import StudentRoutes from './routes/StudentRoutes';
import SchedulePage from './pages/schedule/SchedulePage';
import GradesPage from './pages/grades/GradesPage';
import DocumentsPage from './pages/documents/DocumentsPage';
import MessagesPage from './pages/messages/MessagesPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import StagesPage from './pages/stages/StagesPage';
import ProfileSettingsPage from './pages/shared/ProfileSettingsPage';
import VerifyDocumentPage from './pages/public/VerifyDocumentPage';

/**
 * Composant de protection des routes
 * Vérifie si l'utilisateur est connecté et a les droits d'accès requis
 * @param {Object} props
 * @param {JSX.Element} props.children - Composant enfant
 * @param {string} [props.requiredRole] - Rôle requis ('admin', 'professor', 'student')
 * @returns {JSX.Element}
 */
const ProtectedRoute = ({ children, requiredRole }) => {
  const { authState } = useAuth();
  
  // Afficher un loader pendant le chargement de l'auth
  if (authState.loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 2 }}>
        <CircularProgress size={48} />
        <Typography color="text.secondary">Chargement...</Typography>
      </Box>
    );
  }
  
  // Si l'utilisateur n'est pas connecté, rediriger vers login
  if (!authState.user) {
    return <Navigate to="/login" replace />;
  }
  
  // Vérifier le rôle si nécessaire
  if (requiredRole && (
    (requiredRole === 'admin' && !authState.isAdmin) ||
    (requiredRole === 'professor' && !authState.isProfessor) ||
    (requiredRole === 'student' && !authState.isStudent)
  )) {
    // Rediriger vers le dashboard approprié selon le rôle
    if (authState.isAdmin) return <Navigate to="/admin" replace />;
    if (authState.isProfessor) return <Navigate to="/professor" replace />;
    if (authState.isStudent) return <Navigate to="/student" replace />;
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

/**
 * Composant de redirection intelligente après login
 * Redirige vers le dashboard approprié selon le rôle
 */
const RoleBasedRedirect = () => {
  const { authState } = useAuth();
  
  if (authState.loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 2 }}>
        <CircularProgress size={48} />
        <Typography color="text.secondary">Chargement...</Typography>
      </Box>
    );
  }
  if (!authState.user) return <Navigate to="/login" replace />;
  if (authState.isAdmin) return <Navigate to="/admin" replace />;
  if (authState.isProfessor) return <Navigate to="/professor" replace />;
  return <Navigate to="/student" replace />;
};

/**
 * Composant principal de l'application
 */
function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Routes d'authentification */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          
          {/* Routes protégées avec layout */}
          <Route element={<MainLayout />}>
            {/* Routes administrateur */}
            <Route 
              path="/admin/*" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminRoutes />
                </ProtectedRoute>
              } 
            />
            
            {/* Routes étudiant - utilise StudentRoutes avec sous-routes */}
            <Route 
              path="/student/*" 
              element={
                <ProtectedRoute requiredRole="student">
                  <StudentRoutes />
                </ProtectedRoute>
              } 
            />
            
            {/* Routes professeur */}
            <Route 
              path="/professor/*" 
              element={
                <ProtectedRoute requiredRole="professor">
                  <ProfessorRoutes />
                </ProtectedRoute>
              } 
            />
            
            {/* Routes partagées (accessibles à tous les rôles authentifiés) */}
            <Route 
              path="/stages/*" 
              element={
                <ProtectedRoute>
                  <StagesPage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/schedule" 
              element={
                <ProtectedRoute>
                  <SchedulePage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/grades" 
              element={
                <ProtectedRoute>
                  <GradesPage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/documents" 
              element={
                <ProtectedRoute>
                  <DocumentsPage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/messages" 
              element={
                <ProtectedRoute>
                  <MessagesPage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/notifications" 
              element={
                <ProtectedRoute>
                  <NotificationsPage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <ProfileSettingsPage />
                </ProtectedRoute>
              } 
            />
          </Route>
          
          {/* Route publique: Vérification de document QR */}
          <Route path="/verify/:reference" element={<VerifyDocumentPage />} />
          
          {/* Redirection intelligente selon le rôle */}
          <Route path="/" element={<RoleBasedRedirect />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
