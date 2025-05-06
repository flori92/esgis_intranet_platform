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
import { useAuth } from '../../context/AuthContext';
// Correction du chemin d'importation de Supabase
import { supabase } from '@/supabase';

/**
 * @typedef {Object} Document
 * @property {number} id - Identifiant unique du document
 * @property {string} title - Titre du document
 * @property {string|null} description - Description du document
 * @property {string} file_path - Chemin du fichier
 * @property {string} file_type - Type de fichier
 * @property {number} file_size - Taille du fichier en octets
 * @property {string} uploaded_by - Identifiant de l'utilisateur qui a uploadé
 * @property {string} uploaded_at - Date d'upload
 * @property {'course'|'administrative'|'resource'|'other'} category - Catégorie du document
 * @property {number|null} course_id - Identifiant du cours associé
 * @property {string|null} course_name - Nom du cours associé
 * @property {boolean} is_public - Indique si le document est public
 * @property {number|null} department_id - Identifiant du département
 * @property {string|null} department_name - Nom du département
 * @property {string[]} [tags] - Tags associés au document
 */

/**
 * @typedef {Object} Category
 * @property {string} id - Identifiant de la catégorie
 * @property {string} name - Nom de la catégorie
 * @property {React.ReactNode} icon - Icône de la catégorie
 */

/**
 * Page de gestion des documents
 * Permet aux utilisateurs de consulter, télécharger, uploader et supprimer des documents
 * @returns {JSX.Element} Page de documents
 */
