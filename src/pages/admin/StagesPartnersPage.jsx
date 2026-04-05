import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Tabs, Tab, Button, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Grid,
  FormControl, InputLabel, Select, MenuItem, Chip, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Alert, Snackbar, Tooltip, Stack, Divider,
  Avatar
} from '@mui/material';
import {
  Business as BusinessIcon,
  Work as WorkIcon,
  Assignment as AssignmentIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { supabase } from '@/supabase';
import { getPartners, createPartner, updatePartner, deletePartner } from '@/api/partners';
import { getStageOffers, deleteStageOffer } from '@/api/stages';

const StagesPartnersPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  
  // Data
  const [partners, setPartners] = useState([]);
  const [offers, setOffres] = useState([]);
  const [applications, setApplications] = useState([]);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('partner'); // 'partner', 'offer'
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [partnersRes, offersRes] = await Promise.all([
        getPartners(),
        getStageOffers()
      ]);

      setPartners(partnersRes.data || []);
      setOffres(offersRes.data || []);
      
      // Fetch ALL applications for admin
      const { data: appsData, error: appsError } = await supabase
        .from('stage_candidatures')
        .select(`
          *,
          etudiant:students!etudiant_id(
            id,
            profiles(full_name, email)
          ),
          offre:stage_offres!offre_id(
            id,
            titre,
            entreprises:stage_entreprises!entreprise_id(nom)
          )
        `);
      
      if (appsError) throw appsError;
      setApplications(appsData || []);
    } catch (err) {
      console.error('loadData error:', err);
      setError('Erreur lors du chargement des données: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleOpenDialog = (type, item = null) => {
    setDialogType(type);
    setEditingItem(item);
    if (item) {
      setFormData({ ...item });
    } else {
      if (type === 'partner') setFormData({ nom: '', secteur: '', email: '', site_web: '', description: '', etat: 'actif' });
      if (type === 'offer') setFormData({ titre: '', entreprise_id: '', description: '', lieu: '', type_stage: 'internship', etat: 'actif' });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      let res;
      if (dialogType === 'partner') {
        res = editingItem ? await updatePartner(editingItem.id, formData) : await createPartner(formData);
      } else {
        res = editingItem 
          ? await supabase.from('stage_offres').update(formData).eq('id', editingItem.id)
          : await supabase.from('stage_offres').insert(formData);
      }

      if (res.error) throw res.error;
      setSuccess('Action réussie');
      setDialogOpen(false);
      loadData();
    } catch (err) {
      setError(`Erreur: ${err.message}`);
    }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm('Supprimer cet élément ?')) return;
    try {
      let res;
      if (type === 'partner') res = await deletePartner(id);
      else res = await deleteStageOffer(id);
      
      if (res.error) throw res.error;
      setSuccess('Supprimé');
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateAppStatus = async (appId, newStatus) => {
    try {
      const { error } = await supabase
        .from('stage_candidatures')
        .update({ statut: newStatus })
        .eq('id', appId);
      
      if (error) throw error;
      setSuccess('Statut de candidature mis à jour');
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading && partners.length === 0) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">Stages & Partenariats</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<BusinessIcon />} onClick={() => handleOpenDialog('partner')}>Nouv. Partenaire</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog('offer')}>Nouvelle Offre</Button>
        </Stack>
      </Stack>

      <Paper elevation={2}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab icon={<BusinessIcon />} label="Entreprises" iconPosition="start" />
          <Tab icon={<WorkIcon />} label="Offres" iconPosition="start" />
          <Tab icon={<AssignmentIcon />} label="Candidatures" iconPosition="start" />
        </Tabs>

        <Box sx={{ p: 2 }}>
          {tabValue === 0 && (
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow>
                  <TableCell>Entreprise</TableCell><TableCell>Secteur</TableCell><TableCell>Contact</TableCell><TableCell>Statut</TableCell><TableCell align="right">Actions</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {partners.map(p => (
                    <TableRow key={p.id}>
                      <TableCell><Typography fontWeight="bold">{p.nom || p.name}</Typography></TableCell>
                      <TableCell>{p.secteur || p.sector}</TableCell>
                      <TableCell>{p.email}</TableCell>
                      <TableCell><Chip label={p.etat || p.status} size="small" color={(p.etat === 'actif' || p.status === 'active') ? 'success' : 'default'} /></TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => handleOpenDialog('partner', p)}><EditIcon fontSize="small" /></IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDelete('partner', p.id)}><DeleteIcon fontSize="small" /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {tabValue === 1 && (
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow>
                  <TableCell>Titre de l'offre</TableCell><TableCell>Entreprise</TableCell><TableCell>Lieu</TableCell><TableCell>Type</TableCell><TableCell align="right">Actions</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {offers.map(o => (
                    <TableRow key={o.id}>
                      <TableCell><Typography fontWeight="bold">{o.titre || o.title}</Typography></TableCell>
                      <TableCell>{o.entreprise?.nom || o.company_name}</TableCell>
                      <TableCell>{o.lieu || o.location}</TableCell>
                      <TableCell><Chip label={o.typeStage || o.type} size="small" variant="outlined" /></TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => handleOpenDialog('offer', o)}><EditIcon fontSize="small" /></IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDelete('offer', o.id)}><DeleteIcon fontSize="small" /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {tabValue === 2 && (
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow>
                  <TableCell>Étudiant</TableCell><TableCell>Offre</TableCell><TableCell>Date</TableCell><TableCell>Statut</TableCell><TableCell align="right">Actions</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {applications.map(app => (
                    <TableRow key={app.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">{app.etudiant?.profiles?.full_name}</Typography>
                        <Typography variant="caption">{app.etudiant?.profiles?.email}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{app.offre?.titre}</Typography>
                        <Typography variant="caption" color="text.secondary">{app.offre?.entreprises?.nom}</Typography>
                      </TableCell>
                      <TableCell>{new Date(app.created_at).toLocaleDateString()}</TableCell>
                      <TableCell><Chip label={app.statut} size="small" color={app.statut === 'acceptee' ? 'success' : app.statut === 'rejetee' ? 'error' : 'warning'} /></TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <IconButton size="small" color="success" onClick={() => handleUpdateAppStatus(app.id, 'acceptee')}><CheckCircleIcon fontSize="small" /></IconButton>
                          <IconButton size="small" color="error" onClick={() => handleUpdateAppStatus(app.id, 'rejetee')}><CancelIcon fontSize="small" /></IconButton>
                          {app.cv_path && <IconButton size="small" onClick={() => window.open(app.cv_path, '_blank')}><DownloadIcon fontSize="small" /></IconButton>}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Paper>

      {/* Dialog Unifié */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingItem ? 'Modifier' : 'Ajouter'} {dialogType === 'partner' ? 'Partenaire' : 'Offre'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Nom / Titre" value={formData.nom || formData.titre || ''} 
                onChange={(e) => setFormData({...formData, [dialogType === 'partner' ? 'nom' : 'titre']: e.target.value})} />
            </Grid>
            {dialogType === 'partner' ? (
              <>
                <Grid item xs={6}><TextField fullWidth label="Secteur" value={formData.secteur || ''} onChange={(e) => setFormData({...formData, secteur: e.target.value})} /></Grid>
                <Grid item xs={6}><TextField fullWidth label="Email" value={formData.email || ''} onChange={(e) => setFormData({...formData, email: e.target.value})} /></Grid>
              </>
            ) : (
              <>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Entreprise</InputLabel>
                    <Select value={formData.entreprise_id || ''} label="Entreprise" onChange={(e) => setFormData({...formData, entreprise_id: e.target.value})}>
                      {partners.map(p => <MenuItem key={p.id} value={p.id}>{p.nom || p.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}><TextField fullWidth label="Lieu" value={formData.lieu || ''} onChange={(e) => setFormData({...formData, lieu: e.target.value})} /></Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Type</InputLabel>
                    <Select value={formData.type_stage || 'internship'} label="Type" onChange={(e) => setFormData({...formData, type_stage: e.target.value})}>
                      <MenuItem value="internship">Stage</MenuItem>
                      <MenuItem value="apprenticeship">Alternance</MenuItem>
                      <MenuItem value="job">Emploi</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}
            <Grid item xs={12}><TextField fullWidth multiline rows={3} label="Description" value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleSave}>Sauvegarder</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StagesPartnersPage;
