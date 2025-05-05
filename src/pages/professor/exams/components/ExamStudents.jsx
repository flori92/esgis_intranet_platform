import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  TextField,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon,
  People as PeopleIcon,
  Check as CheckIcon,
  Clear as ClearIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
// Import unique Supabase – toute référence doit passer par '@/services/supabase'
import { supabase } from '@/services/supabase';

/**
 * Composant pour la gestion des étudiants assignés à un examen
 * 
 * @typedef {Object} Student Étudiant
 * @property {number} id ID de l'étudiant
 * @property {string} profile_id ID du profil Supabase
 * @property {string} full_name Nom complet
 * @property {string} email Email
 * @property {string} student_number Numéro d'étudiant
 * @property {number} department_id ID du département
 * @property {string} department_name Nom du département
 * @property {string} level Niveau d'études
 * @property {string} academic_year Année académique
 * @property {string} status Statut de l'étudiant
 * 
 * @typedef {Object} StudentExam Attribution d'un étudiant à un examen
 * @property {number} [id] ID de l'attribution
 * @property {number} exam_id ID de l'examen
 * @property {number} student_id ID de l'étudiant
 * @property {string} [seat_number] Numéro de place
 * @property {string} [attendance_status] Statut de présence ('present', 'absent', 'late')
 * @property {string} [attempt_status] Statut de tentative ('not_started', 'in_progress', 'submitted')
 * @property {boolean} [has_incidents] Indique s'il y a eu des incidents
 * @property {string} [notes] Notes concernant l'étudiant
 * 
 * @param {Object} props Les propriétés du composant
 * @param {number} [props.examId] ID de l'examen
 * @param {number|null} props.courseId ID du cours
 * @param {StudentExam[]} props.assignedStudents Étudiants déjà assignés à l'examen
 * @param {Function} props.setAssignedStudents Fonction pour mettre à jour les étudiants assignés
 * @param {Object} props.errors Erreurs de validation
 */
