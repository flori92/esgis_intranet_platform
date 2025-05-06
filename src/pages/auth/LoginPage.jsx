import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Alert,
  AlertTitle,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Chip,
  Avatar,
  CardActions,
  Button
} from '@mui/material';
import {
  AdminPanelSettings as AdminPanelSettingsIcon,
  School as SchoolIcon,
  Person as PersonIcon,
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
  const { signIn, authState, handleQuickLogin } = useAuth();
  
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
  const handleTestLogin = (account) => {
    handleQuickLogin(account.email, account.password);
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
              p: 3, 
              mb: 3, 
              borderRadius: 2,
              backgroundColor: '#fff',
            }}
          >
            <Typography variant="h6" gutterBottom>
              Comptes de test
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Utilisez ces comptes pour tester les différentes fonctionnalités de l'application.
            </Typography>
            
            {initializationResult && (
              <Alert 
                severity={initializationResult.errors.length > 0 ? "warning" : "success"}
                sx={{ mb: 2 }}
              >
                <AlertTitle>Initialisation {initializationResult.errors.length > 0 ? "partielle" : "réussie"} des comptes de test</AlertTitle>
                {initializationResult.success.length > 0 && (
                  <Typography variant="body2">
                    Succès: {initializationResult.success.length > 0 ? initializationResult.success.join(', ') : 'Aucun'}
                  </Typography>
                )}
                {initializationResult.errors.length > 0 && (
                  <Typography variant="body2">
                    Erreurs: {initializationResult.errors.map(e => `${e.role}: ${e.error}`).join(', ')}
                  </Typography>
                )}
              </Alert>
            )}
            
            <Grid container spacing={2}>
              {testAccounts.map((account) => (
                <Grid item xs={12} sm={4} key={account.role}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      backgroundColor: 
                        account.role === 'admin' ? '#f8f9fa' : 
                        account.role === 'professor' ? '#f1f8e9' : 
                        '#e3f2fd',
                      border: '1px solid',
                      borderColor: 
                        account.role === 'admin' ? '#dee2e6' : 
                        account.role === 'professor' ? '#c5e1a5' : 
                        '#90caf9',
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Avatar
                          sx={{
                            bgcolor: 
                              account.role === 'admin' ? '#dc3545' : 
                              account.role === 'professor' ? '#198754' : 
                              '#0d6efd',
                            width: 30,
                            height: 30,
                            fontSize: '0.875rem',
                            mr: 1
                          }}
                        >
                          {account.role === 'admin' ? <AdminPanelSettingsIcon fontSize="small" /> : 
                           account.role === 'professor' ? <SchoolIcon fontSize="small" /> : 
                           <PersonIcon fontSize="small" />}
                        </Avatar>
                        <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'bold' }}>
                          {account.fullName}
                        </Typography>
                      </Box>
                      <Box sx={{ 
                        display: 'inline-block', 
                        px: 1, 
                        py: 0.5, 
                        borderRadius: 1, 
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        mb: 1,
                        backgroundColor: 
                          account.role === 'admin' ? '#dc3545' : 
                          account.role === 'professor' ? '#198754' : 
                          '#0d6efd',
                        color: '#fff'
                      }}>
                        {account.role === 'admin' ? 'Admin' : 
                         account.role === 'professor' ? 'Professor' : 
                         'Student'}
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        <strong>Email:</strong> {account.email}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Mot de passe:</strong> {account.password}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button 
                        fullWidth 
                        variant="contained"
                        size="small"
                        onClick={() => handleTestLogin(account)}
                        sx={{ 
                          backgroundColor: 
                            account.role === 'admin' ? '#dc3545' : 
                            account.role === 'professor' ? '#198754' : 
                            '#0d6efd',
                          '&:hover': {
                            backgroundColor: 
                              account.role === 'admin' ? '#bb2d3b' : 
                              account.role === 'professor' ? '#157347' : 
                              '#0b5ed7',
                          }
                        }}
                      >
                        CONNEXION RAPIDE
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="outlined"
                onClick={handleInitializeTestAccounts}
                disabled={initializingAccounts}
                startIcon={initializingAccounts ? <CircularProgress size={20} /> : null}
                sx={{ textTransform: 'uppercase' }}
              >
                {initializingAccounts ? 'Initialisation en cours...' : 'Initialiser les comptes de test'}
              </Button>
            </Box>
          </Paper>
        )}
      </Box>
    </AuthLayout>
  );
};

export default LoginPage;
