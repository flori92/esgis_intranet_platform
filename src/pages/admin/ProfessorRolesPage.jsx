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
  Chip,
  FormControlLabel,
  Checkbox,
  Tab,
  Tabs,
  Autocomplete
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Badge as BadgeIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '@/supabase';

// Créer des fonctions utilitaires pour remplacer les imports manquants
const getRecordsWithRelation = async (table, options = {}) => {
  try {
    let query = supabase.from(table).select(options.select || '*');
    
    if (options.filters) {
      options.filters.forEach(filter => {
        query = query[filter.operator](filter.column, filter.value);
      });
    }
    
    if (options.orderBy) {
      query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending });
    }
    
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Erreur lors de la récupération des données de ${table}:`, error);
    throw error;
  }
};

const insertRecord = async (table, data) => {
  try {
    const { data: result, error } = await supabase.from(table).insert(data).select();
    if (error) throw error;
    return result[0];
  } catch (error) {
    console.error(`Erreur lors de l'insertion dans ${table}:`, error);
    throw error;
  }
};

const updateRecord = async (table, id, data) => {
  try {
    const { data: result, error } = await supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select();
    if (error) throw error;
    return result[0];
  } catch (error) {
    console.error(`Erreur lors de la mise à jour dans ${table}:`, error);
    throw error;
  }
};

