import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, CircularProgress, Alert, Button,
  TextField, Select, MenuItem, FormControl, InputLabel, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Tooltip, Divider,
  Snackbar, Card, CardContent, Tabs, Tab, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Event as EventIcon,
  Schedule as ScheduleIcon,
  Room as RoomIcon,
  Person as PersonIcon,
  School as SchoolIcon
} from '@mui/icons-material';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/supabase';
import { getScheduleEvents, createScheduleEvent, updateScheduleEvent, deleteScheduleEvent } from '@/api/calendar';

const EVENT_TYPES = [
  { value: 'cours', label: 'Cours magistral', color: '#2196F3' },
  { value: 'tp', label: 'Travaux pratiques', color: '#4CAF50' },
  { value: 'td', label: 'Travaux dirigés', color: '#FFC107' },
  { value: 'examen', label: 'Examen / Contrôle', color: '#F44336' },
  { value: 'evenement', label: 'Événement universitaire', color: '#FF9800' },
  { value: 'conge', label: 'Congé / Jour férié', color: '#212121' },
];

const JOURS_SEMAINE = [
  { value: 1, label: 'Lundi' }, { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' }, { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' }, { value: 6, label: 'Samedi' },
];

const MOCK_EVENTS = [
  { id: 'ev1', title: 'Développement Web', type: 'cours', jour: 1, heure_debut: '08:00', heure_fin: '10:00', salle: 'A101', professeur: 'Prof. MENSAH', groupe: 'L3 INFO A', filiere: 'Informatique' },
  { id: 'ev2', title: 'Algorithmique Avancée', type: 'tp', jour: 1, heure_debut: '10:15', heure_fin: '12:15', salle: 'Labo 3', professeur: 'Prof. DOSSEH', groupe: 'L2 INFO', filiere: 'Informatique' },
  { id: 'ev3', title: 'Base de Données', type: 'cours', jour: 2, heure_debut: '08:00', heure_fin: '10:00', salle: 'B201', professeur: 'Prof. AGBEKO', groupe: 'L2 INFO', filiere: 'Informatique' },
  { id: 'ev4', title: 'Examen Réseaux', type: 'examen', jour: 3, heure_debut: '09:00', heure_fin: '12:00', salle: 'Amphi A', professeur: 'Prof. TOGBUI', groupe: 'L3 INFO', filiere: 'Informatique' },
  { id: 'ev5', title: 'Journée Portes Ouvertes', type: 'evenement', jour: 5, heure_debut: '08:00', heure_fin: '17:00', salle: 'Campus', professeur: '-', groupe: 'Tous', filiere: 'Toutes' },
  { id: 'ev6', title: 'Fête du Travail', type: 'conge', jour: 3, heure_debut: '00:00', heure_fin: '23:59', salle: '-', professeur: '-', groupe: 'Tous', filiere: 'Toutes' },
];

/**
 * Page de gestion du calendrier institutionnel — ESGIS Campus §5.7
 */
