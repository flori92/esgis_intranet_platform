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
    if (authState.user && !authState.loading) {
      if (authState.isAdmin) {
        navigate('/admin');
      } else if (authState.isProfessor) {
        navigate('/professor');
      } else {
        navigate('/student');
      }
    }
  }, [authState, navigate]);

  return (
    <AuthLayout>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%', maxWidth: 800, margin: '0 auto' }}>
        <StyledLoginForm />
      </Box>
    </AuthLayout>
  );
};

export default LoginPage;
