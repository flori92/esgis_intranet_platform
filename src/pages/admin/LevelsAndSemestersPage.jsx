import { useEffect, useState } from 'react';
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
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  EventNote as CalendarIcon,
  School as SchoolIcon,
  ViewModule as CurriculumIcon
} from '@mui/icons-material';
import {
  createAcademicLevel,
  createAcademicSemester,
  createCurriculumTemplate,
  deleteAcademicLevel,
  deleteAcademicSemester,
  deleteCurriculumTemplate,
  getAcademicLevels,
  getAcademicSemesters,
  getAcademicYears,
  getCoursesWithDepartments,
  getCurriculumTemplates,
  updateAcademicLevel,
  updateAcademicSemester,
  updateCurriculumTemplate
} from '@/api/admin';
import { getDepartments } from '@/api/departments';

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const emptyCurriculum = () => ({
  department_id: '',
  level_code: 'L1',
  semester_code: 'S1',
  course_id: '',
  coefficient: 1,
  credits: 3,
  is_optional: false
});

export default function LevelsAndSemestersPage() {
  const [tabValue, setTabValue] = useState(0);
  const [levels, setLevels] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [curriculumEntries, setCurriculumEntries] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingLevel, setEditingLevel] = useState(null);
  const [editingSemester, setEditingSemester] = useState(null);
  const [editingCurriculum, setEditingCurriculum] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteType, setDeleteType] = useState(null);
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
        levelsRes,
        semestersRes,
        yearsRes,
        curriculumRes,
        departmentsRes,
        coursesRes
      ] = await Promise.all([
        getAcademicLevels(),
        getAcademicSemesters(),
        getAcademicYears(),
        getCurriculumTemplates(),
        getDepartments(),
        getCoursesWithDepartments()
      ]);

      if (levelsRes.error) throw levelsRes.error;
      if (semestersRes.error) throw semestersRes.error;
      if (yearsRes.error) throw yearsRes.error;
      if (curriculumRes.error) throw curriculumRes.error;
      if (departmentsRes.error) throw departmentsRes.error;
      if (coursesRes.error) throw coursesRes.error;

      setLevels(levelsRes.data || []);
      setSemesters(semestersRes.data || []);
      setAcademicYears(yearsRes.data || []);
      setCurriculumEntries(curriculumRes.data || []);
      setDepartments(departmentsRes.departments || []);
      setCourses(coursesRes.data || []);
    } catch (err) {
      setError(`Erreur lors du chargement de la structure académique: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLevel = async () => {
    try {
      if (!editingLevel?.code || !editingLevel?.label) {
        setError('Code et libellé requis.');
        return;
      }

      const action = editingLevel.id ? updateAcademicLevel(editingLevel.id, editingLevel) : createAcademicLevel(editingLevel);
      const { error: saveError } = await action;

      if (saveError) throw saveError;

      setSuccess(editingLevel.id ? 'Niveau mis à jour.' : 'Niveau créé.');
      setEditingLevel(null);
      await fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(`Erreur niveau: ${err.message}`);
    }
  };

  const handleSaveSemester = async () => {
    try {
      if (!editingSemester?.name || !editingSemester?.academic_year || !editingSemester?.start_date || !editingSemester?.end_date) {
        setError('Nom, année académique et dates sont requis.');
        return;
      }

      const action = editingSemester.id
        ? updateAcademicSemester(editingSemester.id, editingSemester)
        : createAcademicSemester(editingSemester);

      const { error: saveError } = await action;

      if (saveError) throw saveError;

      setSuccess(editingSemester.id ? 'Semestre mis à jour.' : 'Semestre créé.');
      setEditingSemester(null);
      await fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(`Erreur semestre: ${err.message}`);
    }
  };

  const handleSaveCurriculum = async () => {
    try {
      if (!editingCurriculum?.course_id || !editingCurriculum?.department_id) {
        setError('Département et matière sont requis pour la maquette.');
        return;
      }

      const payload = {
        ...editingCurriculum,
        course_id: Number(editingCurriculum.course_id),
        department_id: Number(editingCurriculum.department_id)
      };

      const action = editingCurriculum.id
        ? updateCurriculumTemplate(editingCurriculum.id, payload)
        : createCurriculumTemplate(payload);

      const { error: saveError } = await action;

      if (saveError) throw saveError;

      setSuccess(editingCurriculum.id ? 'Maquette mise à jour.' : 'Entrée de maquette créée.');
      setEditingCurriculum(null);
      await fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(`Erreur maquette: ${err.message}`);
    }
  };

  const handleDelete = async () => {
    try {
      const actionByType = {
        level: () => deleteAcademicLevel(deleteConfirm.id),
        semester: () => deleteAcademicSemester(deleteConfirm.id),
        curriculum: () => deleteCurriculumTemplate(deleteConfirm.id)
      };

      const { error: deleteError } = await actionByType[deleteType]();

      if (deleteError) throw deleteError;

      setSuccess('Élément supprimé.');
      setDeleteConfirm(null);
      setDeleteType(null);
      await fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(`Erreur suppression: ${err.message}`);
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
        <CardHeader title="Gestion des Niveaux, Semestres et Maquettes" />
        <CardContent>
          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          <Tabs value={tabValue} onChange={(_, value) => setTabValue(value)} sx={{ mb: 3 }}>
            <Tab icon={<SchoolIcon />} label="Niveaux" />
            <Tab icon={<CalendarIcon />} label="Semestres" />
            <Tab icon={<CurriculumIcon />} label="Maquettes" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
              <Typography variant="h6">Niveaux d'études</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setEditingLevel({ code: '', label: '', sort_order: levels.length + 1, is_active: true })}
              >
                Ajouter Niveau
              </Button>
            </Stack>

            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell><strong>Code</strong></TableCell>
                    <TableCell><strong>Libellé</strong></TableCell>
                    <TableCell><strong>Ordre</strong></TableCell>
                    <TableCell><strong>Étudiants</strong></TableCell>
                    <TableCell><strong>Actif</strong></TableCell>
                    <TableCell align="right"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {levels.map((level) => (
                    <TableRow key={level.id} hover>
                      <TableCell><Chip label={level.code} size="small" variant="outlined" /></TableCell>
                      <TableCell>{level.label}</TableCell>
                      <TableCell>{level.sort_order}</TableCell>
                      <TableCell>{level.student_count || 0}</TableCell>
                      <TableCell>
                        <Chip label={level.is_active ? 'Actif' : 'Inactif'} size="small" color={level.is_active ? 'success' : 'default'} />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => setEditingLevel({ ...level })}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => { setDeleteConfirm(level); setDeleteType('level'); }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
              <Typography variant="h6">Semestres académiques</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setEditingSemester({
                  name: '',
                  code: 'S1',
                  academic_year: academicYears.find((year) => year.is_current)?.label || '',
                  start_date: '',
                  end_date: '',
                  is_active: false
                })}
              >
                Ajouter Semestre
              </Button>
            </Stack>

            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell><strong>Code</strong></TableCell>
                    <TableCell><strong>Libellé</strong></TableCell>
                    <TableCell><strong>Année</strong></TableCell>
                    <TableCell><strong>Début</strong></TableCell>
                    <TableCell><strong>Fin</strong></TableCell>
                    <TableCell><strong>État</strong></TableCell>
                    <TableCell align="right"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {semesters.map((semester) => (
                    <TableRow key={semester.id} hover>
                      <TableCell><Chip label={semester.code} size="small" variant="outlined" /></TableCell>
                      <TableCell>{semester.name}</TableCell>
                      <TableCell>{semester.academic_year}</TableCell>
                      <TableCell>{new Date(semester.start_date).toLocaleDateString('fr-FR')}</TableCell>
                      <TableCell>{new Date(semester.end_date).toLocaleDateString('fr-FR')}</TableCell>
                      <TableCell>
                        <Chip label={semester.is_active ? 'Actif' : 'Clos'} size="small" color={semester.is_active ? 'success' : 'default'} />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => setEditingSemester({ ...semester })}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => { setDeleteConfirm(semester); setDeleteType('semester'); }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
              <Typography variant="h6">Maquettes pédagogiques</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setEditingCurriculum(emptyCurriculum())}
              >
                Ajouter à la maquette
              </Button>
            </Stack>

            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell><strong>Département</strong></TableCell>
                    <TableCell><strong>Niveau</strong></TableCell>
                    <TableCell><strong>Semestre</strong></TableCell>
                    <TableCell><strong>Matière</strong></TableCell>
                    <TableCell><strong>Crédits</strong></TableCell>
                    <TableCell><strong>Coefficient</strong></TableCell>
                    <TableCell><strong>Optionnelle</strong></TableCell>
                    <TableCell align="right"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {curriculumEntries.map((entry) => (
                    <TableRow key={entry.id} hover>
                      <TableCell>{entry.department?.name || 'Tous départements'}</TableCell>
                      <TableCell>{entry.level_code}</TableCell>
                      <TableCell>{entry.semester_code}</TableCell>
                      <TableCell>{entry.course?.name || `Cours #${entry.course_id}`}</TableCell>
                      <TableCell>{entry.credits}</TableCell>
                      <TableCell>{entry.coefficient}</TableCell>
                      <TableCell>
                        <Chip label={entry.is_optional ? 'Oui' : 'Non'} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => setEditingCurriculum({
                          id: entry.id,
                          department_id: entry.department_id || '',
                          level_code: entry.level_code,
                          semester_code: entry.semester_code,
                          course_id: entry.course_id || '',
                          coefficient: entry.coefficient,
                          credits: entry.credits,
                          is_optional: entry.is_optional
                        })}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => { setDeleteConfirm(entry); setDeleteType('curriculum'); }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>
        </CardContent>
      </Card>

      <Dialog open={Boolean(editingLevel)} onClose={() => setEditingLevel(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingLevel?.id ? 'Modifier Niveau' : 'Nouveau Niveau'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Code"
              value={editingLevel?.code || ''}
              onChange={(event) => setEditingLevel({ ...editingLevel, code: event.target.value.toUpperCase() })}
            />
            <TextField
              fullWidth
              label="Libellé"
              value={editingLevel?.label || ''}
              onChange={(event) => setEditingLevel({ ...editingLevel, label: event.target.value })}
            />
            <TextField
              fullWidth
              type="number"
              label="Ordre d'affichage"
              value={editingLevel?.sort_order || 0}
              onChange={(event) => setEditingLevel({ ...editingLevel, sort_order: Number(event.target.value) })}
            />
            <FormControlLabel
              control={(
                <Switch
                  checked={editingLevel?.is_active ?? true}
                  onChange={(event) => setEditingLevel({ ...editingLevel, is_active: event.target.checked })}
                />
              )}
              label="Actif"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingLevel(null)}>Annuler</Button>
          <Button onClick={handleSaveLevel} variant="contained">Enregistrer</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(editingSemester)} onClose={() => setEditingSemester(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingSemester?.id ? 'Modifier Semestre' : 'Nouveau Semestre'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Libellé"
              value={editingSemester?.name || ''}
              onChange={(event) => setEditingSemester({ ...editingSemester, name: event.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Code</InputLabel>
              <Select
                value={editingSemester?.code || 'S1'}
                label="Code"
                onChange={(event) => setEditingSemester({ ...editingSemester, code: event.target.value })}
              >
                <MenuItem value="S1">S1</MenuItem>
                <MenuItem value="S2">S2</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Année académique</InputLabel>
              <Select
                value={editingSemester?.academic_year || ''}
                label="Année académique"
                onChange={(event) => setEditingSemester({ ...editingSemester, academic_year: event.target.value })}
              >
                {academicYears.map((year) => (
                  <MenuItem key={year.id} value={year.label}>
                    {year.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              type="date"
              label="Date début"
              InputLabelProps={{ shrink: true }}
              value={editingSemester?.start_date || ''}
              onChange={(event) => setEditingSemester({ ...editingSemester, start_date: event.target.value })}
            />
            <TextField
              fullWidth
              type="date"
              label="Date fin"
              InputLabelProps={{ shrink: true }}
              value={editingSemester?.end_date || ''}
              onChange={(event) => setEditingSemester({ ...editingSemester, end_date: event.target.value })}
            />
            <FormControlLabel
              control={(
                <Switch
                  checked={editingSemester?.is_active ?? false}
                  onChange={(event) => setEditingSemester({ ...editingSemester, is_active: event.target.checked })}
                />
              )}
              label="Semestre actif"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingSemester(null)}>Annuler</Button>
          <Button onClick={handleSaveSemester} variant="contained">Enregistrer</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(editingCurriculum)} onClose={() => setEditingCurriculum(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingCurriculum?.id ? 'Modifier la maquette' : 'Ajouter à la maquette'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Département</InputLabel>
              <Select
                value={String(editingCurriculum?.department_id || '')}
                label="Département"
                onChange={(event) => setEditingCurriculum({ ...editingCurriculum, department_id: event.target.value ? Number(event.target.value) : null })}
              >
                <MenuItem value="">Tous départements</MenuItem>
                {departments.map((department) => (
                  <MenuItem key={department.id} value={String(department.id)}>
                    {department.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Niveau</InputLabel>
              <Select
                value={editingCurriculum?.level_code || 'L1'}
                label="Niveau"
                onChange={(event) => setEditingCurriculum({ ...editingCurriculum, level_code: event.target.value })}
              >
                {levels.map((level) => (
                  <MenuItem key={level.id} value={level.code}>
                    {level.code} — {level.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Semestre</InputLabel>
              <Select
                value={editingCurriculum?.semester_code || 'S1'}
                label="Semestre"
                onChange={(event) => setEditingCurriculum({ ...editingCurriculum, semester_code: event.target.value })}
              >
                <MenuItem value="S1">S1</MenuItem>
                <MenuItem value="S2">S2</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Matière</InputLabel>
              <Select
                value={String(editingCurriculum?.course_id || '')}
                label="Matière"
                onChange={(event) => setEditingCurriculum({ ...editingCurriculum, course_id: Number(event.target.value) })}
              >
                {courses.map((course) => (
                  <MenuItem key={course.id} value={String(course.id)}>
                    {course.code} — {course.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              type="number"
              label="Crédits"
              value={editingCurriculum?.credits || 0}
              onChange={(event) => setEditingCurriculum({ ...editingCurriculum, credits: Number(event.target.value) })}
            />
            <TextField
              fullWidth
              type="number"
              label="Coefficient"
              value={editingCurriculum?.coefficient || 1}
              inputProps={{ min: 0, step: 0.1 }}
              onChange={(event) => setEditingCurriculum({ ...editingCurriculum, coefficient: Number(event.target.value) })}
            />
            <FormControlLabel
              control={(
                <Switch
                  checked={editingCurriculum?.is_optional ?? false}
                  onChange={(event) => setEditingCurriculum({ ...editingCurriculum, is_optional: event.target.checked })}
                />
              )}
              label="Matière optionnelle"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingCurriculum(null)}>Annuler</Button>
          <Button onClick={handleSaveCurriculum} variant="contained">Enregistrer</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleteConfirm)} onClose={() => { setDeleteConfirm(null); setDeleteType(null); }}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Supprimer cet élément de configuration ?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDeleteConfirm(null); setDeleteType(null); }}>Annuler</Button>
          <Button onClick={handleDelete} variant="contained" color="error">Supprimer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
