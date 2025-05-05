import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Alert,
  Snackbar,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Cancel as CancelIcon,
  Check as CheckIcon,
  Preview as PreviewIcon,
  Publish as PublishIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
// Import unique Supabase – toute référence doit passer par '@/services/supabase'
import { supabase } from '@/services/supabase';

// Composants du formulaire
import ExamBasicInfo from '../components/ExamBasicInfo';
import ExamScheduling from '../components/ExamScheduling';
import ExamQuestions from '../components/ExamQuestions';
import ExamStudents from '../components/ExamStudents';

// Étapes du formulaire
const steps = [
  'Informations générales',
  'Planification',
  'Questions',
  'Étudiants',
  'Finalisation'
];

/**
 * Composant pour la création et l'édition d'un examen
 * Intègre les différentes étapes du processus
 * @returns {JSX.Element} Composant de formulaire d'examen
 */
const ExamFormPage = () => {
  const { authState } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  
  // Étape actuelle
  const [activeStep, setActiveStep] = useState(0);
  
  // Données de l'examen
  const [exam, setExam] = useState({
    title: '',
    description: '',
    course_id: null,
    professor_id: null,
    exam_session_id: null,
    exam_center_id: null,
    date: new Date().toISOString(),
    duration: 120, // 2 heures par défaut
    type: '',
    room: '',
    total_points: 20,
    passing_grade: 10,
    status: 'draft'
  });
  
  // Données pour les relations
  const [courses, setCourses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [centers, setCenters] = useState([]);
  
  // Questions et étudiants
  const [questions, setQuestions] = useState([]);
  const [assignedStudents, setAssignedStudents] = useState([]);
  
  // États pour les chargements et les erreurs
  const [loading, setLoading] = useState(false);
  const [loadingExam, setLoadingExam] = useState(isEditing);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  
  // État pour les dialogues
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  
  // Référence aux fonctions fetchData pour éviter les recréations
  const fetchDataRef = useRef(async () => {
    try {
      // Récupérer les cours
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('id, name, code')
        .order('name');
      
      if (coursesError) {
        throw coursesError;
      }
      
      setCourses(coursesData);
      
      // Récupérer les sessions d'examen
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('exam_sessions')
        .select('id, name, academic_year, semester')
        .order('academic_year', { ascending: false })
        .order('semester', { ascending: false });
      
      if (sessionsError) {
        throw sessionsError;
      }
      
      setSessions(sessionsData);
      
      // Récupérer les centres d'examen
      const { data: centersData, error: centersError } = await supabase
        .from('exam_centers')
        .select('id, name, location')
        .order('name');
      
      if (centersError) {
        throw centersError;
      }
      
      setCenters(centersData);
      
      // Si on est en mode édition, récupérer l'ID du professeur
      if (!isEditing && authState?.user?.id) {
        setExam(prev => ({
          ...prev,
          professor_id: authState.user.id
        }));
      }
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError(err.message || 'Une erreur est survenue lors du chargement des données');
    }
  });
  
  // Charger les données au chargement de la page
  useEffect(() => {
    fetchDataRef.current();
    
    // Si on est en mode édition, charger les données de l'examen
    if (isEditing && id) {
      fetchExamData(parseInt(id));
    }
  }, [isEditing, id, authState?.user?.id]);
  
  // Fermer les alertes après 6 secondes
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 6000);
      
      return () => clearTimeout(timer);
    }
  }, [successMessage]);
  
  /**
   * Fonction pour charger les données d'un examen existant
   * @param {number} examId - ID de l'examen à charger
   */
  const fetchExamData = async (examId) => {
    setLoadingExam(true);
    setError(null);
    
    try {
      // Récupérer les données de l'examen
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single();
      
      if (examError) {
        throw examError;
      }
      
      setExam(examData);
      
      // Récupérer les questions de l'examen
      const { data: questionsData, error: questionsError } = await supabase
        .from('exam_questions')
        .select('*')
        .eq('exam_id', examId)
        .order('question_number');
      
      if (questionsError) {
        throw questionsError;
      }
      
      setQuestions(questionsData);
      
      // Récupérer les étudiants assignés à l'examen
      const { data: studentsData, error: studentsError } = await supabase
        .from('exam_students')
        .select(`
          id,
          exam_id,
          student_id,
          seat_number,
          attendance_status,
          attempt_status,
          has_incidents,
          notes,
          users!exam_students_student_id_fkey(id, full_name, email, student_id)
        `)
        .eq('exam_id', examId);
      
      if (studentsError) {
        throw studentsError;
      }
      
      setAssignedStudents(studentsData);
      
    } catch (err) {
      console.error('Erreur lors du chargement de l\'examen:', err);
      setError(err.message || 'Une erreur est survenue lors du chargement de l\'examen');
    } finally {
      setLoadingExam(false);
    }
  };
  
  /**
   * Setter pour la date (conversion entre Date et string ISO)
   * @param {Date|null} date - Date à définir
   */
  const setExamDate = (date) => {
    if (date) {
      setExam(prev => ({
        ...prev,
        date: date.toISOString()
      }));
    }
  };
  
  /**
   * Valider l'étape actuelle
   * @param {number} step - Étape à valider
   * @returns {boolean} Validité de l'étape
   */
  const validateStep = (step) => {
    const errors = {};
    let isValid = true;
    
    switch (step) {
      case 0: // Informations générales
        errors.basicInfo = {};
        
        if (!exam.title || exam.title.trim() === '') {
          errors.basicInfo.title = 'Le titre est obligatoire';
          isValid = false;
        }
        
        if (!exam.course_id) {
          errors.basicInfo.course_id = 'Veuillez sélectionner un cours';
          isValid = false;
        }
        
        if (!exam.type) {
          errors.basicInfo.type = 'Veuillez sélectionner un type d\'examen';
          isValid = false;
        }
        
        if (exam.total_points <= 0) {
          errors.basicInfo.total_points = 'Le nombre de points doit être supérieur à 0';
          isValid = false;
        }
        
        if (exam.passing_grade <= 0 || exam.passing_grade > exam.total_points) {
          errors.basicInfo.passing_grade = 'La note de passage doit être entre 1 et le nombre total de points';
          isValid = false;
        }
        break;
        
      case 1: // Planification
        errors.scheduling = {};
        
        if (!exam.date) {
          errors.scheduling.date = 'La date est obligatoire';
          isValid = false;
        }
        
        if (exam.duration <= 0) {
          errors.scheduling.duration = 'La durée doit être supérieure à 0';
          isValid = false;
        }
        
        if (!exam.exam_session_id) {
          errors.scheduling.exam_session_id = 'Veuillez sélectionner une session d\'examen';
          isValid = false;
        }
        
        if (!exam.exam_center_id) {
          errors.scheduling.exam_center_id = 'Veuillez sélectionner un centre d\'examen';
          isValid = false;
        }
        break;
        
      case 2: // Questions
        errors.questions = {};
        
        if (questions.length === 0) {
          errors.questions.general = 'Veuillez ajouter au moins une question';
          isValid = false;
        }
        
        // Vérifier que toutes les questions ont un texte et des réponses valides
        questions.forEach((question, index) => {
          if (!question.question_text || question.question_text.trim() === '') {
            errors.questions[`question_${index}`] = 'Le texte de la question est obligatoire';
            isValid = false;
          }
          
          if (question.question_type === 'multiple_choice' && (!question.options || question.options.length < 2)) {
            errors.questions[`options_${index}`] = 'Une question à choix multiple doit avoir au moins 2 options';
            isValid = false;
          }
        });
        break;
        
      case 3: // Étudiants
        // Aucune validation requise, il est possible de ne pas avoir d'étudiants assignés
        break;
        
      case 4: // Finalisation
        // Vérifier que toutes les étapes précédentes sont valides
        if (!validateStep(0) || !validateStep(1) || !validateStep(2)) {
          isValid = false;
        }
        break;
        
      default:
        break;
    }
    
    setValidationErrors(prev => ({ ...prev, ...errors }));
    return isValid;
  };
  
  /**
   * Passer à l'étape suivante
   */
  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prevActiveStep => prevActiveStep + 1);
    }
  };
  
  /**
   * Revenir à l'étape précédente
   */
  const handleBack = () => {
    setActiveStep(prevActiveStep => prevActiveStep - 1);
  };
  
  /**
   * Sauvegarder l'examen
   * @param {boolean} publish - Indique si l'examen doit être publié
   */
  const handleSaveExam = async (publish = false) => {
    // Valider toutes les étapes
    if (!validateStep(0) || !validateStep(1) || !validateStep(2)) {
      setActiveStep(0); // Revenir à la première étape avec des erreurs
      setError('Veuillez corriger les erreurs avant de sauvegarder l\'examen');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const now = new Date().toISOString();
      const examData = {
        ...exam,
        status: publish ? 'published' : 'draft',
        updated_at: now
      };
      
      let examId;
      
      if (isEditing) {
        // Mettre à jour l'examen existant
        const { data: updatedExam, error: updateError } = await supabase
          .from('exams')
          .update(examData)
          .eq('id', exam.id)
          .select()
          .single();
        
        if (updateError) {
          throw updateError;
        }
        
        examId = updatedExam.id;
        setSuccessMessage('Examen mis à jour avec succès');
      } else {
        // Créer un nouvel examen
        const { data: newExam, error: insertError } = await supabase
          .from('exams')
          .insert({
            ...examData,
            created_at: now
          })
          .select()
          .single();
        
        if (insertError) {
          throw insertError;
        }
        
        examId = newExam.id;
        setSuccessMessage('Examen créé avec succès');
      }
      
      // Mettre à jour les questions
      if (questions.length > 0) {
        // Supprimer les questions existantes si on est en mode édition
        if (isEditing) {
          const { error: deleteError } = await supabase
            .from('exam_questions')
            .delete()
            .eq('exam_id', examId);
          
          if (deleteError) {
            throw deleteError;
          }
        }
        
        // Ajouter les nouvelles questions
        const questionsToInsert = questions.map(question => ({
          ...question,
          id: undefined, // Laisser la base de données générer un nouvel ID
          exam_id: examId,
          created_at: now,
          updated_at: now
        }));
        
        const { error: questionsError } = await supabase
          .from('exam_questions')
          .insert(questionsToInsert);
        
        if (questionsError) {
          throw questionsError;
        }
      }
      
      // Mettre à jour les étudiants assignés
      if (assignedStudents.length > 0) {
        // Supprimer les assignations existantes si on est en mode édition
        if (isEditing) {
          const { error: deleteError } = await supabase
            .from('exam_students')
            .delete()
            .eq('exam_id', examId);
          
          if (deleteError) {
            throw deleteError;
          }
        }
        
        // Ajouter les nouvelles assignations
        const studentsToInsert = assignedStudents.map(student => ({
          ...student,
          id: undefined, // Laisser la base de données générer un nouvel ID
          exam_id: examId
        }));
        
        const { error: studentsError } = await supabase
          .from('exam_students')
          .insert(studentsToInsert);
        
        if (studentsError) {
          throw studentsError;
        }
      }
      
      // Rediriger vers la liste des examens après un court délai
      setTimeout(() => {
        navigate('/exams');
      }, 2000);
      
    } catch (err) {
      console.error('Erreur lors de la sauvegarde de l\'examen:', err);
      setError(err.message || 'Une erreur est survenue lors de la sauvegarde de l\'examen');
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Gérer le clic sur le bouton Publier
   */
  const handlePublishClick = () => {
    if (validateStep(4)) {
      setPublishDialogOpen(true);
    } else {
      setError('Veuillez corriger les erreurs avant de publier l\'examen');
    }
  };
  
  /**
   * Gérer la confirmation de publication
   */
  const handlePublishConfirm = () => {
    setPublishDialogOpen(false);
    handleSaveExam(true);
  };
  
  /**
   * Annuler et retourner à la liste des examens
   */
  const handleCancelClick = () => {
    setCancelDialogOpen(true);
  };
  
  /**
   * Confirmer l'annulation
   */
  const handleCancelConfirm = () => {
    setCancelDialogOpen(false);
    navigate('/exams');
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {isEditing ? 'Modifier l\'examen' : 'Créer un nouvel examen'}
      </Typography>
      
      {/* Messages de succès et d'erreur */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccessMessage(null)} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {/* Afficher un indicateur de chargement si on est en train de charger un examen existant */}
      {loadingExam ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ p: 3 }}>
          {/* Stepper pour les étapes du formulaire */}
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          <Divider sx={{ mb: 4 }} />
          
          {/* Contenu de l'étape actuelle */}
          <Box sx={{ minHeight: '400px' }}>
            {activeStep === 0 && (
              <ExamBasicInfo
                exam={exam}
                setExam={setExam}
                courses={courses}
                errors={validationErrors.basicInfo || {}}
              />
            )}
            
            {activeStep === 1 && (
              <ExamScheduling
                exam={exam}
                setExam={setExam}
                setExamDate={setExamDate}
                sessions={sessions}
                centers={centers}
                errors={validationErrors.scheduling || {}}
              />
            )}
            
            {activeStep === 2 && (
              <ExamQuestions
                questions={questions}
                setQuestions={setQuestions}
                totalPoints={exam.total_points}
                errors={validationErrors.questions || {}}
              />
            )}
            
            {activeStep === 3 && (
              <ExamStudents
                examId={exam.id}
                courseId={exam.course_id}
                assignedStudents={assignedStudents}
                setAssignedStudents={setAssignedStudents}
              />
            )}
            
            {activeStep === 4 && (
              <Box>
                <Typography variant="h5" gutterBottom>
                  Résumé de l'examen
                </Typography>
                
                <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Informations générales
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body1" gutterBottom>
                      <strong>Titre:</strong> {exam.title}
                    </Typography>
                    
                    <Typography variant="body1" gutterBottom>
                      <strong>Cours:</strong> {courses.find(c => c.id === exam.course_id)?.name || 'Non défini'}
                    </Typography>
                    
                    <Typography variant="body1" gutterBottom>
                      <strong>Type:</strong> {exam.type}
                    </Typography>
                    
                    <Typography variant="body1" gutterBottom>
                      <strong>Points totaux:</strong> {exam.total_points}
                    </Typography>
                    
                    <Typography variant="body1">
                      <strong>Note de passage:</strong> {exam.passing_grade}
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="subtitle1" gutterBottom>
                    Planification
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body1" gutterBottom>
                      <strong>Date:</strong> {new Date(exam.date).toLocaleString('fr-FR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Typography>
                    
                    <Typography variant="body1" gutterBottom>
                      <strong>Durée:</strong> {exam.duration} minutes
                    </Typography>
                    
                    <Typography variant="body1" gutterBottom>
                      <strong>Session:</strong> {sessions.find(s => s.id === exam.exam_session_id)?.name || 'Non définie'}
                    </Typography>
                    
                    <Typography variant="body1" gutterBottom>
                      <strong>Centre:</strong> {centers.find(c => c.id === exam.exam_center_id)?.name || 'Non défini'}
                    </Typography>
                    
                    <Typography variant="body1">
                      <strong>Salle:</strong> {exam.room || 'Non définie'}
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="subtitle1" gutterBottom>
                    Questions et étudiants
                  </Typography>
                  
                  <Box>
                    <Typography variant="body1" gutterBottom>
                      <strong>Nombre de questions:</strong> {questions.length}
                    </Typography>
                    
                    <Typography variant="body1">
                      <strong>Étudiants assignés:</strong> {assignedStudents.length}
                    </Typography>
                  </Box>
                </Paper>
                
                <Alert severity="info" sx={{ mb: 3 }}>
                  Veuillez vérifier que toutes les informations sont correctes avant de sauvegarder ou de publier l'examen.
                </Alert>
              </Box>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              variant="outlined"
              onClick={handleCancelClick}
              startIcon={<CancelIcon />}
            >
              Annuler
            </Button>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              {activeStep > 0 && (
                <Button
                  variant="outlined"
                  onClick={handleBack}
                  startIcon={<ArrowBackIcon />}
                >
                  Précédent
                </Button>
              )}
              
              {activeStep < steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  endIcon={<ArrowForwardIcon />}
                >
                  Suivant
                </Button>
              ) : (
                <>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => handleSaveExam(false)}
                    startIcon={<SaveIcon />}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Enregistrer comme brouillon'}
                  </Button>
                  
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handlePublishClick}
                    startIcon={<PublishIcon />}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Publier l\'examen'}
                  </Button>
                </>
              )}
            </Box>
          </Box>
        </Paper>
      )}
      
      {/* Dialogue de confirmation pour annuler */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
      >
        <DialogTitle>Confirmer l'annulation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir annuler ? Toutes les modifications non enregistrées seront perdues.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>Non, continuer l'édition</Button>
          <Button onClick={handleCancelConfirm} color="error" variant="contained" autoFocus>
            Oui, annuler
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialogue de confirmation pour publier */}
      <Dialog
        open={publishDialogOpen}
        onClose={() => setPublishDialogOpen(false)}
      >
        <DialogTitle>Confirmer la publication</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir publier cet examen ? Une fois publié, l'examen sera visible par les étudiants assignés.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPublishDialogOpen(false)}>Annuler</Button>
          <Button onClick={handlePublishConfirm} color="primary" variant="contained" autoFocus>
            Publier
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExamFormPage;
