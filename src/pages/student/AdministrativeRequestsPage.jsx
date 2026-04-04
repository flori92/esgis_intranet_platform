import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, Button, Card, CardContent,
  Chip, Divider, Stack, TextField, MenuItem, FormControl,
  InputLabel, Select, CircularProgress, Alert, Dialog,
  DialogTitle, DialogContent, DialogActions, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip
} from '@mui/material';
import {
  Assignment as RequestIcon,
  Add as AddIcon,
  History as HistoryIcon,
  Download as DownloadIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Timer as TimerIcon,
  Error as ErrorIcon,
  RotateRight as ProcessingIcon
} from '@mui/icons-material';
import { useAuth } from '@/context/AuthContext';
import { getStudentRequests, createAdministrativeRequest } from '@/api/requests';

const REQUEST_TYPES = [
  { value: 'certificate', label: 'Certificat de scolarité', icon: <RequestIcon /> },
  { value: 'attestation', label: 'Attestation d\'inscription', icon: <RequestIcon /> },
  { value: 'transcript', label: 'Relevé de notes', icon: <HistoryIcon /> },
  { value: 'correction', label: 'Correction d\'informations', icon: <InfoIcon /> },
  { value: 'duplicate', label: 'Duplicata', icon: <HistoryIcon /> },
  { value: 'access_reset', label: 'Réinitialisation d\'accès', icon: <InfoIcon /> },
];

const STATUS_CONFIG = {
  received: { label: 'Reçue', color: 'info', icon: <CheckCircleIcon fontSize="small" /> },
  processing: { label: 'En traitement', color: 'warning', icon: <ProcessingIcon fontSize="small" /> },
  approved: { label: 'Approuvée', color: 'success', icon: <CheckCircleIcon fontSize="small" /> },
  rejected: { label: 'Rejetée', color: 'error', icon: <ErrorIcon fontSize="small" /> },
  ready: { label: 'Prête (Disponible)', color: 'secondary', icon: <DownloadIcon fontSize="small" /> },
};

const AdministrativeRequestsPage = () => {
  const { authState } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // New Request Dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [newRequest, setNewRequest] = useState({
    type: 'certificate',
    priority: 'normal',
    reason: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error: apiError } = await getStudentRequests(authState.profile?.id);
      if (apiError) throw apiError;
      setRequests(data);
    } catch (err) {
      setError('Impossible de charger vos demandes.');
    } finally {
      setLoading(false);
    }
  }, [authState.profile?.id]);

  useEffect(() => {
    if (authState.profile?.id) fetchRequests();
  }, [authState.profile?.id, fetchRequests]);

  const handleCreateRequest = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        type: newRequest.type,
        requesterId: authState.profile?.id,
        studentId: authState.student?.id,
        priority: newRequest.priority,
        details: {
          reason: newRequest.reason,
          title: REQUEST_TYPES.find(t => t.value === newRequest.type)?.label
        }
      };
      
      const { error: apiError } = await createAdministrativeRequest(payload);
      if (apiError) throw apiError;
      
      setSuccess('Votre demande a été transmise avec succès.');
      setOpenDialog(false);
      setNewRequest({ type: 'certificate', priority: 'normal', reason: '' });
      fetchRequests();
    } catch (err) {
      setError('Erreur lors de la création de la demande.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStatus = (status) => {
    const config = STATUS_CONFIG[status] || { label: status, color: 'default' };
    return (
      <Chip
        icon={config.icon}
        label={config.label}
        color={config.color}
        size="small"
        variant="outlined"
      />
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <RequestIcon color="primary" fontSize="large" />
            Démarches Administratives
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Effectuez vos demandes de documents et suivez leur traitement par la scolarité.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Nouvelle Demande
        </Button>
      </Stack>

      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper elevation={2}>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: 'grey.50' }}>
                  <TableRow>
                    <TableCell><strong>Date</strong></TableCell>
                    <TableCell><strong>Type de demande</strong></TableCell>
                    <TableCell><strong>Objet / Motif</strong></TableCell>
                    <TableCell><strong>Statut</strong></TableCell>
                    <TableCell align="right"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
                  ) : requests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">Vous n'avez aucune demande en cours.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : requests.map((req) => (
                    <TableRow key={req.id} hover>
                      <TableCell>{new Date(req.created_at).toLocaleDateString('fr-FR')}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {REQUEST_TYPES.find(t => t.value === req.request_type)?.label || req.request_type}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 300 }}>
                        <Typography variant="body2" noWrap title={req.details?.reason}>
                          {req.details?.reason || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>{renderStatus(req.status)}</TableCell>
                      <TableCell align="right">
                        {req.status === 'ready' && req.document?.file_path && (
                          <Tooltip title="Télécharger le document">
                            <IconButton color="secondary" onClick={() => window.open(req.document.file_path, '_blank')}>
                              <DownloadIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Plus d'infos">
                          <IconButton size="small">
                            <InfoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Dialog: New Request */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nouvelle Demande Administrative</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Alert severity="info" size="small">
              Les délais de traitement habituels sont de 24h à 48h ouvrées.
            </Alert>
            
            <FormControl fullWidth>
              <InputLabel>Type de document / demande</InputLabel>
              <Select
                value={newRequest.type}
                label="Type de document / demande"
                onChange={(e) => setNewRequest({ ...newRequest, type: e.target.value })}
              >
                {REQUEST_TYPES.map(type => (
                  <MenuItem key={type.value} value={type.value}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {type.icon}
                      <Typography>{type.label}</Typography>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Priorité</InputLabel>
              <Select
                value={newRequest.priority}
                label="Priorité"
                onChange={(e) => setNewRequest({ ...newRequest, priority: e.target.value })}
              >
                <MenuItem value="low">Basse</MenuItem>
                <MenuItem value="normal">Normale</MenuItem>
                <MenuItem value="high">Haute</MenuItem>
                <MenuItem value="urgent">Urgente (Justificatif requis)</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Précisions / Motif de la demande"
              placeholder="Ex: Besoin pour un dossier de stage, erreur sur mon nom, etc."
              value={newRequest.reason}
              onChange={(e) => setNewRequest({ ...newRequest, reason: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenDialog(false)} disabled={submitting}>Annuler</Button>
          <Button
            variant="contained"
            onClick={handleCreateRequest}
            disabled={submitting || !newRequest.reason}
            startIcon={submitting ? <CircularProgress size={20} /> : <CheckCircleIcon />}
          >
            {submitting ? 'Envoi en cours...' : 'Envoyer la demande'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdministrativeRequestsPage;
