import React, { useEffect, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  Link,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  AutoStories as AutoStoriesIcon,
  Book as BookIcon,
  CalendarMonth as CalendarMonthIcon,
  ChevronRight as ChevronRightIcon,
  Description as DocIcon,
  Download as DownloadIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  FolderOpen as FolderIcon,
  MenuBook as MenuBookIcon,
  PictureAsPdf as PdfIcon,
  School as SchoolIcon,
  Search as SearchIcon,
  Slideshow as PresentationIcon,
  Tune as TuneIcon,
  VideoLibrary as VideoIcon,
  Visibility as ViewIcon,
  Archive as ArchiveIcon,
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
  getUserFavorites,
} from '@/api/courses';

const PAGE_TONES = {
  navy: '#0b2f5b',
  royal: '#15508d',
  sky: '#2a84c6',
  gold: '#d7ab53',
  text: '#17324d',
  border: 'rgba(11, 47, 91, 0.08)',
  surface: '#f4f8fc',
  surfaceStrong: '#edf3fa',
};

const FILE_META = {
  pdf: { icon: PdfIcon, label: 'PDF', color: '#c0392b' },
  video: { icon: VideoIcon, label: 'Vidéo', color: '#1565c0' },
  presentation: { icon: PresentationIcon, label: 'Présentation', color: '#ef6c00' },
  archive: { icon: ArchiveIcon, label: 'Archive', color: '#00796b' },
  doc: { icon: DocIcon, label: 'Document', color: '#546e7a' },
};

const STATUS_META = {
  new: { label: 'Nouveau', color: 'error' },
  read: { label: 'Consulté', color: 'default' },
  downloaded: { label: 'Téléchargé', color: 'success' },
  favorite: { label: 'Favori', color: 'warning' },
};

