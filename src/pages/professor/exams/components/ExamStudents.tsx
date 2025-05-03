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

// Types
interface Student {
  id: number;
  profile_id: string;
  full_name: string;
  email: string;
  student_number: string;
  department_id: number;
  department_name: string;
  level: string;
  academic_year: string;
  status: string;
}

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

interface ExamStudentsProps {
  examId?: number;
  courseId: number | null;
  assignedStudents: StudentExam[];
  setAssignedStudents: (students: StudentExam[]) => void;
  errors: {
    students?: string;
  };
}

/**
 * Composant pour la gestion des étudiants assignés à un examen
 */
const ExamStudents: React.FC<ExamStudentsProps> = ({
  examId,
  courseId,
  assignedStudents,
  setAssignedStudents,
  errors
}) => {
  // États pour les étudiants
  const [courseStudents, setCourseStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [studentFilter, setStudentFilter] = useState('all');
  
  // États pour la pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // États pour le dialogue d'ajout manuel
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [addSearchTerm, setAddSearchTerm] = useState('');
  const [filteredAddStudents, setFilteredAddStudents] = useState<Student[]>([]);
  
  // États pour le chargement et les erreurs
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Obtenir les étudiants inscrits au cours
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
          const students: Student[] = data.map(item => ({
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
        setError('Une erreur est survenue lors du chargement des étudiants du cours.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourseStudents();
  }, [courseId]);
  
  // Filtrer les étudiants
  useEffect(() => {
    if (!courseStudents.length) {
      setFilteredStudents([]);
      return;
    }
    
    let filtered = [...courseStudents];
    
    // Filtre par terme de recherche
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(student => 
        student.full_name.toLowerCase().includes(searchLower) ||
        student.student_number.toLowerCase().includes(searchLower) ||
        student.email.toLowerCase().includes(searchLower)
      );
    }
    
    // Filtre par statut d'assignation
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
  
  // Charger tous les étudiants pour l'ajout manuel
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
        .eq('status', 'active');
      
      if (error) throw error;
      
      if (data) {
        const students: Student[] = data.map(item => ({
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
      setError('Une erreur est survenue lors du chargement de tous les étudiants.');
    } finally {
      setLoading(false);
    }
  };
  
  // Ouvrir le dialogue d'ajout manuel
  const handleOpenAddDialog = () => {
    if (allStudents.length === 0) {
      loadAllStudents();
    }
    setIsDialogOpen(true);
  };
  
  // Fermer le dialogue d'ajout manuel
  const handleCloseAddDialog = () => {
    setIsDialogOpen(false);
    setAddSearchTerm('');
    setFilteredAddStudents(allStudents);
  };
  
  // Filtrer les étudiants dans le dialogue d'ajout
  useEffect(() => {
    if (!addSearchTerm) {
      setFilteredAddStudents(allStudents);
      return;
    }
    
    const searchLower = addSearchTerm.toLowerCase();
    const filtered = allStudents.filter(student => 
      student.full_name.toLowerCase().includes(searchLower) ||
      student.student_number.toLowerCase().includes(searchLower) ||
      student.email.toLowerCase().includes(searchLower)
    );
    
    setFilteredAddStudents(filtered);
  }, [addSearchTerm, allStudents]);
  
  // Gestion de la pagination
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Gestion des sélections
  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = filteredStudents.map(student => student.id);
      setSelectedStudents(newSelected);
      return;
    }
    setSelectedStudents([]);
  };
  
  const handleSelectStudent = (id: number) => {
    const selectedIndex = selectedStudents.indexOf(id);
    let newSelected: number[] = [];
    
    if (selectedIndex === -1) {
      newSelected = [...selectedStudents, id];
    } else {
      newSelected = selectedStudents.filter(studentId => studentId !== id);
    }
    
    setSelectedStudents(newSelected);
  };
  
  const isSelected = (id: number) => selectedStudents.indexOf(id) !== -1;
  
  // Assigner les étudiants sélectionnés à l'examen
  const handleAssignStudents = () => {
    if (selectedStudents.length === 0) return;
    
    const newAssignments: StudentExam[] = selectedStudents
      .filter(studentId => !assignedStudents.some(assigned => assigned.student_id === studentId))
      .map(studentId => ({
        exam_id: examId || 0,
        student_id: studentId,
        seat_number: null,
        attendance_status: null,
        attempt_status: 'not_started',
        has_incidents: false,
        notes: null
      }));
    
    if (newAssignments.length > 0) {
      setAssignedStudents([...assignedStudents, ...newAssignments]);
    }
    
    setSelectedStudents([]);
  };
  
  // Ajouter des étudiants depuis le dialogue
  const handleAddStudents = () => {
    if (selectedStudents.length === 0) return;
    
    const newAssignments: StudentExam[] = selectedStudents
      .filter(studentId => !assignedStudents.some(assigned => assigned.student_id === studentId))
      .map(studentId => ({
        exam_id: examId || 0,
        student_id: studentId,
        seat_number: null,
        attendance_status: null,
        attempt_status: 'not_started',
        has_incidents: false,
        notes: null
      }));
    
    if (newAssignments.length > 0) {
      setAssignedStudents([...assignedStudents, ...newAssignments]);
    }
    
    setSelectedStudents([]);
    handleCloseAddDialog();
  };
  
  // Supprimer des étudiants assignés
  const handleRemoveStudent = (studentId: number) => {
    setAssignedStudents(assignedStudents.filter(
      assigned => assigned.student_id !== studentId
    ));
  };
  
  // Assigner tous les étudiants du cours
  const handleAssignAllCourseStudents = () => {
    const newAssignments: StudentExam[] = courseStudents
      .filter(student => !assignedStudents.some(assigned => assigned.student_id === student.id))
      .map(student => ({
        exam_id: examId || 0,
        student_id: student.id,
        seat_number: null,
        attendance_status: null,
        attempt_status: 'not_started',
        has_incidents: false,
        notes: null
      }));
    
    if (newAssignments.length > 0) {
      setAssignedStudents([...assignedStudents, ...newAssignments]);
    }
  };
  
  // Générer des numéros de place
  const handleGenerateSeatNumbers = () => {
    if (assignedStudents.length === 0) return;
    
    // Trier les étudiants par ID pour stabilité
    const sortedStudents = [...assignedStudents].sort((a, b) => a.student_id - b.student_id);
    
    // Attribuer des numéros de place séquentiels
    const withSeatNumbers = sortedStudents.map((student, index) => ({
      ...student,
      seat_number: (index + 1).toString().padStart(3, '0') // Format: 001, 002, etc.
    }));
    
    setAssignedStudents(withSeatNumbers);
  };
  
  // Supprimer tous les étudiants assignés
  const handleRemoveAllStudents = () => {
    setAssignedStudents([]);
  };
  
  // Trouver un étudiant par ID
  const findStudentById = (id: number): Student | undefined => {
    // Chercher d'abord dans les étudiants du cours
    let student = courseStudents.find(s => s.id === id);
    
    // Si non trouvé, chercher dans tous les étudiants
    if (!student) {
      student = allStudents.find(s => s.id === id);
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
          <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'right', mb: 1 }}>
            {assignedStudents.length} étudiant{assignedStudents.length !== 1 ? 's' : ''} assigné{assignedStudents.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
      </Box>
      
      {errors.students && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errors.students}
        </Alert>
      )}
      
      {/* Outils de gestion des étudiants */}
      <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        <Button
          variant="outlined"
          startIcon={<PeopleIcon />}
          onClick={handleAssignAllCourseStudents}
          disabled={!courseId || courseStudents.length === 0}
        >
          Assigner tous les étudiants du cours
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<PersonAddIcon />}
          onClick={handleOpenAddDialog}
        >
          Ajouter des étudiants manuellement
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<CheckIcon />}
          onClick={handleGenerateSeatNumbers}
          disabled={assignedStudents.length === 0}
        >
          Générer les numéros de place
        </Button>
        
        {assignedStudents.length > 0 && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<ClearIcon />}
            onClick={handleRemoveAllStudents}
          >
            Supprimer tous les étudiants
          </Button>
        )}
      </Box>
      
      {/* Liste des étudiants du cours */}
      {courseId && (
        <Box sx={{ mb: 4 }}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Étudiants inscrits au cours
            </Typography>
            
            <Box sx={{ display: 'flex', mb: 2, gap: 2 }}>
              <TextField
                placeholder="Rechercher un étudiant..."
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ flexGrow: 1 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
              />
              
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Filtre</InputLabel>
                <Select
                  value={studentFilter}
                  onChange={(e) => setStudentFilter(e.target.value)}
                  label="Filtre"
                  IconComponent={FilterListIcon}
                >
                  <MenuItem value="all">Tous les étudiants</MenuItem>
                  <MenuItem value="assigned">Déjà assignés</MenuItem>
                  <MenuItem value="not_assigned">Non assignés</MenuItem>
                </Select>
              </FormControl>
              
              <Button
                variant="contained"
                onClick={handleAssignStudents}
                disabled={selectedStudents.length === 0}
                startIcon={<AddIcon />}
              >
                Assigner ({selectedStudents.length})
              </Button>
            </Box>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={24} sx={{ mr: 1 }} />
                <Typography>{loadingMessage}</Typography>
              </Box>
            ) : error ? (
              <Alert severity="error">{error}</Alert>
            ) : filteredStudents.length === 0 ? (
              <Typography variant="body2" sx={{ p: 2, textAlign: 'center' }}>
                {courseStudents.length === 0 
                  ? 'Aucun étudiant n\'est inscrit à ce cours.' 
                  : 'Aucun étudiant ne correspond aux critères de recherche.'}
              </Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox
                          indeterminate={selectedStudents.length > 0 && selectedStudents.length < filteredStudents.length}
                          checked={filteredStudents.length > 0 && selectedStudents.length === filteredStudents.length}
                          onChange={handleSelectAllClick}
                        />
                      </TableCell>
                      <TableCell>Numéro</TableCell>
                      <TableCell>Nom complet</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Niveau</TableCell>
                      <TableCell>Statut</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredStudents
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((student) => {
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
                              />
                            </TableCell>
                            <TableCell>{student.student_number}</TableCell>
                            <TableCell>{student.full_name}</TableCell>
                            <TableCell>{student.email}</TableCell>
                            <TableCell>{student.level}</TableCell>
                            <TableCell>
                              {isAssigned ? (
                                <Chip 
                                  label="Assigné" 
                                  size="small" 
                                  color="success" 
                                  variant="outlined"
                                />
                              ) : (
                                <Chip 
                                  label="Non assigné" 
                                  size="small" 
                                  color="default" 
                                  variant="outlined"
                                />
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredStudents.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Lignes par page :"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
            />
          </Paper>
        </Box>
      )}
      
      {/* Liste des étudiants assignés */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Étudiants assignés à l'examen
        </Typography>
        
        {assignedStudents.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="textSecondary">
              Aucun étudiant n'a été assigné à cet examen pour le moment.
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Utilisez les options ci-dessus pour ajouter des étudiants.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Place</TableCell>
                  <TableCell>Numéro</TableCell>
                  <TableCell>Nom complet</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Département</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assignedStudents.map((assigned) => {
                  const student = findStudentById(assigned.student_id);
                  
                  if (!student) {
                    return null;
                  }
                  
                  return (
                    <TableRow key={assigned.student_id}>
                      <TableCell>{assigned.seat_number || '-'}</TableCell>
                      <TableCell>{student.student_number}</TableCell>
                      <TableCell>{student.full_name}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>{student.department_name}</TableCell>
                      <TableCell>
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
        )}
      </Paper>
      
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
            Recherchez et sélectionnez les étudiants à ajouter à cet examen. Les étudiants déjà assignés sont indiqués en vert.
          </DialogContentText>
          
          <TextField
            fullWidth
            placeholder="Rechercher par nom, numéro d'étudiant ou email..."
            variant="outlined"
            size="small"
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
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={24} sx={{ mr: 1 }} />
              <Typography>{loadingMessage}</Typography>
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
