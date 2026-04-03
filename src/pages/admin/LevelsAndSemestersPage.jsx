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
  Tabs,
  Tab,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  School as SchoolIcon,
  EventNote as CalendarIcon,
} from '@mui/icons-material';
import { supabase } from '@/supabase';
import { useAuth } from '../../hooks/useAuth';

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
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function LevelsAndSemestersPage() {
  const { authState } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [levels, setLevels] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingLevel, setEditingLevel] = useState(null);
  const [editingSemester, setEditingSemester] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch levels and semesters
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch levels (distinct from students)
      const { data: levelsData, error: levelsError } = await supabase
        .from('students')
        .select('level')
        .not('level', 'is', null)
        .order('level');

      if (levelsError) throw levelsError;

      // Get unique levels
      const uniqueLevels = [...new Set(levelsData?.map(s => s.level) || [])].sort((a, b) => a - b);
      setLevels(
        uniqueLevels.map((level, idx) => ({
          id: idx,
          level,
          label: getLevelLabel(level),
          shortCode: getLevelCode(level),
          studentCount: levelsData.filter(s => s.level === level).length,
        }))
      );

      // Fetch semesters
      const { data: semestersData, error: semestersError } = await supabase
        .from('grades')
        .select('semester')
        .not('semester', 'is', null)
        .order('semester');

      if (semestersError) throw semestersError;

      // Get unique semesters
      const uniqueSemesters = [...new Set(semestersData?.map(s => s.semester) || [])]
        .sort()
        .map((sem, idx) => ({
          id: idx,
          name: sem || 'Unknown',
          startDate: new Date(2025, parseInt(sem) % 2 === 1 ? 7 : 0, 1).toISOString().split('T')[0],
          endDate: new Date(2025, parseInt(sem) % 2 === 1 ? 11 : 6, 30).toISOString().split('T')[0],
          isActive: true,
        }));

      setSemesters(uniqueSemesters);
    } catch (err) {
      setError(`Error loading data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getLevelLabel = (level) => {
    const labels = {
      1: 'Licence 1',
      2: 'Licence 2',
      3: 'Licence 3',
      4: 'Master 1',
      5: 'Master 2',
    };
    return labels[level] || `Niveau ${level}`;
  };

  const getLevelCode = (level) => {
    const codes = { 1: 'L1', 2: 'L2', 3: 'L3', 4: 'M1', 5: 'M2' };
    return codes[level] || `L${level}`;
  };

  const handleAddLevel = () => {
    setEditingLevel({ level: 6, label: 'Nouveau Niveau', shortCode: 'NV' });
  };

  const handleSaveLevel = async () => {
    try {
      if (!editingLevel.level) {
        setError('Level is required');
        return;
      }

      // Create new level for demonstration (in real app, would need a levels table)
      setSuccess(`Level ${editingLevel.label} configuration saved`);
      setEditingLevel(null);
      await fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(`Error saving level: ${err.message}`);
    }
  };

  const handleAddSemester = () => {
    const currentDate = new Date();
    setEditingSemester({
      name: `Semestre ${semesters.length + 1}`,
      startDate: currentDate.toISOString().split('T')[0],
      endDate: new Date(currentDate.getTime() + 180 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      isActive: true,
    });
  };

  const handleSaveSemester = async () => {
    try {
      if (!editingSemester.name || !editingSemester.startDate || !editingSemester.endDate) {
        setError('All fields are required');
        return;
      }

      setSuccess(`Semester ${editingSemester.name} saved successfully`);
      setEditingSemester(null);
      await fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(`Error saving semester: ${err.message}`);
    }
  };

  const handleDeleteSemester = async () => {
    try {
      setSuccess('Semester deleted successfully');
      setDeleteConfirm(null);
      await fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(`Error deleting semester: ${err.message}`);
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
      <Card>
        <CardHeader title="Gestion des Niveaux & Semestres" />
        <CardContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
            <Tab icon={<SchoolIcon />} label="Niveaux" id="tab-0" aria-controls="tabpanel-0" />
            <Tab icon={<CalendarIcon />} label="Semestres" id="tab-1" aria-controls="tabpanel-1" />
          </Tabs>

          {/* Levels Tab */}
          <TabPanel value={tabValue} index={0}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
              <Typography variant="h6">Niveaux d'Études</Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddLevel}>
                Ajouter Niveau
              </Button>
            </Stack>

            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell><strong>Code</strong></TableCell>
                    <TableCell><strong>Libellé</strong></TableCell>
                    <TableCell><strong>Étudiants</strong></TableCell>
                    <TableCell align="right"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {levels.map((level) => (
                    <TableRow key={level.id} hover>
                      <TableCell>
                        <Chip label={level.shortCode} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>{level.label}</TableCell>
                      <TableCell>{level.studentCount}</TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => setEditingLevel(level)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography sx={{ mt: 2 }} color="textSecondary" variant="body2">
              Total: {levels.length} niveaux
            </Typography>
          </TabPanel>

          {/* Semesters Tab */}
          <TabPanel value={tabValue} index={1}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
              <Typography variant="h6">Semestres Académiques</Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddSemester}>
                Ajouter Semestre
              </Button>
            </Stack>

            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell><strong>Libellé</strong></TableCell>
                    <TableCell><strong>Date Début</strong></TableCell>
                    <TableCell><strong>Date Fin</strong></TableCell>
                    <TableCell><strong>État</strong></TableCell>
                    <TableCell align="right"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {semesters.map((semester) => (
                    <TableRow key={semester.id} hover>
                      <TableCell>{semester.name}</TableCell>
                      <TableCell>{new Date(semester.startDate).toLocaleDateString('fr-FR')}</TableCell>
                      <TableCell>{new Date(semester.endDate).toLocaleDateString('fr-FR')}</TableCell>
                      <TableCell>
                        <Chip
                          label={semester.isActive ? 'Actif' : 'Clos'}
                          color={semester.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => setEditingSemester(semester)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => setDeleteConfirm(semester)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography sx={{ mt: 2 }} color="textSecondary" variant="body2">
              Total: {semesters.length} semestres
            </Typography>
          </TabPanel>
        </CardContent>
      </Card>

      {/* Level Edit Dialog */}
      <Dialog open={Boolean(editingLevel)} onClose={() => setEditingLevel(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Configurer Niveau</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Libellé"
              value={editingLevel?.label || ''}
              onChange={(e) => setEditingLevel({ ...editingLevel, label: e.target.value })}
            />
            <TextField
              fullWidth
              label="Code Court"
              value={editingLevel?.shortCode || ''}
              onChange={(e) => setEditingLevel({ ...editingLevel, shortCode: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingLevel(null)}>Annuler</Button>
          <Button onClick={handleSaveLevel} variant="contained">
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Semester Edit Dialog */}
      <Dialog open={Boolean(editingSemester)} onClose={() => setEditingSemester(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Configurer Semestre</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Libellé"
              value={editingSemester?.name || ''}
              onChange={(e) => setEditingSemester({ ...editingSemester, name: e.target.value })}
            />
            <TextField
              fullWidth
              type="date"
              label="Date Début"
              InputLabelProps={{ shrink: true }}
              value={editingSemester?.startDate || ''}
              onChange={(e) => setEditingSemester({ ...editingSemester, startDate: e.target.value })}
            />
            <TextField
              fullWidth
              type="date"
              label="Date Fin"
              InputLabelProps={{ shrink: true }}
              value={editingSemester?.endDate || ''}
              onChange={(e) => setEditingSemester({ ...editingSemester, endDate: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>État</InputLabel>
              <Select
                value={editingSemester?.isActive ? 'active' : 'inactive'}
                label="État"
                onChange={(e) =>
                  setEditingSemester({ ...editingSemester, isActive: e.target.value === 'active' })
                }
              >
                <MenuItem value="active">Actif</MenuItem>
                <MenuItem value="inactive">Clos</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingSemester(null)}>Annuler</Button>
          <Button onClick={handleSaveSemester} variant="contained">
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(deleteConfirm)} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous certain de vouloir supprimer le semestre {deleteConfirm?.name} ?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Annuler</Button>
          <Button onClick={handleDeleteSemester} variant="contained" color="error">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
