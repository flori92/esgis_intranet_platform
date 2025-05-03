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
import { supabase } from '../../utils/supabase';

// Types
interface Professor {
  id: number;
  profile_id: string;
  full_name: string;
  email: string;
  employee_number: string;
  hire_date: string;
  specialties: string[];
  status: 'active' | 'on_leave' | 'retired' | 'terminated';
  roles: ProfessorRole[];
  department_name?: string;
  department_id?: number;
}

interface Department {
  id: number;
  name: string;
  code: string;
}

interface ProfessorRole {
  id: number;
  name: string;
  description: string;
  permissions: string[];
}

interface ProfessorRoleAssignment {
  id: number;
  professor_id: number;
  role_id: number;
  assigned_at: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Composant pour les onglets
function TabPanel(props: TabPanelProps) {
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

const ProfessorRolesPage: React.FC = () => {
  const { authState } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<ProfessorRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // États pour le dialogue de rôle
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<ProfessorRole | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [roleEditMode, setRoleEditMode] = useState(false);

  // États pour le dialogue de professeur
  const [professorDialogOpen, setProfessorDialogOpen] = useState(false);
  const [currentProfessor, setCurrentProfessor] = useState<Professor | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<ProfessorRole[]>([]);
  
  // États pour le dialogue d'assignation
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [professorForAssign, setProfessorForAssign] = useState<Professor | null>(null);

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
    setError(null);
    try {
      // 1. Récupérer les départements
      const { data: departmentsData, error: departmentsError } = await supabase
        .from('departments')
        .select('id, name, code')
        .order('name');
      
      if (departmentsError) throw departmentsError;
      setDepartments(departmentsData || []);

      // 2. Récupérer les rôles 
      // Vérifier si la table existe, sinon la créer
      const { data: rolesData, error: rolesError } = await supabase
        .from('professor_roles')
        .select('*')
        .order('name');
      
      if (rolesError) {
        // La table n'existe probablement pas, créons-la
        await supabase.rpc('create_professor_roles_table');
        
        // Initialiser avec des rôles par défaut
        await supabase.from('professor_roles').insert([
          { 
            name: 'Responsable de filière', 
            description: 'Gère une filière spécifique', 
            permissions: ['view_courses', 'edit_courses', 'view_students', 'view_grades', 'edit_grades'] 
          },
          { 
            name: 'Coordinateur des examens', 
            description: 'Coordonne les examens', 
            permissions: ['view_courses', 'view_students', 'view_grades', 'edit_grades'] 
          },
          { 
            name: 'Tuteur', 
            description: 'Accompagne les étudiants', 
            permissions: ['view_students', 'view_grades'] 
          }
        ]);
        
        // Récupérer les rôles nouvellement créés
        const { data: newRolesData } = await supabase
          .from('professor_roles')
          .select('*')
          .order('name');
        
        setRoles(newRolesData || []);
      } else {
        setRoles(rolesData || []);
      }

      // 3. Récupérer les professeurs avec leurs rôles
      const { data: professorsData, error: professorsError } = await supabase
        .from('professors')
        .select(`
          id, 
          employee_number,
          hire_date,
          specialties,
          status,
          profiles:profile_id(id, email, full_name, department_id)
        `)
        .order('employee_number');
      
      if (professorsError) throw professorsError;

      // 4. Récupérer les assignations de rôles
      const { data: roleAssignmentsData, error: roleAssignmentsError } = await supabase
        .from('professor_role_assignments')
        .select('*');
      
      if (roleAssignmentsError) {
        // La table n'existe probablement pas, créons-la
        await supabase.rpc('create_professor_role_assignments_table');
      }
      
      const roleAssignments = roleAssignmentsError ? [] : roleAssignmentsData;

      // 5. Associer les départements et rôles aux professeurs
      const professorsWithDetails = await Promise.all(
        professorsData.map(async (prof) => {
          // Chercher le nom du département
          let departmentName = 'Non assigné';
          let departmentId = null;
          
          if (prof.profiles?.department_id) {
            departmentId = prof.profiles.department_id;
            const dept = departmentsData.find(d => d.id === departmentId);
            if (dept) {
              departmentName = dept.name;
            }
          }
          
          // Trouver les rôles assignés à ce professeur
          const profRoleAssignments = roleAssignments.filter(
            ra => ra.professor_id === prof.id
          );
          
          const profRoles = profRoleAssignments.map(ra => {
            const role = rolesData?.find(r => r.id === ra.role_id);
            return role || null;
          }).filter(Boolean) as ProfessorRole[];
          
          return {
            id: prof.id,
            profile_id: prof.profiles?.id || '',
            full_name: prof.profiles?.full_name || 'Nom inconnu',
            email: prof.profiles?.email || 'Email inconnu',
            employee_number: prof.employee_number,
            hire_date: prof.hire_date,
            specialties: prof.specialties || [],
            status: prof.status,
            department_name: departmentName,
            department_id: departmentId,
            roles: profRoles
          };
        })
      );

      setProfessors(professorsWithDetails);
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

  // Gestion des onglets
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Gestion de la pagination
  const handleChangePage = (_event: unknown, newValue: number) => {
    setPage(newValue);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Fonctions pour la gestion des rôles
  const handleOpenRoleDialog = (role?: ProfessorRole) => {
    if (role) {
      setCurrentRole(role);
      setRoleName(role.name);
      setRoleDescription(role.description);
      setRolePermissions(role.permissions);
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

  const handlePermissionToggle = (permission: string) => {
    if (rolePermissions.includes(permission)) {
      setRolePermissions(rolePermissions.filter(p => p !== permission));
    } else {
      setRolePermissions([...rolePermissions, permission]);
    }
  };

  const handleCreateRole = async () => {
    if (!roleName.trim()) {
      setError('Le nom du rôle est requis');
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('professor_roles')
        .insert([
          {
            name: roleName,
            description: roleDescription,
            permissions: rolePermissions
          }
        ])
        .select();
      
      if (error) throw error;
      
      if (data) {
        setSuccessMessage('Rôle créé avec succès');
        handleCloseRoleDialog();
        await fetchDataRef.current();
      }
    } catch (err) {
      console.error('Erreur lors de la création du rôle:', err);
      setError('Une erreur est survenue lors de la création du rôle.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!currentRole || !roleName.trim()) {
      setError('Le nom du rôle est requis');
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('professor_roles')
        .update({
          name: roleName,
          description: roleDescription,
          permissions: rolePermissions
        })
        .eq('id', currentRole.id);
      
      if (error) throw error;
      
      setSuccessMessage('Rôle mis à jour avec succès');
      handleCloseRoleDialog();
      await fetchDataRef.current();
    } catch (err) {
      console.error('Erreur lors de la mise à jour du rôle:', err);
      setError('Une erreur est survenue lors de la mise à jour du rôle.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async (roleId: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce rôle ? Cette action est irréversible et supprimera tous les liens avec les professeurs.')) {
      return;
    }
    
    setLoading(true);
    try {
      // Supprimer d'abord les assignations
      await supabase
        .from('professor_role_assignments')
        .delete()
        .eq('role_id', roleId);
      
      // Puis supprimer le rôle
      const { error } = await supabase
        .from('professor_roles')
        .delete()
        .eq('id', roleId);
      
      if (error) throw error;
      
      setSuccessMessage('Rôle supprimé avec succès');
      await fetchDataRef.current();
    } catch (err) {
      console.error('Erreur lors de la suppression du rôle:', err);
      setError('Une erreur est survenue lors de la suppression du rôle.');
    } finally {
      setLoading(false);
    }
  };

  // Fonctions pour la gestion des assignations de rôles
  const handleOpenAssignDialog = (professor: Professor) => {
    setProfessorForAssign(professor);
    setSelectedRoles(professor.roles);
    setAssignDialogOpen(true);
  };

  const handleCloseAssignDialog = () => {
    setAssignDialogOpen(false);
    setProfessorForAssign(null);
  };

  const handleSaveRoleAssignments = async () => {
    if (!professorForAssign) return;
    
    setLoading(true);
    try {
      // 1. Supprimer toutes les assignations existantes
      await supabase
        .from('professor_role_assignments')
        .delete()
        .eq('professor_id', professorForAssign.id);
      
      // 2. Créer les nouvelles assignations
      if (selectedRoles.length > 0) {
        const assignmentsToInsert = selectedRoles.map(role => ({
          professor_id: professorForAssign.id,
          role_id: role.id,
          assigned_at: new Date().toISOString()
        }));
        
        const { error } = await supabase
          .from('professor_role_assignments')
          .insert(assignmentsToInsert);
        
        if (error) throw error;
      }
      
      setSuccessMessage('Rôles assignés avec succès');
      handleCloseAssignDialog();
      await fetchDataRef.current();
    } catch (err) {
      console.error('Erreur lors de l\'assignation des rôles:', err);
      setError('Une erreur est survenue lors de l\'assignation des rôles.');
    } finally {
      setLoading(false);
    }
  };

  // Fonctions de rendu
  const renderPermissionCheckboxes = () => {
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {availablePermissions.map((permission) => (
          <FormControlLabel
            key={permission}
            control={
              <Checkbox
                checked={rolePermissions.includes(permission)}
                onChange={() => handlePermissionToggle(permission)}
              />
            }
            label={permission.replace('_', ' ')}
          />
        ))}
      </Box>
    );
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
        Gestion des Rôles et Professeurs
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

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="gestion des rôles">
          <Tab label="Professeurs et Rôles" icon={<PersonIcon />} iconPosition="start" />
          <Tab label="Définition des Rôles" icon={<SettingsIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* Premier onglet: liste des professeurs et leurs rôles */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Liste des Professeurs et leurs Rôles
          </Typography>
          
          <Paper sx={{ width: '100%', overflow: 'hidden' }}>
            {loading && professors.length === 0 ? (
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
                        <TableCell>Matricule</TableCell>
                        <TableCell>Département</TableCell>
                        <TableCell>Spécialités</TableCell>
                        <TableCell>Rôles</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {professors
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((professor) => (
                          <TableRow key={professor.id}>
                            <TableCell>
                              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                <Typography variant="body1">{professor.full_name}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {professor.email}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>{professor.employee_number}</TableCell>
                            <TableCell>{professor.department_name}</TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {professor.specialties.length > 0 ? (
                                  professor.specialties.map((specialty, index) => (
                                    <Chip key={index} label={specialty} size="small" />
                                  ))
                                ) : (
                                  <Typography variant="body2" color="text.secondary">
                                    Non spécifiées
                                  </Typography>
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {professor.roles.length > 0 ? (
                                  professor.roles.map((role) => (
                                    <Chip key={role.id} label={role.name} size="small" color="primary" />
                                  ))
                                ) : (
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
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={professors.length}
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
        </Box>
      </TabPanel>

      {/* Deuxième onglet: définition des rôles */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => handleOpenRoleDialog()}
          >
            Nouveau Rôle
          </Button>
        </Box>

        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          {loading && roles.length === 0 ? (
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nom du rôle</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Permissions</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {roles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell>{role.name}</TableCell>
                        <TableCell>{role.description}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {role.permissions.map((permission, index) => (
                              <Chip 
                                key={index} 
                                label={permission.replace('_', ' ')} 
                                size="small" 
                                color="primary" 
                                variant="outlined" 
                              />
                            ))}
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
            </>
          )}
        </Paper>
      </TabPanel>

      {/* Dialogue pour créer/éditer un rôle */}
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
