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
  FormControlLabel,
  IconButton,
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
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Preview as PreviewIcon,
} from '@mui/icons-material';
import {
  createDocumentTemplate,
  deleteDocumentTemplate,
  getDocumentTemplates,
  updateDocumentTemplate,
} from '@/api/admin';
import { useAuth } from '../../hooks/useAuth';

const TEMPLATE_TYPES = [
  { value: 'certificate', label: 'Certificat de scolarité' },
  { value: 'attestation', label: 'Attestation' },
  { value: 'transcript', label: 'Relevé de notes' },
  { value: 'other', label: 'Autre document' },
];

const getTypeLabel = (type) => TEMPLATE_TYPES.find((item) => item.value === type)?.label || type;
const getTypeColor = (type) => (
  type === 'certificate' ? 'success'
    : type === 'attestation' ? 'info'
      : type === 'transcript' ? 'warning'
        : 'default'
);

const createEmptyForm = () => ({
  name: '',
  description: '',
  type: 'certificate',
  template_path: '',
  requires_signature: true,
  required_fields: '',
});

export default function DocumentTemplatesPage() {
  const { authState } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState(createEmptyForm());
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError('');
      const { data, error: fetchError } = await getDocumentTemplates();
      if (fetchError) {
        throw fetchError;
      }
      setTemplates(data || []);
    } catch (err) {
      console.error('fetchTemplates:', err);
      setError('Erreur lors du chargement des modèles de documents.');
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return templates.filter((template) => !query
      || template.name?.toLowerCase().includes(query)
      || template.description?.toLowerCase().includes(query)
      || template.type?.toLowerCase().includes(query));
  }, [searchQuery, templates]);

  const openCreateDialog = () => {
    setEditingTemplate(null);
    setFormData(createEmptyForm());
    setFormOpen(true);
  };

  const openEditDialog = (template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name || '',
      description: template.description || '',
      type: template.type || 'certificate',
      template_path: template.template_path || '',
      requires_signature: template.requires_signature !== false,
      required_fields: Array.isArray(template.required_fields) ? template.required_fields.join(', ') : '',
    });
    setFormOpen(true);
  };

  const parseRequiredFields = (value) => (
    `${value || ''}`
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)
  );

  const handleSave = async () => {
    try {
      if (!formData.name.trim()) {
        setError('Le nom du modèle est obligatoire.');
        return;
      }

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        type: formData.type,
        template_path: formData.template_path.trim() || null,
        requires_signature: formData.requires_signature,
        required_fields: parseRequiredFields(formData.required_fields),
        created_by: authState.profile?.id || authState.user?.id || null,
      };

      setLoading(true);
      setError('');

      const response = editingTemplate
        ? await updateDocumentTemplate(editingTemplate.id, payload)
        : await createDocumentTemplate(payload);

      if (response.error) {
        throw response.error;
      }

      setSuccess(editingTemplate ? 'Modèle mis à jour.' : 'Modèle créé.');
      setFormOpen(false);
      await fetchTemplates();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('handleSave template:', err);
      setError(`Erreur lors de la sauvegarde: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      if (!deleteConfirm) {
        return;
      }

      setLoading(true);
      const { error: deleteError } = await deleteDocumentTemplate(deleteConfirm.id);
      if (deleteError) {
        throw deleteError;
      }

      setSuccess('Modèle supprimé.');
      setDeleteConfirm(null);
      await fetchTemplates();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('handleDelete template:', err);
      setError(`Erreur lors de la suppression: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (template) => {
    const content = JSON.stringify({
      name: template.name,
      description: template.description,
      type: template.type,
      template_path: template.template_path,
      requires_signature: template.requires_signature,
      required_fields: template.required_fields,
    }, null, 2);

    const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${template.name.replace(/\s+/g, '_').toLowerCase()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardHeader
          title="Modèles de documents officiels"
          subheader="Configurer les modèles utilisés pour les certificats, relevés et attestations"
          action={(
            <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog}>
              Nouveau modèle
            </Button>
          )}
        />
        <CardContent>
          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          <TextField
            fullWidth
            size="small"
            placeholder="Rechercher par nom, type ou description..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            sx={{ mb: 3 }}
          />

          {loading && !templates.length ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell><strong>Nom</strong></TableCell>
                    <TableCell><strong>Type</strong></TableCell>
                    <TableCell><strong>Signature</strong></TableCell>
                    <TableCell><strong>Champs requis</strong></TableCell>
                    <TableCell><strong>Template path</strong></TableCell>
                    <TableCell align="right"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTemplates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">Aucun modèle trouvé.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : filteredTemplates.map((template) => (
                    <TableRow key={template.id} hover>
                      <TableCell>
                        <Typography fontWeight={600}>{template.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {template.description || 'Sans description'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={getTypeLabel(template.type)} size="small" color={getTypeColor(template.type)} variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={template.requires_signature ? 'Signature requise' : 'Sans signature'}
                          size="small"
                          color={template.requires_signature ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {(template.required_fields || []).length ? template.required_fields.join(', ') : 'Aucun'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{template.template_path || '-'}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <IconButton size="small" onClick={() => setPreviewTemplate(template)} title="Aperçu">
                            <PreviewIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleDownload(template)} title="Exporter">
                            <DownloadIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => openEditDialog(template)} title="Modifier">
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => setDeleteConfirm(template)} title="Supprimer">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
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

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingTemplate ? 'Modifier le modèle' : 'Créer un modèle'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Nom du modèle" value={formData.name} onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))} />
            <TextField label="Description" value={formData.description} onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))} multiline minRows={2} />
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select value={formData.type} label="Type" onChange={(event) => setFormData((prev) => ({ ...prev, type: event.target.value }))}>
                {TEMPLATE_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Chemin du template"
              placeholder="ex: templates/certificat-scolarite.docx"
              value={formData.template_path}
              onChange={(event) => setFormData((prev) => ({ ...prev, template_path: event.target.value }))}
            />
            <TextField
              label="Champs requis"
              placeholder="semester, academic_year, purpose"
              helperText="Séparer les champs par des virgules."
              value={formData.required_fields}
              onChange={(event) => setFormData((prev) => ({ ...prev, required_fields: event.target.value }))}
            />
            <FormControlLabel
              control={(
                <Switch
                  checked={formData.requires_signature}
                  onChange={(event) => setFormData((prev) => ({ ...prev, requires_signature: event.target.checked }))}
                />
              )}
              label="Signature institutionnelle requise"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleSave} disabled={loading}>
            {editingTemplate ? 'Enregistrer' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(previewTemplate)} onClose={() => setPreviewTemplate(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Aperçu du modèle</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {previewTemplate && (
            <Stack spacing={2}>
              <Typography variant="h6">{previewTemplate.name}</Typography>
              <Typography variant="body2" color="text.secondary">{previewTemplate.description || 'Sans description'}</Typography>
              <Chip label={getTypeLabel(previewTemplate.type)} size="small" color={getTypeColor(previewTemplate.type)} variant="outlined" sx={{ width: 'fit-content' }} />
              <Typography variant="body2"><strong>Template path:</strong> {previewTemplate.template_path || '-'}</Typography>
              <Typography variant="body2"><strong>Signature requise:</strong> {previewTemplate.requires_signature ? 'Oui' : 'Non'}</Typography>
              <Typography variant="body2"><strong>Champs requis:</strong> {(previewTemplate.required_fields || []).join(', ') || 'Aucun'}</Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewTemplate(null)}>Fermer</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleteConfirm)} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Supprimer le modèle</DialogTitle>
        <DialogContent>
          <Typography>Supprimer « {deleteConfirm?.name} » ?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Annuler</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={loading}>
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
