import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Chip,
  Alert,
  CircularProgress,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  Comment as CommentIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { supabase } from '@/supabase';
import { useAuth } from '../../hooks/useAuth';

const VALIDATION_STATUSES = [
  { value: 'pending', label: 'En attente', color: 'warning' },
  { value: 'approved', label: 'Approuvé', color: 'success' },
  { value: 'rejected', label: 'Rejeté', color: 'error' },
  { value: 'revision', label: 'En révision', color: 'info' },
];

const DOCUMENT_STATUSES = [
  { value: 'student_record', label: 'Dossier étudiant' },
  { value: 'grade_correction', label: 'Demande de correction de note' },
  { value: 'transcript_request', label: 'Demande de relevé' },
  { value: 'certificate_request', label: 'Demande de certificat' },
  { value: 'document_upload', label: 'Upload de document' },
  { value: 'stage_application', label: 'Candidature stage' },
];

export default function ValidationQueuePage() {
  const { authState } = useAuth();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [filterType, setFilterType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [actionDialog, setActionDialog] = useState(false);
  const [actionType, setActionType] = useState(null); // 'approve' or 'reject'
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchValidationQueue();
    const interval = setInterval(fetchValidationQueue, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchValidationQueue = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('validation_queue')
        .select(
          `
          *,
          student:students(id, profile_id, level),
          requester:profiles(id, first_name, last_name, email)
        `
        )
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setQueue(data || []);
    } catch (err) {
      console.error('Error fetching validation queue:', err);
      setError('Erreur lors du chargement de la file de validation');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedItem) return;
    try {
      setLoading(true);
      setError(null);

      // Update validation queue
      const { error: updateError } = await supabase
        .from('validation_queue')
        .update({
          status: 'approved',
          reviewed_by: authState.user?.id,
          reviewed_at: new Date().toISOString(),
          feedback: feedback || null,
        })
        .eq('id', selectedItem.id);

      if (updateError) throw updateError;

      // Create audit log
      await supabase.from('audit_log').insert([
        {
          user_id: authState.user?.id,
          action: 'approve',
          resource_type: 'validation_queue_item',
          resource_id: selectedItem.id,
          description: `Item validé: ${selectedItem.document_type}${feedback ? ` - ${feedback}` : ''}`,
        },
      ]);

      setSuccess('Item approuvé avec succès');
      setActionDialog(false);
      setFeedback('');
      fetchValidationQueue();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error approving item:', err);
      setError('Erreur lors de l\'approbation');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedItem || !feedback.trim()) {
      setError('La raison du rejet est requise');
      return;
    }
    try {
      setLoading(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('validation_queue')
        .update({
          status: 'rejected',
          reviewed_by: authState.user?.id,
          reviewed_at: new Date().toISOString(),
          feedback: feedback,
        })
        .eq('id', selectedItem.id);

      if (updateError) throw updateError;

      // Create audit log
      await supabase.from('audit_log').insert([
        {
          user_id: authState.user?.id,
          action: 'reject',
          resource_type: 'validation_queue_item',
          resource_id: selectedItem.id,
          description: `Item rejeté: ${selectedItem.document_type} - ${feedback}`,
        },
      ]);

      setSuccess('Item rejeté avec succès');
      setActionDialog(false);
      setFeedback('');
      fetchValidationQueue();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error rejecting item:', err);
      setError('Erreur lors du rejet');
    } finally {
      setLoading(false);
    }
  };

  const handleDetails = (item) => {
    setSelectedItem(item);
    setDetailsDialog(true);
  };

  const handleAction = (item, type) => {
    setSelectedItem(item);
    setActionType(type);
    setFeedback(item.feedback || '');
    setActionDialog(true);
  };

  const filteredQueue = queue.filter((item) => {
    const matchesStatus = !filterStatus || item.status === filterStatus;
    const matchesType = !filterType || item.document_type === filterType;
    const matchesSearch =
      !searchQuery ||
      item.requester?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.document_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.document_title?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesType && matchesSearch;
  });

  const getStatusChip = (status) => {
    const config = DOCUMENT_STATUSES.find((s) => s.value === status);
    return config?.label || status;
  };

  const getValidationColor = (status) => {
    const colors = {
      pending: 'warning',
      approved: 'success',
      rejected: 'error',
      revision: 'info',
    };
    return colors[status] || 'default';
  };

  const getWaitingDays = (createdAt) => {
    const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const stats = {
    pending: queue.filter((q) => q.status === 'pending').length,
    approved: queue.filter((q) => q.status === 'approved').length,
    rejected: queue.filter((q) => q.status === 'rejected').length,
    revision: queue.filter((q) => q.status === 'revision').length,
  };

  return (
    <Box sx={{ p: 3 }}>
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="File d'Attente de Validation"
          subheader="Gérer les demandes de validation des documents"
        />
        <CardContent>
          {/* Stats Summary */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 3 }}>
            <Chip
              icon={<InfoIcon />}
              label={`En attente: ${stats.pending}`}
              color={stats.pending > 0 ? 'warning' : 'default'}
              variant="outlined"
            />
            <Chip
              icon={<CheckIcon />}
              label={`Approuvés: ${stats.approved}`}
              color="success"
              variant="outlined"
            />
            <Chip
              label={`Rejetés: ${stats.rejected}`}
              color="error"
              variant="outlined"
            />
            <Chip
              label={`En révision: ${stats.revision}`}
              color="info"
              variant="outlined"
            />
          </Stack>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          {/* Filters */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Statut</InputLabel>
              <Select
                value={filterStatus}
                label="Statut"
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <MenuItem value="">Tous les statuts</MenuItem>
                {VALIDATION_STATUSES.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={filterType}
                label="Type"
                onChange={(e) => setFilterType(e.target.value)}
              >
                <MenuItem value="">Tous les types</MenuItem>
                {DOCUMENT_STATUSES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              size="small"
              placeholder="Rechercher par email, titre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ flex: 1 }}
            />
          </Stack>

          {/* Queue Table */}
          {loading && !queue.length ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Demandeur</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Titre</TableCell>
                    <TableCell align="center">Statut</TableCell>
                    <TableCell align="center">En attente</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredQueue.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                        <Typography color="textSecondary">
                          Aucun item dans la file de validation
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredQueue.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell sx={{ fontSize: '0.9rem' }}>
                          {new Date(item.created_at).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </TableCell>
                        <TableCell>
                          <Tooltip title={item.requester?.email}>
                            <Typography variant="body2">
                              {item.requester?.first_name} {item.requester?.last_name}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusChip(item.document_type)}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.document_title}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={
                              VALIDATION_STATUSES.find((s) => s.value === item.status)?.label ||
                              item.status
                            }
                            color={getValidationColor(item.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography
                            variant="body2"
                            color={getWaitingDays(item.created_at) > 7 ? 'error' : 'textSecondary'}
                          >
                            {getWaitingDays(item.created_at)}j
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            <Tooltip title="Détails">
                              <IconButton
                                size="small"
                                onClick={() => handleDetails(item)}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {item.status === 'pending' && (
                              <>
                                <Tooltip title="Approuver">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleAction(item, 'approve')}
                                    color="success"
                                  >
                                    <CheckIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Rejeter">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleAction(item, 'reject')}
                                    color="error"
                                  >
                                    <CloseIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                            {item.status === 'revision' && (
                              <Tooltip title="Ajouter un commentaire">
                                <IconButton
                                  size="small"
                                  onClick={() => handleAction(item, 'comment')}
                                >
                                  <CommentIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

// Details Dialog Component
function DetailsDialog({ open, onClose, item }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Détails de la demande</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        {item && (
          <Stack spacing={2}>
            <Box>
              <Typography variant="caption" color="textSecondary">
                Demandeur
              </Typography>
              <Typography variant="body2">
                {item.requester?.first_name} {item.requester?.last_name}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {item.requester?.email}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="textSecondary">
                Type de document
              </Typography>
              <Typography variant="body2">
                {DOCUMENT_STATUSES.find((t) => t.value === item.document_type)?.label ||
                  item.document_type}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="textSecondary">
                Titre
              </Typography>
              <Typography variant="body2">{item.document_title}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="textSecondary">
                Description
              </Typography>
              <Typography variant="body2">{item.description || '-'}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="textSecondary">
                Commentaires
              </Typography>
              <Typography variant="body2">{item.feedback || '-'}</Typography>
            </Box>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fermer</Button>
      </DialogActions>
    </Dialog>
  );
}
