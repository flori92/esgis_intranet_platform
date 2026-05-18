import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Typography
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  PendingActions as PendingActionsIcon,
  Cancel as CancelIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { getStudentExamResultDetails } from '@/api/exams';
import {
  computeExamQuestionScore,
  formatExamAnswer,
  getExamCorrectAnswerLabel,
  isExamQuestionAutoGradable
} from '@/utils/examQuestionUtils';
import QuestionRenderer from '../components/QuestionRenderer';

const parseStudentAnswers = (value) => {
  if (!value) {
    return {};
  }

  if (typeof value === 'object') {
    return value;
  }

  if (typeof value === 'string') {
    try {
      return JSON.parse(value || '{}');
    } catch (_error) {
      return {};
    }
  }

  return {};
};

const ExamResultsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authState } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [payload, setPayload] = useState(null);
  const [expandedQuestions, setExpandedQuestions] = useState(new Set());

  useEffect(() => {
    const loadResults = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!authState.student?.id || !authState.profile?.id) {
          throw new Error('Accès non autorisé');
        }

        const { exam, studentExam, quizResult, questions, grades, error: loadError } = await getStudentExamResultDetails({
          examId: id,
          studentId: authState.student.id,
          profileId: authState.profile.id
        });

        if (loadError) {
          throw loadError;
        }

        if (!exam || !studentExam) {
          throw new Error('Résultats non disponibles pour cet examen.');
        }

        setPayload({
          exam,
          studentExam,
          quizResult,
          questions: questions || [],
          grades: grades || []
        });

        // Pour les examens blancs et entraînements, tout déplier par défaut
        if (['training', 'mock_exam'].includes(exam.category)) {
          setExpandedQuestions(new Set((questions || []).map((_, idx) => idx)));
        }
      } catch (loadResultsError) {
        console.error('Erreur lors du chargement des résultats:', loadResultsError);
        setError(loadResultsError.message || 'Impossible de charger les résultats de cet examen.');
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [authState.profile?.id, authState.student?.id, id]);

  const questionResults = useMemo(() => {
    if (!payload) {
      return [];
    }

    const rawAnswers = parseStudentAnswers(payload.studentExam.answers || payload.quizResult?.answers);

    const gradesByQuestionId = new Map(
      (payload.grades || []).map((grade) => [grade.question_id, grade])
    );

    return (payload.questions || []).map((question) => {
      const rawAnswer = rawAnswers[question.id] ?? null;
      const gradeRow = gradesByQuestionId.get(question.id) || null;
      const autoGradable = isExamQuestionAutoGradable(question);
      const autoPoints = autoGradable
        ? computeExamQuestionScore(question, rawAnswer)
        : null;
      const pointsEarned = gradeRow?.points_earned ?? autoPoints;
      const numericPointsEarned = pointsEarned === null || pointsEarned === undefined
        ? null
        : Number(pointsEarned);
      const isPendingManual = !autoGradable && (gradeRow?.points_earned === undefined || gradeRow?.points_earned === null);
      const maxPoints = Number(question.points || 0);
      const isCorrect = typeof numericPointsEarned === 'number' && numericPointsEarned >= maxPoints;
      const hasAnswer = rawAnswer !== null && rawAnswer !== undefined && rawAnswer !== '' &&
        !(Array.isArray(rawAnswer) && rawAnswer.length === 0) &&
        !(typeof rawAnswer === 'object' && !Array.isArray(rawAnswer) && Object.keys(rawAnswer).length === 0);

      return {
        question,
        rawAnswer,
        displayAnswer: formatExamAnswer(question, rawAnswer),
        correctAnswerLabel: getExamCorrectAnswerLabel(question),
        pointsEarned: Number.isFinite(numericPointsEarned) ? numericPointsEarned : null,
        maxPoints,
        isCorrect,
        hasAnswer,
        feedback: gradeRow?.feedback || null,
        autoGradable,
        isPendingManual
      };
    });
  }, [payload]);

  const summary = useMemo(() => {
    if (!payload) {
      return null;
    }

    const questionTotalPoints = questionResults.reduce((sum, item) => sum + Number(item.question.points || 0), 0);
    const totalPoints = Number(payload.exam.total_points || questionTotalPoints || 0);
    const fallbackScore = questionResults.reduce((sum, item) => sum + Number(item.pointsEarned || 0), 0);
    const score = Number(
      payload.studentExam.grade ??
      payload.quizResult?.score ??
      fallbackScore
    );
    const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;
    const passed = payload.studentExam.status === 'passed'
      ? true
      : payload.studentExam.status === 'failed'
        ? false
        : null;
    const pendingManualCount = questionResults.filter((item) => item.isPendingManual).length;

    return {
      score,
      totalPoints,
      percentage,
      passed,
      pendingManualCount,
      cheatingAttempts: Number(payload.quizResult?.cheating_attempts || 0)
    };
  }, [payload, questionResults]);

  const toggleQuestion = (index) => {
    setExpandedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const toggleAllQuestions = () => {
    if (expandedQuestions.size === questionResults.length) {
      setExpandedQuestions(new Set());
    } else {
      setExpandedQuestions(new Set(questionResults.map((_, idx) => idx)));
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !payload || !summary) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Résultats indisponibles.'}
        </Alert>
        <Button variant="contained" onClick={() => navigate('/student/exams')}>
          Retour aux examens
        </Button>
      </Box>
    );
  }

  const { exam, studentExam } = payload;
  const isMockOrTraining = ['training', 'mock_exam'].includes(exam.category);
  const scoreColor = summary.percentage >= 70 ? 'success' : summary.percentage >= 50 ? 'warning' : 'error';

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Résultats de l&apos;examen
          </Typography>
          <Typography variant="h6" color="text.secondary">
            {exam.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {exam.course_name || 'Cours inconnu'} {exam.course_code ? `(${exam.course_code})` : ''}
          </Typography>
        </Box>
        <Button variant="outlined" onClick={() => navigate('/student/exams')}>
          Retour aux examens
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="overline" color="text.secondary">Score</Typography>
            <Typography variant="h3" fontWeight="bold" color={`${scoreColor}.main`}>
              {summary.score}/{summary.totalPoints}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {summary.percentage.toFixed(1)}%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={Math.min(summary.percentage, 100)}
              color={scoreColor}
              sx={{ height: 8, borderRadius: 4, mt: 2, bgcolor: 'grey.200' }}
            />
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="overline" color="text.secondary">Statut</Typography>
            <Box sx={{ mt: 1 }}>
              {summary.passed === true && <Chip icon={<CheckCircleIcon />} color="success" label="Réussi" />}
              {summary.passed === false && <Chip icon={<CancelIcon />} color="error" label="Échec" />}
              {summary.passed === null && <Chip icon={<PendingActionsIcon />} color="warning" label="En attente de correction" />}
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Note de passage: {exam.passing_grade}/{summary.totalPoints}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="overline" color="text.secondary">Informations</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Date: {exam.date ? format(parseISO(exam.date), 'dd MMMM yyyy HH:mm', { locale: fr }) : 'Non définie'}
            </Typography>
            <Typography variant="body2">
              Durée: {exam.duration} minutes
            </Typography>
            <Typography variant="body2">
              Tentatives de triche: {summary.cheatingAttempts}
            </Typography>
            {summary.pendingManualCount > 0 && (
              <Typography variant="body2" color="warning.main">
                {summary.pendingManualCount} question(s) encore en correction manuelle
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {studentExam.comments && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {studentExam.comments}
        </Alert>
      )}

      {isMockOrTraining && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <strong>Mode {exam.category === 'mock_exam' ? 'Examen Blanc' : 'Entraînement'}</strong> — 
          Retrouvez ci-dessous la correction complète de chaque question avec les bonnes réponses mises en évidence.
        </Alert>
      )}

      {/* Détail par question */}
      <Paper sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
            📝 Détail par question
          </Typography>
          <Button size="small" variant="text" onClick={toggleAllQuestions}>
            {expandedQuestions.size === questionResults.length ? 'Tout réduire' : 'Tout développer'}
          </Button>
        </Stack>

        {questionResults.length === 0 && (
          <Alert severity="info">
            Aucune question n'est disponible pour cette copie.
          </Alert>
        )}

        {questionResults.map((item, index) => {
          const isExpanded = expandedQuestions.has(index);

          return (
            <Paper
              key={item.question.id}
              variant="outlined"
              sx={{
                mb: 2,
                overflow: 'hidden',
                borderColor: item.isPendingManual
                  ? 'warning.main'
                  : item.isCorrect
                    ? 'success.main'
                    : !item.hasAnswer
                      ? 'grey.400'
                      : 'error.main',
                borderLeftWidth: 4,
              }}
            >
              {/* En-tête cliquable */}
              <Box
                sx={{
                  p: 2,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  bgcolor: item.isPendingManual
                    ? 'warning.50'
                    : item.isCorrect
                      ? 'success.50'
                      : !item.hasAnswer
                        ? 'grey.50'
                        : 'error.50',
                  '&:hover': { opacity: 0.9 }
                }}
                onClick={() => toggleQuestion(index)}
              >
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1 }}>
                  {item.isPendingManual ? (
                    <PendingActionsIcon color="warning" />
                  ) : item.isCorrect ? (
                    <CheckCircleIcon color="success" />
                  ) : !item.hasAnswer ? (
                    <CancelIcon color="disabled" />
                  ) : (
                    <CancelIcon color="error" />
                  )}
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Q{item.question.question_number || index + 1}. {item.question.question_text || item.question.text}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.question.question_type} • {item.question.points} pt{Number(item.question.points) > 1 ? 's' : ''}
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    color={item.pointsEarned === null ? 'warning' : item.pointsEarned > 0 ? 'success' : 'default'}
                    label={item.pointsEarned === null ? 'En attente' : `${item.pointsEarned}/${item.question.points}`}
                    size="small"
                  />
                  <IconButton size="small">
                    {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Stack>
              </Box>

              {/* Corps détaillé (pliable) */}
              <Collapse in={isExpanded}>
                <Box sx={{ p: 2 }}>
                  {/* QuestionRenderer visuel pour les examens blancs */}
                  {isMockOrTraining && item.autoGradable ? (
                    <Box>
                      <QuestionRenderer
                        question={item.question}
                        answer={item.rawAnswer}
                        onAnswerChange={() => {}}
                        questionNumber={item.question.question_number || (index + 1)}
                        totalQuestions={questionResults.length}
                        readOnly={true}
                        showCorrection={true}
                      />
                      <Paper
                        sx={{
                          mt: 2, p: 2,
                          bgcolor: item.isCorrect ? 'success.50' : 'error.50',
                          borderLeft: '4px solid',
                          borderColor: item.isCorrect ? 'success.main' : 'error.main'
                        }}
                      >
                        <Typography variant="subtitle2" color={item.isCorrect ? 'success.main' : 'error.main'}>
                          {item.isCorrect
                            ? '✅ Bonne réponse !'
                            : !item.hasAnswer
                              ? '⚠️ Pas de réponse fournie'
                              : '❌ Réponse incorrecte'}
                        </Typography>
                        {!item.isCorrect && item.hasAnswer && (
                          <Typography variant="body2" sx={{ mt: 0.5 }} color="text.secondary">
                            La bonne réponse est indiquée en vert ci-dessus.
                          </Typography>
                        )}
                      </Paper>
                    </Box>
                  ) : (
                    /* Affichage texte classique */
                    <Box>
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="subtitle2">Votre réponse</Typography>
                        <Typography variant="body1">{item.displayAnswer}</Typography>
                      </Box>

                      {item.autoGradable && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2">Réponse correcte</Typography>
                          <Typography variant="body1">{item.correctAnswerLabel}</Typography>
                        </Box>
                      )}
                    </Box>
                  )}

                  {item.feedback && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2">Commentaire du professeur</Typography>
                      <Typography variant="body1">{item.feedback}</Typography>
                    </Box>
                  )}

                  {item.isPendingManual && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      Cette question nécessite une correction manuelle par le professeur.
                    </Alert>
                  )}
                </Box>
              </Collapse>
            </Paper>
          );
        })}
      </Paper>
    </Box>
  );
};

export default ExamResultsPage;
