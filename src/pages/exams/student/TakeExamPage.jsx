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
import { supabase } from '@/supabase';
import MainLayout from '@/components/layout/MainLayout';
import Quiz from '../core/Quiz';

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
  
  useEffect(() => {
    const fetchExam = async () => {
      try {
        setLoading(true);
        
        if (!authState.user || !authState.isStudent) {
          throw new Error('Accès non autorisé');
        }
        
        // Récupérer les détails de l'examen
        const { data: examData, error: examError } = await supabase
          .from('exams')
          .select(`
            id,
            title,
            course_id,
            courses:course_id (name, code),
            professor_id,
            professor_name,
            date,
            duration,
            type,
            room,
            total_points,
            passing_grade,
            status,
            description
          `)
          .eq('id', id)
          .single();
        
        if (examError) throw examError;
        
        if (!examData) {
          throw new Error('Examen non trouvé');
        }
        
        // Vérifier si l'étudiant est inscrit à cet examen
        const { data: studentExam, error: studentExamError } = await supabase
          .from('student_exams')
          .select('*')
          .eq('exam_id', id)
          .eq('student_id', authState.user.id)
          .single();
        
        if (studentExamError && studentExamError.code !== 'PGRST116') {
          throw studentExamError;
        }
        
        if (!studentExam) {
          throw new Error('Vous n\'êtes pas inscrit à cet examen');
        }
        
        // Vérifier si l'examen est disponible
        const examDate = new Date(examData.date);
        const now = new Date();
        
        if (examData.status !== 'active') {
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
          course_name: examData.courses && typeof examData.courses === 'object' ? examData.courses.name : 'Cours inconnu',
          professor_name: examData.professor_name || 'Professeur inconnu',
          student_exam_id: studentExam.id,
          attempt_status: studentExam.attempt_status
        };
        
        setExam(formattedExam);
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
      // Mettre à jour le statut de la tentative
      const { error } = await supabase
        .from('student_exams')
        .update({ attempt_status: 'in_progress' })
        .eq('id', exam.student_exam_id);
      
      if (error) throw error;
      
      // Marquer l'examen comme commencé
      setExamStarted(true);
      
      // Fermer la boîte de dialogue de confirmation
      setConfirmDialogOpen(false);
    } catch (error) {
      console.error('Erreur lors du démarrage de l\'examen:', error);
      setError('Impossible de démarrer l\'examen. Veuillez réessayer.');
    }
  };
  
  const handleConfirmStart = () => {
    setConfirmDialogOpen(true);
  };
  
  const handleCancelStart = () => {
    setConfirmDialogOpen(false);
  };
  
  const handleGoBack = () => {
    navigate('/exams');
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
              {exam.course_name} ({exam.courses?.code})
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
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button variant="outlined" onClick={handleGoBack}>
              Annuler
            </Button>
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleConfirmStart}
            >
              Commencer l'examen
            </Button>
          </Box>
        </Paper>
      )}
      
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
