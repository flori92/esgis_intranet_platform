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
import { getValidationQueue } from '@/api/admin';
import { updateRequestStatus } from '@/api/requests';
import { useAuth } from '../../hooks/useAuth';

const VALIDATION_STATUSES = [
  { value: 'pending', label: 'Reçue (legacy)', color: 'info' },
  { value: 'received', label: 'Reçue', color: 'info' },
  { value: 'processing', label: 'En cours', color: 'warning' },
  { value: 'approved', label: 'Approuvée', color: 'success' },
  { value: 'rejected', label: 'Rejetée', color: 'error' },
  { value: 'ready', label: 'Prête (Disponible)', color: 'secondary' },
];

const REQUEST_TYPES = [
  { value: 'certificate', label: 'Certificat de scolarité' },
  { value: 'attestation', label: 'Attestation d\'inscription' },
  { value: 'transcript', label: 'Relevé de notes' },
  { value: 'report_card', label: 'Bulletin de notes' },
  { value: 'correction', label: 'Correction d\'informations' },
  { value: 'duplicate', label: 'Duplicata' },
  { value: 'access_reset', label: 'Réinitialisation d\'accès' },
  { value: 'other', label: 'Autre demande' },
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
  const [filterStatus, setFilterStatus] = useState('received');
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
      const matchesStatus = !filterStatus
        || (filterStatus === 'received' ? item.status === 'received' || item.status === 'pending' : item.status === filterStatus);
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
    received: queue.filter((item) => item.status === 'received' || item.status === 'pending').length,
    processing: queue.filter((item) => item.status === 'processing').length,
    ready: queue.filter((item) => item.status === 'ready').length,
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

  const handleReview = async (newStatus) => {
    if (!selectedItem) {
      return;
    }

    if (newStatus === 'rejected' && !reviewComment.trim()) {
      setError('Un motif est requis pour rejeter une demande.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const reviewerId = authState.profile?.id || null;

      const { error: reviewError } = await updateRequestStatus(selectedItem.id, {
        status: newStatus,
        comment: reviewComment,
        reviewerId
      });

      if (reviewError) {
        throw reviewError;
      }

      setSuccess(`La demande est passée au statut : ${getStatusLabel(newStatus)}`);
      setActionDialogOpen(false);
      setDetailsDialogOpen(false);
      setSelectedItem(null);
      setReviewComment('');
      await fetchQueue();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('handleReview:', err);
      setError(`Erreur lors de la mise à jour: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: '-0.5px' }}>File de Validation</Typography>
        <Typography variant="body1" color="text.secondary">Traitez les demandes documentaires et institutionnelles du campus.</Typography>
      </Box>

      <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid #E5E7EB' }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 4 }}>
            {[
              { label: 'Reçues', value: stats.received, color: 'info' },
              { label: 'En cours', value: stats.processing, color: 'warning' },
              { label: 'Prêtes', value: stats.ready, color: 'secondary' },
              { label: 'Approuvées', value: stats.approved, color: 'success' },
              { label: 'Rejetées', value: stats.rejected, color: 'error' }
            ].map(s => (
              <Chip 
                key={s.label}
                label={`${s.label}: ${s.value}`} 
                color={s.value > 0 ? s.color : 'default'} 
                variant={s.value > 0 ? 'filled' : 'outlined'}
                sx={{ fontWeight: 700, borderRadius: 1.5 }}
              />
            ))}
          </Stack>

          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{success}</Alert>}

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 4 }}>
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
              <InputLabel>Type</InputLabel>
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
              placeholder="Rechercher par demandeur, type..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchQueue} sx={{ borderRadius: 2 }}>Actualiser</Button>
          </Stack>

          {loading && !queue.length ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
          ) : (
            <TableContainer sx={{ border: '1px solid #E5E7EB', borderRadius: 2 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Demandeur</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Objet</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800 }}>Statut</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800 }}>Attente</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredQueue.length === 0 ? (
                    <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}><Typography color="text.secondary">Aucune demande.</Typography></TableCell></TableRow>
                  ) : filteredQueue.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell><Typography variant="body2">{format(new Date(item.created_at), 'dd MMM yyyy', { locale: fr })}</Typography></TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700} color="primary">{getRequesterName(item.requester)}</Typography>
                        <Typography variant="caption" color="text.secondary">{item.requester?.email || '-'}</Typography>
                      </TableCell>
                      <TableCell><Chip label={getRequestLabel(item.request_type)} variant="outlined" size="small" sx={{ fontWeight: 600, fontSize: '0.7rem' }} /></TableCell>
                      <TableCell sx={{ maxWidth: 200 }}><Typography variant="body2" noWrap>{item.details?.title || item.request_type}</Typography></TableCell>
                      <TableCell align="center"><Chip label={getStatusLabel(item.status)} color={getStatusColor(item.status)} size="small" sx={{ fontWeight: 700 }} /></TableCell>
                      <TableCell align="center"><Typography variant="body2" fontWeight={700} color={getWaitingDays(item.created_at) > 3 ? 'error.main' : 'text.secondary'}>{getWaitingDays(item.created_at)}j</Typography></TableCell>
                      <TableCell align="right">
                        <IconButton size="small" color="primary" onClick={() => openDetails(item)}><VisibilityIcon fontSize="small" /></IconButton>
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
        <DialogTitle>Traitement de la demande</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {selectedItem && (
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Demandeur</Typography>
                  <Typography variant="body1" fontWeight="bold">{getRequesterName(selectedItem.requester)}</Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" color="text.secondary">Statut Actuel</Typography>
                  <Box>
                    <Chip 
                      label={getStatusLabel(selectedItem.status)} 
                      color={getStatusColor(selectedItem.status)} 
                      size="small" 
                    />
                  </Box>
                </Box>
              </Box>
              
              <Box>
                <Typography variant="caption" color="text.secondary">Type de demande</Typography>
                <Typography variant="body2">{getRequestLabel(selectedItem.request_type)}</Typography>
              </Box>

              <TextField
                fullWidth
                multiline
                rows={2}
                label="Commentaire de traitement / Motif de rejet"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
              />

              <Divider />
              
              <Typography variant="subtitle2">Changer le statut :</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {VALIDATION_STATUSES.map(s => (
                  <Button
                    key={s.value}
                    size="small"
                    variant={selectedItem.status === s.value ? "contained" : "outlined"}
                    color={s.color}
                    onClick={() => handleReview(s.value)}
                    disabled={loading || selectedItem.status === s.value}
                    sx={{ mb: 1 }}
                  >
                    {s.label}
                  </Button>
                ))}
              </Stack>

              <Box>
                <Typography variant="caption" color="text.secondary">Détails techniques</Typography>
                <Typography component="pre" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: 11, p: 1, backgroundColor: '#f8f9fb', borderRadius: 1 }}>
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