const RESOURCE_REACTIONS = [
  { emoji: '👍', label: 'Utile' },
  { emoji: '🔥', label: 'Très utile' },
  { emoji: '💡', label: 'À améliorer' },
];

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / 1048576).toFixed(1)} Mo`;
};

const isRecentResource = (value) => {
  if (!value) {
    return false;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return Date.now() - date.getTime() < 7 * 24 * 60 * 60 * 1000;
};

const formatDateLabel = (value) => {
  if (!value) {
    return 'Date indisponible';
  }

  try {
    return format(new Date(value), 'dd MMM yyyy', { locale: fr });
  } catch {
    return value;
  }
};

const getFileMeta = (type) => FILE_META[type] || FILE_META.doc;

/**
 * Page Espace Cours & Ressources Pédagogiques — ESGIS Campus §3.2
 */
const StudentCoursesPage = () => {
  const { authState } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
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
              chaptersData: (await getCourseChaptersAndResources(course.id)).data || [],
            }))
          );

          const allResourceIds = chapterResults.flatMap(({ chaptersData }) =>
            (chaptersData || []).flatMap((chapter) => (chapter.resources || []).map((resource) => resource.id))
          );
          const { data: interactionMap } = await getUserResourceInteractions(allResourceIds, authState.user?.id);

          const formatted = data.map((course) => {
            const chapterEntry = chapterResults.find((entry) => entry.courseId === course.id);
            const chaptersData = chapterEntry?.chaptersData || [];

            return {
              id: course.id,
              code: course.code,
              name: course.name,
              credits: course.credits,
              professor: course.professeur?.full_name || '-',
              semester: course.semester === 1 ? 'S1' : course.semester === 2 ? 'S2' : '-',
              chapters: (chaptersData || []).map((chapter) => ({
                id: chapter.id,
                name: chapter.name,
                resources: (chapter.resources || []).map((resource) => ({
                  ...(interactionMap?.[resource.id] || {}),
                  id: resource.id,
                  title: resource.title,
                  type: resource.file_type || 'pdf',
                  size: resource.file_size || 0,
                  date: resource.created_at,
                  downloads: resource.downloads_count || 0,
                  professor: resource.uploaded_by?.full_name || course.professeur?.full_name || '-',
                  file_url: resource.file_url,
                  status: interactionMap?.[resource.id]?.is_favorite
                    ? 'favorite'
                    : interactionMap?.[resource.id]?.has_download
                      ? 'downloaded'
                      : interactionMap?.[resource.id]?.has_view
                        ? 'read'
                        : 'new',
                })),
              })),
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

        const { data: favs } = await getUserFavorites(authState.user?.id);
        if (favs) {
          setFavorites(new Set(favs));
        }
      } catch (error) {
        console.error('Erreur chargement cours:', error);
        setLoadError('Impossible de charger vos cours pour le moment.');
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, [authState.user?.id]);

  const getAllResources = (course) => {
    const resources = [];
    (course?.chapters || []).forEach((chapter) => {
      (chapter.resources || []).forEach((resource) => {
        resources.push({ ...resource, chapter: chapter.name });
      });
    });
    return resources;
  };

  const summarizeCourse = (course) => {
    const resources = getAllResources(course);
    const latestResourceDate = resources.reduce((latest, resource) => {
      if (!resource.date) {
        return latest;
      }

      if (!latest) {
        return resource.date;
      }

      return new Date(resource.date) > new Date(latest) ? resource.date : latest;
    }, null);

    return {
      resourcesCount: resources.length,
      chaptersCount: (course?.chapters || []).length,
      newCount: resources.filter((resource) => isRecentResource(resource.date)).length,
      viewedCount: resources.filter((resource) => resource.has_view || resource.has_download).length,
      favoriteCount: resources.filter((resource) => favorites.has(resource.id) || resource.is_favorite).length,
      latestResourceDate,
    };
  };

  const updateResourceInCourses = (resourceId, updater) => {
    setCourses((previousCourses) =>
      previousCourses.map((course) => ({
        ...course,
        chapters: (course.chapters || []).map((chapter) => ({
          ...chapter,
          resources: (chapter.resources || []).map((resource) =>
            resource.id === resourceId ? updater(resource) : resource
          ),
        })),
      }))
    );
  };

  const resolveStatus = (resource, overrides = {}) => {
    const nextFavorite = overrides.is_favorite ?? resource.is_favorite ?? favorites.has(resource.id);
    const nextDownloaded = overrides.has_download ?? resource.has_download;
    const nextViewed = overrides.has_view ?? resource.has_view;

    if (nextFavorite) {
      return 'favorite';
    }
    if (nextDownloaded) {
      return 'downloaded';
    }
    if (nextViewed) {
      return 'read';
    }
    return 'new';
  };

  const toggleFavorite = async (resourceId) => {
    const isCurrentlyFavorite = favorites.has(resourceId);

    setFavorites((previous) => {
      const next = new Set(previous);
      if (next.has(resourceId)) {
        next.delete(resourceId);
      } else {
        next.add(resourceId);
      }
      return next;
    });

    updateResourceInCourses(resourceId, (resource) => {
      const nextFavorite = !isCurrentlyFavorite;
      return {
        ...resource,
        is_favorite: nextFavorite,
        status: resolveStatus(resource, { is_favorite: nextFavorite }),
      };
    });

    if (isCurrentlyFavorite) {
      await removeResourceInteraction(resourceId, authState.user?.id, 'favorite').catch(() => {});
    } else {
      await recordResourceInteraction(resourceId, authState.user?.id, 'favorite').catch(() => {});
    }
  };

  const setReaction = async (resourceId, reaction) => {
    setReactions((previous) => ({ ...previous, [resourceId]: reaction }));
    if (reaction) {
      await recordResourceInteraction(resourceId, authState.user?.id, 'reaction', reaction).catch(() => {});
    }
  };

  const handlePreviewResource = (resource) => {
    if (!resource.file_url) {
      return;
    }

    updateResourceInCourses(resource.id, (current) => ({
      ...current,
      has_view: true,
      status: resolveStatus(current, { has_view: true }),
    }));

    recordResourceInteraction(resource.id, authState.user?.id, 'view').catch(() => {});
  };

  const handleDownloadResource = (resource) => {
    if (!resource.file_url) {
      return;
    }

    updateResourceInCourses(resource.id, (current) => ({
      ...current,
      has_view: true,
      has_download: true,
      downloads: Number(current.downloads || 0) + 1,
      status: resolveStatus(current, { has_view: true, has_download: true }),
    }));

    recordResourceInteraction(resource.id, authState.user?.id, 'download').catch(() => {});
  };

  const resetFilters = () => {
    setSearch('');
    setFilterSemester('');
    setFilterStatus('');
  };

  const searchValue = search.trim().toLowerCase();
  const allCourseResources = courses.flatMap((course) => getAllResources(course));
  const selectedCourse = courses.find((course) => course.id === selectedCourseId) || null;
  const selectedCourseSummary = selectedCourse ? summarizeCourse(selectedCourse) : null;
  const activeFilterCount = [search, filterSemester, filterStatus].filter(Boolean).length;

  const filteredCourses = courses.filter((course) => {
    if (filterSemester && course.semester !== filterSemester) {
      return false;
    }

    const resources = getAllResources(course);
    const matchesSearch =
      !searchValue ||
      course.name.toLowerCase().includes(searchValue) ||
      course.code.toLowerCase().includes(searchValue) ||
      course.professor.toLowerCase().includes(searchValue) ||
      resources.some(
        (resource) =>
          resource.title.toLowerCase().includes(searchValue) ||
          resource.chapter.toLowerCase().includes(searchValue)
      );

    if (!matchesSearch) {
      return false;
    }

    if (filterStatus) {
      const matchesStatus = resources.some((resource) =>
        filterStatus === 'favorite' ? favorites.has(resource.id) : resource.status === filterStatus
      );

      if (!matchesStatus) {
        return false;
      }
    }

    return true;
  });

  const visibleChapters = selectedCourse
    ? (selectedCourse.chapters || [])
        .map((chapter) => {
          const visibleResources = (chapter.resources || []).filter((resource) => {
            if (searchValue && !resource.title.toLowerCase().includes(searchValue)) {
              return false;
            }

            if (filterStatus === 'favorite') {
              return favorites.has(resource.id);
            }

            if (filterStatus && resource.status !== filterStatus) {
              return false;
            }

            return true;
          });

          if ((searchValue || filterStatus) && visibleResources.length === 0) {
            return null;
          }

          return { ...chapter, visibleResources };
        })
        .filter(Boolean)
    : [];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: { xs: 1.5, md: 2.5 },
        minHeight: '100%',
        background: 'linear-gradient(180deg, #f6f9fc 0%, #eef4fb 46%, #ffffff 100%)',
      }}
    >
      {loadError && (
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: 3 }}>
          {loadError}
        </Alert>
      )}

      {!selectedCourse ? (
        <>
          <Paper
            elevation={0}
            sx={{
              position: 'relative',
              overflow: 'hidden',
              mb: 3,
              p: { xs: 3, md: 4 },
              borderRadius: 6,
              color: 'common.white',
              background: `linear-gradient(135deg, ${PAGE_TONES.navy} 0%, ${PAGE_TONES.royal} 52%, ${PAGE_TONES.sky} 100%)`,
              boxShadow: '0 28px 60px rgba(11, 47, 91, 0.18)',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: -70,
                right: -40,
                width: 220,
                height: 220,
                borderRadius: '50%',
                backgroundColor: alpha('#ffffff', 0.08),
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: -110,
                left: -20,
                width: 260,
                height: 260,
                borderRadius: '50%',
                backgroundColor: alpha(PAGE_TONES.gold, 0.12),
              }}
            />

            <Stack spacing={3} sx={{ position: 'relative', zIndex: 1 }}>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={2}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', md: 'center' }}
              >
                <Stack spacing={1.25}>
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <Avatar
                      variant="rounded"
                      sx={{
                        width: 56,
                        height: 56,
                        bgcolor: alpha('#ffffff', 0.16),
                        color: 'common.white',
                        borderRadius: 4,
                      }}
                    >
                      <BookIcon />
                    </Avatar>
                    <Box>
                      <Typography
                        variant="overline"
                        sx={{ letterSpacing: '0.22em', color: alpha('#ffffff', 0.78), fontWeight: 700 }}
                      >
                        Espace pédagogique
                      </Typography>
                      <Typography variant="h4" fontWeight={800} sx={{ lineHeight: 1.1 }}>
                        Mes Cours & Ressources
                      </Typography>
                    </Box>
                  </Stack>
                  <Typography sx={{ maxWidth: 760, color: alpha('#ffffff', 0.82) }}>
                    Retrouvez vos supports de cours, vos nouveautés et vos documents favoris dans un espace
                    plus clair, plus lisible et mieux organisé.
                  </Typography>
                </Stack>

                <Chip
                  label={`${activeFilterCount} filtre${activeFilterCount > 1 ? 's' : ''} actif${activeFilterCount > 1 ? 's' : ''}`}
                  icon={<TuneIcon />}
                  sx={{
                    color: 'common.white',
                    bgcolor: alpha('#ffffff', 0.12),
                    borderRadius: 3,
                    '& .MuiChip-icon': { color: 'common.white' },
                  }}
                />
              </Stack>

              <Grid container spacing={2}>
                {[
                  { label: 'Cours inscrits', value: courses.length, icon: <SchoolIcon fontSize="small" /> },
                  { label: 'Ressources disponibles', value: allCourseResources.length, icon: <AutoStoriesIcon fontSize="small" /> },
                  { label: 'Documents récents', value: allCourseResources.filter((resource) => isRecentResource(resource.date)).length, icon: <CalendarMonthIcon fontSize="small" /> },
                  { label: 'Favoris enregistrés', value: favorites.size, icon: <FavoriteIcon fontSize="small" /> },
                ].map((metric) => (
                  <Grid item xs={6} md={3} key={metric.label}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 4,
                        bgcolor: alpha('#ffffff', 0.1),
                        color: 'common.white',
                        border: `1px solid ${alpha('#ffffff', 0.1)}`,
                        backdropFilter: 'blur(6px)',
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        {metric.icon}
                        <Typography variant="body2" sx={{ color: alpha('#ffffff', 0.8) }}>
                          {metric.label}
                        </Typography>
                      </Stack>
                      <Typography variant="h5" fontWeight={800}>
                        {metric.value}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Stack>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, md: 2.5 },
              mb: 3,
              borderRadius: 5,
              border: `1px solid ${PAGE_TONES.border}`,
              boxShadow: '0 16px 35px rgba(11, 47, 91, 0.06)',
            }}
          >
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', md: 'center' }}
              spacing={1.5}
              sx={{ mb: 2.5 }}
            >
              <Box>
                <Typography variant="h6" fontWeight={800} sx={{ color: PAGE_TONES.text }}>
                  Rechercher et filtrer
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Filtrez vos cours ou vos documents pour retrouver plus vite le bon support.
                </Typography>
              </Box>
              <Button
                onClick={resetFilters}
                disabled={!activeFilterCount}
                variant="outlined"
                sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 700 }}
              >
                Réinitialiser
              </Button>
            </Stack>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  placeholder="Rechercher un cours, un document, un chapitre..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: 3, bgcolor: PAGE_TONES.surface },
                  }}
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Semestre</InputLabel>
                  <Select
                    value={filterSemester}
                    label="Semestre"
                    onChange={(event) => setFilterSemester(event.target.value)}
                    sx={{ borderRadius: 3, bgcolor: PAGE_TONES.surface }}
                  >
                    <MenuItem value="">Tous</MenuItem>
                    <MenuItem value="S1">Semestre 1</MenuItem>
                    <MenuItem value="S2">Semestre 2</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Statut</InputLabel>
                  <Select
                    value={filterStatus}
                    label="Statut"
                    onChange={(event) => setFilterStatus(event.target.value)}
                    sx={{ borderRadius: 3, bgcolor: PAGE_TONES.surface }}
                  >
                    <MenuItem value="">Tous</MenuItem>
                    <MenuItem value="new">Nouveau</MenuItem>
                    <MenuItem value="read">Consulté</MenuItem>
                    <MenuItem value="downloaded">Téléchargé</MenuItem>
                    <MenuItem value="favorite">Favori</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>

          {filteredCourses.length > 0 ? (
            <Grid container spacing={3}>
              {filteredCourses.map((course) => {
                const summary = summarizeCourse(course);

                return (
                  <Grid item xs={12} md={6} xl={4} key={course.id}>
                    <Card
                      elevation={0}
                      sx={{
                        height: '100%',
                        borderRadius: 5,
                        border: `1px solid ${PAGE_TONES.border}`,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
                        boxShadow: '0 16px 32px rgba(11, 47, 91, 0.05)',
                        '&:hover': {
                          transform: 'translateY(-6px)',
                          boxShadow: '0 22px 40px rgba(11, 47, 91, 0.12)',
                          borderColor: alpha(PAGE_TONES.royal, 0.3),
                        },
                      }}
                      onClick={() => setSelectedCourseId(course.id)}
                    >
                      <Box
                        sx={{
                          p: 2.5,
                          color: 'common.white',
                          background: `linear-gradient(140deg, ${PAGE_TONES.navy} 0%, ${PAGE_TONES.royal} 58%, ${PAGE_TONES.sky} 100%)`,
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1.5}>
                          <Chip
                            label={course.code}
                            size="small"
                            sx={{
                              bgcolor: alpha('#ffffff', 0.14),
                              color: 'common.white',
                              borderRadius: 2.5,
                              fontWeight: 700,
                            }}
                          />
                          <Chip
                            label={course.semester}
                            size="small"
                            sx={{
                              bgcolor: alpha(PAGE_TONES.gold, 0.2),
                              color: 'common.white',
                              borderRadius: 2.5,
                              fontWeight: 700,
                            }}
                          />
                        </Stack>

                        <Typography variant="h6" fontWeight={800} sx={{ mt: 2, lineHeight: 1.25 }}>
                          {course.name}
                        </Typography>

                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 2.5 }}>
                          <Avatar
                            variant="rounded"
                            sx={{
                              width: 46,
                              height: 46,
                              borderRadius: 3,
                              bgcolor: alpha('#ffffff', 0.12),
                              color: 'common.white',
                            }}
                          >
                            <MenuBookIcon />
                          </Avatar>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography fontWeight={700} noWrap>
                              {course.professor}
                            </Typography>
                            <Typography variant="body2" sx={{ color: alpha('#ffffff', 0.75) }}>
                              Enseignant référent
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>

                      <CardContent sx={{ p: 3 }}>
                        <Grid container spacing={1.5}>
                          {[
                            { label: 'Ressources', value: summary.resourcesCount },
                            { label: 'Chapitres', value: summary.chaptersCount },
                            { label: 'Nouveautés', value: summary.newCount },
                            { label: 'Consultés', value: summary.viewedCount },
                          ].map((item) => (
                            <Grid item xs={6} key={item.label}>
                              <Paper
                                elevation={0}
                                sx={{
                                  p: 1.5,
                                  borderRadius: 3,
                                  bgcolor: PAGE_TONES.surface,
                                  border: `1px solid ${alpha(PAGE_TONES.navy, 0.05)}`,
                                }}
                              >
                                <Typography variant="caption" color="text.secondary">
                                  {item.label}
                                </Typography>
                                <Typography variant="h6" fontWeight={800} sx={{ color: PAGE_TONES.text }}>
                                  {item.value}
                                </Typography>
                              </Paper>
                            </Grid>
                          ))}
                        </Grid>

                        <Paper
                          elevation={0}
                          sx={{
                            mt: 2.5,
                            p: 2,
                            borderRadius: 4,
                            bgcolor: alpha(PAGE_TONES.gold, 0.09),
                            border: `1px solid ${alpha(PAGE_TONES.gold, 0.2)}`,
                          }}
                        >
                          <Typography variant="body2" fontWeight={700} sx={{ color: PAGE_TONES.text }}>
                            {course.credits} crédits ECTS
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {summary.latestResourceDate
                              ? `Dernière mise à jour le ${formatDateLabel(summary.latestResourceDate)}`
                              : 'Aucune mise à jour récente'}
                          </Typography>
                        </Paper>

                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          spacing={1.5}
                          sx={{ mt: 2.5 }}
                        >
                          <Chip
                            icon={<FavoriteIcon sx={{ fontSize: 16 }} />}
                            label={`${summary.favoriteCount} favori${summary.favoriteCount > 1 ? 's' : ''}`}
                            size="small"
                            sx={{
                              bgcolor: alpha(PAGE_TONES.royal, 0.08),
                              color: PAGE_TONES.royal,
                              borderRadius: 2.5,
                            }}
                          />
                          <Button
                            variant="contained"
                            endIcon={<ChevronRightIcon />}
                            sx={{
                              borderRadius: 3,
                              textTransform: 'none',
                              fontWeight: 700,
                              px: 2,
                              bgcolor: PAGE_TONES.navy,
                              '&:hover': { bgcolor: PAGE_TONES.royal },
                            }}
                          >
                            Ouvrir le cours
                          </Button>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          ) : (
            <Paper
              elevation={0}
              sx={{
                p: 5,
                borderRadius: 5,
                textAlign: 'center',
                border: `1px dashed ${alpha(PAGE_TONES.navy, 0.18)}`,
                bgcolor: alpha('#ffffff', 0.72),
              }}
            >
              <Avatar
                sx={{
                  mx: 'auto',
                  mb: 2,
                  width: 56,
                  height: 56,
                  bgcolor: alpha(PAGE_TONES.royal, 0.08),
                  color: PAGE_TONES.royal,
                }}
              >
                <BookIcon />
              </Avatar>
              <Typography variant="h6" fontWeight={800} sx={{ color: PAGE_TONES.text, mb: 1 }}>
                Aucun résultat avec ces critères
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                Essayez d’élargir votre recherche ou de réinitialiser les filtres appliqués.
              </Typography>
              <Button variant="outlined" onClick={resetFilters} sx={{ borderRadius: 3, textTransform: 'none' }}>
                Réinitialiser les filtres
              </Button>
            </Paper>
          )}
        </>
      ) : (
        <>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <IconButton
              onClick={() => setSelectedCourseId(null)}
              sx={{
                bgcolor: alpha(PAGE_TONES.navy, 0.05),
                '&:hover': { bgcolor: alpha(PAGE_TONES.navy, 0.1) },
              }}
            >
              <BackIcon />
            </IconButton>
            <Breadcrumbs>
              <Link
                underline="hover"
                color="inherit"
                sx={{ cursor: 'pointer' }}
                onClick={() => setSelectedCourseId(null)}
              >
                Mes Cours
              </Link>
              <Typography color="text.primary" fontWeight={700}>
                {selectedCourse.name}
              </Typography>
            </Breadcrumbs>
          </Stack>

          <Paper
            elevation={0}
            sx={{
              position: 'relative',
              overflow: 'hidden',
              mb: 3,
              p: { xs: 2.5, md: 3.5 },
              borderRadius: 5,
              color: 'common.white',
              background: `linear-gradient(135deg, ${PAGE_TONES.navy} 0%, ${PAGE_TONES.royal} 58%, ${PAGE_TONES.sky} 100%)`,
              boxShadow: '0 22px 48px rgba(11, 47, 91, 0.16)',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: -100,
                right: -80,
                width: 240,
                height: 240,
                borderRadius: '50%',
                backgroundColor: alpha('#ffffff', 0.08),
              }}
            />

            <Grid container spacing={3} sx={{ position: 'relative', zIndex: 1 }}>
              <Grid item xs={12} lg={7}>
                <Typography variant="overline" sx={{ letterSpacing: '0.18em', color: alpha('#ffffff', 0.72) }}>
                  Cours actif
                </Typography>
                <Typography variant="h4" fontWeight={800} sx={{ lineHeight: 1.15, mb: 1.25 }}>
                  {selectedCourse.name}
                </Typography>
                <Typography sx={{ color: alpha('#ffffff', 0.82), mb: 2.5 }}>
                  {selectedCourse.code} • {selectedCourse.professor} • {selectedCourse.semester}
                </Typography>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} useFlexGap flexWrap="wrap">
                  <Chip
                    label={`${selectedCourse.credits} crédits`}
                    sx={{ bgcolor: alpha('#ffffff', 0.12), color: 'common.white', borderRadius: 3 }}
                  />
                  <Chip
                    label={`${selectedCourseSummary?.chaptersCount || 0} chapitres`}
                    sx={{ bgcolor: alpha('#ffffff', 0.12), color: 'common.white', borderRadius: 3 }}
                  />
                  <Chip
                    label={`${selectedCourseSummary?.resourcesCount || 0} ressources`}
                    sx={{ bgcolor: alpha('#ffffff', 0.12), color: 'common.white', borderRadius: 3 }}
                  />
                </Stack>
              </Grid>

              <Grid item xs={12} lg={5}>
                <Grid container spacing={1.5}>
                  {[
                    { label: 'Récents', value: selectedCourseSummary?.newCount || 0 },
                    { label: 'Consultés', value: selectedCourseSummary?.viewedCount || 0 },
                    { label: 'Favoris', value: selectedCourseSummary?.favoriteCount || 0 },
                    { label: 'Dernière mise à jour', value: selectedCourseSummary?.latestResourceDate ? formatDateLabel(selectedCourseSummary.latestResourceDate) : 'Aucune' },
                  ].map((item) => (
                    <Grid item xs={6} key={item.label}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 1.75,
                          height: '100%',
                          borderRadius: 3.5,
                          bgcolor: alpha('#ffffff', 0.1),
                          color: 'common.white',
                        }}
                      >
                        <Typography variant="caption" sx={{ color: alpha('#ffffff', 0.74) }}>
                          {item.label}
                        </Typography>
                        <Typography
                          variant={item.label === 'Dernière mise à jour' ? 'body2' : 'h6'}
                          fontWeight={800}
                          sx={{ mt: 0.5 }}
                        >
                          {item.value}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, md: 2.5 },
              mb: 3,
              borderRadius: 5,
              border: `1px solid ${PAGE_TONES.border}`,
              boxShadow: '0 16px 35px rgba(11, 47, 91, 0.06)',
            }}
          >
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', md: 'center' }}
              spacing={1.5}
              sx={{ mb: 2.5 }}
            >
              <Box>
                <Typography variant="h6" fontWeight={800} sx={{ color: PAGE_TONES.text }}>
                  Explorer les ressources du cours
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Recherchez un support précis, filtrez par statut ou accédez directement à l’aperçu et au téléchargement.
                </Typography>
              </Box>
              <Button
                onClick={resetFilters}
                disabled={!activeFilterCount}
                variant="outlined"
                sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 700 }}
              >
                Réinitialiser
              </Button>
            </Stack>

            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  placeholder="Rechercher un document dans ce cours..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: 3, bgcolor: PAGE_TONES.surface },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Statut</InputLabel>
                  <Select
                    value={filterStatus}
                    label="Statut"
                    onChange={(event) => setFilterStatus(event.target.value)}
                    sx={{ borderRadius: 3, bgcolor: PAGE_TONES.surface }}
                  >
                    <MenuItem value="">Tous</MenuItem>
                    <MenuItem value="new">Nouveau</MenuItem>
                    <MenuItem value="read">Consulté</MenuItem>
                    <MenuItem value="downloaded">Téléchargé</MenuItem>
                    <MenuItem value="favorite">Favori</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>

          {visibleChapters.length > 0 ? (
            <Stack spacing={2.5}>
              {visibleChapters.map((chapter) => (
                <Paper
                  key={chapter.id}
                  elevation={0}
                  sx={{
                    overflow: 'hidden',
                    borderRadius: 5,
                    border: `1px solid ${PAGE_TONES.border}`,
                    boxShadow: '0 16px 34px rgba(11, 47, 91, 0.06)',
                  }}
                >
                  <Box
                    sx={{
                      px: 3,
                      py: 2.25,
                      color: 'common.white',
                      background: `linear-gradient(135deg, ${PAGE_TONES.navy} 0%, ${PAGE_TONES.royal} 100%)`,
                    }}
                  >
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      justifyContent="space-between"
                      alignItems={{ xs: 'flex-start', sm: 'center' }}
                      spacing={1.5}
                    >
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar
                          variant="rounded"
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 3,
                            bgcolor: alpha('#ffffff', 0.12),
                            color: 'common.white',
                          }}
                        >
                          <FolderIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" fontWeight={800}>
                            {chapter.name}
                          </Typography>
                          <Typography variant="body2" sx={{ color: alpha('#ffffff', 0.74) }}>
                            {chapter.visibleResources.length} document{chapter.visibleResources.length > 1 ? 's' : ''}
                          </Typography>
                        </Box>
                      </Stack>
                      <Chip
                        label={`${chapter.visibleResources.length} ressource${chapter.visibleResources.length > 1 ? 's' : ''}`}
                        sx={{
                          bgcolor: alpha('#ffffff', 0.12),
                          color: 'common.white',
                          borderRadius: 3,
                        }}
                      />
                    </Stack>
                  </Box>

                  {chapter.visibleResources.length > 0 ? (
                    <Box sx={{ p: { xs: 2, md: 2.5 } }}>
                      <Grid container spacing={2}>
                        {chapter.visibleResources.map((resource) => {
                          const fileMeta = getFileMeta(resource.type);
                          const FileIcon = fileMeta.icon;
                          const statusMeta = STATUS_META[resource.status] || STATUS_META.read;
                          const isFavorite = favorites.has(resource.id);

                          return (
                            <Grid item xs={12} md={6} xl={4} key={resource.id}>
                              <Card
                                elevation={0}
                                sx={{
                                  height: '100%',
                                  borderRadius: 4,
                                  border: `1px solid ${alpha(PAGE_TONES.navy, 0.08)}`,
                                  boxShadow: '0 10px 24px rgba(11, 47, 91, 0.04)',
                                }}
                              >
                                <CardContent
                                  sx={{
                                    p: 2.25,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 2,
                                    height: '100%',
                                  }}
                                >
                                  <Stack direction="row" justifyContent="space-between" spacing={1.5} alignItems="flex-start">
                                    <Stack direction="row" spacing={1.5} sx={{ minWidth: 0 }}>
                                      <Avatar
                                        variant="rounded"
                                        sx={{
                                          width: 46,
                                          height: 46,
                                          borderRadius: 3,
                                          bgcolor: alpha(fileMeta.color, 0.12),
                                          color: fileMeta.color,
                                        }}
                                      >
                                        <FileIcon />
                                      </Avatar>
                                      <Box sx={{ minWidth: 0 }}>
                                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
                                          <Chip
                                            size="small"
                                            label={statusMeta.label}
                                            color={statusMeta.color}
                                            sx={{ borderRadius: 2 }}
                                          />
                                          <Chip
                                            size="small"
                                            label={fileMeta.label}
                                            sx={{
                                              borderRadius: 2,
                                              bgcolor: alpha(fileMeta.color, 0.08),
                                              color: fileMeta.color,
                                              fontWeight: 700,
                                            }}
                                          />
                                        </Stack>
                                        <Typography
                                          variant="subtitle1"
                                          fontWeight={800}
                                          sx={{ color: PAGE_TONES.text, lineHeight: 1.35 }}
                                        >
                                          {resource.title}
                                        </Typography>
                                      </Box>
                                    </Stack>

                                    <Tooltip title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}>
                                      <IconButton
                                        onClick={() => toggleFavorite(resource.id)}
                                        sx={{
                                          bgcolor: alpha(PAGE_TONES.navy, 0.04),
                                          '&:hover': { bgcolor: alpha(PAGE_TONES.navy, 0.08) },
                                        }}
                                      >
                                        {isFavorite ? (
                                          <FavoriteIcon color="error" fontSize="small" />
                                        ) : (
                                          <FavoriteBorderIcon fontSize="small" />
                                        )}
                                      </IconButton>
                                    </Tooltip>
                                  </Stack>

                                  <Stack direction="row" flexWrap="wrap" useFlexGap gap={1}>
                                    <Chip
                                      size="small"
                                      icon={<MenuBookIcon sx={{ fontSize: 16 }} />}
                                      label={resource.professor}
                                      sx={{ borderRadius: 2, maxWidth: '100%' }}
                                    />
                                    <Chip
                                      size="small"
                                      icon={<CalendarMonthIcon sx={{ fontSize: 16 }} />}
                                      label={formatDateLabel(resource.date)}
                                      sx={{ borderRadius: 2 }}
                                    />
                                    <Chip
                                      size="small"
                                      icon={<AutoStoriesIcon sx={{ fontSize: 16 }} />}
                                      label={formatSize(resource.size)}
                                      sx={{ borderRadius: 2 }}
                                    />
                                  </Stack>

                                  <Paper
                                    elevation={0}
                                    sx={{
                                      p: 1.5,
                                      borderRadius: 3,
                                      bgcolor: alpha(PAGE_TONES.royal, 0.05),
                                      border: `1px solid ${alpha(PAGE_TONES.royal, 0.07)}`,
                                    }}
                                  >
                                    <Typography variant="caption" color="text.secondary">
                                      Activité sur le document
                                    </Typography>
                                    <Typography variant="body2" fontWeight={700} sx={{ color: PAGE_TONES.text }}>
                                      {resource.downloads} téléchargement{resource.downloads > 1 ? 's' : ''}
                                    </Typography>
                                  </Paper>

                                  <Divider />

                                  <Stack direction="row" spacing={0.5} alignItems="center">
                                    {RESOURCE_REACTIONS.map((reactionItem) => (
                                      <Tooltip key={reactionItem.emoji} title={reactionItem.label}>
                                        <IconButton
                                          size="small"
                                          sx={{
                                            opacity: reactions[resource.id] === reactionItem.emoji ? 1 : 0.35,
                                            bgcolor: alpha(PAGE_TONES.navy, 0.03),
                                            '&:hover': { bgcolor: alpha(PAGE_TONES.navy, 0.07) },
                                          }}
                                          onClick={() =>
                                            setReaction(
                                              resource.id,
                                              reactions[resource.id] === reactionItem.emoji ? null : reactionItem.emoji
                                            )
                                          }
                                        >
                                          <Typography component="span" sx={{ fontSize: '1rem' }}>
                                            {reactionItem.emoji}
                                          </Typography>
                                        </IconButton>
                                      </Tooltip>
                                    ))}
                                  </Stack>

                                  <Stack
                                    direction={{ xs: 'column', sm: 'row' }}
                                    spacing={1}
                                    sx={{ mt: 'auto' }}
                                  >
                                    <Button
                                      fullWidth
                                      variant="outlined"
                                      startIcon={<ViewIcon />}
                                      component="a"
                                      href={resource.file_url || '#'}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      disabled={!resource.file_url}
                                      onClick={() => handlePreviewResource(resource)}
                                      sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 700 }}
                                    >
                                      Prévisualiser
                                    </Button>
                                    <Button
                                      fullWidth
                                      variant="contained"
                                      startIcon={<DownloadIcon />}
                                      component="a"
                                      href={resource.file_url || '#'}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      disabled={!resource.file_url}
                                      onClick={() => handleDownloadResource(resource)}
                                      sx={{
                                        borderRadius: 3,
                                        textTransform: 'none',
                                        fontWeight: 700,
                                        bgcolor: PAGE_TONES.navy,
                                        '&:hover': { bgcolor: PAGE_TONES.royal },
                                      }}
                                    >
                                      Télécharger
                                    </Button>
                                  </Stack>
                                </CardContent>
                              </Card>
                            </Grid>
                          );
                        })}
                      </Grid>
                    </Box>
                  ) : (
                    <Box sx={{ p: 3 }}>
                      <Typography color="text.secondary">
                        Aucun document n’est disponible dans ce chapitre pour le moment.
                      </Typography>
                    </Box>
                  )}
                </Paper>
              ))}
            </Stack>
          ) : (
            <Paper
              elevation={0}
              sx={{
                p: 5,
                borderRadius: 5,
                textAlign: 'center',
                border: `1px dashed ${alpha(PAGE_TONES.navy, 0.18)}`,
                bgcolor: alpha('#ffffff', 0.72),
              }}
            >
              <Avatar
                sx={{
                  mx: 'auto',
                  mb: 2,
                  width: 56,
                  height: 56,
                  bgcolor: alpha(PAGE_TONES.royal, 0.08),
                  color: PAGE_TONES.royal,
                }}
              >
                <FolderIcon />
              </Avatar>
              <Typography variant="h6" fontWeight={800} sx={{ color: PAGE_TONES.text, mb: 1 }}>
                Aucune ressource ne correspond aux filtres actuels
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                Modifiez vos critères de recherche ou réinitialisez les filtres pour afficher l’ensemble du contenu du cours.
              </Typography>
              <Button variant="outlined" onClick={resetFilters} sx={{ borderRadius: 3, textTransform: 'none' }}>
                Réinitialiser les filtres
              </Button>
            </Paper>
          )}
        </>
      )}
    </Box>
  );
};

export default StudentCoursesPage;
