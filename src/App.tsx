// Mock de l'AuthProvider pour les tests
jest.mock('./context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="auth-provider">{children}</div>,
  useAuth: jest.fn(() => ({
    authState: {
      user: null,
      profile: null,
      student: null,
      professor: null,
      session: null,
      isAdmin: false,
      isProfessor: false,
      isStudent: false,
      error: null,
      loading: false
    },
    signIn: jest.fn(),
    signOut: jest.fn(),
    logout: jest.fn(),
    resetPassword: jest.fn(),
    updateProfile: jest.fn(),
    createUserAccount: jest.fn()
  }))
}), { virtual: true });

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth, AuthContextType } from './context/AuthContext';
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

// Composant de protection des routes
const ProtectedRoute: React.FC<{ 
  element: JSX.Element;
  requiredRole?: 'admin' | 'professor' | 'student';
}> = ({ element, requiredRole }) => {
  const { authState } = useAuth() as AuthContextType;
  
  // Si l'utilisateur n'est pas connecté, rediriger vers la page de connexion
  if (!authState.user) {
    return <Navigate to="/login" replace />;
  }
  
  // Vérifier le rôle si nécessaire
  if (requiredRole) {
    if (
      (requiredRole === 'admin' && !authState.isAdmin) ||
      (requiredRole === 'professor' && !authState.isProfessor) ||
      (requiredRole === 'student' && !authState.isStudent)
    ) {
      // Rediriger vers la page appropriée selon le rôle
      return <Navigate to="/login" replace />;
    }
  }
  
  return <>{element}</>;
};

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
            {/* Routes pour les étudiants */}
            <Route 
              path="/student/dashboard" 
              element={<ProtectedRoute element={<StudentDashboardPage />} requiredRole="student" />} 
            />
            
            {/* Routes pour les professeurs */}
            <Route 
              path="/professor/*" 
              element={<ProtectedRoute element={<ProfessorRoutes />} requiredRole="professor" />} 
            />
            
            {/* Routes pour les administrateurs */}
            <Route 
              path="/admin/*" 
              element={<ProtectedRoute element={<AdminRoutes />} requiredRole="admin" />} 
            />
            
            {/* Routes pour les stages */}
            <Route 
              path="/stages/*" 
              element={<ProtectedRoute element={<StagesPage />} />} 
            />
            
            {/* Routes pour les emplois du temps */}
            <Route 
              path="/schedule" 
              element={<ProtectedRoute element={<SchedulePage />} />} 
            />
            
            {/* Routes pour les notes */}
            <Route 
              path="/grades" 
              element={<ProtectedRoute element={<GradesPage />} />} 
            />
            
            {/* Routes pour les documents */}
            <Route 
              path="/documents" 
              element={<ProtectedRoute element={<DocumentsPage />} />} 
            />
            
            {/* Routes pour les messages */}
            <Route 
              path="/messages" 
              element={<ProtectedRoute element={<MessagesPage />} />} 
            />
            
            {/* Routes pour les notifications */}
            <Route 
              path="/notifications" 
              element={<ProtectedRoute element={<NotificationsPage />} />} 
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