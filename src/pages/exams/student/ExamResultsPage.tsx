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
  BarChart as StatisticsIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { supabase } from '../../../utils/supabase';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

// Types
interface ExamResult {
  id: number;
  student_exam_id: number;
  student_id: number;
  exam_id: number;
  score: number;
  max_score: number;
  passing_score: number;
  passed: boolean;
  grade_letter?: string | null;
  has_incidents: boolean;
  cheating_attempts: number;
  feedback?: string | null;
  created_at: string;
}

interface Exam {
  id: number;
  title: string;
  course_id: number;
  course_name: string;
  course_code: string;
  professor_id: number;
  professor_name: string;
  date: string;
  duration: number;
  type: string;
  total_points: number;
  passing_grade: number;
}

interface Question {
  id: number;
  question_number: number;
  question_text: string;
  question_type: string;
  options?: Array<{
    id: number;
    text: string;
  }> | null;
  correct_answer?: any;
  points: number;
}

interface StudentAnswer {
  id: number;
  student_exam_id: number;
  question_id: number;
  answer_value: any;
  is_correct?: boolean | null;
  grade?: number | null;
  feedback?: string | null;
}

interface AnswerDetail {
  question: Question;
  answer: StudentAnswer;
}

/**
 * Composant pour afficher les résultats d'un examen pour un étudiant
 */
