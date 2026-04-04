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
  LinearProgress,
  List,
  ListItem,
  Chip
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
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

import GradeQuestionItem from './components/GradeQuestionItem';
import { useAuth } from '@/context/AuthContext';
import { createNotification } from '@/api/notifications';
import { supabase } from '@/supabase';
import { normalizeExamQuestion } from '@/utils/examQuestionUtils';

const AUTO_GRADED_TYPES = new Set(['qcm_single', 'qcm_multiple', 'true_false', 'short_answer', 'numeric']);

const normalizeString = (value) => String(value ?? '').trim().toLowerCase();

const normalizeChoiceArray = (values = []) => [...values].map((value) => String(value)).sort();

const computeAutoGrade = (question, answerValue) => {
  if (
    answerValue === null ||
    answerValue === undefined ||
    answerValue === '' ||
    (Array.isArray(answerValue) && answerValue.length === 0)
  ) {
    return null;
  }

  if (question.question_type === 'qcm_single') {
    return normalizeString(answerValue) === normalizeString(question.correct_answer) ? Number(question.points || 0) : 0;
  }

  if (question.question_type === 'qcm_multiple') {
    const expected = normalizeChoiceArray(question.correct_answers || question.correct_answer || []);
    const received = normalizeChoiceArray(Array.isArray(answerValue) ? answerValue : []);
    return expected.length > 0 && expected.length === received.length && expected.every((value, index) => value === received[index])
      ? Number(question.points || 0)
      : 0;
  }

  if (question.question_type === 'true_false' || question.question_type === 'short_answer') {
    return normalizeString(answerValue) === normalizeString(question.correct_answer) ? Number(question.points || 0) : 0;
  }

  if (question.question_type === 'numeric') {
    const expected = Number(question.correct_answer);
    const received = Number(answerValue);
    const tolerance = Number(question.tolerance || 0);

    if (Number.isFinite(expected) && Number.isFinite(received) && Math.abs(expected - received) <= tolerance) {
      return Number(question.points || 0);
    }

    return 0;
  }

  return null;
};

/**
 * @typedef {Object} Exam - Informations sur un examen
 * @property {number} id - ID de l'examen
 * @property {string} title - Titre de l'examen
 * @property {number} course_id - ID du cours
 * @property {string} course_name - Nom du cours
 * @property {string} course_code - Code du cours
 * @property {number} professor_id - ID du professeur
 * @property {string} date - Date de l'examen (format ISO)
 * @property {number} duration - Durée de l'examen en minutes
 * @property {string} type - Type d'examen
 * @property {number} total_points - Total des points
 * @property {number} passing_grade - Note de passage
 */

/**
 * @typedef {Object} Question - Structure d'une question d'examen
 * @property {number} id - ID de la question
 * @property {number} exam_id - ID de l'examen associé
 * @property {number} question_number - Numéro de la question
 * @property {string} question_text - Texte de la question
 * @property {string} question_type - Type de question (QCM, libre, etc.)
 * @property {Array<{id: number, text: string}>} [options] - Options pour les QCM
 * @property {*} [correct_answer] - Réponse correcte
 * @property {number} points - Points attribués à la question
 */

/**
 * @typedef {Object} StudentAnswer - Réponse d'un étudiant à une question
 * @property {number} id - ID de la réponse
 * @property {number} student_exam_id - ID de l'examen de l'étudiant
 * @property {number} question_id - ID de la question
 * @property {*} answer_value - Valeur de la réponse
 * @property {boolean} [is_correct] - Indique si la réponse est correcte
 * @property {number} [grade] - Note attribuée
 * @property {string} [feedback] - Commentaire sur la réponse
 */

/**
 * @typedef {Object} Student - Informations sur un étudiant
 * @property {number} id - ID de l'étudiant
 * @property {string} name - Nom complet de l'étudiant
 * @property {string} email - Email de l'étudiant
 * @property {string} [profile_image] - URL de l'image de profil
 */

/**
 * @typedef {Object} StudentExam - Participation d'un étudiant à un examen
 * @property {number} id - ID de la participation
 * @property {number} student_id - ID de l'étudiant
 * @property {number} exam_id - ID de l'examen
 * @property {string} start_time - Heure de début (format ISO)
 * @property {string} end_time - Heure de fin (format ISO)
 * @property {string} status - Statut de la participation
 * @property {boolean} graded - Indique si l'examen a été noté
 * @property {number} cheating_attempts - Nombre de tentatives de triche
 * @property {boolean} has_incidents - Indique s'il y a eu des incidents
 * @property {number} [score] - Score obtenu
 * @property {number} [max_score] - Score maximum possible
 * @property {string} [grade_letter] - Note en lettre
 */

