import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, CircularProgress, Alert, Button,
  Card, CardContent, Divider, Chip, Snackbar, Dialog, DialogTitle,
  DialogContent, DialogActions, LinearProgress
} from '@mui/material';
import {
  Quiz as QuizIcon,
  PlayArrow as PlayIcon,
  Replay as ReplayIcon,
  CheckCircle as CheckIcon,
  School as SchoolIcon,
  Timer as TimerIcon,
  EmojiEvents as TrophyIcon
} from '@mui/icons-material';
import { useAuth } from '@/context/AuthContext';
import QuestionRenderer from '../components/QuestionRenderer';
import { getPracticeQuizzes, getPracticeQuizQuestions, savePracticeQuizAttempt } from '@/api/admin';

const MOCK_QUIZZES = [
  { id: 'quiz1', title: 'Quiz — HTML/CSS Bases', matiere: 'Développement Web', professor: 'Prof. MENSAH', questions_count: 10, attempts: 2, best_score: 80, duration: 15, difficulty: 'Facile' },
  { id: 'quiz2', title: 'Auto-évaluation — JavaScript ES6', matiere: 'Développement Web', professor: 'Prof. MENSAH', questions_count: 15, attempts: 0, best_score: null, duration: 20, difficulty: 'Moyen' },
  { id: 'quiz3', title: 'Quiz — Complexité algorithmique', matiere: 'Algorithmique', professor: 'Prof. DOSSEH', questions_count: 8, attempts: 1, best_score: 62, duration: 10, difficulty: 'Difficile' },
];

const MOCK_QUESTIONS = [
  { id: 'pq1', type: 'qcm_single', text: 'Quelle balise HTML est utilisée pour un paragraphe ?', options: ['<p>', '<para>', '<text>', '<pg>'], correct_answer: '0', points: 1, explanation: 'La balise <p> est la balise standard HTML pour un paragraphe.' },
  { id: 'pq2', type: 'true_false', text: 'CSS signifie "Cascading Style Sheets".', correct_answer: 'true', points: 1, explanation: 'CSS = Cascading Style Sheets (feuilles de style en cascade).' },
  { id: 'pq3', type: 'qcm_multiple', text: 'Lesquels sont des sélecteurs CSS valides ?', options: ['#id', '.class', '@element', '*'], correct_answer: ['0', '1', '3'], points: 2, explanation: '# pour les ID, . pour les classes, * pour le sélecteur universel. @ n\'est pas un sélecteur.' },
  { id: 'pq4', type: 'short_answer', text: 'Quelle propriété CSS change la couleur du texte ?', correct_answer: 'color', points: 1, explanation: 'La propriété "color" définit la couleur du texte.' },
  { id: 'pq5', type: 'numeric', text: 'Combien de balises de titre HTML existent (h1 à h?) ?', correct_answer: '6', tolerance: 0, points: 1, explanation: 'HTML a 6 niveaux de titre : h1 à h6.' },
];

/**
 * Page Mode Quiz d'Entraînement — ESGIS Campus §6.5
 * Distinct des examens officiels: pas d'anti-triche, plusieurs tentatives,
 * score affiché immédiatement avec corrections et explications.
 */
