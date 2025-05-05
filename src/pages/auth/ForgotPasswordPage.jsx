import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Link,
  Paper,
  InputAdornment,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Email as EmailIcon } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from '../../components/layout/AuthLayout';

/**
 * Page de récupération de mot de passe
 * Permet aux utilisateurs de demander un lien de réinitialisation par email
 * @returns {JSX.Element} Page de récupération de mot de passe
 */
const ForgotPasswordPage = () => {
  // États pour le formulaire
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [emailError, setEmailError] = useState(null);
  
  const { resetPassword } = useAuth();

  /**
   * Validation de l'email
   * @param {string} value - Email à valider
   * @returns {boolean} true si l'email est valide, false sinon
   */
  const validateEmail = (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(value);
    setEmailError(isValid ? null : 'Veuillez entrer une adresse email valide');
    return isValid;
  };

  /**
   * Gestion de la soumission du formulaire
   * @param {React.FormEvent} e - Événement de soumission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation du champ email
    const isEmailValid = validateEmail(email);
    
    if (!isEmailValid) {
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const { error } = await resetPassword(email);
      
      if (error) {
        throw error;
      }
      
      setSuccess(true);
      setEmail(''); // Réinitialiser le champ email après succès
    } catch (err) {
      console.error('Erreur lors de la réinitialisation du mot de passe:', err);
      setError('Une erreur est survenue. Veuillez vérifier votre email et réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 450,
          borderRadius: 2,
        }}
      >
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Typography variant="h5" component="h1" fontWeight="bold" fontFamily="Montserrat">
              Récupération de mot de passe
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Entrez votre adresse email pour recevoir un lien de réinitialisation
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Un email de réinitialisation a été envoyé. Veuillez vérifier votre boîte de réception.
            </Alert>
          )}

          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) {
                validateEmail(e.target.value);
              }
            }}
            onBlur={() => validateEmail(email)}
            error={!!emailError}
            helperText={emailError}
            fullWidth
            required
            disabled={loading || success}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon color="primary" />
                </InputAdornment>
              ),
            }}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading || success}
            sx={{
              py: 1.5,
              mt: 1,
              bgcolor: '#003366', // Bleu ESGIS
              '&:hover': {
                bgcolor: '#002244', // Bleu ESGIS plus foncé
              },
            }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Envoyer le lien de réinitialisation'
            )}
          </Button>

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2">
              <Link
                component={RouterLink}
                to="/login"
                color="primary"
                sx={{ textDecoration: 'none' }}
              >
                Retour à la page de connexion
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
