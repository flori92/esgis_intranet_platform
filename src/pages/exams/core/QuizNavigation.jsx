import React, { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  Typography,
  LinearProgress,
  Paper
} from '@mui/material';
import {
  NavigateBefore as PreviousIcon,
  NavigateNext as NextIcon,
  CheckCircle as DoneIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

/**
 * Composant de navigation dans le quiz
 * Permet de naviguer entre les questions et d'afficher la progression
 * @param {Object} props
 * @param {Array} props.questions
 * @param {number} props.currentQuestionIndex
 * @param {Object} props.userAnswers
 * @param {Function} props.goToNextQuestion
 * @param {Function} props.goToPreviousQuestion
 * @param {Function} props.endQuiz
 * @param {Function} [props.onSubmitIntent] - Appelé quand l'étudiant veut soumettre (pour pauser l'anti-triche)
 * @param {Function} [props.onSubmitCancel] - Appelé si l'étudiant annule la soumission (pour reprendre l'anti-triche)
 * @returns {JSX.Element} Composant de navigation du quiz
 */
const QuizNavigation = ({
  questions,
  currentQuestionIndex,
  userAnswers,
  goToNextQuestion,
  goToPreviousQuestion,
  endQuiz,
  onSubmitIntent,
  onSubmitCancel
}) => {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const answeredCount = Object.values(userAnswers).filter((value) => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }

    return value !== null && value !== undefined && value !== '';
  }).length;
  
  const unansweredCount = questions.length - answeredCount;
  
  // Calcul du pourcentage de progression
  const progressPercent = questions.length > 0 
    ? (answeredCount / questions.length) * 100
    : 0;

  const handleSubmitClick = () => {
    // Mettre en pause l'anti-triche AVANT d'ouvrir la boîte de dialogue
    if (onSubmitIntent) {
      onSubmitIntent();
    }
    setConfirmOpen(true);
  };

  const handleConfirmSubmit = () => {
    setConfirmOpen(false);
    endQuiz();
  };

  const handleCancelSubmit = () => {
    setConfirmOpen(false);
    // Reprendre l'anti-triche si l'étudiant annule
    if (onSubmitCancel) {
      onSubmitCancel();
    }
  };
  
  return (
    <>
      <Paper elevation={0} variant="outlined" sx={{ p: 3, bgcolor: 'white', borderRadius: 2 }}>
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="body2" color="text.secondary" fontWeight="medium">
              Réponses saisies : {answeredCount} / {questions.length}
            </Typography>
            <Typography variant="body2" color="primary" fontWeight="bold">
              {Math.round(progressPercent)}% complété
            </Typography>
          </Stack>
          <LinearProgress 
            variant="determinate" 
            value={progressPercent} 
            sx={{ height: 8, borderRadius: 4, bgcolor: 'grey.200' }} 
          />
        </Box>
        
        <Stack direction="row" justifyContent="space-between">
          <Button
            variant="outlined"
            startIcon={<PreviousIcon />}
            onClick={goToPreviousQuestion}
            disabled={isFirstQuestion}
            sx={{ minWidth: 120 }}
          >
            Précédent
          </Button>
          
          {isLastQuestion ? (
            <Button
              variant="contained"
              color="success"
              endIcon={<DoneIcon />}
              onClick={handleSubmitClick}
              sx={{ minWidth: 150, fontWeight: 'bold' }}
            >
              Soumettre ma copie
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              endIcon={<NextIcon />}
              onClick={goToNextQuestion}
              sx={{ minWidth: 120 }}
            >
              Suivant
            </Button>
          )}
        </Stack>
      </Paper>

      {/* Dialogue de confirmation de soumission (ne déclenche pas l'anti-triche) */}
      <Dialog
        open={confirmOpen}
        onClose={handleCancelSubmit}
        disableEscapeKeyDown
        PaperProps={{
          sx: { minWidth: 400, p: 1 }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          Confirmer la soumission
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Êtes-vous sûr de vouloir soumettre votre copie ? <strong>Cette action est définitive.</strong>
          </DialogContentText>
          {unansweredCount > 0 && (
            <DialogContentText color="error" sx={{ fontWeight: 'bold' }}>
              ⚠️ Attention : {unansweredCount} question{unansweredCount > 1 ? 's' : ''} sans réponse !
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCancelSubmit} variant="outlined" color="inherit">
            Annuler
          </Button>
          <Button
            onClick={handleConfirmSubmit}
            variant="contained"
            color="success"
            autoFocus
          >
            Confirmer et soumettre
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default QuizNavigation;
