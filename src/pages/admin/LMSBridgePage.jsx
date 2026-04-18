import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Hub as HubIcon,
  Sync as SyncIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';
import {
  createConnector,
  createCourseLink,
  deleteConnector,
  deleteCourseLink,
  getLmsBridgeDashboard,
  queueSyncRun,
  updateConnector,
  updateCourseLink
} from '@/api/lmsBridge';

const PROVIDER_OPTIONS = [
  { value: 'moodle', label: 'Moodle' },
  { value: 'lti', label: 'LTI 1.3' },
  { value: 'scorm', label: 'SCORM' },
  { value: 'h5p', label: 'H5P' },
  { value: 'custom', label: 'Connecteur custom' }
];

const AUTH_TYPE_OPTIONS = [
  { value: 'token', label: 'Token' },
  { value: 'oauth2', label: 'OAuth 2.0' },
  { value: 'lti13', label: 'LTI 1.3' },
  { value: 'basic', label: 'Basic' },
  { value: 'none', label: 'Aucune auth' }
];

const CONNECTOR_STATUS_OPTIONS = [
  { value: 'active', label: 'Actif' },
  { value: 'paused', label: 'En pause' },
  { value: 'error', label: 'Erreur' },
  { value: 'disabled', label: 'Désactivé' }
];

const DIRECTION_OPTIONS = [
  { value: 'pull', label: 'Pull ESGIS <- LMS' },
  { value: 'push', label: 'Push ESGIS -> LMS' },
  { value: 'bidirectional', label: 'Bidirectionnel' }
];

const SYNC_TYPE_OPTIONS = [
  { value: 'full', label: 'Synchronisation complète' },
  { value: 'courses', label: 'Cours' },
  { value: 'users', label: 'Utilisateurs' },
  { value: 'activities', label: 'Activités' },
  { value: 'grades', label: 'Notes' },
  { value: 'enrolments', label: 'Inscriptions' }
];

const emptyConnectorForm = () => ({
  id: null,
  provider: 'moodle',
  name: '',
  base_url: '',
  auth_type: 'token',
  status: 'active',
  secret_ref: '',
  capabilitiesText: JSON.stringify(
    {
      courses: true,
      users: true,
      grades: true,
      activities: true,
      lti: true
    },
    null,
    2
  ),
  settingsText: JSON.stringify(
    {
      service: 'moodle_mobile_app',
      timeout_seconds: 30
    },
    null,
    2
  )
});

const emptyCourseLinkForm = (connectorId = '') => ({
  id: null,
  connector_id: connectorId,
  course_id: '',
  external_course_id: '',
  external_course_shortname: '',
  external_category_id: '',
  sync_direction: 'bidirectional',
  sync_enabled: true,
  metadataText: JSON.stringify(
    {
      moodle_format: 'topics'
    },
    null,
    2
  )
});

const emptySyncForm = (connectorId = '') => ({
  connector_id: connectorId,
  sync_type: 'full',
  direction: 'bidirectional',
  detailsText: JSON.stringify(
    {
      source: 'admin_console',
      priority: 'normal'
    },
    null,
    2
  )
});

const parseJsonText = (value, fieldLabel, fallback = {}) => {
  if (!value || !value.trim()) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch (_error) {
    throw new Error(`${fieldLabel} doit contenir un JSON valide.`);
  }
};

const formatDateTime = (value) => {
  if (!value) {
    return '-';
  }

  try {
    return format(new Date(value), 'dd/MM/yyyy HH:mm', { locale: fr });
  } catch (_error) {
    return '-';
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'active':
    case 'completed':
      return 'success';
    case 'paused':
    case 'queued':
    case 'running':
    case 'partial':
      return 'warning';
    case 'error':
    case 'failed':
    case 'disabled':
      return 'error';
    default:
      return 'default';
  }
};

const renderEmptyRow = (message, colSpan) => (
  <TableRow>
    <TableCell colSpan={colSpan} align="center" sx={{ py: 4, color: 'text.secondary' }}>
      {message}
    </TableCell>
  </TableRow>
);

