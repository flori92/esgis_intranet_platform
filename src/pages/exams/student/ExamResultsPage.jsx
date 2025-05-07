import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Button,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  CheckCircle as CorrectIcon,
  Cancel as WrongIcon,
  QuestionMark as UngradedIcon,
  Assignment as AssignmentIcon,
  School as SchoolIcon,
  Warning as WarningIcon,
  AccessTime as TimeIcon,
  BarChart as StatisticsIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/supabase';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Question } from '../../professor/exams/components/ExamQuestions';

/**
 * @typedef {Object} ExamResult
 * @property {number} id - Identifiant du résultat
 * @property {number} student_exam_id - Identifiant de l'inscription à l'examen
 * @property {string} student_id - Identifiant de l'étudiant
 * @property {number} exam_id - Identifiant de l'examen
 * @property {number} score - Score obtenu
 * @property {number} max_score - Score maximum possible
 * @property {number} passing_score - Score minimum pour réussir
 * @property {boolean} passed - Indique si l'examen est réussi
 * @property {string|null} [grade_letter] - Note sous forme de lettre
 * @property {boolean} has_incidents - Indique s'il y a eu des incidents
 * @property {number} cheating_attempts - Nombre de tentatives de triche
 * @property {string|null} [feedback] - Commentaire général
 * @property {string} created_at - Date de création
 * @property {Object.<string, string>} answers - Réponses aux questions
 */

/**
 * @typedef {Object} Exam
 * @property {number} id - Identifiant de l'examen
 * @property {string} title - Titre de l'examen
 * @property {number} course_id - Identifiant du cours
 * @property {string} course_name - Nom du cours
 * @property {string} course_code - Code du cours
 * @property {number} professor_id - Identifiant du professeur
 * @property {string} professor_name - Nom du professeur
 * @property {string} date - Date de l'examen
 * @property {number} duration - Durée en minutes
 * @property {string} type - Type d'examen
 * @property {number} total_points - Total des points
 * @property {number} passing_grade - Note minimale pour réussir
 */

/**
 * @typedef {Object} StudentAnswer
 * @property {number} id - Identifiant de la réponse
 * @property {number} student_exam_id - Identifiant de l'inscription à l'examen
 * @property {number} question_id - Identifiant de la question
 * @property {*} answer_value - Valeur de la réponse
 * @property {boolean|null} [is_correct] - Indique si la réponse est correcte
 * @property {number|null} [grade] - Note obtenue pour cette question
 * @property {string|null} [feedback] - Commentaire sur la réponse
 */

/**
 * @typedef {Object} AnswerDetail
 * @property {Object} question - Question de l'examen
 * @property {Object} answer - Réponse de l'étudiant
 */

/**
 * Composant pour afficher les résultats d'un examen pour un étudiant
 * @param {Object} props - Propriétés du composant
 * @param {ExamResult} props.examResult - Résultat de l'examen
 * @param {Array<Object>} props.questions - Liste des questions de l'examen
 */
