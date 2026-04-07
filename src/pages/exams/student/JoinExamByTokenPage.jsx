import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Paper, 
  Alert, 
  Button,
  Container,
  Divider
} from '@mui/material';
import { 
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  ArrowForward as ArrowForwardIcon,
  List as ListIcon
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import { joinExamByToken } from '@/api/exams';

/**
 * Page pour rejoindre un examen via un jeton de partage (share_token)
 */
const JoinExamByTokenPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { authState } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');
  const [examId, setExamId] = useState(null);

  useEffect(() => {
    const performJoin = async () => {
      if (!token || !authState.user?.id) {
        if (!token) {
          setStatus('error');
          setMessage('Jeton de partage manquant.');
          setLoading(false);
        }
        return;
      }

      try {
        const result = await joinExamByToken(token, authState.user.id);
        
        if (result.success) {
          setStatus('success');
          setMessage(result.message || 'Vous avez rejoint l\'examen avec succès.');
          setExamId(result.exam_id);
        } else {
          setStatus('error');
          setMessage(result.message || 'Impossible de rejoindre l\'examen.');
        }
      } catch (err) {
        console.error('Erreur lors de la tentative de rejoindre l\'examen:', err);
        setStatus('error');
        setMessage('Une erreur inattendue est survenue.');
      } finally {
        setLoading(false);
      }
    };

    if (authState.user?.id) {
      performJoin();
    } else if (!authState.loading && !authState.user) {
      // Si pas connecté, le ProtectedRoute devrait déjà avoir redirigé vers /login
      // Mais au cas où, on gère ici
      navigate('/login', { state: { from: `/student/exams/join/${token}` } });
    }
  }, [token, authState.user, authState.loading, navigate]);

  const handleGoToExam = () => {
    if (examId) {
      navigate(`/student/exams/${examId}/take`);
    }
  };

  const handleGoToExamsList = () => {
    navigate('/student/exams');
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, width: '100%', textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            Inscription à l'examen via lien
          </Typography>
          
          <Divider sx={{ my: 3 }} />

          {loading ? (
            <Box sx={{ py: 4 }}>
              <CircularProgress size={60} />
              <Typography sx={{ mt: 2 }} color="text.secondary">
                Traitement de votre inscription en cours...
              </Typography>
            </Box>
          ) : (
            <Box>
              {status === 'success' ? (
                <Box>
                  <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
                  <Typography variant="h6" color="success.main" gutterBottom>
                    Opération réussie
                  </Typography>
                  <Alert severity="success" sx={{ mb: 4 }}>
                    {message}
                  </Alert>
                  
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      startIcon={<ArrowForwardIcon />}
                      onClick={handleGoToExam}
                    >
                      Aller à l'examen
                    </Button>
                    <Button 
                      variant="outlined" 
                      startIcon={<ListIcon />}
                      onClick={handleGoToExamsList}
                    >
                      Mes examens
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box>
                  <ErrorIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
                  <Typography variant="h6" color="error.main" gutterBottom>
                    Échec de l'opération
                  </Typography>
                  <Alert severity="error" sx={{ mb: 4 }}>
                    {message}
                  </Alert>
                  
                  <Button 
                    variant="contained" 
                    onClick={handleGoToExamsList}
                    startIcon={<ListIcon />}
                  >
                    Retour à mes examens
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default JoinExamByTokenPage;
