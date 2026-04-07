import React, { useState, useEffect } from 'react';
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
  DialogTitle,
  Grid,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  Analytics as AnalyticsIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  FileCopy as FileCopyIcon,
  Assignment as AssignmentIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Event as EventIcon,
  Refresh as RefreshIcon,
  School as SchoolIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  deleteExamDirect,
  getCoursesList,
  getExamCenters,
  getExamQuestions,
  getExamSessions,
  getProfessorExams,
  getStudentExamsCount,
  insertExam,
  insertExamQuestions
} from '@/api/exams';

/**
 * @typedef {Object} ExamWithCourse
 * @property {number} id - ID de l'examen
 * @property {string} title - Titre de l'examen
 * @property {string} description - Description de l'examen
 * @property {number} course_id - ID du cours associé
 * @property {string} exam_type - Type d'examen (midterm, final, etc.)
 * @property {string} status - Statut de l'examen
 * @property {string} exam_date - Date de l'examen
 * @property {number} duration - Durée en minutes
 * @property {number} total_points - Total des points
 * @property {number} passing_points - Points nécessaires pour réussir
 * @property {Object} [course] - Cours associé à l'examen
 */

/**
 * @typedef {Object} ExamSession
 * @property {number} id - ID de la session
 * @property {string} name - Nom de la session
 * @property {string} academic_year - Année académique
 * @property {number} semester - Semestre
 */

/**
 * @typedef {Object} ExamCenter
 * @property {number} id - ID du centre d'examen
 * @property {string} name - Nom du centre
 * @property {string} location - Emplacement du centre
 */

/**
 * Page de liste des examens pour les professeurs
 * Permet de visualiser, créer, modifier et gérer les examens
 */
