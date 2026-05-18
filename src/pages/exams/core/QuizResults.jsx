import React, { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
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
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  PendingActions as PendingActionsIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { useAuth } from "../hooks/useAuth";
import QuestionRenderer from "../components/QuestionRenderer";
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
 * Pour les examens blancs, utilise QuestionRenderer en mode correction visuelle.
 */
const QuizResults = ({
  questions,
  userAnswers,
  calculateScore,
  cheatingAttempts,
  scoreSummary,
  correctAnswersCount,
  examData
}) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { appState } = useAuth();

  const [showCorrections, setShowCorrections] = useState(true);
  const [expandedQuestions, setExpandedQuestions] = useState(
    () => new Set(questions.map((_, idx) => idx))
  );

  const isMockOrTraining = ['training', 'mock_exam'].includes(examData?.category);

  const resultRows = useMemo(() => {
    return questions.map((question, index) => {
      const answer = userAnswers[question.id];
      const autoGradable = isExamQuestionAutoGradable(question);
      const questionPoints = Number(question.points || 0);
      const pointsEarned = autoGradable
        ? Number(computeExamQuestionScore(question, answer) || 0)
        : null;
      const isCorrect = autoGradable && questionPoints > 0 && pointsEarned >= questionPoints;
      const hasAnswer = answer !== null && answer !== undefined && answer !== '' &&
        !(Array.isArray(answer) && answer.length === 0) &&
        !(typeof answer === 'object' && !Array.isArray(answer) && Object.keys(answer).length === 0);

      return {
        question,
        questionNumber: question.question_number || index + 1,
        answer,
        autoGradable,
        questionPoints,
        pointsEarned,
        isCorrect,
        hasAnswer,
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
  const studentName = appState.currentUser?.name || appState.profile?.full_name || 'Etudiant';

  const scoreColor = percentage >= 70 ? 'success' : percentage >= 50 ? 'warning' : 'error';
  const statusLabel = scoreSummary?.passed === null || scoreSummary?.hasManualQuestions
    ? 'Correction partielle'
    : scoreSummary?.passed
      ? 'Reussi'
      : 'A retravailler';

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
    if (expandedQuestions.size === questions.length) {
      setExpandedQuestions(new Set());
    } else {
      setExpandedQuestions(new Set(questions.map((_, idx) => idx)));
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', py: 4, px: 2 }}>
      <Box sx={{ maxWidth: 980, mx: 'auto' }}>
        <Paper elevation={3} sx={{ p: { xs: 2.5, md: 4 }, mb: 3 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
            <Box>
              <Typography variant="h4" fontWeight={800} gutterBottom>
                {isMockOrTraining ? "Résultats de l'examen blanc" : "Résultats de l'examen"}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {examData?.title || scoreSummary?.examTitle || 'Copie soumise'} - {studentName}
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
                  {mistakesCount} erreur{mistakesCount > 1 ? 's' : ''} à revoir
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper variant="outlined" sx={{ p: 2.5, height: '100%' }}>
                <Typography variant="overline" color="text.secondary">Seuil</Typography>
                <Typography variant="h3" fontWeight={800}>
                  {formatPoints(scoreSummary?.passingGrade || examData?.passing_grade || 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  point{Number(scoreSummary?.passingGrade || examData?.passing_grade || 0) > 1 ? 's' : ''} minimum requis
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
              {manualQuestionCount} question{manualQuestionCount > 1 ? 's' : ''} nécessite{manualQuestionCount > 1 ? 'nt' : ''} une correction manuelle. La note finale pourra être ajustée par le professeur.
            </Alert>
          )}

          {cheatingAttempts > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {cheatingAttempts} alerte{cheatingAttempts > 1 ? 's' : ''} de surveillance détectée{cheatingAttempts > 1 ? 's' : ''} pendant la composition.
            </Alert>
          )}

          {isMockOrTraining && (
            <Alert severity="success" sx={{ mb: 2 }}>
              <strong>Mode {examData?.category === 'mock_exam' ? 'Examen Blanc' : 'Entraînement'}</strong> — 
              Retrouvez ci-dessous la correction complète de chaque question pour mieux comprendre vos erreurs.
            </Alert>
          )}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="center" sx={{ mt: 3 }}>
            {id && (
              <Button variant="contained" onClick={() => navigate(`/student/exams/${id}/results`)}>
                Ouvrir la page résultat
              </Button>
            )}
            {scoreSummary?.resultPath && (
              <Button variant="contained" onClick={() => navigate(scoreSummary.resultPath)}>
                Ouvrir la page résultat
              </Button>
            )}
            <Button variant="outlined" onClick={() => navigate('/student/exams')}>
              Retour aux examens
            </Button>
          </Stack>
        </Paper>

        {/* Correction détaillée */}
        <Paper elevation={2} sx={{ p: { xs: 2.5, md: 3 } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h5" fontWeight={800}>
              📝 Correction détaillée
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant="outlined"
                startIcon={showCorrections ? <VisibilityOffIcon /> : <VisibilityIcon />}
                onClick={() => setShowCorrections(!showCorrections)}
              >
                {showCorrections ? 'Masquer' : 'Afficher'}
              </Button>
              {showCorrections && (
                <Button size="small" variant="text" onClick={toggleAllQuestions}>
                  {expandedQuestions.size === questions.length ? 'Tout réduire' : 'Tout développer'}
                </Button>
              )}
            </Stack>
          </Stack>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Comparez vos réponses avec les réponses attendues pour comprendre les points à retravailler.
          </Typography>

          <Collapse in={showCorrections}>
            {resultRows.map((row, index) => {
              const isExpanded = expandedQuestions.has(index);

              return (
                <Paper
                  key={row.question.id || index}
                  variant="outlined"
                  sx={{
                    mb: 2,
                    overflow: 'hidden',
                    borderColor: !row.autoGradable
                      ? 'warning.main'
                      : row.isCorrect
                        ? 'success.main'
                        : !row.hasAnswer
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
                      bgcolor: !row.autoGradable
                        ? 'warning.50'
                        : row.isCorrect
                          ? 'success.50'
                          : !row.hasAnswer
                            ? 'grey.50'
                            : 'error.50',
                      '&:hover': { opacity: 0.9 }
                    }}
                    onClick={() => toggleQuestion(index)}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1 }}>
                      {!row.autoGradable ? (
                        <PendingActionsIcon color="warning" />
                      ) : row.isCorrect ? (
                        <CheckCircleIcon color="success" />
                      ) : !row.hasAnswer ? (
                        <CancelIcon color="disabled" />
                      ) : (
                        <CancelIcon color="error" />
                      )}
                      <Box>
                        <Typography variant="subtitle1" fontWeight={800}>
                          Q{row.questionNumber}. {row.question.question_text || row.question.text}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {row.questionPoints} point{row.questionPoints > 1 ? 's' : ''}
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        color={!row.autoGradable ? 'warning' : row.isCorrect ? 'success' : 'error'}
                        icon={!row.autoGradable ? <PendingActionsIcon /> : row.isCorrect ? <CheckCircleIcon /> : <CancelIcon />}
                        label={!row.autoGradable ? 'Correction manuelle' : `${formatPoints(row.pointsEarned)}/${formatPoints(row.questionPoints)}`}
                        size="small"
                      />
                      <IconButton size="small">
                        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </Stack>
                  </Box>

                  {/* Corps détaillé */}
                  <Collapse in={isExpanded}>
                    <Box sx={{ p: 2 }}>
                      {/* Mode visuel avec QuestionRenderer pour les examens blancs */}
                      {isMockOrTraining && row.autoGradable ? (
                        <Box>
                          <QuestionRenderer
                            question={row.question}
                            answer={row.answer}
                            onAnswerChange={() => {}}
                            questionNumber={row.questionNumber}
                            totalQuestions={questions.length}
                            readOnly={true}
                            showCorrection={true}
                          />
                          <Paper
                            sx={{
                              mt: 2, p: 2,
                              bgcolor: row.isCorrect ? 'success.50' : 'error.50',
                              borderLeft: '4px solid',
                              borderColor: row.isCorrect ? 'success.main' : 'error.main'
                            }}
                          >
                            <Typography variant="subtitle2" color={row.isCorrect ? 'success.main' : 'error.main'}>
                              {row.isCorrect
                                ? '✅ Bonne réponse !'
                                : !row.hasAnswer
                                  ? '⚠️ Pas de réponse fournie'
                                  : '❌ Réponse incorrecte'}
                            </Typography>
                            {!row.isCorrect && row.hasAnswer && (
                              <Typography variant="body2" sx={{ mt: 0.5 }} color="text.secondary">
                                La bonne réponse est indiquée en vert ci-dessus.
                              </Typography>
                            )}
                          </Paper>
                        </Box>
                      ) : (
                        /* Mode texte pour les évaluations classiques */
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={row.autoGradable ? 6 : 12}>
                            <Paper variant="outlined" sx={{ p: 2, bgcolor: row.autoGradable && !row.isCorrect ? 'error.50' : 'grey.50' }}>
                              <Typography variant="subtitle2" gutterBottom>Votre réponse</Typography>
                              <Typography variant="body1">{row.displayAnswer || 'Aucune réponse'}</Typography>
                            </Paper>
                          </Grid>
                          {row.autoGradable && (
                            <Grid item xs={12} md={6}>
                              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'success.50' }}>
                                <Typography variant="subtitle2" gutterBottom>Réponse attendue</Typography>
                                <Typography variant="body1">{row.correctAnswerLabel || '-'}</Typography>
                              </Paper>
                            </Grid>
                          )}
                        </Grid>
                      )}

                      {row.question.explanation && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                          {row.question.explanation}
                        </Alert>
                      )}

                      {!row.autoGradable && (
                        <Alert severity="warning" sx={{ mt: 2 }}>
                          Cette question nécessite une correction manuelle par le professeur.
                        </Alert>
                      )}
                    </Box>
                  </Collapse>
                </Paper>
              );
            })}
          </Collapse>
        </Paper>
      </Box>
    </Box>
  );
};

export default QuizResults;
