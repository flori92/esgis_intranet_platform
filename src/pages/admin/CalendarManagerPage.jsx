import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, CircularProgress, Alert, Button,
  TextField, Select, MenuItem, FormControl, InputLabel, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Card,
  CardContent, Tabs, Tab, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon, Add as AddIcon, Edit as EditIcon,
  Delete as DeleteIcon, Save as SaveIcon
} from '@mui/icons-material';
import { useAuth } from '@/context/AuthContext';
import {
  getScheduleEvents, createScheduleEvent, updateScheduleEvent,
  deleteScheduleEvent, getInstitutionalEvents, createInstitutionalEvent,
  deleteInstitutionalEvent
} from '@/api/calendar';
import { supabase } from '@/supabase';

const EVENT_TYPES = [
  { value: 'cours', label: 'Cours magistral', color: '#2196F3' },
  { value: 'tp', label: 'Travaux pratiques', color: '#4CAF50' },
  { value: 'td', label: 'Travaux dirig��s', color: '#FFC107' },
  { value: 'examen', label: 'Examen / Contrôle', color: '#F44336' },
  { value: 'evenement', label: 'Événement universitaire', color: '#FF9800' },
  { value: 'conge', label: 'Congé / Jour férié', color: '#212121' },
];

const JOURS_SEMAINE = [
  { value: 1, label: 'Lundi' }, { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' }, { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' }, { value: 6, label: 'Samedi' },
];

