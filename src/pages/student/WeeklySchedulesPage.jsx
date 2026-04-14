import { useState, useEffect, useCallback, useRef } from 'react';
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
import { addDays, format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

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

const buildTrackLabel = (levelCode, filiereName, departmentName) => {
  if (levelCode && filiereName) {
    return `${levelCode} • ${filiereName}`;
  }

  if (levelCode && departmentName) {
    return `${levelCode} • ${departmentName}`;
  }

  return levelCode || filiereName || departmentName || 'Filiere non precisee';
};

const SIGNED_URL_CACHE_TTL_MS = 55 * 60 * 1000;

const WeeklySchedulesPage = () => {
  const { authState } = useAuth();
  const signedUrlCacheRef = useRef(new Map());

  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [fullscreenOpen, setFullscreenOpen] = useState(false);

  const departmentId = authState.student?.department_id || authState.profile?.department_id;
  const levelCode = authState.student?.level || authState.profile?.level;
  const filiereId = authState.student?.filiere_id || authState.profile?.filiere_id;
  const selectedSchedule = history.find((schedule) => schedule.id === selectedId) || current;
  const currentWeekLabel = formatWeekRange(selectedSchedule?.week_start_date || current?.week_start_date);
  const trackLabel = buildTrackLabel(
    levelCode,
    selectedSchedule?.filieres?.name || current?.filieres?.name || '',
    selectedSchedule?.departments?.name || current?.departments?.name || ''
  );

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

  const loadSchedule = useCallback(async () => {
    if (!departmentId || !levelCode) return;
    setLoading(true);
    setError(null);
    try {
      const [currentRes, historyRes] = await Promise.all([
        getStudentCurrentSchedule({ departmentId, levelCode, filiereId }),
        getStudentScheduleHistory({ departmentId, levelCode, filiereId })
      ]);

      if (currentRes.error) throw currentRes.error;
      if (historyRes.error) throw historyRes.error;

      setCurrent(currentRes.data);
      setHistory(historyRes.data);
      setPdfUrl(null);
      setFullscreenOpen(false);
      setSelectedId(currentRes.data?.id || historyRes.data?.[0]?.id || null);
    } catch (err) {
      setError(err.message || 'Impossible de charger l\'emploi du temps');
    } finally {
      setLoading(false);
    }
  }, [departmentId, levelCode, filiereId]);

  useEffect(() => { loadSchedule(); }, [loadSchedule]);

  const handleSelectWeek = (scheduleId) => {
    const schedule = history.find((s) => s.id === scheduleId);
    if (!schedule) return;

    setSelectedId(scheduleId);
    setPdfUrl(null);
    setFullscreenOpen(false);
    setError(null);
  };

  const handlePreviewOpen = async () => {
    if (!selectedSchedule?.file_path) return;

    setPreviewLoading(true);
    setPdfUrl(null);
    setError(null);
    setFullscreenOpen(true);

    try {
      const signedUrl = await resolveScheduleUrl(selectedSchedule);
      if (signedUrl) {
        setPdfUrl(signedUrl);
      }
    } catch (err) {
      setFullscreenOpen(false);
      setError(err.message || 'Impossible de charger cet emploi du temps');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!selectedSchedule?.file_path) return;

    try {
      const signedUrl = await resolveScheduleUrl(selectedSchedule);
      if (signedUrl) {
        window.open(signedUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      setError(err.message || 'Impossible de télécharger cet emploi du temps');
    }
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
            Emploi du temps de votre filiere — {trackLabel} • {currentWeekLabel}
          </Typography>
        </Box>
        {selectedSchedule?.file_path && (
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={previewLoading ? <CircularProgress size={18} color="inherit" /> : <PreviewIcon />}
              onClick={handlePreviewOpen}
              disabled={previewLoading}
              sx={{ borderColor: '#003366', color: '#003366', fontFamily: 'Montserrat' }}
            >
              Aperçu
            </Button>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleDownload}
              disabled={previewLoading}
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
                  {formatWeekRange(s.week_start_date)}
                  {s.id === current?.id ? ' (actuelle)' : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {selectedSchedule?.notes && (
            <Chip
              label={selectedSchedule.notes}
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
      ) : !selectedSchedule ? (
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
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            p: { xs: 3, md: 4 }
          }}
        >
          <Stack spacing={2}>
            <Typography variant="h6" fontFamily="Montserrat" fontWeight="bold" color="#003366">
              Aperçu du PDF à la demande
            </Typography>
            <Typography variant="body2" color="text.secondary" fontFamily="Montserrat">
              Le document n&apos;est chargé que lorsque vous ouvrez l&apos;aperçu ou le téléchargement.
              Cela évite de bloquer la page avec le viewer PDF dès l&apos;arrivée.
            </Typography>
            {selectedSchedule?.notes && (
              <Chip
                label={selectedSchedule.notes}
                size="small"
                variant="outlined"
                color="warning"
                sx={{ fontFamily: 'Montserrat', width: 'fit-content' }}
              />
            )}
          </Stack>
        </Paper>
      )}

      {selectedSchedule && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', fontFamily: 'Montserrat' }}>
          Publié par {selectedSchedule.profiles?.full_name || current?.profiles?.full_name || 'Administration'} le{' '}
          {new Date(selectedSchedule.created_at || current?.created_at).toLocaleDateString('fr-FR')}
        </Typography>
      )}

      {/* Fullscreen preview dialog */}
      <Dialog open={fullscreenOpen} onClose={() => setFullscreenOpen(false)} fullScreen>
        <DialogTitle sx={{ fontFamily: 'Montserrat', fontWeight: 'bold', color: '#003366', bgcolor: '#f5f5f5' }}>
          {selectedSchedule?.title || current?.title || 'Emploi du temps'} • {currentWeekLabel}
        </DialogTitle>
        <DialogContent sx={{ p: 0, height: '100%' }}>
          {previewLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
              <CircularProgress />
            </Box>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              title="EDT plein écran"
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          ) : null}
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