const LMSBridgePage = () => {
  const { authState } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [connectors, setConnectors] = useState([]);
  const [courseLinks, setCourseLinks] = useState([]);
  const [syncRuns, setSyncRuns] = useState([]);
  const [courses, setCourses] = useState([]);

  const [connectorDialogOpen, setConnectorDialogOpen] = useState(false);
  const [connectorForm, setConnectorForm] = useState(emptyConnectorForm());

  const [courseLinkDialogOpen, setCourseLinkDialogOpen] = useState(false);
  const [courseLinkForm, setCourseLinkForm] = useState(emptyCourseLinkForm());

  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [syncForm, setSyncForm] = useState(emptySyncForm());

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error: loadError } = await getLmsBridgeDashboard();

      if (loadError) {
        throw loadError;
      }

      setConnectors(data.connectors || []);
      setCourseLinks(data.courseLinks || []);
      setSyncRuns(data.syncRuns || []);
      setCourses(data.courses || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Impossible de charger la passerelle LMS.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const sortedCourses = useMemo(
    () =>
      [...courses].sort((left, right) =>
        `${left.code || ''} ${left.name || ''}`.localeCompare(`${right.code || ''} ${right.name || ''}`, 'fr')
      ),
    [courses]
  );

  const stats = useMemo(() => {
    const activeConnectors = connectors.filter((connector) => connector.status === 'active').length;
    const syncEnabledLinks = courseLinks.filter((link) => link.sync_enabled).length;
    const queuedRuns = syncRuns.filter((run) => ['queued', 'running'].includes(run.status)).length;
    const failingRuns = syncRuns.filter((run) => ['failed', 'error'].includes(run.status)).length;

    return {
      connectors: connectors.length,
      activeConnectors,
      syncEnabledLinks,
      queuedRuns,
      failingRuns
    };
  }, [connectors, courseLinks, syncRuns]);

  const getConnectorName = (connectorId) =>
    connectors.find((connector) => connector.id === connectorId)?.name || 'Connecteur inconnu';

  const getCourseLabel = (course) => {
    if (!course) {
      return '-';
    }

    const scope = [course.code, course.name].filter(Boolean).join(' - ');
    const suffix = [course.level, course.department?.code || course.department?.name].filter(Boolean).join(' / ');

    return [scope, suffix].filter(Boolean).join(' | ');
  };

  const openCreateConnectorDialog = () => {
    setConnectorForm(emptyConnectorForm());
    setConnectorDialogOpen(true);
    setError(null);
  };

  const openEditConnectorDialog = (connector) => {
    setConnectorForm({
      id: connector.id,
      provider: connector.provider || 'moodle',
      name: connector.name || '',
      base_url: connector.base_url || '',
      auth_type: connector.auth_type || 'token',
      status: connector.status || 'active',
      secret_ref: connector.secret_ref || '',
      capabilitiesText: JSON.stringify(connector.capabilities || {}, null, 2),
      settingsText: JSON.stringify(connector.settings || {}, null, 2)
    });
    setConnectorDialogOpen(true);
    setError(null);
  };

  const openCreateCourseLinkDialog = (connectorId = '') => {
    setCourseLinkForm(emptyCourseLinkForm(connectorId || connectors[0]?.id || ''));
    setCourseLinkDialogOpen(true);
    setError(null);
  };

  const openEditCourseLinkDialog = (link) => {
    setCourseLinkForm({
      id: link.id,
      connector_id: link.connector_id || '',
      course_id: link.course_id || '',
      external_course_id: link.external_course_id || '',
      external_course_shortname: link.external_course_shortname || '',
      external_category_id: link.external_category_id || '',
      sync_direction: link.sync_direction || 'bidirectional',
      sync_enabled: link.sync_enabled ?? true,
      metadataText: JSON.stringify(link.metadata || {}, null, 2)
    });
    setCourseLinkDialogOpen(true);
    setError(null);
  };

  const openSyncDialog = (connectorId = '') => {
    setSyncForm(emptySyncForm(connectorId || connectors[0]?.id || ''));
    setSyncDialogOpen(true);
    setError(null);
  };

  const handleConnectorSubmit = async () => {
    if (!connectorForm.name.trim()) {
      setError('Le nom du connecteur est obligatoire.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        provider: connectorForm.provider,
        name: connectorForm.name,
        base_url: connectorForm.base_url,
        auth_type: connectorForm.auth_type,
        status: connectorForm.status,
        secret_ref: connectorForm.secret_ref,
        capabilities: parseJsonText(connectorForm.capabilitiesText, 'Capacités'),
        settings: parseJsonText(connectorForm.settingsText, 'Paramètres'),
        created_by: authState.user?.id || null
      };

      const response = connectorForm.id
        ? await updateConnector(connectorForm.id, payload)
        : await createConnector(payload);

      if (response.error) {
        throw response.error;
      }

      setSuccess(
        connectorForm.id
          ? 'Connecteur LMS mis à jour.'
          : 'Connecteur LMS ajouté.'
      );
      setConnectorDialogOpen(false);
      await loadData();
    } catch (err) {
      setError(err.message || 'Impossible d’enregistrer le connecteur.');
    } finally {
      setSaving(false);
    }
  };

  const handleCourseLinkSubmit = async () => {
    if (!courseLinkForm.connector_id || !courseLinkForm.course_id || !courseLinkForm.external_course_id.trim()) {
      setError('Le connecteur, le cours ESGIS et l’identifiant de cours externe sont obligatoires.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        connector_id: courseLinkForm.connector_id,
        course_id: courseLinkForm.course_id,
        external_course_id: courseLinkForm.external_course_id,
        external_course_shortname: courseLinkForm.external_course_shortname,
        external_category_id: courseLinkForm.external_category_id,
        sync_direction: courseLinkForm.sync_direction,
        sync_enabled: courseLinkForm.sync_enabled,
        metadata: parseJsonText(courseLinkForm.metadataText, 'Métadonnées', {})
      };

      const response = courseLinkForm.id
        ? await updateCourseLink(courseLinkForm.id, payload)
        : await createCourseLink(payload);

      if (response.error) {
        throw response.error;
      }

      setSuccess(
        courseLinkForm.id
          ? 'Mapping de cours mis à jour.'
          : 'Mapping de cours ajouté.'
      );
      setCourseLinkDialogOpen(false);
      await loadData();
    } catch (err) {
      setError(err.message || 'Impossible d’enregistrer le mapping de cours.');
    } finally {
      setSaving(false);
    }
  };

  const handleQueueSyncSubmit = async () => {
    if (!syncForm.connector_id) {
      setError('Sélectionnez un connecteur à synchroniser.');
      return;
    }

    setSaving(true);
    try {
      const { error: queueError } = await queueSyncRun({
        connector_id: syncForm.connector_id,
        sync_type: syncForm.sync_type,
        direction: syncForm.direction,
        details: parseJsonText(syncForm.detailsText, 'Détails de synchro', {}),
        initiated_by: authState.user?.id || null
      });

      if (queueError) {
        throw queueError;
      }

      setSuccess('Synchronisation ajoutée à la file.');
      setSyncDialogOpen(false);
      await loadData();
    } catch (err) {
      setError(err.message || 'Impossible de planifier la synchronisation.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConnector = async (connector) => {
    if (!window.confirm(`Supprimer le connecteur "${connector.name}" et ses mappings associés ?`)) {
      return;
    }

    setSaving(true);
    try {
      const { error: deleteError } = await deleteConnector(connector.id);

      if (deleteError) {
        throw deleteError;
      }

      setSuccess('Connecteur supprimé.');
      await loadData();
    } catch (err) {
      setError(err.message || 'Impossible de supprimer le connecteur.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCourseLink = async (link) => {
    if (!window.confirm(`Supprimer le mapping du cours "${getCourseLabel(link.course)}" ?`)) {
      return;
    }

    setSaving(true);
    try {
      const { error: deleteError } = await deleteCourseLink(link.id);

      if (deleteError) {
        throw deleteError;
      }

      setSuccess('Mapping supprimé.');
      await loadData();
    } catch (err) {
      setError(err.message || 'Impossible de supprimer le mapping.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          mb: 3
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <HubIcon sx={{ fontSize: 40, color: '#1976d2' }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Intégrations LMS & Moodle
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Connecteurs, mappings de cours, file de synchronisation et base de pont ESGIS Campus vers Moodle.
            </Typography>
          </Box>
        </Box>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <Button variant="outlined" startIcon={<SyncIcon />} onClick={() => openSyncDialog()}>
            Planifier une synchro
          </Button>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={() => openCreateCourseLinkDialog()}>
            Mapper un cours
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateConnectorDialog}>
            Nouveau connecteur
          </Button>
        </Stack>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Cette console prépare le pont Moodle via web services, LTI et synchro bidirectionnelle des cours, activités et notes.
        Les secrets restent référencés par <code>secret_ref</code>, sans stockage brut dans la table.
      </Alert>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Connecteurs
              </Typography>
              <Typography variant="h4">{stats.connectors}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Connecteurs actifs
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.activeConnectors}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Mappings sync actifs
              </Typography>
              <Typography variant="h4" color="primary.main">
                {stats.syncEnabledLinks}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Synchros en file
              </Typography>
              <Typography variant="h4" color="warning.main">
                {stats.queuedRuns}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Erreurs récentes
              </Typography>
              <Typography variant="h4" color="error.main">
                {stats.failingRuns}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Stack spacing={4}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
              Connecteurs configurés
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell sx={{ fontWeight: 700 }}>Nom</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Fournisseur</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Base URL</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Auth</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Statut</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Capacités</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Secret ref</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Dernière synchro</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {connectors.length === 0
                    ? renderEmptyRow('Aucun connecteur LMS configuré.', 9)
                    : connectors.map((connector) => (
                        <TableRow key={connector.id} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{connector.name}</TableCell>
                          <TableCell>{connector.provider}</TableCell>
                          <TableCell sx={{ maxWidth: 260, wordBreak: 'break-word' }}>
                            {connector.base_url || '-'}
                          </TableCell>
                          <TableCell>{connector.auth_type}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={connector.status}
                              color={getStatusColor(connector.status)}
                            />
                          </TableCell>
                          <TableCell sx={{ maxWidth: 260 }}>
                            <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                              {Object.entries(connector.capabilities || {})
                                .filter(([, enabled]) => Boolean(enabled))
                                .map(([capability]) => (
                                  <Chip key={capability} label={capability} size="small" variant="outlined" />
                                ))}
                            </Stack>
                          </TableCell>
                          <TableCell>{connector.secret_ref || '-'}</TableCell>
                          <TableCell>
                            <Typography variant="body2">{formatDateTime(connector.last_sync_at)}</Typography>
                            {connector.last_error && (
                              <Typography variant="caption" color="error.main" sx={{ display: 'block', mt: 0.5 }}>
                                {connector.last_error}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                              <Button size="small" onClick={() => openSyncDialog(connector.id)}>
                                Sync
                              </Button>
                              <Button size="small" onClick={() => openCreateCourseLinkDialog(connector.id)}>
                                Mapper
                              </Button>
                              <Button size="small" onClick={() => openEditConnectorDialog(connector)}>
                                <EditIcon fontSize="small" />
                              </Button>
                              <Button size="small" color="error" onClick={() => handleDeleteConnector(connector)}>
                                <DeleteIcon fontSize="small" />
                              </Button>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
              Mapping ESGIS Campus vers LMS
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell sx={{ fontWeight: 700 }}>Connecteur</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Cours ESGIS</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>ID cours externe</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Shortname</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Direction</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Sync</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Dernier sync</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {courseLinks.length === 0
                    ? renderEmptyRow('Aucun mapping de cours pour le moment.', 8)
                    : courseLinks.map((link) => (
                        <TableRow key={link.id} hover>
                          <TableCell>{link.connector?.name || getConnectorName(link.connector_id)}</TableCell>
                          <TableCell sx={{ maxWidth: 300 }}>{getCourseLabel(link.course)}</TableCell>
                          <TableCell>{link.external_course_id}</TableCell>
                          <TableCell>{link.external_course_shortname || '-'}</TableCell>
                          <TableCell>
                            <Chip size="small" label={link.sync_direction} variant="outlined" />
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={link.sync_enabled ? 'Actif' : 'Off'}
                              color={link.sync_enabled ? 'success' : 'default'}
                            />
                          </TableCell>
                          <TableCell>{formatDateTime(link.last_synced_at)}</TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                              <Button size="small" onClick={() => openEditCourseLinkDialog(link)}>
                                <EditIcon fontSize="small" />
                              </Button>
                              <Button size="small" color="error" onClick={() => handleDeleteCourseLink(link)}>
                                <DeleteIcon fontSize="small" />
                              </Button>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
              File de synchronisation
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell sx={{ fontWeight: 700 }}>Créée le</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Connecteur</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Direction</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Statut</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Compteurs</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Erreur</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {syncRuns.length === 0
                    ? renderEmptyRow('Aucune synchronisation enregistrée.', 7)
                    : syncRuns.map((run) => (
                        <TableRow key={run.id} hover>
                          <TableCell>{formatDateTime(run.created_at)}</TableCell>
                          <TableCell>{run.connector?.name || getConnectorName(run.connector_id)}</TableCell>
                          <TableCell>{run.sync_type}</TableCell>
                          <TableCell>{run.direction}</TableCell>
                          <TableCell>
                            <Chip size="small" label={run.status} color={getStatusColor(run.status)} />
                          </TableCell>
                          <TableCell sx={{ maxWidth: 260 }}>
                            <Typography
                              variant="caption"
                              component="pre"
                              sx={{
                                m: 0,
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                fontFamily: 'monospace'
                              }}
                            >
                              {JSON.stringify(run.counters || {}, null, 2)}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ maxWidth: 260, wordBreak: 'break-word' }}>
                            {run.error_message || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Stack>
      )}

      <Dialog open={connectorDialogOpen} onClose={() => setConnectorDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{connectorForm.id ? 'Modifier le connecteur' : 'Nouveau connecteur LMS'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="connector-provider-label">Fournisseur</InputLabel>
                  <Select
                    labelId="connector-provider-label"
                    label="Fournisseur"
                    value={connectorForm.provider}
                    onChange={(event) => setConnectorForm((prev) => ({ ...prev, provider: event.target.value }))}
                  >
                    {PROVIDER_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Nom du connecteur"
                  value={connectorForm.name}
                  onChange={(event) => setConnectorForm((prev) => ({ ...prev, name: event.target.value }))}
                  fullWidth
                  required
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Base URL"
                  value={connectorForm.base_url}
                  onChange={(event) => setConnectorForm((prev) => ({ ...prev, base_url: event.target.value }))}
                  fullWidth
                  placeholder="https://moodle.exemple.edu"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel id="connector-auth-label">Auth</InputLabel>
                  <Select
                    labelId="connector-auth-label"
                    label="Auth"
                    value={connectorForm.auth_type}
                    onChange={(event) => setConnectorForm((prev) => ({ ...prev, auth_type: event.target.value }))}
                  >
                    {AUTH_TYPE_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel id="connector-status-label">Statut</InputLabel>
                  <Select
                    labelId="connector-status-label"
                    label="Statut"
                    value={connectorForm.status}
                    onChange={(event) => setConnectorForm((prev) => ({ ...prev, status: event.target.value }))}
                  >
                    {CONNECTOR_STATUS_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <TextField
              label="Référence secret"
              value={connectorForm.secret_ref}
              onChange={(event) => setConnectorForm((prev) => ({ ...prev, secret_ref: event.target.value }))}
              fullWidth
              helperText="Référence vault, secret manager ou variable serveur. Aucun secret brut ici."
            />

            <TextField
              label="Capacités (JSON)"
              value={connectorForm.capabilitiesText}
              onChange={(event) => setConnectorForm((prev) => ({ ...prev, capabilitiesText: event.target.value }))}
              fullWidth
              multiline
              minRows={6}
            />

            <TextField
              label="Paramètres (JSON)"
              value={connectorForm.settingsText}
              onChange={(event) => setConnectorForm((prev) => ({ ...prev, settingsText: event.target.value }))}
              fullWidth
              multiline
              minRows={6}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConnectorDialogOpen(false)}>Annuler</Button>
          <Button onClick={handleConnectorSubmit} variant="contained" disabled={saving}>
            {connectorForm.id ? 'Mettre à jour' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={courseLinkDialogOpen} onClose={() => setCourseLinkDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{courseLinkForm.id ? 'Modifier un mapping de cours' : 'Nouveau mapping de cours'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="course-link-connector-label">Connecteur</InputLabel>
                  <Select
                    labelId="course-link-connector-label"
                    label="Connecteur"
                    value={courseLinkForm.connector_id}
                    onChange={(event) => setCourseLinkForm((prev) => ({ ...prev, connector_id: event.target.value }))}
                  >
                    {connectors.map((connector) => (
                      <MenuItem key={connector.id} value={connector.id}>
                        {connector.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="course-link-course-label">Cours ESGIS</InputLabel>
                  <Select
                    labelId="course-link-course-label"
                    label="Cours ESGIS"
                    value={courseLinkForm.course_id}
                    onChange={(event) => setCourseLinkForm((prev) => ({ ...prev, course_id: event.target.value }))}
                  >
                    {sortedCourses.map((course) => (
                      <MenuItem key={course.id} value={course.id}>
                        {getCourseLabel(course)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Identifiant de cours externe"
                  value={courseLinkForm.external_course_id}
                  onChange={(event) =>
                    setCourseLinkForm((prev) => ({ ...prev, external_course_id: event.target.value }))
                  }
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Shortname externe"
                  value={courseLinkForm.external_course_shortname}
                  onChange={(event) =>
                    setCourseLinkForm((prev) => ({ ...prev, external_course_shortname: event.target.value }))
                  }
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Catégorie externe"
                  value={courseLinkForm.external_category_id}
                  onChange={(event) =>
                    setCourseLinkForm((prev) => ({ ...prev, external_category_id: event.target.value }))
                  }
                  fullWidth
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="course-link-direction-label">Direction</InputLabel>
                  <Select
                    labelId="course-link-direction-label"
                    label="Direction"
                    value={courseLinkForm.sync_direction}
                    onChange={(event) => setCourseLinkForm((prev) => ({ ...prev, sync_direction: event.target.value }))}
                  >
                    {DIRECTION_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={courseLinkForm.sync_enabled}
                      onChange={(event) =>
                        setCourseLinkForm((prev) => ({ ...prev, sync_enabled: event.target.checked }))
                      }
                    />
                  }
                  label="Synchronisation activée"
                />
              </Grid>
            </Grid>

            <TextField
              label="Métadonnées (JSON)"
              value={courseLinkForm.metadataText}
              onChange={(event) => setCourseLinkForm((prev) => ({ ...prev, metadataText: event.target.value }))}
              fullWidth
              multiline
              minRows={6}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCourseLinkDialogOpen(false)}>Annuler</Button>
          <Button onClick={handleCourseLinkSubmit} variant="contained" disabled={saving || connectors.length === 0}>
            {courseLinkForm.id ? 'Mettre à jour' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={syncDialogOpen} onClose={() => setSyncDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Planifier une synchronisation</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel id="sync-connector-label">Connecteur</InputLabel>
              <Select
                labelId="sync-connector-label"
                label="Connecteur"
                value={syncForm.connector_id}
                onChange={(event) => setSyncForm((prev) => ({ ...prev, connector_id: event.target.value }))}
              >
                {connectors.map((connector) => (
                  <MenuItem key={connector.id} value={connector.id}>
                    {connector.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="sync-type-label">Type de synchro</InputLabel>
              <Select
                labelId="sync-type-label"
                label="Type de synchro"
                value={syncForm.sync_type}
                onChange={(event) => setSyncForm((prev) => ({ ...prev, sync_type: event.target.value }))}
              >
                {SYNC_TYPE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="sync-direction-label">Direction</InputLabel>
              <Select
                labelId="sync-direction-label"
                label="Direction"
                value={syncForm.direction}
                onChange={(event) => setSyncForm((prev) => ({ ...prev, direction: event.target.value }))}
              >
                {DIRECTION_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Détails de synchro (JSON)"
              value={syncForm.detailsText}
              onChange={(event) => setSyncForm((prev) => ({ ...prev, detailsText: event.target.value }))}
              fullWidth
              multiline
              minRows={6}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSyncDialogOpen(false)}>Annuler</Button>
          <Button onClick={handleQueueSyncSubmit} variant="contained" disabled={saving || connectors.length === 0}>
            Ajouter à la file
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default LMSBridgePage;
