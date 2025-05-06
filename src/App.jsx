import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/auth/LoginPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import MainLayout from './components/layout/MainLayout';
import StudentDashboardPage from './pages/student/DashboardPage';
import AdminRoutes from './routes/AdminRoutes';
import ProfessorRoutes from './routes/ProfessorRoutes';
import SchedulePage from './pages/schedule/SchedulePage';
import GradesPage from './pages/grades/GradesPage';
import DocumentsPage from './pages/documents/DocumentsPage';
import MessagesPage from './pages/messages/MessagesPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import StagesPage from './pages/stages/StagesPage';
import StudentExamsList from './pages/exams/student/StudentExamsList'; // Import du composant StudentExamsList

/**
 * Composant de protection des routes
 * Vérifie si l'utilisateur est connecté et a les droits d'accès requis
 * @param {Object} props - Propriétés du composant
 * @param {JSX.Element} props.children - Composant enfant à afficher si l'accès est autorisé
 * @param {string} [props.requiredRole] - Rôle requis pour accéder à la route ('admin', 'professor', 'student')
 * @returns {JSX.Element} Le composant enfant ou une redirection
 */
const ProtectedRoute = ({ children, requiredRole }) => {
  const { authState } = useAuth();
  
  // Si l'utilisateur n'est pas connecté, rediriger vers la page de connexion
  if (!authState.user) {
    return <Navigate to="/login" replace />;
  }
  
  // Vérifier le rôle si nécessaire
  if (requiredRole && (
    (requiredRole === 'admin' && !authState.isAdmin) ||
    (requiredRole === 'professor' && !authState.isProfessor) ||
    (requiredRole === 'student' && !authState.isStudent)
  )) {
    // Rediriger vers la page appropriée selon le rôle
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

/**
 * Composant principal de l'application
 * Définit la structure des routes et le système d'authentification
 * @returns {JSX.Element} Application complète
 */
function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Routes d'authentification */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          
          {/* Routes protégées */}
          <Route element={<MainLayout />}>
            {/* Routes pour les administrateurs */}
            <Route 
              path="/admin/*" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminRoutes />
                </ProtectedRoute>
              } 
            />
            
            {/* Routes pour les étudiants */}
            <Route 
              path="/student/*" 
              element={
                <ProtectedRoute requiredRole="student">
                  <StudentDashboardPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/exams" 
              element={
                <ProtectedRoute requiredRole="student">
                  <StudentExamsList />
                </ProtectedRoute>
              }
            />
            
            {/* Routes pour les professeurs */}
            <Route 
              path="/professor/*" 
              element={
                <ProtectedRoute requiredRole="professor">
                  <ProfessorRoutes />
                </ProtectedRoute>
              } 
            />
            
            {/* Routes pour les stages */}
            <Route 
              path="/stages/*" 
              element={
                <ProtectedRoute>
                  <StagesPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Routes pour les emplois du temps */}
            <Route 
              path="/schedule" 
              element={
                <ProtectedRoute>
                  <SchedulePage />
                </ProtectedRoute>
              } 
            />
            
            {/* Routes pour les notes */}
            <Route 
              path="/grades" 
              element={
                <ProtectedRoute>
                  <GradesPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Routes pour les documents */}
            <Route 
              path="/documents" 
              element={
                <ProtectedRoute>
                  <DocumentsPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Routes pour les messages */}
            <Route 
              path="/messages" 
              element={
                <ProtectedRoute>
                  <MessagesPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Routes pour les notifications */}
            <Route 
              path="/notifications" 
              element={
                <ProtectedRoute>
                  <NotificationsPage />
                </ProtectedRoute>
              } 
            />
          </Route>
          
          {/* Redirection par défaut */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
