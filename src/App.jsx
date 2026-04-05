import { Suspense, lazy, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import RouteLoader from './components/common/RouteLoader';
import notificationService from './services/NotificationService';

const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const MainLayout = lazy(() => import('./components/layout/MainLayout'));
const AdminRoutes = lazy(() => import('./routes/AdminRoutes'));
const ProfessorRoutes = lazy(() => import('./routes/ProfessorRoutes'));
const StudentRoutes = lazy(() => import('./routes/StudentRoutes'));
const SchedulePage = lazy(() => import('./pages/schedule/SchedulePage'));
const GradesPage = lazy(() => import('./pages/grades/GradesPage'));
const DocumentsPage = lazy(() => import('./pages/documents/DocumentsPage'));
const MessagesPage = lazy(() => import('./pages/messages/MessagesPage'));
const NotificationsPage = lazy(() => import('./pages/notifications/NotificationsPage'));
const StagesPage = lazy(() => import('./pages/stages/StagesPage'));
const ProfileSettingsPage = lazy(() => import('./pages/shared/ProfileSettingsPage'));
const ForumPage = lazy(() => import('./pages/shared/ForumPage'));
const VerifyDocumentPage = lazy(() => import('./pages/public/VerifyDocumentPage'));

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
    return <RouteLoader fullScreen />;
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
    return <RouteLoader fullScreen />;
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
  // Initialisation des services globaux
  useEffect(() => {
    notificationService.init();
  }, []);

  return (
    <Router>
      <AuthProvider>
        <Suspense fallback={<RouteLoader fullScreen />}>
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
              
              <Route 
                path="/forums" 
                element={
                  <ProtectedRoute>
                    <ForumPage />
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
        </Suspense>
      </AuthProvider>
    </Router>
  );
}

export default App;
