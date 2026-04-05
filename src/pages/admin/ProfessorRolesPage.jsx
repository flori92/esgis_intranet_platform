import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Chip,
  FormControlLabel,
  Checkbox,
  Tab,
  Tabs,
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Badge as BadgeIcon
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { getRecordsWithRelation, insertRecord, updateRecord, deleteRecord } from '@/api/helpers';
import { supabase } from '@/supabase';

// Composant pour les onglets
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} id={`tabpanel-${index}`} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ProfessorRolesPage = () => {
  const { authState } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [professors, setProfessors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState(null);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [rolePermissions, setRolePermissions] = useState([]);
  const [roleEditMode, setRoleEditMode] = useState(false);

  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [professorForAssign, setProfessorForAssign] = useState(null);
  const [selectedRoles, setSelectedRoles] = useState([]);

  const availablePermissions = [
    'view_courses', 'edit_courses', 'view_students', 'edit_students',
    'view_grades', 'edit_grades', 'view_departments', 'edit_departments',
    'view_professors', 'edit_professors', 'manage_roles', 'approve_documents',
    'manage_internships', 'view_finances', 'edit_finances'
  ];

  const permissionLabels = {
    'view_courses': 'Voir les cours',
    'edit_courses': 'Gérer les cours',
    'view_students': 'Voir les étudiants',
    'edit_students': 'Gérer les étudiants',
    'view_grades': 'Voir les notes',
    'edit_grades': 'Saisir les notes',
    'view_departments': 'Voir les départements',
    'edit_departments': 'Gérer les départements',
    'view_professors': 'Voir les professeurs',
    'edit_professors': 'Gérer les professeurs',
    'manage_roles': 'Gérer les rôles',
    'approve_documents': 'Valider les documents',
    'manage_internships': 'Gérer les stages',
    'view_finances': 'Voir les finances',
    'edit_finances': 'Gérer les finances'
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      setError(null);
      
      // 1. Charger les professeurs avec leurs assignations
      const professorsData = await getRecordsWithRelation('professors', {
        select: '*, profiles(id, full_name, email), departments(id, name, code), assignments:professor_role_assignments(role:professor_roles(*))'
      });

      const formattedProfessors = (professorsData || []).map(prof => ({
        id: prof.id,
        profile_id: prof.profile_id,
        full_name: prof.profiles?.full_name || 'Nom inconnu',
        email: prof.profiles?.email || 'Email inconnu',
        employee_number: prof.employee_number || '',
        department_name: prof.departments?.name || 'Non assigné',
        // On aplatit les rôles pour l'UI
        roles: (prof.assignments || []).map(a => a.role).filter(Boolean)
      }));

      setProfessors(formattedProfessors);

      // 2. Charger les départements
      const departmentsData = await getRecordsWithRelation('departments');
      setDepartments(departmentsData || []);

      // 3. Charger les définitions de rôles
      const rolesData = await getRecordsWithRelation('professor_roles');
      setRoles(rolesData || []);

    } catch (err) {
      console.error('Erreur fetchData:', err);
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authState.isAdmin) fetchData();
  }, [authState.isAdmin, fetchData]);

  const handleOpenRoleDialog = (role = null) => {
    if (role) {
      setCurrentRole(role);
      setRoleName(role.name);
      setRoleDescription(role.description || '');
      setRolePermissions(role.permissions || []);
      setRoleEditMode(true);
    } else {
      setCurrentRole(null);
      setRoleName('');
      setRoleDescription('');
      setRolePermissions([]);
      setRoleEditMode(false);
    }
    setRoleDialogOpen(true);
  };

  const handleSaveRole = async () => {
    if (!roleName.trim()) return setError('Le nom du rôle est requis');
    setLoading(true);
    try {
      const payload = {
        name: roleName,
        description: roleDescription,
        permissions: rolePermissions,
        updated_at: new Date().toISOString()
      };

      if (roleEditMode) {
        await updateRecord('professor_roles', currentRole.id, payload);
        setSuccessMessage('Rôle mis à jour');
      } else {
        await insertRecord('professor_roles', { ...payload, created_at: new Date().toISOString() });
        setSuccessMessage('Rôle créé');
      }
      
      setRoleDialogOpen(false);
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (!window.confirm('Supprimer ce rôle ?')) return;
    setLoading(true);
    try {
      await deleteRecord('professor_roles', roleId);
      setSuccessMessage('Rôle supprimé');
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAssignDialog = (professor) => {
    setProfessorForAssign(professor);
    setSelectedRoles(professor.roles || []);
    setAssignDialogOpen(true);
  };

  const handleSaveAssignments = async () => {
    setLoading(true);
    try {
      // 1. Supprimer les anciennes assignations
      await supabase.from('professor_role_assignments').delete().eq('professor_id', professorForAssign.id);

      // 2. Insérer les nouvelles
      if (selectedRoles.length > 0) {
        const newAssignments = selectedRoles.map(r => ({
          professor_id: professorForAssign.id,
          role_id: r.id
        }));
        const { error } = await supabase.from('professor_role_assignments').insert(newAssignments);
        if (error) throw error;
      }

      setSuccessMessage('Rôles mis à jour');
      setAssignDialogOpen(false);
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const displayedProfessors = professors.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>Gestion des Rôles</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      <Snackbar open={!!successMessage} autoHideDuration={3000} onClose={() => setSuccessMessage(null)} message={successMessage} />

      <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 3 }}>
        <Tab label="Assignations" />
        <Tab label="Définition des Rôles" />
      </Tabs>

      <TabPanel value={tabValue} index={0}>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead><TableRow>
              <TableCell>Nom</TableCell><TableCell>Email</TableCell><TableCell>Département</TableCell><TableCell>Rôles</TableCell><TableCell align="right">Actions</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {displayedProfessors.map((prof) => (
                <TableRow key={prof.id}>
                  <TableCell>{prof.full_name}</TableCell>
                  <TableCell>{prof.email}</TableCell>
                  <TableCell>{prof.department_name}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap">
                      {prof.roles.map(r => <Chip key={r.id} label={r.name} size="small" color="primary" />)}
                      {prof.roles.length === 0 && <Typography variant="caption" color="text.secondary">Aucun</Typography>}
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton color="primary" onClick={() => handleOpenAssignDialog(prof)}><BadgeIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination component="div" count={professors.length} page={page} onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))} />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenRoleDialog()}>Nouveau rôle</Button>
        </Box>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead><TableRow>
              <TableCell>Nom</TableCell><TableCell>Description</TableCell><TableCell>Permissions</TableCell><TableCell align="right">Actions</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell fontWeight="bold">{role.name}</TableCell>
                  <TableCell>{role.description}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(role.permissions || []).map(p => (
                        <Chip 
                          key={p} 
                          label={permissionLabels[p] || p.replace(/_/g, ' ')} 
                          size="small" 
                          variant="outlined" 
                        />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => handleOpenRoleDialog(role)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton color="error" onClick={() => handleDeleteRole(role.id)}><DeleteIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* DIALOG RÔLE */}
      <Dialog open={roleDialogOpen} onClose={() => setRoleDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{roleEditMode ? 'Modifier' : 'Créer'} un rôle</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3}>
            <TextField label="Nom du rôle" fullWidth value={roleName} onChange={(e) => setRoleName(e.target.value)} required />
            <TextField label="Description" fullWidth multiline rows={2} value={roleDescription} onChange={(e) => setRoleDescription(e.target.value)} />
            <Box>
              <Typography variant="subtitle2" gutterBottom>Permissions</Typography>
              <Grid container>
                {availablePermissions.map(p => (
                  <Grid item xs={6} sm={4} key={p}>
                    <FormControlLabel control={<Checkbox checked={rolePermissions.includes(p)} onChange={() => {
                      setRolePermissions(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
                    }} />} label={permissionLabels[p] || p.replace(/_/g, ' ')} />
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleDialogOpen(false)}>Annuler</Button>
          <Button onClick={handleSaveRole} variant="contained">Sauvegarder</Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG ASSIGNATION */}
      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assigner des rôles à {professorForAssign?.full_name}</DialogTitle>
        <DialogContent dividers>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Rôles</InputLabel>
            <Select
              multiple
              value={selectedRoles.map(r => r.id)}
              label="Rôles"
              onChange={(e) => {
                const ids = e.target.value;
                setSelectedRoles(roles.filter(r => ids.includes(r.id)));
              }}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map(id => <Chip key={id} label={roles.find(r => r.id === id)?.name} size="small" color="primary" />)}
                </Box>
              )}
            >
              {roles.map(r => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Annuler</Button>
          <Button onClick={handleSaveAssignments} variant="contained" startIcon={<SaveIcon />}>Enregistrer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProfessorRolesPage;