const deleteRecord = async (table, id) => {
  try {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Erreur lors de la suppression dans ${table}:`, error);
    throw error;
  }
};

// Composant pour les onglets
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
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

  // États pour le dialogue de rôle
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState(null);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [rolePermissions, setRolePermissions] = useState([]);
  const [roleEditMode, setRoleEditMode] = useState(false);

  // États pour le dialogue de professeur
  const [professorDialogOpen, setProfessorDialogOpen] = useState(false);
  const [currentProfessor, setCurrentProfessor] = useState(null);
  const [selectedRoles, setSelectedRoles] = useState([]);
  
  // États pour le dialogue d'assignation
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [professorForAssign, setProfessorForAssign] = useState(null);

  // Liste des permissions disponibles
  const availablePermissions = [
    'view_courses',
    'edit_courses',
    'view_students',
    'edit_students',
    'view_grades',
    'edit_grades',
    'view_departments',
    'edit_departments',
    'view_professors',
    'edit_professors',
    'manage_roles',
    'approve_documents',
    'manage_internships',
    'view_finances',
    'edit_finances'
  ];

  // Référence pour éviter les recréations de fonctions
  const fetchDataRef = useRef(async () => {
    setLoading(true);
    try {
      setError(null);
      
      // Charger les professeurs
      const { data: professorsData, error: professorsError } = await getRecordsWithRelation('professors', {
        select: '*, profiles(id, full_name, email), departments(id, name, code), professor_roles(role_id, professor_roles_permissions(*))'
      });

      if (professorsError) {
        throw professorsError;
      }

      // Transformer les données
      const formattedProfessors = professorsData.map(prof => ({
        id: prof.id,
        profile_id: prof.profile_id,
        full_name: prof.profiles?.full_name || 'Nom inconnu',
        email: prof.profiles?.email || 'Email inconnu',
        employee_number: prof.employee_number || '',
        hire_date: prof.hire_date || '',
        specialties: prof.specialties || [],
        status: prof.status || 'active',
        department_id: prof.department_id,
        department_name: prof.departments?.name || 'Non assigné',
        roles: prof.professor_roles || []
      }));

      setProfessors(formattedProfessors);

      // Charger les départements
      const { data: departmentsData, error: departmentsError } = await getRecordsWithRelation('departments');

      if (departmentsError) {
        throw departmentsError;
      }

      setDepartments(departmentsData);

      // Charger les rôles
      const { data: rolesData, error: rolesError } = await getRecordsWithRelation('roles');

      if (rolesError) {
        throw rolesError;
      }

      setRoles(rolesData);
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError(err.message || 'Une erreur est survenue lors du chargement des données');
    } finally {
      setLoading(false);
    }
  });

  useEffect(() => {
    // Vérifier si l'utilisateur est autorisé
    if (!authState.isAdmin) {
      window.location.href = '/';
      return;
    }

    // Charger les données
    const loadData = async () => {
      await fetchDataRef.current();
    };
    
    loadData();
  }, [authState.isAdmin]);

  const fetchData = async () => {
    if (fetchDataRef.current) {
      await fetchDataRef.current();
    }
  };

  // Gestion des onglets
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Gestion de la pagination
  const handleChangePage = (event, newValue) => {
    setPage(newValue);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Fonctions pour la gestion des rôles
  const handleOpenRoleDialog = (role) => {
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

  const handleCloseRoleDialog = () => {
    setRoleDialogOpen(false);
  };

  const handlePermissionToggle = (permission) => {
    const currentPermissions = [...rolePermissions];
    if (currentPermissions.includes(permission)) {
      setRolePermissions(currentPermissions.filter(p => p !== permission));
    } else {
      setRolePermissions([...currentPermissions, permission]);
    }
  };

  const handleCreateRole = async () => {
    if (!roleName.trim()) {
      setError('Le nom du rôle est requis');
      return;
    }

    try {
      setLoading(true);
      
      // Créer un nouveau rôle
      const { data: roleData, error: roleError } = await insertRecord('roles', {
        name: roleName,
        description: roleDescription,
        permissions: rolePermissions,
        created_at: new Date().toISOString()
      });

      if (roleError) {
        throw roleError;
      }

      setRoles([...roles, roleData]);
      setSuccessMessage('Rôle créé avec succès');
      handleCloseRoleDialog();
    } catch (err) {
      console.error('Erreur lors de la création du rôle:', err);
      setError(err.message || 'Erreur lors de la création du rôle');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!roleName.trim() || !currentRole) {
      setError('Le nom du rôle est requis');
      return;
    }

    try {
      setLoading(true);
      
      // Mettre à jour le rôle
      const { error: roleError } = await updateRecord('roles', currentRole.id, {
        name: roleName,
        description: roleDescription,
        permissions: rolePermissions,
        updated_at: new Date().toISOString()
      });

      if (roleError) {
        throw roleError;
      }

      // Mettre à jour l'état local
      setRoles(roles.map(role => 
        role.id === currentRole.id 
          ? { ...role, name: roleName, description: roleDescription, permissions: rolePermissions }
          : role
      ));
      
      setSuccessMessage('Rôle mis à jour avec succès');
      handleCloseRoleDialog();
    } catch (err) {
      console.error('Erreur lors de la mise à jour du rôle:', err);
      setError(err.message || 'Erreur lors de la mise à jour du rôle');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async (roleId) => {
    // Demander confirmation
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce rôle ? Cela supprimera également toutes les assignations de ce rôle.')) {
      return;
    }

    try {
      setLoading(true);
      
      // Supprimer d'abord les assignations de ce rôle
      const { error: assignmentsError } = await deleteRecord('professor_roles', roleId);

      if (assignmentsError) {
        throw assignmentsError;
      }

      // Supprimer le rôle
      const { error: roleError } = await deleteRecord('roles', roleId);

      if (roleError) {
        throw roleError;
      }

      // Mettre à jour l'état local
      setRoles(roles.filter(role => role.id !== roleId));
      
      setSuccessMessage('Rôle supprimé avec succès');
    } catch (err) {
      console.error('Erreur lors de la suppression du rôle:', err);
      setError(err.message || 'Erreur lors de la suppression du rôle');
    } finally {
      setLoading(false);
    }
  };

  // Fonctions pour la gestion des assignations de rôles
  const handleOpenAssignDialog = (professor) => {
    setProfessorForAssign(professor);
    setSelectedRoles(professor.roles.map(r => roles.find(role => role.id === r.role_id)).filter(Boolean));
    setAssignDialogOpen(true);
  };

  const handleCloseAssignDialog = () => {
    setAssignDialogOpen(false);
    setProfessorForAssign(null);
  };

  const handleSaveRoleAssignments = async () => {
    if (!professorForAssign) {
      return;
    }

    try {
      setLoading(true);
      
      // Supprimer d'abord toutes les assignations existantes
      const { error: deleteError } = await deleteRecord('professor_roles', professorForAssign.id);

      if (deleteError) {
        throw deleteError;
      }

      // Ajouter les nouvelles assignations
      if (selectedRoles.length > 0) {
        const assignments = selectedRoles.map(role => ({
          professor_id: professorForAssign.id,
          role_id: role.id,
          assigned_at: new Date().toISOString()
        }));

        const { error: insertError } = await insertRecord('professor_roles', assignments);

        if (insertError) {
          throw insertError;
        }
      }

      // Mettre à jour l'état local
      setProfessors(professors.map(prof => 
        prof.id === professorForAssign.id 
          ? { ...prof, roles: selectedRoles.map(role => ({ role_id: role.id })) }
          : prof
      ));
      
      setSuccessMessage('Rôles assignés avec succès');
      handleCloseAssignDialog();
    } catch (err) {
      console.error('Erreur lors de l\'assignation des rôles:', err);
      setError(err.message || 'Erreur lors de l\'assignation des rôles');
    } finally {
      setLoading(false);
    }
  };

  // Fonctions de rendu
  const renderPermissionCheckboxes = () => {
    return (
      <Grid container spacing={1}>
        {availablePermissions.map((permission) => (
          <Grid item xs={12} sm={6} md={4} key={permission}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={rolePermissions.includes(permission)}
                  onChange={() => handlePermissionToggle(permission)}
                  name={permission}
                />
              }
              label={permission.replace(/_/g, ' ')}
            />
          </Grid>
        ))}
      </Grid>
    );
  };

  // Calculer les indices pour la pagination
  const startIndex = page * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const displayedProfessors = professors.slice(startIndex, endIndex);
  const displayedRoles = roles.slice(startIndex, endIndex);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gestion des rôles des professeurs
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

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="roles tabs">
          <Tab label="Professeurs" />
          <Tab label="Rôles" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        {loading ? (
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
                    <TableCell>Email</TableCell>
                    <TableCell>Département</TableCell>
                    <TableCell>Rôles</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayedProfessors.map((professor) => (
                    <TableRow key={professor.id}>
                      <TableCell>{professor.full_name}</TableCell>
                      <TableCell>{professor.email}</TableCell>
                      <TableCell>{professor.department_name}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {professor.roles.map((profRole, index) => {
                            const role = roles.find(r => r.id === profRole.role_id);
                            return role ? (
                              <Chip 
                                key={index} 
                                label={role.name} 
                                size="small" 
                                color="primary" 
                              />
                            ) : null;
                          })}
                          {professor.roles.length === 0 && (
                            <Typography variant="body2" color="text.secondary">
                              Aucun rôle assigné
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          color="primary"
                          onClick={() => handleOpenAssignDialog(professor)}
                        >
                          <BadgeIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={professors.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Lignes par page"
            />
          </>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenRoleDialog()}
          >
            Nouveau rôle
          </Button>
        </Box>

        {loading ? (
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
                    <TableCell>Description</TableCell>
                    <TableCell>Permissions</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayedRoles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell>{role.name}</TableCell>
                      <TableCell>{role.description || '-'}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {role.permissions && role.permissions.map((permission, index) => (
                            <Chip 
                              key={index} 
                              label={permission.replace(/_/g, ' ')} 
                              size="small" 
                              color="primary" 
                              variant="outlined" 
                            />
                          ))}
                          {(!role.permissions || role.permissions.length === 0) && (
                            <Typography variant="body2" color="text.secondary">
                              Aucune permission
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          color="primary"
                          onClick={() => handleOpenRoleDialog(role)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteRole(role.id)}
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
              component="div"
              count={roles.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Lignes par page"
            />
          </>
        )}
      </TabPanel>

      {/* Dialogue pour créer/modifier un rôle */}
      <Dialog
        open={roleDialogOpen}
        onClose={handleCloseRoleDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {roleEditMode ? 'Modifier le rôle' : 'Créer un nouveau rôle'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Nom du rôle"
                fullWidth
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={2}
                value={roleDescription}
                onChange={(e) => setRoleDescription(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1">Permissions</Typography>
              {renderPermissionCheckboxes()}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRoleDialog}>Annuler</Button>
          <Button 
            onClick={roleEditMode ? handleUpdateRole : handleCreateRole}
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} />
            ) : (
              roleEditMode ? 'Mettre à jour' : 'Créer'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialogue pour assigner des rôles */}
      <Dialog 
        open={assignDialogOpen} 
        onClose={handleCloseAssignDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Assigner des rôles à {professorForAssign?.full_name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Autocomplete
              multiple
              options={roles}
              getOptionLabel={(option) => option.name}
              value={selectedRoles}
              onChange={(_event, newValue) => {
                setSelectedRoles(newValue);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  label="Rôles"
                  placeholder="Sélectionner des rôles"
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip 
                    label={option.name} 
                    {...getTagProps({ index })} 
                    color="primary"
                  />
                ))
              }
            />
            
            {selectedRoles.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Permissions accordées
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {Array.from(new Set(selectedRoles.flatMap(role => role.permissions))).map(
                    (permission, index) => (
                      <Chip 
                        key={index} 
                        label={permission.replace('_', ' ')} 
                        size="small" 
                        color="primary" 
                        variant="outlined" 
                      />
                    )
                  )}
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAssignDialog}>Annuler</Button>
          <Button 
            onClick={handleSaveRoleAssignments}
            variant="contained"
            color="primary"
            disabled={loading}
            startIcon={<SaveIcon />}
          >
            {loading ? <CircularProgress size={24} /> : 'Enregistrer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProfessorRolesPage;
