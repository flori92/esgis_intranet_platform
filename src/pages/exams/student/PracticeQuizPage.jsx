import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  LinearProgress,
  Paper,
  Snackbar,
  Typography,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  PlayArrow as PlayIcon,
  Quiz as QuizIcon,
  Replay as ReplayIcon,
  Timer as TimerIcon,
} from '@mui/icons-material';
import { useAuth } from '@/context/AuthContext';
import { getPracticeQuizQuestions, getPracticeQuizzes, savePracticeQuizAttempt } from '@/api/admin';
import QuestionRenderer from '../components/QuestionRenderer';
import {
  computeExamQuestionScore,
  isExamQuestionAutoGradable,
  normalizeExamQuestion,
} from '@/utils/examQuestionUtils';

const MOCK_QUESTIONS = [
  {
    id: 'mock-pq1',
    type: 'qcm_single',
    text: 'Quelle balise HTML est utilisée pour un paragraphe ?',
    options: ['<p>', '<para>', '<text>', '<pg>'],
    correct_answer: '0',
    points: 1,
    explanation: 'La balise <p> est la balise standard HTML pour un paragraphe.',
  },
  {
    id: 'mock-pq2',
    type: 'true_false',
    text: 'CSS signifie "Cascading Style Sheets".',
    correct_answer: 'true',
    points: 1,
    explanation: 'CSS signifie Cascading Style Sheets.',
  },
  {
    id: 'mock-pq3',
    type: 'qcm_multiple',
    text: 'Lesquels sont des sélecteurs CSS valides ?',
    options: ['#id', '.class', '@element', '*'],
    correct_answer: ['0', '1', '3'],
    points: 2,
    explanation: '# pour les ID, . pour les classes et * pour le sélecteur universel.',
  },
  {
    id: 'mock-pq4',
    type: 'short_answer',
    text: 'Quelle propriété CSS change la couleur du texte ?',
    correct_answer: 'color',
    points: 1,
    explanation: 'La propriété color définit la couleur du texte.',
  },
];

const MOCK_QUIZZES = [
  {
    id: 'mock-quiz',
    title: 'Quiz de démonstration',
    description: 'Quiz local de secours utilisé uniquement si la base n’est pas encore alimentée.',
    matiere: 'Développement Web',
    professor: 'Équipe ESGIS',
    questions_count: MOCK_QUESTIONS.length,
    attempts: 0,
    best_score: null,
    duration: 10,
    difficulty: 'Facile',
    embeddedQuestions: MOCK_QUESTIONS,
    isMock: true,
  },
];

const mapDifficultyLabel = (difficulty) => {
  if (difficulty === 'easy') return 'Facile';
  if (difficulty === 'hard') return 'Difficile';
  return 'Moyen';
};

const getQuestionKey = (question, index) => String(question?.id || `question-${index + 1}`);

const getInitialAnswerValue = (question) => {
  switch (question?.question_type || question?.type) {
    case 'qcm_multiple':
      return [];
    case 'matching':
    case 'fill_blank':
      return {};
    case 'ordering':
      return Array.isArray(question.items)
        ? question.items.map((item, index) => ({ id: index, text: item }))
        : [];
    default:
      return '';
  }
};

