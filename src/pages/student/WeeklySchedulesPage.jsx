import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Alert, CircularProgress, Paper, Button,
  Stack, MenuItem, Select, FormControl, InputLabel, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import {
  Download as DownloadIcon,
  EventNote as EventNoteIcon,
  Visibility as PreviewIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { useAuth } from '@/context/AuthContext';
import {
  getStudentCurrentSchedule,
  getStudentScheduleHistory,
  getScheduleSignedUrl
} from '@/api/weeklySchedules';

const WeeklySchedulesPage = () => {
  const { authState } = useAuth();

  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const [fullscreenOpen, setFullscreenOpen] = useState(false);

  const departmentId = authState.student?.department_id || authState.profile?.department_id;
  const levelCode = authState.student?.level || authState.profile?.level;

  const loadSchedule = useCallback(async () => {
    if (!departmentId || !levelCode) return;
    setLoading(true);
    setError(null);
    try {
      const [currentRes, historyRes] = await Promise.all([
        getStudentCurrentSchedule({ departmentId, levelCode }),
        getStudentScheduleHistory({ departmentId, levelCode })
      ]);

      if (currentRes.error) throw currentRes.error;
      if (historyRes.error) throw historyRes.error;

      setCurrent(currentRes.data);
      setHistory(historyRes.data);

      if (currentRes.data?.file_path) {
        const { signedUrl, error: urlErr } = await getScheduleSignedUrl(currentRes.data.file_path);
        if (!urlErr && signedUrl) {
          setPdfUrl(signedUrl);
          setSelectedId(currentRes.data.id);
        }
      }
    } catch (err) {
      setError(err.message || 'Impossible de charger l\'emploi du temps');
    } finally {
      setLoading(false);
    }
  }, [departmentId, levelCode]);

  useEffect(() => { loadSchedule(); }, [loadSchedule]);

  const handleSelectWeek = async (scheduleId) => {
    const schedule = history.find((s) => s.id === scheduleId);
    if (!schedule) return;
    setSelectedId(scheduleId);
    try {
      const filePath = `${departmentId}/${levelCode}/${schedule.week_start_date.split('-')[0]}/${schedule.week_start_date}.pdf`;
      const { signedUrl, error: urlErr } = await getScheduleSignedUrl(filePath);
      if (urlErr) throw urlErr;
      setPdfUrl(signedUrl);
    } catch (err) {
      setError('Impossible de charger cet emploi du temps');
    }
  };

  const handleDownload = () => {
    if (pdfUrl) window.open(pdfUrl, '_blank');
  };

  if (!departmentId || !levelCode) {
    return (
      <Box sx={{ py: 3 }}>
        <Alert severity="warning">
          Votre profil ne contient pas encore de filière ou de niveau. Contactez l'administration.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontFamily="Montserrat" fontWeight="bold" color="#003366">
            EDT Hebdomadaire
          </Typography>
          <Typography variant="body2" color="text.secondary" fontFamily="Montserrat">
            Emploi du temps de votre filière — {levelCode}
          </Typography>
        </Box>
        {pdfUrl && (
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<PreviewIcon />}
              onClick={() => setFullscreenOpen(true)}
              sx={{ borderColor: '#003366', color: '#003366', fontFamily: 'Montserrat' }}
            >
              Plein écran
            </Button>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleDownload}
              sx={{ bgcolor: '#003366', fontFamily: 'Montserrat', '&:hover': { bgcolor: '#002244' } }}
            >
              Télécharger
            </Button>
          </Stack>
        )}
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Week selector */}
      {history.length > 1 && (
        <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <HistoryIcon sx={{ color: '#003366' }} />
          <FormControl size="small" sx={{ minWidth: 300 }}>
            <InputLabel>Semaine</InputLabel>
            <Select
              value={selectedId || ''}
              onChange={(e) => handleSelectWeek(e.target.value)}
              label="Semaine"
            >
              {history.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  Semaine du {s.week_start_date}
                  {s.id === current?.id ? ' (actuelle)' : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {current?.notes && (
            <Chip
              label={current.notes}
              size="small"
              variant="outlined"
              color="warning"
              sx={{ fontFamily: 'Montserrat' }}
            />
          )}
        </Paper>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : !current ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <EventNoteIcon sx={{ fontSize: 80, color: '#ccc', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" fontFamily="Montserrat">
            Aucun emploi du temps disponible pour le moment
          </Typography>
          <Typography variant="body2" color="text.secondary" fontFamily="Montserrat" sx={{ mt: 1 }}>
            Revenez plus tard ou contactez votre administration
          </Typography>
        </Paper>
      ) : (
        <Paper
          sx={{
            overflow: 'hidden',
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            height: '75vh'
          }}
        >
          {pdfUrl ? (
            <iframe
              src={pdfUrl}
              title={current.title}
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          ) : (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
              <CircularProgress />
            </Box>
          )}
        </Paper>
      )}

      {current && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', fontFamily: 'Montserrat' }}>
          Publié par {current.profiles?.full_name || 'Administration'} le{' '}
          {new Date(current.created_at).toLocaleDateString('fr-FR')}
        </Typography>
      )}

      {/* Fullscreen preview dialog */}
      <Dialog open={fullscreenOpen} onClose={() => setFullscreenOpen(false)} fullScreen>
        <DialogTitle sx={{ fontFamily: 'Montserrat', fontWeight: 'bold', color: '#003366', bgcolor: '#f5f5f5' }}>
          {current?.title || 'Emploi du temps'}
        </DialogTitle>
        <DialogContent sx={{ p: 0, height: '100%' }}>
          {pdfUrl && (
            <iframe
              src={pdfUrl}
              title="EDT plein écran"
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#f5f5f5' }}>
          <Button onClick={() => setFullscreenOpen(false)} sx={{ fontFamily: 'Montserrat' }}>Fermer</Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
            sx={{ bgcolor: '#003366', fontFamily: 'Montserrat' }}
          >
            Télécharger
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WeeklySchedulesPage;
