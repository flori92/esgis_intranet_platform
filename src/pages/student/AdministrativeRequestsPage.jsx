import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import {
  Assignment as RequestIcon,
  CheckCircle as CheckCircleIcon,
  Description as DescriptionIcon,
  Download as DownloadIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  OpenInNew as OpenInNewIcon,
  RotateRight as ProcessingIcon,
  Timer as TimerIcon
} from '@mui/icons-material';
import { useAuth } from '@/context/AuthContext';
import {
  createDocumentDownloadUrl,
  getStudentGeneratedDocuments
} from '@/api/documents';
import {
  createAdministrativeRequest,
  getStudentRequests
} from '@/api/requests';
import { triggerDownload } from '@/utils/DownloadLinkUtil';

const REQUEST_OPTIONS = [
  {
    key: 'attestation_success',
    type: 'attestation',
    label: 'Attestation de réussite',
    variant: 'success',
    description: 'Document validé par la scolarité après décision académique.'
  },
  {
    key: 'transcript',
    type: 'transcript',
    label: 'Relevé de notes certifié',
    description: 'Version officielle signée de vos résultats.'
  },
  {
    key: 'report_card',
    type: 'report_card',
    label: 'Bulletin de notes',
    description: 'Demande de dépôt ou de réédition d’un bulletin.'
  },
  {
    key: 'duplicate',
    type: 'duplicate',
    label: 'Duplicata',
    description: 'Réédition d’un document déjà émis.'
  },
  {
    key: 'correction',
    type: 'correction',
    label: 'Correction d’informations',
    description: 'Rectification d’une erreur administrative.'
  },
  {
    key: 'access_reset',
    type: 'access_reset',
    label: 'Réinitialisation d’accès',
    description: 'Aide sur vos accès ou identifiants.'
  }
];

const REQUEST_BY_KEY = REQUEST_OPTIONS.reduce((accumulator, item) => {
  accumulator[item.key] = item;
  return accumulator;
}, {});

const STATUS_CONFIG = {
  pending: { label: 'Reçue', color: 'info', icon: <TimerIcon fontSize="small" /> },
  received: { label: 'Reçue', color: 'info', icon: <TimerIcon fontSize="small" /> },
  processing: { label: 'En traitement', color: 'warning', icon: <ProcessingIcon fontSize="small" /> },
  approved: { label: 'Approuvée', color: 'success', icon: <CheckCircleIcon fontSize="small" /> },
  rejected: { label: 'Rejetée', color: 'error', icon: <ErrorIcon fontSize="small" /> },
  ready: { label: 'Prête au téléchargement', color: 'secondary', icon: <DownloadIcon fontSize="small" /> }
};

const createInitialRequest = (requestKey = 'attestation_success') => ({
  key: requestKey,
  priority: 'normal',
  reason: ''
});

