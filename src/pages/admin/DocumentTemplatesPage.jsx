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
  TextareaAutosize,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Preview as PreviewIcon,
  Add as AddIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { supabase } from '@/supabase';
import { useAuth } from '../../hooks/useAuth';

const DOCUMENT_TYPES = [
  { value: 'report_card', label: 'Bulletin semestriel' },
  { value: 'transcript', label: 'Relevé de notes' },
  { value: 'certificate', label: 'Certificat de scolarité' },
  { value: 'diploma', label: 'Diplôme' },
  { value: 'enrollment', label: 'Attestation d\'inscription' },
  { value: 'absence_letter', label: 'Certificat d\'absence' },
];

export default function DocumentTemplatesPage() {
  const { authState } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formDialog, setFormDialog] = useState(false);
  const [previewDialog, setPreviewDialog] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    document_type: 'report_card',
    template_content: '',
    is_active: true,
    version: 1,
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('document_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setTemplates(data || []);
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError('Erreur lors du chargement des modèles');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      document_type: 'report_card',
      template_content: '',
      is_active: true,
      version: 1,
    });
    setFormDialog(true);
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name || '',
      document_type: template.document_type || 'report_card',
      template_content: template.template_content || '',
      is_active: template.is_active ?? true,
      version: (template.version || 0) + 1,
    });
    setFormDialog(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.name.trim()) {
        setError('Le nom du modèle est requis');
        return;
      }
      if (!formData.template_content.trim()) {
        setError('Le contenu du modèle est requis');
        return;
      }

      setLoading(true);
      setError(null);

      if (editingTemplate) {
        const { error: updateError } = await supabase
          .from('document_templates')
          .update({
            name: formData.name,
            document_type: formData.document_type,
            template_content: formData.template_content,
            is_active: formData.is_active,
            version: formData.version,
            updated_by: authState.user?.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingTemplate.id);

        if (updateError) throw updateError;
        setSuccess('Modèle mis à jour avec succès');
      } else {
        const { error: insertError } = await supabase
          .from('document_templates')
          .insert([
            {
              name: formData.name,
              document_type: formData.document_type,
              template_content: formData.template_content,
              is_active: formData.is_active,
              version: formData.version,
              created_by: authState.user?.id,
              created_at: new Date().toISOString(),
            },
          ]);

        if (insertError) throw insertError;
        setSuccess('Modèle créé avec succès');
      }

      setFormDialog(false);
      fetchTemplates();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error saving template:', err);
      setError('Erreur lors de la sauvegarde du modèle');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('document_templates')
        .delete()
        .eq('id', deleteConfirm.id);

      if (deleteError) throw deleteError;

      setSuccess('Modèle supprimé avec succès');
      setDeleteConfirm(null);
      fetchTemplates();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error deleting template:', err);
      setError('Erreur lors de la suppression du modèle');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = (template) => {
    setPreviewContent(template.template_content);
    setPreviewDialog(true);
  };

  const handleDownload = (template) => {
    const element = document.createElement('a');
    const file = new Blob([template.template_content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${template.name}_v${template.version}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const filteredTemplates = templates.filter((t) =>
    t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.document_type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTypeLabel = (type) => {
    return DOCUMENT_TYPES.find((t) => t.value === type)?.label || type;
  };

  const getTypeColor = (type) => {
    const colors = {
      report_card: 'primary',
      transcript: 'info',
      certificate: 'success',
      diploma: 'warning',
      enrollment: 'secondary',
      absence_letter: 'error',
    };
    return colors[type] || 'default';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardHeader
          title="Modèles de Documents Officiels"
          subheader="Gérer les modèles de documents générés automatiquement"
          action={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddNew}
              disabled={loading}
            >
              Nouveau modèle
            </Button>
          }
        />
        <CardContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          <TextField
            fullWidth
            placeholder="Rechercher par nom ou type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ mb: 2 }}
            size="small"
          />

          {loading && !templates.length ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell>Nom du modèle</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell align="center">Version</TableCell>
                    <TableCell align="center">Statut</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTemplates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                        <Typography color="textSecondary">
                          Aucun modèle trouvé
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTemplates.map((template) => (
                      <TableRow key={template.id} hover>
                        <TableCell sx={{ fontWeight: 500 }}>{template.name}</TableCell>
                        <TableCell>
                          <Chip
                            label={getTypeLabel(template.document_type)}
                            color={getTypeColor(template.document_type)}
                            variant="outlined"
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">v{template.version}</TableCell>
                        <TableCell align="center">
                          <Chip
                            label={template.is_active ? 'Actif' : 'Inactif'}
                            color={template.is_active ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            <IconButton
                              size="small"
                              onClick={() => handlePreview(template)}
                              title="Aperçu"
                            >
                              <PreviewIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDownload(template)}
                              title="Télécharger"
                            >
                              <DownloadIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(template)}
                              title="Modifier"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => setDeleteConfirm(template)}
                              title="Supprimer"
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
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

      {/* Form Dialog */}
      <Dialog open={formDialog} onClose={() => setFormDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingTemplate ? 'Modifier le modèle' : 'Créer un nouveau modèle'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            fullWidth
            label="Nom du modèle"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <FormControl fullWidth>
            <InputLabel>Type de document</InputLabel>
            <Select
              value={formData.document_type}
              label="Type de document"
              onChange={(e) => setFormData({ ...formData, document_type: e.target.value })}
            >
              {DOCUMENT_TYPES.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Contenu du modèle (utilisez {'{{'} et {'}}'} pour les variables)
          </Typography>
          <TextareaAutosize
            minRows={8}
            value={formData.template_content}
            onChange={(e) => setFormData({ ...formData, template_content: e.target.value })}
            placeholder="Ex: Bulletin semestriel de {{student_name}} pour {{semester}}"
            style={{
              fontFamily: 'monospace',
              fontSize: '13px',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ccc',
            }}
          />
          <FormControl fullWidth size="small">
            <InputLabel>Statut</InputLabel>
            <Select
              value={formData.is_active ? 'true' : 'false'}
              label="Statut"
              onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
            >
              <MenuItem value="true">Actif</MenuItem>
              <MenuItem value="false">Inactif</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormDialog(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleSave} disabled={loading}>
            {editingTemplate ? 'Mettre à jour' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialog} onClose={() => setPreviewDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Aperçu du modèle
          <IconButton
            onClick={() => setPreviewDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography
            component="pre"
            sx={{
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              fontFamily: 'monospace',
              fontSize: '12px',
              p: 2,
              backgroundColor: '#f5f5f5',
              borderRadius: '4px',
              maxHeight: '400px',
              overflow: 'auto',
            }}
          >
            {previewContent}
          </Typography>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer le modèle "{deleteConfirm?.name}" ?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Annuler</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={loading}
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
