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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Grid,
  Alert,
  Snackbar,
  TablePagination,
  Chip,
  FormControlLabel,
  Checkbox,
  TextField,
  Autocomplete
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
// Import unique Supabase – toute référence doit passer par '@/services/supabase'
import { supabase } from '@/services/supabase';

const ProfessorCoursesPage = () => {
  const { authState } = useAuth();
  const [professorCourses, setProfessorCourses] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterProfessor, setFilterProfessor] = useState(null);
  const [filterCourse, setFilterCourse] = useState(null);
  const [filterAcademicYear, setFilterAcademicYear] = useState('all');

  // États pour le dialogue
  const [selectedProfessor, setSelectedProfessor] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [isPrincipal, setIsPrincipal] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Liste des années académiques
  const currentYear = new Date().getFullYear();
  const academicYears = Array.from({ length: 5 }, (_, i) => {
    const year = currentYear - 2 + i;
    return `${year}-${year + 1}`;
  });

  // Référence pour éviter les recréations de fonctions
  const fetchDataRef = useRef(async () => {
    setLoading(true);
    setError(null);
    try {
      // Récupérer les professeurs
      const { data: professorsData, error: professorsError } = await supabase
        .from('professors')
        .select(`
          id, 
          profiles:profile_id(id, full_name, department_id),
          employee_number,
          status
        `)
        .eq('status', 'active')
        .order('id');
      
      if (professorsError) throw professorsError;

      // Récupérer les départements
      const { data: departmentsData, error: departmentsError } = await supabase
        .from('departments')
        .select('id, name');
      
      if (departmentsError) throw departmentsError;

      // Récupérer les cours
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .order('name');
      
      if (coursesError) throw coursesError;

      // Transformer les données des professeurs pour avoir le nom et le département
      const formattedProfessors = (professorsData || []).map(prof => ({
        id: prof.id,
        full_name: prof.profiles?.full_name || 'Nom inconnu',
        employee_number: prof.employee_number || '',
        status: prof.status || 'active',
        department_id: prof.profiles?.department_id,
        department_name: departmentsData?.find(d => d.id === prof.profiles?.department_id)?.name || 'Non assigné'
      }));
      
      // Transformer les données des cours pour avoir le nom du département
      const formattedCourses = (coursesData || []).map(course => ({
        ...course,
        department_name: departmentsData?.find(d => d.id === course.department_id)?.name || 'Non assigné'
      }));
      
      // Récupérer les assignations professeurs-cours
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('professor_courses')
        .select('*')
        .order('id');
      
      if (assignmentsError) throw assignmentsError;
      
      // Transformer les données des assignations pour avoir les noms des professeurs et des cours
      const formattedAssignments = (assignmentsData || []).map(assignment => {
        const professor = formattedProfessors.find(p => p.id === assignment.professor_id);
        const course = formattedCourses.find(c => c.id === assignment.course_id);
        return {
          ...assignment,
          professor_name: professor?.full_name || 'Professeur inconnu',
          course_name: course?.name || 'Cours inconnu',
          course_code: course?.code || 'Code inconnu'
        };
      });
      
      setProfessors(formattedProfessors);
      setCourses(formattedCourses);
      setProfessorCourses(formattedAssignments);
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError('Une erreur est survenue lors du chargement des données.');
    } finally {
      setLoading(false);
    }
  });

  useEffect(() => {
    const fetchData = async () => {
      if (fetchDataRef.current) {
        await fetchDataRef.current();
      }
    };
    fetchData();
  }, []);

  const fetchData = async () => {
    if (fetchDataRef.current) {
      await fetchDataRef.current();
    }
  };

  // Validation du formulaire
  const validateForm = () => {
    const errors = {};
    
    if (!selectedProfessor) {
      errors.professor = 'Le professeur est requis';
    }
    
    if (!selectedCourse) {
      errors.course = 'Le cours est requis';
    }
    
    if (!selectedAcademicYear) {
      errors.academicYear = "L'année académique est requise";
    }
    
    // Vérifier si l'assignation existe déjà (sauf en mode édition pour la même assignation)
    if (selectedProfessor && selectedCourse && selectedAcademicYear) {
      const exists = professorCourses.some(a => 
        a.professor_id === selectedProfessor.id &&
        a.course_id === selectedCourse.id &&
        a.academic_year === selectedAcademicYear &&
        (!editMode || (editMode && a.id !== currentAssignment?.id))
      );
      
      if (exists) {
        errors.duplicate = 'Cette assignation existe déjà pour cette année académique';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Ouverture du dialogue pour créer une assignation
  const handleOpenCreateDialog = () => {
    setSelectedProfessor(null);
    setSelectedCourse(null);
    setSelectedAcademicYear('');
    setIsPrincipal(false);
    setCurrentAssignment(null);
    setFormErrors({});
    setEditMode(false);
    setDialogOpen(true);
  };

  // Ouverture du dialogue pour éditer une assignation
  const handleOpenEditDialog = (assignment) => {
    setCurrentAssignment(assignment);
    setSelectedProfessor(professors.find(p => p.id === assignment.professor_id) || null);
    setSelectedCourse(courses.find(c => c.id === assignment.course_id) || null);
    setSelectedAcademicYear(assignment.academic_year || '');
    setIsPrincipal(assignment.is_principal || false);
    setFormErrors({});
    setEditMode(true);
    setDialogOpen(true);
  };

  // Fermeture du dialogue
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  // Création d'une assignation
  const handleCreateAssignment = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      const newAssignment = {
        professor_id: selectedProfessor.id,
        course_id: selectedCourse.id,
        academic_year: selectedAcademicYear,
        is_principal: isPrincipal,
        created_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('professor_courses')
        .insert([newAssignment])
        .select();
      
      if (error) throw error;
      
      // Ajouter les noms pour l'affichage
      const formattedAssignment = {
        ...data[0],
        professor_name: selectedProfessor.full_name,
        course_name: selectedCourse.name,
        course_code: selectedCourse.code
      };
      
      setProfessorCourses([...professorCourses, formattedAssignment]);
      setSuccessMessage('Assignation créée avec succès');
      setDialogOpen(false);
    } catch (err) {
      console.error('Erreur lors de la création de l\'assignation:', err);
      setError('Une erreur est survenue lors de la création de l\'assignation');
    } finally {
      setLoading(false);
    }
  };

  // Mise à jour d'une assignation
  const handleUpdateAssignment = async () => {
    if (!validateForm() || !currentAssignment) {
      return;
    }

    try {
      setLoading(true);
      
      const updatedAssignment = {
        professor_id: selectedProfessor.id,
        course_id: selectedCourse.id,
        academic_year: selectedAcademicYear,
        is_principal: isPrincipal
      };
      
      const { error } = await supabase
        .from('professor_courses')
        .update(updatedAssignment)
        .eq('id', currentAssignment.id);
      
      if (error) throw error;
      
      // Mettre à jour l'état local
      setProfessorCourses(professorCourses.map(assignment => 
        assignment.id === currentAssignment.id ? {
          ...assignment,
          ...updatedAssignment,
          professor_name: selectedProfessor.full_name,
          course_name: selectedCourse.name,
          course_code: selectedCourse.code
        } : assignment
      ));
      
      setSuccessMessage('Assignation mise à jour avec succès');
      setDialogOpen(false);
    } catch (err) {
      console.error('Erreur lors de la mise à jour de l\'assignation:', err);
      setError('Une erreur est survenue lors de la mise à jour de l\'assignation');
    } finally {
      setLoading(false);
    }
  };

  // Suppression d'une assignation
  const handleDeleteAssignment = async (assignmentId) => {
    // Demander confirmation
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette assignation ?')) {
      return;
    }

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('professor_courses')
        .delete()
        .eq('id', assignmentId);
      
      if (error) throw error;
      
      // Mettre à jour l'état local
      setProfessorCourses(professorCourses.filter(assignment => assignment.id !== assignmentId));
      setSuccessMessage('Assignation supprimée avec succès');
    } catch (err) {
      console.error('Erreur lors de la suppression de l\'assignation:', err);
      setError('Une erreur est survenue lors de la suppression de l\'assignation');
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les assignations
  const filteredAssignments = professorCourses.filter(assignment => {
    // Filtre par professeur
    if (filterProfessor && assignment.professor_id !== filterProfessor) {
      return false;
    }
    
    // Filtre par cours
    if (filterCourse && assignment.course_id !== filterCourse) {
      return false;
    }
    
    // Filtre par année académique
    if (filterAcademicYear !== 'all' && assignment.academic_year !== filterAcademicYear) {
      return false;
    }
    
    return true;
  });

  // Calculer les indices pour la pagination
  const startIndex = page * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const displayedAssignments = filteredAssignments.slice(startIndex, endIndex);

  // Gestion de la pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Réinitialiser les filtres
  const handleResetFilters = () => {
    setFilterProfessor(null);
    setFilterCourse(null);
    setFilterAcademicYear('all');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gestion des cours des professeurs
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
        {/* Filtres */}
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Professeur</InputLabel>
          <Select
            value={filterProfessor || ''}
            onChange={(e) => setFilterProfessor(e.target.value === '' ? null : Number(e.target.value))}
            label="Professeur"
          >
            <MenuItem value="">Tous les professeurs</MenuItem>
            {professors.map((prof) => (
              <MenuItem key={prof.id} value={prof.id}>{prof.full_name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Cours</InputLabel>
          <Select
            value={filterCourse || ''}
            onChange={(e) => setFilterCourse(e.target.value === '' ? null : Number(e.target.value))}
            label="Cours"
          >
            <MenuItem value="">Tous les cours</MenuItem>
            {courses.map((course) => (
              <MenuItem key={course.id} value={course.id}>{course.name} ({course.code})</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 160 }}>
          <InputLabel>Année Académique</InputLabel>
          <Select
            value={filterAcademicYear}
            onChange={(e) => setFilterAcademicYear(e.target.value)}
            label="Année Académique"
          >
            <MenuItem value="all">Toutes les années</MenuItem>
            {academicYears.map((year) => (
              <MenuItem key={year} value={year}>{year}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button 
          variant="outlined" 
          startIcon={<FilterListIcon />}
          onClick={handleResetFilters}
        >
          Réinitialiser
        </Button>

        {/* Spacer */}
        <Box sx={{ flexGrow: 1 }} />

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreateDialog}
        >
          Nouvelle assignation
        </Button>
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        {loading && !professorCourses.length ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Professeur</TableCell>
                    <TableCell>Cours</TableCell>
                    <TableCell>Année académique</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayedAssignments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        Aucune assignation trouvée
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayedAssignments.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <PersonIcon sx={{ mr: 1, fontSize: 20, color: 'primary.main' }} />
                            {assignment.professor_name}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <SchoolIcon sx={{ mr: 1, fontSize: 20, color: 'primary.main' }} />
                            {assignment.course_name} ({assignment.course_code})
                          </Box>
                        </TableCell>
                        <TableCell>{assignment.academic_year}</TableCell>
                        <TableCell>
                          {assignment.is_principal ? (
                            <Chip label="Principal" color="primary" size="small" />
                          ) : (
                            <Chip label="Assistant" variant="outlined" size="small" />
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            color="primary"
                            onClick={() => handleOpenEditDialog(assignment)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={() => handleDeleteAssignment(assignment.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={filteredAssignments.length}
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

      {/* Dialogue pour créer/éditer une assignation */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editMode ? 'Modifier l\'assignation' : 'Créer une nouvelle assignation'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Autocomplete
                value={selectedProfessor}
                onChange={(_event, newValue) => setSelectedProfessor(newValue)}
                options={professors}
                getOptionLabel={(option) => `${option.full_name} (${option.employee_number})`}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="Professeur" 
                    required
                    error={!!formErrors.professor}
                    helperText={formErrors.professor}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                value={selectedCourse}
                onChange={(_event, newValue) => setSelectedCourse(newValue)}
                options={courses}
                getOptionLabel={(option) => `${option.name} (${option.code}) - ${option.level}`}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="Cours" 
                    required
                    error={!!formErrors.course}
                    helperText={formErrors.course}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!formErrors.academicYear} required>
                <InputLabel>Année Académique</InputLabel>
                <Select
                  value={selectedAcademicYear}
                  onChange={(e) => setSelectedAcademicYear(e.target.value)}
                  label="Année Académique"
                >
                  {academicYears.map((year) => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </Select>
                {formErrors.academicYear && <Typography color="error" variant="caption">{formErrors.academicYear}</Typography>}
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isPrincipal}
                    onChange={(e) => setIsPrincipal(e.target.checked)}
                  />
                }
                label="Professeur principal"
              />
            </Grid>
            {formErrors.duplicate && (
              <Grid item xs={12}>
                <Alert severity="error">
                  {formErrors.duplicate}
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button 
            onClick={editMode ? handleUpdateAssignment : handleCreateAssignment}
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} />
            ) : (
              editMode ? 'Mettre à jour' : 'Créer'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProfessorCoursesPage;
