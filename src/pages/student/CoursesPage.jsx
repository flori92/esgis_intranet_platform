import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, CircularProgress, Alert, Button,
  TextField, Chip, Card, CardContent, Divider, IconButton, Tooltip,
  Tabs, Tab, FormControl, InputLabel, Select, MenuItem, Badge,
  List, ListItem, ListItemIcon, ListItemText, ListItemSecondaryAction,
  Breadcrumbs, Link
} from '@mui/material';
import {
  School as SchoolIcon,
  Book as BookIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  PictureAsPdf as PdfIcon,
  VideoLibrary as VideoIcon,
  Slideshow as PresentationIcon,
  Archive as ArchiveIcon,
  Description as DocIcon,
  Visibility as ViewIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  FolderOpen as FolderIcon,
  ArrowBack as BackIcon,
  FilterList as FilterIcon,
  CloudDownload as CloudIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';
import {
  getStudentCourses,
  getCourseChaptersAndResources,
  getUserResourceInteractions,
  recordResourceInteraction,
  removeResourceInteraction,
  getUserFavorites
} from '@/api/courses';

const FILE_ICONS = {
  pdf: <PdfIcon color="error" />,
  video: <VideoIcon color="primary" />,
  presentation: <PresentationIcon color="warning" />,
  archive: <ArchiveIcon color="info" />,
  doc: <DocIcon color="default" />,
};

const STATUS_LABELS = {
  new: { label: 'Nouveau', color: 'error' },
  read: { label: 'Lu', color: 'default' },
  downloaded: { label: 'Téléchargé', color: 'success' },
  favorite: { label: 'Favori', color: 'warning' },
};

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / 1048576).toFixed(1)} Mo`;
};

/**
 * Page Espace Cours & Ressources Pédagogiques — ESGIS Campus §3.2
 */
const StudentCoursesPage = () => {
  const { authState } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [favorites, setFavorites] = useState(new Set());
  const [reactions, setReactions] = useState({});

  useEffect(() => {
    const loadCourses = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const { data, error } = await getStudentCourses(authState.user?.id);
        if (!error && data && data.length > 0) {
          const chapterResults = await Promise.all(
            data.map(async (course) => ({
              courseId: course.id,
              chaptersData: (await getCourseChaptersAndResources(course.id)).data || []
            }))
          );

          const allResourceIds = chapterResults.flatMap(({ chaptersData }) =>
            (chaptersData || []).flatMap((chapter) => (chapter.resources || []).map((resource) => resource.id))
          );
          const { data: interactionMap } = await getUserResourceInteractions(allResourceIds, authState.user?.id);

          // Transformer les données Supabase au format attendu
          const formatted = data.map((c) => {
            const chapterEntry = chapterResults.find((entry) => entry.courseId === c.id);
            const chaptersData = chapterEntry?.chaptersData || [];
            const allResources = (chaptersData || []).flatMap(ch => ch.resources || []);
            return {
              id: c.id, code: c.code, name: c.name, credits: c.credits,
              professor: c.professeur?.full_name || '-',
              semester: c.semester === 1 ? 'S1' : c.semester === 2 ? 'S2' : '-',
              resources_count: allResources.length,
              new_count: allResources.filter(r => {
                const d = new Date(r.created_at);
                return (Date.now() - d.getTime()) < 7 * 24 * 60 * 60 * 1000;
              }).length,
              chapters: (chaptersData || []).map(ch => ({
                id: ch.id, name: ch.name,
                resources: (ch.resources || []).map(r => ({
                  ...(interactionMap?.[r.id] || {}),
                  id: r.id, title: r.title, type: r.file_type || 'pdf',
                  size: r.file_size || 0, date: r.created_at,
                  downloads: r.downloads_count || 0,
                  professor: r.uploaded_by?.full_name || '-',
                  file_url: r.file_url,
                  status: interactionMap?.[r.id]?.is_favorite
                    ? 'favorite'
                    : interactionMap?.[r.id]?.has_download
                      ? 'downloaded'
                      : interactionMap?.[r.id]?.has_view
                        ? 'read'
                        : 'new',
                }))
              }))
            };
          });
          setCourses(formatted);

          const loadedReactions = Object.entries(interactionMap || {}).reduce((accumulator, [resourceId, interaction]) => {
            if (interaction?.reaction_value) {
              accumulator[resourceId] = interaction.reaction_value;
            }
            return accumulator;
          }, {});
          setReactions(loadedReactions);
        } else {
          setCourses([]);
        }
        // Charger les favoris
        const { data: favs } = await getUserFavorites(authState.user?.id);
        if (favs) setFavorites(new Set(favs));
      } catch (err) {
        console.error('Erreur chargement cours:', err);
        setLoadError('Impossible de charger vos cours pour le moment.');
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };
    loadCourses();
  }, [authState.user?.id]);

  const toggleFavorite = async (resourceId) => {
    const isCurrentlyFavorite = favorites.has(resourceId);

    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(resourceId)) next.delete(resourceId); else next.add(resourceId);
      return next;
    });

    setCourses((prevCourses) => prevCourses.map((course) => ({
      ...course,
      chapters: (course.chapters || []).map((chapter) => ({
        ...chapter,
        resources: (chapter.resources || []).map((resource) => {
          if (resource.id !== resourceId) {
            return resource;
          }

          return {
            ...resource,
            status: isCurrentlyFavorite
              ? resource.has_download
                ? 'downloaded'
                : resource.has_view
                  ? 'read'
                  : 'new'
              : 'favorite',
            is_favorite: !isCurrentlyFavorite
          };
        })
      }))
    })));

    if (isCurrentlyFavorite) {
      await removeResourceInteraction(resourceId, authState.user?.id, 'favorite').catch(() => {});
    } else {
      await recordResourceInteraction(resourceId, authState.user?.id, 'favorite').catch(() => {});
    }
  };

  const setReaction = async (resourceId, reaction) => {
    setReactions(prev => ({ ...prev, [resourceId]: reaction }));
    if (reaction) {
      await recordResourceInteraction(resourceId, authState.user?.id, 'reaction', reaction).catch(() => {});
    }
  };

  const formatDate = (d) => {
    try { return format(new Date(d), 'dd MMM yyyy', { locale: fr }); } catch { return d; }
  };

  const filteredCourses = courses.filter(c => {
    if (filterSemester && c.semester !== filterSemester) return false;
    if (search) {
      const s = search.toLowerCase();
      return c.name.toLowerCase().includes(s) || c.code.toLowerCase().includes(s) || c.professor.toLowerCase().includes(s);
    }
    return true;
  });

  const getAllResources = (course) => {
    const all = [];
    (course.chapters || []).forEach(ch => {
      (ch.resources || []).forEach(r => {
        all.push({ ...r, chapter: ch.name });
      });
    });
    return all;
  };

  const getFilteredResources = (course) => {
    let resources = getAllResources(course);
    if (search) {
      const s = search.toLowerCase();
      resources = resources.filter(r => r.title.toLowerCase().includes(s) || r.chapter.toLowerCase().includes(s));
    }
    if (filterStatus) {
      if (filterStatus === 'favorite') resources = resources.filter(r => favorites.has(r.id));
      else resources = resources.filter(r => r.status === filterStatus);
    }
    return resources;
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      {loadError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {loadError}
        </Alert>
      )}
      {!selectedCourse ? (
        <>
          {/* === LISTE DES COURS === */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <BookIcon sx={{ mr: 1, color: 'primary.main', fontSize: 32 }} />
            <Typography variant="h5" fontWeight="bold">Mes Cours & Ressources</Typography>
          </Box>

          {/* Filtres */}
          <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6}>
                <TextField size="small" fullWidth placeholder="Rechercher un cours, un document..."
                  value={search} onChange={(e) => setSearch(e.target.value)}
                  InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'grey.400' }} /> }} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Semestre</InputLabel>
                  <Select value={filterSemester} label="Semestre" onChange={(e) => setFilterSemester(e.target.value)}>
                    <MenuItem value="">Tous</MenuItem>
                    <MenuItem value="S1">Semestre 1</MenuItem>
                    <MenuItem value="S2">Semestre 2</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={3}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Statut</InputLabel>
                  <Select value={filterStatus} label="Statut" onChange={(e) => setFilterStatus(e.target.value)}>
                    <MenuItem value="">Tous</MenuItem>
                    <MenuItem value="new">Nouveau</MenuItem>
                    <MenuItem value="read">Lu</MenuItem>
                    <MenuItem value="downloaded">Téléchargé</MenuItem>
                    <MenuItem value="favorite">Favoris</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>

          {/* Grille des cours */}
          {filteredCourses.length > 0 ? (
            <Grid container spacing={2}>
              {filteredCourses.map(course => (
                <Grid item xs={12} md={6} lg={4} key={course.id}>
                  <Card elevation={2} sx={{ cursor: 'pointer', '&:hover': { boxShadow: 6 }, height: '100%' }}
                    onClick={() => setSelectedCourse(course)}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                          <Typography variant="h6" fontWeight="bold">{course.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {course.code} — {course.professor}
                          </Typography>
                        </Box>
                        {course.new_count > 0 && (
                          <Badge badgeContent={course.new_count} color="error">
                            <BookIcon color="action" />
                          </Badge>
                        )}
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip label={course.semester} size="small" variant="outlined" />
                        <Chip label={`${course.credits} crédits`} size="small" variant="outlined" />
                        <Chip label={`${course.resources_count} ressources`} size="small" color="primary" variant="outlined" />
                        <Chip label={`${(course.chapters || []).length} chapitres`} size="small" variant="outlined" />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Paper elevation={1} sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                Aucun cours ou aucune ressource pédagogique n'est disponible pour le moment.
              </Typography>
            </Paper>
          )}
        </>
      ) : (
        <>
          {/* === DÉTAIL D'UN COURS === */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
            <IconButton onClick={() => setSelectedCourse(null)}><BackIcon /></IconButton>
            <Breadcrumbs>
              <Link underline="hover" color="inherit" sx={{ cursor: 'pointer' }} onClick={() => setSelectedCourse(null)}>
                Mes Cours
              </Link>
              <Typography color="text.primary" fontWeight="bold">{selectedCourse.name}</Typography>
            </Breadcrumbs>
          </Box>

          <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={8}>
                <Typography variant="h5" fontWeight="bold">{selectedCourse.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedCourse.code} — {selectedCourse.professor} — {selectedCourse.semester} — {selectedCourse.credits} crédits
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField size="small" fullWidth placeholder="Rechercher dans ce cours..."
                  value={search} onChange={(e) => setSearch(e.target.value)}
                  InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'grey.400' }} /> }} />
              </Grid>
            </Grid>
          </Paper>

          {/* Chapitres et ressources */}
          {(selectedCourse.chapters || []).map(chapter => {
            const resources = (chapter.resources || []).filter(r => {
              if (search) return r.title.toLowerCase().includes(search.toLowerCase());
              if (filterStatus === 'favorite') return favorites.has(r.id);
              if (filterStatus) return r.status === filterStatus;
              return true;
            });

            if (search && resources.length === 0) return null;

            return (
              <Paper key={chapter.id} elevation={1} sx={{ mb: 2, overflow: 'hidden' }}>
                <Box sx={{ bgcolor: '#003366', color: 'white', px: 2, py: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FolderIcon />
                  <Typography variant="subtitle1" fontWeight="bold">{chapter.name}</Typography>
                  <Chip label={`${resources.length} document${resources.length > 1 ? 's' : ''}`}
                    size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
                </Box>
                <List dense>
                  {resources.map((resource, idx) => {
                    const isFav = favorites.has(resource.id);
                    const statusCfg = STATUS_LABELS[resource.status] || STATUS_LABELS.read;

                    return (
                      <React.Fragment key={resource.id}>
                        {idx > 0 && <Divider />}
                        <ListItem sx={{ py: 1.5 }}>
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            {FILE_ICONS[resource.type] || <DocIcon />}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Typography variant="body1" fontWeight={resource.status === 'new' ? 'bold' : 'normal'}>
                                  {resource.title}
                                </Typography>
                                {resource.status === 'new' && (
                                  <Chip label="Nouveau" size="small" color="error" sx={{ height: 18, fontSize: '0.65rem' }} />
                                )}
                              </Box>
                            }
                            secondary={
                              <Typography variant="caption" color="text.secondary">
                                {resource.professor} • {formatDate(resource.date)} • {formatSize(resource.size)} • {resource.downloads} téléchargements
                              </Typography>
                            }
                          />
                          <ListItemSecondaryAction>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              {/* Réactions */}
                              {['👍', '🔥', '💡'].map(emoji => (
                                <Tooltip key={emoji} title={emoji === '👍' ? 'Utile' : emoji === '🔥' ? 'Très utile' : 'À améliorer'}>
                                  <IconButton size="small"
                                    sx={{ opacity: reactions[resource.id] === emoji ? 1 : 0.3, fontSize: '1rem' }}
                                    onClick={() => setReaction(resource.id, reactions[resource.id] === emoji ? null : emoji)}>
                                    {emoji}
                                  </IconButton>
                                </Tooltip>
                              ))}
                              <Tooltip title={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}>
                                <IconButton size="small" onClick={() => toggleFavorite(resource.id)}>
                                  {isFav ? <FavoriteIcon color="error" fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Télécharger">
                                <IconButton
                                  size="small"
                                  component="a"
                                  href={resource.file_url || '#'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  disabled={!resource.file_url}
                                  onClick={() => {
                                    if (resource.file_url) {
                                      setCourses((prevCourses) => prevCourses.map((course) => ({
                                        ...course,
                                        chapters: (course.chapters || []).map((chapter) => ({
                                          ...chapter,
                                          resources: (chapter.resources || []).map((item) => item.id === resource.id
                                            ? { ...item, has_view: true, status: item.is_favorite ? 'favorite' : item.has_download ? 'downloaded' : 'read' }
                                            : item)
                                        }))
                                      })));
                                      recordResourceInteraction(resource.id, authState.user?.id, 'view').catch(() => {});
                                    }
                                  }}
                                >
                                  <ViewIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Télécharger">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  component="a"
                                  href={resource.file_url || '#'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  disabled={!resource.file_url}
                                  onClick={() => {
                                    if (resource.file_url) {
                                      setCourses((prevCourses) => prevCourses.map((course) => ({
                                        ...course,
                                        chapters: (course.chapters || []).map((chapter) => ({
                                          ...chapter,
                                          resources: (chapter.resources || []).map((item) => item.id === resource.id
                                            ? { ...item, has_download: true, has_view: true, status: item.is_favorite ? 'favorite' : 'downloaded' }
                                            : item)
                                        }))
                                      })));
                                      recordResourceInteraction(resource.id, authState.user?.id, 'download').catch(() => {});
                                    }
                                  }}
                                >
                                  <DownloadIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </ListItemSecondaryAction>
                        </ListItem>
                      </React.Fragment>
                    );
                  })}
                  {resources.length === 0 && (
                    <ListItem>
                      <ListItemText primary={<Typography variant="body2" color="text.secondary" align="center">Aucun document dans ce chapitre</Typography>} />
                    </ListItem>
                  )}
                </List>
              </Paper>
            );
          })}
        </>
      )}
    </Box>
  );
};

export default StudentCoursesPage;
