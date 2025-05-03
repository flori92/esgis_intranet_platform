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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Grid,
  Alert,
  Snackbar,
  TablePagination,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  School as SchoolIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../utils/supabase';

// Types
interface Course {
  id: number;
  name: string;
  code: string;
  credits: number;
  description: string | null;
  department_id: number;
  level: 'L1' | 'L2' | 'L3' | 'M1' | 'M2';
  semester: 1 | 2;
  department_name?: string;
  created_at: string;
  updated_at: string;
}

interface Department {
  id: number;
  name: string;
  code: string;
}

const CoursesManagerPage: React.FC = () => {
  const { authState } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterDepartment, setFilterDepartment] = useState<number | null>(null);
  const [filterLevel, setFilterLevel] = useState<string>('all');

  // Champs du formulaire
  const [courseName, setCourseName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [courseCredits, setCourseCredits] = useState<string>('');
  const [courseDescription, setCourseDescription] = useState('');
  const [courseDepartment, setCourseDepartment] = useState<number | null>(null);
  const [courseLevel, setCourseLevel] = useState<'L1' | 'L2' | 'L3' | 'M1' | 'M2'>('L1');
  const [courseSemester, setCourseSemester] = useState<1 | 2>(1);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  // Référence pour éviter les recréations de fonctions
  const fetchDataRef = useRef(async () => {
    setLoading(true);
    setError(null);
    try {
      // Récupérer les départements
      const { data: departmentsData, error: departmentsError } = await supabase
        .from('departments')
        .select('id, name, code')
        .order('name');
      
      if (departmentsError) throw departmentsError;
      setDepartments(departmentsData || []);

      // Récupérer les cours
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .order('name');
      
      if (coursesError) throw coursesError;

      // Associer les noms des départements aux cours
      const coursesWithDepartments = coursesData.map(course => {
        const dept = departmentsData?.find(d => d.id === course.department_id);
        return {
          ...course,
          department_name: dept?.name || 'Non assigné'
        };
      });

      setCourses(coursesWithDepartments);
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
    
    if (!courseName.trim()) {
      errors.name = 'Le nom du cours est requis';
    }
    
    if (!courseCode.trim()) {
      errors.code = 'Le code du cours est requis';
    } else if (courseCode.length > 10) {
      errors.code = 'Le code ne doit pas dépasser 10 caractères';
    }
    
    if (!courseCredits || isNaN(Number(courseCredits)) || Number(courseCredits) <= 0) {
      errors.credits = 'Le nombre de crédits doit être un nombre positif';
    }
    
    if (!courseDepartment) {
      errors.department = 'Le département est requis';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Ouverture du dialogue pour créer
  const handleOpenCreateDialog = () => {
    setCurrentCourse(null);
    setCourseName('');
    setCourseCode('');
    setCourseCredits('');
    setCourseDescription('');
    setCourseDepartment(null);
    setCourseLevel('L1');
    setCourseSemester(1);
    setEditMode(false);
    setFormErrors({});
    setDialogOpen(true);
  };

  // Ouverture du dialogue pour éditer
  const handleOpenEditDialog = (course: Course) => {
    setCurrentCourse(course);
    setCourseName(course.name);
    setCourseCode(course.code);
    setCourseCredits(course.credits.toString());
    setCourseDescription(course.description || '');
    setCourseDepartment(course.department_id);
    setCourseLevel(course.level);
    setCourseSemester(course.semester);
    setEditMode(true);
    setFormErrors({});
    setDialogOpen(true);
  };

  // Fermeture du dialogue
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  // Création d'un cours
  const handleCreateCourse = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('courses')
        .insert([
          {
            name: courseName,
            code: courseCode,
            credits: Number(courseCredits),
            description: courseDescription || null,
            department_id: courseDepartment,
            level: courseLevel,
            semester: courseSemester
          }
        ])
        .select();
      
      if (error) throw error;
      
      if (data) {
        setSuccessMessage('Cours créé avec succès');
        handleCloseDialog();
        await fetchDataRef.current();
      }
    } catch (err) {
      console.error('Erreur lors de la création du cours:', err);
      setError('Une erreur est survenue lors de la création du cours.');
    } finally {
      setLoading(false);
    }
  };

  // Mise à jour d'un cours
  const handleUpdateCourse = async () => {
    if (!currentCourse || !validateForm()) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('courses')
        .update({
          name: courseName,
          code: courseCode,
          credits: Number(courseCredits),
          description: courseDescription || null,
          department_id: courseDepartment,
          level: courseLevel,
          semester: courseSemester,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentCourse.id);
      
      if (error) throw error;
      
      setSuccessMessage('Cours mis à jour avec succès');
      handleCloseDialog();
      await fetchDataRef.current();
    } catch (err) {
      console.error('Erreur lors de la mise à jour du cours:', err);
      setError('Une erreur est survenue lors de la mise à jour du cours.');
    } finally {
      setLoading(false);
    }
  };

  // Suppression d'un cours
  const handleDeleteCourse = async (courseId: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce cours ? Cette action est irréversible.')) {
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);
      
      if (error) throw error;
      
      setSuccessMessage('Cours supprimé avec succès');
      await fetchDataRef.current();
    } catch (err) {
      console.error('Erreur lors de la suppression du cours:', err);
      setError('Une erreur est survenue lors de la suppression du cours.');
    } finally {
      setLoading(false);
    }
  };

  // Filtrage des cours
  const filteredCourses = courses.filter(course => {
    // Filtre par département
    if (filterDepartment !== null && course.department_id !== filterDepartment) {
      return false;
    }
    // Filtre par niveau
    if (filterLevel !== 'all' && course.level !== filterLevel) {
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
    setFilterDepartment(null);
    setFilterLevel('all');
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
        Gestion des Matières et Cours
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
          <FormControl sx={{ minWidth: 150 }} size="small">
            <InputLabel>Département</InputLabel>
            <Select
              value={filterDepartment || ''}
              onChange={(e) => setFilterDepartment(e.target.value === '' ? null : Number(e.target.value))}
              label="Département"
            >
              <MenuItem value="">Tous</MenuItem>
              {departments.map((dept) => (
                <MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 100 }} size="small">
            <InputLabel>Niveau</InputLabel>
            <Select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              label="Niveau"
            >
              <MenuItem value="all">Tous</MenuItem>
              <MenuItem value="L1">L1</MenuItem>
              <MenuItem value="L2">L2</MenuItem>
              <MenuItem value="L3">L3</MenuItem>
              <MenuItem value="M1">M1</MenuItem>
              <MenuItem value="M2">M2</MenuItem>
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
          Nouveau Cours
        </Button>
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        {loading && courses.length === 0 ? (
          <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Nom</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell>Département</TableCell>
                    <TableCell>Niveau</TableCell>
                    <TableCell>Semestre</TableCell>
                    <TableCell>Crédits</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredCourses
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((course) => (
                      <TableRow key={course.id}>
                        <TableCell>{course.name}</TableCell>
                        <TableCell>{course.code}</TableCell>
                        <TableCell>{course.department_name}</TableCell>
                        <TableCell>{course.level}</TableCell>
                        <TableCell>{course.semester}</TableCell>
                        <TableCell>{course.credits}</TableCell>
                        <TableCell align="right">
                          <IconButton 
                            color="primary" 
                            onClick={() => handleOpenEditDialog(course)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton 
                            color="error" 
                            onClick={() => handleDeleteCourse(course.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  {filteredCourses.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        Aucun cours trouvé
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredCourses.length}
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

      {/* Dialogue pour créer/éditer un cours */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editMode ? 'Modifier le cours' : 'Créer un nouveau cours'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={8}>
              <TextField
                label="Nom du cours"
                fullWidth
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                error={!!formErrors.name}
                helperText={formErrors.name}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Code"
                fullWidth
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
                error={!!formErrors.code}
                helperText={formErrors.code}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!formErrors.department} required>
                <InputLabel>Département</InputLabel>
                <Select
                  value={courseDepartment || ''}
                  onChange={(e) => setCourseDepartment(e.target.value === '' ? null : Number(e.target.value))}
                  label="Département"
                >
                  <MenuItem value="" disabled>
                    Sélectionner un département
                  </MenuItem>
                  {departments.map((dept) => (
                    <MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>
                  ))}
                </Select>
                {formErrors.department && <Typography color="error" variant="caption">{formErrors.department}</Typography>}
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                label="Crédits"
                fullWidth
                type="number"
                inputProps={{ min: 1 }}
                value={courseCredits}
                onChange={(e) => setCourseCredits(e.target.value)}
                error={!!formErrors.credits}
                helperText={formErrors.credits}
                required
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Niveau</InputLabel>
                <Select
                  value={courseLevel}
                  onChange={(e) => setCourseLevel(e.target.value as 'L1' | 'L2' | 'L3' | 'M1' | 'M2')}
                  label="Niveau"
                >
                  <MenuItem value="L1">L1</MenuItem>
                  <MenuItem value="L2">L2</MenuItem>
                  <MenuItem value="L3">L3</MenuItem>
                  <MenuItem value="M1">M1</MenuItem>
                  <MenuItem value="M2">M2</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Semestre</InputLabel>
                <Select
                  value={courseSemester}
                  onChange={(e) => setCourseSemester(e.target.value as 1 | 2)}
                  label="Semestre"
                >
                  <MenuItem value={1}>Semestre 1</MenuItem>
                  <MenuItem value={2}>Semestre 2</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={4}
                value={courseDescription}
                onChange={(e) => setCourseDescription(e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button 
            onClick={editMode ? handleUpdateCourse : handleCreateCourse}
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

export default CoursesManagerPage;
