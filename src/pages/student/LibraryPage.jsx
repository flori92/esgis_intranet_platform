import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  InputAdornment,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
  alpha
} from '@mui/material';
import {
  AutoStories as AutoStoriesIcon,
  Description as FileIcon,
  Download as DownloadIcon,
  FolderOpen as FolderIcon,
  InsertDriveFile as InsertDriveFileIcon,
  Search as SearchIcon,
  CollectionsBookmark as LibraryIcon,
  Person as PersonIcon,
  PictureAsPdf as PdfIcon,
  Public as PublicIcon,
  School as SchoolIcon,
  Slideshow as PresentationIcon,
  VideoLibrary as VideoIcon,
  Archive as ArchiveIcon
} from '@mui/icons-material';

import { useAuth } from '@/context/AuthContext';
import { recordResourceInteraction } from '@/api/courses';
import { createDocumentDownloadUrl } from '@/api/documents';
import { getStudentLibraryContent } from '@/api/library';

/**
 * Page de la Bibliothèque Numérique - ESGIS Campus
 */
const FILE_META = {
  pdf: { icon: PdfIcon, label: 'PDF', color: '#c0392b' },
  video: { icon: VideoIcon, label: 'Vidéo', color: '#1565c0' },
  presentation: { icon: PresentationIcon, label: 'Présentation', color: '#ef6c00' },
  archive: { icon: ArchiveIcon, label: 'Archive', color: '#00796b' },
  image: { icon: FileIcon, label: 'Image', color: '#8e44ad' },
  file: { icon: InsertDriveFileIcon, label: 'Document', color: '#546e7a' }
};

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

const formatDate = (value) => {
  if (!value) {
    return 'Date inconnue';
  }

  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(value));
  } catch (_error) {
    return value;
  }
};

const getFileMeta = (type) => FILE_META[type] || FILE_META.file;

const getVisibilityLabel = (visibility) => {
  if (visibility === 'course') {
    return 'Cours';
  }

  if (visibility === 'department') {
    return 'Département';
  }

  return 'Public';
};

