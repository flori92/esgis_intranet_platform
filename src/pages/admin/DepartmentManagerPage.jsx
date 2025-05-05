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
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
// Import unique Supabase – toute référence doit passer par '@/services/supabase'
import { supabase } from '@/services/supabase';
import { fetchRecords, insertRecord, updateRecord, deleteRecord, fetchWithRelations } from '../../utils/supabase-helpers';

const DepartmentManagerPage = () => {
  const theme = useTheme();
  const { authState } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    head_professor_id: null
  });
  const [formErrors, setFormErrors] = useState({});
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('success');
  const fetchDataRef = useRef();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Charger les départements
      const departmentsData = await fetchWithRelations(
        'departments',
        ['professors(id, profile_id, employee_number, hire_date, specialties, status)']
      );
      setDepartments(departmentsData);

      // Charger les professeurs
      const professorsData = await fetchRecords('professors');
      setProfessors(professorsData);
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError('Une erreur est survenue lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDataRef.current = fetchData;
    fetchData();
  }, []);

  // Validation du formulaire
  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Le nom du département est requis';
    }

    if (!formData.code.trim()) {
      errors.code = 'Le code du département est requis';
    } else if (!/^[A-Z0-9]+$/.test(formData.code)) {
      errors.code = 'Le code doit contenir uniquement des lettres majuscules et des chiffres';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Gérer l'ouverture du dialogue d'ajout/édition
  const handleOpenDialog = (department) => {
    if (department) {
      setEditingDepartment(department);
      setFormData({
        name: department.name,
        code: department.code,
        description: department.description || '',
        head_professor_id: department.head_professor_id
      });
    } else {
      setEditingDepartment(null);
      setFormData({
        name: '',
        code: '',
        description: '',
        head_professor_id: null
      });
    }
    setFormErrors({});
    setDialogOpen(true);
  };

  // Gérer la fermeture du dialogue
  const handleCloseDialog = () => {
    setDialogOpen(false);
    
    // Réinitialiser le formulaire après un délai pour une meilleure UX
    setTimeout(() => {
      setEditingDepartment(null);
      setFormData({
        name: '',
        code: '',
        description: '',
        head_professor_id: null
      });
      setFormErrors({});
    }, 200);
  };

  // Gérer la soumission du formulaire
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      if (editingDepartment) {
        // Mise à jour du département
        await updateRecord('departments', editingDepartment.id, {
          name: formData.name,
          code: formData.code,
          description: formData.description,
          head_professor_id: formData.head_professor_id || null,
          updated_at: new Date().toISOString()
        });
        
        // Afficher le message de succès
        setAlertMessage('Département mis à jour avec succès');
        setAlertSeverity('success');
        setAlertOpen(true);
      } else {
        // Création d'un nouveau département
        await insertRecord('departments', {
          name: formData.name,
          code: formData.code,
          description: formData.description,
          head_professor_id: formData.head_professor_id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
        // Afficher le message de succès
        setAlertMessage('Département créé avec succès');
        setAlertSeverity('success');
        setAlertOpen(true);
      }

      // Fermer le dialogue et rafraîchir les données
      handleCloseDialog();
      fetchData();
    } catch (err) {
      console.error('Erreur lors de la soumission:', err);
      setAlertMessage('Une erreur est survenue lors de la sauvegarde du département');
      setAlertSeverity('error');
      setAlertOpen(true);
    }
  };

  // Gérer la suppression d'un département
  const handleDelete = async (departmentId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce département ?')) {
      return;
    }

    try {
      await deleteRecord('departments', departmentId);
      
      // Afficher le message de succès
      setAlertMessage('Département supprimé avec succès');
      setAlertSeverity('success');
      setAlertOpen(true);
      
      // Rafraîchir les données
      fetchData();
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      setAlertMessage('Une erreur est survenue lors de la suppression du département');
      setAlertSeverity('error');
      setAlertOpen(true);
    }
  };

  // Gérer le changement de page
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Gérer le changement du nombre de lignes par page
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Gérer le changement des champs du formulaire
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Gérer le changement du chef de département
  const handleHeadProfessorChange = (event) => {
    setFormData({
      ...formData,
      head_professor_id: event.target.value === '' ? null : event.target.value
    });
  };

  // Gérer le changement du terme de recherche
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(0);
  };

  // Fermer l'alerte
  const handleCloseAlert = () => {
    setAlertOpen(false);
  };

  // Filtrer les départements selon le terme de recherche
  const filteredDepartments = departments.filter(dept => 
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    dept.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginer les départements
  const paginatedDepartments = filteredDepartments.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Afficher un message d'erreur si nécessaire
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gestion des départements
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Rechercher un département"
              variant="outlined"
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
              }}
              placeholder="Nom ou code du département..."
            />
          </Grid>
          <Grid item xs={12} sm={6} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Ajouter un département
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ width: '100%' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell>Nom</TableCell>
                  <TableCell>Chef de département</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedDepartments.map((department) => (
                  <TableRow key={department.id}>
                    <TableCell>{department.code}</TableCell>
                    <TableCell>{department.name}</TableCell>
                    <TableCell>{department.head_professor?.profile?.full_name || 'Non assigné'}</TableCell>
                    <TableCell>{department.description || '-'}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenDialog(department)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDelete(department.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {paginatedDepartments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      Aucun département trouvé
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={filteredDepartments.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Lignes par page"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
          />
        </Paper>
      )}

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingDepartment ? 'Modifier le département' : 'Ajouter un département'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Nom du département"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              error={!!formErrors.name}
              helperText={formErrors.name}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Code du département"
              name="code"
              value={formData.code}
              onChange={handleInputChange}
              error={!!formErrors.code}
              helperText={formErrors.code}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              multiline
              rows={3}
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth>
              <InputLabel>Chef de département</InputLabel>
              <Select
                value={formData.head_professor_id || ''}
                onChange={handleHeadProfessorChange}
                label="Chef de département"
              >
                <MenuItem value="">
                  <em>Aucun</em>
                </MenuItem>
                {professors.map((professor) => (
                  <MenuItem key={professor.id} value={professor.id}>
                    {professor.profile?.full_name || 'Professeur sans nom'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingDepartment ? 'Modifier' : 'Ajouter'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={alertOpen}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseAlert} severity={alertSeverity} sx={{ width: '100%' }}>
          {alertMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DepartmentManagerPage;
