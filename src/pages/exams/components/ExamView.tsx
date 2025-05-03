import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Button,
  Chip,
  CircularProgress,
  Grid,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  TextField,
  Card,
  CardContent,
  IconButton,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  KeyboardArrowLeft as PreviousIcon,
  KeyboardArrowRight as NextIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon
} from '@mui/icons-material';

// Types
export interface Question {
  id: string;
  question_number: number;
  question_text: string;
  question_type: 'multiple_choice' | 'short_answer' | 'essay';
  options?: Array<{
    id: number;
    text: string;
  }>;
  points: number;
}

interface ExamViewProps {
  questions: Question[];
  currentQuestionIndex: number;
  userAnswers: Record<string, any>;
  bookmarkedQuestions: string[];
  remainingTime: { minutes: number; seconds: number };
  cheatingAttempts: number;
  onAnswer: (questionId: string, answer: any) => void;
  onNavigate: (index: number) => void;
  onBookmark: (questionId: string) => void;
  onSubmit: () => void;
}

/**
 * Composant pour afficher et naviguer à travers les questions d'un examen
 */
const ExamView: React.FC<ExamViewProps> = ({
  questions,
  currentQuestionIndex,
  userAnswers,
  bookmarkedQuestions,
  remainingTime,
  cheatingAttempts,
  onAnswer,
  onNavigate,
  onBookmark,
  onSubmit
}) => {
  // État pour la réponse temporaire (avant validation)
  const [tempAnswer, setTempAnswer] = useState<string>('');
  const [showSubmitWarning, setShowSubmitWarning] = useState<boolean>(false);
  
  // Question actuelle
  const currentQuestion = questions[currentQuestionIndex];
  
  // Calcul du progrès
  const answeredQuestions = Object.keys(userAnswers).length;
  const progress = (answeredQuestions / questions.length) * 100;
  
  // Formatage du temps restant
  const formattedMinutes = String(remainingTime.minutes).padStart(2, '0');
  const formattedSeconds = String(remainingTime.seconds).padStart(2, '0');
  const timeIsLow = remainingTime.minutes < 5;
  
  // Vérifier si la question est marquée
  const isBookmarked = bookmarkedQuestions.includes(currentQuestion.id);
  
  // Gérer la réponse à la question actuelle
  const handleAnswer = (value: any) => {
    if (currentQuestion.question_type === 'multiple_choice') {
      // Pour les QCM, on enregistre directement la réponse
      onAnswer(currentQuestion.id, parseInt(value));
    } else {
      // Pour les autres types, on utilise la réponse temporaire
      setTempAnswer(value);
    }
  };
  
  // Enregistrer la réponse à une question ouverte
  const handleSaveAnswer = () => {
    if (tempAnswer.trim()) {
      onAnswer(currentQuestion.id, tempAnswer);
      setTempAnswer('');
    }
  };
  
  // Navigation
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      onNavigate(currentQuestionIndex - 1);
    }
  };
  
  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      onNavigate(currentQuestionIndex + 1);
    }
  };
  
  // Marquage de la question
  const handleBookmark = () => {
    onBookmark(currentQuestion.id);
  };
  
  // Confirmation de soumission
  const handleSubmitClick = () => {
    const unansweredCount = questions.length - answeredQuestions;
    
    if (unansweredCount > 0) {
      setShowSubmitWarning(true);
    } else {
      onSubmit();
    }
  };
  
  const handleConfirmSubmit = () => {
    setShowSubmitWarning(false);
    onSubmit();
  };
  
  const handleCancelSubmit = () => {
    setShowSubmitWarning(false);
  };
  
  return (
    <>
      {/* Barre d'information */}
      <Paper sx={{ p: 2, mb: 3, position: 'sticky', top: 0, zIndex: 1 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body1" sx={{ mr: 1 }}>
                Question {currentQuestion.question_number}/{questions.length}
              </Typography>
              <Chip 
                label={`${currentQuestion.points} point${currentQuestion.points > 1 ? 's' : ''}`}
                size="small"
                color="secondary"
                variant="outlined"
              />
              <IconButton onClick={handleBookmark} color={isBookmarked ? 'primary' : 'default'}>
                {isBookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
              </IconButton>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography
                variant="h6"
                sx={{
                  color: timeIsLow ? 'error.main' : 'text.primary',
                  fontWeight: timeIsLow ? 'bold' : 'normal',
                }}
              >
                Temps restant: {formattedMinutes}:{formattedSeconds}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              <Typography variant="body2" sx={{ mr: 1 }}>
                {answeredQuestions}/{questions.length} réponses
              </Typography>
              
              {cheatingAttempts > 0 && (
                <Chip
                  icon={<WarningIcon />}
                  label={`${cheatingAttempts} tentative${cheatingAttempts > 1 ? 's' : ''} de triche`}
                  color="error"
                  size="small"
                  sx={{ ml: 1 }}
                />
              )}
            </Box>
          </Grid>
        </Grid>
        
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ mt: 2, height: 8, borderRadius: 4 }} 
        />
      </Paper>
      
      {/* Contenu de la question */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          {currentQuestion.question_text}
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        
        {currentQuestion.question_type === 'multiple_choice' && currentQuestion.options && (
          <FormControl component="fieldset" fullWidth>
            <FormLabel component="legend">Sélectionnez une réponse:</FormLabel>
            <RadioGroup
              value={userAnswers[currentQuestion.id] !== undefined ? userAnswers[currentQuestion.id].toString() : ''}
              onChange={(e) => handleAnswer(e.target.value)}
            >
              {currentQuestion.options.map((option) => (
                <FormControlLabel
                  key={option.id}
                  value={option.id.toString()}
                  control={<Radio />}
                  label={option.text}
                  sx={{ mb: 1 }}
                />
              ))}
            </RadioGroup>
          </FormControl>
        )}
        
        {currentQuestion.question_type === 'short_answer' && (
          <Box>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Votre réponse"
              value={tempAnswer || userAnswers[currentQuestion.id] || ''}
              onChange={(e) => handleAnswer(e.target.value)}
              placeholder="Saisissez une réponse courte (quelques phrases)"
              variant="outlined"
              sx={{ mb: 2 }}
            />
            
            <Button
              variant="contained"
              color="primary"
              onClick={handleSaveAnswer}
              disabled={!tempAnswer.trim() && !userAnswers[currentQuestion.id]}
            >
              Enregistrer la réponse
            </Button>
            
            {userAnswers[currentQuestion.id] && !tempAnswer && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Réponse enregistrée
              </Alert>
            )}
          </Box>
        )}
        
        {currentQuestion.question_type === 'essay' && (
          <Box>
            <TextField
              fullWidth
              multiline
              rows={8}
              label="Votre réponse"
              value={tempAnswer || userAnswers[currentQuestion.id] || ''}
              onChange={(e) => handleAnswer(e.target.value)}
              placeholder="Rédigez votre réponse détaillée ici"
              variant="outlined"
              sx={{ mb: 2 }}
            />
            
            <Button
              variant="contained"
              color="primary"
              onClick={handleSaveAnswer}
              disabled={!tempAnswer.trim() && !userAnswers[currentQuestion.id]}
            >
              Enregistrer la réponse
            </Button>
            
            {userAnswers[currentQuestion.id] && !tempAnswer && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Réponse enregistrée
              </Alert>
            )}
          </Box>
        )}
      </Paper>
      
      {/* Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<PreviousIcon />}
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          Question précédente
        </Button>
        
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmitClick}
        >
          Terminer l'examen
        </Button>
        
        <Button
          variant="outlined"
          endIcon={<NextIcon />}
          onClick={handleNext}
          disabled={currentQuestionIndex === questions.length - 1}
        >
          Question suivante
        </Button>
      </Box>
      
      {/* Questions marquées et navigation rapide */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Navigation rapide
        </Typography>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {questions.map((question, index) => {
            const isAnswered = userAnswers[question.id] !== undefined;
            const isMarked = bookmarkedQuestions.includes(question.id);
            const isCurrent = index === currentQuestionIndex;
            
            return (
              <Button
                key={question.id}
                variant={isCurrent ? 'contained' : 'outlined'}
                color={
                  isCurrent
                    ? 'primary'
                    : isMarked
                    ? 'secondary'
                    : isAnswered
                    ? 'success'
                    : 'default'
                }
                size="small"
                onClick={() => onNavigate(index)}
                sx={{
                  minWidth: '40px',
                  height: '40px',
                  p: 0,
                  borderRadius: '50%',
                }}
              >
                {question.question_number}
              </Button>
            );
          })}
        </Box>
      </Paper>
      
      {/* Dialogue de confirmation de soumission */}
      {showSubmitWarning && (
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'warning.light', color: 'warning.contrastText' }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
            <WarningIcon sx={{ mr: 2, fontSize: 32 }} />
            <Typography variant="h6">
              Attention ! Vous n'avez pas répondu à toutes les questions.
            </Typography>
          </Box>
          
          <Typography variant="body1" paragraph>
            Il vous reste {questions.length - answeredQuestions} question(s) sans réponse. 
            Êtes-vous sûr de vouloir terminer l'examen maintenant ?
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
            <Button variant="outlined" onClick={handleCancelSubmit}>
              Continuer l'examen
            </Button>
            <Button variant="contained" color="warning" onClick={handleConfirmSubmit}>
              Terminer quand même
            </Button>
          </Box>
        </Paper>
      )}
    </>
  );
};

export default ExamView;
