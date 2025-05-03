import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Chip,
  Tooltip,
  InputAdornment,
} from '@mui/material';
import {
  Description as DescriptionIcon,
  School as SchoolIcon,
  Folder as FolderIcon,
  CloudUpload as CloudUploadIcon,
  CloudDownload as CloudDownloadIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Add as AddIcon,
  FilterList as FilterListIcon,
  Share as ShareIcon,
  InsertDriveFile as InsertDriveFileIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Movie as VideoIcon,
  Archive as ArchiveIcon,
} from '@mui/icons-material';
import { useAuth, AuthContextType } from '../../context/AuthContext';
import supabase from '../../services/supabase';
import { Database } from '../../types/database';

// Types pour les documents
interface Document {
  id: number;
  title: string;
  description: string | null;
  file_path: string;
  file_type: string;
  file_size: number;
  uploaded_by: string;
  uploaded_at: string;
  category: 'course' | 'administrative' | 'resource' | 'other';
  course_id: number | null;
  course_name: string | null;
  is_public: boolean;
  department_id: number | null;
  department_name: string | null;
  tags?: string[];
}

// Types pour les catégories
interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
}

const DocumentsPage: React.FC = () => {
  const { authState } = useAuth() as AuthContextType;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [courses, setCourses] = useState<{ id: number; name: string }[]>([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFormData, setUploadFormData] = useState({
    title: '',
    description: '',
    category: 'course',
    course_id: '',
    is_public: false,
    file: null as File | null,
    tags: [] as string[],
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState<{
    startDate: string | null;
    endDate: string | null;
  }>({
    startDate: null,
    endDate: null,
  });
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Définir les catégories
  const categories: Category[] = [
    { id: 'all', name: 'Tous les documents', icon: <DescriptionIcon /> },
    { id: 'course', name: 'Documents de cours', icon: <SchoolIcon /> },
    { id: 'administrative', name: 'Documents administratifs', icon: <FolderIcon /> },
    { id: 'resource', name: 'Ressources pédagogiques', icon: <DescriptionIcon /> },
    { id: 'other', name: 'Autres documents', icon: <DescriptionIcon /> },
  ];

  // Charger les documents
  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      try {
        if (!authState.user) {
          throw new Error('Utilisateur non connecté');
        }

        // Récupérer les cours disponibles
        if (authState.isStudent && authState.student) {
          const { data: coursesData, error: coursesError } = await supabase
            .from('student_courses')
            .select(`
              course_id,
              courses (
                id,
                name
              )
            `)
            .eq('student_id', authState.student.id);

          if (coursesError) throw coursesError;

          if (coursesData) {
            const uniqueCourses = coursesData.map(item => ({
              id: item.courses.id,
              name: item.courses.name,
            }));
            setCourses(uniqueCourses);
          }
        }

        // Récupérer tous les tags disponibles
        const { data: tagsData, error: tagsError } = await supabase
          .from('document_tags')
          .select('tag')
          .order('tag');
        
        if (tagsError) throw tagsError;
        
        if (tagsData) {
          const uniqueTags = [...new Set(tagsData.map(item => item.tag))];
          setAvailableTags(uniqueTags);
        }

        // Construire la requête pour récupérer les documents
        let query = supabase
          .from('documents')
          .select(`
            id,
            title,
            description,
            file_path,
            file_type,
            file_size,
            uploaded_by,
            uploaded_at,
            category,
            course_id,
            courses (name),
            is_public,
            department_id,
            departments (name),
            tags
          `);

        // Filtrer selon le rôle de l'utilisateur
        if (authState.isStudent && authState.student) {
          query = query.or(`is_public.eq.true,department_id.eq.${authState.student.department_id}`);
        } else if (authState.isProfessor && authState.professor) {
          query = query.or(`is_public.eq.true,department_id.eq.${authState.professor.department_id},uploaded_by.eq.${authState.user.id}`);
        }

        const { data: documentsData, error: documentsError } = await query;

        if (documentsError) throw documentsError;

        // Transformer les données des documents
        if (documentsData) {
          const transformedDocuments: Document[] = documentsData.map((doc) => ({
            id: doc.id,
            title: doc.title,
            description: doc.description,
            file_path: doc.file_path,
            file_type: doc.file_type,
            file_size: doc.file_size,
            uploaded_by: doc.uploaded_by,
            uploaded_at: doc.uploaded_at,
            category: doc.category,
            course_id: doc.course_id,
            course_name: doc.courses?.name || null,
            is_public: doc.is_public,
            department_id: doc.department_id,
            department_name: doc.departments?.name || null,
            tags: doc.tags || [],
          }));

          setDocuments(transformedDocuments);
          setFilteredDocuments(transformedDocuments);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des documents:', error);
        setError('Erreur lors du chargement des documents. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [authState]);

  // Filtrer les documents en fonction des critères de recherche
  useEffect(() => {
    let filtered = [...documents];

    // Filtrer par catégorie
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((doc) => doc.category === selectedCategory);
    }

    // Filtrer par cours
    if (selectedCourse !== 'all') {
      filtered = filtered.filter((doc) => doc.course_id === parseInt(selectedCourse));
    }

    // Filtrer par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.title.toLowerCase().includes(query) ||
          (doc.description && doc.description.toLowerCase().includes(query)) ||
          (doc.tags && doc.tags.some((tag) => tag.toLowerCase().includes(query))) ||
          (doc.course_name && doc.course_name.toLowerCase().includes(query))
      );
    }

    // Filtrer par date
    if (dateFilter.startDate) {
      filtered = filtered.filter(
        (doc) => new Date(doc.uploaded_at) >= new Date(dateFilter.startDate!)
      );
    }
    if (dateFilter.endDate) {
      filtered = filtered.filter(
        (doc) => new Date(doc.uploaded_at) <= new Date(dateFilter.endDate!)
      );
    }

    // Filtrer par tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter((doc) =>
        doc.tags && selectedTags.every((tag) => doc.tags!.includes(tag))
      );
    }

    setFilteredDocuments(filtered);
  }, [documents, selectedCategory, selectedCourse, searchQuery, dateFilter, selectedTags]);

  // Gérer le changement d'onglet
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Gérer le changement de catégorie
  const handleCategoryChange = (event: SelectChangeEvent) => {
    setSelectedCategory(event.target.value);
  };

  // Gérer le changement de cours
  const handleCourseChange = (event: SelectChangeEvent) => {
    setSelectedCourse(event.target.value);
  };

  // Gérer la recherche
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  // Ouvrir la boîte de dialogue d'upload
  const handleOpenUploadDialog = () => {
    setUploadDialogOpen(true);
  };

  // Fermer la boîte de dialogue d'upload
  const handleCloseUploadDialog = () => {
    setUploadDialogOpen(false);
    setUploadFormData({
      title: '',
      description: '',
      category: 'course',
      course_id: '',
      is_public: false,
      file: null,
      tags: [],
    });
    setUploadProgress(0);
    setIsUploading(false);
  };

  // Gérer les changements dans le formulaire d'upload
  const handleUploadFormChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setUploadFormData({
      ...uploadFormData,
      [name]: value,
    });
  };

  // Gérer les changements de sélection dans le formulaire d'upload
  const handleUploadSelectChange = (event: SelectChangeEvent) => {
    const { name, value } = event.target;
    setUploadFormData({
      ...uploadFormData,
      [name]: value,
    });
  };

  // Gérer la sélection de fichier
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setUploadFormData({
        ...uploadFormData,
        file: event.target.files[0],
      });
    }
  };

  // Télécharger un document
  const handleDownload = async (document: Document) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(document.file_path);

      if (error) throw error;

      // Créer un lien de téléchargement
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = document.title;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      alert('Erreur lors du téléchargement. Veuillez réessayer.');
    }
  };

  // Supprimer un document
  const handleDelete = async (document: Document) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le document "${document.title}" ?`)) {
      return;
    }

    try {
      // Supprimer le fichier du stockage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([document.file_path]);

      if (storageError) throw storageError;

      // Supprimer l'entrée de la base de données
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', document.id);

      if (dbError) throw dbError;

      // Mettre à jour la liste des documents
      setDocuments(documents.filter((doc) => doc.id !== document.id));
      alert('Document supprimé avec succès.');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression. Veuillez réessayer.');
    }
  };

  // Uploader un document
  const handleUpload = async () => {
    if (!uploadFormData.title || !uploadFormData.category || !uploadFormData.file) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const file = uploadFormData.file;
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${authState.user?.id}/${fileName}`;

      // Uploader le fichier
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Créer l'entrée dans la base de données
      const { data, error: insertError } = await supabase
        .from('documents')
        .insert({
          title: uploadFormData.title,
          description: uploadFormData.description || null,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
          uploaded_by: authState.user?.id,
          category: uploadFormData.category as 'course' | 'administrative' | 'resource' | 'other',
          course_id: uploadFormData.course_id ? parseInt(uploadFormData.course_id) : null,
          is_public: uploadFormData.is_public,
          department_id: authState.isStudent
            ? authState.student?.department_id
            : authState.isProfessor
            ? authState.professor?.department_id
            : null,
        })
        .select();

      if (insertError) throw insertError;

      // Ajouter les tags s'il y en a
      if (uploadFormData.tags.length > 0 && data && data.length > 0) {
        const documentId = data[0].id;
        const tagInserts = uploadFormData.tags.map((tag) => ({
          document_id: documentId,
          tag: tag,
        }));

        const { error: tagError } = await supabase
          .from('document_tags')
          .insert(tagInserts);

        if (tagError) throw tagError;
      }

      // Mettre à jour la liste des documents
      if (data && data.length > 0) {
        const newDoc: Document = {
          id: data[0].id,
          title: data[0].title,
          description: data[0].description,
          file_path: data[0].file_path,
          file_type: data[0].file_type,
          file_size: data[0].file_size,
          uploaded_by: data[0].uploaded_by,
          uploaded_at: data[0].uploaded_at,
          category: data[0].category,
          course_id: data[0].course_id,
          course_name: courses.find((c) => c.id === data[0].course_id)?.name || null,
          is_public: data[0].is_public,
          department_id: data[0].department_id,
          department_name: null, // À récupérer si nécessaire
          tags: uploadFormData.tags,
        };

        setDocuments([newDoc, ...documents]);
      }

      alert('Document uploadé avec succès.');
      handleCloseUploadDialog();
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      alert('Erreur lors de l\'upload. Veuillez réessayer.');
    } finally {
      setIsUploading(false);
    }
  };

  // Formater la taille du fichier
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    return (bytes / 1073741824).toFixed(1) + ' GB';
  };

  // Formater la date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  // Obtenir l'icône en fonction du type de fichier
  const getFileIcon = (fileType: string): React.ReactNode => {
    if (fileType.startsWith('application/pdf')) return <PdfIcon />;
    if (fileType.startsWith('image/')) return <ImageIcon />;
    if (fileType.startsWith('video/')) return <VideoIcon />;
    if (fileType.startsWith('application/zip') || fileType.startsWith('application/x-rar'))
      return <ArchiveIcon />;
    return <InsertDriveFileIcon />;
  };

  // Afficher un message de chargement
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Afficher un message d'erreur
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button variant="contained" onClick={() => window.location.reload()} sx={{ mt: 2 }}>
          Réessayer
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Bibliothèque de ressources</Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TextField
            placeholder="Rechercher..."
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mr: 1, width: 300 }}
          />
          <Tooltip title="Recherche avancée">
            <IconButton onClick={() => setAdvancedSearchOpen(!advancedSearchOpen)}>
              <FilterListIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenUploadDialog}
        >
          Nouveau document
        </Button>
      </Box>

      {advancedSearchOpen && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>Recherche avancée</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="dense" size="small">
                <InputLabel>Catégorie</InputLabel>
                <Select
                  value={selectedCategory}
                  label="Catégorie"
                  onChange={handleCategoryChange}
                >
                  <MenuItem value="all">Toutes les catégories</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="dense" size="small">
                <InputLabel>Cours</InputLabel>
                <Select
                  value={selectedCourse}
                  label="Cours"
                  onChange={handleCourseChange}
                  disabled={courses.length === 0}
                >
                  <MenuItem value="all">Tous les cours</MenuItem>
                  {courses.map((course) => (
                    <MenuItem key={course.id} value={course.id.toString()}>
                      {course.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Date de début"
                type="date"
                value={dateFilter.startDate || ''}
                onChange={(e) => setDateFilter({ ...dateFilter, startDate: e.target.value })}
                InputLabelProps={{
                  shrink: true,
                }}
                fullWidth
                margin="dense"
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Date de fin"
                type="date"
                value={dateFilter.endDate || ''}
                onChange={(e) => setDateFilter({ ...dateFilter, endDate: e.target.value })}
                InputLabelProps={{
                  shrink: true,
                }}
                fullWidth
                margin="dense"
                size="small"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>Tags</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {availableTags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onClick={() => handleAddFilterTag(tag)}
                    color={selectedTags.includes(tag) ? 'primary' : 'default'}
                    onDelete={selectedTags.includes(tag) ? () => handleRemoveFilterTag(tag) : undefined}
                  />
                ))}
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Button 
                variant="outlined" 
                size="small" 
                onClick={handleResetFilters}
                startIcon={<FilterListIcon />}
              >
                Réinitialiser les filtres
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Onglets */}
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        {categories.map((category) => (
          <Tab
            key={category.id}
            label={category.name}
            icon={category.icon}
            iconPosition="start"
            onClick={() => setSelectedCategory(category.id)}
          />
        ))}
      </Tabs>

      {/* Liste des documents */}
      <Paper elevation={3} sx={{ mb: 3 }}>
        {filteredDocuments.length > 0 ? (
          <List>
            {filteredDocuments.map((document, index) => (
              <React.Fragment key={document.id}>
                <ListItem>
                  <ListItemIcon>{getFileIcon(document.file_type)}</ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                          {document.title}
                        </Typography>
                        {document.is_public && (
                          <Chip
                            label="Public"
                            size="small"
                            color="primary"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {document.description}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                          {document.course_name && (
                            <Chip
                              label={document.course_name}
                              size="small"
                              color="default"
                              icon={<SchoolIcon />}
                            />
                          )}
                          <Chip
                            label={formatFileSize(document.file_size)}
                            size="small"
                            color="default"
                          />
                          <Chip
                            label={formatDate(document.uploaded_at)}
                            size="small"
                            color="default"
                          />
                          {document.tags && document.tags.length > 0 && (
                            <Chip
                              label={document.tags.join(', ')}
                              size="small"
                              color="default"
                            />
                          )}
                        </Box>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Tooltip title="Télécharger">
                      <IconButton edge="end" onClick={() => handleDownload(document)}>
                        <CloudDownloadIcon />
                      </IconButton>
                    </Tooltip>
                    {(authState.isAdmin ||
                      (authState.user && authState.user.id === document.uploaded_by)) && (
                      <Tooltip title="Supprimer">
                        <IconButton edge="end" onClick={() => handleDelete(document)}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
                {index < filteredDocuments.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1">Aucun document trouvé</Typography>
          </Box>
        )}
      </Paper>

      {/* Boîte de dialogue d'upload */}
      <Dialog open={uploadDialogOpen} onClose={handleCloseUploadDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Uploader un document</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              name="title"
              label="Titre"
              fullWidth
              margin="normal"
              value={uploadFormData.title}
              onChange={handleUploadFormChange}
              required
            />
            <TextField
              name="description"
              label="Description"
              fullWidth
              margin="normal"
              multiline
              rows={3}
              value={uploadFormData.description}
              onChange={handleUploadFormChange}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Catégorie</InputLabel>
              <Select
                name="category"
                value={uploadFormData.category}
                label="Catégorie"
                onChange={handleUploadSelectChange}
                required
              >
                <MenuItem value="course">Document de cours</MenuItem>
                <MenuItem value="administrative">Document administratif</MenuItem>
                <MenuItem value="resource">Ressource pédagogique</MenuItem>
                <MenuItem value="other">Autre document</MenuItem>
              </Select>
            </FormControl>
            {uploadFormData.category === 'course' && (
              <FormControl fullWidth margin="normal">
                <InputLabel>Cours</InputLabel>
                <Select
                  name="course_id"
                  value={uploadFormData.course_id}
                  label="Cours"
                  onChange={handleUploadSelectChange}
                >
                  <MenuItem value="">Aucun</MenuItem>
                  {courses.map((course) => (
                    <MenuItem key={course.id} value={course.id.toString()}>
                      {course.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <FormControl fullWidth margin="normal">
              <InputLabel>Visibilité</InputLabel>
              <Select
                name="is_public"
                value={uploadFormData.is_public ? 'true' : 'false'}
                label="Visibilité"
                onChange={(e) =>
                  setUploadFormData({
                    ...uploadFormData,
                    is_public: e.target.value === 'true',
                  })
                }
              >
                <MenuItem value="false">Département uniquement</MenuItem>
                <MenuItem value="true">Public</MenuItem>
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', mt: 2 }}>
              <TextField
                label="Ajouter un tag"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                sx={{ flexGrow: 1, mr: 1 }}
              />
              <Button 
                variant="outlined" 
                onClick={() => {
                  if (tagInput && !uploadFormData.tags.includes(tagInput)) {
                    setUploadFormData({
                      ...uploadFormData,
                      tags: [...uploadFormData.tags, tagInput],
                    });
                    setTagInput('');
                  }
                }}
                disabled={!tagInput}
              >
                Ajouter
              </Button>
            </Box>
            {uploadFormData.tags.length > 0 && (
              <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {uploadFormData.tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => {
                      setUploadFormData({
                        ...uploadFormData,
                        tags: uploadFormData.tags.filter((t) => t !== tag),
                      });
                    }}
                  />
                ))}
              </Box>
            )}
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUploadIcon />}
              fullWidth
              sx={{ mt: 2 }}
            >
              Sélectionner un fichier
              <input
                type="file"
                hidden
                onChange={handleFileChange}
              />
            </Button>
            {uploadFormData.file && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Fichier sélectionné: {uploadFormData.file.name} ({formatFileSize(uploadFormData.file.size)})
                </Typography>
              </Box>
            )}
            {isUploading && (
              <Box sx={{ mt: 2 }}>
                <CircularProgress variant="determinate" value={uploadProgress} />
                <Typography variant="body2">{uploadProgress}%</Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUploadDialog} disabled={isUploading}>
            Annuler
          </Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={isUploading || !uploadFormData.file}
          >
            Uploader
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentsPage;
