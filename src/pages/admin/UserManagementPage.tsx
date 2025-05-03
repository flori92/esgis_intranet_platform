import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Grid,
  Snackbar,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
  SelectChangeEvent,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';
import { useAuth, AuthContextType } from '../../context/AuthContext';
import supabase from '../../services/supabase';
import { Database } from '../../types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Department = Database['public']['Tables']['departments']['Row'];

interface UserFormData {
  email: string;
  password: string;
  full_name: string;
  role: 'admin' | 'professor' | 'student';
  department_id: number | null;
  additional_data: {
    student_number?: string;
    entry_year?: number;
    level?: string;
    employee_number?: string;
    hire_date?: string;
    specialties?: string[];
  };
}

const initialFormData: UserFormData = {
  email: '',
  password: '',
  full_name: '',
  role: 'student',
  department_id: null,
  additional_data: {},
};

const UserManagementPage: React.FC = () => {
  const { authState, createUserAccount } = useAuth() as AuthContextType;
  const [users, setUsers] = useState<Profile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<UserFormData>(initialFormData);
  const [openDialog, setOpenDialog] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning',
  });
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);

  // Vérifier si l'utilisateur est un administrateur
  useEffect(() => {
    if (!authState.isAdmin) {
      // Rediriger vers la page d'accueil si l'utilisateur n'est pas un administrateur
      window.location.href = '/';
    }
  }, [authState.isAdmin]);

  // Charger les utilisateurs et les départements
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Récupérer les utilisateurs
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('*')
          .order('full_name');

        if (usersError) throw usersError;
        setUsers(usersData || []);

        // Récupérer les départements
        const { data: deptsData, error: deptsError } = await supabase
          .from('departments')
          .select('*')
          .order('name');

        if (deptsError) throw deptsError;
        setDepartments(deptsData || []);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        showSnackbar('Erreur lors du chargement des données', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Gérer le changement d'onglet
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Afficher un message de notification
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  // Fermer la notification
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Ouvrir le dialogue de création d'utilisateur
  const handleOpenDialog = () => {
    setFormData(initialFormData);
    setOpenDialog(true);
  };

  // Fermer le dialogue
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // Gérer les changements dans le formulaire
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => {
    const { name, value } = e.target;
    if (name) {
      if (name.includes('.')) {
        // Gérer les champs imbriqués (additional_data)
        const [parent, child] = name.split('.');
        setFormData({
          ...formData,
          [parent]: {
            ...formData[parent as keyof UserFormData] as Record<string, unknown>,
            [child]: value,
          },
        });
      } else {
        setFormData({
          ...formData,
          [name]: value,
        });
      }
    }
  };

  // Créer un nouvel utilisateur
  const handleCreateUser = async () => {
    try {
      // Valider les champs obligatoires
      if (!formData.email || !formData.password || !formData.full_name) {
        showSnackbar('Veuillez remplir tous les champs obligatoires', 'error');
        return;
      }

      const { error, data } = await createUserAccount(formData);

      if (error) {
        throw error;
      }

      // Actualiser la liste des utilisateurs
      const { data: newUser } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data?.id)
        .single();

      if (newUser) {
        setUsers([...users, newUser]);
      }

      handleCloseDialog();
      showSnackbar('Utilisateur créé avec succès', 'success');
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur:', error);
      showSnackbar('Erreur lors de la création de l\'utilisateur', 'error');
    }
  };

  // Désactiver un utilisateur
  const handleDeactivateUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('id', userId);

      if (error) throw error;

      // Mettre à jour la liste des utilisateurs
      setUsers(
        users.map((user) => (user.id === userId ? { ...user, is_active: false } : user))
      );

      showSnackbar('Utilisateur désactivé avec succès', 'success');
    } catch (error) {
      console.error('Erreur lors de la désactivation de l\'utilisateur:', error);
      showSnackbar('Erreur lors de la désactivation de l\'utilisateur', 'error');
    }
  };

  // Gérer l'importation d'utilisateurs en masse
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setImportFile(event.target.files[0]);
    }
  };

  // Importer des utilisateurs à partir d'un fichier CSV
  const handleImportUsers = async () => {
    if (!importFile) {
      showSnackbar('Veuillez sélectionner un fichier', 'error');
      return;
    }

    setImportLoading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const csv = e.target?.result as string;
        const lines = csv.split('\n');
        const headers = lines[0].split(',');

        // Vérifier que le fichier a le bon format
        const requiredHeaders = ['email', 'full_name', 'role', 'department_id'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

        if (missingHeaders.length > 0) {
          showSnackbar(`Format de fichier incorrect. Colonnes manquantes: ${missingHeaders.join(', ')}`, 'error');
          setImportLoading(false);
          return;
        }

        // Traiter chaque ligne
        let successCount = 0;
        let errorCount = 0;

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;

          const values = lines[i].split(',');
          const userData: Record<string, unknown> = {};

          headers.forEach((header, index) => {
            userData[header.trim()] = values[index]?.trim();
          });

          // Générer un mot de passe temporaire
          const tempPassword = `Temp${Math.random().toString(36).substring(2, 10)}`;

          try {
            await createUserAccount({
              email: userData.email as string,
              password: tempPassword,
              full_name: userData.full_name as string,
              role: userData.role as 'admin' | 'professor' | 'student',
              department_id: userData.department_id ? parseInt(userData.department_id as string) : null,
              additional_data: {
                student_number: userData.student_number as string,
                entry_year: userData.entry_year ? parseInt(userData.entry_year as string) : new Date().getFullYear(),
                level: userData.level as string || 'L1',
                employee_number: userData.employee_number as string,
                hire_date: userData.hire_date as string || new Date().toISOString().split('T')[0],
                specialties: userData.specialties ? (userData.specialties as string).split(';') : [],
              },
            });
            successCount++;
          } catch (error) {
            console.error(`Erreur lors de l'importation de l'utilisateur ${userData.email}:`, error);
            errorCount++;
          }
        }

        // Actualiser la liste des utilisateurs
        const { data: updatedUsers } = await supabase.from('profiles').select('*').order('full_name');
        if (updatedUsers) {
          setUsers(updatedUsers);
        }

        showSnackbar(`Importation terminée: ${successCount} utilisateurs créés, ${errorCount} erreurs`, successCount > 0 ? 'success' : 'error');
      };

      reader.readAsText(importFile);
    } catch (error) {
      console.error('Erreur lors de l\'importation des utilisateurs:', error);
      showSnackbar('Erreur lors de l\'importation des utilisateurs', 'error');
    } finally {
      setImportLoading(false);
    }
  };

  // Afficher un message de chargement
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gestion des utilisateurs
      </Typography>

      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Liste des utilisateurs" />
        <Tab label="Importation en masse" />
      </Tabs>

      {tabValue === 0 && (
        <>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenDialog}
              sx={{ mr: 1 }}
            >
              Nouvel utilisateur
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => window.location.reload()}
            >
              Actualiser
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nom complet</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Rôle</TableCell>
                  <TableCell>Département</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.full_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {user.role === 'admin' && 'Administrateur'}
                      {user.role === 'professor' && 'Professeur'}
                      {user.role === 'student' && 'Étudiant'}
                    </TableCell>
                    <TableCell>
                      {departments.find(d => d.id === user.department_id)?.name || '-'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.is_active ? 'Actif' : 'Inactif'}
                        color={user.is_active ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton color="primary" size="small">
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => handleDeactivateUser(user.id)}
                        disabled={!user.is_active}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {tabValue === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Importation d'utilisateurs en masse
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Téléchargez un fichier CSV contenant les informations des utilisateurs à créer.
            Le fichier doit contenir les colonnes suivantes : email, full_name, role, department_id.
          </Typography>

          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUploadIcon />}
                fullWidth
              >
                Sélectionner un fichier CSV
                <input
                  type="file"
                  accept=".csv"
                  hidden
                  onChange={handleFileChange}
                />
              </Button>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button
                variant="contained"
                onClick={handleImportUsers}
                disabled={!importFile || importLoading}
                fullWidth
              >
                {importLoading ? <CircularProgress size={24} /> : 'Importer les utilisateurs'}
              </Button>
            </Grid>
          </Grid>

          <Box sx={{ mt: 2 }}>
            {importFile && (
              <Typography variant="body2">
                Fichier sélectionné: {importFile.name}
              </Typography>
            )}
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle1" gutterBottom>
            Format du fichier CSV
          </Typography>
          <Typography variant="body2">
            Exemple de contenu:
          </Typography>
          <Box
            component="pre"
            sx={{
              p: 2,
              bgcolor: 'grey.100',
              borderRadius: 1,
              overflow: 'auto',
              fontSize: '0.8rem',
            }}
          >
            email,full_name,role,department_id,student_number,entry_year,level<br />
            etudiant1@esgis.bj,Jean Dupont,student,1,STU123456,2023,L1<br />
            professeur1@esgis.bj,Marie Curie,professor,2,,,,<br />
            admin1@esgis.bj,Admin Système,admin,,,,,
          </Box>
        </Paper>
      )}

      {/* Dialogue de création d'utilisateur */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="full_name"
                label="Nom complet"
                value={formData.full_name}
                onChange={handleFormChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="email"
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleFormChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="password"
                label="Mot de passe"
                type="password"
                value={formData.password}
                onChange={handleFormChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Rôle</InputLabel>
                <Select
                  name="role"
                  value={formData.role}
                  label="Rôle"
                  onChange={handleFormChange}
                >
                  <MenuItem value="student">Étudiant</MenuItem>
                  <MenuItem value="professor">Professeur</MenuItem>
                  <MenuItem value="admin">Administrateur</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Département</InputLabel>
                <Select
                  name="department_id"
                  value={formData.department_id || ''}
                  label="Département"
                  onChange={handleFormChange}
                >
                  <MenuItem value="">Aucun</MenuItem>
                  {departments.map((dept) => (
                    <MenuItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Champs spécifiques au rôle */}
            {formData.role === 'student' && (
              <>
                <Grid item xs={12} sm={4}>
                  <TextField
                    name="additional_data.student_number"
                    label="Numéro étudiant"
                    value={formData.additional_data.student_number || ''}
                    onChange={handleFormChange}
                    fullWidth
                    helperText="Laissez vide pour générer automatiquement"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    name="additional_data.entry_year"
                    label="Année d'entrée"
                    type="number"
                    value={formData.additional_data.entry_year || new Date().getFullYear()}
                    onChange={handleFormChange}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>Niveau</InputLabel>
                    <Select
                      name="additional_data.level"
                      value={formData.additional_data.level || 'L1'}
                      label="Niveau"
                      onChange={handleFormChange}
                    >
                      <MenuItem value="L1">Licence 1</MenuItem>
                      <MenuItem value="L2">Licence 2</MenuItem>
                      <MenuItem value="L3">Licence 3</MenuItem>
                      <MenuItem value="M1">Master 1</MenuItem>
                      <MenuItem value="M2">Master 2</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}

            {formData.role === 'professor' && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="additional_data.employee_number"
                    label="Numéro employé"
                    value={formData.additional_data.employee_number || ''}
                    onChange={handleFormChange}
                    fullWidth
                    helperText="Laissez vide pour générer automatiquement"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="additional_data.hire_date"
                    label="Date d'embauche"
                    type="date"
                    value={formData.additional_data.hire_date || new Date().toISOString().split('T')[0]}
                    onChange={handleFormChange}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button onClick={handleCreateUser} variant="contained">
            Créer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar pour les notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserManagementPage;
