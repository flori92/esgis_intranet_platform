import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Chip,
} from '@mui/material';
import {
  AdminPanelSettings,
  School,
  Person,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from '../../components/layout/AuthLayout';
import StyledLoginForm from '../../components/auth/StyledLoginForm';
import { getTestAccountsInfo } from '../../utils/initTestAccounts';
import { initializeTestAccounts } from '../../utils/initTestAccounts';
import toast from 'react-hot-toast'; // Importer la bibliothèque de notifications

/**
 * Page de connexion à l'intranet ESGIS
 * Permet aux utilisateurs de se connecter avec leur email et mot de passe
 * @returns {JSX.Element} Page de connexion
 */
const LoginPage = () => {
  const navigate = useNavigate();
  const { signIn, authState } = useAuth();
  
  // États
  const [testAccounts, setTestAccounts] = useState([]);
  const [initializingAccounts, setInitializingAccounts] = useState(false);
  const [initializationResult, setInitializationResult] = useState(null);
  const [showTestAccounts, setShowTestAccounts] = useState(false);

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
   * Connexion rapide avec un compte de test
   * @param {Object} account - Compte de test
   */
  const handleTestLogin = async (account) => {
    try {
      const { error } = await signIn(account.email, account.password);
      
      if (error) {
        throw error;
      }
      
      // La redirection sera gérée par l'effet useEffect ci-dessus
    } catch (err) {
      console.error('Erreur de connexion avec compte de test:', err);
      alert(`Erreur de connexion avec le compte ${account.role}. ${err.message}`);
    }
  };

  /**
   * Initialisation des comptes de test
   */
  const handleInitializeTestAccounts = async () => {
    setInitializingAccounts(true);
    setInitializationResult(null);
    
    try {
      // Utiliser la nouvelle fonction d'initialisation
      const result = await initializeTestAccounts();
      
      // Afficher les résultats
      if (result.success.length > 0) {
        toast.success(`Comptes initialisés avec succès: ${result.success.join(', ')}`);
      }
      
      if (result.errors.length > 0) {
        const errorMessages = result.errors.map(e => `${e.role}: ${e.error}`).join(', ');
        setInitializationResult({
          success: result.success.length > 0 ? result.success : [],
          errors: result.errors
        });
        toast.error(`Initialisation partielle des comptes de test\nErreurs: ${errorMessages}`);
      } else if (result.success.length === 0) {
        toast.error('Aucun compte n\'a été initialisé');
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation des comptes de test:', error);
      toast.error(`Erreur: ${error.message}`);
      setInitializationResult({
        success: [],
        errors: [{ role: 'global', error: error.message }]
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
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%', maxWidth: 800, margin: '0 auto' }}>
        {/* Formulaire de connexion stylisé */}
        <StyledLoginForm onTestAccountsClick={() => setShowTestAccounts(!showTestAccounts)} />
        
        {/* Section des comptes de test */}
        {showTestAccounts && (
          <Paper
            elevation={3}
            sx={{
              p: 4,
              width: '100%',
              borderRadius: 2,
              mt: 3
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
                      
                      <Box 
                        sx={{ 
                          p: 2, 
                          bgcolor: roleColors[account.role] + '.50', 
                          borderRadius: 1,
                          cursor: 'pointer',
                          textAlign: 'center',
                          '&:hover': {
                            bgcolor: roleColors[account.role] + '.100',
                          }
                        }}
                        onClick={() => handleTestLogin(account)}
                      >
                        <Typography variant="button" color={roleColors[account.role] + '.800'}>
                          Connexion rapide
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'primary.50',
                  borderRadius: 2,
                  display: 'inline-block',
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'primary.100',
                  }
                }}
                onClick={handleInitializeTestAccounts}
              >
                {initializingAccounts ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={20} color="primary" />
                    <Typography variant="button" color="primary.800">
                      Initialisation en cours...
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="button" color="primary.800">
                    Initialiser les comptes de test
                  </Typography>
                )}
              </Box>
            </Box>
          </Paper>
        )}
      </Box>
    </AuthLayout>
  );
};

export default LoginPage;
