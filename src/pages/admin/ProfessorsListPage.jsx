import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  VpnKey as VpnKeyIcon
} from '@mui/icons-material';
import { getDepartments } from '@/api/departments';
import { createUser, deleteUser, getProfessors, updateUser } from '@/api/users';
import { sendAccessInvitation } from '@/api/auth';

const PROFESSOR_STATUSES = [
  { value: 'active', label: 'Actif', color: 'success' },
  { value: 'on_leave', label: 'En congé', color: 'warning' },
  { value: 'retired', label: 'Retraité', color: 'info' },
  { value: 'terminated', label: 'Terminé', color: 'error' }
];

const getStatusLabel = (status) => PROFESSOR_STATUSES.find((item) => item.value === status)?.label || status;
const getStatusColor = (status) => PROFESSOR_STATUSES.find((item) => item.value === status)?.color || 'default';

const createEmptyProfessor = () => ({
  full_name: '',
  email: '',
  phone: '',
  department_id: '',
  specialties: '',
  employee_number: '',
  hire_date: new Date().toISOString().slice(0, 10),
  professor_status: 'active'
});

export default function ProfessorsListPage() {
  const [professors, setProfessors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [invitingId, setInvitingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProf, setEditingProf] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const [{ professors: professorsData, error: professorsError }, { departments: departmentsData, error: departmentsError }] = await Promise.all([
        getProfessors(),
        getDepartments()
      ]);

      if (professorsError) {
        throw professorsError;
      }
      if (departmentsError) {
        throw departmentsError;
      }

      setProfessors(professorsData || []);
      setDepartments(departmentsData || []);
    } catch (err) {
      setError(`Erreur lors du chargement des professeurs: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvitation = async (email, profId) => {
    if (!email) return;
    setInvitingId(profId);
    try {
      const { success, error } = await sendAccessInvitation(email);
      if (success) {
        setSuccess(`Invitation envoyée avec succès à ${email}`);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        throw error;
      }
    } catch (err) {
      setError(`Erreur lors de l'envoi: ${err.message}`);
    } finally {
      setInvitingId(null);
    }
  };

  const handleAddClick = () => {
    setEditingProf(createEmptyProfessor());
    setError('');
  };

  const handleEditClick = (prof) => {
    setEditingProf({
      id: prof.id,
      full_name: prof.full_name || '',
      email: prof.email || '',
      phone: prof.phone || '',
      department_id: prof.department_id || '',
      specialties: prof.specialization || '',
      employee_number: prof.employee_number || '',
      hire_date: prof.hire_date || new Date().toISOString().slice(0, 10),
      professor_status: prof.professor_status || 'active'
    });
    setError('');
  };

  const handleSave = async () => {
    try {
      if (!editingProf.full_name || !editingProf.email) {
        setError('Le nom complet et l’email sont obligatoires.');
        return;
      }

      const payload = {
        role: 'professor',
        full_name: editingProf.full_name,
        email: editingProf.email,
        phone: editingProf.phone,
        department_id: editingProf.department_id || null,
        specialties: editingProf.specialties,
        employee_number: editingProf.employee_number,
        hire_date: editingProf.hire_date,
        professor_status: editingProf.professor_status,
        status: editingProf.professor_status === 'terminated' ? 'inactive' : 'active'
      };

      if (editingProf.id) {
        const { error: updateError } = await updateUser(editingProf.id, payload);
        if (updateError) {
          throw updateError;
        }
        setSuccess('Professeur mis à jour.');
      } else {
        const { error: insertError, tempPassword } = await createUser(payload);
        if (insertError) {
          throw insertError;
        }
        setSuccess(`Professeur créé.${tempPassword ? ` Mot de passe temporaire: ${tempPassword}` : ''}`);
      }

      setEditingProf(null);
      await fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(`Erreur lors de l’enregistrement: ${err.message}`);
    }
  };

  const handleDelete = async () => {
    try {
      const { error: deleteError } = await deleteUser(deleteConfirm.id);

      if (deleteError) {
        throw deleteError;
      }

      setSuccess('Professeur supprimé.');
      setDeleteConfirm(null);
      await fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(`Erreur lors de la suppression: ${err.message}`);
    }
  };

  const filteredProfessors = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return professors.filter((prof) => !query
      || prof.full_name?.toLowerCase().includes(query)
      || prof.email?.toLowerCase().includes(query)
      || prof.specialization?.toLowerCase().includes(query)
      || prof.employee_number?.toLowerCase().includes(query));
  }, [professors, searchQuery]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="Gestion des Professeurs"
          action={(
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddClick}>
              Ajouter
            </Button>
          )}
        />
        <CardContent>
          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          <TextField
            fullWidth
            placeholder="Rechercher par nom, email, matricule ou spécialité..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1 }} /> }}
            sx={{ mb: 3 }}
          />

          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell><strong>Nom</strong></TableCell>
                  <TableCell><strong>Email</strong></TableCell>
                  <TableCell><strong>Téléphone</strong></TableCell>
                  <TableCell><strong>Spécialités</strong></TableCell>
                  <TableCell><strong>Département</strong></TableCell>
                  <TableCell><strong>Statut</strong></TableCell>
                  <TableCell align="right"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredProfessors.length > 0 ? (
                  filteredProfessors.map((prof) => (
                    <TableRow key={prof.id} hover>
                      <TableCell>{prof.full_name}</TableCell>
                      <TableCell>{prof.email}</TableCell>
                      <TableCell>{prof.phone || '-'}</TableCell>
                      <TableCell>{prof.specialization || '-'}</TableCell>
                      <TableCell>
                        <Chip label={prof.department_name || 'Non assigné'} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(prof.professor_status)}
                          color={getStatusColor(prof.professor_status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <IconButton 
                            size="small" 
                            color="secondary" 
                            onClick={() => handleSendInvitation(prof.email, prof.id)} 
                            disabled={invitingId === prof.id}
                            title="Inviter (Mot de passe)"
                          >
                            {invitingId === prof.id ? <CircularProgress size={20} color="inherit" /> : <VpnKeyIcon fontSize="small" />}
                          </IconButton>
                          <IconButton size="small" onClick={() => handleEditClick(prof)} title="Modifier">
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => setDeleteConfirm(prof)} title="Supprimer">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="text.secondary">Aucun professeur trouvé</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Typography sx={{ mt: 2 }} color="text.secondary" variant="body2">
            Total: {filteredProfessors.length} professeurs
          </Typography>
        </CardContent>
      </Card>

      <Dialog open={Boolean(editingProf)} onClose={() => setEditingProf(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingProf?.id ? 'Modifier Professeur' : 'Ajouter Professeur'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Nom Complet"
              value={editingProf?.full_name || ''}
              onChange={(event) => setEditingProf({ ...editingProf, full_name: event.target.value })}
            />
            <TextField
              fullWidth
              type="email"
              label="Email"
              value={editingProf?.email || ''}
              disabled={Boolean(editingProf?.id)}
              onChange={(event) => setEditingProf({ ...editingProf, email: event.target.value })}
              helperText={editingProf?.id ? 'La modification de l’email d’authentification se gère via le compte utilisateur.' : ''}
            />
            <TextField
              fullWidth
              label="Téléphone"
              value={editingProf?.phone || ''}
              onChange={(event) => setEditingProf({ ...editingProf, phone: event.target.value })}
            />
            <TextField
              fullWidth
              label="Spécialités"
              value={editingProf?.specialties || ''}
              onChange={(event) => setEditingProf({ ...editingProf, specialties: event.target.value })}
              helperText="Séparer plusieurs spécialités par virgule."
            />
            <TextField
              fullWidth
              label="Matricule"
              value={editingProf?.employee_number || ''}
              onChange={(event) => setEditingProf({ ...editingProf, employee_number: event.target.value })}
            />
            <TextField
              fullWidth
              type="date"
              label="Date d'embauche"
              InputLabelProps={{ shrink: true }}
              value={editingProf?.hire_date || ''}
              onChange={(event) => setEditingProf({ ...editingProf, hire_date: event.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Département</InputLabel>
              <Select
                value={String(editingProf?.department_id || '')}
                label="Département"
                onChange={(event) => setEditingProf({
                  ...editingProf,
                  department_id: event.target.value ? Number(event.target.value) : null
                })}
              >
                <MenuItem value="">Non assigné</MenuItem>
                {departments.map((department) => (
                  <MenuItem key={department.id} value={String(department.id)}>
                    {department.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Statut</InputLabel>
              <Select
                value={editingProf?.professor_status || 'active'}
                label="Statut"
                onChange={(event) => setEditingProf({ ...editingProf, professor_status: event.target.value })}
              >
                {PROFESSOR_STATUSES.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingProf(null)}>Annuler</Button>
          <Button onClick={handleSave} variant="contained">Enregistrer</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleteConfirm)} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Supprimer définitivement le compte professeur de {deleteConfirm?.full_name} ?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Annuler</Button>
          <Button onClick={handleDelete} variant="contained" color="error">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
