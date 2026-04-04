import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, CircularProgress, Alert, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Snackbar, Card, CardContent, Tabs, Tab, Select, MenuItem,
  FormControl, InputLabel, Switch, FormControlLabel
} from '@mui/material';
import {
  Security as SecurityIcon, Policy as PolicyIcon, Download as ExportIcon,
  PersonSearch as AccessIcon, Delete as DeleteIcon, Edit as EditIcon
} from '@mui/icons-material';
import { useAuth } from '@/context/AuthContext';
import {
  getRetentionPolicies, updateRetentionPolicy, getDataAccessRequests,
  processDataAccessRequest, exportUserData
} from '@/api/security';

function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ pt: 3 }}>{children}</Box> : null;
}

const RGPDPage = () => {
  const { authState } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [policies, setPolicies] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [processDialog, setProcessDialog] = useState(null);
  const [processResponse, setProcessResponse] = useState('');
  const [processStatus, setProcessStatus] = useState('completed');

  const loadData = useCallback(async () => {
    try {
      const [policiesRes, requestsRes] = await Promise.all([
        getRetentionPolicies(),
        getDataAccessRequests(),
      ]);
      setPolicies(policiesRes.data || []);
      setRequests(requestsRes.data || []);
    } catch (err) {
      setError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleUpdatePolicy = async () => {
    if (!editingPolicy) return;
    try {
      const { error: apiError } = await updateRetentionPolicy(editingPolicy.id, {
        retention_days: editingPolicy.retention_days,
        auto_delete: editingPolicy.auto_delete,
        description: editingPolicy.description,
      });
      if (apiError) throw apiError;
      setSuccess('Politique mise à jour');
      setEditingPolicy(null);
      await loadData();
    } catch (err) {
      setError('Erreur lors de la mise à jour');
    }
  };

  const handleProcessRequest = async () => {
    if (!processDialog) return;
    try {
      const { error: apiError } = await processDataAccessRequest(
        processDialog.id, processStatus, processResponse, authState.profile?.id
      );
      if (apiError) throw apiError;
      setSuccess('Demande traitée');
      setProcessDialog(null);
      setProcessResponse('');
      await loadData();
    } catch (err) {
      setError('Erreur lors du traitement');
    }
  };

  const handleExportData = async (userId) => {
    try {
      const { data, error: apiError } = await exportUserData(userId);
      if (apiError) throw apiError;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `donnees_utilisateur_${userId}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccess('Données exportées');
    } catch (err) {
      setError('Erreur lors de l\'export');
    }
  };

  const getRequestTypeLabel = (type) => {
    const labels = { access: 'Droit d\'accès', rectification: 'Rectification', deletion: 'Suppression', export: 'Export', portability: 'Portabilité' };
    return labels[type] || type;
  };

  const getStatusChip = (status) => {
    const map = { pending: { l: 'En attente', c: 'warning' }, processing: { l: 'En cours', c: 'info' }, completed: { l: 'Traitée', c: 'success' }, rejected: { l: 'Rejetée', c: 'error' } };
    const s = map[status] || { l: status, c: 'default' };
    return <Chip label={s.l} size="small" color={s.c} />;
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <SecurityIcon sx={{ mr: 1, color: 'primary.main', fontSize: 32 }} />
        <Typography variant="h5" fontWeight="bold">Conformité RGPD</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      <Snackbar open={!!success} autoHideDuration={4000} onClose={() => setSuccess('')} message={success} />

      {/* Résumé */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Politiques de rétention', value: policies.length, icon: <PolicyIcon /> },
          { label: 'Demandes en attente', value: requests.filter(r => r.status === 'pending').length, icon: <AccessIcon />, color: 'warning.main' },
          { label: 'Demandes traitées', value: requests.filter(r => r.status === 'completed').length, icon: <ExportIcon />, color: 'success.main' },
        ].map((s, i) => (
          <Grid item xs={12} md={4} key={i}>
            <Card elevation={2}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ color: s.color || 'primary.main' }}>{s.icon}</Box>
                <Box>
                  <Typography variant="h4" fontWeight="bold">{s.value}</Typography>
                  <Typography variant="body2" color="text.secondary">{s.label}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 1 }}>
        <Tab label="Politiques de rétention" />
        <Tab label="Demandes d'accès" />
      </Tabs>

      {/* Politiques */}
      <TabPanel value={tabValue} index={0}>
        <TableContainer component={Paper} elevation={2}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#003366' }}>
                {['Type de données', 'Rétention', 'Description', 'Suppression auto', 'Dernier nettoyage', 'Actions'].map(h => (
                  <TableCell key={h} sx={{ color: 'white', fontWeight: 'bold' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {policies.map(p => (
                <TableRow key={p.id} hover>
                  <TableCell><Chip label={p.data_type} size="small" variant="outlined" /></TableCell>
                  <TableCell><strong>{p.retention_days}</strong> jours</TableCell>
                  <TableCell>{p.description}</TableCell>
                  <TableCell>
                    <Chip label={p.auto_delete ? 'Oui' : 'Non'} size="small" color={p.auto_delete ? 'success' : 'default'} />
                  </TableCell>
                  <TableCell>{p.last_cleanup_at ? new Date(p.last_cleanup_at).toLocaleDateString('fr-FR') : 'Jamais'}</TableCell>
                  <TableCell>
                    <Button size="small" startIcon={<EditIcon />} onClick={() => setEditingPolicy({ ...p })}>Modifier</Button>
                  </TableCell>
                </TableRow>
              ))}
              {policies.length === 0 && (
                <TableRow><TableCell colSpan={6} align="center">Aucune politique définie</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Demandes */}
      <TabPanel value={tabValue} index={1}>
        <TableContainer component={Paper} elevation={2}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#003366' }}>
                {['Date', 'Utilisateur', 'Type', 'Détails', 'Statut', 'Actions'].map(h => (
                  <TableCell key={h} sx={{ color: 'white', fontWeight: 'bold' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map(r => (
                <TableRow key={r.id} hover>
                  <TableCell>{new Date(r.created_at).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell>{r.user?.full_name || r.user?.email || '-'}</TableCell>
                  <TableCell><Chip label={getRequestTypeLabel(r.request_type)} size="small" variant="outlined" /></TableCell>
                  <TableCell sx={{ maxWidth: 200 }}><Typography variant="body2" noWrap>{r.details || '-'}</Typography></TableCell>
                  <TableCell>{getStatusChip(r.status)}</TableCell>
                  <TableCell>
                    {r.status === 'pending' && (
                      <Button size="small" variant="outlined" onClick={() => setProcessDialog(r)}>Traiter</Button>
                    )}
                    {r.request_type === 'export' && r.status === 'pending' && (
                      <Button size="small" startIcon={<ExportIcon />} onClick={() => handleExportData(r.user_id)}>Exporter</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {requests.length === 0 && (
                <TableRow><TableCell colSpan={6} align="center">Aucune demande</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Edit Policy Dialog */}
      <Dialog open={!!editingPolicy} onClose={() => setEditingPolicy(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Modifier la politique de rétention</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Type de données" value={editingPolicy?.data_type || ''} disabled fullWidth />
            <TextField label="Durée de rétention (jours)" type="number" fullWidth
              value={editingPolicy?.retention_days || 0}
              onChange={(e) => setEditingPolicy({ ...editingPolicy, retention_days: parseInt(e.target.value, 10) })} />
            <TextField label="Description" fullWidth multiline rows={2}
              value={editingPolicy?.description || ''}
              onChange={(e) => setEditingPolicy({ ...editingPolicy, description: e.target.value })} />
            <FormControlLabel control={
              <Switch checked={editingPolicy?.auto_delete || false}
                onChange={(e) => setEditingPolicy({ ...editingPolicy, auto_delete: e.target.checked })} />
            } label="Suppression automatique" />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingPolicy(null)}>Annuler</Button>
          <Button variant="contained" onClick={handleUpdatePolicy}>Enregistrer</Button>
        </DialogActions>
      </Dialog>

      {/* Process Request Dialog */}
      <Dialog open={!!processDialog} onClose={() => setProcessDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Traiter la demande</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="info">
              Demande de <strong>{getRequestTypeLabel(processDialog?.request_type)}</strong> par {processDialog?.user?.full_name || 'Utilisateur'}
            </Alert>
            <FormControl fullWidth>
              <InputLabel>Décision</InputLabel>
              <Select value={processStatus} label="Décision" onChange={(e) => setProcessStatus(e.target.value)}>
                <MenuItem value="completed">Approuver</MenuItem>
                <MenuItem value="rejected">Rejeter</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Réponse / Commentaire" fullWidth multiline rows={3}
              value={processResponse} onChange={(e) => setProcessResponse(e.target.value)} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProcessDialog(null)}>Annuler</Button>
          <Button variant="contained" onClick={handleProcessRequest}>Valider</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RGPDPage;