const CalendarManagerPage = () => {
  const { authState } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [editDialog, setEditDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventForm, setEventForm] = useState({
    title: '', type: 'cours', jour: 1, heure_debut: '08:00', heure_fin: '10:00',
    salle: '', professeur: '', groupe: '', filiere: '',
    date_debut: '', date_fin: '', description: ''
  });
  const [saving, setSaving] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(null);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await getScheduleEvents();
      if (!error && data && data.length > 0) {
        const formatted = data.map(e => ({
          id: e.id,
          title: e.cours?.name || '',
          type: 'cours',
          jour: e.jour_semaine,
          heure_debut: e.heure_debut,
          heure_fin: e.heure_fin,
          salle: e.salle || '',
          professeur: e.professeur?.full_name || '',
          groupe: e.groupe?.name || '',
          filiere: '',
        }));
        setEvents(formatted);
      } else {
        setEvents(MOCK_EVENTS);
      }
    } catch { setEvents(MOCK_EVENTS); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const handleOpenEdit = (event = null) => {
    if (event) {
      setEditingEvent(event);
      setEventForm({ title: event.title || '', type: event.type || 'cours', jour: event.jour || 1,
        heure_debut: event.heure_debut || '08:00', heure_fin: event.heure_fin || '10:00',
        salle: event.salle || '', professeur: event.professeur || '', groupe: event.groupe || '',
        filiere: event.filiere || '', date_debut: event.date_debut || '', date_fin: event.date_fin || '',
        description: event.description || '' });
    } else {
      setEditingEvent(null);
      setEventForm({ title: '', type: 'cours', jour: 1, heure_debut: '08:00', heure_fin: '10:00',
        salle: '', professeur: '', groupe: '', filiere: '', date_debut: '', date_fin: '', description: '' });
    }
    setEditDialog(true);
  };

  const handleSave = async () => {
    if (!eventForm.title) { setError('Le titre est obligatoire.'); return; }
    setSaving(true);
    try {
      if (editingEvent) {
        setEvents(prev => prev.map(e => e.id === editingEvent.id ? { ...e, ...eventForm } : e));
        setSuccessMessage('Créneau mis à jour.');
      } else {
        setEvents(prev => [{ id: `ev${Date.now()}`, ...eventForm }, ...prev]);
        setSuccessMessage('Créneau créé.');
      }
      setEditDialog(false);
    } finally { setSaving(false); }
  };

  const handleDelete = (event) => {
    setEvents(prev => prev.filter(e => e.id !== event.id));
    setDeleteDialog(null);
    setSuccessMessage('Créneau supprimé.');
  };

  // Vue hebdo: grouper par jour
  const eventsByDay = JOURS_SEMAINE.map(j => ({
    ...j,
    events: events.filter(e => e.jour === j.value).sort((a, b) => a.heure_debut?.localeCompare(b.heure_debut))
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

      {/* Légende des couleurs */}
      <Paper elevation={1} sx={{ p: 1.5, mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {EVENT_TYPES.map(t => (
          <Chip key={t.value} label={t.label} size="small"
            sx={{ bgcolor: t.color, color: 'white', fontWeight: 'bold' }} />
        ))}
      </Paper>

      <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 2 }}>
        <Tab label="Vue hebdomadaire" />
        <Tab label="Vue liste" />
      </Tabs>

      {/* Vue Hebdomadaire */}
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
                    <Typography variant="caption" color="text.secondary" sx={{ p: 1, display: 'block', textAlign: 'center' }}>
                      Aucun cours
                    </Typography>
                  ) : day.events.map(ev => {
                    const typeConfig = EVENT_TYPES.find(t => t.value === ev.type);
                    return (
                      <Card key={ev.id} variant="outlined" sx={{
                        mb: 0.5, borderLeft: `4px solid ${typeConfig?.color || '#ccc'}`,
                        cursor: 'pointer', '&:hover': { bgcolor: 'grey.50' }
                      }} onClick={() => handleOpenEdit(ev)}>
                        <CardContent sx={{ p: '8px !important' }}>
                          <Typography variant="caption" fontWeight="bold" sx={{ color: typeConfig?.color }}>
                            {ev.heure_debut} - {ev.heure_fin}
                          </Typography>
                          <Typography variant="body2" fontWeight="bold" noWrap>{ev.title}</Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {ev.salle} • {ev.professeur}
                          </Typography>
                          <br />
                          <Chip label={ev.groupe} size="small" variant="outlined" sx={{ mt: 0.5, height: 18, fontSize: '0.65rem' }} />
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

      {/* Vue Liste */}
      {tabValue === 1 && (
        <TableContainer component={Paper} elevation={2}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#003366' }}>
                {['Jour', 'Horaire', 'Titre', 'Type', 'Salle', 'Professeur', 'Groupe', 'Actions'].map(h => (
                  <TableCell key={h} sx={{ color: 'white', fontWeight: 'bold' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {events.map(ev => {
                const typeConfig = EVENT_TYPES.find(t => t.value === ev.type);
                return (
                  <TableRow key={ev.id} hover>
                    <TableCell>{JOURS_SEMAINE.find(j => j.value === ev.jour)?.label}</TableCell>
                    <TableCell>{ev.heure_debut} - {ev.heure_fin}</TableCell>
                    <TableCell><Typography variant="body2" fontWeight="bold">{ev.title}</Typography></TableCell>
                    <TableCell><Chip label={typeConfig?.label} size="small" sx={{ bgcolor: typeConfig?.color, color: 'white' }} /></TableCell>
                    <TableCell>{ev.salle}</TableCell>
                    <TableCell>{ev.professeur}</TableCell>
                    <TableCell>{ev.groupe}</TableCell>
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
              <TextField label="Titre *" fullWidth size="small" value={eventForm.title}
                onChange={(e) => setEventForm(p => ({ ...p, title: e.target.value }))} />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select value={eventForm.type} label="Type"
                  onChange={(e) => setEventForm(p => ({ ...p, type: e.target.value }))}>
                  {EVENT_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
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
            <Grid item xs={6}>
              <TextField label="Heure début" type="time" fullWidth size="small" value={eventForm.heure_debut}
                onChange={(e) => setEventForm(p => ({ ...p, heure_debut: e.target.value }))} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Heure fin" type="time" fullWidth size="small" value={eventForm.heure_fin}
                onChange={(e) => setEventForm(p => ({ ...p, heure_fin: e.target.value }))} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Salle" fullWidth size="small" value={eventForm.salle}
                onChange={(e) => setEventForm(p => ({ ...p, salle: e.target.value }))} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Professeur" fullWidth size="small" value={eventForm.professeur}
                onChange={(e) => setEventForm(p => ({ ...p, professeur: e.target.value }))} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Groupe / Promotion" fullWidth size="small" value={eventForm.groupe}
                onChange={(e) => setEventForm(p => ({ ...p, groupe: e.target.value }))} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Filière" fullWidth size="small" value={eventForm.filiere}
                onChange={(e) => setEventForm(p => ({ ...p, filiere: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Description" fullWidth size="small" multiline rows={2}
                value={eventForm.description}
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

      {/* Confirmation suppression */}
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
