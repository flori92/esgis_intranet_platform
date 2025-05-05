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
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

// Import unique Supabase – toute référence doit passer par '@/services/supabase'
import { supabase } from '@/services/supabase';

/**
 * Page de liste des examens pour les professeurs
 * @returns {JSX.Element} Le composant de la page de liste des examens
 */
const ExamsListPage = () => {
  const { authState } = useAuth();
  const navigate = useNavigate();
  
  // États pour les données
  const [exams, setExams] = useState([]);
  const [filteredExams, setFilteredExams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [centers, setCenters] = useState([]);
  
  // États pour le filtre et la pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourse, setFilterCourse] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSession, setFilterSession] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // États pour le chargement et les erreurs
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // État pour le dialogue de suppression
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState(null);
  
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
      const professorId = authState?.user?.id;
      
      if (!professorId) {
        throw new Error("Vous devez être connecté en tant que professeur pour accéder à cette page");
      }
      
      // Récupérer les examens du professeur
      const { data: examsData, error: examsError } = await supabase
        .from('exams')
        .select(`
          id,
          title,
          course_id,
          courses(name, code),
          professor_id,
          professors:users!professors_professor_id_fkey(full_name),
          exam_session_id,
          exam_sessions(name),
          exam_center_id,
          exam_centers(name),
          date,
          duration,
          type,
          total_points,
          status,
          room,
          created_at
        `)
        .eq('professor_id', professorId)
        .order('created_at', { ascending: false });
      
      if (examsError) {
        throw examsError;
      }
      
      // Récupérer le nombre d'étudiants pour chaque examen
      const examsWithStudentCount = await Promise.all(
        examsData.map(async (exam) => {
          const { count, error: countError } = await supabase
            .from('exam_students')
            .select('*', { count: 'exact', head: true })
            .eq('exam_id', exam.id);
          
          if (countError) {
            console.error('Erreur lors du comptage des étudiants:', countError);
            return { ...exam, student_count: 0 };
          }
          
          return {
            ...exam,
            course_name: exam.courses?.name || 'Cours inconnu',
            course_code: exam.courses?.code || 'Code inconnu',
            professor_name: exam.professors?.full_name || 'Professeur inconnu',
            session_name: exam.exam_sessions?.name || null,
            center_name: exam.exam_centers?.name || null,
            student_count: count || 0
          };
        })
      );
      
      setExams(examsWithStudentCount);
      setFilteredExams(examsWithStudentCount);
      
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
      
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError(err.message || 'Une erreur est survenue lors du chargement des données');
    } finally {
      setLoading(false);
    }
  });
  
  // Charger les données au chargement de la page
  useEffect(() => {
    fetchDataRef.current();
  }, []);
  
  // Filtrer les examens lorsque les filtres changent
  useEffect(() => {
    if (!exams.length) return;
    
    let filtered = [...exams];
    
    // Filtrer par terme de recherche
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(exam => 
        exam.title.toLowerCase().includes(searchLower) ||
        exam.course_name.toLowerCase().includes(searchLower) ||
        exam.course_code.toLowerCase().includes(searchLower)
      );
    }
    
    // Filtrer par cours
    if (filterCourse) {
      filtered = filtered.filter(exam => exam.course_id === filterCourse);
    }
    
    // Filtrer par type d'examen
    if (filterType !== 'all') {
      filtered = filtered.filter(exam => exam.type === filterType);
    }
    
    // Filtrer par statut
    if (filterStatus !== 'all') {
      filtered = filtered.filter(exam => exam.status === filterStatus);
    }
    
    // Filtrer par session
    if (filterSession) {
      filtered = filtered.filter(exam => exam.exam_session_id === filterSession);
    }
    
    setFilteredExams(filtered);
    setPage(0); // Réinitialiser à la première page après filtrage
  }, [exams, searchTerm, filterCourse, filterType, filterStatus, filterSession]);
  
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
   * Gérer le changement de page
   * @param {Object} _event - L'événement de changement de page
   * @param {number} newPage - La nouvelle page
   */
  const handleChangePage = (_event, newPage) => {
    setPage(newPage);
  };
  
  /**
   * Gérer le changement du nombre de lignes par page
   * @param {Object} event - L'événement de changement
   */
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  /**
   * Réinitialiser les filtres
   */
  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterCourse(null);
    setFilterType('all');
    setFilterStatus('all');
    setFilterSession(null);
    setFilteredExams(exams);
  };
  
  /**
   * Naviguer vers la page de création d'examen
   */
  const handleCreateExam = () => {
    navigate('/exams/create');
  };
  
  /**
   * Naviguer vers la page de détail d'un examen
   * @param {number} id - L'ID de l'examen
   */
  const handleViewExam = (id) => {
    navigate(`/exams/${id}`);
  };
  
  /**
   * Naviguer vers la page d'édition d'un examen
   * @param {number} id - L'ID de l'examen
   */
  const handleEditExam = (id) => {
    navigate(`/exams/${id}/edit`);
  };
  
  /**
   * Naviguer vers la page de gestion des étudiants pour un examen
   * @param {number} id - L'ID de l'examen
   */
  const handleManageStudents = (id) => {
    navigate(`/exams/${id}/students`);
  };
  
  /**
   * Ouvrir le dialogue de confirmation de suppression
   * @param {Object} exam - L'examen à supprimer
   */
  const handleOpenDeleteDialog = (exam) => {
    setExamToDelete(exam);
    setDeleteDialogOpen(true);
  };
  
  /**
   * Fermer le dialogue de confirmation de suppression
   */
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setExamToDelete(null);
  };
  
  /**
   * Supprimer un examen
   */
  const handleDeleteExam = async () => {
    if (!examToDelete) return;
    
    setLoading(true);
    
    try {
      // Supprimer l'examen
      const { error } = await supabase
        .from('exams')
        .delete()
        .eq('id', examToDelete.id);
      
      if (error) {
        throw error;
      }
      
      // Mettre à jour la liste des examens
      setExams(exams.filter(exam => exam.id !== examToDelete.id));
      setFilteredExams(filteredExams.filter(exam => exam.id !== examToDelete.id));
      
      setSuccessMessage(`L'examen "${examToDelete.title}" a été supprimé avec succès.`);
      handleCloseDeleteDialog();
    } catch (err) {
      console.error('Erreur lors de la suppression de l\'examen:', err);
      setError(err.message || 'Une erreur est survenue lors de la suppression de l\'examen');
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Dupliquer un examen existant
   * @param {Object} exam - L'examen à dupliquer
   */
  const handleDuplicateExam = async (exam) => {
    setLoading(true);
    
    try {
      // 1. Récupérer les détails complets de l'examen
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('id', exam.id)
        .single();
      
      if (examError) {
        throw examError;
      }
      
      // 2. Récupérer les questions de l'examen
      const { data: questionsData, error: questionsError } = await supabase
        .from('exam_questions')
        .select('*')
        .eq('exam_id', exam.id)
        .order('question_number');
      
      if (questionsError) {
        throw questionsError;
      }
      
      // 3. Créer un nouvel examen (copie)
      const newExamTitle = `Copie de ${examData.title}`;
      const { data: newExam, error: newExamError } = await supabase
        .from('exams')
        .insert({
          ...examData,
          id: undefined, // Laisser la base de données générer un nouvel ID
          title: newExamTitle,
          status: 'draft', // Toujours en brouillon
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (newExamError) {
        throw newExamError;
      }
      
      // 4. Créer les questions pour le nouvel examen
      if (questionsData.length > 0) {
        const newQuestions = questionsData.map(question => ({
          ...question,
          id: undefined, // Laisser la base de données générer un nouvel ID
          exam_id: newExam.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        
        const { error: newQuestionsError } = await supabase
          .from('exam_questions')
          .insert(newQuestions);
        
        if (newQuestionsError) {
          throw newQuestionsError;
        }
      }
      
      // 5. Actualiser la liste des examens
      fetchDataRef.current();
      
      setSuccessMessage(`L'examen a été dupliqué avec succès sous le nom "${newExamTitle}".`);
    } catch (err) {
      console.error('Erreur lors de la duplication de l\'examen:', err);
      setError(err.message || 'Une erreur est survenue lors de la duplication de l\'examen');
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Formater la durée en heures et minutes
   * @param {number} minutes - Durée en minutes
   * @returns {string} Durée formatée
   */
  const formatDuration = (minutes) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours} h`;
    }
    
    return `${hours} h ${remainingMinutes} min`;
  };
  
  /**
   * Formater une date
   * @param {string} dateString - Date au format ISO
   * @returns {string} Date formatée
   */
  const formatDate = (dateString) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'dd MMMM yyyy à HH:mm', { locale: fr });
    } catch (error) {
      console.error('Erreur de formatage de date:', error);
      return dateString || 'Date non définie';
    }
  };
  
  /**
   * Obtenir la puce de statut pour un examen
   * @param {string} status - Statut de l'examen
   * @returns {JSX.Element} Composant Chip
   */
  const getStatusChip = (status) => {
    const statusInfo = examStatuses.find(s => s.value === status) || {
      label: 'Inconnu',
      color: 'default'
    };
    
    return (
      <Chip
        label={statusInfo.label}
        color={statusInfo.color}
        size="small"
        variant="outlined"
      />
    );
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Mes examens
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
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {/* Actions principales */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateExam}
        >
          Créer un nouvel examen
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => fetchDataRef.current()}
        >
          Actualiser
        </Button>
      </Box>
      
      {/* Filtres */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          <FilterListIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Filtres
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Rechercher"
              variant="outlined"
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
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="course-filter-label">Cours</InputLabel>
              <Select
                labelId="course-filter-label"
                value={filterCourse || ''}
                onChange={(e) => setFilterCourse(e.target.value || null)}
                label="Cours"
              >
                <MenuItem value="">Tous les cours</MenuItem>
                {courses.map((course) => (
                  <MenuItem key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="type-filter-label">Type</InputLabel>
              <Select
                labelId="type-filter-label"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                label="Type"
              >
                <MenuItem value="all">Tous les types</MenuItem>
                {examTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="status-filter-label">Statut</InputLabel>
              <Select
                labelId="status-filter-label"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Statut"
              >
                <MenuItem value="all">Tous les statuts</MenuItem>
                {examStatuses.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="session-filter-label">Session</InputLabel>
              <Select
                labelId="session-filter-label"
                value={filterSession || ''}
                onChange={(e) => setFilterSession(e.target.value || null)}
                label="Session"
              >
                <MenuItem value="">Toutes les sessions</MenuItem>
                {sessions.map((session) => (
                  <MenuItem key={session.id} value={session.id}>
                    {session.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={handleResetFilters}
              startIcon={<RefreshIcon />}
            >
              Réinitialiser les filtres
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Liste des examens */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : filteredExams.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" color="textSecondary">
              Aucun examen trouvé
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {exams.length > 0
                ? 'Essayez de modifier vos filtres pour voir plus de résultats.'
                : 'Créez votre premier examen en cliquant sur "Créer un nouvel examen".'}
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer sx={{ maxHeight: 'calc(100vh - 350px)' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Titre</TableCell>
                    <TableCell>Cours</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Durée</TableCell>
                    <TableCell>Session</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell>Étudiants</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredExams
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((exam) => (
                      <TableRow key={exam.id} hover>
                        <TableCell>
                          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                            {exam.title}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={`${exam.course_code}`}
                            size="small"
                            sx={{ mr: 1 }}
                          />
                          {exam.course_name}
                        </TableCell>
                        <TableCell>
                          {examTypes.find(t => t.value === exam.type)?.label || exam.type}
                        </TableCell>
                        <TableCell>
                          {formatDate(exam.date)}
                        </TableCell>
                        <TableCell>
                          {formatDuration(exam.duration)}
                        </TableCell>
                        <TableCell>
                          {exam.session_name || 'Non définie'}
                        </TableCell>
                        <TableCell>
                          {getStatusChip(exam.status)}
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={<SchoolIcon />}
                            label={exam.student_count}
                            size="small"
                            color={exam.student_count > 0 ? 'primary' : 'default'}
                          />
                        </TableCell>
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
                  }
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
