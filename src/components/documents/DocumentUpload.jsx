import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  CircularProgress,
  Alert,
  Stack,
  Paper,
  IconButton
} from '@mui/material';
import { 
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { DOCUMENT_TYPES } from '@/types/documents';

/**
 * Composant pour téléverser un document
 */
const DocumentUpload = ({
  onUpload,
  loading,
  error,
  success,
  courseId,
  groupId,
  courses = [],
  groups = []
}) => {
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: DOCUMENT_TYPES.COURSE,
    course_id: courseId || '',
    group_id: groupId || '',
    is_public: false
  });

  // Gérer le changement de fichier
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Préremplir le titre avec le nom du fichier sans extension
      const fileName = selectedFile.name.split('.').slice(0, -1).join('.');
      setFormData(prev => ({
        ...prev,
        title: prev.title || fileName
      }));
    }
  };

  // Gérer la suppression du fichier
  const handleRemoveFile = () => {
    setFile(null);
  };

  // Gérer le changement des champs du formulaire
  const handleChange = (event) => {
    const { name, value, checked } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'is_public' ? checked : value
    }));
  };

  // Gérer la soumission du formulaire
  const handleSubmit = (event) => {
    event.preventDefault();
    if (!file) return;

    const fileType = file.name.split('.').pop().toLowerCase();
    const fileSize = file.size;

    const documentData = {
      ...formData,
      file_name: file.name,
      file_type: fileType,
      file_size: fileSize
    };

    onUpload(file, documentData);
  };

  // Formater la taille du fichier
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" component="h2" gutterBottom>
          Téléverser un document
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Document téléversé avec succès !
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            {/* Zone de dépôt de fichier */}
            <Box>
              {!file ? (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: 'background.default',
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                  component="label"
                >
                  <input
                    type="file"
                    hidden
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.jpg,.jpeg,.png"
                  />
                  <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                  <Typography variant="body1" gutterBottom>
                    Cliquez ou déposez un fichier ici
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    PDF, Word, Excel, PowerPoint, Images, Archives (max 10MB)
                  </Typography>
                </Paper>
              ) : (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <DescriptionIcon sx={{ mr: 2, color: 'primary.main' }} />
                    <Box>
                      <Typography variant="body1">{file.name}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {formatFileSize(file.size)}
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton onClick={handleRemoveFile} size="small">
                    <DeleteIcon />
                  </IconButton>
                </Paper>
              )}
            </Box>

            {/* Informations du document */}
            <TextField
              label="Titre"
              name="title"
              value={formData.title}
              onChange={handleChange}
              fullWidth
              required
            />

            <TextField
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              fullWidth
              multiline
              rows={3}
            />

            <FormControl fullWidth>
              <InputLabel>Type de document</InputLabel>
              <Select
                name="type"
                value={formData.type}
                onChange={handleChange}
                label="Type de document"
              >
                <MenuItem value={DOCUMENT_TYPES.COURSE}>Cours</MenuItem>
                <MenuItem value={DOCUMENT_TYPES.TP}>TP</MenuItem>
                <MenuItem value={DOCUMENT_TYPES.EXAM}>Examen</MenuItem>
                <MenuItem value={DOCUMENT_TYPES.CERTIFICATE}>Certificat</MenuItem>
                <MenuItem value={DOCUMENT_TYPES.ATTESTATION}>Attestation</MenuItem>
                <MenuItem value={DOCUMENT_TYPES.OTHER}>Autre</MenuItem>
              </Select>
            </FormControl>

            {courses.length > 0 && (
              <FormControl fullWidth>
                <InputLabel>Cours associé</InputLabel>
                <Select
                  name="course_id"
                  value={formData.course_id}
                  onChange={handleChange}
                  label="Cours associé"
                  disabled={!!courseId}
                >
                  <MenuItem value="">Aucun</MenuItem>
                  {courses.map((course) => (
                    <MenuItem key={course.id} value={course.id}>
                      {course.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {groups.length > 0 && (
              <FormControl fullWidth>
                <InputLabel>Groupe associé</InputLabel>
                <Select
                  name="group_id"
                  value={formData.group_id}
                  onChange={handleChange}
                  label="Groupe associé"
                  disabled={!!groupId}
                >
                  <MenuItem value="">Aucun</MenuItem>
                  {groups.map((group) => (
                    <MenuItem key={group.id} value={group.id}>
                      {group.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <FormControlLabel
              control={
                <Switch
                  name="is_public"
                  checked={formData.is_public}
                  onChange={handleChange}
                  color="primary"
                />
              }
              label="Document public (accessible à tous)"
            />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={!file || loading}
              startIcon={loading ? <CircularProgress size={24} /> : null}
            >
              {loading ? 'Téléversement en cours...' : 'Téléverser'}
            </Button>
          </Stack>
        </form>
      </CardContent>
    </Card>
  );
};

DocumentUpload.propTypes = {
  onUpload: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string,
  success: PropTypes.bool,
  courseId: PropTypes.string,
  groupId: PropTypes.string,
  courses: PropTypes.array,
  groups: PropTypes.array
};

export default DocumentUpload;