const ExamsListPage = () => {
  const theme = useTheme();
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
  
  /**
   * Récupération des données (examens, cours, sessions, centres)
   */
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const professorId = authState.user?.id;

      if (!professorId) {
        throw new Error('Profil utilisateur indisponible');
      }

      const [
        { data: examsData, error: examsError },
        { data: coursesData, error: coursesError },
        { data: sessionsData, error: sessionsError },
        { data: centersData, error: centersError }
      ] = await Promise.all([
        getProfessorExams(professorId),
        getCoursesList(),
        getExamSessions(),
        getExamCenters()
      ]);

      if (examsError) {
        throw examsError;
      }

      if (coursesError) {
        throw coursesError;
      }

      if (sessionsError) {
        throw sessionsError;
      }

      if (centersError) {
        throw centersError;
      }

      setCourses(coursesData || []);
      setSessions(sessionsData || []);
      setCenters(centersData || []);

      const examsWithCounts = await Promise.all(
        (examsData || []).map(async (exam) => {
          const { count } = await getStudentExamsCount(exam.id);

          return {
            ...exam,
            course: (coursesData || []).find((course) => course.id === exam.course_id) || null,
            session: (sessionsData || []).find((session) => session.id === exam.exam_session_id) || null,
            center: (centersData || []).find((center) => center.id === exam.exam_center_id) || null,
            student_count: count || 0
          };
        })
      );

      setExams(examsWithCounts);
      setFilteredExams(examsWithCounts);
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError(err.message || 'Une erreur est survenue lors du chargement des examens');
      setExams([]);
      setFilteredExams([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authState.user?.id) {
      fetchData();
    }
  }, [authState.user?.id]);
  
  // Filtrer les examens selon les critères
  useEffect(() => {
    // Appliquer les filtres
    let filtered = [...exams];
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(exam => 
        exam.title.toLowerCase().includes(searchLower) || 
        (exam.description && exam.description.toLowerCase().includes(searchLower)) ||
        (exam.course?.name && exam.course.name.toLowerCase().includes(searchLower))
      );
    }
    
    if (filterCourse) {
      filtered = filtered.filter(exam => exam.course_id === filterCourse);
    }
    
    if (filterType !== 'all') {
      filtered = filtered.filter(exam => exam.type === filterType);
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(exam => exam.status === filterStatus);
    }
    
    if (filterSession) {
      filtered = filtered.filter(exam => exam.exam_session_id === filterSession);
    }
    
    setFilteredExams(filtered);
    setPage(0); // Réinitialiser la pagination lors du filtrage
  }, [exams, searchTerm, filterCourse, filterType, filterStatus, filterSession]);
  
  // Gestionnaires d'événements
  /**
   * Gestion du changement de page de pagination
   */
  const handleChangePage = (_event, newPage) => {
    setPage(newPage);
  };
  
  /**
   * Gestion du changement de nombre de lignes par page
   */
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  /**
   * Gestion des changements de filtres
   */
  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    
    switch (name) {
      case 'filterCourse':
        setFilterCourse(value !== 'all' ? Number(value) : null);
        break;
      case 'filterType':
        setFilterType(value);
        break;
      case 'filterStatus':
        setFilterStatus(value);
        break;
      case 'filterSession':
        setFilterSession(value !== 'all' ? Number(value) : null);
        break;
      default:
        break;
    }
  };
  
  /**
   * Gestion du changement de recherche
   */
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };
  
  /**
   * Réinitialisation des filtres
   */
  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterCourse(null);
    setFilterType('all');
    setFilterStatus('all');
    setFilterSession(null);
  };
  
  /**
   * Création d'un nouvel examen
   */
  const handleCreateExam = () => {
    navigate('/professor/exams/create');
  };
  
  /**
   * Afficher les détails d'un examen
   */
  const handleViewExam = (id) => {
    navigate(`/professor/exams/${id}`);
  };
  
  /**
   * Modifier un examen
   */
  const handleEditExam = (id) => {
    navigate(`/professor/exams/${id}/edit`);
  };
  
  /**
   * Gérer les étudiants d'un examen
   */
  const handleManageStudents = (id) => {
    navigate(`/professor/exams/${id}/edit`);
  };

  /**
   * Ouvrir le suivi temps reel d'un examen
   */
  const handleMonitorExam = (id) => {
    navigate(`/professor/exams/${id}/monitor`);
  };

  /**
   * Ouvrir le rapport d'integrite d'un examen
   */
  const handleOpenIntegrityReport = (id) => {
    navigate(`/professor/exams/${id}/integrity`);
  };
  
  /**
   * Ouvrir le dialogue de confirmation de suppression
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
    if (!examToDelete) {
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await deleteExamDirect(examToDelete.id);
      
      if (error) {
        throw error;
      }
      
      // Mettre à jour la liste
      setExams(exams.filter(e => e.id !== examToDelete.id));
      setSuccessMessage(`L'examen "${examToDelete.title}" a été supprimé avec succès.`);
      handleCloseDeleteDialog();
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      setError(err.message || 'Une erreur est survenue lors de la suppression de l\'examen');
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Dupliquer un examen
   */
  const handleDuplicateExam = async (exam) => {
    setLoading(true);
    try {
      // Créer une copie de l'examen sans l'ID
      const { id, created_at, updated_at, course, session, center, student_count, ...examData } = exam;
      
      // Modifier certaines données pour la copie
      const newExamData = {
        ...examData,
        title: `Copie de ${examData.title}`,
        status: 'draft', // Toujours créer comme brouillon
        created_at: new Date(),
        updated_at: new Date()
      };
      
      // Insérer le nouvel examen
      const { data: newExam, error } = await insertExam(newExamData);

      if (error) {
        throw error;
      }

      // Si des questions sont associées à l'examen original, les copier
      const { data: questions, error: questionsError } = await getExamQuestions(id);
      
      if (questionsError) {
        throw questionsError;
      }
      
      if (questions && questions.length > 0) {
        // Copier les questions pour le nouvel examen
        const newQuestions = questions.map(({ id: _questionId, ...q }) => ({
          ...q,
          exam_id: newExam.id,
          created_at: new Date(),
          updated_at: new Date()
        }));
        
        const { error: insertQuestionsError } = await insertExamQuestions(newQuestions);
        
        if (insertQuestionsError) {
          throw insertQuestionsError;
        }
      }
      
      await fetchData();
      
      setSuccessMessage(`L'examen "${examData.title}" a été dupliqué avec succès.`);
    } catch (err) {
      console.error('Erreur lors de la duplication:', err);
      setError(err.message || 'Une erreur est survenue lors de la duplication de l\'examen');
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Formater la durée en heures et minutes
   */
  const formatDuration = (minutes) => {
    if (!minutes) {
      return '0 min';
    }
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    return hours > 0 ? `${hours}h${mins > 0 ? ` ${mins}min` : ''}` : `${mins} min`;
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
  
  /**
   * Obtenir le composant Chip pour le statut
   */
  const getStatusChip = (status) => {
    const statusConfig = examStatuses.find(s => s.value === status) || examStatuses[0];
    
    return (
      <Chip 
        label={statusConfig.label} 
        color={/** @type {import('@mui/material').ChipProps['color']} */ (statusConfig.color)} 
        size="small" 
        variant="outlined"
      />
    );
  };

  return (
    <Box sx={{ py: 4, px: 2 }}>
      <Typography variant="h4" gutterBottom>
        Gestion des examens
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
      
      {/* Barre d'outils avec filtres */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <TextField
              label="Rechercher"
              fullWidth
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <FormControl variant="outlined" size="small" fullWidth>
              <InputLabel id="course-filter-label">Cours</InputLabel>
              <Select
                labelId="course-filter-label"
                id="course-filter"
                name="filterCourse"
                value={filterCourse || 'all'}
                onChange={handleFilterChange}
                label="Cours"
              >
                <MenuItem value="all">Tous les cours</MenuItem>
                {courses.map((course) => (
                  <MenuItem key={course.id} value={course.id}>
                    {course.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <FormControl variant="outlined" size="small" fullWidth>
              <InputLabel id="type-filter-label">Type</InputLabel>
              <Select
                labelId="type-filter-label"
                id="type-filter"
                name="filterType"
                value={filterType}
                onChange={handleFilterChange}
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
          
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <FormControl variant="outlined" size="small" fullWidth>
              <InputLabel id="status-filter-label">Statut</InputLabel>
              <Select
                labelId="status-filter-label"
                id="status-filter"
                name="filterStatus"
                value={filterStatus}
                onChange={handleFilterChange}
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
          
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleResetFilters}
                size="small"
                fullWidth
              >
                Réinitialiser
              </Button>
              
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateExam}
                color="primary"
                size="small"
                fullWidth
              >
                Nouveau
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Tableau des examens */}
      <Paper elevation={3} sx={{ width: '100%', overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer sx={{ maxHeight: 650 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell width={300}>Titre</TableCell>
                    <TableCell>Cours</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Durée</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredExams.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography variant="body1" color="textSecondary" sx={{ py: 3 }}>
                          Aucun examen trouvé
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredExams
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((exam) => (
                        <TableRow hover key={exam.id}>
                          <TableCell>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                              {exam.title}
                            </Typography>
                            {exam.description && (
                              <Typography variant="body2" color="textSecondary" noWrap sx={{ maxWidth: 280 }}>
                                {exam.description.substring(0, 60)}
                                {exam.description.length > 60 ? '...' : ''}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <SchoolIcon fontSize="small" color="primary" />
                              <Typography variant="body2">
                                {exam.course?.name || 'Inconnu'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            {examTypes.find(t => t.value === exam.type)?.label || exam.type}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <EventIcon fontSize="small" color="info" />
                              <Typography variant="body2">
                                {formatDate(exam.date)}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{formatDuration(exam.duration)}</TableCell>
                          <TableCell>{getStatusChip(exam.status)}</TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                              <Tooltip title="Voir">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleViewExam(exam.id)}
                                >
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              
                              {exam.status === 'draft' && (
                                <Tooltip title="Modifier">
                                  <IconButton
                                    size="small"
                                    color="secondary"
                                    onClick={() => handleEditExam(exam.id)}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              
                              <Tooltip title="Gérer les étudiants">
                                <IconButton
                                  size="small"
                                  color="info"
                                  onClick={() => handleManageStudents(exam.id)}
                                >
                                  <AssignmentIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>

                              {exam.status !== 'draft' && (
                                <Tooltip title="Suivi temps reel">
                                  <IconButton
                                    size="small"
                                    color="warning"
                                    onClick={() => handleMonitorExam(exam.id)}
                                  >
                                    <AnalyticsIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}

                              {exam.status !== 'draft' && (
                                <Tooltip title="Rapport d'integrite">
                                  <IconButton
                                    size="small"
                                    color="secondary"
                                    onClick={() => handleOpenIntegrityReport(exam.id)}
                                  >
                                    <SecurityIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              
                              <Tooltip title="Dupliquer">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleDuplicateExam(exam)}
                                >
                                  <FileCopyIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              
                              {exam.status === 'draft' && (
                                <Tooltip title="Supprimer">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleOpenDeleteDialog(exam)}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
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
