import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, CircularProgress, Alert, Button, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, IconButton
} from '@mui/material';
import {
  Backup as BackupIcon, PlayArrow as StartIcon, Delete as DeleteIcon,
  Refresh as RefreshIcon, CloudDownload as DownloadIcon
} from '@mui/icons-material';
import { useAuth } from '@/context/AuthContext';
import { getBackups, triggerBackup, deleteBackup } from '@/api/monitoring';

const BackupsPage = () => {
  const { authState } = useAuth();
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const loadBackups = useCallback(async () => {
    try {
      const { data, error: apiError } = await getBackups();
      if (apiError) throw apiError;
      setBackups(data || []);
    } catch (err) {
      setError('Erreur lors du chargement des sauvegardes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadBackups(); }, [loadBackups]);

  const handleTriggerBackup = async () => {
    setConfirmDialog(false);
    setTriggering(true);
    try {
      const { error: apiError } = await triggerBackup(authState.profile?.id);
      if (apiError) throw apiError;
      setSuccess('Sauvegarde lancée avec succès. Elle sera terminée dans quelques instants.');
      setTimeout(() => loadBackups(), 6000);
    } catch (err) {
      setError('Erreur lors du déclenchement de la sauvegarde');
    } finally {
      setTriggering(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const { error: apiError } = await deleteBackup(deleteConfirm.id);
      if (apiError) throw apiError;
      setSuccess('Sauvegarde supprimée');
      setDeleteConfirm(null);
      await loadBackups();
    } catch (err) {
      setError('Erreur lors de la suppression');
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '-';
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(2)} Go`;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} Mo`;
  };

  const getStatusChip = (status) => {
    const map = {
      completed: { label: 'Terminée', color: 'success' },
      in_progress: { label: 'En cours', color: 'info' },
      pending: { label: 'En attente', color: 'warning' },
      failed: { label: 'Échouée', color: 'error' },
    };
    const s = map[status] || { label: status, color: 'default' };
    return <Chip label={s.label} size="small" color={s.color} />;
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <BackupIcon sx={{ mr: 1, color: 'primary.main', fontSize: 32 }} />
          <Typography variant="h5" fontWeight="bold">Gestion des Sauvegardes</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadBackups}>Rafraîchir</Button>
          <Button variant="contained" startIcon={<StartIcon />} onClick={() => setConfirmDialog(true)}
            disabled={triggering}>
            {triggering ? 'En cours...' : 'Nouvelle sauvegarde'}
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      <Snackbar open={!!success} autoHideDuration={4000} onClose={() => setSuccess('')} message={success} />

      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#003366' }}>
              {['Type', 'Statut', 'Taille', 'Déclenchée le', 'Terminée le', 'Fichier', 'Actions'].map(h => (
                <TableCell key={h} sx={{ color: 'white', fontWeight: 'bold' }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {backups.map(b => (
              <TableRow key={b.id} hover>
                <TableCell>
                  <Chip label={b.backup_type === 'manual' ? 'Manuelle' : b.backup_type === 'full' ? 'Complète' : 'Incrémentale'}
                    size="small" variant="outlined" />
                </TableCell>
                <TableCell>{getStatusChip(b.status)}</TableCell>
                <TableCell>{formatSize(b.file_size)}</TableCell>
                <TableCell>{b.started_at ? new Date(b.started_at).toLocaleString('fr-FR') : '-'}</TableCell>
                <TableCell>{b.completed_at ? new Date(b.completed_at).toLocaleString('fr-FR') : '-'}</TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ maxWidth: 200 }} noWrap>{b.file_path || '-'}</Typography>
                </TableCell>
                <TableCell>
                  {b.status === 'completed' && (
                    <IconButton size="small" color="primary" title="Télécharger"><DownloadIcon fontSize="small" /></IconButton>
                  )}
                  <IconButton size="small" color="error" onClick={() => setDeleteConfirm(b)} title="Supprimer">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {backups.length === 0 && (
              <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}>Aucune sauvegarde enregistrée</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={confirmDialog} onClose={() => setConfirmDialog(false)}>
        <DialogTitle>Déclencher une sauvegarde</DialogTitle>
        <DialogContent>
          <Alert severity="info">
            Une sauvegarde complète de la base de données sera créée. Cette opération peut prendre quelques minutes.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleTriggerBackup}>Confirmer</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Supprimer la sauvegarde</DialogTitle>
        <DialogContent>
          <Typography>Supprimer définitivement cette sauvegarde ?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Annuler</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Supprimer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BackupsPage;
