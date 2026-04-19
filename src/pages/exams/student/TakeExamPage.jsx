import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  CircularProgress, 
  Alert, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField
} from '@mui/material';
import { 
  Warning as WarningIcon,
  Timer as TimerIcon
} from '@mui/icons-material';
import { useAuth } from '@/context/AuthContext';
import Quiz from '../core/Quiz';
import { getStudentExamLaunchData, markStudentExamStarted, verifyExamAccessCode } from '@/api/exams';
import { formatCountdown, getExamEndTime, getExamTimerMode, getRemainingTimeParts } from '../utils/examTiming';

/**
 * Page permettant à un étudiant de passer un examen
 */
const TakeExamPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authState } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exam, setExam] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [examStarted, setExamStarted] = useState(false);
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpError, setOtpError] = useState('');
  const [roomCountdown, setRoomCountdown] = useState(null);
  
  useEffect(() => {
    const fetchExam = async () => {
      try {
        setLoading(true);
        
        if (!authState.isStudent || !authState.student?.id || !authState.profile?.id) {
          throw new Error('Accès non autorisé');
        }

        const { exam: examData, studentExam, error: launchError } = await getStudentExamLaunchData({
          examId: id,
          profileId: authState.user.id
        });

        if (launchError) {
          throw launchError;
        }
        
        // Vérifier si l'examen est disponible
        const examDate = new Date(examData.date);
        const now = new Date();
        const isImmediateAccessExam = ['training', 'mock_exam'].includes(examData.category);

        if (!['published', 'in_progress'].includes(examData.status)) {
          throw new Error('Cet examen n\'est pas encore disponible');
        }
        
        if (!isImmediateAccessExam && examDate > now) {
          throw new Error('Cet examen n\'est pas encore disponible');
        }
        
        if (studentExam.attempt_status === 'submitted') {
          throw new Error('Vous avez déjà soumis cet examen');
        }

        const timerMode = getExamTimerMode(examData.settings || {});
        if (timerMode === 'room' && studentExam.attempt_status !== 'in_progress') {
          const roomEndTime = getExamEndTime({
            examDate: examData.date,
            duration: examData.duration,
            settings: examData.settings || {}
          });
          const remaining = getRemainingTimeParts(roomEndTime, now);

          if (remaining.isExpired) {
            throw new Error("Le temps de composition est écoulé pour cette salle.");
          }
        }
        
        // Formater les données de l'examen
        const formattedExam = {
          ...examData,
          course_name: examData.course_name || 'Cours inconnu',
          professor_name: examData.professor_name || 'Professeur inconnu',
          student_exam_id: studentExam.id,
          attempt_status: studentExam.attempt_status,
          access_verified_at: studentExam.access_verified_at || null
        };
        
        setExam(formattedExam);

        if (studentExam.attempt_status === 'in_progress') {
          setExamStarted(true);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'examen:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchExam();
  }, [id, authState]);

  useEffect(() => {
    if (!exam || examStarted || getExamTimerMode(exam.settings || {}) !== 'room') {
      setRoomCountdown(null);
      return undefined;
    }

    const roomEndTime = getExamEndTime({
      examDate: exam.date,
      duration: exam.duration,
      settings: exam.settings || {}
    });

    const syncCountdown = () => {
      setRoomCountdown(getRemainingTimeParts(roomEndTime, new Date()));
    };

    syncCountdown();
    const intervalId = setInterval(syncCountdown, 1000);

    return () => clearInterval(intervalId);
  }, [exam, examStarted]);

  const isRoomTimer = useMemo(
    () => getExamTimerMode(exam?.settings || {}) === 'room',
    [exam]
  );
  
  const handleStartExam = async () => {
    try {
      const { error } = await markStudentExamStarted({
        studentExamId: exam.student_exam_id,
        examId: Number(id),
        profileId: authState.user.id
      });

      if (error) throw error;
      
      // Marquer l'examen comme commencé
      setExamStarted(true);
      
      // Fermer les boîtes de dialogue
      setConfirmDialogOpen(false);
      setOtpDialogOpen(false);
    } catch (error) {
      console.error('Erreur lors du démarrage de l\'examen:', error);
      setError(error.message || 'Impossible de démarrer l\'examen. Veuillez réessayer.');
    }
  };

  const handleOtpSubmit = async () => {
    if (!exam?.access_code_required) {
      setOtpError('');
      setOtpDialogOpen(false);
      setConfirmDialogOpen(true);
      return;
    }

    try {
      const { success, error: verificationError } = await verifyExamAccessCode({
        studentExamId: exam.student_exam_id,
        examId: Number(id),
        profileId: authState.user.id,
        code: otpValue
      });

      if (!success) {
        throw verificationError || new Error("Code d'accès invalide.");
      }

      setOtpError('');
      setExam((previous) => ({
        ...previous,
        access_verified_at: new Date().toISOString()
      }));
      setOtpDialogOpen(false);
      setConfirmDialogOpen(true);
    } catch (verificationError) {
      setOtpError(verificationError.message || "Code d'accès invalide.");
    }
  };
  
  const handleConfirmStart = () => {
    if (exam?.access_code_required && !exam?.access_verified_at) {
      setOtpDialogOpen(true);
      return;
    }
    setConfirmDialogOpen(true);
  };
  
  const handleCancelStart = () => {
    setConfirmDialogOpen(false);
  };
  
  const handleGoBack = () => {
    navigate('/student/exams');
  };

  const handleViewResults = () => {
    navigate(`/student/exams/${id}/results`);
  };
  
  // Si l'examen est commencé, afficher le composant Quiz
  if (examStarted) {
    return (
      <Box sx={{ height: '100vh', overflow: 'hidden' }}>
        <Quiz />
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 3 }}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box sx={{ my: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {error.toLowerCase().includes('déjà soumis') && (
              <Button variant="contained" onClick={handleViewResults}>
                Voir le résultat
              </Button>
            )}
            <Button variant="outlined" onClick={handleGoBack}>
              Retour à la liste des examens
            </Button>
          </Box>
        </Box>
      ) : (
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>
            {exam.title}
          </Typography>
          
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" color="text.secondary">
              {exam.course_name} ({exam.course_code || 'N/A'})
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Professeur: {exam.professor_name}
            </Typography>
          </Box>
          
          <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
            <TimerIcon color="warning" />
            <Box>
              <Typography variant="h6">
                Durée officielle: {exam.duration} minutes
              </Typography>
              {isRoomTimer && roomCountdown && (
                <Typography variant="body2" color={roomCountdown.isExpired ? 'error.main' : 'text.secondary'}>
                  Chrono commun à toute la salle. Temps restant: {formatCountdown(roomCountdown)}
                </Typography>
              )}
            </Box>
          </Box>
          
          {exam.description && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Instructions
              </Typography>
              <Typography variant="body1">
                {exam.description}
              </Typography>
            </Box>
          )}
          
          <Box sx={{ mb: 4, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <WarningIcon color="warning" />
              <Typography variant="h6">
                Attention
              </Typography>
            </Box>
            <Typography variant="body2">
              Une fois que vous aurez commencé l'examen, vous ne pourrez pas le quitter avant de l'avoir terminé.
              {exam.access_code_required && ' Le code d\'accès communiqué par le surveillant est obligatoire avant l\'entrée dans la copie.'}
              {isRoomTimer && ' Le minuteur est commun à toute la salle: un retard ne redonne pas du temps supplémentaire.'}
              Toute tentative de quitter la page, changer d'onglet, ouvrir les outils techniques ou copier-coller déclenchera
              une alerte sonore et une carte rouge visible. À la {exam.max_cheating_alerts || 3}e alerte, l'examen sera arrêté puis soumis automatiquement.
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button variant="outlined" onClick={handleGoBack}>
              Annuler
            </Button>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Button 
                variant="contained" 
                color="primary"
                onClick={handleConfirmStart}
              >
                Commencer l'examen
              </Button>
            </Box>
          </Box>
        </Paper>
      )}
      
      {/* Dialogue OTP */}
      <Dialog
        open={otpDialogOpen}
        onClose={() => setOtpDialogOpen(false)}
      >
        <DialogTitle>
          {exam?.access_code_required ? "Code d'accès requis" : 'Déverrouillage de l\'épreuve'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Veuillez saisir le code communiqué par le surveillant pour déverrouiller l'épreuve.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Code d'accès"
            type="text"
            fullWidth
            variant="outlined"
            value={otpValue}
            onChange={(e) => {
              setOtpValue(e.target.value);
              if (otpError) {
                setOtpError('');
              }
            }}
            error={Boolean(otpError)}
            helperText={otpError || 'Le code est vérifié côté serveur avant le démarrage de votre copie.'}
            onKeyPress={(e) => e.key === 'Enter' && handleOtpSubmit()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOtpDialogOpen(false)}>Annuler</Button>
          <Button onClick={handleOtpSubmit} variant="contained" color="primary">
            Valider le code
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialogue de confirmation */}
      <Dialog
        open={confirmDialogOpen}
        onClose={handleCancelStart}
      >
        <DialogTitle>
          Confirmer le démarrage de l'examen
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir commencer l'examen maintenant ? 
            Une fois commencé, vous ne pourrez pas l'interrompre et le chronomètre démarrera.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelStart}>Annuler</Button>
          <Button onClick={handleStartExam} variant="contained" color="primary">
            Commencer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TakeExamPage;