/**
 * Composant principal pour la notation des examens
 */
const ExamGradingPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { authState } = useAuth();
  const examId = id ? parseInt(id) : 0;
  
  // États de base
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedStudentExam, setSelectedStudentExam] = useState(null);
  const [studentAnswers, setStudentAnswers] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [tabIndex, setTabIndex] = useState(0);
  const [gradingNote, setGradingNote] = useState('');
  const [openFinalizeDialog, setOpenFinalizeDialog] = useState(false);

  // Références mémoire pour éviter les recréations de fonctions
  const examDataRef = useRef({
    examId: 0,
    hasLoaded: false
  });
  
  // Autres états
  const [studentsData, setStudentsData] = useState([]);
  const [studentExams, setStudentExams] = useState([]);
  const [isReviewing, setIsReviewing] = useState(false);
  
  // Gestion des onglets
  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  /**
   * Fonction pour charger les données de l'examen
   */
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
            courses(name, code),
            professor_id,
            professors(profiles(full_name)),
            date,
            duration,
            type,
            room,
            total_points,
            passing_grade,
            status,
            description
          `)
          .eq('id', examId)
          .single();
        
        if (examError) {
          throw examError;
        }
        
        if (!examData) {
          throw new Error('Examen non trouvé');
        }
        
        // Transformer les données de l'examen
        const formattedExam = {
          id: examData.id,
          title: examData.title,
          course_id: examData.course_id,
          course_name: examData.courses?.name || 'Cours inconnu',
          course_code: examData.courses?.code || '',
          professor_id: examData.professor_id,
          date: examData.date,
          duration: examData.duration,
          type: examData.type,
          total_points: examData.total_points,
          passing_grade: examData.passing_grade
        };
        
        setExam(formattedExam);
        
        // Récupérer les questions de l'examen
        const { data: questionsData, error: questionsError } = await supabase
          .from('exam_questions')
          .select('*')
          .eq('exam_id', examId)
          .order('question_number', { ascending: true });
        
        if (questionsError) {
          throw questionsError;
        }
        
        setQuestions((questionsData || []).map((question) => normalizeExamQuestion(question)));
        
        // Récupérer les étudiants inscrits à l'examen
        const { data: studentExamsData, error: studentExamsError } = await supabase
          .from('student_exams')
          .select('*')
          .eq('exam_id', examId);
        
        if (studentExamsError) {
          throw studentExamsError;
        }
        
        setStudentExams(studentExamsData || []);
        
        // Charger la liste des étudiants
        const studentIds = studentExamsData.map(se => se.student_id);
        
        if (studentIds.length > 0) {
          const { data: students, error: studentsError } = await supabase
            .from('students')
            .select('id, profile_id, profiles:profile_id(full_name, email, avatar_url)')
            .in('id', studentIds);
          
          if (studentsError) {
            throw studentsError;
          }
          
          const normalizedStudents = (students || []).map((student) => {
            const profile = Array.isArray(student.profiles) ? student.profiles[0] : student.profiles;
            return {
              id: student.id,
              profile_id: student.profile_id,
              name: profile?.full_name || 'Étudiant inconnu',
              email: profile?.email || '',
              profile_image: profile?.avatar_url || null
            };
          });

          setStudentsData(normalizedStudents);
        }
        
        examDataRef.current = {
          examId,
          hasLoaded: true
        };
      } catch (err) {
        console.error('Erreur lors du chargement des données:', err);
        setError(err.message || 'Une erreur est survenue lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  };
  
  /**
   * Fonction pour charger les réponses d'un étudiant
   * @param {number} studentId - ID de l'étudiant
   * @param {number} studentExamId - ID de la participation à l'examen
   */
  const loadStudentAnswers = async (studentId, studentExamId) => {
    if (!studentId || !studentExamId) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Récupérer les informations de l'étudiant
      const student = studentsData.find(s => s.id === studentId);
      
      if (!student) {
        throw new Error('Étudiant non trouvé');
      }
      
      setSelectedStudent(student);
      
      // Récupérer l'examen de l'étudiant
      const studentExam = studentExams.find(se => se.id === studentExamId);
      
      if (!studentExam) {
        throw new Error('Participation à l\'examen non trouvée');
      }
      
      setSelectedStudentExam(studentExam);
      
      // Récupérer les réponses de l'étudiant
      const rawAnswers = typeof studentExam.answers === 'string'
        ? JSON.parse(studentExam.answers || '{}')
        : (studentExam.answers || {});

      const { data: gradeRows, error: gradesError } = await supabase
        .from('exam_grades')
        .select('id, question_id, points_earned, feedback')
        .eq('student_exam_id', studentExamId);
      
      if (gradesError) {
        throw gradesError;
      }
      
      // Initialiser les réponses manquantes (si l'étudiant n'a pas répondu à toutes les questions)
      const allAnswers = questions.map(question => {
        const normalizedQuestion = normalizeExamQuestion(question);
        const gradeRow = (gradeRows || []).find((row) => row.question_id === question.id);
        const answerValue = rawAnswers?.[question.id] ?? null;
        const autoGrade = !gradeRow && AUTO_GRADED_TYPES.has(normalizedQuestion.question_type)
          ? computeAutoGrade(normalizedQuestion, answerValue)
          : null;
        return {
          id: gradeRow?.id || `temp-${question.id}`,
          student_exam_id: studentExamId,
          question_id: question.id,
          answer_value: answerValue,
          is_correct: typeof gradeRow?.points_earned === 'number'
            ? gradeRow.points_earned >= Number(normalizedQuestion.points || 0)
            : (typeof autoGrade === 'number' ? autoGrade >= Number(normalizedQuestion.points || 0) : null),
          grade: typeof gradeRow?.points_earned === 'number' ? gradeRow.points_earned : autoGrade,
          feedback: gradeRow?.feedback || null,
          grade_record_id: gradeRow?.id || null
        };
      });
      
      setStudentAnswers(allAnswers);
      setCurrentQuestionIndex(0);
      setIsReviewing(true);
    } catch (err) {
      console.error('Erreur lors du chargement des réponses:', err);
      setError(err.message || 'Une erreur est survenue lors du chargement des réponses');
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Fonction pour gérer le changement de note d'une réponse
   * @param {number} answerId - ID de la réponse
   * @param {number} grade - Note attribuée
   * @param {string} feedback - Commentaire
   * @param {boolean} isCorrect - Indique si la réponse est correcte
   */
  const handleAnswerGraded = (questionId, grade, feedback, isCorrect, gradeRecordId) => {
    setStudentAnswers(prev => prev.map(answer => 
      answer.question_id === questionId 
        ? { ...answer, grade, feedback, is_correct: isCorrect, grade_record_id: gradeRecordId || answer.grade_record_id } 
        : answer
    ));
  };
  
  /**
   * Fonction pour vérifier si toutes les réponses sont notées
   */
  const areAllAnswersGraded = () => {
    return studentAnswers.every(answer => answer.grade !== null);
  };
  
  /**
   * Calculer le score total
   */
  const calculateTotalScore = () => {
    if (!studentAnswers.length) {
      return 0;
    }
    
    return studentAnswers.reduce((total, answer) => {
      return total + (answer.grade || 0);
    }, 0);
  };

  const totalScore = calculateTotalScore();
  const totalPoints = exam?.total_points || 0;
  const percentageScore = totalPoints > 0 ? (totalScore / totalPoints) * 100 : 0;
  const isPassing = exam ? totalScore >= (exam.passing_grade || 0) : false;

  /**
   * Fonction pour finaliser la notation de l'examen d'un étudiant
   */
  const finalizeGrading = async () => {
    if (!selectedStudentExam || !selectedStudent || !exam) {
      return;
    }
    
    setSaving(true);
    
    try {
      // Mettre à jour l'examen de l'étudiant
      const { error: updateError } = await supabase
        .from('student_exams')
        .update({
          grade: totalScore,
          status: isPassing ? 'passed' : 'failed',
          comments: gradingNote || null
        })
        .eq('id', selectedStudentExam.id);
      
      if (updateError) {
        throw updateError;
      }
      
      // Insérer une notification pour l'étudiant
      const { error: notificationError } = await createNotification({
        sender_id: authState.profile?.id || null,
        recipient_id: selectedStudent.profile_id,
        recipient_role: 'student',
        title: `Note disponible pour l'examen: ${exam.title}`,
        content: `Votre note pour l'examen "${exam.title}" est maintenant disponible. Vous avez obtenu ${totalScore}/${totalPoints} points (${percentageScore.toFixed(2)}%).`,
        priority: 'medium',
        read: false
      });
      
      if (notificationError) {
        console.error('Erreur lors de la création de la notification:', notificationError);
      }
      
      // Mettre à jour la liste des étudiants
      setStudentExams(prev => prev.map(se => 
        se.id === selectedStudentExam.id
          ? { ...se, grade: totalScore, status: isPassing ? 'passed' : 'failed', comments: gradingNote || null }
          : se
      ));
      
      // Réinitialiser les états de sélection
      setSelectedStudent(null);
      setSelectedStudentExam(null);
      setStudentAnswers([]);
      setCurrentQuestionIndex(0);
      setGradingNote('');
      setOpenFinalizeDialog(false);
      setIsReviewing(false);
      
      setSuccessMessage(`La notation de ${selectedStudent.name} a été finalisée avec succès.`);
    } catch (err) {
      console.error('Erreur lors de la finalisation de la notation:', err);
      setError(err.message || 'Une erreur est survenue lors de la finalisation de la notation');
    } finally {
      setSaving(false);
    }
  };
  
  /**
   * Fonctions de navigation entre questions
   */
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
  
  const goToQuestion = (index) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
    }
  };
  
  /**
   * Vérifier le progrès de notation
   */
  const getGradingProgress = () => {
    if (!studentAnswers.length) {
      return 0;
    }
    
    const gradedCount = studentAnswers.filter(answer => answer.grade !== null).length;
    return (gradedCount / studentAnswers.length) * 100;
  };
  
  /**
   * Gérer le retour à la liste des examens
   */
  const handleBackToList = () => {
    navigate('/professor/exams');
  };
  
  /**
   * Formater une date
   */
  const formatDate = (dateString) => {
    if (!dateString) {
      return 'Non défini';
    }
    
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy HH:mm', { locale: fr });
    } catch (error) {
      return dateString;
    }
  };
  
  // Charger les données au montage du composant
  useEffect(() => {
    loadExamData();
  }, [examId]);
  
  // Si chargement
  if (loading && !isReviewing) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ py: 3, px: 2 }}>
      {/* En-tête */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Button
            variant="outlined"
            startIcon={<BackIcon />}
            onClick={handleBackToList}
            sx={{ mb: 1 }}
          >
            Retour à la liste
          </Button>
          <Typography variant="h4" gutterBottom>
            Notation de l'examen
          </Typography>
          {exam && (
            <Typography variant="h6" color="textSecondary" gutterBottom>
              {exam.title} - {exam.course_name} ({exam.course_code})
            </Typography>
          )}
        </Box>
      </Box>
      
      {/* Bannière d'erreur */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Contenu principal */}
      <Grid container spacing={3}>
        {/* Liste des étudiants */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Étudiants
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {studentExams.length === 0 ? (
              <Typography variant="body2" color="textSecondary">
                Aucun étudiant n'a encore passé cet examen.
              </Typography>
            ) : (
              <List>
                {studentExams.map((studentExam) => {
                  const student = studentsData.find(s => s.id === studentExam.student_id);
                  if (!student) {
                    return null;
                  }
                  
                  return (
                    <ListItem 
                      key={studentExam.id}
                      button
                      selected={selectedStudentExam?.id === studentExam.id}
                      onClick={() => loadStudentAnswers(student.id, studentExam.id)}
                      sx={{
                        borderLeft: studentExam.grade !== null && studentExam.grade !== undefined
                          ? '4px solid green'
                          : '4px solid orange',
                        mb: 1
                      }}
                    >
                      <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                        <Typography variant="subtitle1">
                          {student.name}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" color="textSecondary">
                            {studentExam.status || 'pending'}
                          </Typography>
                          {studentExam.grade !== null && studentExam.grade !== undefined ? (
                            <Chip 
                              size="small"
                              label={`${studentExam.grade}/${exam?.total_points || 0}`}
                              color="success" 
                              variant="outlined" 
                            />
                          ) : (
                            <Chip size="small" label="Non noté" color="warning" variant="outlined" />
                          )}
                        </Box>
                      </Box>
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Paper>
        </Grid>
        
        {/* Zone de notation */}
        <Grid item xs={12} md={9}>
          {selectedStudent && selectedStudentExam && questions.length > 0 && studentAnswers.length > 0 ? (
            <Paper sx={{ p: 3, height: '100%' }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h5" gutterBottom>
                  Notation de l'examen pour {selectedStudent.name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={getGradingProgress()} 
                    sx={{ flex: 1, mr: 2 }} 
                    color={areAllAnswersGraded() ? 'success' : 'primary'}
                  />
                  <Typography variant="body2" color="textSecondary">
                    {Math.round(getGradingProgress())}% ({studentAnswers.filter(a => a.grade !== null).length}/{studentAnswers.length})
                  </Typography>
                </Box>
              </Box>
              
              <Tabs 
                value={tabIndex} 
                onChange={handleTabChange} 
                variant="fullWidth"
              >
                <Tab label="Notation par Question" icon={<GradingIcon />} />
                <Tab label="Résumé" icon={<AssessmentIcon />} />
              </Tabs>
              
              <Box sx={{ mt: 3 }}>
                {tabIndex === 0 && questions.length > 0 && (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Button
                        startIcon={<PrevIcon />}
                        disabled={currentQuestionIndex === 0}
                        onClick={goToPreviousQuestion}
                      >
                        Précédent
                      </Button>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {questions.map((_, index) => (
                          <IconButton
                            key={index}
                            size="small"
                            onClick={() => goToQuestion(index)}
                            color={index === currentQuestionIndex ? 'primary' : 'default'}
                            sx={{
                              backgroundColor: studentAnswers[index]?.grade !== null 
                                ? 'rgba(76, 175, 80, 0.1)' 
                                : 'transparent',
                              width: 30,
                              height: 30,
                              m: 0.5
                            }}
                          >
                            {index + 1}
                          </IconButton>
                        ))}
                      </Box>
                      
                      <Button
                        endIcon={<NextIcon />}
                        disabled={currentQuestionIndex === questions.length - 1}
                        onClick={goToNextQuestion}
                      >
                        Suivant
                      </Button>
                    </Box>
                    
                    {questions[currentQuestionIndex] && studentAnswers[currentQuestionIndex] && (
                      <GradeQuestionItem
                        question={questions[currentQuestionIndex]}
                        studentAnswer={studentAnswers[currentQuestionIndex]}
                        gradedBy={authState.professor?.id}
                        onGraded={handleAnswerGraded}
                      />
                    )}
                  </Box>
                )}
                
                {tabIndex === 1 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Résumé des réponses
                    </Typography>
                    
                    <List>
                      {questions.map((question, index) => {
                        const answer = studentAnswers.find((item) => item.question_id === question.id);
                        return (
                          <ListItem
                            key={question.id}
                            secondaryAction={
                              <Button size="small" onClick={() => {
                                setTabIndex(0);
                                goToQuestion(index);
                              }}>
                                Voir
                              </Button>
                            }
                          >
                            <Box sx={{ width: '100%' }}>
                              <Typography variant="subtitle2">
                                Q{question.question_number}. {question.question_text}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                Note: {answer?.grade ?? 'Non notée'} / {question.points}
                              </Typography>
                            </Box>
                          </ListItem>
                        );
                      })}
                    </List>
                    
                    <Divider sx={{ my: 3 }} />
                    
                    <Typography variant="h6" gutterBottom>
                      Résultat final
                    </Typography>
                    
                    <Grid container spacing={3} sx={{ mb: 3 }}>
                      <Grid item xs={12} sm={6} md={4}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="h5" color={isPassing ? 'success.main' : 'error.main'}>
                              {totalScore} / {exam?.total_points}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Score total
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={4}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="h5" color={isPassing ? 'success.main' : 'error.main'}>
                              {percentageScore.toFixed(2)}%
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Pourcentage
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={4}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="h5" color={isPassing ? 'success.main' : 'error.main'}>
                              {isPassing ? 'Réussi' : 'Échec'}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Seuil de passage: {exam?.passing_grade} / {exam?.total_points}
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
                        disabled={saving || !areAllAnswersGraded()}
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
            Score final: <strong>{totalScore} / {exam?.total_points}</strong> ({percentageScore.toFixed(2)}%)
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
