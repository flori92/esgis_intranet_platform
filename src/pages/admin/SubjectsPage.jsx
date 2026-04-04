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
  Search as SearchIcon
} from '@mui/icons-material';
import {
  createCourse,
  deleteCourse,
  getCoursesWithDepartments,
  getCurriculumTemplates,
  updateCourse
} from '@/api/admin';
import { getDepartments } from '@/api/departments';

const LEVEL_OPTIONS = ['L1', 'L2', 'L3', 'M1', 'M2'];

const createEmptySubject = () => ({
  code: '',
  name: '',
  credits: 3,
  semester: 1,
  level: 'L1',
  department_id: '',
  description: ''
});

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [curriculumEntries, setCurriculumEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSubject, setEditingSubject] = useState(null);
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

      const [
        { data: subjectsData, error: subjectsError },
        { departments: departmentsData, error: departmentsError },
        { data: curriculumData, error: curriculumError }
      ] = await Promise.all([
        getCoursesWithDepartments(),
        getDepartments(),
        getCurriculumTemplates()
      ]);

      if (subjectsError) throw subjectsError;
      if (departmentsError) throw departmentsError;
      if (curriculumError) throw curriculumError;

      setSubjects(subjectsData || []);
      setDepartments(departmentsData || []);
      setCurriculumEntries(curriculumData || []);
    } catch (err) {
      setError(`Erreur lors du chargement des matières: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const curriculumByCourse = useMemo(() => {
    const map = new Map();

    curriculumEntries.forEach((entry) => {
      const currentEntries = map.get(entry.course_id) || [];
      currentEntries.push(entry);
      map.set(entry.course_id, currentEntries);
    });

    return map;
  }, [curriculumEntries]);

  const filteredSubjects = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return subjects.filter((subject) => !query
      || subject.name?.toLowerCase().includes(query)
      || subject.code?.toLowerCase().includes(query));
  }, [searchQuery, subjects]);

  const getCoefficientLabel = (subjectId) => {
    const entries = curriculumByCourse.get(subjectId) || [];
    const coefficients = [...new Set(entries.map((entry) => Number(entry.coefficient).toFixed(1)))];

    if (!coefficients.length) {
      return 'Non défini';
    }

    return coefficients.length === 1 ? `${coefficients[0]}x` : 'Variable';
  };

  const handleSave = async () => {
    try {
      if (!editingSubject?.name || !editingSubject?.code) {
        setError('Le nom et le code sont obligatoires.');
        return;
      }

      const payload = {
        name: editingSubject.name,
        code: editingSubject.code,
        credits: Number(editingSubject.credits),
        semester: Number(editingSubject.semester),
        level: editingSubject.level,
        department_id: editingSubject.department_id ? Number(editingSubject.department_id) : null,
        description: editingSubject.description
      };

      const action = editingSubject.id
        ? updateCourse(editingSubject.id, payload)
        : createCourse(payload);

      const { error: saveError } = await action;

      if (saveError) {
        throw saveError;
      }

      setSuccess(editingSubject.id ? 'Matière mise à jour.' : 'Matière créée.');
      setEditingSubject(null);
      await fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(`Erreur lors de l’enregistrement: ${err.message}`);
    }
  };

  const handleDelete = async () => {
    try {
      const { error: deleteError } = await deleteCourse(deleteConfirm.id);

      if (deleteError) {
        throw deleteError;
      }

      setSuccess('Matière supprimée.');
      setDeleteConfirm(null);
      await fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(`Erreur lors de la suppression: ${err.message}`);
    }
  };

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
          subheader="Le coefficient est piloté par les maquettes pédagogiques, pas par la table courses."
          action={(
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEditingSubject(createEmptySubject())}>
              Ajouter Matière
            </Button>
          )}
        />
        <CardContent>
          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          <TextField
            fullWidth
            placeholder="Rechercher par nom ou code..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1 }} /> }}
            sx={{ mb: 3 }}
          />

          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell><strong>Code</strong></TableCell>
                  <TableCell><strong>Matière</strong></TableCell>
                  <TableCell><strong>Niveau</strong></TableCell>
                  <TableCell><strong>Semestre</strong></TableCell>
                  <TableCell><strong>Crédits</strong></TableCell>
                  <TableCell><strong>Coefficient</strong></TableCell>
                  <TableCell><strong>Département</strong></TableCell>
                  <TableCell align="right"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSubjects.length > 0 ? (
                  filteredSubjects.map((subject) => (
                    <TableRow key={subject.id} hover>
                      <TableCell><Chip label={subject.code} size="small" variant="outlined" /></TableCell>
                      <TableCell>
                        <Stack>
                          <Typography variant="body2">{subject.name}</Typography>
                          {subject.description && (
                            <Typography variant="caption" color="text.secondary">
                              {subject.description.slice(0, 80)}
                            </Typography>
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell>{subject.level}</TableCell>
                      <TableCell>{`S${subject.semester}`}</TableCell>
                      <TableCell>
                        <Chip label={`${subject.credits} cr.`} size="small" color="primary" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Chip label={getCoefficientLabel(subject.id)} size="small" variant="filled" />
                      </TableCell>
                      <TableCell>
                        <Chip label={subject.departments?.name || 'Non assigné'} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <IconButton size="small" onClick={() => setEditingSubject({ ...subject })} title="Modifier">
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => setDeleteConfirm(subject)} title="Supprimer">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="text.secondary">Aucune matière trouvée</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={Boolean(editingSubject)} onClose={() => setEditingSubject(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingSubject?.id ? 'Modifier Matière' : 'Ajouter Matière'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Code Matière"
              value={editingSubject?.code || ''}
              onChange={(event) => setEditingSubject({ ...editingSubject, code: event.target.value.toUpperCase() })}
              placeholder="Ex: MATH101"
            />
            <TextField
              fullWidth
              label="Nom de la Matière"
              value={editingSubject?.name || ''}
              onChange={(event) => setEditingSubject({ ...editingSubject, name: event.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Niveau</InputLabel>
              <Select
                value={editingSubject?.level || 'L1'}
                label="Niveau"
                onChange={(event) => setEditingSubject({ ...editingSubject, level: event.target.value })}
              >
                {LEVEL_OPTIONS.map((level) => (
                  <MenuItem key={level} value={level}>{level}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              type="number"
              label="Semestre"
              value={editingSubject?.semester || 1}
              onChange={(event) => setEditingSubject({ ...editingSubject, semester: Number(event.target.value) })}
              inputProps={{ min: 1, max: 2 }}
            />
            <TextField
              fullWidth
              type="number"
              label="Crédits"
              value={editingSubject?.credits || 3}
              onChange={(event) => setEditingSubject({ ...editingSubject, credits: Number(event.target.value) })}
              inputProps={{ min: 0, max: 30 }}
            />
            <FormControl fullWidth>
              <InputLabel>Département</InputLabel>
              <Select
                value={String(editingSubject?.department_id || '')}
                label="Département"
                onChange={(event) => setEditingSubject({
                  ...editingSubject,
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
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={editingSubject?.description || ''}
              onChange={(event) => setEditingSubject({ ...editingSubject, description: event.target.value })}
            />
            <Alert severity="info">
              Les coefficients et options de passage sont gérés dans la page maquettes pédagogiques.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingSubject(null)}>Annuler</Button>
          <Button onClick={handleSave} variant="contained">Enregistrer</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleteConfirm)} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Supprimer la matière {deleteConfirm?.name} ?
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
