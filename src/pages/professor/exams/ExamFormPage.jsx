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

// Correction du chemin d'importation de Supabase
import { supabase } from '@/supabase';

// Composants du formulaire
import ExamBasicInfo from './components/ExamBasicInfo';
import ExamScheduling from './components/ExamScheduling';
import ExamQuestions from './components/ExamQuestions';
import ExamStudents from './components/ExamStudents';

/**
 * @typedef {Object} Exam - Structure d'un examen
 * @property {number} [id] - ID de l'examen (optionnel)
 * @property {string} title - Titre de l'examen
 * @property {string|null} description - Description de l'examen
 * @property {number|null} course_id - ID du cours associé
 * @property {number|null} professor_id - ID du professeur
 * @property {number|null} exam_session_id - ID de la session d'examen
 * @property {number|null} exam_center_id - ID du centre d'examen
 * @property {string} date - Date de l'examen (format ISO)
 * @property {number} duration - Durée en minutes
 * @property {string} type - Type d'examen
 * @property {string|null} room - Salle d'examen
 * @property {number} total_points - Total des points
 * @property {number} passing_grade - Note de passage
 * @property {string} status - Statut de l'examen ('draft', 'published', 'in_progress', 'grading', 'completed', 'cancelled')
 * @property {string} [created_at] - Date de création (optionnel)
 * @property {string} [updated_at] - Date de mise à jour (optionnel)
 */

