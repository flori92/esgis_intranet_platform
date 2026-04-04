import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Paper, Grid, CircularProgress, Alert, Button,
  TextField, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  Card, CardContent, Divider, Snackbar, IconButton, Tooltip,
  FormControl, InputLabel, Select, MenuItem, FormControlLabel,
  Switch, Stack
} from '@mui/material';
import {
  Campaign as CampaignIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Send as SendIcon,
  Visibility as ViewIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';
import { getAnnouncements as fetchAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement as removeAnnouncement } from '@/api/announcements';
import { getDepartments } from '@/api/departments';
import { getFilieres } from '@/api/admin';

/**
 * Page de gestion des annonces ciblées — ESGIS Campus §5.8
 */
const AnnouncementsPage = () => {
  const { authState } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filieres, setFilieres] = useState([]);
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

  const loadData = async () => {
    setLoading(true);
    try {
      const [annRes, deptsRes, filieresRes] = await Promise.all([
        fetchAnnouncements(),
        getDepartments(),
        getFilieres()
      ]);

      if (annRes.error) throw annRes.error;
      
      setAnnouncements((annRes.data || []).map((a) => ({
        ...a,
        author: a.author?.full_name || a.author || 'Administration',
        views: a.views_count || 0,
      })));
      setDepartments(deptsRes.departments || []);
      setFilieres(filieresRes.data || []);
    } catch (err) {
      console.error('load announcements:', err);
      setError('Erreur lors du chargement des données.');
    }
    finally { setLoading(false); }
  };

  useEffect(() => {
    loadData();
  }, []);

  const TARGET_OPTIONS = useMemo(() => {
    const opts = [
      { value: 'all', label: 'Tous les utilisateurs' },
      { value: 'students', label: 'Tous les étudiants' },
      { value: 'professors', label: 'Tous les professeurs' },
    ];
    departments.forEach(d => opts.push({ value: `DEPT:${d.id}`, label: `Dép: ${d.name}` }));
    filieres.forEach(f => opts.push({ value: `FIL:${f.id}`, label: `Filière: ${f.name}` }));
    return opts;
  }, [departments, filieres]);

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

      await loadData();
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
      const { error: delErr } = await removeAnnouncement(ann.id);
      if (delErr) throw delErr;
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
      let targets = [...prev.target];
      if (value === 'all') {
        targets = ['all'];
      } else {
        targets = targets.filter(t => t !== 'all');
        if (targets.includes(value)) {
          targets = targets.filter(t => t !== value);
        } else {
          targets.push(value);
        }
      }
      return { ...prev, target: targets.length > 0 ? targets : ['all'] };
    });
  };

  const published = announcements.filter(a => a.status === 'published');
  const drafts = announcements.filter(a => a.status === 'draft');

  if (loading && announcements.length === 0) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CampaignIcon sx={{ mr: 1, color: 'primary.main', fontSize: 32 }} />
          <Typography variant="h5" fontWeight="bold">Communication Institutionnelle</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenEdit()}>Nouvelle annonce</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      <Snackbar open={!!successMessage} autoHideDuration={3000} onClose={() => setSuccessMessage('')} message={successMessage} />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card elevation={1} sx={{ borderLeft: '4px solid #4caf50' }}><CardContent sx={{ textAlign: 'center', py: 1 }}>
            <Typography variant="h4" fontWeight="bold" color="success.main">{published.length}</Typography>
            <Typography variant="caption" color="text.secondary">ANNONCES PUBLIÉES</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card elevation={1} sx={{ borderLeft: '4px solid #ff9800' }}><CardContent sx={{ textAlign: 'center', py: 1 }}>
            <Typography variant="h4" fontWeight="bold" color="warning.main">{drafts.length}</Typography>
            <Typography variant="caption" color="text.secondary">BROUILLONS</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card elevation={1} sx={{ borderLeft: '4px solid #2196f3' }}><CardContent sx={{ textAlign: 'center', py: 1 }}>
            <Typography variant="h4" fontWeight="bold" color="info.main">
              {announcements.reduce((s, a) => s + (a.views || 0), 0)}
            </Typography>
            <Typography variant="caption" color="text.secondary">LECTURES TOTALES</Typography>
          </CardContent></Card>
        </Grid>
      </Grid>

      {announcements.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">Aucune annonce pour le moment.</Typography>
        </Paper>
      ) : announcements.map(ann => (
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
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {ann.content}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
                  <Typography variant="caption" color="text.secondary">
                    Par {ann.author} — {formatDate(ann.created_at)}
                  </Typography>
                  <Divider orientation="vertical" flexItem />
                  <Chip icon={<ViewIcon />} label={`${ann.views} vues`} size="small" variant="outlined" />
                  <Chip icon={<PeopleIcon />} label={Array.isArray(ann.target) ? ann.target.join(', ') : ann.target} size="small" variant="outlined" />
                </Stack>
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
        <DialogTitle>{editingAnnouncement ? 'Modifier l\'annonce' : 'Nouvelle annonce institutionnelle'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField label="Titre de l'annonce *" fullWidth variant="outlined" value={form.title}
                onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Contenu détaillé *" fullWidth multiline rows={6} value={form.content}
                onChange={(e) => setForm(p => ({ ...p, content: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Niveau de priorité</InputLabel>
                <Select value={form.priority} label="Niveau de priorité"
                  onChange={(e) => setForm(p => ({ ...p, priority: e.target.value }))}>
                  <MenuItem value="normal">Normale</MenuItem>
                  <MenuItem value="high">Haute / Urgente</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Options de notification</Typography>
                <Stack direction="row" spacing={2}>
                  <FormControlLabel control={<Switch checked={form.send_push}
                    onChange={(e) => setForm(p => ({ ...p, send_push: e.target.checked }))} />}
                    label="Notification push" />
                  <FormControlLabel control={<Switch checked={form.send_email}
                    onChange={(e) => setForm(p => ({ ...p, send_email: e.target.checked }))} />}
                    label="E-mail" />
                </Stack>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>Ciblage (Public concerné)</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                {TARGET_OPTIONS.map(opt => (
                  <Chip key={opt.value} label={opt.label} 
                    variant={form.target.includes(opt.value) ? 'filled' : 'outlined'}
                    color={form.target.includes(opt.value) ? 'primary' : 'default'}
                    onClick={() => handleTargetToggle(opt.value)}
                    sx={{ cursor: 'pointer' }} />
                ))}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setEditDialog(false)}>Annuler</Button>
          <Button variant="outlined" startIcon={<SaveIcon />} onClick={() => handleSave(false)} disabled={saving}>
            Enregistrer en brouillon
          </Button>
          <Button variant="contained" startIcon={<SendIcon />} onClick={() => handleSave(true)} disabled={saving} color="primary">
            Publier immédiatement
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation suppression */}
      <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)}>
        <DialogTitle>Supprimer l'annonce</DialogTitle>
        <DialogContent><Typography>Êtes-vous sûr de vouloir supprimer définitivement l'annonce « {deleteDialog?.title} » ?</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(null)}>Annuler</Button>
          <Button variant="contained" color="error" onClick={() => handleDelete(deleteDialog)}>Supprimer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AnnouncementsPage;
