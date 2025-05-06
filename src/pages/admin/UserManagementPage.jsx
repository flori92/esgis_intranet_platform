import React, { useState, useEffect, useRef } from 'react';

// Imports directs pour tous les composants Material-UI
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

// Imports pour les icônes
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';

import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/supabase';
import Papa from 'papaparse';

// Style pour le composant de téléchargement de fichier
const inputUploadStyle = {
  position: 'absolute',
  width: '100%',
  height: '100%',
  top: 0,
  left: 0,
  opacity: 0,
  cursor: 'pointer'
};

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
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

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

const UserManagementPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [tabValue, setTabValue] = useState(0);
  
  // États pour le formulaire
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentUser, setCurrentUser] = useState({
    full_name: '',
    email: '',
    role: 'student',
    department_id: '',
    status: 'active'
  });
  
  // États pour les messages
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // État pour le dialogue de confirmation
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    action: null,
    userId: null
  });
  
  // État pour l'importation d'utilisateurs
  const [importing, setImporting] = useState(false);
  
  // Référence pour l'input de fichier
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      fetchUsers();
      fetchDepartments();
    }
  }, [user]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Récupérer les utilisateurs avec les informations du département
      let { data: usersData, error } = await supabase
        .from('profiles')
        .select(`
          id,
          created_at,
          full_name,
          email,
          role,
          department_id,
          status,
          departments(name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Formater les données des utilisateurs
      const formattedUsers = usersData.map(user => ({
        ...user,
        department_name: user.departments ? user.departments.name : 'Non assigné'
      }));

      setUsers(formattedUsers);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      showSnackbar('Erreur lors du chargement des utilisateurs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');

      if (error) {
        throw error;
      }
      setDepartments(data);
    } catch (error) {
      console.error('Erreur lors du chargement des départements:', error);
      showSnackbar('Erreur lors du chargement des départements', 'error');
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleOpenDialog = (edit = false, user = null) => {
    setIsEditMode(edit);
    if (edit && user) {
      setCurrentUser({
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        department_id: user.department_id || '',
        status: user.status
      });
    } else {
      setCurrentUser({
        full_name: '',
        email: '',
        role: 'student',
        department_id: '',
        status: 'active'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      if (isEditMode) {
        // Mise à jour de l'utilisateur existant
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: currentUser.full_name,
            email: currentUser.email,
            role: currentUser.role,
            department_id: currentUser.department_id || null,
            status: currentUser.status
          })
          .eq('id', currentUser.id);

        if (error) {
          throw error;
        }
        showSnackbar('Utilisateur mis à jour avec succès', 'success');
      } else {
        // Création d'un nouvel utilisateur
        // Pour un nouvel utilisateur, nous devons également créer un enregistrement d'authentification
        // Note: Dans une application réelle, cela nécessiterait un endpoint API sécurisé

        // 1. Créer un mot de passe temporaire
        const tempPassword = Math.random().toString(36).slice(-8);

        // 2. Créer un utilisateur dans auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: currentUser.email,
          password: tempPassword,
        });

        if (authError) {
          throw authError;
        }

        // 3. Créer un profil pour l'utilisateur
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: authData.user.id,
              full_name: currentUser.full_name,
              email: currentUser.email,
              role: currentUser.role,
              department_id: currentUser.department_id || null,
              status: currentUser.status
            }
          ]);

        if (profileError) {
          throw profileError;
        }

        // 4. Créer un enregistrement dans la table students ou professors selon le rôle
        if (currentUser.role === 'student') {
          const { error: studentError } = await supabase
            .from('students')
            .insert([
              {
                user_id: authData.user.id,
                full_name: currentUser.full_name,
                email: currentUser.email,
                department_id: currentUser.department_id || null,
                academic_year: new Date().getFullYear().toString()
              }
            ]);

          if (studentError) {
            throw studentError;
          }
        } else if (currentUser.role === 'professor') {
          const { error: professorError } = await supabase
            .from('professors')
            .insert([
              {
                user_id: authData.user.id,
                full_name: currentUser.full_name,
                email: currentUser.email,
                department_id: currentUser.department_id || null
              }
            ]);

          if (professorError) {
            throw professorError;
          }
        }

        showSnackbar(`Utilisateur créé avec succès. Un email a été envoyé à ${currentUser.email}`, 'success');
      }

      handleCloseDialog();
      fetchUsers();
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      showSnackbar(`Erreur: ${error.message}`, 'error');
    }
  };

  const handleDeleteUser = (userId) => {
    setConfirmDialog({
      open: true,
      title: 'Confirmer la suppression',
      message: 'Êtes-vous sûr de vouloir supprimer cet utilisateur? Cette action est irréversible.',
      action: 'delete',
      userId
    });
  };

  const handleDeactivateUser = (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const message = newStatus === 'active' 
      ? 'Êtes-vous sûr de vouloir réactiver cet utilisateur?' 
      : 'Êtes-vous sûr de vouloir désactiver cet utilisateur?';
    
    setConfirmDialog({
      open: true,
      title: newStatus === 'active' ? 'Confirmer la réactivation' : 'Confirmer la désactivation',
      message,
      action: 'toggleStatus',
      userId,
      newStatus
    });
  };

  const confirmAction = async () => {
    try {
      const { action, userId, newStatus } = confirmDialog;

      if (action === 'delete') {
        // Supprimer l'utilisateur
        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('id', userId);

        if (error) {
          throw error;
        }
        showSnackbar('Utilisateur supprimé avec succès', 'success');
      } else if (action === 'toggleStatus') {
        // Changer le statut de l'utilisateur
        const { error } = await supabase
          .from('profiles')
          .update({ status: newStatus })
          .eq('id', userId);

        if (error) {
          throw error;
        }
        showSnackbar(`Utilisateur ${newStatus === 'active' ? 'activé' : 'désactivé'} avec succès`, 'success');
      }

      setConfirmDialog({ ...confirmDialog, open: false });
      fetchUsers();
    } catch (error) {
      console.error('Erreur lors de la confirmation:', error);
      showSnackbar(`Erreur: ${error.message}`, 'error');
    }
  };

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        setImporting(true);
        const csv = e.target.result;
        
        // Analyser le CSV
        Papa.parse(csv, {
          header: true,
          complete: async (results) => {
            const { data } = results;
            
            // Validation des données
            if (!data || data.length === 0) {
              throw new Error('Le fichier CSV est vide ou mal formaté');
            }

            const requiredFields = ['full_name', 'email', 'role'];
            const firstRow = data[0];
            const missingFields = requiredFields.filter(field => !(field in firstRow));
            
            if (missingFields.length > 0) {
              throw new Error(`Champs requis manquants: ${missingFields.join(', ')}`);
            }

            // Créer les utilisateurs
            let successful = 0;
            let failed = 0;
            
            for (const row of data) {
              try {
                // Valider le rôle
                const role = row.role ? row.role.toLowerCase() : 'student';
                if (!['student', 'professor', 'admin'].includes(role)) {
                  throw new Error(`Rôle invalide: ${row.role}`);
                }
                
                // 1. Créer un mot de passe temporaire
                const tempPassword = Math.random().toString(36).slice(-8);
                
                // 2. Créer un utilisateur dans auth
                const { data: authData, error: authError } = await supabase.auth.signUp({
                  email: row.email,
                  password: tempPassword,
                });
                
                if (authError) {
                  throw authError;
                }
                
                // 3. Récupérer l'ID du département si fourni
                let departmentId = null;
                if (row.department) {
                  const { data: deptData } = await supabase
                    .from('departments')
                    .select('id')
                    .eq('name', row.department)
                    .single();
                  
                  if (deptData) {
                    departmentId = deptData.id;
                  }
                }
                
                // 4. Créer un profil pour l'utilisateur
                await supabase
                  .from('profiles')
                  .insert([
                    {
                      id: authData.user.id,
                      full_name: row.full_name,
                      email: row.email,
                      role,
                      department_id: departmentId,
                      status: 'active'
                    }
                  ]);
                
                // 5. Créer un enregistrement dans la table students ou professors selon le rôle
                if (role === 'student') {
                  await supabase
                    .from('students')
                    .insert([
                      {
                        user_id: authData.user.id,
                        full_name: row.full_name,
                        email: row.email,
                        department_id: departmentId,
                        academic_year: row.academic_year || new Date().getFullYear().toString()
                      }
                    ]);
                } else if (role === 'professor') {
                  await supabase
                    .from('professors')
                    .insert([
                      {
                        user_id: authData.user.id,
                        full_name: row.full_name,
                        email: row.email,
                        department_id: departmentId
                      }
                    ]);
                }
                
                successful++;
              } catch (error) {
                console.error(`Erreur pour l'utilisateur ${row.email}:`, error);
                failed++;
              }
            }
            
            showSnackbar(`Importation terminée: ${successful} utilisateurs créés, ${failed} échecs`, 'info');
            fetchUsers();
          },
          error: (error) => {
            throw new Error(`Erreur d'analyse CSV: ${error.message}`);
          }
        });
      } catch (error) {
        console.error('Erreur lors de l\'importation:', error);
        showSnackbar(`Erreur: ${error.message}`, 'error');
      } finally {
        setImporting(false);
        // Réinitialiser l'input file pour permettre de réimporter le même fichier
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    
    reader.readAsText(file);
  };

  const exportUsersTemplate = () => {
    // Créer le contenu CSV
    const header = ['full_name', 'email', 'role', 'department', 'academic_year'];
    const exampleRow = ['John Doe', 'john.doe@example.com', 'student', 'Informatique', '2023-2024'];
    
    const csvContent = [
      header.join(','),
      exampleRow.join(',')
    ].join('\n');
    
    // Créer un Blob et télécharger
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_utilisateurs.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Gestion des Utilisateurs
        </Typography>
        
        <Box>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => handleOpenDialog(false)}
            sx={{ mr: 1 }}
          >
            Nouvel Utilisateur
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<GroupAddIcon />}
            sx={{ position: 'relative', overflow: 'hidden', mr: 1 }}
            color="primary"
            disabled={importing}
          >
            Importer CSV
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              style={inputUploadStyle}
              ref={fileInputRef}
              disabled={importing}
            />
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={exportUsersTemplate}
          >
            Télécharger Template
          </Button>
        </Box>
      </Box>

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="user management tabs">
            <Tab label="Tous les utilisateurs" {...a11yProps(0)} />
            <Tab label="Étudiants" {...a11yProps(1)} />
            <Tab label="Professeurs" {...a11yProps(2)} />
            <Tab label="Administrateurs" {...a11yProps(3)} />
          </Tabs>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TabPanel value={tabValue} index={tabValue}>
            <TableContainer>
              <Table sx={{ minWidth: 650 }} aria-label="utilisateurs table">
                <TableHead>
                  <TableRow>
                    <TableCell>Nom</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Rôle</TableCell>
                    <TableCell>Département</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users
                    .filter(user => {
                      if (tabValue === 0) {
                        return true;
                      }
                      if (tabValue === 1) {
                        return user.role === 'student';
                      }
                      if (tabValue === 2) {
                        return user.role === 'professor';
                      }
                      if (tabValue === 3) {
                        return user.role === 'admin';
                      }
                      return true;
                    })
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((user) => (
                      <TableRow key={user.id}>
                        <TableCell component="th" scope="row">
                          {user.full_name}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Chip 
                            label={user.role === 'student' ? 'Étudiant' : user.role === 'professor' ? 'Professeur' : 'Admin'} 
                            color={user.role === 'admin' ? 'secondary' : user.role === 'professor' ? 'primary' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{user.department_name}</TableCell>
                        <TableCell>
                          <Chip 
                            label={user.status === 'active' ? 'Actif' : 'Inactif'} 
                            color={user.status === 'active' ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton onClick={() => handleOpenDialog(true, user)} size="small">
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            onClick={() => handleDeactivateUser(user.id, user.status)} 
                            size="small"
                            color={user.status === 'active' ? 'warning' : 'success'}
                          >
                            {user.status === 'active' ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                          </IconButton>
                          <IconButton onClick={() => handleDeleteUser(user.id)} size="small" color="error">
                            <DeleteIcon fontSize="small" />
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
              count={users.filter(user => {
                if (tabValue === 0) {
                  return true;
                }
                if (tabValue === 1) {
                  return user.role === 'student';
                }
                if (tabValue === 2) {
                  return user.role === 'professor';
                }
                if (tabValue === 3) {
                  return user.role === 'admin';
                }
                return true;
              }).length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Lignes par page:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
            />
          </TabPanel>
        )}
      </Paper>

      {/* Dialogue pour ajouter/modifier un utilisateur */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isEditMode ? 'Modifier l\'utilisateur' : 'Ajouter un nouvel utilisateur'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {isEditMode 
              ? 'Modifiez les informations de l\'utilisateur ci-dessous.'
              : 'Saisissez les informations du nouvel utilisateur ci-dessous. Un email sera envoyé à l\'utilisateur avec les instructions de connexion.'}
          </DialogContentText>
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="full_name"
                label="Nom complet"
                value={currentUser.full_name}
                onChange={handleInputChange}
                fullWidth
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="email"
                label="Email"
                type="email"
                value={currentUser.email}
                onChange={handleInputChange}
                fullWidth
                required
                disabled={isEditMode} // Ne pas permettre la modification de l'email pour les utilisateurs existants
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="role-select-label">Rôle</InputLabel>
                <Select
                  labelId="role-select-label"
                  name="role"
                  value={currentUser.role}
                  label="Rôle"
                  onChange={handleInputChange}
                >
                  <MenuItem value="student">Étudiant</MenuItem>
                  <MenuItem value="professor">Professeur</MenuItem>
                  <MenuItem value="admin">Administrateur</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="department-select-label">Département</InputLabel>
                <Select
                  labelId="department-select-label"
                  name="department_id"
                  value={currentUser.department_id}
                  label="Département"
                  onChange={handleInputChange}
                >
                  <MenuItem value="">Non assigné</MenuItem>
                  {departments.map(dept => (
                    <MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {isEditMode && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="status-select-label">Statut</InputLabel>
                  <Select
                    labelId="status-select-label"
                    name="status"
                    value={currentUser.status}
                    label="Statut"
                    onChange={handleInputChange}
                  >
                    <MenuItem value="active">Actif</MenuItem>
                    <MenuItem value="inactive">Inactif</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button onClick={handleSubmit} variant="contained">
            {isEditMode ? 'Mettre à jour' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialogue de confirmation */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
      >
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmDialog.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}>
            Annuler
          </Button>
          <Button onClick={confirmAction} color="primary" autoFocus>
            Confirmer
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar pour les messages */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      
      {/* Indicateur de progression pour l'importation */}
      {importing && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
        >
          <CircularProgress color="primary" />
          <Typography variant="h6" sx={{ mt: 2, color: 'white' }}>
            Importation en cours...
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default UserManagementPage;
