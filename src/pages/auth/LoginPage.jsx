import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from '../../components/layout/AuthLayout';
import StyledLoginForm from '../../components/auth/StyledLoginForm';

/**
 * Page de connexion a l'intranet ESGIS
 */
const LoginPage = () => {
  const navigate = useNavigate();
  const { authState } = useAuth();

  React.useEffect(() => {
    // On ne redirige que si l'utilisateur est connecté ET que le chargement complet (profil, entités) est fini
    if (authState.isAuthenticated && !authState.loading && authState.user) {
      if (authState.isAdmin) {
        navigate('/admin', { replace: true });
      } else if (authState.isProfessor) {
        navigate('/professor', { replace: true });
      } else if (authState.isStudent) {
        navigate('/student', { replace: true });
      }
    }
  }, [authState.isAuthenticated, authState.loading, authState.user, authState.isAdmin, authState.isProfessor, authState.isStudent, navigate]);

  return (
    <AuthLayout>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%', maxWidth: 800, margin: '0 auto' }}>
        <StyledLoginForm />
      </Box>
    </AuthLayout>
  );
};

export default LoginPage;
