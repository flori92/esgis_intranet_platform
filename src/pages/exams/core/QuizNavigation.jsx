import React from "react";
import {
  Box,
  Button,
  Stack,
  Typography,
  LinearProgress,
  Paper
} from '@mui/material';
import {
  NavigateBefore as PreviousIcon,
  NavigateNext as NextIcon,
  CheckCircle as DoneIcon
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
 * @returns {JSX.Element} Composant de navigation du quiz
 */
const QuizNavigation = ({
  questions,
  currentQuestionIndex,
  userAnswers,
  goToNextQuestion,
  goToPreviousQuestion,
  endQuiz
}) => {
  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const answeredCount = Object.values(userAnswers).filter((value) => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }

    return value !== null && value !== undefined && value !== '';
  }).length;
  
  // Calcul du pourcentage de progression
  const progressPercent = questions.length > 0 
    ? (answeredCount / questions.length) * 100
    : 0;
  
  return (
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
            onClick={() => {
              if (window.confirm('Êtes-vous sûr de vouloir soumettre votre copie ? Cette action est définitive.')) {
                endQuiz();
              }
            }}
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
  );
};

export default QuizNavigation;
