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
  TablePagination
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  School as SchoolIcon
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../utils/supabase';

// Types
interface Department {
  id: number;
  name: string;
  code: string;
  description: string;
  head_professor_id: string | null;
  created_at: string;
  updated_at: string;
  head_professor_name?: string;
}

interface Professor {
  id: number;
  profile_id: string;
  full_name: string;
  employee_number: string;
  hire_date: string;
  specialties: string[];
  status: 'active' | 'on_leave' | 'retired' | 'terminated';
}

const DepartmentManagerPage: React.FC = () => {
  const { authState } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentDepartment, setCurrentDepartment] = useState<Department | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Champs du formulaire
  const [departmentName, setDepartmentName] = useState('');
  const [departmentCode, setDepartmentCode] = useState('');
  const [departmentDescription, setDepartmentDescription] = useState('');
  const [headProfessorId, setHeadProfessorId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  // Référence pour éviter les recréations de fonctions
  const fetchDataRef = useRef(async () => {
    setLoading(true);
    setError(null);
    try {
      // Récupérer les départements
      const { data: departmentsData, error: departmentsError } = await supabase
        .from('departments')
        .select('*')
        .order('name');
      
      if (departmentsError) throw departmentsError;

      // Récupérer les professeurs pour les chefs de département
      const { data: professorsData, error: professorsError } = await supabase
        .from('professors')
        .select(`
          id,
          profile_id,
          employee_number,
          hire_date,
          specialties,
          status,
          profiles:profile_id(full_name)
        `)
        .eq('status', 'active');
      
      if (professorsError) throw professorsError;

      // Transformer les données
      const transformedProfessors = professorsData.map(prof => ({
        id: prof.id,
        profile_id: prof.profile_id,
        full_name: prof.profiles?.full_name || 'Nom inconnu',
        employee_number: prof.employee_number,
        hire_date: prof.hire_date,
        specialties: prof.specialties || [],
        status: prof.status
      }));

      // Associer les noms des chefs aux départements
      const departmentsWithHeads = await Promise.all(
        departmentsData.map(async (dept) => {
          if (dept.head_professor_id) {
            const { data } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', dept.head_professor_id)
              .single();
            
            return {
              ...dept,
              head_professor_name: data?.full_name || 'Non spécifié'
            };
          }
          return { ...dept, head_professor_name: 'Non spécifié' };
        })
      );

      setDepartments(departmentsWithHeads);
      setProfessors(transformedProfessors);
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
    
    if (!departmentName.trim()) {
      errors.name = 'Le nom du département est requis';
    }
    
    if (!departmentCode.trim()) {
      errors.code = 'Le code du département est requis';
    } else if (departmentCode.length > 10) {
      errors.code = 'Le code ne doit pas dépasser 10 caractères';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Ouverture du dialogue pour créer
  const handleOpenCreateDialog = () => {
    setCurrentDepartment(null);
    setDepartmentName('');
    setDepartmentCode('');
    setDepartmentDescription('');
    setHeadProfessorId(null);
    setEditMode(false);
    setFormErrors({});
    setDialogOpen(true);
  };

  // Ouverture du dialogue pour éditer
  const handleOpenEditDialog = (department: Department) => {
    setCurrentDepartment(department);
    setDepartmentName(department.name);
    setDepartmentCode(department.code);
    setDepartmentDescription(department.description || '');
    setHeadProfessorId(department.head_professor_id);
    setEditMode(true);
    setFormErrors({});
    setDialogOpen(true);
  };

  // Fermeture du dialogue
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  // Création d'un département
  const handleCreateDepartment = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('departments')
        .insert([
          {
            name: departmentName,
            code: departmentCode,
            description: departmentDescription,
            head_professor_id: headProfessorId
          }
        ])
        .select();
      
      if (error) throw error;
      
      if (data) {
        setSuccessMessage('Département créé avec succès');
        handleCloseDialog();
        await fetchDataRef.current();
      }
    } catch (err) {
      console.error('Erreur lors de la création du département:', err);
      setError('Une erreur est survenue lors de la création du département.');
    } finally {
      setLoading(false);
    }
  };

  // Mise à jour d'un département
  const handleUpdateDepartment = async () => {
    if (!currentDepartment || !validateForm()) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('departments')
        .update({
          name: departmentName,
          code: departmentCode,
          description: departmentDescription,
          head_professor_id: headProfessorId,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentDepartment.id);
      
      if (error) throw error;
      
      setSuccessMessage('Département mis à jour avec succès');
      handleCloseDialog();
      await fetchDataRef.current();
    } catch (err) {
      console.error('Erreur lors de la mise à jour du département:', err);
      setError('Une erreur est survenue lors de la mise à jour du département.');
    } finally {
      setLoading(false);
    }
  };

  // Suppression d'un département
  const handleDeleteDepartment = async (departmentId: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce département ? Cette action est irréversible.')) {
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', departmentId);
      
      if (error) throw error;
      
      setSuccessMessage('Département supprimé avec succès');
      await fetchDataRef.current();
    } catch (err) {
      console.error('Erreur lors de la suppression du département:', err);
      setError('Une erreur est survenue lors de la suppression du département.');
    } finally {
      setLoading(false);
    }
  };

  // Gestion de la pagination
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
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
        Gestion des Départements et Filières
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

      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleOpenCreateDialog}
        >
          Nouveau Département
        </Button>
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        {loading && departments.length === 0 ? (
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
                    <TableCell>Description</TableCell>
                    <TableCell>Chef de département</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {departments
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((department) => (
                      <TableRow key={department.id}>
                        <TableCell>{department.name}</TableCell>
                        <TableCell>{department.code}</TableCell>
                        <TableCell>
                          {department.description ? (
                            department.description.length > 100 
                              ? `${department.description.substring(0, 100)}...`
                              : department.description
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Aucune description
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {department.head_professor_name}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton 
                            color="primary" 
                            onClick={() => handleOpenEditDialog(department)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton 
                            color="error" 
                            onClick={() => handleDeleteDepartment(department.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={departments.length}
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

      {/* Dialogue pour créer/éditer un département */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editMode ? 'Modifier le département' : 'Créer un nouveau département'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Nom du département"
                fullWidth
                value={departmentName}
                onChange={(e) => setDepartmentName(e.target.value)}
                error={!!formErrors.name}
                helperText={formErrors.name}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Code"
                fullWidth
                value={departmentCode}
                onChange={(e) => setDepartmentCode(e.target.value.toUpperCase())}
                error={!!formErrors.code}
                helperText={formErrors.code}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={4}
                value={departmentDescription}
                onChange={(e) => setDepartmentDescription(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Chef de département</InputLabel>
                <Select
                  value={headProfessorId || ''}
                  onChange={(e) => setHeadProfessorId(e.target.value === '' ? null : e.target.value)}
                  label="Chef de département"
                  displayEmpty
                >
                  <MenuItem value="">
                    <em>Aucun</em>
                  </MenuItem>
                  {professors.map((professor) => (
                    <MenuItem key={professor.profile_id} value={professor.profile_id}>
                      {professor.full_name} ({professor.employee_number})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button 
            onClick={editMode ? handleUpdateDepartment : handleCreateDepartment}
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

export default DepartmentManagerPage;
