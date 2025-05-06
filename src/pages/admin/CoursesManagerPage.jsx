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
// Correction du chemin d'importation de Supabase
import { supabase } from '@/supabase';
import { getRecordsWithRelation as fetchRecords, insertRecord, updateRecord, deleteRecord } from '@/utils/supabase-helpers';

const CoursesManagerPage = () => {
  const { authState } = useAuth();
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentCourse, setCurrentCourse] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterDepartment, setFilterDepartment] = useState(null);
  const [filterLevel, setFilterLevel] = useState('all');

  // Champs du formulaire
  const [courseName, setCourseName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [courseCredits, setCourseCredits] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [courseDepartment, setCourseDepartment] = useState(null);
  const [courseLevel, setCourseLevel] = useState('L1');
  const [courseSemester, setCourseSemester] = useState(1);
  const [formErrors, setFormErrors] = useState({});

  // Référence pour éviter les recréations de fonctions
  const fetchDataRef = useRef(async () => {
    setLoading(true);
    setError(null);
    try {
      // Récupérer les départements (retourne un tableau directement)
      const departmentsData = await fetchRecords('departments');
      setDepartments(departmentsData || []);

      // Récupérer les cours avec jointure sur le nom du département
      const coursesData = await fetchRecords('courses', { select: '*, departments(name)' });
      // Transformer les données pour inclure le nom du département
      const formattedCourses = (coursesData || []).map((course) => ({
        ...course,
        department_name: course.departments?.name || 'Non assigné',
      }));
      setCourses(formattedCourses);
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
  const validateForm = () => {
    const errors = {};
    
    if (!courseName.trim()) {
      errors.name = 'Le nom du cours est requis';
    }
    
    if (!courseCode.trim()) {
      errors.code = 'Le code du cours est requis';
    }
    
    if (!courseDepartment) {
      errors.department = 'Le département est requis';
    }
    
    const creditsValue = parseInt(courseCredits);
    if (isNaN(creditsValue) || creditsValue <= 0) {
      errors.credits = 'Les crédits doivent être un nombre positif';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Ouverture du dialogue pour créer
  const handleOpenCreateDialog = () => {
    setCurrentCourse(null);
    setCourseName('');
    setCourseCode('');
    setCourseCredits('3'); // Valeur par défaut
    setCourseDescription('');
    setCourseDepartment(null);
    setCourseLevel('L1');
    setCourseSemester(1);
    setFormErrors({});
    setEditMode(false);
    setDialogOpen(true);
  };

  // Ouverture du dialogue pour éditer
  const handleOpenEditDialog = (course) => {
    setCurrentCourse(course);
    setCourseName(course.name || '');
    setCourseCode(course.code || '');
    setCourseCredits(course.credits?.toString() || '');
    setCourseDescription(course.description || '');
    setCourseDepartment(course.department_id || null);
    setCourseLevel(course.level || 'L1');
    setCourseSemester(course.semester || 1);
    setFormErrors({});
    setEditMode(true);
    setDialogOpen(true);
  };

  // Fermeture du dialogue
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  // Création d'un cours
  const handleCreateCourse = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      const newCourse = {
        name: courseName,
        code: courseCode,
        credits: parseInt(courseCredits),
        description: courseDescription || null,
        department_id: courseDepartment,
        level: courseLevel,
        semester: courseSemester,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const result = await insertRecord('courses', newCourse);
      
      if (result) {
        // Ajout du nom du département pour l'affichage
        const departmentName = departments.find(d => d.id === courseDepartment)?.name || 'Non assigné';
        setCourses([...courses, { ...result, department_name: departmentName }]);
        setSuccessMessage('Cours créé avec succès');
        setDialogOpen(false);
      }
    } catch (err) {
      console.error('Erreur lors de la création du cours:', err);
      setError('Une erreur est survenue lors de la création du cours');
    } finally {
      setLoading(false);
    }
  };

  // Mise à jour d'un cours
  const handleUpdateCourse = async () => {
    if (!validateForm() || !currentCourse) {
      return;
    }

    try {
      setLoading(true);
      
      const updatedCourse = {
        name: courseName,
        code: courseCode,
        credits: parseInt(courseCredits),
        description: courseDescription || null,
        department_id: courseDepartment,
        level: courseLevel,
        semester: courseSemester,
        updated_at: new Date().toISOString()
      };
      
      const result = await updateRecord('courses', currentCourse.id, updatedCourse);
      
      if (result) {
        // Mise à jour de l'état local avec le nom du département
        const departmentName = departments.find(d => d.id === courseDepartment)?.name || 'Non assigné';
        setCourses(courses.map(course => 
          course.id === currentCourse.id 
            ? { ...updatedCourse, id: currentCourse.id, department_name: departmentName, created_at: currentCourse.created_at }
            : course
        ));
        setSuccessMessage('Cours mis à jour avec succès');
        setDialogOpen(false);
      }
    } catch (err) {
      console.error('Erreur lors de la mise à jour du cours:', err);
      setError('Une erreur est survenue lors de la mise à jour du cours');
    } finally {
      setLoading(false);
    }
  };

  // Suppression d'un cours
  const handleDeleteCourse = async (courseId) => {
    // Demander confirmation
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce cours ?')) {
      return;
    }

    try {
      setLoading(true);
      
      const success = await deleteRecord('courses', courseId);
      
      if (success) {
        // Mise à jour de l'état local
        setCourses(courses.filter(course => course.id !== courseId));
        setSuccessMessage('Cours supprimé avec succès');
      }
    } catch (err) {
      console.error('Erreur lors de la suppression du cours:', err);
      setError('Une erreur est survenue lors de la suppression du cours');
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les cours basés sur le département et le niveau
  const filteredCourses = courses.filter(course => {
    // Filtre par département
    if (filterDepartment && course.department_id !== filterDepartment) {
      return false;
    }
    
    // Filtre par niveau
    if (filterLevel !== 'all' && course.level !== filterLevel) {
      return false;
    }
    
    return true;
  });

  // Calculer les indices pour la pagination
  const startIndex = page * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const displayedCourses = filteredCourses.slice(startIndex, endIndex);

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
    setFilterDepartment(null);
    setFilterLevel('all');
  };

  // Fonction pour gérer le changement de filtre de département
  const handleDepartmentFilterChange = (event) => {
    setFilterDepartment(event.target.value === '' ? null : Number(event.target.value));
  };

  // Fonction pour gérer le changement de filtre de niveau
  const handleLevelFilterChange = (event) => {
    setFilterLevel(event.target.value);
  };

  // Fonction pour gérer le changement de recherche
  const handleSearchChange = (event) => {
    // Implémentation future pour la recherche
    console.log('Search:', event.target.value);
  };

  // Fonction pour gérer le changement de département
  const handleCourseDepartmentChange = (event) => {
    setCourseDepartment(event.target.value === '' ? null : Number(event.target.value));
  };

  // Fonction pour gérer le changement de niveau
  const handleCourseLevelChange = (event) => {
    setCourseLevel(event.target.value);
  };

  // Fonction pour gérer le changement de semestre
  const handleCourseSemesterChange = (event) => {
    setCourseSemester(Number(event.target.value));
  };

  // Fonction pour gérer le changement de crédits
  const handleCreditsChange = (event) => {
    // Limiter aux nombres
    if (event.target.value === '' || /^\d+$/.test(event.target.value)) {
      setCourseCredits(event.target.value);
    }
  };

  // Fonction pour gérer le changement de nom du cours
  const handleNameChange = (event) => {
    setCourseName(event.target.value);
  };

  // Fonction pour gérer le changement de code du cours
  const handleCodeChange = (event) => {
    setCourseCode(event.target.value);
  };

  // Fonction pour gérer le changement de description du cours
  const handleDescriptionChange = (event) => {
    setCourseDescription(event.target.value);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gestion des cours
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
          <InputLabel>Département</InputLabel>
          <Select
            value={filterDepartment || ''}
            onChange={handleDepartmentFilterChange}
            label="Département"
          >
            <MenuItem value="">Tous les départements</MenuItem>
            {departments.map((dept) => (
              <MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Niveau</InputLabel>
          <Select
            value={filterLevel}
            onChange={handleLevelFilterChange}
            label="Niveau"
          >
            <MenuItem value="all">Tous les niveaux</MenuItem>
            <MenuItem value="L1">L1</MenuItem>
            <MenuItem value="L2">L2</MenuItem>
            <MenuItem value="L3">L3</MenuItem>
            <MenuItem value="M1">M1</MenuItem>
            <MenuItem value="M2">M2</MenuItem>
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
          Nouveau cours
        </Button>
      </Box>

      {loading && !courses.length ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
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
                {displayedCourses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      Aucun cours trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedCourses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell>{course.name}</TableCell>
                      <TableCell>{course.code}</TableCell>
                      <TableCell>{course.department_name}</TableCell>
                      <TableCell>
                        <Chip label={course.level} size="small" color="primary" />
                      </TableCell>
                      <TableCell>S{course.semester}</TableCell>
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
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={filteredCourses.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Lignes par page"
          />
        </>
      )}

      {/* Dialogue pour créer/modifier un cours */}
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
                onChange={handleNameChange}
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
                onChange={handleCodeChange}
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
                  onChange={handleCourseDepartmentChange}
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
                onChange={handleCreditsChange}
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
                  onChange={handleCourseLevelChange}
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
                  onChange={handleCourseSemesterChange}
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
                onChange={handleDescriptionChange}
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