const PracticeQuizPage = () => {
  const { authState } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [pageError, setPageError] = useState(null);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [quizState, setQuizState] = useState('list');
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState(new Set());
  const [score, setScore] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const loadQuizzes = async () => {
      setLoading(true);
      setPageError(null);

      try {
        const { data, error } = await getPracticeQuizzes(authState.user?.id);
        if (error) throw error;

        if (data?.length) {
          setQuizzes(
            data.map((quiz) => ({
              id: quiz.id,
              title: quiz.title,
              description: quiz.description || '',
              matiere: quiz.cours?.name || '-',
              professor: quiz.professeur?.full_name || '-',
              questions_count: quiz.questions_count || 0,
              attempts: quiz.attempts || 0,
              best_score: quiz.best_score,
              duration: quiz.duration_minutes || 30,
              difficulty: mapDifficultyLabel(quiz.difficulty),
              isMock: false,
            }))
          );
          return;
        }

        setQuizzes(MOCK_QUIZZES);
      } catch (error) {
        console.error('Erreur de chargement des quiz d’entraînement:', error);
        setPageError('Les quiz d’entraînement réels ne sont pas encore disponibles. Affichage du mode de secours.');
        setQuizzes(MOCK_QUIZZES);
      } finally {
        setLoading(false);
      }
    };

    loadQuizzes();
  }, [authState.user?.id]);

  const startQuiz = async (quiz) => {
    setActionLoading(true);
    setPageError(null);

    try {
      const questionsSource = quiz.embeddedQuestions
        ? quiz.embeddedQuestions
        : (await getPracticeQuizQuestions(quiz.id)).data;

      if (!Array.isArray(questionsSource) || questionsSource.length === 0) {
        throw new Error('Aucune question disponible pour ce quiz.');
      }

      const normalizedQuestions = questionsSource.map((question, index) => normalizeExamQuestion({
        ...question,
        id: question.id || `${quiz.id}-question-${index + 1}`,
        question_number: question.question_number || index + 1,
        question_text: question.question_text || question.text || '',
      }));

      const initialAnswers = normalizedQuestions.reduce((accumulator, question) => {
        accumulator[getQuestionKey(question, 0)] = getInitialAnswerValue(question);
        return accumulator;
      }, {});

      setSelectedQuiz(quiz);
      setSelectedQuestions(normalizedQuestions);
      setCurrentQuestionIdx(0);
      setAnswers(initialAnswers);
      setFlagged(new Set());
      setScore(null);
      setQuizState('taking');
    } catch (error) {
      console.error('Erreur au démarrage du quiz:', error);
      setPageError(error.message || 'Impossible de charger ce quiz pour le moment.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAnswer = (value) => {
    const currentQuestion = selectedQuestions[currentQuestionIdx];
    if (!currentQuestion) return;

    setAnswers((previous) => ({
      ...previous,
      [getQuestionKey(currentQuestion, currentQuestionIdx)]: value,
    }));
  };

  const toggleFlag = () => {
    setFlagged((previous) => {
      const next = new Set(previous);
      if (next.has(currentQuestionIdx)) next.delete(currentQuestionIdx);
      else next.add(currentQuestionIdx);
      return next;
    });
  };

  const handleSubmit = async () => {
    let correct = 0;
    let totalPts = 0;
    let earnedPts = 0;

    selectedQuestions.forEach((question, index) => {
      const questionKey = getQuestionKey(question, index);
      const questionPoints = Number(question.points || 0);
      const rawAnswer = answers[questionKey];
      const questionScore = Number(computeExamQuestionScore(question, rawAnswer) || 0);

      totalPts += questionPoints;
      earnedPts += questionScore;

      if (isExamQuestionAutoGradable(question) && questionScore >= questionPoints) {
        correct += 1;
      }
    });

    const percentage = totalPts > 0 ? Math.round((earnedPts / totalPts) * 100) : 0;

    setScore({
      correct,
      total: selectedQuestions.length,
      earnedPts,
      totalPts,
      percentage,
    });
    setQuizState('results');

    setQuizzes((previous) => previous.map((quiz) => {
      if (quiz.id !== selectedQuiz.id) {
        return quiz;
      }

      return {
        ...quiz,
        attempts: Number(quiz.attempts || 0) + 1,
        best_score: quiz.best_score !== null ? Math.max(quiz.best_score, percentage) : percentage,
      };
    }));

    if (selectedQuiz?.isMock || !authState.user?.id) {
      return;
    }

    try {
      await savePracticeQuizAttempt({
        quiz_id: selectedQuiz.id,
        student_id: authState.user.id,
        answers,
        score: Math.round(earnedPts),
        max_score: Math.round(totalPts),
        percentage,
      });
      setSuccessMessage('Tentative enregistrée dans votre historique.');
    } catch (error) {
      console.error('Erreur lors de l’enregistrement de la tentative:', error);
      setPageError('Le score a été calculé, mais la tentative n’a pas pu être enregistrée.');
    }
  };

  const handleBackToList = () => {
    setQuizState('list');
    setSelectedQuiz(null);
    setSelectedQuestions([]);
    setCurrentQuestionIdx(0);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (quizState === 'list') {
    return (
      <Box sx={{ p: { xs: 1, md: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <QuizIcon sx={{ mr: 1, color: 'primary.main', fontSize: 32 }} />
          <Typography variant="h5" fontWeight="bold">Quiz d&apos;Entraînement</Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          Les quiz d&apos;entraînement sont libres : plusieurs tentatives sont autorisées, le score est affiché
          immédiatement et ils ne sont pas comptés dans la moyenne officielle.
        </Alert>

        {pageError && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            {pageError}
          </Alert>
        )}

        <Grid container spacing={2}>
          {quizzes.map((quiz) => (
            <Grid item xs={12} md={6} lg={4} key={quiz.id}>
              <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flex: 1 }}>
                  <Typography variant="h6" fontWeight="bold">{quiz.title}</Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {quiz.matiere} — {quiz.professor}
                  </Typography>
                  {quiz.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                      {quiz.description}
                    </Typography>
                  )}
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                    <Chip label={`${quiz.questions_count} questions`} size="small" variant="outlined" />
                    <Chip label={`~${quiz.duration} min`} size="small" variant="outlined" icon={<TimerIcon />} />
                    <Chip
                      label={quiz.difficulty}
                      size="small"
                      color={quiz.difficulty === 'Facile' ? 'success' : quiz.difficulty === 'Moyen' ? 'warning' : 'error'}
                    />
                  </Box>
                  {Number(quiz.attempts || 0) > 0 && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {quiz.attempts} tentative{quiz.attempts > 1 ? 's' : ''} — Meilleur score :
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={quiz.best_score || 0}
                          sx={{ flex: 1, height: 8, borderRadius: 4 }}
                          color={quiz.best_score >= 70 ? 'success' : quiz.best_score >= 50 ? 'warning' : 'error'}
                        />
                        <Typography variant="body2" fontWeight="bold">
                          {quiz.best_score}%
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </CardContent>
                <Box sx={{ p: 2, pt: 0 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    disabled={actionLoading}
                    startIcon={quiz.attempts > 0 ? <ReplayIcon /> : <PlayIcon />}
                    onClick={() => startQuiz(quiz)}
                  >
                    {actionLoading && selectedQuiz?.id === quiz.id
                      ? 'Chargement...'
                      : quiz.attempts > 0 ? 'Réessayer' : 'Commencer'}
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (quizState === 'taking') {
    const question = selectedQuestions[currentQuestionIdx];
    const progress = selectedQuestions.length > 0
      ? ((currentQuestionIdx + 1) / selectedQuestions.length) * 100
      : 0;

    return (
      <Box sx={{ p: { xs: 1, md: 2 }, maxWidth: 800, mx: 'auto' }}>
        <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold">{selectedQuiz?.title}</Typography>
            <Chip label={`${currentQuestionIdx + 1}/${selectedQuestions.length}`} color="primary" />
          </Box>
          <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} />
          <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
            {selectedQuestions.map((item, index) => {
              const key = getQuestionKey(item, index);
              const hasAnswer = answers[key] !== '' && answers[key] !== undefined
                && (!Array.isArray(answers[key]) || answers[key].length > 0);

              return (
                <Chip
                  key={key}
                  label={index + 1}
                  size="small"
                  variant={index === currentQuestionIdx ? 'filled' : 'outlined'}
                  color={hasAnswer ? (flagged.has(index) ? 'warning' : 'success') : 'default'}
                  onClick={() => setCurrentQuestionIdx(index)}
                  sx={{ cursor: 'pointer', minWidth: 32 }}
                />
              );
            })}
          </Box>
        </Paper>

        <QuestionRenderer
          question={question}
          answer={answers[getQuestionKey(question, currentQuestionIdx)]}
          onAnswerChange={handleAnswer}
          flagged={flagged.has(currentQuestionIdx)}
          onToggleFlag={toggleFlag}
          questionNumber={currentQuestionIdx + 1}
          totalQuestions={selectedQuestions.length}
        />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Button
            variant="outlined"
            disabled={currentQuestionIdx === 0}
            onClick={() => setCurrentQuestionIdx((previous) => previous - 1)}
          >
            Précédent
          </Button>
          {currentQuestionIdx < selectedQuestions.length - 1 ? (
            <Button variant="contained" onClick={() => setCurrentQuestionIdx((previous) => previous + 1)}>
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

  if (quizState === 'results' && score) {
    return (
      <Box sx={{ p: { xs: 1, md: 2 }, maxWidth: 800, mx: 'auto' }}>
        <Paper
          elevation={3}
          sx={{
            p: 4,
            mb: 3,
            textAlign: 'center',
            bgcolor: score.percentage >= 70 ? 'success.50' : score.percentage >= 50 ? 'warning.50' : 'error.50',
          }}
        >
          <TrophyIcon
            sx={{
              fontSize: 64,
              color: score.percentage >= 70 ? 'success.main' : score.percentage >= 50 ? 'warning.main' : 'error.main',
              mb: 1,
            }}
          />
          <Typography variant="h3" fontWeight="bold">{score.percentage}%</Typography>
          <Typography variant="h6" color="text.secondary">
            {score.correct}/{score.total} questions correctes — {score.earnedPts}/{score.totalPts} points
          </Typography>
          <Chip
            label={score.percentage >= 70 ? 'Bien joué !' : score.percentage >= 50 ? 'Peut mieux faire' : 'À retravailler'}
            color={score.percentage >= 70 ? 'success' : score.percentage >= 50 ? 'warning' : 'error'}
            sx={{ mt: 1, fontSize: '1rem' }}
          />
        </Paper>

        {pageError && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {pageError}
          </Alert>
        )}

        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
          Corrections détaillées
        </Typography>
        {selectedQuestions.map((question, index) => (
          <QuestionRenderer
            key={getQuestionKey(question, index)}
            question={question}
            answer={answers[getQuestionKey(question, index)]}
            onAnswerChange={() => {}}
            questionNumber={index + 1}
            totalQuestions={selectedQuestions.length}
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

        <Snackbar
          open={Boolean(successMessage)}
          autoHideDuration={3000}
          onClose={() => setSuccessMessage('')}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="success" onClose={() => setSuccessMessage('')} sx={{ width: '100%' }}>
            {successMessage}
          </Alert>
        </Snackbar>
      </Box>
    );
  }

  return null;
};

export default PracticeQuizPage;
