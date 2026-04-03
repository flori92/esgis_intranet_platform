import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Chip,
  Alert,
  CircularProgress,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { supabase } from '@/supabase';
import { useAuth } from '../../hooks/useAuth';

export default function ProfessorsListPage() {
  const { authState } = useAuth();
  const [professors, setProfessors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProf, setSelectedProf] = useState(null);
  const [editingProf, setEditingProf] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch professors and departments
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch professors
      const { data: profsData, error: profsError } = await supabase
        .from('professors')
        .select('*, departments(name)');

      if (profsError) throw profsError;

      // Fetch departments for form
      const { data: deptsData, error: deptsError } = await supabase
        .from('departments')
        .select('*');

      if (deptsError) throw deptsError;

      setProfessors(profsData || []);
      setDepartments(deptsData || []);
    } catch (err) {
      setError(`Error loading data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setEditingProf({
      full_name: '',
      email: '',
      phone: '',
      specialization: '',
      department_id: '',
    });
  };

  const handleEditClick = (prof) => {
    setEditingProf({ ...prof });
  };

  const handleSave = async () => {
    try {
      if (!editingProf.full_name || !editingProf.email) {
        setError('Full name and email are required');
        return;
      }

      if (editingProf.id) {
        // Update existing
        const { error: updateError } = await supabase
          .from('professors')
          .update({
            full_name: editingProf.full_name,
            email: editingProf.email,
            phone: editingProf.phone,
            specialization: editingProf.specialization,
            department_id: editingProf.department_id || null,
          })
          .eq('id', editingProf.id);

        if (updateError) throw updateError;
        setSuccess('Professor updated successfully');
      } else {
        // Create new (simplified - would need user creation in real app)
        const { error: insertError } = await supabase
          .from('professors')
          .insert([{
            full_name: editingProf.full_name,
            email: editingProf.email,
            phone: editingProf.phone,
            specialization: editingProf.specialization,
            department_id: editingProf.department_id || null,
          }]);

        if (insertError) throw insertError;
        setSuccess('Professor created successfully');
      }

      setEditingProf(null);
      await fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(`Error saving: ${err.message}`);
    }
  };

  const handleDelete = async () => {
    try {
      const { error: deleteError } = await supabase
        .from('professors')
        .delete()
        .eq('id', deleteConfirm.id);

      if (deleteError) throw deleteError;

      setSuccess('Professor deleted successfully');
      setDeleteConfirm(null);
      await fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(`Error deleting: ${err.message}`);
    }
  };

  const handleViewDetails = (prof) => {
    setSelectedProf(prof);
  };

  const filteredProfessors = professors.filter(prof =>
    prof.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prof.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (prof.specialization && prof.specialization.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
          action={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddClick}
            >
              Ajouter
            </Button>
          }
        />
        <CardContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          <TextField
            fullWidth
            placeholder="Rechercher par nom, email ou spécialisation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1 }} />,
            }}
            sx={{ mb: 3 }}
          />

          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell><strong>Nom</strong></TableCell>
                  <TableCell><strong>Email</strong></TableCell>
                  <TableCell><strong>Spécialisation</strong></TableCell>
                  <TableCell><strong>Département</strong></TableCell>
                  <TableCell align="right"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredProfessors.length > 0 ? (
                  filteredProfessors.map((prof) => (
                    <TableRow key={prof.id} hover>
                      <TableCell>{prof.full_name}</TableCell>
                      <TableCell>{prof.email}</TableCell>
                      <TableCell>{prof.specialization || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={prof.departments?.name || 'N/A'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <IconButton
                            size="small"
                            onClick={() => handleEditClick(prof)}
                            title="Modifier"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteConfirm(prof)}
                            title="Supprimer"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography color="textSecondary">Aucun professeur trouvé</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Typography sx={{ mt: 2 }} color="textSecondary" variant="body2">
            Total: {filteredProfessors.length} professeurs
          </Typography>
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={Boolean(editingProf)} onClose={() => setEditingProf(null)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingProf?.id ? 'Modifier Professeur' : 'Ajouter Professeur'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Nom Complet"
              value={editingProf?.full_name || ''}
              onChange={(e) => setEditingProf({ ...editingProf, full_name: e.target.value })}
            />
            <TextField
              fullWidth
              type="email"
              label="Email"
              value={editingProf?.email || ''}
              onChange={(e) => setEditingProf({ ...editingProf, email: e.target.value })}
            />
            <TextField
              fullWidth
              label="Téléphone"
              value={editingProf?.phone || ''}
              onChange={(e) => setEditingProf({ ...editingProf, phone: e.target.value })}
            />
            <TextField
              fullWidth
              label="Spécialisation"
              value={editingProf?.specialization || ''}
              onChange={(e) => setEditingProf({ ...editingProf, specialization: e.target.value })}
            />
            <TextField
              fullWidth
              select
              label="Département"
              value={String(editingProf?.department_id || '')}
              onChange={(e) => setEditingProf({ 
                ...editingProf, 
                department_id: e.target.value ? Number(e.target.value) : null 
              })}
              SelectProps={{
                native: true,
              }}
            >
              <option value="">-- Sélectionner --</option>
              {departments.map((dept) => (
                <option key={dept.id} value={String(dept.id)}>
                  {dept.name}
                </option>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingProf(null)}>Annuler</Button>
          <Button onClick={handleSave} variant="contained">Enregistrer</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(deleteConfirm)} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous certain de vouloir supprimer le professeur {deleteConfirm?.full_name} ?
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
