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
import { supabase } from '../../utils/supabase';

// Types
interface Professor {
  id: number;
  profile_id: string;
  full_name: string;
  employee_number: string;
  status: string;
  department_id?: number;
  department_name?: string;
}

interface Course {
  id: number;
  name: string;
  code: string;
  credits: number;
  level: string;
  semester: number;
  department_id: number;
  department_name?: string;
}

interface ProfessorCourse {
  id: number;
  professor_id: number;
  course_id: number;
  academic_year: string;
  is_principal: boolean;
  created_at: string;
  professor_name?: string;
  course_name?: string;
  course_code?: string;
}

const ProfessorCoursesPage: React.FC = () => {
  const { authState } = useAuth();
  const [professorCourses, setProfessorCourses] = useState<ProfessorCourse[]>([]);
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterProfessor, setFilterProfessor] = useState<number | null>(null);
  const [filterCourse, setFilterCourse] = useState<number | null>(null);
  const [filterAcademicYear, setFilterAcademicYear] = useState<string>('all');

  // États pour le dialogue
  const [selectedProfessor, setSelectedProfessor] = useState<Professor | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('');
  const [isPrincipal, setIsPrincipal] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState<ProfessorCourse | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

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

      // Récupérer les assignations professeurs-cours
      const { data: professorCoursesData, error: professorCoursesError } = await supabase
        .from('professor_courses')
        .select('*')
        .order('academic_year', { ascending: false });
      
      if (professorCoursesError) throw professorCoursesError;

      // Transformer les données
      const transformedProfessors = professorsData.map(prof => {
        const department = departmentsData?.find(d => d.id === prof.profiles?.department_id);
        return {
          id: prof.id,
          profile_id: prof.profiles?.id || '',
          full_name: prof.profiles?.full_name || 'Nom inconnu',
          employee_number: prof.employee_number,
          status: prof.status,
          department_id: prof.profiles?.department_id,
          department_name: department?.name || 'Non assigné'
        };
      });

      // Transformer les cours avec les noms de départements
      const transformedCourses = coursesData.map(course => {
        const department = departmentsData?.find(d => d.id === course.department_id);
        return {
          ...course,
          department_name: department?.name || 'Non assigné'
        };
      });

      // Transformer les assignations avec les noms
      const transformedAssignments = professorCoursesData.map(assignment => {
        const professor = transformedProfessors.find(p => p.id === assignment.professor_id);
        const course = transformedCourses.find(c => c.id === assignment.course_id);
        return {
          ...assignment,
          professor_name: professor?.full_name || 'Inconnu',
          course_name: course?.name || 'Inconnu',
          course_code: course?.code || 'Inconnu'
        };
      });

      setProfessors(transformedProfessors);
      setCourses(transformedCourses);
      setProfessorCourses(transformedAssignments);
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

  // Validation du formulaire
  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};
    
    if (!selectedProfessor) {
      errors.professor = 'Le professeur est requis';
    }
    
    if (!selectedCourse) {
      errors.course = 'Le cours est requis';
    }
    
    if (!selectedAcademicYear) {
      errors.academicYear = 'L\'année académique est requise';
    }
    
    // Vérifier si l'assignation existe déjà
    if (selectedProfessor && selectedCourse && selectedAcademicYear && !editMode) {
      const exists = professorCourses.some(
        pc => pc.professor_id === selectedProfessor.id && 
             pc.course_id === selectedCourse.id && 
             pc.academic_year === selectedAcademicYear
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
    setSelectedAcademicYear(academicYears[0]);
    setIsPrincipal(false);
    setCurrentAssignment(null);
    setEditMode(false);
    setFormErrors({});
    setDialogOpen(true);
  };

  // Ouverture du dialogue pour éditer une assignation
  const handleOpenEditDialog = (assignment: ProfessorCourse) => {
    const professor = professors.find(p => p.id === assignment.professor_id) || null;
    const course = courses.find(c => c.id === assignment.course_id) || null;
    
    setSelectedProfessor(professor);
    setSelectedCourse(course);
    setSelectedAcademicYear(assignment.academic_year);
    setIsPrincipal(assignment.is_principal);
    setCurrentAssignment(assignment);
    setEditMode(true);
    setFormErrors({});
    setDialogOpen(true);
  };

  // Fermeture du dialogue
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  // Création d'une assignation
  const handleCreateAssignment = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('professor_courses')
        .insert([
          {
            professor_id: selectedProfessor?.id,
            course_id: selectedCourse?.id,
            academic_year: selectedAcademicYear,
            is_principal: isPrincipal
          }
        ])
        .select();
      
      if (error) throw error;
      
      if (data) {
        setSuccessMessage('Assignation créée avec succès');
        handleCloseDialog();
        await fetchDataRef.current();
      }
    } catch (err) {
      console.error('Erreur lors de la création de l\'assignation:', err);
      setError('Une erreur est survenue lors de la création de l\'assignation.');
    } finally {
      setLoading(false);
    }
  };

  // Mise à jour d'une assignation
  const handleUpdateAssignment = async () => {
    if (!currentAssignment || !validateForm()) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('professor_courses')
        .update({
          professor_id: selectedProfessor?.id,
          course_id: selectedCourse?.id,
          academic_year: selectedAcademicYear,
          is_principal: isPrincipal
        })
        .eq('id', currentAssignment.id);
      
      if (error) throw error;
      
      setSuccessMessage('Assignation mise à jour avec succès');
      handleCloseDialog();
      await fetchDataRef.current();
    } catch (err) {
      console.error('Erreur lors de la mise à jour de l\'assignation:', err);
      setError('Une erreur est survenue lors de la mise à jour de l\'assignation.');
    } finally {
      setLoading(false);
    }
  };

  // Suppression d'une assignation
  const handleDeleteAssignment = async (assignmentId: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette assignation ?')) {
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('professor_courses')
        .delete()
        .eq('id', assignmentId);
      
      if (error) throw error;
      
      setSuccessMessage('Assignation supprimée avec succès');
      await fetchDataRef.current();
    } catch (err) {
      console.error('Erreur lors de la suppression de l\'assignation:', err);
      setError('Une erreur est survenue lors de la suppression de l\'assignation.');
    } finally {
      setLoading(false);
    }
  };

  // Filtrage des assignations
  const filteredAssignments = professorCourses.filter(assignment => {
    // Filtre par professeur
    if (filterProfessor !== null && assignment.professor_id !== filterProfessor) {
      return false;
    }
    // Filtre par cours
    if (filterCourse !== null && assignment.course_id !== filterCourse) {
      return false;
    }
    // Filtre par année académique
    if (filterAcademicYear !== 'all' && assignment.academic_year !== filterAcademicYear) {
      return false;
    }
    return true;
  });

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
    setFilterProfessor(null);
    setFilterCourse(null);
    setFilterAcademicYear('all');
  };

  if (!authState.isAdmin) {
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
        Gestion des Assignations de Cours
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

      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl sx={{ minWidth: 200 }} size="small">
            <InputLabel>Professeur</InputLabel>
            <Select
              value={filterProfessor || ''}
              onChange={(e) => setFilterProfessor(e.target.value === '' ? null : Number(e.target.value))}
              label="Professeur"
            >
              <MenuItem value="">Tous</MenuItem>
              {professors.map((prof) => (
                <MenuItem key={prof.id} value={prof.id}>{prof.full_name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 200 }} size="small">
            <InputLabel>Cours</InputLabel>
            <Select
              value={filterCourse || ''}
              onChange={(e) => setFilterCourse(e.target.value === '' ? null : Number(e.target.value))}
              label="Cours"
            >
              <MenuItem value="">Tous</MenuItem>
              {courses.map((course) => (
                <MenuItem key={course.id} value={course.id}>{course.name} ({course.code})</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 150 }} size="small">
            <InputLabel>Année Académique</InputLabel>
            <Select
              value={filterAcademicYear}
              onChange={(e) => setFilterAcademicYear(e.target.value)}
              label="Année Académique"
            >
              <MenuItem value="all">Toutes</MenuItem>
              {academicYears.map((year) => (
                <MenuItem key={year} value={year}>{year}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button 
            variant="outlined" 
            size="small"
            onClick={handleResetFilters}
          >
            Réinitialiser
          </Button>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleOpenCreateDialog}
        >
          Nouvelle Assignation
        </Button>
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        {loading && professorCourses.length === 0 ? (
          <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Professeur</TableCell>
                    <TableCell>Cours</TableCell>
                    <TableCell>Année Académique</TableCell>
                    <TableCell>Rôle</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAssignments
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell>{assignment.professor_name}</TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">{assignment.course_name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {assignment.course_code}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{assignment.academic_year}</TableCell>
                        <TableCell>
                          {assignment.is_principal ? (
                            <Chip label="Professeur principal" color="primary" size="small" />
                          ) : (
                            <Chip label="Intervenant" size="small" variant="outlined" />
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
                    ))}
                  {filteredAssignments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        Aucune assignation trouvée
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
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