const ExamStudents = ({
  examId,
  courseId,
  assignedStudents,
  setAssignedStudents,
  errors
}) => {
  // États pour les étudiants
  const [courseStudents, setCourseStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [studentFilter, setStudentFilter] = useState('all');
  
  // États pour la pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // États pour le dialogue d'ajout manuel
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [allStudents, setAllStudents] = useState([]);
  const [addSearchTerm, setAddSearchTerm] = useState('');
  const [filteredAddStudents, setFilteredAddStudents] = useState([]);
  
  // États pour le chargement et les erreurs
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState(null);
  
  /**
   * Obtenir les étudiants inscrits au cours
   */
  useEffect(() => {
    const fetchCourseStudents = async () => {
      if (!courseId) {
        setCourseStudents([]);
        setFilteredStudents([]);
        return;
      }
      
      setLoading(true);
      setLoadingMessage('Chargement des étudiants inscrits au cours...');
      setError(null);
      
      try {
        const { data, error } = await supabase
          .from('student_courses')
          .select(`
            student_id,
            students:student_id(
              id,
              profile_id,
              profiles:profile_id(full_name, email),
              student_number,
              department_id,
              departments:department_id(name),
              level,
              academic_year,
              status
            )
          `)
          .eq('course_id', courseId)
          .eq('is_active', true);
        
        if (error) throw error;
        
        if (data) {
          const students = data.map(item => ({
            id: item.students.id,
            profile_id: item.students.profile_id,
            full_name: item.students.profiles.full_name,
            email: item.students.profiles.email,
            student_number: item.students.student_number,
            department_id: item.students.department_id,
            department_name: item.students.departments?.name || 'N/A',
            level: item.students.level,
            academic_year: item.students.academic_year,
            status: item.students.status
          }));
          
          setCourseStudents(students);
          setFilteredStudents(students);
        }
      } catch (err) {
        console.error('Erreur lors du chargement des étudiants du cours:', err);
        setError('Impossible de charger les étudiants inscrits au cours.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourseStudents();
  }, [courseId]);
  
  // Filtrer les étudiants en fonction de la recherche et du filtre
  useEffect(() => {
    if (!courseStudents.length) {
      setFilteredStudents([]);
      return;
    }
    
    let filtered = [...courseStudents];
    
    // Appliquer le filtre de recherche
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(student => 
        student.full_name.toLowerCase().includes(searchLower) ||
        student.email.toLowerCase().includes(searchLower) ||
        student.student_number.toLowerCase().includes(searchLower)
      );
    }
    
    // Appliquer le filtre de statut
    if (studentFilter !== 'all') {
      if (studentFilter === 'assigned') {
        const assignedIds = assignedStudents.map(a => a.student_id);
        filtered = filtered.filter(student => assignedIds.includes(student.id));
      } else if (studentFilter === 'not_assigned') {
        const assignedIds = assignedStudents.map(a => a.student_id);
        filtered = filtered.filter(student => !assignedIds.includes(student.id));
      }
    }
    
    setFilteredStudents(filtered);
    setPage(0); // Réinitialiser la page lors du filtrage
  }, [courseStudents, searchTerm, studentFilter, assignedStudents]);
  
  /**
   * Charger tous les étudiants pour l'ajout manuel
   */
  const loadAllStudents = async () => {
    setLoading(true);
    setLoadingMessage('Chargement de tous les étudiants...');
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          id,
          profile_id,
          profiles:profile_id(full_name, email),
          student_number,
          department_id,
          departments:department_id(name),
          level,
          academic_year,
          status
        `)
        .eq('status', 'active')
        .order('full_name', { foreignTable: 'profiles' });
      
      if (error) throw error;
      
      if (data) {
        const students = data.map(item => ({
          id: item.id,
          profile_id: item.profile_id,
          full_name: item.profiles.full_name,
          email: item.profiles.email,
          student_number: item.student_number,
          department_id: item.department_id,
          department_name: item.departments?.name || 'N/A',
          level: item.level,
          academic_year: item.academic_year,
          status: item.status
        }));
        
        setAllStudents(students);
        setFilteredAddStudents(students);
      }
    } catch (err) {
      console.error('Erreur lors du chargement de tous les étudiants:', err);
      setError('Impossible de charger la liste complète des étudiants.');
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Ouvrir le dialogue d'ajout manuel
   */
  const handleOpenAddDialog = () => {
    setIsDialogOpen(true);
    setSelectedStudents([]);
    setAddSearchTerm('');
    loadAllStudents();
  };
  
  /**
   * Fermer le dialogue d'ajout manuel
   */
  const handleCloseAddDialog = () => {
    setIsDialogOpen(false);
    setSelectedStudents([]);
    setFilteredAddStudents([]);
  };
  
  // Filtrer les étudiants dans le dialogue d'ajout
  useEffect(() => {
    if (!allStudents.length) {
      setFilteredAddStudents([]);
      return;
    }
    
    if (!addSearchTerm.trim()) {
      setFilteredAddStudents(allStudents);
      return;
    }
    
    const searchLower = addSearchTerm.toLowerCase();
    const filtered = allStudents.filter(student => 
      student.full_name.toLowerCase().includes(searchLower) ||
      student.email.toLowerCase().includes(searchLower) ||
      student.student_number.toLowerCase().includes(searchLower)
    );
    
    setFilteredAddStudents(filtered);
  }, [allStudents, addSearchTerm]);
  
  /**
   * Gestion de la pagination
   */
  const handleChangePage = (_event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  /**
   * Gestion des sélections
   */
  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelecteds = filteredAddStudents
        .filter(s => !assignedStudents.some(a => a.student_id === s.id))
        .map(s => s.id);
      setSelectedStudents(newSelecteds);
      return;
    }
    setSelectedStudents([]);
  };
  
  const handleSelectStudent = (id) => {
    const selectedIndex = selectedStudents.indexOf(id);
    let newSelected = [];
    
    if (selectedIndex === -1) {
      // Ajouter à la sélection si l'étudiant n'est pas déjà assigné
      const isAlreadyAssigned = assignedStudents.some(s => s.student_id === id);
      if (!isAlreadyAssigned) {
        newSelected = [...selectedStudents, id];
      } else {
        newSelected = [...selectedStudents];
      }
    } else {
      newSelected = selectedStudents.filter(studentId => studentId !== id);
    }
    
    setSelectedStudents(newSelected);
  };
  
  const isSelected = (id) => selectedStudents.indexOf(id) !== -1;
  
  /**
   * Assigner les étudiants sélectionnés à l'examen
   */
  const handleAssignStudents = () => {
    if (selectedStudents.length === 0 || !examId) return;
    
    const newAssignments = selectedStudents.map(studentId => ({
      exam_id: examId,
      student_id: studentId,
      seat_number: null,
      attendance_status: null,
      attempt_status: 'not_started',
      has_incidents: false,
      notes: null
    }));
    
    // Filtrer pour ne pas ajouter de doublons
    const currentStudentIds = assignedStudents.map(a => a.student_id);
    const uniqueNewAssignments = newAssignments.filter(
      a => !currentStudentIds.includes(a.student_id)
    );
    
    setAssignedStudents([...assignedStudents, ...uniqueNewAssignments]);
    setSelectedStudents([]);
  };
  
  /**
   * Ajouter des étudiants depuis le dialogue
   */
  const handleAddStudents = () => {
    if (selectedStudents.length === 0) {
      handleCloseAddDialog();
      return;
    }
    
    const newAssignments = selectedStudents.map(studentId => ({
      exam_id: examId || 0, // Si examId est undefined (création), utiliser 0 temporairement
      student_id: studentId,
      seat_number: null,
      attendance_status: null,
      attempt_status: 'not_started',
      has_incidents: false,
      notes: null
    }));
    
    // Filtrer pour ne pas ajouter de doublons
    const currentStudentIds = assignedStudents.map(a => a.student_id);
    const uniqueNewAssignments = newAssignments.filter(
      a => !currentStudentIds.includes(a.student_id)
    );
    
    setAssignedStudents([...assignedStudents, ...uniqueNewAssignments]);
    handleCloseAddDialog();
  };
  
  /**
   * Supprimer des étudiants assignés
   */
  const handleRemoveStudent = (studentId) => {
    setAssignedStudents(
      assignedStudents.filter(student => student.student_id !== studentId)
    );
  };
  
  /**
   * Assigner tous les étudiants du cours
   */
  const handleAssignAllCourseStudents = () => {
    if (!courseStudents.length || !examId) return;
    
    // Filtrer pour ne pas ajouter de doublons
    const currentStudentIds = assignedStudents.map(a => a.student_id);
    const newStudents = courseStudents.filter(
      student => !currentStudentIds.includes(student.id)
    );
    
    const newAssignments = newStudents.map(student => ({
      exam_id: examId,
      student_id: student.id,
      seat_number: null,
      attendance_status: null,
      attempt_status: 'not_started',
      has_incidents: false,
      notes: null
    }));
    
    setAssignedStudents([...assignedStudents, ...newAssignments]);
  };
  
  /**
   * Générer des numéros de place
   */
  const handleGenerateSeatNumbers = () => {
    if (!assignedStudents.length) return;
    
    // Générer des numéros séquentiels
    const updatedAssignments = [...assignedStudents].map((student, index) => ({
      ...student,
      seat_number: `${index + 1}`.padStart(3, '0') // Format: 001, 002, etc.
    }));
    
    setAssignedStudents(updatedAssignments);
  };
  
  /**
   * Supprimer tous les étudiants assignés
   */
  const handleRemoveAllStudents = () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer tous les étudiants assignés ?')) {
      setAssignedStudents([]);
    }
  };
  
  /**
   * Trouver un étudiant par ID
   */
  const findStudentById = (id) => {
    // D'abord chercher dans les étudiants du cours
    let student = courseStudents.find(s => s.id === id);
    
    // Si non trouvé, chercher dans tous les étudiants
    if (!student) {
      student = allStudents.find(s => s.id === id);
    }
    
    return student;
  };
  
  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Étudiants assignés
          <Chip 
            label={`${assignedStudents.length} étudiant(s)`} 
            color="primary" 
            size="small" 
            sx={{ ml: 2 }} 
          />
        </Typography>
        
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<PersonAddIcon />}
            onClick={handleOpenAddDialog}
            sx={{ mr: 1 }}
          >
            Ajouter manuellement
          </Button>
          
          {courseId && (
            <Button 
              variant="contained" 
              color="primary"
              startIcon={<PeopleIcon />}
              onClick={handleAssignAllCourseStudents}
              disabled={!courseStudents.length}
            >
              Assigner tous les étudiants du cours
            </Button>
          )}
        </Box>
      </Box>
      
      {errors.students && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errors.students}
        </Alert>
      )}
      
      {assignedStudents.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TextField
                placeholder="Rechercher un étudiant..."
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ mr: 2, minWidth: '250px' }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
              />
              
              <FormControl size="small" sx={{ minWidth: '200px' }}>
                <InputLabel id="student-filter-label">Filtre</InputLabel>
                <Select
                  labelId="student-filter-label"
                  value={studentFilter}
                  onChange={(e) => setStudentFilter(e.target.value)}
                  label="Filtre"
                >
                  <MenuItem value="all">Tous les étudiants</MenuItem>
                  <MenuItem value="assigned">Assignés à l'examen</MenuItem>
                  <MenuItem value="not_assigned">Non assignés</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            <Box>
              <Button 
                color="primary"
                onClick={handleGenerateSeatNumbers}
                sx={{ mr: 1 }}
              >
                Générer des numéros de place
              </Button>
              
              <Button 
                variant="outlined" 
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleRemoveAllStudents}
              >
                Supprimer tous
              </Button>
            </Box>
          </Box>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Numéro étudiant</TableCell>
                  <TableCell>Nom</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Départment</TableCell>
                  <TableCell>N° de place</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStudents
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((student) => {
                    const assignedStudent = assignedStudents.find(
                      a => a.student_id === student.id
                    );
                    
                    return assignedStudent ? (
                      <TableRow key={student.id}>
                        <TableCell>{student.student_number}</TableCell>
                        <TableCell>{student.full_name}</TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>{student.department_name}</TableCell>
                        <TableCell>{assignedStudent.seat_number || '-'}</TableCell>
                        <TableCell>
                          <Chip 
                            label={assignedStudent.attempt_status || 'Non commencé'} 
                            color={assignedStudent.attempt_status === 'submitted' ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton 
                            color="error" 
                            onClick={() => handleRemoveStudent(student.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ) : null;
                  })}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            component="div"
            count={filteredStudents.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Lignes par page:"
            rowsPerPageOptions={[5, 10, 25, 50]}
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
          />
        </Box>
      )}
      
      {assignedStudents.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="textSecondary">
            Aucun étudiant n'a été assigné à cet examen.
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Utilisez les boutons ci-dessus pour assigner des étudiants à l'examen.
          </Typography>
        </Box>
      )}
      
      {loading && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="body2" color="textSecondary">
            {loadingMessage}
          </Typography>
        </Box>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* Dialogue d'ajout manuel d'étudiants */}
      <Dialog 
        open={isDialogOpen} 
        onClose={handleCloseAddDialog}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Ajouter des étudiants à l'examen</DialogTitle>
        
        <DialogContent>
          <DialogContentText paragraph>
            Sélectionnez les étudiants que vous souhaitez ajouter à cet examen.
            Les étudiants déjà assignés sont indiqués en vert.
          </DialogContentText>
          
          <TextField
            fullWidth
            placeholder="Rechercher par nom, email ou numéro d'étudiant..."
            variant="outlined"
            value={addSearchTerm}
            onChange={(e) => setAddSearchTerm(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
          
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
              <CircularProgress />
            </Box>
          )}
          
          {!loading && filteredAddStudents.length === 0 && (
            <Typography variant="body1" sx={{ textAlign: 'center', py: 3 }}>
              Aucun étudiant trouvé. Modifiez votre recherche.
            </Typography>
          )}
          
          {!loading && filteredAddStudents.length > 0 && (
            <TableContainer sx={{ maxHeight: '50vh' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={selectedStudents.length > 0 && selectedStudents.length < filteredAddStudents.length}
                        checked={filteredAddStudents.length > 0 && selectedStudents.length === filteredAddStudents.length}
                        onChange={handleSelectAllClick}
                      />
                    </TableCell>
                    <TableCell>Numéro</TableCell>
                    <TableCell>Nom complet</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Département</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAddStudents.slice(0, 100).map((student) => {
                    const isItemSelected = isSelected(student.id);
                    const isAssigned = assignedStudents.some(
                      assigned => assigned.student_id === student.id
                    );
                    
                    return (
                      <TableRow
                        key={student.id}
                        hover
                        onClick={() => handleSelectStudent(student.id)}
                        selected={isItemSelected}
                        sx={{ 
                          cursor: 'pointer',
                          backgroundColor: isAssigned ? 'rgba(0, 200, 83, 0.08)' : 'inherit'
                        }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={isItemSelected}
                            disabled={isAssigned}
                          />
                        </TableCell>
                        <TableCell>{student.student_number}</TableCell>
                        <TableCell>{student.full_name}</TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>{student.department_name}</TableCell>
                        <TableCell>
                          {isAssigned ? (
                            <Chip 
                              label="Déjà assigné" 
                              size="small" 
                              color="success" 
                              variant="outlined"
                            />
                          ) : (
                            <Chip 
                              label={student.status} 
                              size="small" 
                              color="default" 
                              variant="outlined"
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredAddStudents.length > 100 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography variant="body2" color="textSecondary">
                          {filteredAddStudents.length - 100} étudiants supplémentaires. Affinez votre recherche pour voir plus de résultats.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddDialog}>
            Annuler
          </Button>
          <Button 
            onClick={handleAddStudents} 
            variant="contained" 
            color="primary"
            disabled={selectedStudents.length === 0}
          >
            Ajouter les étudiants sélectionnés ({selectedStudents.length})
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ExamStudents;
