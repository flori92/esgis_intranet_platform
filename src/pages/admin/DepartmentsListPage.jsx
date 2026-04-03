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

export default function DepartmentsListPage() {
  const { authState } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingDept, setEditingDept] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch departments and professors
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch departments with head professor name
      const { data: deptsData, error: deptsError } = await supabase
        .from('departments')
        .select('*, professors(full_name)');

      if (deptsError) throw deptsError;

      // Fetch professors for form
      const { data: profsData, error: profsError } = await supabase
        .from('professors')
        .select('id, full_name')
        .order('full_name');

      if (profsError) throw profsError;

      setDepartments(deptsData || []);
      setProfessors(profsData || []);
    } catch (err) {
      setError(`Error loading data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setEditingDept({
      name: '',
      code: '',
      head_id: '',
    });
  };

  const handleEditClick = (dept) => {
    setEditingDept({ ...dept });
  };

  const handleSave = async () => {
    try {
      if (!editingDept.name || !editingDept.code) {
        setError('Name and code are required');
        return;
      }

      if (editingDept.id) {
        // Update existing
        const { error: updateError } = await supabase
          .from('departments')
          .update({
            name: editingDept.name,
            code: editingDept.code,
            head_id: editingDept.head_id || null,
          })
          .eq('id', editingDept.id);

        if (updateError) throw updateError;
        setSuccess('Department updated successfully');
      } else {
        // Create new
        const { error: insertError } = await supabase
          .from('departments')
          .insert([{
            name: editingDept.name,
            code: editingDept.code,
            head_id: editingDept.head_id || null,
          }]);

        if (insertError) throw insertError;
        setSuccess('Department created successfully');
      }

      setEditingDept(null);
      await fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(`Error saving: ${err.message}`);
    }
  };

  const handleDelete = async () => {
    try {
      const { error: deleteError } = await supabase
        .from('departments')
        .delete()
        .eq('id', deleteConfirm.id);

      if (deleteError) throw deleteError;

      setSuccess('Department deleted successfully');
      setDeleteConfirm(null);
      await fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(`Error deleting: ${err.message}`);
    }
  };

  const getHeadProfessorName = (deptId) => {
    const dept = departments.find(d => d.id === deptId);
    if (dept?.professors && Array.isArray(dept.professors) && dept.professors.length > 0) {
      return dept.professors[0].full_name;
    }
    return '-';
  };

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dept.code.toLowerCase().includes(searchQuery.toLowerCase())
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
          title="Gestion des Départements"
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
            placeholder="Rechercher par nom ou code..."
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
                  <TableCell><strong>Code</strong></TableCell>
                  <TableCell><strong>Responsable</strong></TableCell>
                  <TableCell align="right"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredDepartments.length > 0 ? (
                  filteredDepartments.map((dept) => (
                    <TableRow key={dept.id} hover>
                      <TableCell>{dept.name}</TableCell>
                      <TableCell>
                        <Chip label={dept.code} size="small" />
                      </TableCell>
                      <TableCell>{getHeadProfessorName(dept.id)}</TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <IconButton
                            size="small"
                            onClick={() => handleEditClick(dept)}
                            title="Modifier"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteConfirm(dept)}
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
                    <TableCell colSpan={4} align="center">
                      <Typography color="textSecondary">Aucun département trouvé</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Typography sx={{ mt: 2 }} color="textSecondary" variant="body2">
            Total: {filteredDepartments.length} départements
          </Typography>
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={Boolean(editingDept)} onClose={() => setEditingDept(null)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingDept?.id ? 'Modifier Département' : 'Ajouter Département'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Nom"
              value={editingDept?.name || ''}
              onChange={(e) => setEditingDept({ ...editingDept, name: e.target.value })}
            />
            <TextField
              fullWidth
              label="Code"
              value={editingDept?.code || ''}
              onChange={(e) => setEditingDept({ ...editingDept, code: e.target.value })}
            />
            <TextField
              fullWidth
              select
              label="Responsable (Chef de Département)"
              value={String(editingDept?.head_id || '')}
              onChange={(e) => setEditingDept({ 
                ...editingDept, 
                head_id: e.target.value ? Number(e.target.value) : null 
              })}
              SelectProps={{
                native: true,
              }}
            >
              <option value="">-- Sélectionner --</option>
              {professors.map((prof) => (
                <option key={prof.id} value={String(prof.id)}>
                  {prof.full_name}
                </option>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingDept(null)}>Annuler</Button>
          <Button onClick={handleSave} variant="contained">Enregistrer</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(deleteConfirm)} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous certain de vouloir supprimer le département {deleteConfirm?.name} ?
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
