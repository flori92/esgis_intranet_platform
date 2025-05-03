import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  TablePagination,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  FileCopy as FileCopyIcon,
  Assignment as AssignmentIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Event as EventIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
  School as SchoolIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { supabase } from '../../../utils/supabase';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

// Types
interface Exam {
  id: number;
  title: string;
  course_id: number;
  course_name: string;
  course_code: string;
  professor_id: number;
  professor_name: string;
  exam_session_id: number | null;
  session_name: string | null;
  exam_center_id: number | null;
  center_name: string | null;
  date: string;
  duration: number;
  type: string;
  total_points: number;
  status: string;
  room: string | null;
  created_at: string;
  student_count: number;
}

interface Course {
  id: number;
  name: string;
  code: string;
}

interface ExamSession {
  id: number;
  name: string;
  academic_year: string;
  semester: number;
}

interface ExamCenter {
  id: number;
  name: string;
  location: string;
}

const ExamsListPage: React.FC = () => {
  const { authState } = useAuth();
  const navigate = useNavigate();
  
  // États pour les données
  const [exams, setExams] = useState<Exam[]>([]);
  const [filteredExams, setFilteredExams] = useState<Exam[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [centers, setCenters] = useState<ExamCenter[]>([]);
  
  // États pour le filtre et la pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourse, setFilterCourse] = useState<number | null>(null);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSession, setFilterSession] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // États pour le chargement et les erreurs
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // État pour le dialogue de suppression
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null);
  
  // Types d'examen disponibles
  const examTypes = [
    { value: 'midterm', label: 'Partiel' },
    { value: 'final', label: 'Final' },
    { value: 'quiz', label: 'Quiz' },
    { value: 'project', label: 'Projet' },
    { value: 'oral', label: 'Oral' },
    { value: 'practical', label: 'TP' }
  ];
  
  // États des examens
  const examStatuses = [
    { value: 'draft', label: 'Brouillon', color: 'default' },
    { value: 'published', label: 'Publié', color: 'info' },
    { value: 'in_progress', label: 'En cours', color: 'warning' },
    { value: 'grading', label: 'Notation', color: 'primary' },
    { value: 'completed', label: 'Terminé', color: 'success' },
    { value: 'cancelled', label: 'Annulé', color: 'error' }
  ];
  
  // Référence pour éviter les recréations de fonctions
  const fetchDataRef = useRef(async () => {
    setLoading(true);
    setError(null);
    
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
      
      const professorId = professorData.id;
      
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
        .eq('professor_id', professorId);
      
      if (coursesError) throw coursesError;
      
      // Transformer les données des cours
      const transformedCourses: Course[] = coursesData
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
      
      // Récupérer les examens du professeur
      const { data: examsData, error: examsError } = await supabase
        .from('exams')
        .select(`
          id,
          title,
          course_id,
          courses:course_id(name, code),
          professor_id,
          professors:professor_id(profiles:profile_id(full_name)),
          exam_session_id,
          exam_sessions:exam_session_id(name),
          exam_center_id,
          exam_centers:exam_center_id(name),
          date,
          duration,
          type,
          total_points,
          status,
          room,
          created_at
        `)
        .eq('professor_id', professorId)
        .order('date', { ascending: false });
      
      if (examsError) throw examsError;
      
      // Pour chaque examen, compter le nombre d'étudiants inscrits
      const examsWithStudentCount = [];
      
      for (const exam of examsData || []) {
        const { count, error: countError } = await supabase
          .from('student_exams')
          .select('id', { count: 'exact', head: true })
          .eq('exam_id', exam.id);
        
        if (countError) throw countError;
        
        examsWithStudentCount.push({
          id: exam.id,
          title: exam.title,
          course_id: exam.course_id,
          course_name: exam.courses?.name || 'Inconnu',
          course_code: exam.courses?.code || 'Inconnu',
          professor_id: exam.professor_id,
          professor_name: exam.professors?.profiles?.full_name || 'Inconnu',
          exam_session_id: exam.exam_session_id,
          session_name: exam.exam_sessions?.name || null,
          exam_center_id: exam.exam_center_id,
          center_name: exam.exam_centers?.name || null,
          date: exam.date,
          duration: exam.duration,
          type: exam.type,
          total_points: exam.total_points,
          status: exam.status,
          room: exam.room,
          created_at: exam.created_at,
          student_count: count || 0
        });
      }
      
      setExams(examsWithStudentCount);
      setFilteredExams(examsWithStudentCount);
    } catch (err) {
      console.error('Erreur lors du chargement des données :', err);
      setError('Une erreur est survenue lors du chargement des données. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  });
  
  // Charger les données au montage du composant
  useEffect(() => {
    fetchDataRef.current();
  }, []);
  
  // Filtrer les examens en fonction des critères
  useEffect(() => {
    let result = [...exams];
    
    // Filtre par terme de recherche
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(exam => 
        exam.title.toLowerCase().includes(searchLower) || 
        exam.course_name.toLowerCase().includes(searchLower) ||
        exam.course_code.toLowerCase().includes(searchLower)
      );
    }
    
    // Filtre par cours
    if (filterCourse !== null) {
      result = result.filter(exam => exam.course_id === filterCourse);
    }
    
    // Filtre par type
    if (filterType !== 'all') {
      result = result.filter(exam => exam.type === filterType);
    }
    
    // Filtre par statut
    if (filterStatus !== 'all') {
      result = result.filter(exam => exam.status === filterStatus);
    }
    
    // Filtre par session
    if (filterSession !== null) {
      result = result.filter(exam => exam.exam_session_id === filterSession);
    }
    
    setFilteredExams(result);
    setPage(0); // Réinitialiser la pagination
  }, [exams, searchTerm, filterCourse, filterType, filterStatus, filterSession]);
  
  // Gestion de la pagination
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Réinitialiser les filtres
  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterCourse(null);
    setFilterType('all');
    setFilterStatus('all');
    setFilterSession(null);
  };
  
  // Naviguer vers la page de création d'examen
  const handleCreateExam = () => {
    navigate('/professor/exams/create');
  };
  
  // Naviguer vers la page de détail d'un examen
  const handleViewExam = (id: number) => {
    navigate(`/professor/exams/${id}`);
  };
  
  // Naviguer vers la page d'édition d'un examen
  const handleEditExam = (id: number) => {
    navigate(`/professor/exams/${id}/edit`);
  };
  
  // Naviguer vers la page de gestion des étudiants pour un examen
  const handleManageStudents = (id: number) => {
    navigate(`/professor/exams/${id}/students`);
  };
  
  // Ouvrir le dialogue de confirmation de suppression
  const handleOpenDeleteDialog = (exam: Exam) => {
    setExamToDelete(exam);
    setDeleteDialogOpen(true);
  };
  
  // Fermer le dialogue de confirmation de suppression
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setExamToDelete(null);
  };
  
  // Supprimer un examen
  const handleDeleteExam = async () => {
    if (!examToDelete) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('exams')
        .delete()
        .eq('id', examToDelete.id);
      
      if (error) throw error;
      
      setSuccessMessage(`L'examen "${examToDelete.title}" a été supprimé avec succès.`);
      await fetchDataRef.current();
    } catch (err) {
      console.error('Erreur lors de la suppression de l\'examen :', err);
      setError('Une erreur est survenue lors de la suppression de l\'examen.');
    } finally {
      setLoading(false);
      handleCloseDeleteDialog();
    }
  };
  
  // Dupliquer un examen existant
  const handleDuplicateExam = async (exam: Exam) => {
    setLoading(true);
    try {
      const newTitle = `Copie de ${exam.title}`;
      
      // Récupérer les questions de l'examen
      const { data: questionsData, error: questionsError } = await supabase
        .from('exam_questions')
        .select('*')
        .eq('exam_id', exam.id);
      
      if (questionsError) throw questionsError;
      
      // Créer un nouvel examen
      const { data: newExamData, error: newExamError } = await supabase
        .from('exams')
        .insert([
          {
            title: newTitle,
            course_id: exam.course_id,
            professor_id: exam.professor_id,
            exam_session_id: null,
            exam_center_id: null,
            date: new Date().toISOString(),
            duration: exam.duration,
            type: exam.type,
            total_points: exam.total_points,
            passing_grade: exam.total_points / 2,
            status: 'draft',
            room: null
          }
        ])
        .select();
      
      if (newExamError) throw newExamError;
      
      if (!newExamData || newExamData.length === 0) {
        throw new Error('Erreur lors de la duplication de l\'examen');
      }
      
      const newExamId = newExamData[0].id;
      
      // Dupliquer les questions
      if (questionsData && questionsData.length > 0) {
        const newQuestions = questionsData.map(q => ({
          exam_id: newExamId,
          question_number: q.question_number,
          question_text: q.question_text,
          question_type: q.question_type,
          points: q.points,
          options: q.options,
          correct_answer: q.correct_answer,
          rubric: q.rubric
        }));
        
        const { error: insertQuestionsError } = await supabase
          .from('exam_questions')
          .insert(newQuestions);
        
        if (insertQuestionsError) throw insertQuestionsError;
      }
      
      setSuccessMessage(`L'examen a été dupliqué avec succès sous le nom "${newTitle}".`);
      await fetchDataRef.current();
    } catch (err) {
      console.error('Erreur lors de la duplication de l\'examen :', err);
      setError('Une erreur est survenue lors de la duplication de l\'examen.');
    } finally {
      setLoading(false);
    }
  };
  
  // Formater la durée en heures et minutes
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
    }
    
    return `${mins} min`;
  };
  
  // Formater une date
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd MMMM yyyy HH:mm', { locale: fr });
    } catch (error) {
      return 'Date invalide';
    }
  };
  
  // Obtenir la puce de statut pour un examen
  const getStatusChip = (status: string) => {
    const statusInfo = examStatuses.find(s => s.value === status) || { 
      value: status, 
      label: status, 
      color: 'default' 
    };
    
    return (
      <Chip 
        label={statusInfo.label}
        color={statusInfo.color as any}
        size="small"
      />
    );
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
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gestion des Examens
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
        message={successMessage}
      />
      
      {/* Filtres et actions */}
      <Box sx={{ mb: 3 }}>
        <Paper sx={{ p: 2 }}>
          <Box sx={{ mb: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder="Rechercher un examen..."
                  variant="outlined"
                  size="small"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={8}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Cours</InputLabel>
                    <Select
                      value={filterCourse === null ? '' : filterCourse}
                      onChange={(e) => setFilterCourse(e.target.value === '' ? null : Number(e.target.value))}
                      label="Cours"
                    >
                      <MenuItem value="">Tous les cours</MenuItem>
                      {courses.map(course => (
                        <MenuItem key={course.id} value={course.id}>
                          {course.code} - {course.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      label="Type"
                    >
                      <MenuItem value="all">Tous</MenuItem>
                      {examTypes.map(type => (
                        <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Statut</InputLabel>
                    <Select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      label="Statut"
                    >
                      <MenuItem value="all">Tous</MenuItem>
                      {examStatuses.map(status => (
                        <MenuItem key={status.value} value={status.value}>{status.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Session</InputLabel>
                    <Select
                      value={filterSession === null ? '' : filterSession}
                      onChange={(e) => setFilterSession(e.target.value === '' ? null : Number(e.target.value))}
                      label="Session"
                    >
                      <MenuItem value="">Toutes les sessions</MenuItem>
                      {sessions.map(session => (
                        <MenuItem key={session.id} value={session.id}>
                          {session.name} ({session.academic_year})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={handleResetFilters}
                    size="small"
                  >
                    Réinitialiser
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1">
              {filteredExams.length} examen{filteredExams.length !== 1 ? 's' : ''} trouvé{filteredExams.length !== 1 ? 's' : ''}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleCreateExam}
            >
              Créer un examen
            </Button>
          </Box>
        </Paper>
      </Box>
      
      {/* Tableau des examens */}
      <Paper>
        {loading && exams.length === 0 ? (
          <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Titre</TableCell>
                    <TableCell>Cours</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Durée</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Session / Centre</TableCell>
                    <TableCell>Étudiants</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredExams.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center">
                        Aucun examen trouvé
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredExams
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map(exam => (
                        <TableRow key={exam.id}>
                          <TableCell>{exam.title}</TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2">{exam.course_name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {exam.course_code}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{formatDate(exam.date)}</TableCell>
                          <TableCell>{formatDuration(exam.duration)}</TableCell>
                          <TableCell>
                            {examTypes.find(t => t.value === exam.type)?.label || exam.type}
                          </TableCell>
                          <TableCell>
                            {exam.session_name ? (
                              <Chip
                                icon={<EventIcon fontSize="small" />}
                                label={exam.session_name}
                                size="small"
                                variant="outlined"
                                sx={{ mb: 0.5 }}
                              />
                            ) : null}
                            {exam.center_name ? (
                              <Chip
                                icon={<SchoolIcon fontSize="small" />}
                                label={exam.center_name}
                                size="small"
                                variant="outlined"
                              />
                            ) : null}
                          </TableCell>
                          <TableCell>{exam.student_count}</TableCell>
                          <TableCell>{getStatusChip(exam.status)}</TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleViewExam(exam.id)}
                                title="Voir l'examen"
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                              
                              {exam.status === 'draft' && (
                                <IconButton
                                  size="small"
                                  color="secondary"
                                  onClick={() => handleEditExam(exam.id)}
                                  title="Modifier l'examen"
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              )}
                              
                              <IconButton
                                size="small"
                                color="info"
                                onClick={() => handleManageStudents(exam.id)}
                                title="Gérer les étudiants"
                              >
                                <AssignmentIcon fontSize="small" />
                              </IconButton>
                              
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleDuplicateExam(exam)}
                                title="Dupliquer l'examen"
                              >
                                <FileCopyIcon fontSize="small" />
                              </IconButton>
                              
                              {exam.status === 'draft' && (
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleOpenDeleteDialog(exam)}
                                  title="Supprimer l'examen"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredExams.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Lignes par page :"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
            />
          </>
        )}
      </Paper>
      
      {/* Dialogue de confirmation de suppression */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
      >
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir supprimer l'examen "{examToDelete?.title}" ?
            Cette action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Annuler</Button>
          <Button onClick={handleDeleteExam} color="error" variant="contained" autoFocus>
            {loading ? <CircularProgress size={24} /> : 'Supprimer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExamsListPage;