const ExamResultsPage: React.FC = () => {
  const { authState } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const examId = id ? parseInt(id) : 0;
  
  // États
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [answers, setAnswers] = useState<AnswerDetail[]>([]);
  const [classAverage, setClassAverage] = useState<number | null>(null);
  const [classHighest, setClassHighest] = useState<number | null>(null);
  const [classLowest, setClassLowest] = useState<number | null>(null);
  
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
      
      const transformedExam: Exam = {
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
      
      // Récupérer le résultat de l'examen pour cet étudiant
      const { data: resultData, error: resultError } = await supabase
        .from('exam_results')
        .select('*')
        .eq('exam_id', examId)
        .eq('student_id', studentId)
        .single();
      
      if (resultError) throw resultError;
      
      if (!resultData) {
        throw new Error('Résultat non trouvé pour cet examen');
      }
      
      setResult(resultData);
      
      // Récupérer les statistiques de la classe
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_exam_statistics', { exam_id: examId });
      
      if (!statsError && statsData) {
        setClassAverage(statsData.average);
        setClassHighest(statsData.highest);
        setClassLowest(statsData.lowest);
      }
      
      // Récupérer les questions de l'examen
      const { data: questionsData, error: questionsError } = await supabase
        .from('exam_questions')
        .select('*')
        .eq('exam_id', examId)
        .order('question_number');
      
      if (questionsError) throw questionsError;
      
      if (!questionsData || questionsData.length === 0) {
        throw new Error('Aucune question trouvée pour cet examen');
      }
      
      // Récupérer les réponses de l'étudiant
      const { data: studentExamData, error: studentExamError } = await supabase
        .from('student_exams')
        .select('id')
        .eq('exam_id', examId)
        .eq('student_id', studentId)
        .single();
      
      if (studentExamError) throw studentExamError;
      
      if (!studentExamData) {
        throw new Error('Données d\'examen non trouvées');
      }
      
      const { data: answersData, error: answersError } = await supabase
        .from('student_answers')
        .select('*')
        .eq('student_exam_id', studentExamData.id);
      
      if (answersError) throw answersError;
      
      // Combiner les questions et les réponses
      const answerDetails: AnswerDetail[] = [];
      
      for (const question of questionsData) {
        const answer = answersData?.find(a => a.question_id === question.id) || {
          id: 0,
          student_exam_id: studentExamData.id,
          question_id: question.id,
          answer_value: null
        };
        
        answerDetails.push({
          question,
          answer
        });
      }
      
      setAnswers(answerDetails);
      
    } catch (err) {
      console.error('Erreur lors du chargement des résultats:', err);
      setError((err as Error).message || 'Une erreur est survenue lors du chargement des résultats');
    } finally {
      setLoading(false);
    }
  });
  
  // Charger les données au montage du composant
  useEffect(() => {
    fetchDataRef.current();
  }, []);
  
  // Formater une date
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd MMMM yyyy HH:mm', { locale: fr });
    } catch (error) {
      return 'Date invalide';
    }
  };
  
  // Calculer le pourcentage
  const calculatePercentage = (value: number, total: number) => {
    return Math.round((value / total) * 100);
  };
  
  // Obtenir la classe CSS selon le score
  const getScoreClass = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    
    if (percentage >= 80) return 'success.main';
    if (percentage >= 60) return 'info.main';
    if (percentage >= 40) return 'warning.main';
    return 'error.main';
  };
  
  // Obtenir la lettre de notation
  const getGradeLetter = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    
    if (percentage >= 90) return 'A+';
    if (percentage >= 85) return 'A';
    if (percentage >= 80) return 'A-';
    if (percentage >= 75) return 'B+';
    if (percentage >= 70) return 'B';
    if (percentage >= 65) return 'B-';
    if (percentage >= 60) return 'C+';
    if (percentage >= 55) return 'C';
    if (percentage >= 50) return 'C-';
    if (percentage >= 45) return 'D+';
    if (percentage >= 40) return 'D';
    return 'F';
  };
  
  // Rendu pour l'écran de chargement
  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <CircularProgress size={60} sx={{ mb: 3 }} />
        <Typography variant="h6">Chargement des résultats...</Typography>
      </Box>
    );
  }
  
  // Rendu pour les erreurs
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => navigate('/student/exams')}>
          Retour à la liste des examens
        </Button>
      </Box>
    );
  }
  
  // Rendu lorsque les données sont chargées
  if (result && exam) {
    const passedExam = result.passed;
    const scorePercentage = calculatePercentage(result.score, result.max_score);
    const gradeLetter = result.grade_letter || getGradeLetter(result.score, result.max_score);
    
    return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4">Résultats d'examen</Typography>
          <Button
            variant="outlined"
            onClick={() => navigate('/student/exams')}
          >
            Retour aux examens
          </Button>
        </Box>
        
        <Grid container spacing={3}>
          {/* Informations générales */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h5" gutterBottom>
                {exam.title}
              </Typography>
              
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body1">
                    <strong>Cours:</strong> {exam.course_name} ({exam.course_code})
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body1">
                    <strong>Professeur:</strong> {exam.professor_name}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body1">
                    <strong>Date:</strong> {formatDate(exam.date)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body1">
                    <strong>Durée:</strong> {exam.duration} minutes
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body1">
                    <strong>Type:</strong> {exam.type === 'midterm' ? 'Examen partiel' : exam.type === 'final' ? 'Examen final' : exam.type}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body1">
                    <strong>Date de soumission:</strong> {formatDate(result.created_at)}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          
          {/* Score */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, mb: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <Typography variant="h3" sx={{ color: passedExam ? 'success.main' : 'error.main', mb: 1 }}>
                {gradeLetter}
              </Typography>
              
              <Typography variant="h5" sx={{ color: getScoreClass(result.score, result.max_score), mb: 2 }}>
                {result.score}/{result.max_score} points
              </Typography>
              
              <Typography variant="h6">
                {scorePercentage}%
              </Typography>
              
              <Chip 
                label={passedExam ? 'Réussi' : 'Échoué'} 
                color={passedExam ? 'success' : 'error'} 
                sx={{ mt: 2 }}
              />
              
              {result.has_incidents && (
                <Chip
                  icon={<WarningIcon />}
                  label={`${result.cheating_attempts} tentative${result.cheating_attempts > 1 ? 's' : ''} de triche`}
                  color="warning"
                  sx={{ mt: 1 }}
                />
              )}
            </Paper>
          </Grid>
          
          {/* Statistiques */}
          {(classAverage !== null || classHighest !== null || classLowest !== null) && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  <StatisticsIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Statistiques de la classe
                </Typography>
                
                <Grid container spacing={3} sx={{ mt: 1 }}>
                  {classAverage !== null && (
                    <Grid item xs={12} sm={4}>
                      <Card variant="outlined">
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" color="text.secondary" gutterBottom>
                            Moyenne de la classe
                          </Typography>
                          <Typography variant="h4">
                            {classAverage.toFixed(1)}/{exam.total_points}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            ({calculatePercentage(classAverage, exam.total_points)}%)
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}
                  
                  {classHighest !== null && (
                    <Grid item xs={12} sm={4}>
                      <Card variant="outlined">
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" color="text.secondary" gutterBottom>
                            Note la plus élevée
                          </Typography>
                          <Typography variant="h4" color="success.main">
                            {classHighest.toFixed(1)}/{exam.total_points}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            ({calculatePercentage(classHighest, exam.total_points)}%)
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}
                  
                  {classLowest !== null && (
                    <Grid item xs={12} sm={4}>
                      <Card variant="outlined">
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" color="text.secondary" gutterBottom>
                            Note la plus basse
                          </Typography>
                          <Typography variant="h4" color="error.main">
                            {classLowest.toFixed(1)}/{exam.total_points}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            ({calculatePercentage(classLowest, exam.total_points)}%)
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            </Grid>
          )}
          
          {/* Détail des réponses */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                <AssignmentIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
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
                    {answers.map((item) => {
                      const question = item.question;
                      const answer = item.answer;
                      const isMultipleChoice = question.question_type === 'multiple_choice';
                      const isCorrect = answer.is_correct;
                      const isGraded = answer.grade !== undefined && answer.grade !== null;
                      
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
