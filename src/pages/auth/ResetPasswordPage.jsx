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

// Correction du chemin d'importation de Supabase
import { supabase } from '../../services/supabase';

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
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Extraire le token de réinitialisation de l'URL
  useEffect(() => {
    // Le hash contient le token après le #
    const hashParams = new URLSearchParams(location.hash.substring(1));
    if (!hashParams.get('type') || !hashParams.get('access_token')) {
      setError('Lien de réinitialisation invalide ou expiré.');
    }
  }, [location]);

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
      // Récupérer le token de l'URL
      const hashParams = new URLSearchParams(location.hash.substring(1));
      const accessToken = hashParams.get('access_token');

      if (!accessToken) {
        throw new Error('Token de réinitialisation manquant.');
      }

      // Mettre à jour le mot de passe
      const { error } = await supabase.auth.updateUser({
        password,
      });

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

      {error && (
        <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
          {error}
        </Alert>
      )}

      {success ? (
        <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
          Votre mot de passe a été réinitialisé avec succès. Vous allez être redirigé vers la page de connexion.
        </Alert>
      ) : (
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
      )}

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