const ExamResultsPage = ({
  examResult,
  questions
}) => {
  const { authState } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const examId = id ? parseInt(id) : 0;
  
  // États
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exam, setExam] = useState(null);
  const [result, setResult] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [classAverage, setClassAverage] = useState(null);
  const [classHighest, setClassHighest] = useState(null);
  const [classLowest, setClassLowest] = useState(null);
  
  // Référence pour éviter les recréations de fonctions
  const fetchDataRef = useRef(async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!authState.student) {
        throw new Error('Données étudiant non disponibles');
      }
      
      const studentId = authState.student.id;
      
      // Récupérer les informations de l'examen
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select(`
          id,
          title,
          course_id,
          courses:course_id(name, code),
          professor_id,
          professors:professor_id(profiles:profile_id(full_name)),
          date,
          duration,
          type,
          total_points,
          passing_grade
        `)
        .eq('id', examId)
        .single();
      
      if (examError) throw examError;
      
      if (!examData) {
        throw new Error('Examen non trouvé');
      }
      
      const transformedExam = {
        id: examData.id,
        title: examData.title,
        course_id: examData.course_id,
        course_name: examData.courses?.name || 'Inconnu',
        course_code: examData.courses?.code || 'Inconnu',
        professor_id: examData.professor_id,
        professor_name: examData.professors?.profiles?.full_name || 'Inconnu',
        date: examData.date,
        duration: examData.duration,
        type: examData.type,
        total_points: examData.total_points,
        passing_grade: examData.passing_grade
      };
      
      setExam(transformedExam);
      
      // Récupérer les résultats de l'examen
      const { data: resultData, error: resultError } = await supabase
        .from('exam_results')
        .select('*')
        .eq('student_id', studentId)
        .eq('exam_id', examId)
        .single();
      
      if (resultError) throw resultError;
      
      if (!resultData) {
        throw new Error('Résultats non disponibles');
      }
      
      setResult(resultData);
      
      // Récupérer les questions de l'examen
      const { data: questionsData, error: questionsError } = await supabase
        .from('exam_questions')
        .select('*')
        .eq('exam_id', examId)
        .order('question_number', { ascending: true });
      
      if (questionsError) throw questionsError;
      
      if (!questionsData || questionsData.length === 0) {
        throw new Error('Questions non disponibles');
      }
      
      // Récupérer les réponses de l'étudiant
      const { data: answersData, error: answersError } = await supabase
        .from('student_answers')
        .select('*')
        .eq('student_exam_id', resultData.student_exam_id);
      
      if (answersError) throw answersError;
      
      if (!answersData) {
        throw new Error('Réponses non disponibles');
      }
      
      // Combiner les questions et les réponses
      const answerDetails = questionsData.map(question => {
        const answer = answersData.find(a => a.question_id === question.id) || {
          id: 0,
          student_exam_id: resultData.student_exam_id,
          question_id: question.id,
          answer_value: null,
          is_correct: null,
          grade: null,
          feedback: null
        };
        
        return {
          question,
          answer
        };
      });
      
      setAnswers(answerDetails);
      
      // Récupérer les statistiques de la classe
      try {
        const { data: statsData, error: statsError } = await supabase
          .rpc('get_exam_class_statistics', { p_exam_id: examId });
        
        if (statsError) throw statsError;
        
        if (statsData) {
          setClassAverage(statsData.average);
          setClassHighest(statsData.highest);
          setClassLowest(statsData.lowest);
        }
      } catch (statsErr) {
        console.error('Erreur lors de la récupération des statistiques:', statsErr);
        // Ne pas interrompre le flux si les statistiques ne sont pas disponibles
      }
      
    } catch (err) {
      console.error('Erreur lors du chargement des résultats d\'examen:', err);
      setError(err.message || 'Une erreur est survenue lors du chargement des résultats.');
    } finally {
      setLoading(false);
    }
  });
  
  // Charger les données au montage du composant ou si on reçoit les données via props
  useEffect(() => {
    if (examResult && questions && questions.length > 0) {
      setResult(examResult);
      
      // Traiter les questions et réponses à partir des props
      const answerDetails = questions.map(question => {
        let answerValue = null;
        if (examResult.answers && examResult.answers[question.id]) {
          answerValue = examResult.answers[question.id];
        }
        
        return {
          question,
          answer: {
            id: 0, // ID temporaire
            student_exam_id: examResult.student_exam_id,
            question_id: question.id,
            answer_value: answerValue,
            is_correct: null, // À déterminer côté serveur
            grade: null, // À déterminer côté serveur
            feedback: null
          }
        };
      });
      
      setAnswers(answerDetails);
      setLoading(false);
    } else {
      fetchDataRef.current();
    }
  }, [examResult, questions]);
  
  // Si on utilise le useParams hook et que les données changent
  useEffect(() => {
    if (examId && !examResult) {
      fetchDataRef.current();
    }
  }, [examId, examResult]);
  
  // Vérifier si l'utilisateur est étudiant
  if (!authState.isStudent) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Vous n'avez pas les droits nécessaires pour accéder à cette page.
        </Alert>
      </Box>
    );
  }
  
  // Afficher le chargement
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Afficher les erreurs
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button variant="outlined" color="primary" onClick={() => navigate('/student/exams')}>
          Retour à la liste des examens
        </Button>
      </Box>
    );
  }
  
  /**
   * Formater une date pour l'affichage
   * @param {string} dateString - Chaîne de date à formater
   * @returns {string} Date formatée
   */
  const formatDate = (dateString) => {
    try {
      return format(parseISO(dateString), 'dd MMMM yyyy à HH:mm', { locale: fr });
    } catch (error) {
      console.error('Erreur de formatage de date:', error);
      return 'Date indisponible';
    }
  };
  
  /**
   * Calculer le pourcentage
   * @param {number} value - Valeur
   * @param {number} total - Total
   * @returns {number} Pourcentage
   */
  const calculatePercentage = (value, total) => {
    return Math.round((value / total) * 100);
  };
  
  /**
   * Obtenir la classe CSS selon le score
   * @param {number} score - Score obtenu
   * @param {number} maxScore - Score maximum
   * @returns {string} Classe CSS
   */
  const getScoreClass = (score, maxScore) => {
    const percentage = calculatePercentage(score, maxScore);
    if (percentage >= 80) return 'success.main';
    if (percentage >= 60) return 'info.main';
    if (percentage >= 50) return 'warning.main';
    return 'error.main';
  };
  
  /**
   * Obtenir la lettre de notation
   * @param {number} score - Score obtenu
   * @param {number} maxScore - Score maximum
   * @returns {string} Lettre de notation
   */
  const getGradeLetter = (score, maxScore) => {
    const percentage = calculatePercentage(score, maxScore);
    
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    if (percentage >= 50) return 'E';
    return 'F';
  };
  
  // Afficher les résultats si disponibles
  if (result && exam) {
    const scorePercentage = calculatePercentage(result.score, result.max_score);
    const hasPassed = result.passed;
    const gradeLetter = result.grade_letter || getGradeLetter(result.score, result.max_score);
    
    return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">
            Résultats d'examen
          </Typography>
          <Button variant="outlined" onClick={() => navigate('/student/exams')}>
            Retour aux examens
          </Button>
        </Box>
        
        {/* Informations générales */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                {exam.title}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                {exam.course_code} - {exam.course_name}
              </Typography>
              
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <SchoolIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="body1">
                      Professeur: {exam.professor_name}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <AssignmentIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="body1">
                      Type: {exam.type === 'midterm' ? 'Partiel' : 
                             exam.type === 'final' ? 'Final' : 
                             exam.type === 'quiz' ? 'Quiz' : 
                             exam.type}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TimeIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="body1">
                      Date: {formatDate(exam.date)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TimeIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="body1">
                      Durée: {exam.duration} minutes
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card 
              sx={{ 
                height: '100%', 
                bgcolor: hasPassed ? 'success.light' : 'error.light',
                color: 'white'
              }}
            >
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h5" gutterBottom>
                  {hasPassed ? 'Examen Réussi' : 'Examen Non Réussi'}
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', my: 2 }}>
                  <Typography variant="h3" component="div" sx={{ mr: 1 }}>
                    {scorePercentage}%
                  </Typography>
                  <Typography variant="h4" component="div">
                    {gradeLetter}
                  </Typography>
                </Box>
                
                <Typography variant="body1">
                  Score: {result.score}/{result.max_score}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Note minimale: {result.passing_score}/{result.max_score}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        {/* Statistiques de classe si disponibles */}
        {(classAverage !== null || classHighest !== null || classLowest !== null) && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <StatisticsIcon sx={{ mr: 1 }} />
                  Statistiques de la classe
                </Typography>
                <Grid container spacing={3}>
                  {classAverage !== null && (
                    <Grid item xs={4}>
                      <Card variant="outlined">
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="subtitle1" color="text.secondary">
                            Moyenne
                          </Typography>
                          <Typography variant="h5">
                            {classAverage.toFixed(2)}/{result.max_score}
                          </Typography>
                          <Typography variant="body2">
                            {calculatePercentage(classAverage, result.max_score)}%
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}
                  
                  {classHighest !== null && (
                    <Grid item xs={4}>
                      <Card variant="outlined">
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="subtitle1" color="text.secondary">
                            Meilleure note
                          </Typography>
                          <Typography variant="h5">
                            {classHighest}/{result.max_score}
                          </Typography>
                          <Typography variant="body2">
                            {calculatePercentage(classHighest, result.max_score)}%
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}
                  
                  {classLowest !== null && (
                    <Grid item xs={4}>
                      <Card variant="outlined">
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="subtitle1" color="text.secondary">
                            Note la plus basse
                          </Typography>
                          <Typography variant="h5">
                            {classLowest}/{result.max_score}
                          </Typography>
                          <Typography variant="body2">
                            {calculatePercentage(classLowest, result.max_score)}%
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        )}
        
        {/* Incidents si présents */}
        {result.has_incidents && (
          <Alert severity="warning" sx={{ mb: 4 }}>
            <Typography variant="subtitle1">
              Incidents détectés pendant l'examen
            </Typography>
            <Typography variant="body2">
              {result.cheating_attempts > 0 && `${result.cheating_attempts} tentative(s) de triche détectée(s)`}
            </Typography>
          </Alert>
        )}
        
        {/* Réponses et notes par question */}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Détail des réponses
              </Typography>
              
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Question</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Points</TableCell>
                      <TableCell>Votre réponse</TableCell>
                      <TableCell>Statut</TableCell>
                      <TableCell>Note</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {answers.map(({ question, answer }) => {
                      const isMultipleChoice = question.question_type === 'multiple_choice';
                      const isCorrect = answer.is_correct === true;
                      const isGraded = answer.grade !== null;
                      
                      let answerText = 'Non répondu';
                      if (answer.answer_value !== null) {
                        if (isMultipleChoice && question.options) {
                          const selectedOption = question.options.find(o => o.id === answer.answer_value);
                          answerText = selectedOption ? selectedOption.text : 'Réponse invalide';
                        } else if (typeof answer.answer_value === 'string') {
                          answerText = answer.answer_value.length > 50 
                            ? `${answer.answer_value.substring(0, 50)}...` 
                            : answer.answer_value;
                        } else {
                          answerText = JSON.stringify(answer.answer_value);
                        }
                      }
                      
                      let statusIcon;
                      if (isMultipleChoice) {
                        statusIcon = isCorrect 
                          ? <CorrectIcon color="success" /> 
                          : answer.answer_value !== null 
                            ? <WrongIcon color="error" /> 
                            : <UngradedIcon color="disabled" />;
                      } else {
                        statusIcon = isGraded 
                          ? answer.grade === question.points 
                            ? <CorrectIcon color="success" /> 
                            : answer.grade === 0 
                              ? <WrongIcon color="error" /> 
                              : <CheckIcon color="info" />
                          : <UngradedIcon color="disabled" />;
                      }
                      
                      return (
                        <TableRow key={question.id}>
                          <TableCell>
                            {question.question_number}. {question.question_text.length > 100 
                              ? `${question.question_text.substring(0, 100)}...` 
                              : question.question_text}
                          </TableCell>
                          <TableCell>
                            {question.question_type === 'multiple_choice' ? 'QCM' : 
                             question.question_type === 'short_answer' ? 'Réponse courte' : 
                             question.question_type === 'essay' ? 'Réponse longue' : 
                             question.question_type}
                          </TableCell>
                          <TableCell>{question.points}</TableCell>
                          <TableCell>{answerText}</TableCell>
                          <TableCell>{statusIcon}</TableCell>
                          <TableCell>
                            {isGraded ? `${answer.grade}/${question.points}` : 'En attente'}
                            {answer.feedback && (
                              <Typography variant="caption" display="block" color="text.secondary">
                                {answer.feedback}
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {result.feedback && (
                <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Commentaire général
                  </Typography>
                  <Typography variant="body1">
                    {result.feedback}
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  }
  
  // Rendu par défaut (ne devrait jamais être atteint)
  return (
    <Box sx={{ p: 3 }}>
      <Alert severity="error">
        Une erreur inattendue est survenue. Veuillez réessayer.
      </Alert>
    </Box>
  );
};

export default ExamResultsPage;