const PracticeQuizPage = () => {
  const { authState } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [quizState, setQuizState] = useState('list'); // list | taking | results
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState(new Set());
  const [score, setScore] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const loadQuizzes = async () => {
      setLoading(true);
      try {
        const { data, error } = await getPracticeQuizzes(authState.user?.id);
        if (!error && data && data.length > 0) {
          setQuizzes(data.map(q => ({
            id: q.id,
            title: q.title,
            matiere: q.cours?.name || '-',
            professor: q.professeur?.full_name || '-',
            questions_count: q.questions_count || 0,
            attempts: q.attempts || 0,
            best_score: q.best_score,
            duration: q.duration_minutes || 30,
            difficulty: q.difficulty === 'easy' ? 'Facile' : q.difficulty === 'hard' ? 'Difficile' : 'Moyen',
          })));
        } else {
          setQuizzes(MOCK_QUIZZES);
        }
      } catch {
        setQuizzes(MOCK_QUIZZES);
      } finally {
        setLoading(false);
      }
    };
    loadQuizzes();
  }, [authState.user?.id]);

  const startQuiz = (quiz) => {
    setSelectedQuiz(quiz);
    setCurrentQuestionIdx(0);
    setAnswers({});
    setFlagged(new Set());
    setScore(null);
    setQuizState('taking');
  };

  const handleAnswer = (value) => {
    setAnswers(prev => ({ ...prev, [currentQuestionIdx]: value }));
  };

  const toggleFlag = () => {
    setFlagged(prev => {
      const next = new Set(prev);
      if (next.has(currentQuestionIdx)) next.delete(currentQuestionIdx);
      else next.add(currentQuestionIdx);
      return next;
    });
  };

  const handleSubmit = () => {
    let correct = 0;
    let totalPts = 0;
    let earnedPts = 0;

    MOCK_QUESTIONS.forEach((q, idx) => {
      totalPts += q.points;
      const userAnswer = answers[idx];

      if (q.type === 'qcm_single' && userAnswer === q.correct_answer) {
        correct++; earnedPts += q.points;
      } else if (q.type === 'true_false' && userAnswer === q.correct_answer) {
        correct++; earnedPts += q.points;
      } else if (q.type === 'qcm_multiple') {
        const ca = Array.isArray(q.correct_answer) ? q.correct_answer : [];
        const ua = Array.isArray(userAnswer) ? userAnswer : [];
        if (ca.length === ua.length && ca.every(a => ua.includes(a))) {
          correct++; earnedPts += q.points;
        }
      } else if (q.type === 'short_answer' && userAnswer?.toLowerCase().trim() === q.correct_answer?.toLowerCase().trim()) {
        correct++; earnedPts += q.points;
      } else if (q.type === 'numeric') {
        const tol = q.tolerance || 0;
        const num = parseFloat(userAnswer);
        const expected = parseFloat(q.correct_answer);
        if (!isNaN(num) && Math.abs(num - expected) <= tol) {
          correct++; earnedPts += q.points;
        }
      }
    });

    const pct = totalPts > 0 ? Math.round((earnedPts / totalPts) * 100) : 0;
    setScore({ correct, total: MOCK_QUESTIONS.length, earnedPts, totalPts, percentage: pct });
    setQuizState('results');

    // Mettre à jour les stats locales
    setQuizzes(prev => prev.map(q => q.id === selectedQuiz.id ? {
      ...q,
      attempts: q.attempts + 1,
      best_score: q.best_score !== null ? Math.max(q.best_score, pct) : pct
    } : q));
  };

  const handleBackToList = () => {
    setQuizState('list');
    setSelectedQuiz(null);
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;

  // === LISTE DES QUIZ ===
  if (quizState === 'list') {
    return (
      <Box sx={{ p: { xs: 1, md: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <QuizIcon sx={{ mr: 1, color: 'primary.main', fontSize: 32 }} />
          <Typography variant="h5" fontWeight="bold">Quiz d'Entraînement</Typography>
        </Box>
        <Alert severity="info" sx={{ mb: 3 }}>
          Les quiz d'entraînement sont libres : pas de contrainte de temps strict, plusieurs tentatives autorisées,
          score et corrections affichés immédiatement. Ils ne sont <strong>pas comptés</strong> dans la moyenne officielle.
        </Alert>
        <Grid container spacing={2}>
          {quizzes.map(quiz => (
            <Grid item xs={12} md={6} lg={4} key={quiz.id}>
              <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flex: 1 }}>
                  <Typography variant="h6" fontWeight="bold">{quiz.title}</Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {quiz.matiere} — {quiz.professor}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                    <Chip label={`${quiz.questions_count} questions`} size="small" variant="outlined" />
                    <Chip label={`~${quiz.duration} min`} size="small" variant="outlined" icon={<TimerIcon />} />
                    <Chip label={quiz.difficulty} size="small"
                      color={quiz.difficulty === 'Facile' ? 'success' : quiz.difficulty === 'Moyen' ? 'warning' : 'error'} />
                  </Box>
                  {quiz.attempts > 0 && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {quiz.attempts} tentative{quiz.attempts > 1 ? 's' : ''} — Meilleur score :
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress variant="determinate" value={quiz.best_score}
                          sx={{ flex: 1, height: 8, borderRadius: 4 }}
                          color={quiz.best_score >= 70 ? 'success' : quiz.best_score >= 50 ? 'warning' : 'error'} />
                        <Typography variant="body2" fontWeight="bold">{quiz.best_score}%</Typography>
                      </Box>
                    </Box>
                  )}
                </CardContent>
                <Box sx={{ p: 2, pt: 0 }}>
                  <Button variant="contained" fullWidth startIcon={quiz.attempts > 0 ? <ReplayIcon /> : <PlayIcon />}
                    onClick={() => startQuiz(quiz)}>
                    {quiz.attempts > 0 ? 'Réessayer' : 'Commencer'}
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  // === PASSAGE DU QUIZ ===
  if (quizState === 'taking') {
    const question = MOCK_QUESTIONS[currentQuestionIdx];
    const progress = ((currentQuestionIdx + 1) / MOCK_QUESTIONS.length) * 100;

    return (
      <Box sx={{ p: { xs: 1, md: 2 }, maxWidth: 800, mx: 'auto' }}>
        {/* Barre de progression */}
        <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold">{selectedQuiz?.title}</Typography>
            <Chip label={`${currentQuestionIdx + 1}/${MOCK_QUESTIONS.length}`} color="primary" />
          </Box>
          <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} />
          {/* Navigation rapide */}
          <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
            {MOCK_QUESTIONS.map((_, idx) => (
              <Chip key={idx} label={idx + 1} size="small"
                variant={idx === currentQuestionIdx ? 'filled' : 'outlined'}
                color={answers[idx] !== undefined ? (flagged.has(idx) ? 'warning' : 'success') : 'default'}
                onClick={() => setCurrentQuestionIdx(idx)}
                sx={{ cursor: 'pointer', minWidth: 32 }} />
            ))}
          </Box>
        </Paper>

        {/* Question */}
        <QuestionRenderer
          question={{ ...question, text: question.text }}
          answer={answers[currentQuestionIdx]}
          onAnswerChange={handleAnswer}
          flagged={flagged.has(currentQuestionIdx)}
          onToggleFlag={toggleFlag}
          questionNumber={currentQuestionIdx + 1}
          totalQuestions={MOCK_QUESTIONS.length}
        />

        {/* Navigation */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Button variant="outlined" disabled={currentQuestionIdx === 0}
            onClick={() => setCurrentQuestionIdx(prev => prev - 1)}>
            Précédent
          </Button>
          {currentQuestionIdx < MOCK_QUESTIONS.length - 1 ? (
            <Button variant="contained" onClick={() => setCurrentQuestionIdx(prev => prev + 1)}>
              Suivant
            </Button>
          ) : (
            <Button variant="contained" color="success" onClick={handleSubmit}>
              Terminer et voir les résultats
            </Button>
          )}
        </Box>
      </Box>
    );
  }

  // === RÉSULTATS ===
  if (quizState === 'results' && score) {
    return (
      <Box sx={{ p: { xs: 1, md: 2 }, maxWidth: 800, mx: 'auto' }}>
        {/* Score global */}
        <Paper elevation={3} sx={{ p: 4, mb: 3, textAlign: 'center',
          bgcolor: score.percentage >= 70 ? 'success.50' : score.percentage >= 50 ? 'warning.50' : 'error.50' }}>
          <TrophyIcon sx={{ fontSize: 64, color: score.percentage >= 70 ? 'success.main' : score.percentage >= 50 ? 'warning.main' : 'error.main', mb: 1 }} />
          <Typography variant="h3" fontWeight="bold">{score.percentage}%</Typography>
          <Typography variant="h6" color="text.secondary">
            {score.correct}/{score.total} questions correctes — {score.earnedPts}/{score.totalPts} points
          </Typography>
          <Chip label={score.percentage >= 70 ? 'Bien joué !' : score.percentage >= 50 ? 'Peut mieux faire' : 'À retravailler'}
            color={score.percentage >= 70 ? 'success' : score.percentage >= 50 ? 'warning' : 'error'}
            sx={{ mt: 1, fontSize: '1rem' }} />
        </Paper>

        {/* Corrections détaillées */}
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Corrections détaillées</Typography>
        {MOCK_QUESTIONS.map((question, idx) => (
          <QuestionRenderer
            key={question.id}
            question={question}
            answer={answers[idx]}
            onAnswerChange={() => {}}
            questionNumber={idx + 1}
            totalQuestions={MOCK_QUESTIONS.length}
            readOnly
            showCorrection
          />
        ))}

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
          <Button variant="contained" startIcon={<ReplayIcon />} onClick={() => startQuiz(selectedQuiz)}>
            Réessayer
          </Button>
          <Button variant="outlined" onClick={handleBackToList}>
            Retour à la liste
          </Button>
        </Box>
      </Box>
    );
  }

  return null;
};

export default PracticeQuizPage;