const LibraryPage = () => {
  const { authState } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionId, setActionId] = useState(null);

  useEffect(() => {
    const fetchResources = async () => {
      setLoading(true);

      try {
        const { items, error: loadError } = await getStudentLibraryContent(
          authState.profile?.id || authState.user?.id || null
        );

        if (loadError) {
          throw loadError;
        }

        setResources(items || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching library:', err);
        setResources([]);
        setError(err.message || 'Impossible de charger la bibliothèque.');
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, [authState.profile?.id, authState.user?.id]);

  const filteredResources = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return resources.filter((resource) => {
      if (tabValue === 1 && resource.source !== 'course') {
        return false;
      }

      if (tabValue === 2 && resource.source !== 'shared') {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [
        resource.title,
        resource.description,
        resource.author,
        resource.courseName,
        resource.courseCode,
        resource.contextLabel,
        ...(resource.tags || [])
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [resources, searchTerm, tabValue]);

  const courseResourcesCount = resources.filter((resource) => resource.source === 'course').length;
  const sharedResourcesCount = resources.filter((resource) => resource.source === 'shared').length;

  const handleOpenResource = async (resource) => {
    setActionId(resource.id);
    setError(null);

    try {
      if (resource.source === 'course') {
        if (!resource.fileUrl) {
          throw new Error('Fichier de cours indisponible');
        }

        window.open(resource.fileUrl, '_blank', 'noopener,noreferrer');
        recordResourceInteraction(resource.rawId, authState.user?.id, 'view').catch(() => {});
        return;
      }

      const { url, error: urlError } = await createDocumentDownloadUrl(resource.filePath, 120);

      if (urlError || !url) {
        throw urlError || new Error('Document partagé indisponible');
      }

      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (openError) {
      console.error('handleOpenResource:', openError);
      setError(openError.message || "Impossible d'ouvrir cette ressource.");
    } finally {
      setActionId(null);
    }
  };

  if (loading && resources.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <LibraryIcon color="primary" fontSize="large" />
          Bibliothèque Numérique
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Ressources alimentées automatiquement par les supports publiés dans vos cours et par les documents partagés par les professeurs ou l’administration.
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Les professeurs alimentent cette bibliothèque via leurs ressources de cours publiées.
        Les documents partagés en visibilité publique, de département ou de cours y remontent aussi automatiquement.
      </Alert>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2.5, borderRadius: 3 }}>
            <Typography variant="overline" color="text.secondary">
              Total
            </Typography>
            <Typography variant="h5" fontWeight="bold">
              {resources.length}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2.5, borderRadius: 3 }}>
            <Typography variant="overline" color="text.secondary">
              Ressources de cours
            </Typography>
            <Typography variant="h5" fontWeight="bold">
              {courseResourcesCount}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2.5, borderRadius: 3 }}>
            <Typography variant="overline" color="text.secondary">
              Documents partagés
            </Typography>
            <Typography variant="h5" fontWeight="bold">
              {sharedResourcesCount}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, mb: 4 }}>
        <TextField
          fullWidth
          placeholder="Rechercher une ressource, un cours, un auteur..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 3 }}>
        <Tab label="Toutes les ressources" />
        <Tab label="Ressources de cours" />
        <Tab label="Documents partagés" />
      </Tabs>

      <Grid container spacing={3}>
        {filteredResources.length === 0 ? (
          <Grid item xs={12}>
            <Alert severity="info">
              Aucune ressource trouvée. Les dépôts professeurs publiés et les documents partagés apparaîtront ici automatiquement.
            </Alert>
          </Grid>
        ) : filteredResources.map((resource) => {
          const fileMeta = getFileMeta(resource.fileType);
          const FileTypeIcon = fileMeta.icon;

          return (
            <Grid item xs={12} sm={6} md={4} key={resource.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 4,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.1)'
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 2 }}>
                    <Chip
                      label={resource.sourceLabel}
                      size="small"
                      color={resource.source === 'course' ? 'primary' : 'secondary'}
                      icon={resource.source === 'course' ? <SchoolIcon /> : <FolderIcon />}
                      sx={{ fontWeight: 'bold', borderRadius: 1.5 }}
                    />
                    <Chip
                      label={getVisibilityLabel(resource.visibility)}
                      size="small"
                      variant="outlined"
                      icon={resource.visibility === 'public' ? <PublicIcon /> : <AutoStoriesIcon />}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <FileTypeIcon sx={{ color: fileMeta.color }} />
                    <Typography variant="body2" fontWeight="bold" sx={{ color: fileMeta.color }}>
                      {fileMeta.label}
                    </Typography>
                  </Box>

                  <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ lineHeight: 1.3 }}>
                    {resource.title}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <PersonIcon sx={{ fontSize: 16 }} /> {resource.author}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {resource.contextLabel}
                    {resource.courseCode ? ` • ${resource.courseCode}` : ''}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {resource.description || 'Aucune description fournie.'}
                  </Typography>

                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                    {formatFileSize(resource.fileSize)} • Ajouté le {formatDate(resource.createdAt)}
                    {resource.downloads > 0 ? ` • ${resource.downloads} téléchargement${resource.downloads > 1 ? 's' : ''}` : ''}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                    {resource.tags.map((tag) => (
                      <Chip
                        key={`${resource.id}-${tag}`}
                        label={tag}
                        size="small"
                        sx={{
                          backgroundColor: alpha('#003366', 0.06),
                          color: '#003366',
                          fontSize: '0.7rem'
                        }}
                      />
                    ))}
                  </Box>
                </CardContent>

                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleOpenResource(resource)}
                    disabled={actionId === resource.id}
                    sx={{ borderRadius: 2, fontWeight: 'bold' }}
                  >
                    {actionId === resource.id ? 'Ouverture...' : 'Ouvrir la ressource'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default LibraryPage;
