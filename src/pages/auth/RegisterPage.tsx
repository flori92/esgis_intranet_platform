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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Grid,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from '../../components/layout/AuthLayout';

/**
 * Page d'inscription à l'intranet ESGIS
 * Permet aux nouveaux utilisateurs de créer un compte
 */
const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { signUp, authState } = useAuth();
  
  // États pour le formulaire
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('student');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // États pour la validation
  const [fullNameError, setFullNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);

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

  // Validation du nom complet
  const validateFullName = (value: string): boolean => {
    const isValid = value.trim().length >= 3;
    setFullNameError(isValid ? null : 'Le nom complet doit contenir au moins 3 caractères');
    return isValid;
  };

  // Validation de l'email
  const validateEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(value);
    setEmailError(isValid ? null : 'Veuillez entrer une adresse email valide');
    return isValid;
  };

  // Validation du mot de passe
  const validatePassword = (value: string): boolean => {
    const isValid = value.length >= 8;
    setPasswordError(isValid ? null : 'Le mot de passe doit contenir au moins 8 caractères');
    return isValid;
  };

  // Validation de la confirmation du mot de passe
  const validateConfirmPassword = (value: string): boolean => {
    const isValid = value === password;
    setConfirmPasswordError(isValid ? null : 'Les mots de passe ne correspondent pas');
    return isValid;
  };

  // Gestion de la soumission du formulaire
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validation des champs
    const isFullNameValid = validateFullName(fullName);
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);
    
    if (!isFullNameValid || !isEmailValid || !isPasswordValid || !isConfirmPasswordValid) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { error, data } = await signUp(email, password, {
        full_name: fullName,
        role: role as 'admin' | 'professor' | 'student',
      });
      
      if (error) {
        throw error;
      }
      
      if (data) {
        // Redirection vers la page de confirmation
        navigate('/register-success');
      }
    } catch (err: any) {
      console.error('Erreur lors de l\'inscription:', err);
      
      // Gestion des erreurs spécifiques
      if (err.message?.includes('email already in use')) {
        setError('Cette adresse email est déjà utilisée. Veuillez en choisir une autre ou vous connecter.');
      } else {
        setError('Une erreur est survenue lors de l\'inscription. Veuillez réessayer.');
      }
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
          maxWidth: 600,
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
              Créer un compte
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Rejoignez l'intranet ESGIS pour accéder à vos ressources
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Nom complet"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (fullNameError) validateFullName(e.target.value);
                }}
                onBlur={() => validateFullName(fullName)}
                error={!!fullNameError}
                helperText={fullNameError}
                fullWidth
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) validateEmail(e.target.value);
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
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Mot de passe"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) validatePassword(e.target.value);
                  if (confirmPassword && confirmPasswordError) {
                    validateConfirmPassword(confirmPassword);
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
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Confirmer le mot de passe"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (confirmPasswordError) validateConfirmPassword(e.target.value);
                }}
                onBlur={() => validateConfirmPassword(confirmPassword)}
                error={!!confirmPasswordError}
                helperText={confirmPasswordError}
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
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="role-select-label">Rôle</InputLabel>
                <Select
                  labelId="role-select-label"
                  value={role}
                  label="Rôle"
                  onChange={(e) => setRole(e.target.value)}
                  startAdornment={
                    <InputAdornment position="start">
                      <SchoolIcon color="primary" />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="student">Étudiant</MenuItem>
                  <MenuItem value="professor">Professeur</MenuItem>
                </Select>
                <FormHelperText>
                  Sélectionnez votre rôle dans l'établissement
                </FormHelperText>
              </FormControl>
            </Grid>
          </Grid>

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
              'Créer mon compte'
            )}
          </Button>

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2">
              Vous avez déjà un compte ?{' '}
              <Link
                component={RouterLink}
                to="/login"
                color="primary"
                sx={{ textDecoration: 'none' }}
              >
                Se connecter
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </AuthLayout>
  );
};

export default RegisterPage;
