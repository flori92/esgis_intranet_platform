import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Typography
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  PendingActions as PendingActionsIcon,
  Cancel as CancelIcon
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

const ExamResultsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authState } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [payload, setPayload] = useState(null);

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

    const rawAnswers = typeof payload.studentExam.answers === 'string'
      ? JSON.parse(payload.studentExam.answers || '{}')
      : (payload.studentExam.answers || {});

    const gradesByQuestionId = new Map(
      (payload.grades || []).map((grade) => [grade.question_id, grade])
    );

    return (payload.questions || []).map((question) => {
      const rawAnswer = rawAnswers[question.id] ?? null;
      const gradeRow = gradesByQuestionId.get(question.id) || null;
      const autoPoints = isExamQuestionAutoGradable(question)
        ? computeExamQuestionScore(question, rawAnswer)
        : null;
      const pointsEarned = gradeRow?.points_earned ?? autoPoints;
      const isPendingManual = !isExamQuestionAutoGradable(question) && gradeRow?.points_earned === undefined;

      return {
        question,
        rawAnswer,
        displayAnswer: formatExamAnswer(question, rawAnswer),
        correctAnswerLabel: getExamCorrectAnswerLabel(question),
        pointsEarned: typeof pointsEarned === 'number' ? pointsEarned : null,
        feedback: gradeRow?.feedback || null,
        isPendingManual
      };
    });
  }, [payload]);

  const summary = useMemo(() => {
    if (!payload) {
      return null;
    }

    const totalPoints = Number(payload.exam.total_points || 0);
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
            <Typography variant="h3">
              {summary.score}/{summary.totalPoints}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {summary.percentage.toFixed(1)}%
            </Typography>
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

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Détail par question
        </Typography>
        {questionResults.map((item, index) => (
          <Box key={item.question.id}>
            {index > 0 && <Divider sx={{ my: 3 }} />}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Q{item.question.question_number}. {item.question.question_text}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Type: {item.question.question_type} • {item.question.points} pt{Number(item.question.points) > 1 ? 's' : ''}
                </Typography>
              </Box>
              <Chip
                color={item.pointsEarned === null ? 'warning' : item.pointsEarned > 0 ? 'success' : 'default'}
                label={item.pointsEarned === null ? 'En attente' : `${item.pointsEarned}/${item.question.points}`}
              />
            </Box>

            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2">Votre réponse</Typography>
              <Typography variant="body1">{item.displayAnswer}</Typography>
            </Box>

            {isExamQuestionAutoGradable(item.question) && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2">Réponse correcte</Typography>
                <Typography variant="body1">{item.correctAnswerLabel}</Typography>
              </Box>
            )}

            {item.feedback && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2">Commentaire du professeur</Typography>
                <Typography variant="body1">{item.feedback}</Typography>
              </Box>
            )}
          </Box>
        ))}
      </Paper>
    </Box>
  );
};

export default ExamResultsPage;
