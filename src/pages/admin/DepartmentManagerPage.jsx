import { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, IconButton, Dialog, DialogActions,
  DialogContent, DialogTitle, TextField, FormControl, InputLabel,
  Select, MenuItem, CircularProgress, Grid, Alert, Snackbar,
  TablePagination
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import {
  getDepartmentsWithProfessors, createDepartmentAdmin,
  updateDepartmentAdmin, deleteDepartmentAdmin, getProfessorsList
} from '../../api/admin';

const DepartmentManagerPage = () => {
  const { authState } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [formData, setFormData] = useState({
    name: '', code: '', description: '', head_professor_id: null
  });
  const [formErrors, setFormErrors] = useState({});
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('success');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [deptsResult, profsResult] = await Promise.all([
        getDepartmentsWithProfessors(),
        getProfessorsList(),
      ]);

      if (deptsResult.error) throw deptsResult.error;
      if (profsResult.error) throw profsResult.error;

      setDepartments(deptsResult.data || []);
      setProfessors(profsResult.data || []);
    } catch (err) {
      setError('Une erreur est survenue lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Le nom du département est requis';
    if (!formData.code.trim()) errors.code = 'Le code du département est requis';
    else if (!/^[A-Z0-9]+$/.test(formData.code)) errors.code = 'Le code doit contenir uniquement des lettres majuscules et des chiffres';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenDialog = (department = null) => {
    if (department) {
      setEditingDepartment(department);
      setFormData({
        name: department.name, code: department.code,
        description: department.description || '',
        head_professor_id: department.head_professor_id || null
      });
    } else {
      setEditingDepartment(null);
      setFormData({ name: '', code: '', description: '', head_professor_id: null });
    }
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setTimeout(() => {
      setEditingDepartment(null);
      setFormData({ name: '', code: '', description: '', head_professor_id: null });
      setFormErrors({});
    }, 200);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const payload = {
        name: formData.name,
        code: formData.code,
        description: formData.description,
        head_professor_id: formData.head_professor_id || null,
      };

      if (editingDepartment) {
        const { error } = await updateDepartmentAdmin(editingDepartment.id, payload);
        if (error) throw error;
        setAlertMessage('Département mis à jour avec succès');
      } else {
        const { error } = await createDepartmentAdmin(payload);
        if (error) throw error;
        setAlertMessage('Département créé avec succès');
      }

      setAlertSeverity('success');
      setAlertOpen(true);
      handleCloseDialog();
      fetchData();
    } catch (err) {
      setAlertMessage('Une erreur est survenue lors de la sauvegarde du département');
      setAlertSeverity('error');
      setAlertOpen(true);
    }
  };

  const handleDelete = async (departmentId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce département ?')) return;

    try {
      const { error } = await deleteDepartmentAdmin(departmentId);
      if (error) throw error;
      setAlertMessage('Département supprimé avec succès');
      setAlertSeverity('success');
      setAlertOpen(true);
      fetchData();
    } catch (err) {
      setAlertMessage('Une erreur est survenue lors de la suppression du département');
      setAlertSeverity('error');
      setAlertOpen(true);
    }
  };

  const filteredDepartments = departments.filter(dept =>
    dept.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedDepartments = filteredDepartments.slice(
    page * rowsPerPage, page * rowsPerPage + rowsPerPage
  );

  if (error && !departments.length) {
    return <Box sx={{ p: 3 }}><Alert severity="error">{error}</Alert></Box>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Gestion des départements</Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Rechercher un département" variant="outlined"
              value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
              InputProps={{ startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} /> }}
              placeholder="Nom ou code du département..." />
          </Grid>
          <Grid item xs={12} sm={6} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
              Ajouter un département
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>
      ) : (
        <Paper sx={{ width: '100%' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell>Nom</TableCell>
                  <TableCell>Professeurs</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedDepartments.map((dept) => (
                  <TableRow key={dept.id}>
                    <TableCell>{dept.code}</TableCell>
                    <TableCell>{dept.name}</TableCell>
                    <TableCell>{dept.professors?.length || 0} professeur(s)</TableCell>
                    <TableCell>{dept.description || '-'}</TableCell>
                    <TableCell align="right">
                      <IconButton color="primary" onClick={() => handleOpenDialog(dept)}><EditIcon /></IconButton>
                      <IconButton color="error" onClick={() => handleDelete(dept.id)}><DeleteIcon /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {paginatedDepartments.length === 0 && (
                  <TableRow><TableCell colSpan={5} align="center">Aucun département trouvé</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination component="div" count={filteredDepartments.length}
            page={page} onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            labelRowsPerPage="Lignes par page"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`} />
        </Paper>
      )}

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingDepartment ? 'Modifier le département' : 'Ajouter un département'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField fullWidth label="Nom du département" name="name" value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={!!formErrors.name} helperText={formErrors.name} sx={{ mb: 2 }} />
            <TextField fullWidth label="Code du département" name="code" value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              error={!!formErrors.code} helperText={formErrors.code} sx={{ mb: 2 }} />
            <TextField fullWidth label="Description" name="description" value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline rows={3} sx={{ mb: 2 }} />
            <FormControl fullWidth>
              <InputLabel>Chef de département</InputLabel>
              <Select value={formData.head_professor_id || ''} label="Chef de département"
                onChange={(e) => setFormData({ ...formData, head_professor_id: e.target.value || null })}>
                <MenuItem value=""><em>Aucun</em></MenuItem>
                {professors.map((prof) => (
                  <MenuItem key={prof.id} value={prof.id}>{prof.full_name || 'Professeur sans nom'}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button onClick={handleSubmit} variant="contained">{editingDepartment ? 'Modifier' : 'Ajouter'}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={alertOpen} autoHideDuration={6000} onClose={() => setAlertOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setAlertOpen(false)} severity={alertSeverity} sx={{ width: '100%' }}>{alertMessage}</Alert>
      </Snackbar>
    </Box>
  );
};

export default DepartmentManagerPage;