/**
 * @typedef {Object} StudentExam - Assignation d'un étudiant à un examen
 * @property {number} [id] - ID de l'assignation (optionnel)
 * @property {number} exam_id - ID de l'examen
 * @property {number} student_id - ID de l'étudiant
 * @property {string|null} [seat_number] - Numéro de place (optionnel)
 * @property {string|null} [attendance_status] - Statut de présence ('present', 'absent', 'late', null)
 * @property {string|null} [attempt_status] - Statut de tentative ('not_started', 'in_progress', 'submitted', null)
 * @property {boolean} [has_incidents] - Indique s'il y a eu des incidents
 * @property {string|null} [notes] - Notes éventuelles
 */

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
      // Récupérer la liste des cours
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('id, name, code')
        .order('name');
      
      if (coursesError) {
        throw coursesError;
      }
      
      setCourses(coursesData || []);
      
      // Récupérer les sessions d'examen
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('exam_sessions')
        .select('*')
        .order('academic_year', { ascending: false })
        .order('semester', { ascending: true });
      
      if (sessionsError) {
        throw sessionsError;
      }
      
      setSessions(sessionsData || []);
      
      // Récupérer les centres d'examen
      const { data: centersData, error: centersError } = await supabase
        .from('exam_centers')
        .select('*')
        .order('name', { ascending: true });
      
      if (centersError) {
        throw centersError;
      }
      
      setCenters(centersData || []);
      
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError(err.message || 'Une erreur est survenue lors du chargement des données');
    }
  });
  
  // Charger les données au montage
  useEffect(() => {
    fetchDataRef.current();
    
    // Si en mode édition, charger les données de l'examen
    if (isEditing && id) {
      fetchExamData(Number(id));
    }
  }, [isEditing, id]);
  
  // Mettre à jour l'ID du professeur lorsque les informations de l'utilisateur sont chargées
  useEffect(() => {
    if (authState && authState.professor && authState.professor.id) {
      setExam(prev => ({
        ...prev,
        professor_id: authState.professor.id
      }));
    }
  }, [authState]);
  
  /**
   * Mise à jour des données de l'examen
   */
  const handleExamChange = (field, value) => {
    setExam(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Supprimer les erreurs de validation pour ce champ
    if (validationErrors[activeStep] && validationErrors[activeStep][field]) {
      const newErrors = { ...validationErrors };
      delete newErrors[activeStep][field];
      setValidationErrors(newErrors);
    }
  };
  
  /**
   * Mise à jour des questions
   */
  const handleQuestionsChange = (updatedQuestions) => {
    setQuestions(updatedQuestions);
    
    // Mettre à jour les points totaux
    const totalPoints = updatedQuestions.reduce((sum, q) => sum + q.points, 0);
    setExam(prev => ({
      ...prev,
      total_points: totalPoints
    }));
  };
  
  /**
   * Mise à jour des étudiants assignés
   */
  const handleStudentsChange = (updatedStudents) => {
    setAssignedStudents(updatedStudents);
  };
  
  /**
   * Fonction pour charger les données d'un examen existant
   */
  const fetchExamData = async (examId) => {
    setLoadingExam(true);
    try {
      // Récupérer l'examen
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single();
      
      if (examError) {
        throw examError;
      }
      
      if (!examData) {
        throw new Error('Examen non trouvé');
      }
      
      setExam(examData);
      
      // Récupérer les questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('exam_questions')
        .select('*')
        .eq('exam_id', examId)
        .order('order');
      
      if (questionsError) {
        throw questionsError;
      }
      
      setQuestions(questionsData || []);
      
      // Récupérer les étudiants assignés
      const { data: studentsData, error: studentsError } = await supabase
        .from('student_exams')
        .select('*')
        .eq('exam_id', examId);
      
      if (studentsError) {
        throw studentsError;
      }
      
      setAssignedStudents(studentsData || []);
      
    } catch (err) {
      console.error('Erreur lors du chargement de l\'examen:', err);
      setError(err.message || 'Une erreur est survenue lors du chargement de l\'examen');
    } finally {
      setLoadingExam(false);
    }
  };
  
  /**
   * Setter pour la date (conversion entre Date et string ISO)
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
   */
  const validateStep = (step) => {
    let isValid = true;
    const errors = validationErrors[step] || {};
    
    switch (step) {
      case 0: // Informations générales
        if (!exam.title.trim()) {
          errors.title = 'Le titre est obligatoire';
          isValid = false;
        }
        
        if (!exam.course_id) {
          errors.course_id = 'Le cours est obligatoire';
          isValid = false;
        }
        
        if (!exam.type) {
          errors.type = 'Le type d\'examen est obligatoire';
          isValid = false;
        }
        
        if (exam.total_points <= 0) {
          errors.total_points = 'Le total des points doit être supérieur à 0';
          isValid = false;
        }
        
        if (exam.passing_grade <= 0 || exam.passing_grade > exam.total_points) {
          errors.passing_grade = 'La note de passage doit être comprise entre 1 et le total des points';
          isValid = false;
        }
        break;
        
      case 1: // Planification
        if (!exam.date) {
          errors.date = 'La date est obligatoire';
          isValid = false;
        }
        
        if (exam.duration <= 0) {
          errors.duration = 'La durée doit être supérieure à 0';
          isValid = false;
        }
        
        if (!exam.exam_session_id) {
          errors.exam_session_id = 'La session d\'examen est obligatoire';
          isValid = false;
        }
        break;
        
      case 2: // Questions
        if (questions.length === 0) {
          setError('Vous devez ajouter au moins une question');
          isValid = false;
        } else {
          setError(null);
        }
        break;
        
      case 3: // Étudiants
        if (assignedStudents.length === 0) {
          setError('Vous devez assigner au moins un étudiant');
          isValid = false;
        } else {
          setError(null);
        }
        break;
    }
    
    // Mettre à jour les erreurs de validation
    if (Object.keys(errors).length > 0) {
      setValidationErrors({
        ...validationErrors,
        [step]: errors
      });
    }
    
    return isValid;
  };
  
  /**
   * Passer à l'étape suivante
   */
  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };
  
  /**
   * Revenir à l'étape précédente
   */
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };
  
  /**
   * Sauvegarder l'examen
   * @param {boolean} publish - Indique si l'examen doit être publié
   */
  const handleSaveExam = async (publish = false) => {
    // Valider l'étape actuelle
    if (!validateStep(activeStep)) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const examData = {
        ...exam,
        status: publish ? 'published' : 'draft',
        updated_at: new Date().toISOString()
      };
      
      let examId = exam.id;
      
      // Créer ou mettre à jour l'examen
      if (isEditing) {
        // Mise à jour
        const { error: updateError } = await supabase
          .from('exams')
          .update(examData)
          .eq('id', examId);
        
        if (updateError) {
          throw updateError;
        }
      } else {
        // Création
        examData.created_at = new Date().toISOString();
        
        const { data: insertData, error: insertError } = await supabase
          .from('exams')
          .insert(examData)
          .select();
        
        if (insertError) {
          throw insertError;
        }
        
        examId = insertData[0].id;
        setExam({ ...examData, id: examId });
      }
      
      // Mettre à jour ou créer les questions
      if (questions.length > 0) {
        // Supprimer les anciennes questions si en mode édition
        if (isEditing) {
          const { error: deleteQuestionsError } = await supabase
            .from('exam_questions')
            .delete()
            .eq('exam_id', examId);
          
          if (deleteQuestionsError) {
            throw deleteQuestionsError;
          }
        }
        
        // Ajouter les questions
        const questionsToInsert = questions.map((q, index) => ({
          ...q,
          exam_id: examId,
          order: index,
          id: undefined // Forcer la création de nouveaux IDs
        }));
        
        const { error: insertQuestionsError } = await supabase
          .from('exam_questions')
          .insert(questionsToInsert);
        
        if (insertQuestionsError) {
          throw insertQuestionsError;
        }
      }
      
      // Mettre à jour ou créer les assignations d'étudiants
      if (assignedStudents.length > 0) {
        // Supprimer les anciennes assignations si en mode édition
        if (isEditing) {
          const { error: deleteStudentsError } = await supabase
            .from('student_exams')
            .delete()
            .eq('exam_id', examId);
          
          if (deleteStudentsError) {
            throw deleteStudentsError;
          }
        }
        
        // Ajouter les assignations
        const studentsToInsert = assignedStudents.map(s => ({
          ...s,
          exam_id: examId,
          id: undefined // Forcer la création de nouveaux IDs
        }));
        
        const { error: insertStudentsError } = await supabase
          .from('student_exams')
          .insert(studentsToInsert);
        
        if (insertStudentsError) {
          throw insertStudentsError;
        }
      }
      
      setSuccessMessage(`L'examen a été ${isEditing ? 'mis à jour' : 'créé'} avec succès ${publish ? 'et publié' : ''}.`);
      
      // Rediriger vers la liste des examens après un court délai
      setTimeout(() => {
        navigate('/professor/exams');
      }, 2000);
      
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement:', err);
      setError(err.message || 'Une erreur est survenue lors de l\'enregistrement de l\'examen');
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Gérer le clic sur le bouton Publier
   */
  const handlePublishClick = () => {
    // Valider toutes les étapes avant de permettre la publication
    const allValid = [0, 1, 2, 3].every(step => validateStep(step));
    if (allValid) {
      setPublishDialogOpen(true);
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
  
  const handleCancelConfirm = () => {
    setCancelDialogOpen(false);
    navigate('/professor/exams');
  };

  // Si chargement de l'examen
  if (loadingExam) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4, px: 2 }}>
      <Typography variant="h4" gutterBottom>
        {isEditing ? 'Modifier l\'examen' : 'Créer un nouvel examen'}
      </Typography>
      
      {/* Bannière d'erreur */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Message de succès */}
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
      
      <Paper elevation={3} sx={{ p: 3 }}>
        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        <Divider sx={{ mb: 4 }} />
        
        {/* Contenus des étapes */}
        <Box>
          {activeStep === 0 && (
            <ExamBasicInfo
              examData={exam}
              courses={courses}
              onExamChange={handleExamChange}
              errors={validationErrors[0] || {}}
            />
          )}
          
          {activeStep === 1 && (
            <ExamScheduling
              examData={exam}
              sessions={sessions}
              centers={centers}
              onExamChange={handleExamChange}
              onDateChange={setExamDate}
              errors={validationErrors[1] || {}}
            />
          )}
          
          {activeStep === 2 && (
            <ExamQuestions
              questions={questions}
              onQuestionsChange={handleQuestionsChange}
              totalPoints={exam.total_points}
            />
          )}
          
          {activeStep === 3 && (
            <ExamStudents
              courseId={exam.course_id}
              assignedStudents={assignedStudents}
              onStudentsChange={handleStudentsChange}
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
                    <strong>Total des points:</strong> {exam.total_points}
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
                    <strong>Date:</strong> {new Date(exam.date).toLocaleString()}
                  </Typography>
                  
                  <Typography variant="body1" gutterBottom>
                    <strong>Durée:</strong> {exam.duration} minutes
                  </Typography>
                  
                  <Typography variant="body1" gutterBottom>
                    <strong>Session:</strong> {sessions.find(s => s.id === exam.exam_session_id)?.name || 'Non définie'}
                  </Typography>
                  
                  <Typography variant="body1">
                    <strong>Centre:</strong> {centers.find(c => c.id === exam.exam_center_id)?.name || 'Non défini'}
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
