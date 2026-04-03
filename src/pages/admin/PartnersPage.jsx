import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, CircularProgress, Alert, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  Card, CardContent, Divider, Snackbar, IconButton, Tooltip,
  FormControl, InputLabel, Select, MenuItem, Pagination, Avatar
} from '@mui/material';
import {
  Business as BusinessIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Save as SaveIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  History as HistoryIcon,
  Link as LinkIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';
import { getPartners as fetchPartners, createPartner, updatePartner, deletePartner as removePartner } from '@/api/partners';

const MOCK_PARTNERS = [
  { id: 'e1', name: 'TechCorp Togo', sector: 'Informatique / IT', location: 'Lomé', contact_name: 'M. ASSOGBA Jean', contact_email: 'j.assogba@techcorp.tg', contact_phone: '+228 90 12 34 56', website: 'www.techcorp.tg', description: 'ESN spécialisée en développement web et mobile', stages_count: 12, last_collaboration: '2026-03-15', status: 'actif' },
  { id: 'e2', name: 'BanqueATL', sector: 'Banque / Finance', location: 'Lomé', contact_name: 'Mme AMOUZOU Afi', contact_email: 'a.amouzou@banqueatl.tg', contact_phone: '+228 22 21 00 00', website: 'www.banqueatl.tg', description: 'Banque commerciale togolaise', stages_count: 8, last_collaboration: '2026-01-20', status: 'actif' },
  { id: 'e3', name: 'Togocom', sector: 'Télécommunications', location: 'Lomé', contact_name: 'M. EKLU Koffi', contact_email: 'k.eklu@togocom.tg', contact_phone: '+228 90 00 00 00', website: 'www.togocom.tg', description: 'Opérateur télécom national', stages_count: 15, last_collaboration: '2026-02-28', status: 'actif' },
  { id: 'e4', name: 'Cabinet Audit Plus', sector: 'Audit / Comptabilité', location: 'Lomé', contact_name: 'M. KOUDJO Pierre', contact_email: 'p.koudjo@auditplus.tg', contact_phone: '+228 91 22 33 44', website: '', description: 'Cabinet d\'audit et d\'expertise comptable', stages_count: 5, last_collaboration: '2025-12-10', status: 'inactif' },
  { id: 'e5', name: 'GreenEnergy SA', sector: 'Énergie', location: 'Kara', contact_name: 'Mme DOSSOU Rita', contact_email: 'r.dossou@greenenergy.tg', contact_phone: '+228 93 44 55 66', website: 'www.greenenergy.tg', description: 'Société d\'énergie solaire', stages_count: 3, last_collaboration: '2026-03-01', status: 'actif' },
];

const SECTORS = ['Informatique / IT', 'Banque / Finance', 'Télécommunications', 'Audit / Comptabilité', 'Énergie', 'Commerce', 'Santé', 'ONG', 'Administration publique', 'Industrie'];

/**
 * Page Carnet de Partenaires Entreprises — ESGIS Campus §5.6
 */
const PartnersPage = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSector, setFilterSector] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState(null);
  const [editDialog, setEditDialog] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [partnerForm, setPartnerForm] = useState({
    name: '', sector: '', location: '', contact_name: '', contact_email: '',
    contact_phone: '', website: '', description: '', status: 'actif'
  });
  const [saving, setSaving] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const { data, error } = await fetchPartners();
        if (!error && data && data.length > 0) setPartners(data);
        else setPartners(MOCK_PARTNERS);
      } catch { setPartners(MOCK_PARTNERS); }
      finally { setLoading(false); }
    };
    loadData();
  }, []);

  const filtered = partners.filter(p => {
    if (filterSector && p.sector !== filterSector) return false;
    if (filterStatus && p.status !== filterStatus) return false;
    if (search) {
      const s = search.toLowerCase();
      return p.name.toLowerCase().includes(s) || p.sector.toLowerCase().includes(s) || p.contact_name.toLowerCase().includes(s);
    }
    return true;
  });

  const handleOpenEdit = (partner = null) => {
    if (partner) {
      setEditingPartner(partner);
      setPartnerForm({ ...partner });
    } else {
      setEditingPartner(null);
      setPartnerForm({ name: '', sector: '', location: '', contact_name: '', contact_email: '', contact_phone: '', website: '', description: '', status: 'actif' });
    }
    setEditDialog(true);
  };

  const handleSave = () => {
    if (!partnerForm.name) { setError('Le nom est obligatoire.'); return; }
    setSaving(true);
    if (editingPartner) {
      setPartners(prev => prev.map(p => p.id === editingPartner.id ? { ...p, ...partnerForm } : p));
      setSuccessMessage('Partenaire mis à jour.');
    } else {
      setPartners(prev => [{ id: `e${Date.now()}`, ...partnerForm, stages_count: 0, last_collaboration: null }, ...prev]);
      setSuccessMessage('Partenaire ajouté.');
    }
    setEditDialog(false);
    setSaving(false);
  };

  const handleDelete = (partner) => {
    setPartners(prev => prev.filter(p => p.id !== partner.id));
    setDeleteDialog(null);
    setSuccessMessage('Partenaire supprimé.');
  };

  const formatDate = (d) => { try { return format(new Date(d), 'dd MMM yyyy', { locale: fr }); } catch { return d || '-'; } };
  const totalStages = partners.reduce((s, p) => s + (p.stages_count || 0), 0);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <BusinessIcon sx={{ mr: 1, color: 'primary.main', fontSize: 32 }} />
          <Typography variant="h5" fontWeight="bold">Carnet de Partenaires</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenEdit()}>Nouveau partenaire</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      <Snackbar open={!!successMessage} autoHideDuration={3000} onClose={() => setSuccessMessage('')} message={successMessage} />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Partenaires actifs', value: partners.filter(p => p.status === 'actif').length, color: 'success' },
          { label: 'Total partenaires', value: partners.length, color: 'primary' },
          { label: 'Stages placés', value: totalStages, color: 'info' },
          { label: 'Secteurs couverts', value: new Set(partners.map(p => p.sector)).size, color: 'warning' },
        ].map((s, i) => (
          <Grid item xs={6} sm={3} key={i}>
            <Card elevation={1}><CardContent sx={{ textAlign: 'center', py: 1.5 }}>
              <Typography variant="caption" color="text.secondary">{s.label}</Typography>
              <Typography variant="h4" fontWeight="bold" color={`${s.color}.main`}>{s.value}</Typography>
            </CardContent></Card>
          </Grid>
        ))}
      </Grid>

      <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField size="small" fullWidth placeholder="Rechercher..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'grey.400' }} /> }} />
          </Grid>
          <Grid item xs={6} sm={4}>
            <FormControl size="small" fullWidth>
              <InputLabel>Secteur</InputLabel>
              <Select value={filterSector} label="Secteur" onChange={(e) => setFilterSector(e.target.value)}>
                <MenuItem value="">Tous</MenuItem>
                {SECTORS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={4}>
            <FormControl size="small" fullWidth>
              <InputLabel>Statut</InputLabel>
              <Select value={filterStatus} label="Statut" onChange={(e) => setFilterStatus(e.target.value)}>
                <MenuItem value="">Tous</MenuItem>
                <MenuItem value="actif">Actif</MenuItem>
                <MenuItem value="inactif">Inactif</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={2}>
        {filtered.map(partner => (
          <Grid item xs={12} md={6} key={partner.id}>
            <Card elevation={2}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: '#003366', width: 48, height: 48 }}>{partner.name[0]}</Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">{partner.name}</Typography>
                      <Typography variant="body2" color="text.secondary">{partner.sector}</Typography>
                    </Box>
                  </Box>
                  <Box>
                    <Chip label={partner.status === 'actif' ? 'Actif' : 'Inactif'} size="small"
                      color={partner.status === 'actif' ? 'success' : 'default'} />
                  </Box>
                </Box>
                <Divider sx={{ my: 1.5 }} />
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{partner.description}</Typography>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PersonIcon fontSize="small" color="action" />
                      <Typography variant="caption">{partner.contact_name}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <LocationIcon fontSize="small" color="action" />
                      <Typography variant="caption">{partner.location}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <EmailIcon fontSize="small" color="action" />
                      <Typography variant="caption">{partner.contact_email}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PhoneIcon fontSize="small" color="action" />
                      <Typography variant="caption">{partner.contact_phone}</Typography>
                    </Box>
                  </Grid>
                </Grid>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip icon={<HistoryIcon />} label={`${partner.stages_count} stages`} size="small" variant="outlined" />
                    {partner.last_collaboration && (
                      <Chip label={`Dernier: ${formatDate(partner.last_collaboration)}`} size="small" variant="outlined" />
                    )}
                  </Box>
                  <Box>
                    <Tooltip title="Modifier"><IconButton size="small" onClick={() => handleOpenEdit(partner)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Supprimer"><IconButton size="small" color="error" onClick={() => setDeleteDialog(partner)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Dialog édition */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingPartner ? 'Modifier le partenaire' : 'Nouveau partenaire'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12}><TextField label="Nom de l'entreprise *" fullWidth size="small" value={partnerForm.name} onChange={(e) => setPartnerForm(p => ({ ...p, name: e.target.value }))} /></Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small"><InputLabel>Secteur</InputLabel>
                <Select value={partnerForm.sector} label="Secteur" onChange={(e) => setPartnerForm(p => ({ ...p, sector: e.target.value }))}>
                  {SECTORS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}><TextField label="Localisation" fullWidth size="small" value={partnerForm.location} onChange={(e) => setPartnerForm(p => ({ ...p, location: e.target.value }))} /></Grid>
            <Grid item xs={6}><TextField label="Nom du contact" fullWidth size="small" value={partnerForm.contact_name} onChange={(e) => setPartnerForm(p => ({ ...p, contact_name: e.target.value }))} /></Grid>
            <Grid item xs={6}><TextField label="Email" fullWidth size="small" value={partnerForm.contact_email} onChange={(e) => setPartnerForm(p => ({ ...p, contact_email: e.target.value }))} /></Grid>
            <Grid item xs={6}><TextField label="Téléphone" fullWidth size="small" value={partnerForm.contact_phone} onChange={(e) => setPartnerForm(p => ({ ...p, contact_phone: e.target.value }))} /></Grid>
            <Grid item xs={6}><TextField label="Site web" fullWidth size="small" value={partnerForm.website} onChange={(e) => setPartnerForm(p => ({ ...p, website: e.target.value }))} /></Grid>
            <Grid item xs={12}><TextField label="Description" fullWidth size="small" multiline rows={2} value={partnerForm.description} onChange={(e) => setPartnerForm(p => ({ ...p, description: e.target.value }))} /></Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small"><InputLabel>Statut</InputLabel>
                <Select value={partnerForm.status} label="Statut" onChange={(e) => setPartnerForm(p => ({ ...p, status: e.target.value }))}>
                  <MenuItem value="actif">Actif</MenuItem>
                  <MenuItem value="inactif">Inactif</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Annuler</Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving}>Sauvegarder</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)}>
        <DialogTitle>Supprimer le partenaire</DialogTitle>
        <DialogContent><Typography>Supprimer « {deleteDialog?.name} » ?</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(null)}>Annuler</Button>
          <Button variant="contained" color="error" onClick={() => handleDelete(deleteDialog)}>Supprimer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PartnersPage;
