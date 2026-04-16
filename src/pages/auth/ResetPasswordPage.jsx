import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';

import {
  exchangeRecoveryCodeForSession,
  getSession,
  setRecoverySession,
  updatePassword,
} from '@/api/auth';

/**
 * Page de réinitialisation de mot de passe
 * Permet aux utilisateurs de définir un nouveau mot de passe après avoir reçu un lien de réinitialisation
 * @returns {JSX.Element} Page de réinitialisation de mot de passe
 */
const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [canResetPassword, setCanResetPassword] = useState(false);

  const getRecoveryParams = () => {
    const searchParams = new URLSearchParams(location.search);
    const hashValue = location.hash.startsWith('#') ? location.hash.slice(1) : '';
    const hashParams = new URLSearchParams(hashValue);
    const readParam = (key) => searchParams.get(key) || hashParams.get(key);

    return {
      accessToken: readParam('access_token'),
      refreshToken: readParam('refresh_token'),
      recoveryType: readParam('type'),
      code: readParam('code'),
      hasInvalidLinkFlag: readParam('error') === 'invalid_recovery_link',
    };
  };

  useEffect(() => {
    let isActive = true;

    const bootstrapRecoverySession = async () => {
      setSessionLoading(true);
      setError(null);

      try {
        const {
          accessToken,
          refreshToken,
          recoveryType,
          code,
          hasInvalidLinkFlag,
        } = getRecoveryParams();

        if (hasInvalidLinkFlag) {
          throw new Error('Lien de réinitialisation invalide ou expiré.');
        }

        if (accessToken && refreshToken && recoveryType === 'recovery') {
          const { error: sessionError } = await setRecoverySession(accessToken, refreshToken);

          if (sessionError) {
            throw sessionError;
          }

          if (!isActive) {
            return;
          }

          setCanResetPassword(true);
          navigate('/reset-password', { replace: true });
          return;
        }

        if (code) {
          const { error: exchangeError } = await exchangeRecoveryCodeForSession(code);

          if (exchangeError) {
            throw exchangeError;
          }

          if (!isActive) {
            return;
          }

          setCanResetPassword(true);
          navigate('/reset-password', { replace: true });
          return;
        }

        const { data, error: sessionError } = await getSession();
        if (sessionError) {
          throw sessionError;
        }

        if (!isActive) {
          return;
        }

        if (data?.session) {
          setCanResetPassword(true);
        } else {
          throw new Error('Lien de réinitialisation invalide ou expiré.');
        }
      } catch (err) {
        if (!isActive) {
          return;
        }

        console.error('Erreur lors de l\'initialisation de la réinitialisation du mot de passe:', err);
        setCanResetPassword(false);
        setError('Lien de réinitialisation invalide ou expiré.');
      } finally {
        if (isActive) {
          setSessionLoading(false);
        }
      }
    };

    bootstrapRecoverySession();

    return () => {
      isActive = false;
    };
  }, [location.search, location.hash, navigate]);

  /**
   * Gestion de la soumission du formulaire
   * @param {React.FormEvent} e - Événement de soumission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation des champs
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (!canResetPassword) {
        throw new Error('Session de récupération indisponible.');
      }

      // Mettre à jour le mot de passe
      const { error } = await updatePassword(password);

      if (error) {
        throw error;
      }

      // Succès
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error('Erreur lors de la réinitialisation du mot de passe:', err);
      setError('Erreur lors de la réinitialisation du mot de passe. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        maxWidth: 400,
        mx: 'auto',
        p: 2,
      }}
    >
      <Typography variant="h5" component="h1" gutterBottom align="center">
        Réinitialisation du mot de passe
      </Typography>

      {sessionLoading && (
        <Paper elevation={3} sx={{ p: 3, width: '100%', textAlign: 'center' }}>
          <CircularProgress />
          <Typography variant="body2" sx={{ mt: 2 }}>
            Vérification du lien de réinitialisation...
          </Typography>
        </Paper>
      )}

      {!sessionLoading && error && (
        <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
          {error}
        </Alert>
      )}

      {!sessionLoading && success ? (
        <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
          Votre mot de passe a été réinitialisé avec succès. Vous allez être redirigé vers la page de connexion.
        </Alert>
      ) : null}

      {!sessionLoading && !success && canResetPassword ? (
        <Paper elevation={3} sx={{ p: 3, width: '100%' }}>
          <form onSubmit={handleSubmit}>
            <TextField
              label="Nouveau mot de passe"
              type="password"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
            <TextField
              label="Confirmer le mot de passe"
              type="password"
              fullWidth
              margin="normal"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 3 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Réinitialiser le mot de passe'}
            </Button>
          </form>
        </Paper>
      ) : null}

      <Button
        variant="text"
        onClick={() => navigate('/login')}
        sx={{ mt: 2 }}
        disabled={loading}
      >
        Retour à la connexion
      </Button>
    </Box>
  );
};

export default ResetPasswordPage;
