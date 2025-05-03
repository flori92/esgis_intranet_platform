import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Paper,
  Alert,
  CheckCircleOutline as CheckCircleOutlineIcon,
} from '@mui/material';
import AuthLayout from '../../components/layout/AuthLayout';

/**
 * Page de confirmation d'inscription
 * Affichée après une inscription réussie
 */
const RegisterSuccessPage: React.FC = () => {
  return (
    <AuthLayout>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 500,
          borderRadius: 2,
          textAlign: 'center',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <CheckCircleOutlineIcon
            color="success"
            sx={{ fontSize: 80, mb: 2 }}
          />
          
          <Typography variant="h5" component="h1" fontWeight="bold" fontFamily="Montserrat">
            Inscription réussie !
          </Typography>
          
          <Typography variant="body1" color="text.secondary">
            Votre compte a été créé avec succès. Un email de confirmation a été envoyé à votre adresse email.
          </Typography>
          
          <Alert severity="info" sx={{ width: '100%', mt: 2 }}>
            Veuillez vérifier votre boîte de réception et cliquer sur le lien de confirmation pour activer votre compte.
          </Alert>
          
          <Box sx={{ mt: 3, width: '100%' }}>
            <Button
              component={RouterLink}
              to="/login"
              variant="contained"
              fullWidth
              sx={{
                py: 1.5,
                bgcolor: '#003366', // Bleu ESGIS
                '&:hover': {
                  bgcolor: '#002244', // Bleu ESGIS plus foncé
                },
              }}
            >
              Se connecter
            </Button>
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Si vous ne recevez pas l'email dans les prochaines minutes, vérifiez votre dossier de spam ou{' '}
            <RouterLink to="/contact" style={{ color: '#003366', textDecoration: 'none' }}>
              contactez le support
            </RouterLink>.
          </Typography>
        </Box>
      </Paper>
    </AuthLayout>
  );
};

export default RegisterSuccessPage;
