import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  CircularProgress,
  Alert,
  Button,
  TextField,
  Card,
  CardContent,
  IconButton,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  LinearProgress
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as BackIcon,
  Done as DoneIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  Assessment as AssessmentIcon,
  Grading as GradingIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  Send as SendIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../../utils/supabase';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

// Import des composants locaux
import StudentAnswersList from './components/StudentAnswersList';
import GradeQuestionItem from './components/GradeQuestionItem';

// Types
interface Exam {
  id: number;
  title: string;
  course_id: number;
  course_name: string;
  course_code: string;
  professor_id: number;
  date: string;
  duration: number;
  type: string;
  total_points: number;
  passing_grade: number;
}

interface Question {
  id: number;
  exam_id: number;
  question_number: number;
  question_text: string;
  question_type: string;
  options?: Array<{
    id: number;
    text: string;
  }> | null;
  correct_answer?: unknown;
  points: number;
}

interface StudentAnswer {
  id: number;
  student_exam_id: number;
  question_id: number;
  answer_value: unknown;
  is_correct?: boolean | null;
  grade?: number | null;
  feedback?: string | null;
}

interface Student {
  id: number;
  name: string;
  email: string;
  profile_image?: string | null;
}

interface StudentExam {
  id: number;
  student_id: number;
  exam_id: number;
  start_time: string;
  end_time: string;
  status: string;
  graded: boolean;
  cheating_attempts: number;
  has_incidents: boolean;
  score?: number | null;
  max_score?: number | null;
  grade_letter?: string | null;
}

/**
 * Composant principal pour la notation des examens
 */
const ExamGradingPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const examId = id ? parseInt(id) : 0;
  
  // États de base
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedStudentExam, setSelectedStudentExam] = useState<StudentExam | null>(null);
  const [studentAnswers, setStudentAnswers] = useState<StudentAnswer[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [saving, setSaving] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [tabIndex, setTabIndex] = useState<number>(0);
  const [gradingNote, setGradingNote] = useState<string>('');
  const [openFinalizeDialog, setOpenFinalizeDialog] = useState<boolean>(false);

  // Références mémoire pour éviter les recréations de fonctions
  const examDataRef = useRef<{
    examId: number;
    hasLoaded: boolean;
  }>({
    examId: 0,
    hasLoaded: false
  });
  
  // Fonction pour charger les données de l'examen
  const loadExamData = () => {
    const loadData = async () => {
      if (!examId || (examDataRef.current.examId === examId && examDataRef.current.hasLoaded)) {
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        // Récupérer les informations de l'examen
        const { data: examData, error: examError } = await supabase
          .from('exams')
          .select(`
            id,
            title,
            course_id,
            courses:course_id(name, code),
            professor_id,
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
          date: examData.date,
          duration: examData.duration,
          type: examData.type,
          total_points: examData.total_points,
          passing_grade: examData.passing_grade
        };
        
        setExam(transformedExam);
        
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
        
        setQuestions(questionsData);
        
        // Marquer comme chargé
        examDataRef.current = {
          examId,
          hasLoaded: true
        };
      } catch (err) {
        console.error('Erreur lors du chargement des données de l\'examen:', err);
        setError((err as Error).message || 'Une erreur est survenue lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  };

  // Fonction pour charger les réponses d'un étudiant
  const loadStudentAnswers = async (studentId: number, studentExamId: number) => {
    setLoading(true);
    setError(null);
    
    try {
      // Récupérer les informations de l'étudiant
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id, profiles:profile_id(full_name, email, avatar_url)')
        .eq('id', studentId)
        .single();
      
      if (studentError) throw studentError;
      
      if (!studentData) {
        throw new Error('Étudiant non trouvé');
      }
      
      const student: Student = {
        id: studentData.id,
        name: studentData.profiles?.full_name || 'Étudiant inconnu',
        email: studentData.profiles?.email || '',
        profile_image: studentData.profiles?.avatar_url || null
      };
      
      setSelectedStudent(student);
      
      // Récupérer les informations de l'examen de l'étudiant
      const { data: studentExamData, error: studentExamError } = await supabase
        .from('student_exams')
        .select('*')
        .eq('id', studentExamId)
        .single();
      
      if (studentExamError) throw studentExamError;
      
      if (!studentExamData) {
        throw new Error('Données d\'examen non trouvées');
      }
      
      setSelectedStudentExam(studentExamData);
      setGradingNote(studentExamData.feedback || '');
      
      // Récupérer les réponses de l'étudiant
      const { data: answersData, error: answersError } = await supabase
        .from('student_answers')
        .select('*')
        .eq('student_exam_id', studentExamId);
      
      if (answersError) throw answersError;
      
      setStudentAnswers(answersData || []);
      setCurrentQuestionIndex(0);
    } catch (err) {
      console.error('Erreur lors du chargement des réponses de l\'étudiant:', err);
      setError((err as Error).message || 'Une erreur est survenue lors du chargement des réponses');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour gérer le changement de note d'une réponse
  const handleAnswerGraded = (answerId: number, grade: number, feedback: string, isCorrect: boolean) => {
    setStudentAnswers(prev => {
      const newAnswers = [...prev];
      const index = newAnswers.findIndex(a => a.id === answerId);
      
      if (index !== -1) {
        newAnswers[index] = {
          ...newAnswers[index],
          grade,
          feedback,
          is_correct: isCorrect
        };
      }
      
      return newAnswers;
    });
  };

  // Fonction pour vérifier si toutes les réponses sont notées
  const areAllAnswersGraded = () => {
    return studentAnswers.every(answer => answer.grade !== null && answer.grade !== undefined);
  };

  // Calculer le score total
  const calculateTotalScore = () => {
    return studentAnswers.reduce((total, answer) => {
      return total + (answer.grade || 0);
    }, 0);
  };

  // Fonction pour finaliser la notation de l'examen d'un étudiant
  const finalizeGrading = async () => {
    if (!selectedStudentExam || !exam || !selectedStudent) {
      setError('Informations manquantes pour finaliser la notation');
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      // Calculer le score total
      const totalScore = calculateTotalScore();
      const maxScore = exam.total_points;
      const passingScore = exam.passing_grade;
      const isPassed = totalScore >= passingScore;
      
      // Déterminer la lettre de note
      const percentageScore = (totalScore / maxScore) * 100;
      let gradeLetter = '';
      
      if (percentageScore >= 90) gradeLetter = 'A+';
      else if (percentageScore >= 85) gradeLetter = 'A';
      else if (percentageScore >= 80) gradeLetter = 'A-';
      else if (percentageScore >= 75) gradeLetter = 'B+';
      else if (percentageScore >= 70) gradeLetter = 'B';
      else if (percentageScore >= 65) gradeLetter = 'B-';
      else if (percentageScore >= 60) gradeLetter = 'C+';
      else if (percentageScore >= 55) gradeLetter = 'C';
      else if (percentageScore >= 50) gradeLetter = 'C-';
      else if (percentageScore >= 45) gradeLetter = 'D+';
      else if (percentageScore >= 40) gradeLetter = 'D';
      else gradeLetter = 'F';
      
      // Mettre à jour l'examen de l'étudiant
      const { error: updateError } = await supabase
        .from('student_exams')
        .update({
          graded: true,
          score: totalScore,
          max_score: maxScore,
          passing_score: passingScore,
          passed: isPassed,
          grade_letter: gradeLetter,
          feedback: gradingNote
        })
        .eq('id', selectedStudentExam.id);
      
      if (updateError) throw updateError;
      
      // Créer un résultat d'examen
      const { error: resultError } = await supabase
        .from('exam_results')
        .upsert({
          student_exam_id: selectedStudentExam.id,
          student_id: selectedStudent.id,
          exam_id: exam.id,
          score: totalScore,
          max_score: maxScore,
          passing_score: passingScore,
          passed: isPassed,
          grade_letter: gradeLetter,
          has_incidents: selectedStudentExam.has_incidents,
          cheating_attempts: selectedStudentExam.cheating_attempts,
          feedback: gradingNote
        });
      
      if (resultError) throw resultError;
      
      // Mettre à jour l'état local
      setSelectedStudentExam({
        ...selectedStudentExam,
        graded: true,
        score: totalScore,
        max_score: maxScore,
        grade_letter: gradeLetter
      });
      
      setSuccessMessage(`Notation finalisée pour ${selectedStudent.name}`);
    } catch (err) {
      console.error('Erreur lors de la finalisation de la notation:', err);
      setError((err as Error).message || 'Une erreur est survenue lors de la finalisation de la notation');
    } finally {
      setSaving(false);
    }
  };

  // Fonctions de navigation entre questions
  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const goToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
    }
  };

  // Vérifier le progrès de notation
  const getGradingProgress = () => {
    if (studentAnswers.length === 0) return 0;
    
    const gradedAnswers = studentAnswers.filter(answer => answer.grade !== null && answer.grade !== undefined);
    return (gradedAnswers.length / studentAnswers.length) * 100;
  };

  // Charger les données de l'examen au montage du composant
  useEffect(() => {
    if (examId) {
      loadExamData();
    }
  }, [examId]);

  // Réinitialiser les états lors d'un changement d'examen
  useEffect(() => {
    if (examId !== examDataRef.current.examId) {
      setSelectedStudent(null);
      setSelectedStudentExam(null);
      setStudentAnswers([]);
    }
  }, [examId]);

  // Formater une date
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd MMMM yyyy à HH:mm', { locale: fr });
    } catch (error) {
      return dateString;
    }
  };
  
  // Afficher l'indicateur de chargement
  if (loading && !selectedStudent) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Rendu pour les erreurs
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          {error}
          <Button sx={{ ml: 2 }} variant="outlined" onClick={() => navigate('/professor/exams')}>Retour aux examens</Button>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button 
          startIcon={<BackIcon />} 
          variant="outlined" 
          onClick={() => navigate('/professor/exams')}
        >
          Retour aux examens
        </Button>
        
        {selectedStudent && (
          <Button
            variant="contained"
            color="primary"
            disabled={!areAllAnswersGraded() || saving}
            onClick={() => setOpenFinalizeDialog(true)}
            startIcon={<DoneIcon />}
          >
            Finaliser la notation
          </Button>
        )}
      </Box>
      
      {exam && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            {exam.title}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="textSecondary">
                <strong>Cours:</strong> {exam.course_code} - {exam.course_name}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="textSecondary">
                <strong>Date:</strong> {formatDate(exam.date)}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="textSecondary">
                <strong>Durée:</strong> {exam.duration} minutes
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="textSecondary">
                <strong>Type:</strong> {exam.type}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="textSecondary">
                <strong>Points totaux:</strong> {exam.total_points}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="textSecondary">
                <strong>Note de passage:</strong> {exam.passing_grade}%
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Étudiants
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {exam && (
              <StudentAnswersList
                examId={exam.id}
                onStudentSelect={(studentId: number, studentExamId: number) => {
                  // Récupérer les informations de l'étudiant
                  const loadStudentInfo = async () => {
                    try {
                      const { data: studentData, error: studentError } = await supabase
                        .from('students')
                        .select('*')
                        .eq('id', studentId)
                        .single();
                      
                      if (studentError) throw studentError;
                      
                      const { data: studentExamData, error: studentExamError } = await supabase
                        .from('student_exams')
                        .select('*')
                        .eq('id', studentExamId)
                        .single();
                      
                      if (studentExamError) throw studentExamError;
                      
                      setSelectedStudent(studentData);
                      setSelectedStudentExam(studentExamData);
                      
                      loadStudentAnswers(studentId, studentExamId);
                      setCurrentQuestionIndex(0);
                    } catch (err) {
                      console.error('Erreur lors du chargement des informations de l\'étudiant:', err);
                      setError((err as Error).message || 'Erreur lors du chargement des informations de l\'étudiant');
                    }
                  };
                  
                  loadStudentInfo();
                }}
                selectedStudentId={selectedStudent?.id}
              />
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={9}>
          {selectedStudent && selectedStudentExam ? (
            <Paper sx={{ p: 2 }}>
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">
                  <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  {selectedStudent.name}
                  {selectedStudentExam.has_incidents && (
                    <IconButton color="error" size="small" sx={{ ml: 1 }} title="Cet étudiant a des incidents de triche">
                      <AssessmentIcon />
                    </IconButton>
                  )}
                </Typography>
                
                <Box>
                  <Tabs 
                    value={tabIndex} 
                    onChange={(_e, newValue) => setTabIndex(newValue)}
                    aria-label="grading tabs"
                  >
                    <Tab 
                      icon={<GradingIcon />} 
                      label="Questions" 
                      id="tab-0" 
                      aria-controls="tabpanel-0" 
                    />
                    <Tab 
                      icon={<AssessmentIcon />} 
                      label="Résumé" 
                      id="tab-1" 
                      aria-controls="tabpanel-1"
                      disabled={!areAllAnswersGraded()}
                    />
                  </Tabs>
                </Box>
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              {/* Contenu de l'onglet actif */}
              <Box role="tabpanel" hidden={tabIndex !== 0} id="tabpanel-0" aria-labelledby="tab-0">
                {tabIndex === 0 && (
                  <>
                    {/* Progression de notation */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        Progression de la notation: {getGradingProgress()}%
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={getGradingProgress()} 
                        sx={{ height: 8, borderRadius: 5 }}
                      />
                    </Box>
                    
                    {/* Navigation des questions */}
                    <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {questions.map((q, index) => (
                        <Button
                          key={q.id}
                          variant={currentQuestionIndex === index ? "contained" : "outlined"}
                          size="small"
                          onClick={() => goToQuestion(index)}
                          color={
                            studentAnswers.some(a => a.question_id === q.id && a.grade !== null) 
                              ? "success" 
                              : "primary"
                          }
                        >
                          {q.question_number}
                          {studentAnswers.some(a => a.question_id === q.id && a.grade !== null) && (
                            <CheckIcon fontSize="small" sx={{ ml: 0.5, width: 16, height: 16 }} />
                          )}
                        </Button>
                      ))}
                    </Box>
                    
                    {/* Contenu de la question */}
                    {currentQuestionIndex !== null && questions[currentQuestionIndex] && studentAnswers.length > 0 && (
                      <Box>
                        <Card variant="outlined" sx={{ mb: 2 }}>
                          <CardContent>
                            <Typography variant="subtitle1" gutterBottom>
                              <strong>Question {questions[currentQuestionIndex].question_number}</strong> 
                              <Typography component="span" color="textSecondary" sx={{ ml: 1 }}>
                                ({questions[currentQuestionIndex].points} points)
                              </Typography>
                            </Typography>
                            <Typography variant="body1" paragraph>
                              {questions[currentQuestionIndex].question_text}
                            </Typography>
                            
                            {questions[currentQuestionIndex].question_type === 'multiple_choice' && questions[currentQuestionIndex].options && (
                              <Box sx={{ ml: 2 }}>
                                {questions[currentQuestionIndex].options?.map((option) => (
                                  <Typography key={option.id} variant="body2" sx={{ mb: 1 }}>
                                    • {option.text}
                                    {String(questions[currentQuestionIndex].correct_answer) === String(option.id) && (
                                      <Typography component="span" color="success.main" sx={{ ml: 1, fontWeight: 'bold' }}>
                                        (Réponse correcte)
                                      </Typography>
                                    )}
                                  </Typography>
                                ))}
                              </Box>
                            )}
                          </CardContent>
                        </Card>
                        
                        {/* Grille de notation */}
                        <GradeQuestionItem
                          question={questions[currentQuestionIndex]}
                          studentAnswer={studentAnswers.find(a => a.question_id === questions[currentQuestionIndex].id) ?? null}
                          onGraded={handleAnswerGraded}
                        />
                        
                        {/* Boutons de navigation entre questions */}
                        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                          <Button
                            variant="outlined"
                            startIcon={<PrevIcon />}
                            onClick={goToPreviousQuestion}
                            disabled={currentQuestionIndex === 0}
                          >
                            Question précédente
                          </Button>
                          
                          <Button
                            variant="outlined"
                            endIcon={<NextIcon />}
                            onClick={goToNextQuestion}
                            disabled={currentQuestionIndex === questions.length - 1}
                          >
                            Question suivante
                          </Button>
                        </Box>
                      </Box>
                    )}
                    
                    {loading && (
                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                        <CircularProgress />
                      </Box>
                    )}
                  </>
                )}
              </Box>
              
              <Box role="tabpanel" hidden={tabIndex !== 1} id="tabpanel-1" aria-labelledby="tab-1">
                {tabIndex === 1 && areAllAnswersGraded() && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Résumé de la notation
                    </Typography>
                    
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid item xs={12} md={6}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="subtitle1" gutterBottom>
                              Score total
                            </Typography>
                            <Typography variant="h4" color="primary">
                              {calculateTotalScore()} / {exam?.total_points}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {(calculateTotalScore() / (exam?.total_points || 1) * 100).toFixed(2)}%
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="subtitle1" gutterBottom>
                              Statut
                            </Typography>
                            <Typography 
                              variant="h6" 
                              color={
                                (calculateTotalScore() / (exam?.total_points || 1) * 100) >= (exam?.passing_grade || 0)
                                  ? "success.main"
                                  : "error.main"
                              }
                            >
                              {(calculateTotalScore() / (exam?.total_points || 1) * 100) >= (exam?.passing_grade || 0)
                                ? "Réussi"
                                : "Échec"}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Seuil de passage: {exam?.passing_grade}%
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                    
                    <Typography variant="subtitle1" gutterBottom>
                      Note au dossier
                    </Typography>
                    <TextField
                      label="Commentaire pour l'étudiant"
                      multiline
                      rows={4}
                      fullWidth
                      value={gradingNote}
                      onChange={(e) => setGradingNote(e.target.value)}
                      placeholder="Ajouter un commentaire ou une note qui sera visible par l'étudiant..."
                      variant="outlined"
                      sx={{ mb: 3 }}
                    />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => setOpenFinalizeDialog(true)}
                        disabled={saving}
                        startIcon={<DoneIcon />}
                      >
                        Finaliser la notation
                      </Button>
                    </Box>
                  </Box>
                )}
              </Box>
            </Paper>
          ) : (
            <Paper sx={{ p: 3, height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Typography variant="body1" color="textSecondary">
                Sélectionnez un étudiant à gauche pour commencer la notation
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
      
      {/* Snackbar pour les messages de succès */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
        message={successMessage}
        action={
          <IconButton size="small" color="inherit" onClick={() => setSuccessMessage(null)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
      
      {/* Dialog de confirmation pour finaliser la notation */}
      <Dialog
        open={openFinalizeDialog}
        onClose={() => setOpenFinalizeDialog(false)}
        aria-labelledby="finalize-dialog-title"
      >
        <DialogTitle id="finalize-dialog-title">
          Finaliser la notation de l'examen
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            Vous êtes sur le point de finaliser la notation de l'examen pour {selectedStudent?.name}.
          </Typography>
          <Typography variant="body1" paragraph>
            Score final: <strong>{calculateTotalScore()} / {exam?.total_points}</strong> ({(calculateTotalScore() / (exam?.total_points || 1) * 100).toFixed(2)}%)
          </Typography>
          <Typography variant="body1">
            Cette action notifiera l'étudiant et rendra ses résultats disponibles. Êtes-vous sûr de vouloir continuer ?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenFinalizeDialog(false)} color="primary">
            Annuler
          </Button>
          <Button
            onClick={finalizeGrading}
            color="primary"
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : <SendIcon />}
          >
            Finaliser et notifier l'étudiant
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExamGradingPage;
