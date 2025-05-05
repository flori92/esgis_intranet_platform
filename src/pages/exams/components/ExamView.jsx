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
  LinearProgress,
  FormHelperText
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

/**
 * Composant pour afficher et naviguer à travers les questions d'un examen
 * 
 * @param {Object} props - Propriétés du composant
 * @param {Array<Object>} props.questions - Liste des questions de l'examen
 * @param {number} props.currentQuestionIndex - Index de la question actuelle
 * @param {Object} props.userAnswers - Réponses de l'utilisateur (clé: id de question, valeur: réponse)
 * @param {Array<string>} props.bookmarkedQuestions - IDs des questions marquées
 * @param {Object} props.remainingTime - Temps restant pour l'examen
 * @param {number} props.remainingTime.minutes - Minutes restantes
 * @param {number} props.remainingTime.seconds - Secondes restantes
 * @param {number} props.cheatingAttempts - Nombre de tentatives de triche détectées
 * @param {Function} props.onAnswer - Fonction appelée lorsqu'une réponse est donnée
 * @param {Function} props.onNavigate - Fonction appelée pour naviguer entre les questions
 * @param {Function} props.onBookmark - Fonction appelée pour marquer une question
 * @param {Function} props.onSubmit - Fonction appelée pour soumettre l'examen
 * @param {number} props.timeRemaining - Temps restant en secondes
 * @param {boolean} props.isSubmitting - Indique si l'examen est en cours de soumission
 * @returns {JSX.Element} Composant d'affichage de l'examen
 */
const ExamView = ({
  questions,
  currentQuestionIndex,
  userAnswers,
  bookmarkedQuestions,
  remainingTime,
  cheatingAttempts,
  onAnswer,
  onNavigate,
  onBookmark,
  onSubmit,
  timeRemaining,
  isSubmitting
}) => {
  // État pour la réponse temporaire (avant validation)
  const [tempAnswer, setTempAnswer] = useState('');
  const [showSubmitWarning, setShowSubmitWarning] = useState(false);
  
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
  
  /**
   * Gérer la réponse à la question actuelle
   * @param {string} value - Valeur de la réponse
   */
  const handleAnswer = (value) => {
    onAnswer(currentQuestion.id, value);
  };
  
  /**
   * Naviguer vers la question précédente
   */
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      onNavigate(currentQuestionIndex - 1);
    }
  };
  
  /**
   * Naviguer vers la question suivante
   */
  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      onNavigate(currentQuestionIndex + 1);
    }
  };
  
  /**
   * Marquer/démarquer la question actuelle
   */
  const handleBookmark = () => {
    onBookmark(currentQuestion.id);
  };
  
  /**
   * Gérer le clic sur le bouton de soumission
   */
  const handleSubmitClick = () => {
    const unansweredCount = questions.length - answeredQuestions;
    
    if (unansweredCount > 0) {
      setShowSubmitWarning(true);
    } else {
      onSubmit();
    }
  };
  
  /**
   * Confirmer la soumission de l'examen
   */
  const handleConfirmSubmit = () => {
    setShowSubmitWarning(false);
    onSubmit();
  };
  
  /**
   * Annuler la soumission de l'examen
   */
  const handleCancelSubmit = () => {
    setShowSubmitWarning(false);
  };
  
  /**
   * Formater le temps en minutes:secondes
   * @param {number} seconds - Temps en secondes
   * @returns {string} Temps formaté
   */
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  /**
   * Rendu de la question en fonction de son type
   * @returns {JSX.Element} Élément React pour le type de question
   */
  const renderQuestion = () => {
    switch (currentQuestion.question_type) {
      case 'multiple_choice':
        return (
          <FormControl component="fieldset" error={!userAnswers[currentQuestion.id]}>
            <FormLabel component="legend">Choisissez une réponse</FormLabel>
            <RadioGroup
              value={userAnswers[currentQuestion.id] || ''}
              onChange={(e) => handleAnswer(e.target.value)}
            >
              {currentQuestion.options?.map((option, index) => (
                <FormControlLabel
                  key={index}
                  value={index.toString()}
                  control={<Radio />}
                  label={option}
                />
              ))}
            </RadioGroup>
            {!userAnswers[currentQuestion.id] && (
              <FormHelperText>Veuillez sélectionner une réponse</FormHelperText>
            )}
          </FormControl>
        );
        
      case 'true_false':
        return (
          <FormControl component="fieldset" error={!userAnswers[currentQuestion.id]}>
            <FormLabel component="legend">Vrai ou Faux</FormLabel>
            <RadioGroup
              value={userAnswers[currentQuestion.id] || ''}
              onChange={(e) => handleAnswer(e.target.value)}
            >
              <FormControlLabel value="true" control={<Radio />} label="Vrai" />
              <FormControlLabel value="false" control={<Radio />} label="Faux" />
            </RadioGroup>
            {!userAnswers[currentQuestion.id] && (
              <FormHelperText>Veuillez sélectionner une réponse</FormHelperText>
            )}
          </FormControl>
        );
        
      case 'short_answer':
        return (
          <Box>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Votre réponse"
              value={userAnswers[currentQuestion.id] || ''}
              onChange={(e) => handleAnswer(e.target.value)}
              placeholder="Saisissez votre réponse ici..."
              variant="outlined"
            />
          </Box>
        );
        
      case 'essay':
        return (
          <Box>
            <TextField
              fullWidth
              multiline
              rows={8}
              label="Votre réponse"
              value={userAnswers[currentQuestion.id] || ''}
              onChange={(e) => handleAnswer(e.target.value)}
              placeholder="Saisissez votre réponse détaillée ici..."
              variant="outlined"
            />
          </Box>
        );
        
      default:
        return (
          <Typography color="error">
            Type de question non pris en charge: {currentQuestion.question_type}
          </Typography>
        );
    }
  };
  
  return (
    <>
      {/* En-tête avec informations sur l'examen */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="h6">
                Question {currentQuestion.question_number} sur {questions.length}
              </Typography>
              <IconButton 
                color={isBookmarked ? 'secondary' : 'default'}
                onClick={handleBookmark}
                sx={{ ml: 1 }}
              >
                {isBookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
              </IconButton>
            </Box>
            <Typography variant="body2" color="textSecondary">
              {answeredQuestions} question(s) répondue(s) sur {questions.length}
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
            <Typography 
              variant="h5" 
              color={timeIsLow ? 'error' : 'textPrimary'}
              sx={{ fontWeight: 'bold' }}
            >
              {formattedMinutes}:{formattedSeconds}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Temps restant
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={4} sx={{ textAlign: 'right' }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
              <Typography variant="body1">
                {currentQuestion.points} point{currentQuestion.points > 1 ? 's' : ''}
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
        
        <Box sx={{ mt: 3 }}>
          {renderQuestion()}
        </Box>
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
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Soumission en cours...' : 'Soumettre l\'examen'}
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