const AdministrativeRequestsPage = () => {
  const { authState } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [availableDocuments, setAvailableDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [newRequest, setNewRequest] = useState(createInitialRequest());
  const [submitting, setSubmitting] = useState(false);

  const approvedDocuments = useMemo(() => (
    availableDocuments.filter((document) => document.status === 'approved')
  ), [availableDocuments]);

  const latestByType = useMemo(() => {
    const latestDocument = (predicate) => approvedDocuments.find(predicate) || null;

    return {
      certificate: latestDocument((document) => document.template_type === 'certificate'),
      attestation: latestDocument((document) => (
        document.template_type === 'attestation'
        && `${document.title || document.deposit_note || ''}`.toLowerCase().includes('inscription')
      )),
      transcript: latestDocument((document) => document.template_type === 'transcript'),
      reportCard: latestDocument((document) => document.template_type === 'report_card')
    };
  }, [approvedDocuments]);

  const reportCards = useMemo(() => (
    approvedDocuments.filter((document) => document.template_type === 'report_card')
  ), [approvedDocuments]);

  const fetchData = useCallback(async () => {
    if (!authState.profile?.id || !authState.student?.id) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [
        { data: requestRows, error: requestsError },
        { documents: generatedRows, error: documentsError }
      ] = await Promise.all([
        getStudentRequests(authState.profile.id),
        getStudentGeneratedDocuments(authState.student.id)
      ]);

      if (requestsError) {
        throw requestsError;
      }

      if (documentsError) {
        throw documentsError;
      }

      setRequests(requestRows || []);
      setAvailableDocuments(generatedRows || []);
    } catch (err) {
      console.error('Impossible de charger le guichet administratif:', err);
      setError('Impossible de charger vos documents officiels et demandes.');
    } finally {
      setLoading(false);
    }
  }, [authState.profile?.id, authState.student?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenDialog = (requestKey = 'attestation_success') => {
    setNewRequest(createInitialRequest(requestKey));
    setOpenDialog(true);
  };

  const handleDownloadDocument = async (document, filenameOverride = null) => {
    try {
      const { url, error: downloadError } = await createDocumentDownloadUrl(document.file_path, 60);

      if (downloadError) {
        throw downloadError;
      }

      triggerDownload({
        url,
        filename: filenameOverride || `${document.title || 'document_officiel'}.pdf`
      });
    } catch (downloadError) {
      console.error('Téléchargement document officiel:', downloadError);
      setError(downloadError.message || 'Impossible de télécharger ce document.');
    }
  };

  const handleDownloadRequestDocument = async (requestItem) => {
    if (!requestItem.document?.file_path) {
      return;
    }

    await handleDownloadDocument(
      {
        ...requestItem.document,
        title: requestItem.details?.title || requestItem.request_type
      },
      `${requestItem.details?.title || requestItem.request_type}.pdf`
    );
  };

  const handleCreateRequest = async () => {
    const selectedRequest = REQUEST_BY_KEY[newRequest.key];

    if (!selectedRequest) {
      setError('Type de demande invalide.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        type: selectedRequest.type,
        requesterId: authState.profile?.id,
        studentId: authState.student?.id,
        priority: newRequest.priority,
        details: {
          title: selectedRequest.label,
          reason: newRequest.reason,
          document_variant: selectedRequest.variant || null,
          request_key: selectedRequest.key
        }
      };

      const { error: apiError } = await createAdministrativeRequest(payload);

      if (apiError) {
        throw apiError;
      }

      setSuccess('Votre demande a été transmise avec succès.');
      setOpenDialog(false);
      setNewRequest(createInitialRequest());
      await fetchData();
    } catch (err) {
      console.error('Erreur création demande administrative:', err);
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

  const officialCards = [
    {
      id: 'certificate',
      title: 'Certificat de scolarité',
      description: 'Génération immédiate, archivage automatique et téléchargement instantané.',
      document: latestByType.certificate,
      actionLabel: 'Ouvrir la génération',
      action: () => navigate('/student/certificate')
    },
    {
      id: 'attestation',
      title: "Attestation d'inscription",
      description: 'Disponible à tout moment avec date de génération et archivage officiel.',
      document: latestByType.attestation,
      actionLabel: "Ouvrir la génération",
      action: () => navigate('/student/certificate?doc=attestation')
    },
    {
      id: 'transcript',
      title: 'Relevé de notes',
      description: 'Téléchargez la dernière version déposée ou demandez une édition officielle.',
      document: latestByType.transcript,
      actionLabel: latestByType.transcript ? 'Télécharger le dernier' : 'Faire une demande',
      action: latestByType.transcript
        ? () => handleDownloadDocument(latestByType.transcript, 'releve_de_notes.pdf')
        : () => handleOpenDialog('transcript')
    },
    {
      id: 'report_card',
      title: 'Bulletin de notes',
      description: 'Retrouvez vos bulletins déjà déposés ou demandez une mise à disposition.',
      document: latestByType.reportCard,
      badge: reportCards.length ? `${reportCards.length} disponible(s)` : 'Aucun bulletin déposé',
      actionLabel: latestByType.reportCard ? 'Télécharger le dernier' : 'Faire une demande',
      action: latestByType.reportCard
        ? () => handleDownloadDocument(latestByType.reportCard, 'bulletin_de_notes.pdf')
        : () => handleOpenDialog('report_card')
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} mb={3} spacing={2}>
        <Box>
          <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <DescriptionIcon color="primary" fontSize="large" />
            Documents officiels
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Retrouvez vos certificats, attestations et dépôts de la scolarité, puis lancez vos demandes si un document n&apos;est pas encore disponible.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<RequestIcon />} onClick={() => handleOpenDialog()}>
          Nouvelle demande
        </Button>
      </Stack>

      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {officialCards.map((card) => (
              <Grid item xs={12} sm={6} key={card.id}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1} mb={1.5}>
                      <Box>
                        <Typography variant="h6">{card.title}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {card.description}
                        </Typography>
                      </Box>
                      {card.document ? (
                        <Chip size="small" color="success" label="Disponible" />
                      ) : (
                        <Chip size="small" variant="outlined" label="À produire" />
                      )}
                    </Stack>

                    {card.badge && (
                      <Chip size="small" variant="outlined" label={card.badge} sx={{ mb: 1.5 }} />
                    )}

                    {card.document && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        Dernier document le {new Date(card.document.created_at).toLocaleDateString('fr-FR')}
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
                    <Button size="small" variant="contained" onClick={card.action}>
                      {card.actionLabel}
                    </Button>
                    {card.document && card.id !== 'transcript' && card.id !== 'report_card' && (
                      <Button
                        size="small"
                        variant="text"
                        onClick={() => handleDownloadDocument(card.document, `${card.title}.pdf`)}
                      >
                        Télécharger le dernier
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Demandes sur validation
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Pour les documents qui nécessitent un contrôle, une signature supplémentaire ou un dépôt manuel, utilisez une demande dédiée.
            </Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} useFlexGap flexWrap="wrap">
              {REQUEST_OPTIONS.map((requestOption) => (
                <Button
                  key={requestOption.key}
                  variant="outlined"
                  startIcon={<OpenInNewIcon />}
                  onClick={() => handleOpenDialog(requestOption.key)}
                >
                  {requestOption.label}
                </Button>
              ))}
            </Stack>
          </Paper>

          <Paper elevation={2}>
            <Box sx={{ p: 3, pb: 1 }}>
              <Typography variant="h6">
                Historique de mes demandes
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Suivez le traitement par la scolarité et téléchargez le document dès qu&apos;il est prêt.
              </Typography>
            </Box>
            <Divider />
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: 'grey.50' }}>
                  <TableRow>
                    <TableCell><strong>Date</strong></TableCell>
                    <TableCell><strong>Type de demande</strong></TableCell>
                    <TableCell><strong>Motif</strong></TableCell>
                    <TableCell><strong>Statut</strong></TableCell>
                    <TableCell align="right"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {requests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">Vous n&apos;avez aucune demande en cours.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : requests.map((requestItem) => (
                    <TableRow key={requestItem.id} hover>
                      <TableCell>{new Date(requestItem.created_at).toLocaleDateString('fr-FR')}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {requestItem.details?.title || requestItem.request_type}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 320 }}>
                        <Typography variant="body2" noWrap title={requestItem.details?.reason}>
                          {requestItem.details?.reason || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>{renderStatus(requestItem.status)}</TableCell>
                      <TableCell align="right">
                        {requestItem.document?.file_path && (
                          <Tooltip title="Télécharger le document">
                            <IconButton color="secondary" onClick={() => handleDownloadRequestDocument(requestItem)}>
                              <DownloadIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Informations de suivi">
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
        </>
      )}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nouvelle demande administrative</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Alert severity="info">
              Les documents immédiatement générables restent accessibles ci-dessus. Utilisez ce formulaire pour les documents soumis à validation ou dépôt manuel.
            </Alert>

            <TextField
              select
              fullWidth
              label="Type de document / demande"
              value={newRequest.key}
              onChange={(event) => setNewRequest((prev) => ({ ...prev, key: event.target.value }))}
            >
              {REQUEST_OPTIONS.map((requestOption) => (
                <MenuItem key={requestOption.key} value={requestOption.key}>
                  {requestOption.label}
                </MenuItem>
              ))}
            </TextField>

            <Typography variant="body2" color="text.secondary">
              {REQUEST_BY_KEY[newRequest.key]?.description}
            </Typography>

            <TextField
              select
              fullWidth
              label="Priorité"
              value={newRequest.priority}
              onChange={(event) => setNewRequest((prev) => ({ ...prev, priority: event.target.value }))}
            >
              <MenuItem value="low">Basse</MenuItem>
              <MenuItem value="normal">Normale</MenuItem>
              <MenuItem value="high">Haute</MenuItem>
              <MenuItem value="urgent">Urgente</MenuItem>
            </TextField>

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Précisions / Motif de la demande"
              placeholder="Ex: dossier de stage, concours, renouvellement, besoin de duplicata, etc."
              value={newRequest.reason}
              onChange={(event) => setNewRequest((prev) => ({ ...prev, reason: event.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenDialog(false)} disabled={submitting}>Annuler</Button>
          <Button
            variant="contained"
            onClick={handleCreateRequest}
            disabled={submitting || !newRequest.reason.trim()}
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
