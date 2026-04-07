import React, { useEffect, useRef } from "react";
import { useQuiz } from "../hooks/useQuiz";
import { useAuth } from "../hooks/useAuth";
import QuestionCard from "./QuestionCard";
import QuizNavigation from "./QuizNavigation";
import QuizResults from "./QuizResults";
import { Toaster } from 'react-hot-toast';
import {
  Box,
  Typography,
  AppBar,
  Toolbar,
  Container,
  Paper,
  CircularProgress,
  Button,
  Stack,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  Timer as TimerIcon,
  Person as PersonIcon,
  GppBad as WarningIcon
} from '@mui/icons-material';

/**
 * Composant principal du quiz/examen
 * Gère l'affichage des questions, la navigation et la détection de triche
 * @returns {JSX.Element} Composant principal du quiz
 */
const Quiz = () => {
  const { appState } = useAuth();
  const { 
    questions, 
    currentQuestionIndex, 
    userAnswers,
    quizStatus,
    timer,
    examData,
    loading,
    error,
    startQuiz, 
    reportCheatingAttempt,
    answerQuestion,
    goToNextQuestion,
    goToPreviousQuestion,
    endQuiz,
    calculateScore,
    cheatingAttempts,
    scoreSummary,
    countCorrectAnswers
  } = useQuiz();
  
  // Référence pour le div d'alerte personnalisé
  const alertRef = useRef(null);
  // Référence pour suivre si une triche a été détectée
  const cheatingDetectedRef = useRef(false);

  // Référence stable pour le son d'alerte
  const alertSoundRef = React.useRef(null);
  if (!alertSoundRef.current) {
    alertSoundRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
  }

  /**
   * Affiche une alerte personnalisée en rouge
   * @param {string} message - Message à afficher dans l'alerte
   */
  const showCustomAlert = (message) => {
    if (alertRef.current && document.body.contains(alertRef.current)) {
      document.body.removeChild(alertRef.current);
      alertRef.current = null;
    }
    const alertDiv = document.createElement('div');
    alertDiv.style.position = 'fixed';
    alertDiv.style.top = '0';
    alertDiv.style.left = '0';
    alertDiv.style.width = '100%';
    alertDiv.style.height = '100%';
    alertDiv.style.backgroundColor = 'rgba(211, 47, 47, 0.95)';
    alertDiv.style.color = 'white';
    alertDiv.style.display = 'flex';
    alertDiv.style.flexDirection = 'column';
    alertDiv.style.justifyContent = 'center';
    alertDiv.style.alignItems = 'center';
    alertDiv.style.zIndex = '99999';
    alertDiv.style.fontWeight = 'bold';
    alertDiv.style.fontFamily = 'Roboto, Helvetica, Arial, sans-serif';
    alertDiv.style.textAlign = 'center';
    alertDiv.style.padding = '40px';

    const iconElement = document.createElement('div');
    iconElement.innerHTML = '<svg style="width:100px;height:100px" viewBox="0 0 24 24"><path fill="currentColor" d="M13,13H11V7H13M13,17H11V15H13M12,2L1,21H23L12,2Z" /></svg>';
    iconElement.style.marginBottom = '20px';

    const titleElement = document.createElement('div');
    titleElement.textContent = 'TRICHE DÉTECTÉE';
    titleElement.style.fontSize = '48px';
    titleElement.style.marginBottom = '20px';

    const messageElement = document.createElement('div');
    messageElement.innerHTML = message.replace('🚨 TRICHE DÉTECTÉE 🚨\n\n', '').replace(/\n/g, '<br>');
    messageElement.style.marginBottom = '40px';
    messageElement.style.fontSize = '24px';
    messageElement.style.maxWidth = '800px';

    const closeButton = document.createElement('button');
    closeButton.textContent = 'JE COMPRENDS ET JE REVIENS À L\'ÉPREUVE';
    closeButton.style.padding = '16px 32px';
    closeButton.style.backgroundColor = 'white';
    closeButton.style.color = '#d32f47';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '4px';
    closeButton.style.fontWeight = 'bold';
    closeButton.style.fontSize = '18px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.3)';
    closeButton.onclick = () => {
      if (alertRef.current && document.body.contains(alertRef.current)) {
        document.body.removeChild(alertRef.current);
        alertRef.current = null;
      }
    };

    alertDiv.appendChild(iconElement);
    alertDiv.appendChild(titleElement);
    alertDiv.appendChild(messageElement);
    alertDiv.appendChild(closeButton);
    document.body.appendChild(alertDiv);
    alertRef.current = alertDiv;
    if (alertSoundRef.current) {
      alertSoundRef.current.play().catch((err) => console.error('Erreur lors de la lecture du son:', err));
    }
  };

  // Référence stable mise à jour à chaque rendu
  const detectCheatingRef = useRef(() => {});
  detectCheatingRef.current = () => {
    if (quizStatus !== 'IN_PROGRESS') return;
    if (cheatingDetectedRef.current) return;
    
    // Skip cheating detection for training/practice exams
    if (examData?.category === 'training') {
      console.log('Cheating detection skipped for training exam');
      return;
    }

    cheatingDetectedRef.current = true;
    showCustomAlert('🚨 TRICHE DÉTECTÉE 🚨\n\nVous avez quitté l\'onglet ou changé de fenêtre pendant l\'examen.\n\nCet incident a été enregistré et transmis au surveillant. Au bout de 3 tentatives, votre copie sera automatiquement soumise.');
    reportCheatingAttempt();
    setTimeout(() => {
      cheatingDetectedRef.current = false;
    }, 5000);
  };
  
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && quizStatus === 'IN_PROGRESS') {
        detectCheatingRef.current();
      }
    };
    
    const handleBlur = () => {
      if (quizStatus === 'IN_PROGRESS') {
        detectCheatingRef.current();
      }
    };

    const preventAction = (e) => {
      if (quizStatus === 'IN_PROGRESS') {
        e.preventDefault();
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    document.addEventListener('contextmenu', preventAction);
    document.addEventListener('copy', preventAction);
    document.addEventListener('cut', preventAction);
    document.addEventListener('paste', preventAction);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener('contextmenu', preventAction);
      document.removeEventListener('copy', preventAction);
      document.removeEventListener('cut', preventAction);
      document.removeEventListener('paste', preventAction);
      if (alertRef.current && document.body.contains(alertRef.current)) {
        document.body.removeChild(alertRef.current);
        alertRef.current = null;
      }
    };
  }, [quizStatus, reportCheatingAttempt]);

  useEffect(() => {
    if (quizStatus === 'NOT_STARTED') {
      startQuiz();
    }
  }, [quizStatus, startQuiz]);

  if (quizStatus === 'COMPLETED') {
    return (
      <QuizResults
        questions={questions}
        userAnswers={userAnswers}
        calculateScore={calculateScore}
        cheatingAttempts={cheatingAttempts}
        scoreSummary={scoreSummary}
        correctAnswersCount={countCorrectAnswers()}
      />
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', bgcolor: 'grey.50', px: 2 }}>
        <Paper elevation={3} sx={{ maxWidth: 500, p: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom fontWeight="bold">Examen indisponible</Typography>
          <Typography variant="body1" color="text.secondary">{error}</Typography>
        </Paper>
      </Box>
    );
  }

  if (loading || questions.length === 0) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', bgcolor: 'grey.50' }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={60} />
          <Typography color="text.secondary">Chargement de l'épreuve...</Typography>
        </Stack>
      </Box>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100', display: 'flex', flexDirection: 'column' }}>
      <Toaster position="top-center" />
      
      <AppBar position="sticky" color="default" elevation={2} sx={{ bgcolor: 'white' }}>
        <Toolbar>
          <Container maxWidth="lg">
            <Stack direction="row" justifyContent="space-between" alignItems="center" width="100%">
              <Box>
                <Typography variant="h6" fontWeight="bold" noWrap sx={{ maxWidth: { xs: 200, sm: '100%' } }}>
                  {examData?.title}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <PersonIcon fontSize="small" color="action" />
                  <Typography variant="caption" color="text.secondary">
                    {appState.currentUser?.name || appState.profile?.full_name}
                  </Typography>
                </Stack>
              </Box>

              <Stack direction="row" spacing={3} alignItems="center">
                {cheatingAttempts > 0 && (
                  <Chip 
                    icon={<WarningIcon />} 
                    label={`${cheatingAttempts} alertes`} 
                    color="error" 
                    variant="outlined" 
                    size="small" 
                  />
                )}
                
                <Paper variant="outlined" sx={{ px: 2, py: 0.5, bgcolor: timer.minutes < 5 ? 'error.light' : 'grey.50', borderColor: timer.minutes < 5 ? 'error.main' : 'divider' }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <TimerIcon color={timer.minutes < 5 ? 'error' : 'action'} />
                    <Typography variant="h6" sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 'bold', color: timer.minutes < 5 ? 'error.main' : 'text.primary' }}>
                      {String(timer.minutes).padStart(2, '0')}:{String(timer.seconds).padStart(2, '0')}
                    </Typography>
                  </Stack>
                </Paper>
              </Stack>
            </Stack>
          </Container>
        </Toolbar>
        <LinearProgress variant="determinate" value={progress} sx={{ height: 4 }} />
      </AppBar>

      <Container maxWidth="md" sx={{ py: 4, flexGrow: 1 }}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle2" color="text.secondary">
            Question {currentQuestionIndex + 1} sur {questions.length}
          </Typography>
          <Typography variant="subtitle2" color="primary" fontWeight="bold">
            {currentQuestion.points} points
          </Typography>
        </Box>

        <QuestionCard
          question={currentQuestion}
          answer={userAnswers[currentQuestion.id]}
          onAnswerChange={(value) => answerQuestion(currentQuestion.id, value)}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={questions.length}
        />
        
        <Box sx={{ mt: 4 }}>
          <QuizNavigation
            questions={questions}
            currentQuestionIndex={currentQuestionIndex}
            userAnswers={userAnswers}
            goToNextQuestion={goToNextQuestion}
            goToPreviousQuestion={goToPreviousQuestion}
            endQuiz={endQuiz}
          />
        </Box>
      </Container>

      <Box component="footer" sx={{ py: 2, textAlign: 'center', bgcolor: 'grey.200', mt: 'auto' }}>
        <Typography variant="caption" color="text.secondary">
          ESGIS Campus - Session d'examen sécurisée. Vos réponses sont sauvegardées automatiquement.
        </Typography>
      </Box>
    </Box>
  );
};

export default Quiz;
