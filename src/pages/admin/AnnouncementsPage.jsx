import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, CircularProgress, Alert, Button,
  TextField, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  Card, CardContent, Divider, Snackbar, IconButton, Tooltip,
  FormControl, InputLabel, Select, MenuItem, FormGroup, FormControlLabel,
  Checkbox, Switch
} from '@mui/material';
import {
  Campaign as CampaignIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Send as SendIcon,
  Visibility as ViewIcon,
  Schedule as ScheduleIcon,
  People as PeopleIcon,
  NotificationsActive as NotifIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';
import { getAnnouncements as fetchAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement as removeAnnouncement } from '@/api/announcements';

const TARGET_OPTIONS = [
  { value: 'all', label: 'Tous les utilisateurs' },
  { value: 'students', label: 'Tous les étudiants' },
  { value: 'professors', label: 'Tous les professeurs' },
  { value: 'L1 INFO', label: 'L1 Informatique' },
  { value: 'L2 INFO', label: 'L2 Informatique' },
  { value: 'L3 INFO', label: 'L3 Informatique' },
  { value: 'M1 INFO', label: 'M1 Informatique' },
  { value: 'M2 INFO', label: 'M2 Informatique' },
  { value: 'L1 GEST', label: 'L1 Gestion' },
  { value: 'L2 GEST', label: 'L2 Gestion' },
];

/**
 * Page de gestion des annonces ciblées — ESGIS Campus §5.8
 */
const AnnouncementsPage = () => {
  const { authState } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState(null);
  const [editDialog, setEditDialog] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [form, setForm] = useState({
    title: '', content: '', target: ['all'], priority: 'normal',
    send_push: true, send_email: false, send_sms: false
  });
  const [saving, setSaving] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const { data, error } = await fetchAnnouncements();
        if (error) {
          throw error;
        }
        setAnnouncements((data || []).map((a) => ({
          ...a,
          author: a.author?.full_name || a.author || 'Administration',
          views: a.views_count || 0,
        })));
      } catch (err) {
        console.error('load announcements:', err);
        setAnnouncements([]);
        setError('Erreur lors du chargement des annonces.');
      }
      finally { setLoading(false); }
    };
    loadData();
  }, []);

  const formatDate = (d) => { try { return format(new Date(d), "dd MMM yyyy 'à' HH:mm", { locale: fr }); } catch { return d || '-'; } };

  const handleOpenEdit = (announcement = null) => {
    if (announcement) {
      setEditingAnnouncement(announcement);
      setForm({
        title: announcement.title, content: announcement.content,
        target: announcement.target || ['all'], priority: announcement.priority || 'normal',
        send_push: announcement.send_push || false,
        send_email: announcement.send_email || false,
        send_sms: false
      });
    } else {
      setEditingAnnouncement(null);
      setForm({ title: '', content: '', target: ['all'], priority: 'normal', send_push: true, send_email: false, send_sms: false });
    }
    setEditDialog(true);
  };

  const handleSave = async (publish = false) => {
    if (!form.title || !form.content) { setError('Titre et contenu obligatoires.'); return; }
    setSaving(true);
    setError(null);
    const status = publish ? 'published' : 'draft';

    const payload = {
      ...form,
      status,
      author_id: authState.profile?.id || authState.user?.id || null,
    };

    try {
      const response = editingAnnouncement
        ? await updateAnnouncement(editingAnnouncement.id, payload)
        : await createAnnouncement(payload);

      if (response.error) throw response.error;

      const { data, error } = await fetchAnnouncements();
      if (error) throw error;

      setAnnouncements((data || []).map((a) => ({
        ...a,
        author: a.author?.full_name || a.author || 'Administration',
        views: a.views_count || 0,
      })));
      setSuccessMessage(publish ? 'Annonce publiée.' : 'Brouillon sauvegardé.');
      setEditDialog(false);
    } catch (err) {
      console.error('handleSave announcement:', err);
      setError(err.message || 'Impossible de sauvegarder l’annonce.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ann) => {
    try {
      const { error } = await removeAnnouncement(ann.id);
      if (error) throw error;
      setAnnouncements(prev => prev.filter(a => a.id !== ann.id));
      setDeleteDialog(null);
      setSuccessMessage('Annonce supprimée.');
    } catch (err) {
      console.error('handleDelete announcement:', err);
      setError(err.message || 'Impossible de supprimer l’annonce.');
    }
  };

  const handleTargetToggle = (value) => {
    setForm(prev => {
      const targets = prev.target.includes(value)
        ? prev.target.filter(t => t !== value)
        : [...prev.target, value];
      return { ...prev, target: targets.length > 0 ? targets : ['all'] };
    });
  };

  const published = announcements.filter(a => a.status === 'published');
  const drafts = announcements.filter(a => a.status === 'draft');

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CampaignIcon sx={{ mr: 1, color: 'primary.main', fontSize: 32 }} />
          <Typography variant="h5" fontWeight="bold">Annonces & Communication</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenEdit()}>Nouvelle annonce</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      <Snackbar open={!!successMessage} autoHideDuration={3000} onClose={() => setSuccessMessage('')} message={successMessage} />

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={4}>
          <Card elevation={1}><CardContent sx={{ textAlign: 'center', py: 1 }}>
            <Typography variant="h4" fontWeight="bold" color="success.main">{published.length}</Typography>
            <Typography variant="caption">Publiées</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={4}>
          <Card elevation={1}><CardContent sx={{ textAlign: 'center', py: 1 }}>
            <Typography variant="h4" fontWeight="bold" color="warning.main">{drafts.length}</Typography>
            <Typography variant="caption">Brouillons</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={4}>
          <Card elevation={1}><CardContent sx={{ textAlign: 'center', py: 1 }}>
            <Typography variant="h4" fontWeight="bold" color="info.main">
              {announcements.reduce((s, a) => s + (a.views || 0), 0)}
            </Typography>
            <Typography variant="caption">Vues totales</Typography>
          </CardContent></Card>
        </Grid>
      </Grid>

      {/* Liste des annonces */}
      {announcements.map(ann => (
        <Card key={ann.id} elevation={2} sx={{ mb: 2, borderLeft: '4px solid',
          borderColor: ann.status === 'published' ? 'success.main' : 'grey.400' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography variant="h6" fontWeight="bold">{ann.title}</Typography>
                  <Chip label={ann.status === 'published' ? 'Publiée' : 'Brouillon'} size="small"
                    color={ann.status === 'published' ? 'success' : 'default'} />
                  {ann.priority === 'high' && <Chip label="Prioritaire" size="small" color="error" />}
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {ann.content.substring(0, 150)}{ann.content.length > 150 ? '...' : ''}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    Par {ann.author} — {formatDate(ann.created_at)}
                  </Typography>
                  <Chip icon={<ViewIcon />} label={`${ann.views} vues`} size="small" variant="outlined" />
                  <Chip icon={<PeopleIcon />} label={ann.target?.join(', ')} size="small" variant="outlined" />
                  {ann.send_push && <Chip label="Push" size="small" color="info" variant="outlined" />}
                  {ann.send_email && <Chip label="Email" size="small" color="warning" variant="outlined" />}
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Tooltip title="Modifier"><IconButton size="small" onClick={() => handleOpenEdit(ann)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                <Tooltip title="Supprimer"><IconButton size="small" color="error" onClick={() => setDeleteDialog(ann)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
              </Box>
            </Box>
          </CardContent>
        </Card>
      ))}

      {/* Dialog Création/Édition */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingAnnouncement ? 'Modifier l\'annonce' : 'Nouvelle annonce'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <TextField label="Titre *" fullWidth value={form.title}
                onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Contenu *" fullWidth multiline rows={4} value={form.content}
                onChange={(e) => setForm(p => ({ ...p, content: e.target.value }))} />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Priorité</InputLabel>
                <Select value={form.priority} label="Priorité"
                  onChange={(e) => setForm(p => ({ ...p, priority: e.target.value }))}>
                  <MenuItem value="normal">Normale</MenuItem>
                  <MenuItem value="high">Haute</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="subtitle2" gutterBottom>Canaux de diffusion</Typography>
              <FormControlLabel control={<Switch checked={form.send_push}
                onChange={(e) => setForm(p => ({ ...p, send_push: e.target.checked }))} />}
                label="Notification push" />
              <FormControlLabel control={<Switch checked={form.send_email}
                onChange={(e) => setForm(p => ({ ...p, send_email: e.target.checked }))} />}
                label="E-mail" />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>Public cible</Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {TARGET_OPTIONS.map(opt => (
                  <Chip key={opt.value} label={opt.label} size="small"
                    variant={form.target.includes(opt.value) ? 'filled' : 'outlined'}
                    color={form.target.includes(opt.value) ? 'primary' : 'default'}
                    onClick={() => handleTargetToggle(opt.value)}
                    sx={{ cursor: 'pointer' }} />
                ))}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Annuler</Button>
          <Button variant="outlined" startIcon={<SaveIcon />} onClick={() => handleSave(false)} disabled={saving}>
            Sauvegarder comme brouillon
          </Button>
          <Button variant="contained" startIcon={<SendIcon />} onClick={() => handleSave(true)} disabled={saving}>
            Publier maintenant
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation suppression */}
      <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)}>
        <DialogTitle>Supprimer l'annonce</DialogTitle>
        <DialogContent><Typography>Supprimer « {deleteDialog?.title} » ?</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(null)}>Annuler</Button>
          <Button variant="contained" color="error" onClick={() => handleDelete(deleteDialog)}>Supprimer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AnnouncementsPage;
