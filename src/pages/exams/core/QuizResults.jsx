import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Typography
} from '@mui/material';
import {
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  PendingActions as PendingActionsIcon
} from '@mui/icons-material';
import { useAuth } from "../hooks/useAuth";
import {
  computeExamQuestionScore,
  formatExamAnswer,
  getExamCorrectAnswerLabel,
  isExamQuestionAutoGradable
} from "@/utils/examQuestionUtils";

const formatPoints = (value) => {
  const numericValue = Number(value || 0);
  return Number.isInteger(numericValue) ? String(numericValue) : numericValue.toFixed(2);
};

/**
 * Composant d'affichage des resultats du quiz/examen.
 * Affiche le score, la note et une correction detaillee pour aider l'etudiant a progresser.
 */
const QuizResults = ({
  questions,
  userAnswers,
  calculateScore,
  cheatingAttempts,
  scoreSummary,
  correctAnswersCount
}) => {
  const navigate = useNavigate();
  const { appState } = useAuth();

  const resultRows = useMemo(() => {
    return questions.map((question, index) => {
      const answer = userAnswers[question.id];
      const autoGradable = isExamQuestionAutoGradable(question);
      const questionPoints = Number(question.points || 0);
      const pointsEarned = autoGradable
        ? Number(computeExamQuestionScore(question, answer) || 0)
        : null;
      const isCorrect = autoGradable && questionPoints > 0 && pointsEarned >= questionPoints;

      return {
        question,
        questionNumber: question.question_number || index + 1,
        answer,
        autoGradable,
        questionPoints,
        pointsEarned,
        isCorrect,
        displayAnswer: formatExamAnswer(question, answer),
        correctAnswerLabel: getExamCorrectAnswerLabel(question)
      };
    });
  }, [questions, userAnswers]);

  const score = Number(scoreSummary?.score ?? calculateScore() ?? 0);
  const totalPossibleScore = Number(
    scoreSummary?.maxScore ??
    questions.reduce((total, question) => total + Number(question.points || 0), 0)
  );
  const percentage = totalPossibleScore > 0 ? (score / totalPossibleScore) * 100 : 0;
  const manualQuestionCount = resultRows.filter((row) => !row.autoGradable).length;
  const mistakesCount = resultRows.filter((row) => row.autoGradable && !row.isCorrect).length;
  const isMockExam = scoreSummary?.category === 'mock_exam';
  const studentName = appState.currentUser?.name || appState.profile?.full_name || 'Etudiant';

  const scoreColor = percentage >= 70 ? 'success' : percentage >= 50 ? 'warning' : 'error';
  const statusLabel = scoreSummary?.passed === null || scoreSummary?.hasManualQuestions
    ? 'Correction partielle'
    : scoreSummary?.passed
      ? 'Reussi'
      : 'A retravailler';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', py: 4, px: 2 }}>
      <Box sx={{ maxWidth: 980, mx: 'auto' }}>
        <Paper elevation={3} sx={{ p: { xs: 2.5, md: 4 }, mb: 3 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
            <Box>
              <Typography variant="h4" fontWeight={800} gutterBottom>
                {isMockExam ? "Resultats de l'examen blanc" : "Resultats de l'examen"}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {scoreSummary?.examTitle || 'Copie soumise'} - {studentName}
              </Typography>
            </Box>
            <Chip
              label={statusLabel}
              color={scoreColor}
              icon={scoreSummary?.hasManualQuestions ? <PendingActionsIcon /> : percentage >= 50 ? <CheckCircleIcon /> : <CancelIcon />}
              sx={{ alignSelf: { xs: 'flex-start', md: 'center' }, fontWeight: 700 }}
            />
          </Stack>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <Paper variant="outlined" sx={{ p: 2.5, height: '100%' }}>
                <Typography variant="overline" color="text.secondary">Note</Typography>
                <Typography variant="h3" fontWeight={800}>
                  {formatPoints(score)}/{formatPoints(totalPossibleScore)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {percentage.toFixed(1)}%
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper variant="outlined" sx={{ p: 2.5, height: '100%' }}>
                <Typography variant="overline" color="text.secondary">Questions correctes</Typography>
                <Typography variant="h3" fontWeight={800}>
                  {correctAnswersCount}/{questions.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {mistakesCount} erreur{mistakesCount > 1 ? 's' : ''} a revoir
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper variant="outlined" sx={{ p: 2.5, height: '100%' }}>
                <Typography variant="overline" color="text.secondary">Seuil</Typography>
                <Typography variant="h3" fontWeight={800}>
                  {formatPoints(scoreSummary?.passingGrade || 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  point{Number(scoreSummary?.passingGrade || 0) > 1 ? 's' : ''} minimum requis
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          <LinearProgress
            variant="determinate"
            value={Math.min(100, Math.max(0, percentage))}
            color={scoreColor}
            sx={{ height: 10, borderRadius: 5, mb: 2 }}
          />

          {manualQuestionCount > 0 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              {manualQuestionCount} question{manualQuestionCount > 1 ? 's' : ''} necessite{manualQuestionCount > 1 ? 'nt' : ''} une correction manuelle. La note finale pourra etre ajustee par le professeur.
            </Alert>
          )}

          {cheatingAttempts > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {cheatingAttempts} alerte{cheatingAttempts > 1 ? 's' : ''} de surveillance detectee{cheatingAttempts > 1 ? 's' : ''} pendant la composition.
            </Alert>
          )}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="center" sx={{ mt: 3 }}>
            {scoreSummary?.resultPath && (
              <Button variant="contained" onClick={() => navigate(scoreSummary.resultPath)}>
                Ouvrir la page resultat
              </Button>
            )}
            <Button variant="outlined" onClick={() => navigate('/student/exams')}>
              Retour aux examens
            </Button>
          </Stack>
        </Paper>

        <Paper elevation={2} sx={{ p: { xs: 2.5, md: 3 } }}>
          <Typography variant="h5" fontWeight={800} gutterBottom>
            Correction detaillee
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Comparez vos reponses avec les reponses attendues pour comprendre les points a retravailler.
          </Typography>

          {resultRows.map((row, index) => (
            <Box key={row.question.id || index}>
              {index > 0 && <Divider sx={{ my: 3 }} />}
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2} sx={{ mb: 1 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" fontWeight={800}>
                    Q{row.questionNumber}. {row.question.question_text || row.question.text}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {row.questionPoints} point{row.questionPoints > 1 ? 's' : ''}
                  </Typography>
                </Box>
                <Chip
                  color={!row.autoGradable ? 'warning' : row.isCorrect ? 'success' : 'error'}
                  icon={!row.autoGradable ? <PendingActionsIcon /> : row.isCorrect ? <CheckCircleIcon /> : <CancelIcon />}
                  label={!row.autoGradable ? 'Correction manuelle' : `${formatPoints(row.pointsEarned)}/${formatPoints(row.questionPoints)}`}
                  sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}
                />
              </Stack>

              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                <Grid item xs={12} md={row.autoGradable ? 6 : 12}>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: row.autoGradable && !row.isCorrect ? 'error.50' : 'grey.50' }}>
                    <Typography variant="subtitle2" gutterBottom>Votre reponse</Typography>
                    <Typography variant="body1">{row.displayAnswer || 'Aucune reponse'}</Typography>
                  </Paper>
                </Grid>
                {row.autoGradable && (
                  <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'success.50' }}>
                      <Typography variant="subtitle2" gutterBottom>Reponse attendue</Typography>
                      <Typography variant="body1">{row.correctAnswerLabel || '-'}</Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>

              {row.question.explanation && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  {row.question.explanation}
                </Alert>
              )}
            </Box>
          ))}
        </Paper>
      </Box>
    </Box>
  );
};

export default QuizResults;
