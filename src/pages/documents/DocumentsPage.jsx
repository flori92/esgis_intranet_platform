import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import {
  Archive as ArchiveIcon,
  CloudDownload as CloudDownloadIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Description as DescriptionIcon,
  FilterList as FilterListIcon,
  Image as ImageIcon,
  InsertDriveFile as InsertDriveFileIcon,
  Movie as VideoIcon,
  PictureAsPdf as PdfIcon,
  School as SchoolIcon,
  Search as SearchIcon
} from '@mui/icons-material';

import { useAuth } from '@/context/AuthContext';
import {
  createDocumentDownloadUrl,
  deleteUploadedDocument,
  getDocumentsPageData,
  uploadDocument
} from '@/api/documents';
import { triggerDownload } from '@/utils/DownloadLinkUtil';

const uploadInitialState = {
  title: '',
  description: '',
  visibility: 'course',
  course_id: '',
  file: null,
  tags: []
};

const DocumentsPage = () => {
  const { authState } = useAuth();

  const currentProfileId = authState.profile?.id || authState.user?.id || '';
  const currentStudentId = authState.student?.id || null;
  const currentProfessorId = authState.professor?.id || null;

  const canUploadDocuments = authState.isProfessor || authState.isAdmin;
  const canViewOfficialDocuments = authState.isStudent || authState.isAdmin;

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedVisibility, setSelectedVisibility] = useState('all');
  const [selectedTag, setSelectedTag] = useState('all');
  const [courses, setCourses] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [generatedDocuments, setGeneratedDocuments] = useState([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadData, setUploadData] = useState(uploadInitialState);
  const [tagInput, setTagInput] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const tabs = useMemo(() => {
    const baseTabs = [
      { value: 'all', label: 'Tous' },
      { value: 'course', label: 'Documents de cours' },
      { value: 'administrative', label: 'Administratifs' }
    ];

    if (canViewOfficialDocuments) {
      baseTabs.push({ value: 'official', label: 'Documents officiels' });
    }

    return baseTabs;
  }, [canViewOfficialDocuments]);

  const availableTags = useMemo(() => {
    const tags = new Set();
    documents.forEach((document) => {
      (document.tags || []).forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort((left, right) => left.localeCompare(right));
  }, [documents]);

  const combinedItems = useMemo(() => {
    const uploadedItems = documents.map((document) => ({
      ...document,
      source: 'uploaded'
    }));

    const officialItems = generatedDocuments.map((document) => ({
      ...document,
      source: 'generated'
    }));

    return [...officialItems, ...uploadedItems].sort((left, right) => (
      new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
    ));
  }, [documents, generatedDocuments]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return combinedItems.filter((item) => {
      const searchableContent = [
        item.title,
        item.description,
        item.course_name,
        item.template_name,
        item.student_name,
        ...(item.tags || [])
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      if (query && !searchableContent.includes(query)) {
        return false;
      }

      if (selectedCourse !== 'all' && item.source === 'uploaded' && item.course_id !== Number(selectedCourse)) {
        return false;
      }

      if (selectedVisibility !== 'all' && item.source === 'uploaded' && item.visibility !== selectedVisibility) {
        return false;
      }

      if (selectedTag !== 'all' && item.source === 'uploaded' && !(item.tags || []).includes(selectedTag)) {
        return false;
      }

      switch (activeTab) {
        case 'course':
          return item.source === 'uploaded' && !!item.course_id;
        case 'administrative':
          return item.source === 'uploaded' && !item.course_id;
        case 'official':
          return item.source === 'generated';
        case 'all':
        default:
          return true;
      }
    });
  }, [activeTab, combinedItems, searchQuery, selectedCourse, selectedTag, selectedVisibility]);

  const formatFileSize = (bytes) => {
    if (!bytes) {
      return 'Taille inconnue';
    }
    if (bytes < 1024) {
      return `${bytes} o`;
    }
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} Ko`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  const formatDate = (dateString) => {
    if (!dateString) {
      return 'Date inconnue';
    }

    try {
      return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(dateString));
    } catch (_error) {
      return dateString;
    }
  };

  const getFileIcon = (fileType) => {
    if (!fileType) {
      return <InsertDriveFileIcon />;
    }
    if (fileType.startsWith('image/')) {
      return <ImageIcon />;
    }
    if (fileType === 'application/pdf') {
      return <PdfIcon />;
    }
    if (fileType.startsWith('video/')) {
      return <VideoIcon />;
    }
    if (fileType.includes('zip') || fileType.includes('rar')) {
      return <ArchiveIcon />;
    }
    return <InsertDriveFileIcon />;
  };

  const getVisibilityLabel = (visibility) => {
    switch (visibility) {
      case 'course':
        return 'Cours';
      case 'department':
        return 'Département';
      case 'public':
        return 'Public';
      default:
        return visibility || 'N/A';
    }
  };

  const getGeneratedStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const loadData = async () => {
    if (!currentProfileId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { courses: courseRows, documents: uploadedRows, generatedDocuments: generatedRows, error: loadError } = await getDocumentsPageData({
        isAdmin: authState.isAdmin,
        isStudent: authState.isStudent,
        isProfessor: authState.isProfessor,
        studentId: currentStudentId,
        profileId: currentProfileId,
        professorId: currentProfessorId,
        canViewOfficialDocuments
      });

      if (loadError) {
        throw loadError;
      }

      setCourses(courseRows);
      setDocuments(uploadedRows);
      setGeneratedDocuments(generatedRows);
    } catch (loadError) {
      console.error('Erreur lors du chargement des documents:', loadError);
      setError(loadError.message || 'Impossible de charger les documents');
      setDocuments([]);
      setGeneratedDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authState.user) {
      return;
    }

    if ((authState.isStudent && !currentStudentId) || (authState.isProfessor && !currentProfessorId)) {
      return;
    }

    loadData();
  }, [authState.user, authState.isStudent, authState.isProfessor, authState.isAdmin, currentProfileId, currentStudentId, currentProfessorId]);

  const handleDownload = async (item) => {
    try {
      const { url, error: downloadError } = await createDocumentDownloadUrl(item.file_path, 60);

      if (downloadError) {
        throw downloadError;
      }

      const filename = item.source === 'generated'
        ? `${item.template_name || item.title || 'document'}.pdf`
        : item.title || 'document';

      triggerDownload({ url, filename });
    } catch (downloadError) {
      console.error('Erreur lors du téléchargement du document:', downloadError);
      setError(downloadError.message || 'Impossible de télécharger le document');
    }
  };

  const handleDelete = async (item) => {
    if (item.source !== 'uploaded') {
      return;
    }

    if (!window.confirm(`Supprimer "${item.title}" ?`)) {
      return;
    }

    try {
      const { success, error: deleteError } = await deleteUploadedDocument(item.id, item.file_path);

      if (!success || deleteError) {
        throw deleteError;
      }

      setDocuments((prevDocuments) => prevDocuments.filter((document) => document.id !== item.id));
      setSuccessMessage('Document supprimé');
    } catch (deleteError) {
      console.error('Erreur lors de la suppression du document:', deleteError);
      setError(deleteError.message || 'Impossible de supprimer le document');
    }
  };

  const resetUploadForm = () => {
    setUploadData(uploadInitialState);
    setTagInput('');
    setUploadProgress(0);
  };

  const closeUploadDialog = () => {
    if (uploading) {
      return;
    }
    setUploadDialogOpen(false);
    resetUploadForm();
  };

  const handleUpload = async () => {
    if (!uploadData.title.trim() || !uploadData.file) {
      setError('Le titre et le fichier sont obligatoires');
      return;
    }

    if (uploadData.visibility === 'course' && !uploadData.course_id) {
      setError('Un cours est obligatoire pour un document de cours');
      return;
    }

    setUploading(true);
    setUploadProgress(10);
    setError(null);

    try {
      const { document: newDocument, error: uploadError } = await uploadDocument({
        title: uploadData.title,
        description: uploadData.description,
        visibility: uploadData.visibility,
        courseId: uploadData.course_id,
        file: uploadData.file,
        uploadedBy: currentProfileId,
        tags: uploadData.tags
      });

      if (uploadError || !newDocument) {
        throw uploadError || new Error('Impossible d’uploader le document');
      }

      setUploadProgress(80);
      setDocuments((prevDocuments) => [newDocument, ...prevDocuments]);
      setUploadProgress(100);
      setSuccessMessage('Document uploadé');
      setUploadDialogOpen(false);
      resetUploadForm();
    } catch (uploadError) {
      console.error('Erreur lors de l’upload du document:', uploadError);
      setError(uploadError.message || 'Impossible d’uploader le document');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const isDeleteAllowed = (item) => (
    item.source === 'uploaded' &&
    (authState.isAdmin || item.uploaded_by === currentProfileId)
  );

  return (
    <Box sx={{ py: 4, px: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Documents
        </Typography>
        {canUploadDocuments && (
          <Button
            variant="contained"
            startIcon={<CloudUploadIcon />}
            onClick={() => setUploadDialogOpen(true)}
          >
            Ajouter un document
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Rechercher un document"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel id="visibility-filter-label">Visibilité</InputLabel>
              <Select
                labelId="visibility-filter-label"
                label="Visibilité"
                value={selectedVisibility}
                onChange={(event) => setSelectedVisibility(event.target.value)}
              >
                <MenuItem value="all">Toutes</MenuItem>
                <MenuItem value="course">Cours</MenuItem>
                <MenuItem value="department">Département</MenuItem>
                <MenuItem value="public">Public</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel id="course-filter-label">Cours</InputLabel>
              <Select
                labelId="course-filter-label"
                label="Cours"
                value={selectedCourse}
                onChange={(event) => setSelectedCourse(event.target.value)}
              >
                <MenuItem value="all">Tous</MenuItem>
                {courses.map((course) => (
                  <MenuItem key={course.id} value={String(course.id)}>
                    {course.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel id="tag-filter-label">Tag</InputLabel>
              <Select
                labelId="tag-filter-label"
                label="Tag"
                value={selectedTag}
                onChange={(event) => setSelectedTag(event.target.value)}
              >
                <MenuItem value="all">Tous</MenuItem>
                {availableTags.map((tag) => (
                  <MenuItem key={tag} value={tag}>
                    {tag}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={() => {
                setSearchQuery('');
                setSelectedCourse('all');
                setSelectedVisibility('all');
                setSelectedTag('all');
              }}
            >
              Réinitialiser
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_event, value) => setActiveTab(value)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {tabs.map((tab) => (
            <Tab key={tab.value} value={tab.value} label={tab.label} />
          ))}
        </Tabs>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : filteredItems.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            Aucun document trouvé
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Ajustez les filtres ou rechargez des documents depuis les modules concernés.
          </Typography>
        </Paper>
      ) : (
        <Paper>
          <List disablePadding>
            {filteredItems.map((item, index) => (
              <React.Fragment key={`${item.source}-${item.id}`}>
                <ListItem
                  secondaryAction={(
                    <Box>
                      <Tooltip title="Télécharger">
                        <IconButton edge="end" onClick={() => handleDownload(item)}>
                          <CloudDownloadIcon />
                        </IconButton>
                      </Tooltip>
                      {isDeleteAllowed(item) && (
                        <Tooltip title="Supprimer">
                          <IconButton edge="end" onClick={() => handleDelete(item)}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  )}
                  sx={{ py: 2 }}
                >
                  <ListItemIcon>
                    {item.source === 'generated' ? <DescriptionIcon /> : getFileIcon(item.file_type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={(
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="subtitle1">
                          {item.title}
                        </Typography>
                        {item.source === 'uploaded' ? (
                          <Chip
                            size="small"
                            icon={item.course_id ? <SchoolIcon /> : undefined}
                            label={getVisibilityLabel(item.visibility)}
                            variant="outlined"
                          />
                        ) : (
                          <Chip
                            size="small"
                            label={item.status}
                            color={getGeneratedStatusColor(item.status)}
                            variant="outlined"
                          />
                        )}
                      </Box>
                    )}
                    secondary={(
                      <Box sx={{ mt: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          {item.description || 'Sans description'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {item.source === 'uploaded'
                            ? `${item.course_name ? `${item.course_name} • ` : ''}${formatFileSize(item.file_size)} • Ajouté le ${formatDate(item.created_at)}`
                            : `${item.template_name} • ${item.student_name} • Généré le ${formatDate(item.created_at)}`}
                        </Typography>
                        {item.tags?.length > 0 && (
                          <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                            {item.tags.map((tag) => (
                              <Chip
                                key={`${item.id}-${tag}`}
                                size="small"
                                label={tag}
                                onClick={() => setSelectedTag(tag)}
                              />
                            ))}
                          </Box>
                        )}
                      </Box>
                    )}
                  />
                </ListItem>
                {index < filteredItems.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}

      <Dialog open={uploadDialogOpen} onClose={closeUploadDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Ajouter un document</DialogTitle>
        <DialogContent>
          <TextField
            label="Titre"
            fullWidth
            required
            margin="normal"
            value={uploadData.title}
            onChange={(event) => setUploadData((prev) => ({ ...prev, title: event.target.value }))}
          />

          <TextField
            label="Description"
            fullWidth
            multiline
            rows={3}
            margin="normal"
            value={uploadData.description}
            onChange={(event) => setUploadData((prev) => ({ ...prev, description: event.target.value }))}
          />

          <FormControl fullWidth margin="normal">
            <InputLabel id="upload-visibility-label">Visibilité</InputLabel>
            <Select
              labelId="upload-visibility-label"
              label="Visibilité"
              value={uploadData.visibility}
              onChange={(event) => setUploadData((prev) => ({
                ...prev,
                visibility: event.target.value,
                course_id: event.target.value === 'course' ? prev.course_id : ''
              }))}
            >
              <MenuItem value="course">Cours</MenuItem>
              <MenuItem value="department">Département</MenuItem>
              <MenuItem value="public">Public</MenuItem>
            </Select>
          </FormControl>

          {uploadData.visibility === 'course' && (
            <FormControl fullWidth margin="normal">
              <InputLabel id="upload-course-label">Cours</InputLabel>
              <Select
                labelId="upload-course-label"
                label="Cours"
                value={uploadData.course_id}
                onChange={(event) => setUploadData((prev) => ({ ...prev, course_id: event.target.value }))}
              >
                {courses.map((course) => (
                  <MenuItem key={course.id} value={String(course.id)}>
                    {course.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, mt: 2 }}>
            <TextField
              label="Ajouter un tag"
              fullWidth
              value={tagInput}
              onChange={(event) => setTagInput(event.target.value)}
            />
            <Button
              variant="outlined"
              onClick={() => {
                const normalizedTag = tagInput.trim();
                if (!normalizedTag || uploadData.tags.includes(normalizedTag)) {
                  return;
                }
                setUploadData((prev) => ({ ...prev, tags: [...prev.tags, normalizedTag] }));
                setTagInput('');
              }}
            >
              Ajouter
            </Button>
          </Box>

          {uploadData.tags.length > 0 && (
            <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {uploadData.tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  onDelete={() => setUploadData((prev) => ({
                    ...prev,
                    tags: prev.tags.filter((item) => item !== tag)
                  }))}
                />
              ))}
            </Box>
          )}

          <Button
            variant="outlined"
            component="label"
            fullWidth
            startIcon={<CloudUploadIcon />}
            sx={{ mt: 3 }}
          >
            Sélectionner un fichier
            <input
              hidden
              type="file"
              onChange={(event) => {
                const file = event.target.files?.[0] || null;
                setUploadData((prev) => ({ ...prev, file }));
              }}
            />
          </Button>

          {uploadData.file && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {uploadData.file.name} • {formatFileSize(uploadData.file.size)}
            </Typography>
          )}

          {uploading && (
            <Box sx={{ mt: 3 }}>
              <LinearProgress variant="determinate" value={uploadProgress} />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Upload en cours: {uploadProgress}%
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeUploadDialog} disabled={uploading}>
            Annuler
          </Button>
          <Button onClick={handleUpload} variant="contained" disabled={uploading}>
            Uploader
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage(null)}
      >
        <Alert onClose={() => setSuccessMessage(null)} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DocumentsPage;
