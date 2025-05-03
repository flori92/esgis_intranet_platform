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
import { supabase } from '../../../utils/supabase';

// Composants du formulaire
import ExamBasicInfo from './components/ExamBasicInfo';
import ExamScheduling from './components/ExamScheduling';
import ExamQuestions from './components/ExamQuestions';
import ExamStudents from './components/ExamStudents';
import { ExamQuestion } from './components/ExamQuestions';

// Types pour un examen
interface Exam {
  id?: number;
  title: string;
  description: string | null;
  course_id: number | null;
  professor_id: number | null;
  exam_session_id: number | null;
  exam_center_id: number | null;
  date: string;
  duration: number;
  type: string;
  room: string | null;
  total_points: number;
  passing_grade: number;
  status: 'draft' | 'published' | 'in_progress' | 'grading' | 'completed' | 'cancelled';
  created_at?: string;
  updated_at?: string;
}

// Types pour les étudiants assignés
interface StudentExam {
  id?: number;
  exam_id: number;
  student_id: number;
  seat_number?: string | null;
  attendance_status?: 'present' | 'absent' | 'late' | null;
  attempt_status?: 'not_started' | 'in_progress' | 'submitted' | null;
  has_incidents?: boolean;
  notes?: string | null;
}

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
const ExamFormPage: React.FC = () => {
  const { authState } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  
  // Étape actuelle
  const [activeStep, setActiveStep] = useState(0);
  
  // Données de l'examen
  const [exam, setExam] = useState<Exam>({
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
  const [courses, setCourses] = useState<Array<{ id: number; name: string; code: string }>>([]);
  const [sessions, setSessions] = useState<Array<{
    id: number;
    name: string;
    academic_year: string;
    semester: number;
  }>>([]);
  const [centers, setCenters] = useState<Array<{
    id: number;
    name: string;
    location: string;
  }>>([]);
  
  // Questions et étudiants
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [assignedStudents, setAssignedStudents] = useState<StudentExam[]>([]);
  
  // États pour les chargements et les erreurs
  const [loading, setLoading] = useState(false);
  const [loadingExam, setLoadingExam] = useState(isEditing);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, Record<string, string>>>({});
  
  // État pour les dialogues
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  
  // Référence aux fonctions fetchData pour éviter les recréations
  const fetchDataRef = useRef(async () => {
    try {
      // Récupérer l'ID du professeur connecté
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      
      const { data: professorData, error: professorError } = await supabase
        .from('professors')
        .select('id')
        .eq('profile_id', userData.user?.id)
        .single();
      
      if (professorError) throw professorError;
      
      if (!professorData) {
        throw new Error('Profil de professeur non trouvé');
      }
      
      // Mettre à jour l'ID du professeur dans l'examen
      setExam(prev => ({
        ...prev,
        professor_id: professorData.id
      }));
      
      // Récupérer les cours du professeur
      const { data: coursesData, error: coursesError } = await supabase
        .from('professor_courses')
        .select(`
          courses:course_id(
            id,
            name,
            code
          )
        `)
        .eq('professor_id', professorData.id);
      
      if (coursesError) throw coursesError;
      
      // Transformer les données des cours
      const transformedCourses = coursesData
        .map(item => ({
          id: item.courses?.id || 0,
          name: item.courses?.name || '',
          code: item.courses?.code || ''
        }))
        .filter(course => course.id !== 0);
      
      setCourses(transformedCourses);
      
      // Récupérer les sessions d'examens
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('exam_sessions')
        .select('id, name, academic_year, semester')
        .order('start_date', { ascending: false });
      
      if (sessionsError) throw sessionsError;
      
      setSessions(sessionsData || []);
      
      // Récupérer les centres d'examens
      const { data: centersData, error: centersError } = await supabase
        .from('exam_centers')
        .select('id, name, location')
        .eq('status', 'active')
        .order('name');
      
      if (centersError) throw centersError;
      
      setCenters(centersData || []);
      
    } catch (err) {
      console.error('Erreur lors du chargement des données initiales:', err);
      setError('Une erreur est survenue lors du chargement des données initiales.');
    }
  });
  
  // Fonction pour charger les données d'un examen existant
  const fetchExamData = async (examId: number) => {
    setLoadingExam(true);
    setError(null);
    
    try {
      // Récupérer l'examen
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single();
      
      if (examError) throw examError;
      
      if (!examData) {
        throw new Error('Examen non trouvé');
      }
      
      setExam(examData);
      
      // Récupérer les questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('exam_questions')
        .select('*')
        .eq('exam_id', examId)
        .order('question_number');
      
      if (questionsError) throw questionsError;
      
      setQuestions(questionsData || []);
      
      // Récupérer les étudiants assignés
      const { data: studentsData, error: studentsError } = await supabase
        .from('student_exams')
        .select('*')
        .eq('exam_id', examId);
      
      if (studentsError) throw studentsError;
      
      setAssignedStudents(studentsData || []);
      
    } catch (err) {
      console.error('Erreur lors du chargement des données de l\'examen:', err);
      setError('Une erreur est survenue lors du chargement des données de l\'examen.');
    } finally {
      setLoadingExam(false);
    }
  };
  
  // Charger les données initiales
  useEffect(() => {
    fetchDataRef.current();
    
    // Si on édite un examen existant, charger ses données
    if (isEditing && id) {
      fetchExamData(parseInt(id));
    }
  }, [isEditing, id]);
  
  // Setter pour la date (conversion entre Date et string ISO)
  const setExamDate = (date: Date | null) => {
    if (date) {
      setExam(prev => ({
        ...prev,
        date: date.toISOString()
      }));
    }
  };
  
  // Valider l'étape actuelle
  const validateStep = (step: number): boolean => {
    const errors: Record<string, Record<string, string>> = {};
    let isValid = true;
    
    switch (step) {
      case 0: // Informations générales
        errors.basicInfo = {};
        
        if (!exam.title.trim()) {
          errors.basicInfo.title = 'Le titre de l\'examen est requis';
          isValid = false;
        }
        
        if (exam.course_id === null) {
          errors.basicInfo.courseId = 'Vous devez sélectionner un cours';
          isValid = false;
        }
        
        if (!exam.type) {
          errors.basicInfo.examType = 'Vous devez sélectionner un type d\'examen';
          isValid = false;
        }
        
        if (exam.total_points <= 0) {
          errors.basicInfo.totalPoints = 'Le nombre total de points doit être supérieur à 0';
          isValid = false;
        }
        
        if (exam.passing_grade < 0 || exam.passing_grade > exam.total_points) {
          errors.basicInfo.passingGrade = 'Le seuil de réussite doit être entre 0 et le nombre total de points';
          isValid = false;
        }
        break;
        
      case 1: // Planification
        errors.scheduling = {};
        
        if (!exam.date) {
          errors.scheduling.date = 'La date de l\'examen est requise';
          isValid = false;
        }
        
        if (exam.duration < 15) {
          errors.scheduling.duration = 'La durée minimale d\'un examen est de 15 minutes';
          isValid = false;
        }
        break;
        
      case 2: // Questions
        errors.questions = {};
        
        if (questions.length === 0) {
          errors.questions.questions = 'Vous devez ajouter au moins une question à l\'examen';
          isValid = false;
        }
        
        // Vérifier que le total des points des questions correspond au total de l'examen
        const questionPointsTotal = questions.reduce((sum, q) => sum + q.points, 0);
        if (questionPointsTotal !== exam.total_points) {
          errors.questions.questions = `Le total des points des questions (${questionPointsTotal}) doit être égal au total des points de l'examen (${exam.total_points})`;
          isValid = false;
        }
        break;
        
      case 3: // Étudiants
        errors.students = {};
        
        if (assignedStudents.length === 0) {
          errors.students.students = 'Vous devez assigner au moins un étudiant à l\'examen';
          isValid = false;
        }
        break;
    }
    
    setValidationErrors(errors);
    return isValid;
  };
  
  // Passer à l'étape suivante
  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };
  
  // Revenir à l'étape précédente
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };
  
  // Sauvegarder l'examen
  const handleSaveExam = async (publish: boolean = false) => {
    // Valider toutes les étapes avant la sauvegarde finale
    for (let i = 0; i < steps.length - 1; i++) {
      if (!validateStep(i)) {
        setActiveStep(i);
        return;
      }
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const examData = {
        ...exam,
        status: publish ? 'published' : 'draft'
      };
      
      let examId: number;
      
      // Insérer ou mettre à jour l'examen
      if (isEditing && exam.id) {
        const { error: updateError } = await supabase
          .from('exams')
          .update(examData)
          .eq('id', exam.id);
        
        if (updateError) throw updateError;
        
        examId = exam.id;
        setSuccessMessage(`L'examen a été mis à jour avec succès${publish ? ' et publié' : ''}.`);
      } else {
        const { data: insertData, error: insertError } = await supabase
          .from('exams')
          .insert([examData])
          .select();
        
        if (insertError) throw insertError;
        
        if (!insertData || insertData.length === 0) {
          throw new Error('Erreur lors de la création de l\'examen');
        }
        
        examId = insertData[0].id;
        setSuccessMessage(`L'examen a été créé avec succès${publish ? ' et publié' : ''}.`);
        
        // Mettre à jour l'objet exam avec l'ID généré
        setExam(prev => ({ ...prev, id: examId }));
      }
      
      // Traiter les questions
      // Supprimer les questions existantes si en édition
      if (isEditing) {
        const { error: deleteQuestionsError } = await supabase
          .from('exam_questions')
          .delete()
          .eq('exam_id', examId);
        
        if (deleteQuestionsError) throw deleteQuestionsError;
      }
      
      // Insérer les nouvelles questions
      const questionsWithExamId = questions.map(q => ({
        ...q,
        exam_id: examId
      }));
      
      const { error: insertQuestionsError } = await supabase
        .from('exam_questions')
        .insert(questionsWithExamId);
      
      if (insertQuestionsError) throw insertQuestionsError;
      
      // Traiter les étudiants assignés
      // Supprimer les assignations existantes si en édition
      if (isEditing) {
        const { error: deleteStudentsError } = await supabase
          .from('student_exams')
          .delete()
          .eq('exam_id', examId);
        
        if (deleteStudentsError) throw deleteStudentsError;
      }
      
      // Insérer les nouvelles assignations
      const studentsWithExamId = assignedStudents.map(s => ({
        ...s,
        exam_id: examId
      }));
      
      const { error: insertStudentsError } = await supabase
        .from('student_exams')
        .insert(studentsWithExamId);
      
      if (insertStudentsError) throw insertStudentsError;
      
      // Rediriger vers la liste des examens après un court délai
      setTimeout(() => {
        navigate('/professor/exams');
      }, 1500);
      
    } catch (err) {
      console.error('Erreur lors de la sauvegarde de l\'examen:', err);
      setError('Une erreur est survenue lors de la sauvegarde de l\'examen.');
    } finally {
      setLoading(false);
    }
  };
  
  // Gérer le clic sur le bouton Publier
  const handlePublishClick = () => {
    if (validateStep(activeStep)) {
      setPublishDialogOpen(true);
    }
  };
  
  // Gérer la confirmation de publication
  const handlePublishConfirm = () => {
    setPublishDialogOpen(false);
    handleSaveExam(true);
  };
  
  // Annuler et retourner à la liste des examens
  const handleCancelClick = () => {
    setCancelDialogOpen(true);
  };
  
  const handleCancelConfirm = () => {
    setCancelDialogOpen(false);
    navigate('/professor/exams');
  };
  
  // Vérifier si l'utilisateur est professeur
  if (!authState.isProfessor) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Vous n'avez pas les droits nécessaires pour accéder à cette page.
        </Alert>
      </Box>
    );
  }
  
  // Afficher un écran de chargement lors de l'édition
  if (loadingExam) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {isEditing ? 'Modifier un examen' : 'Créer un nouvel examen'}
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
        message={successMessage}
      />
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        <Box sx={{ mt: 2, mb: 2 }}>
          {activeStep === 0 && (
            <ExamBasicInfo
              title={exam.title}
              setTitle={(title) => setExam({ ...exam, title })}
              description={exam.description || ''}
              setDescription={(description) => setExam({ ...exam, description })}
              courseId={exam.course_id}
              setCourseId={(course_id) => setExam({ ...exam, course_id })}
              examType={exam.type}
              setExamType={(type) => setExam({ ...exam, type })}
              totalPoints={exam.total_points}
              setTotalPoints={(total_points) => setExam({ ...exam, total_points })}
              passingGrade={exam.passing_grade}
              setPassingGrade={(passing_grade) => setExam({ ...exam, passing_grade })}
              courses={courses}
              errors={validationErrors.basicInfo || {}}
            />
          )}
          
          {activeStep === 1 && (
            <ExamScheduling
              date={exam.date ? new Date(exam.date) : null}
              setDate={setExamDate}
              duration={exam.duration}
              setDuration={(duration) => setExam({ ...exam, duration })}
              sessionId={exam.exam_session_id}
              setSessionId={(exam_session_id) => setExam({ ...exam, exam_session_id })}
              centerId={exam.exam_center_id}
              setCenterId={(exam_center_id) => setExam({ ...exam, exam_center_id })}
              room={exam.room || ''}
              setRoom={(room) => setExam({ ...exam, room })}
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
              setTotalPoints={(total_points) => setExam({ ...exam, total_points })}
              errors={validationErrors.questions || {}}
            />
          )}
          
          {activeStep === 3 && (
            <ExamStudents
              examId={exam.id}
              courseId={exam.course_id}
              assignedStudents={assignedStudents}
              setAssignedStudents={setAssignedStudents}
              errors={validationErrors.students || {}}
            />
          )}
          
          {activeStep === 4 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Récapitulatif de l'examen
              </Typography>
              
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Informations générales
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body1" gutterBottom>
                    <strong>Titre:</strong> {exam.title}
                  </Typography>
                  
                  <Typography variant="body1" gutterBottom>
                    <strong>Cours:</strong> {courses.find(c => c.id === exam.course_id)?.name || 'Non spécifié'}
                  </Typography>
                  
                  <Typography variant="body1" gutterBottom>
                    <strong>Type d'examen:</strong> {exam.type}
                  </Typography>
                  
                  <Typography variant="body1" gutterBottom>
                    <strong>Points totaux:</strong> {exam.total_points}
                  </Typography>
                  
                  <Typography variant="body1">
                    <strong>Seuil de réussite:</strong> {exam.passing_grade} points ({Math.round((exam.passing_grade / exam.total_points) * 100)}%)
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle1" gutterBottom>
                  Planification
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body1" gutterBottom>
                    <strong>Date et heure:</strong> {exam.date ? new Date(exam.date).toLocaleString() : 'Non spécifié'}
                  </Typography>
                  
                  <Typography variant="body1" gutterBottom>
                    <strong>Durée:</strong> {exam.duration} minutes
                  </Typography>
                  
                  {exam.exam_session_id && (
                    <Typography variant="body1" gutterBottom>
                      <strong>Session:</strong> {sessions.find(s => s.id === exam.exam_session_id)?.name || 'Non spécifié'}
                    </Typography>
                  )}
                  
                  {exam.exam_center_id && (
                    <Typography variant="body1" gutterBottom>
                      <strong>Centre d'examen:</strong> {centers.find(c => c.id === exam.exam_center_id)?.name || 'Non spécifié'}
                    </Typography>
                  )}
                  
                  {exam.room && (
                    <Typography variant="body1">
                      <strong>Salle:</strong> {exam.room}
                    </Typography>
                  )}
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
