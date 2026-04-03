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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { supabase } from '@/supabase';
import { useAuth } from '../../hooks/useAuth';

export default function SubjectsPage() {
  const { authState } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSubject, setEditingSubject] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch subjects and departments
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch subjects (courses table)
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('courses')
        .select('*, departments(name)')
        .order('name');

      if (subjectsError) throw subjectsError;

      // Fetch departments
      const { data: deptsData, error: deptsError } = await supabase
        .from('departments')
        .select('*')
        .order('name');

      if (deptsError) throw deptsError;

      setSubjects(subjectsData || []);
      setDepartments(deptsData || []);
    } catch (err) {
      setError(`Error loading data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setEditingSubject({
      code: '',
      name: '',
      credits: 3,
      coefficient: 1.0,
      semester: 1,
      department_id: '',
      description: '',
      professor_id: '',
    });
  };

  const handleEditClick = (subject) => {
    setEditingSubject({ ...subject });
  };

  const handleSave = async () => {
    try {
      if (!editingSubject.name || !editingSubject.code) {
        setError('Name and code are required');
        return;
      }

      const credits = parseInt(editingSubject.credits) || 0;
      const coefficient = parseFloat(editingSubject.coefficient) || 1.0;
      const semester = parseInt(editingSubject.semester) || 1;
      const departmentId = editingSubject.department_id ? parseInt(editingSubject.department_id) : null;

      if (editingSubject.id) {
        // Update existing
        const { error: updateError } = await supabase
          .from('courses')
          .update({
            name: editingSubject.name,
            code: editingSubject.code,
            credits,
            coefficient,
            semester,
            department_id: departmentId,
            description: editingSubject.description,
          })
          .eq('id', editingSubject.id);

        if (updateError) throw updateError;
        setSuccess('Subject updated successfully');
      } else {
        // Create new
        const { error: insertError } = await supabase
          .from('courses')
          .insert([{
            name: editingSubject.name,
            code: editingSubject.code,
            credits,
            coefficient,
            semester,
            department_id: departmentId,
            description: editingSubject.description,
          }]);

        if (insertError) throw insertError;
        setSuccess('Subject created successfully');
      }

      setEditingSubject(null);
      await fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(`Error saving: ${err.message}`);
    }
  };

  const handleDelete = async () => {
    try {
      const { error: deleteError } = await supabase
        .from('courses')
        .delete()
        .eq('id', deleteConfirm.id);

      if (deleteError) throw deleteError;

      setSuccess('Subject deleted successfully');
      setDeleteConfirm(null);
      await fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(`Error deleting: ${err.message}`);
    }
  };

  const filteredSubjects = subjects.filter((subject) =>
    subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    subject.code.toLowerCase().includes(searchQuery.toLowerCase())
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
          title="Gestion des Matières"
          action={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddClick}
            >
              Ajouter Matière
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
                  <TableCell><strong>Code</strong></TableCell>
                  <TableCell><strong>Nom de la Matière</strong></TableCell>
                  <TableCell><strong>Crédits</strong></TableCell>
                  <TableCell><strong>Coefficient</strong></TableCell>
                  <TableCell><strong>Semestre</strong></TableCell>
                  <TableCell><strong>Département</strong></TableCell>
                  <TableCell align="right"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSubjects.length > 0 ? (
                  filteredSubjects.map((subject) => (
                    <TableRow key={subject.id} hover>
                      <TableCell>
                        <Chip label={subject.code} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Stack>
                          <Typography variant="body2">{subject.name}</Typography>
                          {subject.description && (
                            <Typography variant="caption" color="textSecondary">
                              {subject.description.substring(0, 50)}...
                            </Typography>
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${subject.credits} cr.`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${subject.coefficient.toFixed(1)}x`}
                          size="small"
                          variant="filled"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {subject.semester ? `S${subject.semester}` : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={subject.departments?.name || 'N/A'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <IconButton
                            size="small"
                            onClick={() => handleEditClick(subject)}
                            title="Modifier"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteConfirm(subject)}
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
                    <TableCell colSpan={7} align="center">
                      <Typography color="textSecondary">Aucune matière trouvée</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Typography sx={{ mt: 2 }} color="textSecondary" variant="body2">
            Affichage: {filteredSubjects.length} matières sur {subjects.length} total
          </Typography>
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={Boolean(editingSubject)} onClose={() => setEditingSubject(null)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingSubject?.id ? 'Modifier Matière' : 'Ajouter Matière'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Code Matière"
              value={editingSubject?.code || ''}
              onChange={(e) => setEditingSubject({ ...editingSubject, code: e.target.value })}
              placeholder="Ex: MATH101"
            />
            <TextField
              fullWidth
              label="Nom de la Matière"
              value={editingSubject?.name || ''}
              onChange={(e) => setEditingSubject({ ...editingSubject, name: e.target.value })}
              placeholder="Ex: Mathématiques Avancées"
            />
            <TextField
              fullWidth
              type="number"
              label="Crédits"
              value={editingSubject?.credits || 3}
              onChange={(e) => setEditingSubject({ ...editingSubject, credits: e.target.value })}
              inputProps={{ min: 0, max: 30 }}
            />
            <TextField
              fullWidth
              type="number"
              label="Coefficient"
              value={editingSubject?.coefficient || 1.0}
              onChange={(e) => setEditingSubject({ ...editingSubject, coefficient: e.target.value })}
              inputProps={{ min: 0, max: 10, step: 0.1 }}
              helperText="Multiplicateur pour la moyenne générale"
            />
            <TextField
              fullWidth
              type="number"
              label="Semestre"
              value={editingSubject?.semester || 1}
              onChange={(e) => setEditingSubject({ ...editingSubject, semester: e.target.value })}
              inputProps={{ min: 1, max: 8 }}
            />
            <FormControl fullWidth>
              <InputLabel>Département</InputLabel>
              <Select
                value={String(editingSubject?.department_id || '')}
                label="Département"
                onChange={(e) => setEditingSubject({
                  ...editingSubject,
                  department_id: e.target.value ? parseInt(e.target.value) : null,
                })}
              >
                <MenuItem value="">-- Sélectionner --</MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={String(dept.id)}>
                    {dept.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={editingSubject?.description || ''}
              onChange={(e) => setEditingSubject({ ...editingSubject, description: e.target.value })}
              placeholder="Description optionnelle de la matière"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingSubject(null)}>Annuler</Button>
          <Button onClick={handleSave} variant="contained">Enregistrer</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(deleteConfirm)} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous certain de vouloir supprimer la matière {deleteConfirm?.name} ?
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
