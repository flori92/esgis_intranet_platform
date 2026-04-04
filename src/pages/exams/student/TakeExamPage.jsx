import React, { useState, useEffect } from 'react';
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
  DialogActions
} from '@mui/material';
import { 
  Warning as WarningIcon,
  Timer as TimerIcon
} from '@mui/icons-material';
import { useAuth } from '@/context/AuthContext';
import Quiz from '../core/Quiz';
import { getStudentExamLaunchData, markStudentExamStarted } from '@/api/exams';

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
  const [otpError, setOtpValueError] = useState(false);
  
  useEffect(() => {
    const fetchExam = async () => {
      try {
        setLoading(true);
        
        if (!authState.isStudent || !authState.student?.id || !authState.profile?.id) {
          throw new Error('Accès non autorisé');
        }

        const { exam: examData, studentExam, error: launchError } = await getStudentExamLaunchData({
          examId: id,
          studentId: authState.student.id
        });

        if (launchError) {
          throw launchError;
        }
        
        // Vérifier si l'examen est disponible
        const examDate = new Date(examData.date);
        const now = new Date();

        if (!['published', 'in_progress'].includes(examData.status)) {
          throw new Error('Cet examen n\'est pas encore disponible');
        }
        
        if (examDate > now) {
          throw new Error('Cet examen n\'est pas encore disponible');
        }
        
        if (studentExam.attempt_status === 'submitted') {
          throw new Error('Vous avez déjà soumis cet examen');
        }
        
        // Formater les données de l'examen
        const formattedExam = {
          ...examData,
          course_name: examData.course_name || 'Cours inconnu',
          professor_name: examData.professor_name || 'Professeur inconnu',
          student_exam_id: studentExam.id,
          attempt_status: studentExam.attempt_status
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
  
  const handleStartExam = async () => {
    try {
      const { error } = await markStudentExamStarted({
        studentExamId: exam.student_exam_id,
        examId: Number(id)
      });

      if (error) throw error;
      
      // Marquer l'examen comme commencé
      setExamStarted(true);
      
      // Fermer les boîtes de dialogue
      setConfirmDialogOpen(false);
      setOtpDialogOpen(false);
    } catch (error) {
      console.error('Erreur lors du démarrage de l\'examen:', error);
      setError('Impossible de démarrer l\'examen. Veuillez réessayer.');
    }
  };

  const handleOtpSubmit = () => {
    if (otpValue.toLowerCase() === "esgis2026") {
      setOtpValueError(false);
      setConfirmDialogOpen(true);
    } else {
      setOtpValueError(true);
    }
  };
  
  const handleConfirmStart = () => {
    setConfirmDialogOpen(true);
  };
  
  const handleCancelStart = () => {
    setConfirmDialogOpen(false);
  };
  
  const handleGoBack = () => {
    navigate('/student/exams');
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
          <Button variant="contained" onClick={handleGoBack}>
            Retour à la liste des examens
          </Button>
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
            <Typography variant="h6">
              Durée: {exam.duration} minutes
            </Typography>
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
              Toute tentative de quitter la page ou de changer d'onglet sera considérée comme une tentative de triche.
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
                onClick={() => setOtpDialogOpen(true)}
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
          Code d'accès requis
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Veuillez saisir le code confidentiel (OTP) fourni par le surveillant pour déverrouiller l'épreuve.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Code OTP"
            type="text"
            fullWidth
            variant="outlined"
            value={otpValue}
            onChange={(e) => setOtpValue(e.target.value)}
            error={otpError}
            helperText={otpError ? "Code incorrect. Veuillez réessayer." : "Indice: ESGIS2026"}
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
