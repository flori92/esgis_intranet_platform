import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Typography, Button, Alert, CircularProgress,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
  Paper, Chip, IconButton, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Select,
  FormControl, InputLabel, Stack
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Visibility as PreviewIcon,
  Download as DownloadIcon,
  Archive as ArchiveIcon,
  EventNote as EventNoteIcon
} from '@mui/icons-material';
import { useAuth } from '@/context/AuthContext';
import {
  getWeeklySchedules,
  uploadWeeklySchedule,
  deleteWeeklySchedule,
  updateWeeklySchedule,
  getScheduleSignedUrl,
  getDepartments,
  notifyStudentsOfNewSchedule
} from '@/api/weeklySchedules';
import { getFilieres } from '@/api/admin';
import { addDays, format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

const LEVEL_OPTIONS = ['L1', 'L2', 'L3', 'M1', 'M2'];

const parseDateValue = (value) => {
  if (!value) {
    return null;
  }

  try {
    return parseISO(value);
  } catch (_error) {
    return null;
  }
};

const formatWeekRange = (weekStartDate) => {
  const start = parseDateValue(weekStartDate);

  if (!start) {
    return 'Semaine non precisee';
  }

  const end = addDays(start, 6);
  const sameMonth = format(start, 'MMMM yyyy', { locale: fr }) === format(end, 'MMMM yyyy', { locale: fr });
  const sameYear = format(start, 'yyyy', { locale: fr }) === format(end, 'yyyy', { locale: fr });

  if (sameMonth) {
    return `Semaine du ${format(start, 'd', { locale: fr })} au ${format(end, 'd MMMM yyyy', { locale: fr })}`;
  }

  if (sameYear) {
    return `Semaine du ${format(start, 'd MMMM', { locale: fr })} au ${format(end, 'd MMMM yyyy', { locale: fr })}`;
  }

  return `Semaine du ${format(start, 'd MMM yyyy', { locale: fr })} au ${format(end, 'd MMM yyyy', { locale: fr })}`;
};

const buildScheduleTitle = ({ levelCode, departmentName, filiereName, weekStartDate }) => {
  const weekLabel = formatWeekRange(weekStartDate);
  const scope = [levelCode, filiereName || departmentName].filter(Boolean).join(' ');

  return `EDT Hebdomadaire ${scope} - ${weekLabel}`.trim();
};

const getCurrentAcademicYear = () => {
  const now = new Date();
  const year = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  return `${year}-${year + 1}`;
};

const getNextMonday = () => {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? 1 : 8 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
};

const emptyForm = () => ({
  title: '',
  departmentId: '',
  filiereId: '',
  levelCode: '',
  weekStartDate: getNextMonday(),
  academicYear: getCurrentAcademicYear(),
  notes: '',
  file: null
});

const SIGNED_URL_CACHE_TTL_MS = 55 * 60 * 1000;

const WeeklySchedulesPage = () => {
  const { authState } = useAuth();
  const fileInputRef = useRef(null);
  const signedUrlCacheRef = useRef(new Map());

  const [schedules, setSchedules] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);

  const resolveScheduleUrl = useCallback(async (schedule) => {
    if (!schedule?.file_path) {
      return null;
    }

    const cacheKey = schedule.id || schedule.file_path;
    const cachedEntry = signedUrlCacheRef.current.get(cacheKey);

    if (cachedEntry && cachedEntry.expiresAt > Date.now()) {
      return cachedEntry.url;
    }

    const { signedUrl, error: urlErr } = await getScheduleSignedUrl(schedule.file_path);

    if (urlErr) {
      throw urlErr;
    }

    if (signedUrl) {
      signedUrlCacheRef.current.set(cacheKey, {
        url: signedUrl,
        expiresAt: Date.now() + SIGNED_URL_CACHE_TTL_MS
      });
    }

    return signedUrl;
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [schedulesRes, deptsRes, filieresRes] = await Promise.all([
        getWeeklySchedules(),
        getDepartments(),
        getFilieres()
      ]);
      if (schedulesRes.error) throw schedulesRes.error;
      if (deptsRes.error) throw deptsRes.error;
      if (filieresRes.error) throw filieresRes.error;
      setSchedules(schedulesRes.data);
      setDepartments(deptsRes.data);
      setFilieres(filieresRes.data);
    } catch (err) {
      setError(err.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleFormChange = (field) => (e) => {
    const value = e.target.value;
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'departmentId') {
        const selectedFiliere = filieres.find((f) => f.id === Number(updated.filiereId));
        if (selectedFiliere && selectedFiliere.department_id !== Number(value)) {
          updated.filiereId = '';
        }
      }
      if (field === 'departmentId' || field === 'filiereId' || field === 'levelCode' || field === 'weekStartDate') {
        const dept = departments.find((d) => d.id === Number(updated.departmentId));
        const filiere = filieres.find((f) => f.id === Number(updated.filiereId));
        updated.title = buildScheduleTitle({
          levelCode: updated.levelCode,
          departmentName: dept?.name || '',
          filiereName: filiere?.name || '',
          weekStartDate: updated.weekStartDate
        });
      }
      return updated;
    });
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setError('Seuls les fichiers PDF sont acceptés');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Le fichier ne doit pas dépasser 10 MB');
      return;
    }
    setForm((prev) => ({ ...prev, file }));
    setError(null);
  };

  const handleUpload = async () => {
    if (!form.file || !form.departmentId || !form.levelCode || !form.weekStartDate) {
      setError('Veuillez remplir tous les champs obligatoires et sélectionner un PDF');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const { data, error: uploadErr } = await uploadWeeklySchedule({
        file: form.file,
        title: form.title,
        departmentId: Number(form.departmentId),
        levelCode: form.levelCode,
        filiereId: form.filiereId ? Number(form.filiereId) : null,
        weekStartDate: form.weekStartDate,
        academicYear: form.academicYear,
        notes: form.notes,
        uploadedBy: authState.user.id
      });
      if (uploadErr) throw uploadErr;

      await notifyStudentsOfNewSchedule({
        departmentId: Number(form.departmentId),
        levelCode: form.levelCode,
        filiereId: form.filiereId ? Number(form.filiereId) : null,
        title: form.title,
        weekStartDate: form.weekStartDate
      });

      setSuccess(`EDT "${data.title}" publié avec succès`);
      setDialogOpen(false);
      setForm(emptyForm());
      if (fileInputRef.current) fileInputRef.current.value = '';
      await loadData();
    } catch (err) {
      setError(err.message || 'Erreur lors de la publication');
    } finally {
      setUploading(false);
    }
  };

  const handlePreview = async (schedule) => {
    setPreviewTitle(schedule.title);
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewUrl(null);

    try {
      const signedUrl = await resolveScheduleUrl(schedule);
      setPreviewUrl(signedUrl);
    } catch (err) {
      setPreviewOpen(false);
      setError(err.message || 'Impossible de charger la prévisualisation');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownload = async (schedule) => {
    try {
      const signedUrl = await resolveScheduleUrl(schedule);
      window.open(signedUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(err.message || 'Impossible de télécharger');
    }
  };

  const handleArchive = async (schedule) => {
    try {
      const { error: archiveErr } = await updateWeeklySchedule(schedule.id, { status: 'archived' });
      if (archiveErr) throw archiveErr;
      setSuccess(`"${schedule.title}" archivé`);
      await loadData();
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'archivage');
    }
  };

  const handleDelete = async (schedule) => {
    if (!window.confirm(`Supprimer définitivement "${schedule.title}" ?`)) return;
    try {
      const { error: delErr } = await deleteWeeklySchedule(schedule.id);
      if (delErr) throw delErr;
      setSuccess(`"${schedule.title}" supprimé`);
      await loadData();
    } catch (err) {
      setError(err.message || 'Erreur lors de la suppression');
    }
  };

  const statusColor = (status) => {
    if (status === 'published') return 'success';
    if (status === 'archived') return 'default';
    return 'warning';
  };

  return (
    <Box sx={{ py: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontFamily="Montserrat" fontWeight="bold" color="#003366">
            Emplois du temps PDF
          </Typography>
          <Typography variant="body2" color="text.secondary" fontFamily="Montserrat">
            Publiez les emplois du temps hebdomadaires pour chaque filière
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<UploadIcon />}
          onClick={() => { setDialogOpen(true); setError(null); setSuccess(null); }}
          sx={{ bgcolor: '#003366', fontFamily: 'Montserrat', '&:hover': { bgcolor: '#002244' } }}
        >
          Publier un EDT
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
      ) : schedules.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <EventNoteIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
          <Typography color="text.secondary" fontFamily="Montserrat">
            Aucun emploi du temps publié pour le moment
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ bgcolor: '#003366' }}>
              <TableRow>
                {['Titre', 'Département', 'Parcours', 'Niveau', 'Semaine du', 'Statut', 'Publié par', 'Actions'].map((h) => (
                  <TableCell key={h} sx={{ color: 'white', fontFamily: 'Montserrat', fontWeight: 'bold' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {schedules.map((s) => (
                <TableRow key={s.id} hover>
                  <TableCell sx={{ fontFamily: 'Montserrat' }}>{s.title}</TableCell>
                  <TableCell sx={{ fontFamily: 'Montserrat' }}>{s.departments?.name || '-'}</TableCell>
                  <TableCell sx={{ fontFamily: 'Montserrat' }}>{s.filieres?.name || 'Toutes filières'}</TableCell>
                  <TableCell><Chip label={s.level_code} size="small" color="primary" /></TableCell>
                  <TableCell sx={{ fontFamily: 'Montserrat' }}>{formatWeekRange(s.week_start_date)}</TableCell>
                  <TableCell><Chip label={s.status} size="small" color={statusColor(s.status)} /></TableCell>
                  <TableCell sx={{ fontFamily: 'Montserrat' }}>{s.profiles?.full_name || '-'}</TableCell>
                  <TableCell>
                    <Tooltip title="Prévisualiser"><IconButton onClick={() => handlePreview(s)} color="primary"><PreviewIcon /></IconButton></Tooltip>
                    <Tooltip title="Télécharger"><IconButton onClick={() => handleDownload(s)} color="info"><DownloadIcon /></IconButton></Tooltip>
                    <Tooltip title="Archiver"><IconButton onClick={() => handleArchive(s)} color="warning"><ArchiveIcon /></IconButton></Tooltip>
                    <Tooltip title="Supprimer"><IconButton onClick={() => handleDelete(s)} color="error"><DeleteIcon /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Upload Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Montserrat', fontWeight: 'bold', color: '#003366' }}>
          Publier un emploi du temps
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <FormControl fullWidth required>
              <InputLabel>Département</InputLabel>
              <Select value={form.departmentId} onChange={handleFormChange('departmentId')} label="Département">
                {departments.map((d) => (
                  <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth disabled={!form.departmentId}>
              <InputLabel>Filière / parcours</InputLabel>
              <Select value={form.filiereId} onChange={handleFormChange('filiereId')} label="Filière / parcours">
                <MenuItem value="">Toutes les filières</MenuItem>
                {filieres
                  .filter((f) => !form.departmentId || f.department_id === Number(form.departmentId))
                  .map((f) => (
                    <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>
                  ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>Niveau</InputLabel>
              <Select value={form.levelCode} onChange={handleFormChange('levelCode')} label="Niveau">
                {LEVEL_OPTIONS.map((l) => (
                  <MenuItem key={l} value={l}>{l}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Semaine du (lundi)"
              type="date"
              value={form.weekStartDate}
              onChange={handleFormChange('weekStartDate')}
              InputLabelProps={{ shrink: true }}
              fullWidth
              required
            />

            <TextField
              label="Titre"
              value={form.title}
              onChange={handleFormChange('title')}
              fullWidth
              required
              helperText="Généré automatiquement, modifiable"
            />

            <TextField
              label="Année académique"
              value={form.academicYear}
              onChange={handleFormChange('academicYear')}
              fullWidth
            />

            <TextField
              label="Notes / Remarques"
              value={form.notes}
              onChange={handleFormChange('notes')}
              fullWidth
              multiline
              rows={2}
              placeholder="Ex: Susceptible de modification"
            />

            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadIcon />}
              sx={{ borderColor: '#003366', color: '#003366' }}
            >
              {form.file ? form.file.name : 'Sélectionner un PDF'}
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                hidden
                onChange={handleFileSelect}
              />
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ fontFamily: 'Montserrat' }}>Annuler</Button>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={uploading || !form.file}
            startIcon={uploading ? <CircularProgress size={18} /> : <UploadIcon />}
            sx={{ bgcolor: '#003366', fontFamily: 'Montserrat', '&:hover': { bgcolor: '#002244' } }}
          >
            {uploading ? 'Publication...' : 'Publier'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Montserrat', fontWeight: 'bold', color: '#003366' }}>
          {previewTitle}
        </DialogTitle>
        <DialogContent sx={{ p: 0, height: '80vh' }}>
          {previewLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
              <CircularProgress />
            </Box>
          ) : previewUrl ? (
            <iframe
              src={previewUrl}
              title="Prévisualisation EDT"
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Fermer</Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={() => window.open(previewUrl, '_blank', 'noopener,noreferrer')}
            disabled={!previewUrl}
            sx={{ bgcolor: '#003366' }}
          >
            Télécharger
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WeeklySchedulesPage;