const DocumentsPage = () => {
  const { authState } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [courses, setCourses] = useState([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFormData, setUploadFormData] = useState({
    title: '',
    description: '',
    category: 'course',
    course_id: '',
    is_public: false,
    file: null,
    tags: [],
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [availableTags, setAvailableTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState({
    startDate: null,
    endDate: null,
  });
  const [selectedTags, setSelectedTags] = useState([]);
  const [filterTags, setFilterTags] = useState([]);

  // Définir les catégories
  const categories = [
    { id: 'all', name: 'Tous les documents', icon: <DescriptionIcon /> },
    { id: 'course', name: 'Documents de cours', icon: <SchoolIcon /> },
    { id: 'administrative', name: 'Documents administratifs', icon: <FolderIcon /> },
    { id: 'resource', name: 'Ressources pédagogiques', icon: <DescriptionIcon /> },
    { id: 'other', name: 'Autres documents', icon: <DescriptionIcon /> },
  ];

  /**
   * Récupère les documents depuis Supabase en fonction du profil de l'utilisateur
   */
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
          .select('course_id, courses(id, name)')
          .eq('student_id', authState.student.id);

        if (coursesError) {
          throw new Error(`Erreur lors de la récupération des cours: ${coursesError.message}`);
        }

        if (coursesData) {
          const formattedCourses = coursesData.map(item => ({
            id: item.courses.id,
            name: item.courses.name
          }));
          setCourses(formattedCourses);
        }
      } else if (authState.isProfessor && authState.professor) {
        const { data: coursesData, error: coursesError } = await supabase
          .from('professor_courses')
          .select('course_id, courses(id, name)')
          .eq('professor_id', authState.professor.id);

        if (coursesError) {
          throw new Error(`Erreur lors de la récupération des cours: ${coursesError.message}`);
        }

        if (coursesData) {
          const formattedCourses = coursesData.map(item => ({
            id: item.courses.id,
            name: item.courses.name
          }));
          setCourses(formattedCourses);
        }
      }

      // Construire la requête pour récupérer les documents
      let query = supabase.from('documents').select('*');

      if (authState.isStudent && authState.student) {
        // Les étudiants peuvent voir les documents publics et ceux liés à leurs cours
        const studentCourseIds = courses.map(course => course.id);
        
        if (studentCourseIds.length > 0) {
          query = query.or(`is_public.eq.true,course_id.in.(${studentCourseIds.join(',')})`);
        } else {
          query = query.eq('is_public', true);
        }
      } else if (authState.isProfessor && authState.professor) {
        // Les professeurs peuvent voir les documents publics, ceux liés à leurs cours, et ceux qu'ils ont uploadés
        query = query.or(`is_public.eq.true,uploaded_by.eq.${authState.user.id}`);
      } else if (authState.isAdmin) {
        // Les admins peuvent tout voir, pas de filtrage supplémentaire
      }

      const { data: documentsData, error: documentsError } = await query;

      if (documentsError) {
        throw new Error(`Erreur lors de la récupération des documents: ${documentsError.message}`);
      }

      if (documentsData) {
        // Extraire tous les tags uniques
        const tagsSet = new Set();
        documentsData.forEach(doc => {
          if (doc.tags && Array.isArray(doc.tags)) {
            doc.tags.forEach(tag => tagsSet.add(tag));
          }
        });
        setAvailableTags(Array.from(tagsSet));
        
        setDocuments(documentsData);
        setFilteredDocuments(documentsData);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des documents:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les documents en fonction des critères
  useEffect(() => {
    if (documents.length === 0) {
      return;
    }

    let filtered = [...documents];

    // Filtrer par catégorie
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(doc => doc.category === selectedCategory);
    }

    // Filtrer par cours
    if (selectedCourse !== 'all') {
      filtered = filtered.filter(doc => doc.course_id === parseInt(selectedCourse, 10));
    }

    // Filtrer par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        doc =>
          doc.title.toLowerCase().includes(query) ||
          (doc.description && doc.description.toLowerCase().includes(query)) ||
          (doc.tags && doc.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    }

    // Filtrer par date
    if (dateFilter.startDate) {
      filtered = filtered.filter(
        doc => new Date(doc.uploaded_at) >= new Date(dateFilter.startDate)
      );
    }
    if (dateFilter.endDate) {
      filtered = filtered.filter(
        doc => new Date(doc.uploaded_at) <= new Date(dateFilter.endDate)
      );
    }

    // Filtrer par tags
    if (filterTags.length > 0) {
      filtered = filtered.filter(
        doc => doc.tags && filterTags.every(tag => doc.tags.includes(tag))
      );
    }

    // Appliquer le filtre d'onglets
    if (tabValue === 1) {
      // Mes documents (uploadés par l'utilisateur)
      filtered = filtered.filter(doc => doc.uploaded_by === authState.user.id);
    } else if (tabValue === 2) {
      // Documents de cours
      filtered = filtered.filter(doc => doc.category === 'course');
    } else if (tabValue === 3) {
      // Documents administratifs
      filtered = filtered.filter(doc => doc.category === 'administrative');
    }

    setFilteredDocuments(filtered);
  }, [documents, selectedCategory, selectedCourse, searchQuery, tabValue, dateFilter, filterTags]);

  // Charger les documents au chargement de la page
  useEffect(() => {
    if (authState.user) {
      fetchDocuments();
    }
  }, [authState.user]);

  /**
   * Gérer le changement d'onglet
   * @param {React.SyntheticEvent} _event - Événement React
   * @param {number} newValue - Nouvel index d'onglet
   */
  const handleTabChange = (_event, newValue) => {
    setTabValue(newValue);
  };

  /**
   * Gérer le changement de catégorie
   * @param {Object} event - Événement de changement
   */
  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
  };

  /**
   * Gérer le changement de cours
   * @param {Object} event - Événement de changement
   */
  const handleCourseChange = (event) => {
    setSelectedCourse(event.target.value);
  };

  /**
   * Gérer la recherche
   * @param {React.ChangeEvent<HTMLInputElement>} event - Événement de changement
   */
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  /**
   * Ouvrir la boîte de dialogue d'upload
   */
  const handleOpenUploadDialog = () => {
    setUploadDialogOpen(true);
  };

  /**
   * Fermer la boîte de dialogue d'upload
   */
  const handleCloseUploadDialog = () => {
    setUploadDialogOpen(false);
    // Réinitialiser le formulaire
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
    setTagInput('');
  };

  /**
   * Gérer les changements dans le formulaire d'upload
   * @param {React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>} event - Événement de changement
   */
  const handleUploadFormChange = (event) => {
    const { name, value } = event.target;
    setUploadFormData({
      ...uploadFormData,
      [name]: value,
    });
  };

  /**
   * Gérer les changements de sélection dans le formulaire d'upload
   * @param {Object} event - Événement de changement
   */
  const handleUploadSelectChange = (event) => {
    const { name, value } = event.target;
    setUploadFormData({
      ...uploadFormData,
      [name]: value,
    });
  };

  /**
   * Gérer la sélection de fichier
   * @param {React.ChangeEvent<HTMLInputElement>} event - Événement de changement
   */
  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setUploadFormData({
        ...uploadFormData,
        file: event.target.files[0],
      });
    }
  };

  /**
   * Télécharger un document
   * @param {Document} document - Document à télécharger
   */
  const handleDownload = async (document) => {
    try {
      // Récupérer l'URL de téléchargement
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(document.file_path, 60);
        
      if (error) {
        throw new Error(`Erreur lors de la création de l'URL de téléchargement: ${error.message}`);
      }
      
      // Créer un élément a temporaire pour le téléchargement
      if (data && data.signedUrl) {
        const downloadLink = document.createElement('a');
        downloadLink.href = data.signedUrl;
        downloadLink.download = document.title || 'document';
        downloadLink.target = '_blank';
        
        document.body.appendChild(downloadLink);
        downloadLink.click();
        
        document.body.removeChild(downloadLink);
      }
    } catch (err) {
      console.error('Erreur lors du téléchargement du document:', err);
      setError(`Erreur lors du téléchargement: ${err.message}`);
    }
  };

  /**
   * Supprimer un document
   * @param {Document} document - Document à supprimer
   */
  const handleDelete = async (document) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer "${document.title}" ?`)) {
      return;
    }
    
    try {
      // Supprimer le fichier du stockage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([document.file_path]);
        
      if (storageError) {
        throw new Error(`Erreur lors de la suppression du fichier: ${storageError.message}`);
      }
      
      // Supprimer l'entrée de la base de données
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', document.id);
        
      if (dbError) {
        throw new Error(`Erreur lors de la suppression de l'entrée: ${dbError.message}`);
      }
      
      // Mettre à jour l'état local
      setDocuments(prev => prev.filter(doc => doc.id !== document.id));
      setFilteredDocuments(prev => prev.filter(doc => doc.id !== document.id));
      
      // Message de confirmation
      alert('Document supprimé avec succès!');
    } catch (err) {
      console.error('Erreur lors de la suppression du document:', err);
      setError(`Erreur lors de la suppression: ${err.message}`);
    }
  };

  /**
   * Uploader un document
   */
  const handleUpload = async () => {
    if (!uploadFormData.file || !uploadFormData.title) {
      alert('Veuillez remplir les champs obligatoires (titre et fichier)');
      return;
    }
    
    setIsUploading(true);
    
    try {
      const filePath = `${authState.user.id}/${Date.now()}_${uploadFormData.file.name}`;
      
      // Upload du fichier vers le stockage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, uploadFormData.file, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            const percent = Math.round((progress.loaded / progress.total) * 100);
            setUploadProgress(percent);
          },
        });
        
      if (uploadError) {
        throw new Error(`Erreur lors de l'upload du fichier: ${uploadError.message}`);
      }
      
      // Créer l'entrée dans la base de données
      const fileType = uploadFormData.file.type || 'application/octet-stream';
      
      const documentData = {
        title: uploadFormData.title,
        description: uploadFormData.description || null,
        file_path: filePath,
        file_type: fileType,
        file_size: uploadFormData.file.size,
        uploaded_by: authState.user.id,
        uploaded_at: new Date().toISOString(),
        category: uploadFormData.category,
        course_id: uploadFormData.course_id ? parseInt(uploadFormData.course_id, 10) : null,
        course_name: uploadFormData.course_id 
          ? courses.find(c => c.id.toString() === uploadFormData.course_id)?.name 
          : null,
        is_public: uploadFormData.is_public,
        department_id: authState.user.department_id || null,
        department_name: null, // À compléter si nécessaire
        tags: uploadFormData.tags.length > 0 ? uploadFormData.tags : null,
      };
      
      const { data, error: insertError } = await supabase
        .from('documents')
        .insert([documentData])
        .select();
        
      if (insertError) {
        // Si l'insertion échoue, essayer de supprimer le fichier uploadé
        await supabase.storage.from('documents').remove([filePath]);
        throw new Error(`Erreur lors de l'enregistrement du document: ${insertError.message}`);
      }
      
      if (data && data.length > 0) {
        // Ajouter le nouveau document à l'état local
        setDocuments(prev => [...prev, data[0]]);
        setFilteredDocuments(prev => [...prev, data[0]]);
        
        // Fermer la boîte de dialogue et réinitialiser le formulaire
        handleCloseUploadDialog();
        
        // Message de confirmation
        alert('Document uploadé avec succès!');
      }
    } catch (err) {
      console.error('Erreur lors de l\'upload du document:', err);
      setError(`Erreur lors de l'upload: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Formater la taille du fichier
   * @param {number} bytes - Taille en octets
   * @returns {string} Taille formatée
   */
  const formatFileSize = (bytes) => {
    if (bytes < 1024) {
      return `${bytes} o`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} Ko`;
    } else {
      return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`;
    }
  };

  /**
   * Formater la date
   * @param {string} dateString - Date au format ISO
   * @returns {string} Date formatée
   */
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch (e) {
      return dateString;
    }
  };

  /**
   * Obtenir l'icône en fonction du type de fichier
   * @param {string} fileType - Type MIME du fichier
   * @returns {React.ReactNode} Icône correspondante
   */
  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) {
      return <ImageIcon />;
    }
    if (fileType === 'application/pdf') {
      return <PdfIcon />;
    }
    if (fileType.startsWith('video/')) {
      return <VideoIcon />;
    }
    if (fileType.startsWith('application/zip') || fileType.startsWith('application/x-rar')) {
      return <ArchiveIcon />;
    }
    return <InsertDriveFileIcon />;
  };

  /**
   * Ajouter un tag aux filtres
   * @param {string} tag - Tag à ajouter
   */
  const handleAddFilterTag = (tag) => {
    if (!filterTags.includes(tag)) {
      setFilterTags([...filterTags, tag]);
    }
  };

  /**
   * Supprimer un tag des filtres
   * @param {string} tag - Tag à supprimer
   */
  const handleRemoveFilterTag = (tag) => {
    setFilterTags(filterTags.filter(t => t !== tag));
  };

  /**
   * Réinitialiser tous les filtres
   */
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedCourse('all');
    setFilterTags([]);
    setDateFilter({
      startDate: null,
      endDate: null,
    });
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gestion des documents
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Rechercher un document..."
              value={searchQuery}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Catégorie</InputLabel>
              <Select
                value={selectedCategory}
                label="Catégorie"
                onChange={handleCategoryChange}
              >
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {category.icon}
                      <Box sx={{ ml: 1 }}>{category.name}</Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          {courses.length > 0 && (
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Cours</InputLabel>
                <Select
                  value={selectedCourse}
                  label="Cours"
                  onChange={handleCourseChange}
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
          )}
          <Grid item xs={12} sm={6} md={2}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<FilterListIcon />}
              onClick={() => setAdvancedSearchOpen(!advancedSearchOpen)}
            >
              Filtres avancés
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<CloudUploadIcon />}
              onClick={handleOpenUploadDialog}
            >
              Upload
            </Button>
          </Grid>
        </Grid>

        {advancedSearchOpen && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(0, 0, 0, 0.02)', borderRadius: 1 }}>
            <Typography variant="subtitle1" gutterBottom>
              Filtres avancés
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Date de début"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={dateFilter.startDate || ''}
                  onChange={(e) => setDateFilter({ ...dateFilter, startDate: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Date de fin"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={dateFilter.endDate || ''}
                  onChange={(e) => setDateFilter({ ...dateFilter, endDate: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Tags</InputLabel>
                  <Select
                    value=""
                    label="Tags"
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddFilterTag(e.target.value);
                      }
                    }}
                  >
                    <MenuItem value="">Sélectionner un tag</MenuItem>
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
                  variant="outlined"
                  color="secondary"
                  fullWidth
                  onClick={handleResetFilters}
                >
                  Réinitialiser
                </Button>
              </Grid>
            </Grid>
            {filterTags.length > 0 && (
              <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {filterTags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => handleRemoveFilterTag(tag)}
                  />
                ))}
              </Box>
            )}
          </Box>
        )}
      </Paper>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Tous les documents" />
          <Tab label="Mes documents" />
          <Tab label="Documents de cours" />
          <Tab label="Documents administratifs" />
        </Tabs>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredDocuments.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary">
            Aucun document trouvé
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Essayez de modifier vos critères de recherche ou d'uploader un nouveau document.
          </Typography>
        </Paper>
      ) : (
        <List>
          {filteredDocuments.map((document) => (
            <React.Fragment key={document.id}>
              <ListItem>
                <ListItemIcon>
                  {getFileIcon(document.file_type)}
                </ListItemIcon>
                <ListItemText
                  primary={document.title}
                  secondary={
                    <Box>
                      <Typography variant="body2" component="span">
                        {document.description && `${document.description} • `}
                        {formatFileSize(document.file_size)} • Uploaded {formatDate(document.uploaded_at)}
                      </Typography>
                      {document.course_name && (
                        <Typography variant="body2" component="div">
                          Cours: {document.course_name}
                        </Typography>
                      )}
                      {document.tags && document.tags.length > 0 && (
                        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {document.tags.map((tag) => (
                            <Chip
                              key={tag}
                              label={tag}
                              size="small"
                              onClick={() => handleAddFilterTag(tag)}
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          ))}
                        </Box>
                      )}
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Tooltip title="Télécharger">
                    <IconButton
                      edge="end"
                      aria-label="download"
                      onClick={() => handleDownload(document)}
                    >
                      <CloudDownloadIcon />
                    </IconButton>
                  </Tooltip>
                  {(authState.isAdmin || document.uploaded_by === authState.user.id) && (
                    <Tooltip title="Supprimer">
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleDelete(document)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </ListItemSecondaryAction>
              </ListItem>
              <Divider variant="inset" component="li" />
            </React.Fragment>
          ))}
        </List>
      )}

      {/* Boîte de dialogue d'upload */}
      <Dialog open={uploadDialogOpen} onClose={handleCloseUploadDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Uploader un nouveau document</DialogTitle>
        <DialogContent>
          <Box sx={{ p: 1 }}>
            <TextField
              name="title"
              label="Titre"
              value={uploadFormData.title}
              onChange={handleUploadFormChange}
              fullWidth
              margin="normal"
              required
            />
            <TextField
              name="description"
              label="Description"
              value={uploadFormData.description}
              onChange={handleUploadFormChange}
              fullWidth
              margin="normal"
              multiline
              rows={3}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Catégorie</InputLabel>
              <Select
                name="category"
                value={uploadFormData.category}
                label="Catégorie"
                onChange={handleUploadSelectChange}
              >
                <MenuItem value="course">Document de cours</MenuItem>
                <MenuItem value="administrative">Document administratif</MenuItem>
                <MenuItem value="resource">Ressource pédagogique</MenuItem>
                <MenuItem value="other">Autre</MenuItem>
              </Select>
            </FormControl>
            {uploadFormData.category === 'course' && courses.length > 0 && (
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
