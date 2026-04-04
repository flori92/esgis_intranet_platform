import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Info as InfoIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { getValidationQueue, reviewValidationQueueItem } from '@/api/admin';
import { useAuth } from '../../hooks/useAuth';

const VALIDATION_STATUSES = [
  { value: 'pending', label: 'En attente', color: 'warning' },
  { value: 'approved', label: 'Approuvé', color: 'success' },
  { value: 'rejected', label: 'Rejeté', color: 'error' },
];

const REQUEST_TYPES = [
  { value: 'transcript', label: 'Relevé de notes' },
  { value: 'certificate', label: 'Certificat de scolarité' },
  { value: 'attestation', label: 'Attestation' },
  { value: 'diploma', label: 'Diplôme' },
  { value: 'grade_correction', label: 'Correction de note' },
  { value: 'document_upload', label: 'Dépôt de document' },
];

const getRequestLabel = (value) => REQUEST_TYPES.find((item) => item.value === value)?.label || value;
const getStatusLabel = (value) => VALIDATION_STATUSES.find((item) => item.value === value)?.label || value;
const getStatusColor = (value) => VALIDATION_STATUSES.find((item) => item.value === value)?.color || 'default';
const getWaitingDays = (createdAt) => Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)));

const getRequesterName = (requester) => requester?.full_name || requester?.email || 'Demandeur inconnu';

