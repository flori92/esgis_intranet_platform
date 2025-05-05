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
import { supabase } from '../../../../utils/supabase';

/**
 * Composant pour la gestion des étudiants assignés à un examen
 * 
 * @param {Object} props - Propriétés du composant
 * @param {number} [props.examId] - ID de l'examen
 * @param {number|null} props.courseId - ID du cours
 * @param {Array<Object>} props.assignedStudents - Liste des étudiants assignés à l'examen
 * @param {Function} props.setAssignedStudents - Fonction pour mettre à jour la liste des étudiants assignés
 * @param {Object} props.errors - Erreurs de validation
 * @returns {JSX.Element} Composant de gestion des étudiants d'examen
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
          department_name: item.students.departments.name,
          level: item.students.level,
          academic_year: item.students.academic_year,
          status: item.students.status
        }));
        
        setCourseStudents(students);
        setFilteredStudents(students);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des étudiants:', err);
      setError('Impossible de charger les étudiants. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };
  
  // Charger les étudiants du cours lorsque courseId change
  useEffect(() => {
    fetchCourseStudents();
  }, [courseId]);
  
  // Filtrer les étudiants lorsque searchTerm ou studentFilter change
  useEffect(() => {
    if (!courseStudents.length) {
      setFilteredStudents([]);
      return;
    }
    
    let filtered = [...courseStudents];
    
    // Filtrer par terme de recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(student => 
        student.full_name.toLowerCase().includes(term) ||
        student.email.toLowerCase().includes(term) ||
        student.student_number.toLowerCase().includes(term)
      );
    }
    
    // Filtrer par statut d'assignation
    if (studentFilter === 'assigned') {
      filtered = filtered.filter(student => 
        assignedStudents.some(assigned => assigned.student_id === student.id)
      );
    } else if (studentFilter === 'not_assigned') {
      filtered = filtered.filter(student => 
        !assignedStudents.some(assigned => assigned.student_id === student.id)
      );
    }
    
    setFilteredStudents(filtered);
    setPage(0); // Réinitialiser la pagination
  }, [courseStudents, searchTerm, studentFilter, assignedStudents]);
  
  // Filtrer les étudiants du dialogue d'ajout lorsque addSearchTerm change
  useEffect(() => {
    if (!allStudents.length) {
      setFilteredAddStudents([]);
      return;
    }
    
    if (!addSearchTerm) {
      setFilteredAddStudents(allStudents);
      return;
    }
    
    const term = addSearchTerm.toLowerCase();
    const filtered = allStudents.filter(student => 
      student.full_name.toLowerCase().includes(term) ||
      student.email.toLowerCase().includes(term) ||
      student.student_number.toLowerCase().includes(term)
    );
    
    setFilteredAddStudents(filtered);
  }, [allStudents, addSearchTerm]);
  
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
        .order('student_number', { ascending: true });
      
      if (error) throw error;
      
      if (data) {
        const students = data.map(item => ({
          id: item.id,
          profile_id: item.profile_id,
          full_name: item.profiles.full_name,
          email: item.profiles.email,
          student_number: item.student_number,
          department_id: item.department_id,
          department_name: item.departments.name,
          level: item.level,
          academic_year: item.academic_year,
          status: item.status
        }));
        
        setAllStudents(students);
        setFilteredAddStudents(students);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des étudiants:', err);
      setError('Impossible de charger tous les étudiants. Veuillez réessayer.');
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
    
    if (allStudents.length === 0) {
      loadAllStudents();
    }
  };
  
  /**
   * Fermer le dialogue d'ajout manuel
   */
  const handleCloseAddDialog = () => {
    setIsDialogOpen(false);
    setSelectedStudents([]);
    setAddSearchTerm('');
  };
  
  /**
   * Gestion de la pagination
   * @param {Object} _event - Événement de changement de page
   * @param {number} newPage - Nouvelle page
   */
  const handleChangePage = (_event, newPage) => {
    setPage(newPage);
  };
  
  /**
   * Gestion du nombre de lignes par page
   * @param {Object} event - Événement de changement de lignes par page
   */
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  /**
   * Gestion de la sélection de tous les étudiants
   * @param {Object} event - Événement de changement de case à cocher
   */
  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = filteredAddStudents
        .filter(student => !assignedStudents.some(assigned => assigned.student_id === student.id))
        .map(student => student.id);
      setSelectedStudents(newSelected);
      return;
    }
    setSelectedStudents([]);
  };
  
  /**
   * Gestion de la sélection d'un étudiant
   * @param {number} id - ID de l'étudiant
   */
  const handleSelectStudent = (id) => {
    const isAssigned = assignedStudents.some(assigned => assigned.student_id === id);
    if (isAssigned) return;
    
    const selectedIndex = selectedStudents.indexOf(id);
    let newSelected = [];
    
    if (selectedIndex === -1) {
      newSelected = [...selectedStudents, id];
    } else {
      newSelected = selectedStudents.filter(studentId => studentId !== id);
    }
    
    setSelectedStudents(newSelected);
  };
  
  /**
   * Vérifier si un étudiant est sélectionné
   * @param {number} id - ID de l'étudiant
   * @returns {boolean} true si l'étudiant est sélectionné, false sinon
   */
  const isSelected = (id) => selectedStudents.indexOf(id) !== -1;
  
  /**
   * Assigner les étudiants sélectionnés à l'examen
   */
  const handleAssignStudents = () => {
    const newAssignedStudents = [...assignedStudents];
    
    // Ajouter les étudiants sélectionnés qui ne sont pas déjà assignés
    selectedStudents.forEach(studentId => {
      if (!newAssignedStudents.some(assigned => assigned.student_id === studentId)) {
        newAssignedStudents.push({
          exam_id: examId || 0, // Sera mis à jour après la création de l'examen
          student_id: studentId,
          seat_number: null,
          attendance_status: null,
          attempt_status: null,
          has_incidents: false,
          notes: null
        });
      }
    });
    
    setAssignedStudents(newAssignedStudents);
    setSelectedStudents([]);
  };
  
  /**
   * Ajouter des étudiants depuis le dialogue
   */
  const handleAddStudents = () => {
    const newAssignedStudents = [...assignedStudents];
    
    // Ajouter les étudiants sélectionnés qui ne sont pas déjà assignés
    selectedStudents.forEach(studentId => {
      if (!newAssignedStudents.some(assigned => assigned.student_id === studentId)) {
        newAssignedStudents.push({
          exam_id: examId || 0, // Sera mis à jour après la création de l'examen
          student_id: studentId,
          seat_number: null,
          attendance_status: null,
          attempt_status: null,
          has_incidents: false,
          notes: null
        });
      }
    });
    
    setAssignedStudents(newAssignedStudents);
    handleCloseAddDialog();
  };
  
  /**
   * Supprimer des étudiants assignés
   * @param {number} studentId - ID de l'étudiant à supprimer
   */
  const handleRemoveStudent = (studentId) => {
    const newAssignedStudents = assignedStudents.filter(
      student => student.student_id !== studentId
    );
    setAssignedStudents(newAssignedStudents);
  };
  
  /**
   * Assigner tous les étudiants du cours
   */
  const handleAssignAllCourseStudents = () => {
    const newAssignedStudents = [...assignedStudents];
    
    // Ajouter tous les étudiants du cours qui ne sont pas déjà assignés
    courseStudents.forEach(student => {
      if (!newAssignedStudents.some(assigned => assigned.student_id === student.id)) {
        newAssignedStudents.push({
          exam_id: examId || 0, // Sera mis à jour après la création de l'examen
          student_id: student.id,
          seat_number: null,
          attendance_status: null,
          attempt_status: null,
          has_incidents: false,
          notes: null
        });
      }
    });
    
    setAssignedStudents(newAssignedStudents);
  };
  
  /**
   * Générer des numéros de place
   */
  const handleGenerateSeatNumbers = () => {
    if (assignedStudents.length === 0) return;
    
    const newAssignedStudents = [...assignedStudents];
    
    // Générer des numéros de place séquentiels
    newAssignedStudents.forEach((student, index) => {
      student.seat_number = `${index + 1}`;
    });
    
    setAssignedStudents(newAssignedStudents);
  };
  
  /**
   * Supprimer tous les étudiants assignés
   */
  const handleRemoveAllStudents = () => {
    setAssignedStudents([]);
  };
  
  /**
   * Trouver un étudiant par ID
   * @param {number} id - ID de l'étudiant
   * @returns {Object|undefined} Étudiant trouvé ou undefined
   */
  const findStudentById = (id) => {
    // Chercher d'abord dans les étudiants du cours
    let student = courseStudents.find(student => student.id === id);
    
    // Si non trouvé, chercher dans tous les étudiants
    if (!student && allStudents.length > 0) {
      student = allStudents.find(student => student.id === id);
    }
    
    return student;
  };
  
  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Étudiants assignés à l'examen
        </Typography>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<PeopleIcon />}
            onClick={handleAssignAllCourseStudents}
            disabled={!courseId || courseStudents.length === 0}
            sx={{ mr: 1 }}
          >
            Assigner tous les étudiants du cours
          </Button>
          <Button 
            variant="contained" 
            startIcon={<PersonAddIcon />}
            onClick={handleOpenAddDialog}
          >
            Ajouter des étudiants
          </Button>
        </Box>
      </Box>
      
      {errors.students && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errors.students}
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <Typography variant="body2" color="textSecondary">
            {loadingMessage}
          </Typography>
        </Box>
      ) : (
        <>
          {/* Actions pour les étudiants assignés */}
          {assignedStudents.length > 0 && (
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Box>
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={handleGenerateSeatNumbers}
                  sx={{ mr: 1 }}
                >
                  Générer des numéros de place
                </Button>
                <Button 
                  variant="outlined" 
                  color="error" 
                  size="small"
                  onClick={handleRemoveAllStudents}
                >
                  Supprimer tous les étudiants
                </Button>
              </Box>
              <Typography variant="body2" color="textSecondary">
                {assignedStudents.length} étudiant{assignedStudents.length > 1 ? 's' : ''} assigné{assignedStudents.length > 1 ? 's' : ''}
              </Typography>
            </Box>
          )}
          
          {/* Tableau des étudiants assignés */}
          {assignedStudents.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Numéro</TableCell>
                    <TableCell>Nom complet</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Place</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assignedStudents.map((assigned) => {
                    const student = findStudentById(assigned.student_id);
                    
                    if (!student) return null;
                    
                    return (
                      <TableRow key={assigned.student_id}>
                        <TableCell>{student.student_number}</TableCell>
                        <TableCell>{student.full_name}</TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>{assigned.seat_number || '-'}</TableCell>
                        <TableCell align="right">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleRemoveStudent(assigned.student_id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography color="textSecondary">
                Aucun étudiant n'a été assigné à cet examen.
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Utilisez les boutons ci-dessus pour ajouter des étudiants.
              </Typography>
            </Box>
          )}
          
          {/* Filtres pour les étudiants du cours */}
          {courseId && courseStudents.length > 0 && (
            <Box sx={{ mt: 4, mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Étudiants inscrits au cours
              </Typography>
              
              <Box sx={{ display: 'flex', mb: 2 }}>
                <TextField
                  placeholder="Rechercher un étudiant..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  size="small"
                  sx={{ mr: 2, flexGrow: 1 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
                
                <FormControl size="small" sx={{ width: 200 }}>
                  <InputLabel>Filtre</InputLabel>
                  <Select
                    value={studentFilter}
                    onChange={(e) => setStudentFilter(e.target.value)}
                    label="Filtre"
                    startAdornment={
                      <InputAdornment position="start">
                        <FilterListIcon fontSize="small" />
                      </InputAdornment>
                    }
                  >
                    <MenuItem value="all">Tous les étudiants</MenuItem>
                    <MenuItem value="assigned">Étudiants assignés</MenuItem>
                    <MenuItem value="not_assigned">Étudiants non assignés</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              
              {/* Tableau des étudiants du cours */}
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Numéro</TableCell>
                      <TableCell>Nom complet</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Statut</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredStudents
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((student) => {
                        const isAssigned = assignedStudents.some(
                          assigned => assigned.student_id === student.id
                        );
                        
                        return (
                          <TableRow key={student.id}>
                            <TableCell>{student.student_number}</TableCell>
                            <TableCell>{student.full_name}</TableCell>
                            <TableCell>{student.email}</TableCell>
                            <TableCell>
                              {isAssigned ? (
                                <Chip 
                                  label="Assigné" 
                                  size="small" 
                                  color="primary" 
                                  icon={<CheckIcon />}
                                />
                              ) : (
                                <Chip 
                                  label="Non assigné" 
                                  size="small" 
                                  variant="outlined"
                                  icon={<ClearIcon />}
                                />
                              )}
                            </TableCell>
                            <TableCell align="right">
                              {isAssigned ? (
                                <Button
                                  size="small"
                                  color="error"
                                  onClick={() => handleRemoveStudent(student.id)}
                                >
                                  Retirer
                                </Button>
                              ) : (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<AddIcon />}
                                  onClick={() => {
                                    setSelectedStudents([student.id]);
                                    handleAssignStudents();
                                  }}
                                >
                                  Assigner
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <TablePagination
                component="div"
                count={filteredStudents.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25, 50]}
                labelRowsPerPage="Lignes par page:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
              />
            </Box>
          )}
        </>
      )}
      
      {/* Dialogue d'ajout manuel d'étudiants */}
      <Dialog
        open={isDialogOpen}
        onClose={handleCloseAddDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Ajouter des étudiants à l'examen</DialogTitle>
        
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Recherchez et sélectionnez les étudiants à ajouter à l'examen.
          </DialogContentText>
          
          <TextField
            fullWidth
            placeholder="Rechercher par nom, email ou numéro d'étudiant..."
            value={addSearchTerm}
            onChange={(e) => setAddSearchTerm(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer sx={{ maxHeight: 400 }}>
              <Table stickyHeader size="small">
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
