import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Link,
  Paper,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from '../../components/layout/AuthLayout';

/**
 * Page de connexion à l'intranet ESGIS
 * Permet aux utilisateurs de se connecter avec leur email et mot de passe
 * @returns {JSX.Element} Page de connexion
 */
const LoginPage = () => {
  const navigate = useNavigate();
  const { signIn, authState } = useAuth();
  
  // États pour le formulaire
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // États pour la validation
  const [emailError, setEmailError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);

  // Redirection si déjà connecté
  React.useEffect(() => {
    if (authState.user && !authState.loading) {
      // Rediriger vers le tableau de bord approprié selon le rôle
      if (authState.isAdmin) {
        navigate('/admin/dashboard');
      } else if (authState.isProfessor) {
        navigate('/professor/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    }
  }, [authState, navigate]);

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
   * Validation du mot de passe
   * @param {string} value - Mot de passe à valider
   * @returns {boolean} true si le mot de passe est valide, false sinon
   */
  const validatePassword = (value) => {
    const isValid = value.length >= 6;
    setPasswordError(isValid ? null : 'Le mot de passe doit contenir au moins 6 caractères');
    return isValid;
  };

  /**
   * Gestion de la soumission du formulaire
   * @param {React.FormEvent} e - Événement de soumission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation des champs
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    
    if (!isEmailValid || !isPasswordValid) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        throw error;
      }
      
      // La redirection sera gérée par l'effet useEffect ci-dessus
    } catch (err) {
      console.error('Erreur de connexion:', err);
      setError('Identifiants incorrects. Veuillez vérifier votre email et mot de passe.');
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
              Connexion à l'Intranet ESGIS
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Entrez vos identifiants pour accéder à votre espace
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
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
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon color="primary" />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label="Mot de passe"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (passwordError) {
                validatePassword(e.target.value);
              }
            }}
            onBlur={() => validatePassword(password)}
            error={!!passwordError}
            helperText={passwordError}
            fullWidth
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon color="primary" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Link
            component={RouterLink}
            to="/forgot-password"
            variant="body2"
            color="primary"
            sx={{ alignSelf: 'flex-end', textDecoration: 'none' }}
          >
            Mot de passe oublié ?
          </Link>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
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
              'Se connecter'
            )}
          </Button>

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2">
              Vous n'avez pas de compte ?{' '}
              <Link
                component={RouterLink}
                to="/register"
                color="primary"
                sx={{ textDecoration: 'none' }}
              >
                Créer un compte
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </AuthLayout>
  );
};

export default LoginPage;
