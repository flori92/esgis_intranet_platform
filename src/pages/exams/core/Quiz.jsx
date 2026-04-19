import React, { useCallback, useEffect, useRef, useState } from "react";
import { useQuiz } from "../hooks/useQuiz";
import { useAuth } from "../hooks/useAuth";
import QuestionCard from "./QuestionCard";
import QuizNavigation from "./QuizNavigation";
import QuizResults from "./QuizResults";
import { Toaster } from 'react-hot-toast';
import AntiCheatService from '../services/AntiCheatService';
import {
  Box,
  Typography,
  AppBar,
  Toolbar,
  Container,
  Paper,
  CircularProgress,
  Button,
  Card,
  CardContent,
  Chip,
  Fade,
  IconButton,
  Stack,
  LinearProgress
} from '@mui/material';
import {
  Timer as TimerIcon,
  Person as PersonIcon,
  GppBad as WarningIcon,
  Close as CloseIcon
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
    submitQuiz,
    calculateScore,
    cheatingAttempts,
    scoreSummary,
    countCorrectAnswers
  } = useQuiz();

  const [incidentAlert, setIncidentAlert] = useState(null);

  // Référence stable pour le son d'alerte
  const alertSoundRef = React.useRef(null);
  if (!alertSoundRef.current) {
    alertSoundRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
  }
  const antiCheatServiceRef = useRef(null);
  const trackedQuestionIndexRef = useRef(0);
  const lastMajorIncidentRef = useRef({ family: null, at: 0 });
  const displayedCheatingCountRef = useRef(0);
  const examViewportRef = useRef(null);

  /**
   * Affiche une carte d'alerte visible et joue un signal sonore.
   */
  const showCustomAlert = useCallback((payload) => {
    setIncidentAlert(payload);
    if (alertSoundRef.current) {
      alertSoundRef.current.currentTime = 0;
      alertSoundRef.current.play().catch((err) => console.error('Erreur lors de la lecture du son:', err));
    }
  }, []);

  useEffect(() => {
    displayedCheatingCountRef.current = cheatingAttempts;
  }, [cheatingAttempts]);

  const maxCheatingAttempts = Math.max(1, Number(examData?.max_cheating_alerts || 3));

  const isDesktopSecureMode = useCallback(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    const supportsPointerQuery = typeof window.matchMedia === 'function';
    return window.innerWidth >= 1024 && (!supportsPointerQuery || window.matchMedia('(pointer:fine)').matches);
  }, []);

  const requestSecureFullscreen = useCallback(() => {
    if (typeof document === 'undefined' || document.fullscreenElement || !isDesktopSecureMode()) {
      return;
    }

    const fullscreenTarget = document.documentElement;
    if (typeof fullscreenTarget?.requestFullscreen !== 'function') {
      return;
    }

    fullscreenTarget.requestFullscreen().catch(() => {});
  }, [isDesktopSecureMode]);

  const restoreExamFocus = useCallback(() => {
    if (typeof window !== 'undefined' && typeof window.focus === 'function') {
      window.focus();
    }

    window.requestAnimationFrame(() => {
      if (examViewportRef.current) {
        examViewportRef.current.scrollIntoView({ block: 'start', behavior: 'auto' });
        examViewportRef.current.focus({ preventScroll: true });

        const firstInteractiveField = examViewportRef.current.querySelector(
          'input:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        firstInteractiveField?.focus?.({ preventScroll: true });
      }
    });
  }, []);

  const dismissIncidentAlert = useCallback(() => {
    if (!incidentAlert || incidentAlert.willAutoSubmit) {
      return;
    }

    requestSecureFullscreen();
    setIncidentAlert(null);
    restoreExamFocus();
  }, [incidentAlert, requestSecureFullscreen, restoreExamFocus]);

  const isMajorIncident = useCallback((incidentType) => (
    [
      'tab_switch',
      'window_blur',
      'fullscreen_exit',
      'fullscreen_denied',
      'devtools_attempt',
      'view_source_attempt',
      'alt_tab',
      'copy_attempt',
      'paste_attempt',
      'cut_attempt',
      'right_click',
      'print_attempt',
      'save_page_attempt',
      'screenshot_attempt',
      'drag_attempt',
      'beforeunload_attempt',
    ].includes(incidentType)
  ), []);

  const getIncidentFamily = useCallback((incidentType) => {
    if (['tab_switch', 'window_blur', 'fullscreen_exit'].includes(incidentType)) {
      return 'focus_loss';
    }

    if (['devtools_attempt', 'view_source_attempt'].includes(incidentType)) {
      return 'devtools';
    }

    if (['copy_attempt', 'paste_attempt', 'cut_attempt'].includes(incidentType)) {
      return 'clipboard';
    }

    if (['save_page_attempt', 'print_attempt', 'screenshot_attempt'].includes(incidentType)) {
      return 'capture';
    }

    return incidentType;
  }, []);

  const shouldIgnoreIncident = useCallback((incidentType) => {
    const family = getIncidentFamily(incidentType);
    const now = Date.now();
    const previous = lastMajorIncidentRef.current;

    if (previous.family === family && now - previous.at < 1500) {
      return true;
    }

    lastMajorIncidentRef.current = { family, at: now };
    return false;
  }, [getIncidentFamily]);

  const buildIncidentAlert = useCallback((incidentType, attemptCount, willAutoSubmit = false) => {
    const safeAttemptCount = Math.max(0, Math.min(attemptCount, maxCheatingAttempts));
    const attemptLabel = `${safeAttemptCount}/${maxCheatingAttempts}`;
    const counterMessage = willAutoSubmit
      ? `Seuil de ${maxCheatingAttempts} alertes atteint. L'examen va être arrêté et soumis automatiquement.`
      : `Alerte ${attemptLabel}. À partir de ${maxCheatingAttempts} alertes, l'examen sera arrêté et soumis automatiquement.`;

    let detail = "Une action interdite a été détectée pendant l'examen.";

    switch (incidentType) {
      case 'fullscreen_exit':
      case 'fullscreen_denied':
        detail = 'Le mode plein écran sécurisé a été quitté ou refusé.';
        break;
      case 'devtools_attempt':
      case 'view_source_attempt':
        detail = "Une tentative d'inspection technique de l'épreuve a été détectée.";
        break;
      case 'copy_attempt':
      case 'paste_attempt':
      case 'cut_attempt':
        detail = 'Une tentative de copier-coller a été bloquée.';
        break;
      case 'right_click':
        detail = 'Le clic droit est interdit pendant cette épreuve.';
        break;
      case 'save_page_attempt':
        detail = 'Une tentative de sauvegarde locale de la page a été bloquée.';
        break;
      case 'screenshot_attempt':
        detail = "Une tentative de capture d'écran a été détectée.";
        break;
      case 'drag_attempt':
        detail = "Une tentative d'extraction du contenu par glisser-déposer a été bloquée.";
        break;
      case 'beforeunload_attempt':
        detail = "Une tentative de quitter ou recharger la page d'examen a été détectée.";
        break;
      case 'print_attempt':
        detail = "Une tentative d'impression a été bloquée.";
        break;
      case 'alt_tab':
      case 'tab_switch':
      case 'window_blur':
      default:
        detail = "Vous avez quitté l'onglet ou changé de fenêtre pendant l'examen.";
        break;
    }

    return {
      title: willAutoSubmit ? 'Examen interrompu' : 'Tentative de triche détectée',
      detail,
      counterMessage,
      attemptLabel,
      willAutoSubmit,
    };
  }, [maxCheatingAttempts]);

  useEffect(() => {
    const shouldProtectExam = quizStatus === 'IN_PROGRESS' && examData && examData.category !== 'training';

    if (!shouldProtectExam) {
      antiCheatServiceRef.current?.stop();
      antiCheatServiceRef.current = null;
      trackedQuestionIndexRef.current = 0;
      lastMajorIncidentRef.current = { family: null, at: 0 };
      setIncidentAlert(null);
      return undefined;
    }

    const service = new AntiCheatService({
      maxTabSwitches: maxCheatingAttempts,
      autoSubmitOnMaxSwitches: true,
      disableCopyPaste: true,
      disableRightClick: true,
      requireFullscreen: isDesktopSecureMode(),
      onIncident: (incident) => {
        if (!isMajorIncident(incident.type)) {
          return;
        }

        const incrementCounter = !shouldIgnoreIncident(incident.type);
        const nextAttemptCount = incrementCounter
          ? Math.min(displayedCheatingCountRef.current + 1, maxCheatingAttempts)
          : displayedCheatingCountRef.current;

        if (incrementCounter) {
          displayedCheatingCountRef.current = nextAttemptCount;
        }

        showCustomAlert(buildIncidentAlert(incident.type, nextAttemptCount, nextAttemptCount >= maxCheatingAttempts));

        reportCheatingAttempt({
          details: `[${incident.type}] ${incident.details}`,
          detected_at: incident.timestamp,
          incrementCounter,
        });
      },
      onAutoSubmit: () => {
        displayedCheatingCountRef.current = maxCheatingAttempts;
        showCustomAlert(buildIncidentAlert('tab_switch', maxCheatingAttempts, true));
        setTimeout(() => submitQuiz({ reason: 'anti_cheat_limit' }), 1200);
      },
      onFullscreenExit: () => {}
    });

    antiCheatServiceRef.current = service;
    trackedQuestionIndexRef.current = 0;
    service.start();

    return () => {
      service.stop();
      if (antiCheatServiceRef.current === service) {
        antiCheatServiceRef.current = null;
      }
    };
  }, [buildIncidentAlert, examData, isDesktopSecureMode, isMajorIncident, maxCheatingAttempts, quizStatus, reportCheatingAttempt, shouldIgnoreIncident, showCustomAlert, submitQuiz]);

  useEffect(() => {
    if (!antiCheatServiceRef.current) {
      return;
    }

    if (trackedQuestionIndexRef.current === currentQuestionIndex) {
      return;
    }

    antiCheatServiceRef.current.setCurrentQuestion(currentQuestionIndex);
    trackedQuestionIndexRef.current = currentQuestionIndex;
  }, [currentQuestionIndex]);

  useEffect(() => {
    if (quizStatus === 'NOT_STARTED') {
      startQuiz();
    }
  }, [quizStatus, startQuiz]);

  useEffect(() => {
    return () => {
      antiCheatServiceRef.current?.stop();
      antiCheatServiceRef.current = null;
    };
  }, []);

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
  const displayHours = Math.floor(Number(timer.minutes || 0) / 60);
  const displayMinutes = Number(timer.minutes || 0) % 60;
  const formattedTimer = displayHours > 0
    ? `${String(displayHours).padStart(2, '0')}:${String(displayMinutes).padStart(2, '0')}:${String(timer.seconds || 0).padStart(2, '0')}`
    : `${String(displayMinutes).padStart(2, '0')}:${String(timer.seconds || 0).padStart(2, '0')}`;

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
                    label={`${Math.min(cheatingAttempts, maxCheatingAttempts)}/${maxCheatingAttempts} alertes`} 
                    color="error" 
                    variant="outlined" 
                    size="small" 
                  />
                )}
                
                <Paper variant="outlined" sx={{ px: 2, py: 0.5, bgcolor: timer.minutes < 5 ? 'error.light' : 'grey.50', borderColor: timer.minutes < 5 ? 'error.main' : 'divider' }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <TimerIcon color={timer.minutes < 5 ? 'error' : 'action'} />
                    <Typography variant="h6" sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 'bold', color: timer.minutes < 5 ? 'error.main' : 'text.primary' }}>
                      {formattedTimer}
                    </Typography>
                  </Stack>
                </Paper>
              </Stack>
            </Stack>
          </Container>
        </Toolbar>
        <LinearProgress variant="determinate" value={progress} sx={{ height: 4 }} />
      </AppBar>

      <Fade in={Boolean(incidentAlert)}>
        <Box
          sx={{
            position: 'fixed',
            top: { xs: 88, md: 102 },
            left: 16,
            right: 16,
            zIndex: 1400,
            display: incidentAlert ? 'flex' : 'none',
            justifyContent: 'center',
            pointerEvents: 'none'
          }}
        >
          <Card
            sx={{
              width: '100%',
              maxWidth: 760,
              pointerEvents: 'auto',
              bgcolor: 'error.dark',
              color: 'common.white',
              border: '2px solid',
              borderColor: 'error.main',
              boxShadow: '0 20px 45px rgba(183, 28, 28, 0.35)'
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Stack direction="row" justifyContent="space-between" spacing={2} alignItems="flex-start">
                <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ flex: 1 }}>
                  <WarningIcon sx={{ mt: 0.25 }} />
                  <Box>
                    <Typography variant="h6" fontWeight={800}>
                      {incidentAlert?.title}
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 0.75 }}>
                      {incidentAlert?.detail}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1.25, opacity: 0.92 }}>
                      {incidentAlert?.counterMessage}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap' }}>
                      <Chip
                        label={`Compteur ${incidentAlert?.attemptLabel || `0/${maxCheatingAttempts}`}`}
                        size="small"
                        sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: 'common.white' }}
                      />
                      <Chip
                        label={incidentAlert?.willAutoSubmit ? 'Soumission automatique en cours' : "Surveillance renforcée active"}
                        size="small"
                        sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: 'common.white' }}
                      />
                    </Stack>
                  </Box>
                </Stack>
                <IconButton
                  onClick={dismissIncidentAlert}
                  disabled={incidentAlert?.willAutoSubmit}
                  sx={{ color: 'common.white' }}
                  aria-label="Fermer l'alerte de triche"
                >
                  <CloseIcon />
                </IconButton>
              </Stack>
              {!incidentAlert?.willAutoSubmit && (
                <Button
                  variant="contained"
                  color="inherit"
                  onClick={dismissIncidentAlert}
                  sx={{
                    mt: 2,
                    bgcolor: 'common.white',
                    color: 'error.dark',
                    fontWeight: 800,
                    '&:hover': {
                      bgcolor: 'grey.100'
                    }
                  }}
                >
                  Je comprends et je reprends l'examen
                </Button>
              )}
            </CardContent>
          </Card>
        </Box>
      </Fade>

      <Container
        maxWidth="md"
        sx={{ py: 4, flexGrow: 1 }}
        ref={examViewportRef}
        tabIndex={-1}
      >
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
