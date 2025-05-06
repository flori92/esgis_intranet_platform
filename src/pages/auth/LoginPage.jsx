import React, { useState, useEffect } from 'react';
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
  Divider,
  Card,
  CardContent,
  Grid,
  Chip,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock as LockIcon,
  AdminPanelSettings,
  School,
  Person,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from '../../components/layout/AuthLayout';
import { getTestAccountsInfo } from '../../utils/initTestAccounts';
import { initializeTestAccounts } from '../../utils/initTestAccounts';
import { supabase } from '../../supabase';

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
  const [testAccounts, setTestAccounts] = useState([]);
  const [initializingAccounts, setInitializingAccounts] = useState(false);
  const [initializationResult, setInitializationResult] = useState(null);
  
  // États pour la validation
  const [emailError, setEmailError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);

  // Charger les informations des comptes de test
  useEffect(() => {
    setTestAccounts(getTestAccountsInfo());
  }, []);

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

  /**
   * Connexion rapide avec un compte de test
   * @param {Object} account - Compte de test
   */
  const handleTestLogin = async (account) => {
    setEmail(account.email);
    setPassword(account.password);
    
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await signIn(account.email, account.password);
      
      if (error) {
        throw error;
      }
      
      // La redirection sera gérée par l'effet useEffect ci-dessus
    } catch (err) {
      console.error('Erreur de connexion avec compte de test:', err);
      setError(`Erreur de connexion avec le compte ${account.role}. ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Initialisation des comptes de test
   */
  const handleInitializeTestAccounts = async () => {
    setInitializingAccounts(true);
    setInitializationResult(null);
    
    try {
      const result = await initializeTestAccounts();
      setInitializationResult(result);
    } catch (err) {
      console.error('Erreur lors de l\'initialisation des comptes de test:', err);
      setInitializationResult({ 
        success: [], 
        errors: [{ role: 'global', error: err.message }] 
      });
    } finally {
      setInitializingAccounts(false);
    }
  };

  // Icônes pour les différents rôles
  const roleIcons = {
    admin: <AdminPanelSettings />,
    professor: <School />,
    student: <Person />
  };

  // Couleurs pour les différents rôles
  const roleColors = {
    admin: 'error',
    professor: 'primary',
    student: 'success'
  };

  return (
    <AuthLayout>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%', maxWidth: 800 }}>
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
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
              <img 
                src="https://esgis.org/wp-content/uploads/2023/01/logo-esgis-2.png" 
                alt="Logo ESGIS" 
                style={{ height: 80, marginBottom: 16 }}
                onError={(e) => {
                  console.error("Erreur de chargement du logo ESGIS");
                  e.target.style.display = 'none';
                }}
              />
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
              to="/reset-password"
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
          </Box>
        </Paper>

        {/* Section des comptes de test */}
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" component="h2" fontWeight="bold" sx={{ mb: 2 }}>
            Comptes de test
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Utilisez ces comptes pour tester les différentes fonctionnalités de l'application.
          </Typography>

          {initializationResult && (
            <Alert 
              severity={initializationResult.errors.length > 0 ? "warning" : "success"} 
              sx={{ mb: 3 }}
            >
              {initializationResult.errors.length > 0 ? (
                <>
                  <Typography variant="subtitle2">
                    Initialisation partielle des comptes de test
                  </Typography>
                  <Typography variant="body2">
                    Succès: {initializationResult.success.join(', ') || 'Aucun'}
                  </Typography>
                  <Typography variant="body2">
                    Erreurs: {initializationResult.errors.map(e => `${e.role}: ${e.error}`).join(', ')}
                  </Typography>
                </>
              ) : (
                <>
                  <Typography variant="subtitle2">
                    Initialisation réussie des comptes de test
                  </Typography>
                  <Typography variant="body2">
                    Comptes créés: {initializationResult.success.join(', ')}
                  </Typography>
                </>
              )}
            </Alert>
          )}

          <Grid container spacing={2}>
            {testAccounts.map((account) => (
              <Grid item xs={12} md={4} key={account.role}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      {roleIcons[account.role]}
                      <Typography variant="subtitle1" sx={{ ml: 1, fontWeight: 'bold' }}>
                        {account.fullName}
                      </Typography>
                      <Chip 
                        label={account.role.charAt(0).toUpperCase() + account.role.slice(1)} 
                        size="small" 
                        color={roleColors[account.role]} 
                        sx={{ ml: 'auto' }} 
                      />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      <strong>Email:</strong> {account.email}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      <strong>Mot de passe:</strong> {account.password}
                    </Typography>
                    
                    <Button
                      variant="outlined"
                      color={roleColors[account.role]}
                      fullWidth
                      onClick={() => handleTestLogin(account)}
                      startIcon={roleIcons[account.role]}
                    >
                      Connexion rapide
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleInitializeTestAccounts}
              disabled={initializingAccounts}
              startIcon={initializingAccounts ? <CircularProgress size={20} /> : null}
            >
              {initializingAccounts ? 'Initialisation en cours...' : 'Initialiser les comptes de test'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </AuthLayout>
  );
};

export default LoginPage;