const CalendarManagerPage = () => {
  const { authState } = useAuth();
  const [events, setEvents] = useState([]);
  const [institutionalEvents, setInstitutionalEvents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [editDialog, setEditDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventForm, setEventForm] = useState({
    title: '', type: 'cours', jour: 1, heure_debut: '08:00', heure_fin: '10:00',
    salle: '', course_id: '', professor_id: '', groupe: '',
    date_specifique: '', description: ''
  });
  const [saving, setSaving] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sessionsRes, eventsRes, coursesRes, profsRes] = await Promise.all([
        getScheduleEvents(),
        getInstitutionalEvents(),
        supabase.from('courses').select('id, name, code').order('name'),
        supabase.from('professors').select('id, profile_id, profiles:profile_id(full_name)').order('profiles(full_name)'),
      ]);

      const formatted = (sessionsRes.data || []).map(e => ({
        id: e.id,
        source: 'session',
        title: e.cours?.name || e.title || '',
        type: 'cours',
        jour: e.jour_semaine,
        heure_debut: e.heure_debut,
        heure_fin: e.heure_fin,
        salle: e.salle || '',
        professeur: e.professeur?.full_name || '',
        professor_id: e.professor_id,
        course_id: e.course_id,
        groupe: '',
      }));

      const instFormatted = (eventsRes.data || []).map(e => ({
        id: e.id,
        source: 'event',
        title: e.title,
        type: e.type === 'holiday' ? 'conge' : 'evenement',
        jour: e.start_date ? new Date(e.start_date).getDay() || 7 : 1,
        heure_debut: e.start_date ? new Date(e.start_date).toTimeString().slice(0, 5) : '08:00',
        heure_fin: e.end_date ? new Date(e.end_date).toTimeString().slice(0, 5) : '17:00',
        salle: e.lieu || e.location || '',
        professeur: '-',
        groupe: 'Tous',
        description: e.description,
        date_specifique: e.start_date?.split('T')[0] || '',
      }));

      setEvents([...formatted, ...instFormatted]);
      setInstitutionalEvents(eventsRes.data || []);
      setCourses(coursesRes.data || []);
      setProfessors((profsRes.data || []).map(p => ({
        id: p.id,
        full_name: p.profiles?.full_name || 'Professeur'
      })));
    } catch (err) {
      setError('Erreur lors du chargement du calendrier');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleOpenEdit = (event = null) => {
    if (event) {
      setEditingEvent(event);
      setEventForm({
        title: event.title || '', type: event.type || 'cours', jour: event.jour || 1,
        heure_debut: event.heure_debut || '08:00', heure_fin: event.heure_fin || '10:00',
        salle: event.salle || '', course_id: event.course_id || '',
        professor_id: event.professor_id || '', groupe: event.groupe || '',
        date_specifique: event.date_specifique || '', description: event.description || ''
      });
    } else {
      setEditingEvent(null);
      setEventForm({
        title: '', type: 'cours', jour: 1, heure_debut: '08:00', heure_fin: '10:00',
        salle: '', course_id: '', professor_id: '', groupe: '',
        date_specifique: '', description: ''
      });
    }
    setEditDialog(true);
  };

  const buildSessionDate = (jour, heureDebut) => {
    const now = new Date();
    const currentDay = now.getDay() || 7;
    const diff = jour - currentDay;
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + diff);
    const [h, m] = (heureDebut || '08:00').split(':');
    targetDate.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
    return targetDate.toISOString();
  };

  const calcDuration = (debut, fin) => {
    const [h1, m1] = (debut || '08:00').split(':').map(Number);
    const [h2, m2] = (fin || '10:00').split(':').map(Number);
    return (h2 * 60 + m2) - (h1 * 60 + m1);
  };

  const handleSave = async () => {
    if (!eventForm.title && !eventForm.course_id) {
      setError('Le titre ou le cours est obligatoire.');
      return;
    }
    setSaving(true);
    try {
      const isInstitutional = ['evenement', 'conge'].includes(eventForm.type);

      if (isInstitutional) {
        const baseDate = eventForm.date_specifique || new Date().toISOString().split('T')[0];
        const payload = {
          title: eventForm.title,
          description: eventForm.description,
          location: eventForm.salle,
          type: eventForm.type === 'conge' ? 'holiday' : 'institutional',
          start_date: `${baseDate}T${eventForm.heure_debut}:00`,
          end_date: `${baseDate}T${eventForm.heure_fin}:00`,
          created_by: authState.profile?.id,
        };

        if (editingEvent?.source === 'event' && editingEvent.id) {
          await supabase.from('events').update(payload).eq('id', editingEvent.id);
          setSuccessMessage('Événement mis à jour.');
        } else {
          await createInstitutionalEvent(payload);
          setSuccessMessage('Événement créé.');
        }
      } else {
        const date = buildSessionDate(eventForm.jour, eventForm.heure_debut);
        const duration = calcDuration(eventForm.heure_debut, eventForm.heure_fin);

        const payload = {
          course_id: eventForm.course_id || null,
          professor_id: eventForm.professor_id || null,
          date,
          duration,
          room: eventForm.salle,
          status: 'scheduled',
        };

        if (editingEvent?.source === 'session' && editingEvent.id) {
          await updateScheduleEvent(editingEvent.id, payload);
          setSuccessMessage('Créneau mis à jour.');
        } else {
          await createScheduleEvent(payload);
          setSuccessMessage('Créneau créé.');
        }
      }

      setEditDialog(false);
      await loadData();
    } catch (err) {
      setError(`Erreur: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (event) => {
    try {
      if (event.source === 'event') {
        await deleteInstitutionalEvent(event.id);
      } else {
        await deleteScheduleEvent(event.id);
      }
      setDeleteDialog(null);
      setSuccessMessage('Créneau supprimé.');
      await loadData();
    } catch (err) {
      setError(`Erreur: ${err.message}`);
    }
  };

  const eventsByDay = JOURS_SEMAINE.map(j => ({
    ...j,
    events: events.filter(e => e.jour === j.value).sort((a, b) => (a.heure_debut || '').localeCompare(b.heure_debut || ''))
  }));

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CalendarIcon sx={{ mr: 1, color: 'primary.main', fontSize: 32 }} />
          <Typography variant="h5" fontWeight="bold">Calendrier Institutionnel</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenEdit()}>Nouveau créneau</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      <Snackbar open={!!successMessage} autoHideDuration={3000} onClose={() => setSuccessMessage('')} message={successMessage} />

      <Paper elevation={1} sx={{ p: 1.5, mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {EVENT_TYPES.map(t => (
          <Chip key={t.value} label={t.label} size="small" sx={{ bgcolor: t.color, color: 'white', fontWeight: 'bold' }} />
        ))}
      </Paper>

      <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 2 }}>
        <Tab label="Vue hebdomadaire" />
        <Tab label="Vue liste" />
      </Tabs>

      {tabValue === 0 && (
        <Grid container spacing={1}>
          {eventsByDay.map(day => (
            <Grid item xs={12} sm={6} md={2} key={day.value}>
              <Paper elevation={2} sx={{ minHeight: 300 }}>
                <Box sx={{ bgcolor: '#003366', color: 'white', p: 1, textAlign: 'center' }}>
                  <Typography variant="subtitle2" fontWeight="bold">{day.label}</Typography>
                </Box>
                <Box sx={{ p: 0.5 }}>
                  {day.events.length === 0 ? (
                    <Typography variant="caption" color="text.secondary" sx={{ p: 1, display: 'block', textAlign: 'center' }}>Aucun cours</Typography>
                  ) : day.events.map(ev => {
                    const typeConfig = EVENT_TYPES.find(t => t.value === ev.type);
                    return (
                      <Card key={ev.id} variant="outlined" sx={{ mb: 0.5, borderLeft: `4px solid ${typeConfig?.color || '#ccc'}`, cursor: 'pointer', '&:hover': { bgcolor: 'grey.50' } }}
                        onClick={() => handleOpenEdit(ev)}>
                        <CardContent sx={{ p: '8px !important' }}>
                          <Typography variant="caption" fontWeight="bold" sx={{ color: typeConfig?.color }}>{ev.heure_debut} - {ev.heure_fin}</Typography>
                          <Typography variant="body2" fontWeight="bold" noWrap>{ev.title}</Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>{ev.salle} {ev.professeur !== '-' ? `• ${ev.professeur}` : ''}</Typography>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {tabValue === 1 && (
        <TableContainer component={Paper} elevation={2}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#003366' }}>
                {['Jour', 'Horaire', 'Titre', 'Type', 'Salle', 'Professeur', 'Actions'].map(h => (
                  <TableCell key={h} sx={{ color: 'white', fontWeight: 'bold' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {events.map(ev => {
                const typeConfig = EVENT_TYPES.find(t => t.value === ev.type);
                return (
                  <TableRow key={ev.id} hover>
                    <TableCell>{JOURS_SEMAINE.find(j => j.value === ev.jour)?.label || '-'}</TableCell>
                    <TableCell>{ev.heure_debut} - {ev.heure_fin}</TableCell>
                    <TableCell><Typography variant="body2" fontWeight="bold">{ev.title}</Typography></TableCell>
                    <TableCell><Chip label={typeConfig?.label} size="small" sx={{ bgcolor: typeConfig?.color, color: 'white' }} /></TableCell>
                    <TableCell>{ev.salle}</TableCell>
                    <TableCell>{ev.professeur}</TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleOpenEdit(ev)}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => setDeleteDialog(ev)}><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog Création/Édition */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingEvent ? 'Modifier le créneau' : 'Nouveau créneau'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select value={eventForm.type} label="Type"
                  onChange={(e) => setEventForm(p => ({ ...p, type: e.target.value }))}>
                  {EVENT_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>

            {['cours', 'tp', 'td', 'examen'].includes(eventForm.type) ? (
              <>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Cours</InputLabel>
                    <Select value={eventForm.course_id} label="Cours"
                      onChange={(e) => {
                        const course = courses.find(c => c.id === e.target.value);
                        setEventForm(p => ({ ...p, course_id: e.target.value, title: course?.name || p.title }));
                      }}>
                      <MenuItem value="">-- Aucun --</MenuItem>
                      {courses.map(c => <MenuItem key={c.id} value={c.id}>{c.code} - {c.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Professeur</InputLabel>
                    <Select value={eventForm.professor_id} label="Professeur"
                      onChange={(e) => setEventForm(p => ({ ...p, professor_id: e.target.value }))}>
                      <MenuItem value="">-- Aucun --</MenuItem>
                      {professors.map(p => <MenuItem key={p.id} value={p.id}>{p.full_name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Jour</InputLabel>
                    <Select value={eventForm.jour} label="Jour"
                      onChange={(e) => setEventForm(p => ({ ...p, jour: e.target.value }))}>
                      {JOURS_SEMAINE.map(j => <MenuItem key={j.value} value={j.value}>{j.label}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
              </>
            ) : (
              <>
                <Grid item xs={12}>
                  <TextField label="Titre *" fullWidth size="small" value={eventForm.title}
                    onChange={(e) => setEventForm(p => ({ ...p, title: e.target.value }))} />
                </Grid>
                <Grid item xs={6}>
                  <TextField label="Date" type="date" fullWidth size="small" value={eventForm.date_specifique}
                    onChange={(e) => setEventForm(p => ({ ...p, date_specifique: e.target.value }))}
                    InputLabelProps={{ shrink: true }} />
                </Grid>
              </>
            )}

            <Grid item xs={3}>
              <TextField label="Début" type="time" fullWidth size="small" value={eventForm.heure_debut}
                onChange={(e) => setEventForm(p => ({ ...p, heure_debut: e.target.value }))} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={3}>
              <TextField label="Fin" type="time" fullWidth size="small" value={eventForm.heure_fin}
                onChange={(e) => setEventForm(p => ({ ...p, heure_fin: e.target.value }))} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Salle" fullWidth size="small" value={eventForm.salle}
                onChange={(e) => setEventForm(p => ({ ...p, salle: e.target.value }))} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Groupe / Promotion" fullWidth size="small" value={eventForm.groupe}
                onChange={(e) => setEventForm(p => ({ ...p, groupe: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Description" fullWidth size="small" multiline rows={2} value={eventForm.description}
                onChange={(e) => setEventForm(p => ({ ...p, description: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Annuler</Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving}>
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)}>
        <DialogTitle>Supprimer le créneau</DialogTitle>
        <DialogContent><Typography>Supprimer « {deleteDialog?.title} » ?</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(null)}>Annuler</Button>
          <Button variant="contained" color="error" onClick={() => handleDelete(deleteDialog)}>Supprimer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CalendarManagerPage;