export default function ValidationQueuePage() {
  const { authState } = useAuth();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [filterType, setFilterType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState('approve');
  const [reviewComment, setReviewComment] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      setError('');
      const { data, error: fetchError } = await getValidationQueue();
      if (fetchError) {
        throw fetchError;
      }
      setQueue(data || []);
    } catch (err) {
      console.error('fetchQueue:', err);
      setError('Erreur lors du chargement de la file de validation.');
    } finally {
      setLoading(false);
    }
  };

  const filteredQueue = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return queue.filter((item) => {
      const matchesStatus = !filterStatus || item.status === filterStatus;
      const matchesType = !filterType || item.request_type === filterType;
      const matchesSearch = !query
        || getRequesterName(item.requester).toLowerCase().includes(query)
        || item.requester?.email?.toLowerCase().includes(query)
        || item.request_type?.toLowerCase().includes(query)
        || item.details?.title?.toLowerCase().includes(query)
        || item.details?.document_name?.toLowerCase().includes(query);

      return matchesStatus && matchesType && matchesSearch;
    });
  }, [filterStatus, filterType, queue, searchQuery]);

  const stats = useMemo(() => ({
    pending: queue.filter((item) => item.status === 'pending').length,
    approved: queue.filter((item) => item.status === 'approved').length,
    rejected: queue.filter((item) => item.status === 'rejected').length,
  }), [queue]);

  const openDetails = (item) => {
    setSelectedItem(item);
    setDetailsDialogOpen(true);
  };

  const openReviewDialog = (item, decision) => {
    setSelectedItem(item);
    setActionType(decision);
    setReviewComment(item.review_comment || '');
    setActionDialogOpen(true);
  };

  const handleReview = async () => {
    if (!selectedItem) {
      return;
    }

    if (actionType === 'reject' && !reviewComment.trim()) {
      setError('Un commentaire est requis pour rejeter une demande.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const actor = {
        id: authState.profile?.id || authState.user?.id || null,
        full_name: authState.profile?.full_name || authState.user?.email || 'Admin ESGIS',
        role: authState.profile?.role || 'admin',
      };

      const { error: reviewError } = await reviewValidationQueueItem(selectedItem.id, {
        decision: actionType,
        comment: reviewComment,
        reviewerId: actor.id,
        actor,
      });

      if (reviewError) {
        throw reviewError;
      }

      setSuccess(actionType === 'approve' ? 'Demande approuvée.' : 'Demande rejetée.');
      setActionDialogOpen(false);
      setSelectedItem(null);
      setReviewComment('');
      await fetchQueue();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('handleReview:', err);
      setError(`Erreur lors de la revue: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardHeader
          title="File d'attente de validation"
          subheader="Traiter les demandes documentaires et institutionnelles en attente"
        />
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 3 }}>
            <Chip icon={<InfoIcon />} label={`En attente: ${stats.pending}`} color={stats.pending ? 'warning' : 'default'} variant="outlined" />
            <Chip icon={<CheckIcon />} label={`Approuvées: ${stats.approved}`} color="success" variant="outlined" />
            <Chip icon={<CloseIcon />} label={`Rejetées: ${stats.rejected}`} color="error" variant="outlined" />
          </Stack>

          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Statut</InputLabel>
              <Select value={filterStatus} label="Statut" onChange={(event) => setFilterStatus(event.target.value)}>
                <MenuItem value="">Tous les statuts</MenuItem>
                {VALIDATION_STATUSES.map((status) => (
                  <MenuItem key={status.value} value={status.value}>{status.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel>Type de demande</InputLabel>
              <Select value={filterType} label="Type de demande" onChange={(event) => setFilterType(event.target.value)}>
                <MenuItem value="">Tous les types</MenuItem>
                {REQUEST_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              size="small"
              fullWidth
              placeholder="Rechercher par demandeur, type ou objet..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </Stack>

          {loading && !queue.length ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell><strong>Date</strong></TableCell>
                    <TableCell><strong>Demandeur</strong></TableCell>
                    <TableCell><strong>Type</strong></TableCell>
                    <TableCell><strong>Objet</strong></TableCell>
                    <TableCell><strong>Priorité</strong></TableCell>
                    <TableCell align="center"><strong>Statut</strong></TableCell>
                    <TableCell align="center"><strong>En attente</strong></TableCell>
                    <TableCell align="right"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredQueue.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">Aucune demande à afficher.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : filteredQueue.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        {new Date(item.created_at).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {getRequesterName(item.requester)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.requester?.email || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={getRequestLabel(item.request_type)} variant="outlined" size="small" />
                      </TableCell>
                      <TableCell sx={{ maxWidth: 260 }}>
                        <Typography variant="body2" noWrap title={item.details?.title || item.details?.document_name || item.request_type}>
                          {item.details?.title || item.details?.document_name || item.request_type}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={item.priority || 'normal'}
                          size="small"
                          color={item.priority === 'urgent' ? 'error' : item.priority === 'high' ? 'warning' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={getStatusLabel(item.status)} color={getStatusColor(item.status)} size="small" />
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" color={getWaitingDays(item.created_at) > 7 ? 'error.main' : 'text.secondary'}>
                          {getWaitingDays(item.created_at)}j
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title="Détails">
                            <IconButton size="small" onClick={() => openDetails(item)}>
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {item.status === 'pending' && (
                            <>
                              <Tooltip title="Approuver">
                                <IconButton size="small" color="success" onClick={() => openReviewDialog(item, 'approve')}>
                                  <CheckIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Rejeter">
                                <IconButton size="small" color="error" onClick={() => openReviewDialog(item, 'reject')}>
                                  <CloseIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailsDialogOpen} onClose={() => setDetailsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Détails de la demande</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {selectedItem && (
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">Demandeur</Typography>
                <Typography variant="body2">{getRequesterName(selectedItem.requester)}</Typography>
                <Typography variant="caption" color="text.secondary">{selectedItem.requester?.email || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Type de demande</Typography>
                <Typography variant="body2">{getRequestLabel(selectedItem.request_type)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Objet</Typography>
                <Typography variant="body2">{selectedItem.details?.title || selectedItem.details?.document_name || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Commentaire de revue</Typography>
                <Typography variant="body2">{selectedItem.review_comment || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Détails</Typography>
                <Typography component="pre" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: 12, p: 1.5, backgroundColor: '#f8f9fb', borderRadius: 1 }}>
                  {JSON.stringify(selectedItem.details || {}, null, 2)}
                </Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={actionDialogOpen} onClose={() => setActionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{actionType === 'approve' ? 'Approuver la demande' : 'Rejeter la demande'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              {selectedItem ? `${getRequestLabel(selectedItem.request_type)} — ${selectedItem.details?.title || selectedItem.details?.document_name || selectedItem.id}` : ''}
            </Typography>
            <TextField
              fullWidth
              multiline
              minRows={3}
              label={actionType === 'approve' ? 'Commentaire (optionnel)' : 'Motif du rejet'}
              value={reviewComment}
              onChange={(event) => setReviewComment(event.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialogOpen(false)}>Annuler</Button>
          <Button variant="contained" color={actionType === 'approve' ? 'success' : 'error'} onClick={handleReview}>
            Confirmer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
