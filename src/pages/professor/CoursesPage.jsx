import React, { useEffect, useMemo, useState } from 'react';
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
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  TextField,
  Typography,
  Checkbox
} from '@mui/material';
import {
  AutoStories as AutoStoriesIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  FolderOpen as FolderOpenIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  createCourseChapter,
  deleteCourseResource,
  ensureSyllabusChapter,
  getProfessorCourseChaptersAndResources,
  getProfessorManagedCourses,
  SYLLABUS_CHAPTER_NAME,
  updateCourseResource,
  uploadResource
} from '@/api/courses';

const emptyUploadForm = {
  title: '',
  description: '',
  chapterId: '',
  file: null,
  publicationState: 'published',
  publishAt: '',
  isSyllabus: false
};

const toDateTimeLocalValue = (value) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 16);
};

const getPublicationStateLabel = (state) => {
  switch (state) {
    case 'draft':
      return 'Brouillon';
    case 'scheduled':
      return 'Programme';
    case 'archived':
      return 'Archive';
    default:
      return 'Publie';
  }
};

const getPublicationStateColor = (state) => {
  switch (state) {
    case 'draft':
      return 'default';
    case 'scheduled':
      return 'warning';
    case 'archived':
      return 'secondary';
    default:
      return 'success';
  }
};

const formatDateTime = (value) => {
  if (!value) {
    return '';
  }

  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(value));
  } catch (error) {
    console.error('formatDateTime:', error);
    return value;
  }
};

const ProfessorCoursesPage = () => {
  const { authState } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [chapterName, setChapterName] = useState('');
  const [uploadForm, setUploadForm] = useState(emptyUploadForm);
  const [editDialog, setEditDialog] = useState({ open: false, resource: null });
  const [editForm, setEditForm] = useState(emptyUploadForm);
  const [resourceToDelete, setResourceToDelete] = useState(null);

  useEffect(() => {
    let active = true;

    const loadCourses = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: coursesError } = await getProfessorManagedCourses(authState.profile?.id);

        if (coursesError) {
          throw coursesError;
        }

        if (!active) {
          return;
        }

        const nextCourses = data || [];
        setCourses(nextCourses);

        const requestedCourseId = Number(searchParams.get('course'));
        const initialCourse =
          nextCourses.find((course) => course.id === requestedCourseId) ||
          nextCourses[0] ||
          null;

        setSelectedCourseId(initialCourse?.id ? String(initialCourse.id) : '');
      } catch (loadError) {
        console.error('Erreur chargement cours professeur:', loadError);
        if (active) {
          setCourses([]);
          setError(loadError.message || 'Impossible de charger vos cours.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    if (authState.profile?.id) {
      loadCourses();
    }

    return () => {
      active = false;
    };
  }, [authState.profile?.id, searchParams]);

  useEffect(() => {
    let active = true;

    const loadLibrary = async () => {
      if (!selectedCourseId || !authState.profile?.id) {
        setChapters([]);
        return;
      }

      setLibraryLoading(true);

      try {
        const { data, error: libraryError } = await getProfessorCourseChaptersAndResources(
          Number(selectedCourseId),
          authState.profile.id
        );

        if (libraryError) {
          throw libraryError;
        }

        if (active) {
          setChapters(data || []);
        }
      } catch (libraryError) {
        console.error('Erreur chargement bibliotheque:', libraryError);
        if (active) {
          setChapters([]);
          setError(libraryError.message || 'Impossible de charger les ressources du cours.');
        }
      } finally {
        if (active) {
          setLibraryLoading(false);
        }
      }
    };

    loadLibrary();

    return () => {
      active = false;
    };
  }, [selectedCourseId, authState.profile?.id]);

  const selectedCourse = useMemo(
    () => courses.find((course) => String(course.id) === String(selectedCourseId)) || null,
    [courses, selectedCourseId]
  );

  const allResources = useMemo(
    () => chapters.flatMap((chapter) => chapter.resources || []),
    [chapters]
  );

  const syllabusChapter = useMemo(
    () =>
      chapters.find(
        (chapter) => String(chapter.name || '').trim().toLowerCase() === SYLLABUS_CHAPTER_NAME.toLowerCase()
      ) || null,
    [chapters]
  );

  const stats = useMemo(() => {
    const published = allResources.filter((resource) => resource.publication_state === 'published').length;
    const scheduled = allResources.filter((resource) => resource.publication_state === 'scheduled').length;
    const downloads = allResources.reduce((total, resource) => total + Number(resource.downloads_count || 0), 0);

    return {
      chapters: chapters.length,
      resources: allResources.length,
      published,
      scheduled,
      downloads
    };
  }, [allResources, chapters.length]);

  const chapterOptions = useMemo(
    () => chapters.map((chapter) => ({ id: chapter.id, name: chapter.name })),
    [chapters]
  );

  const syncCourseQueryParam = (courseId) => {
    const nextParams = new URLSearchParams(searchParams);

    if (courseId) {
      nextParams.set('course', String(courseId));
    } else {
      nextParams.delete('course');
    }

    setSearchParams(nextParams, { replace: true });
  };

  const refreshLibrary = async () => {
    if (!selectedCourseId || !authState.profile?.id) {
      return;
    }

    const { data, error: libraryError } = await getProfessorCourseChaptersAndResources(
      Number(selectedCourseId),
      authState.profile.id
    );

    if (libraryError) {
      throw libraryError;
    }

    setChapters(data || []);
  };

  const resolveChapterId = async (form) => {
    if (form.isSyllabus) {
      if (syllabusChapter?.id) {
        return syllabusChapter.id;
      }

      const { data, error: chapterError } = await ensureSyllabusChapter(
        Number(selectedCourseId),
        authState.profile.id
      );

      if (chapterError) {
        throw chapterError;
      }

      return data?.id || null;
    }

    if (!form.chapterId) {
      throw new Error('Selectionnez un chapitre pour cette ressource');
    }

    return form.chapterId;
  };

  const handleCreateChapter = async (name = chapterName) => {
    if (!selectedCourseId) {
      return;
    }

    try {
      const { error: chapterError } = await createCourseChapter({
        courseId: Number(selectedCourseId),
        name,
        professorProfileId: authState.profile.id
      });

      if (chapterError) {
        throw chapterError;
      }

      setChapterName('');
      await refreshLibrary();
      setSuccessMessage('Chapitre ajoute avec succes.');
    } catch (chapterError) {
      console.error('Erreur creation chapitre:', chapterError);
      setError(chapterError.message || 'Impossible de creer le chapitre.');
    }
  };

  const handleUploadResource = async (event) => {
    event.preventDefault();

    if (!selectedCourseId) {
      return;
    }

    try {
      if (uploadForm.publicationState === 'scheduled' && !uploadForm.publishAt) {
        throw new Error('Renseignez une date de publication pour une ressource programmee');
      }

      const chapterId = await resolveChapterId(uploadForm);
      const publishAt =
        uploadForm.publicationState === 'scheduled' && uploadForm.publishAt
          ? new Date(uploadForm.publishAt).toISOString()
          : null;

      const { error: uploadError } = await uploadResource(
        uploadForm.file,
        Number(selectedCourseId),
        chapterId,
        uploadForm.title,
        uploadForm.description,
        authState.profile.id,
        {
          publicationState: uploadForm.publicationState,
          publishAt
        }
      );

      if (uploadError) {
        throw uploadError;
      }

      setUploadForm(emptyUploadForm);
      await refreshLibrary();
      setSuccessMessage('Ressource ajoutee avec succes.');
    } catch (uploadError) {
      console.error('Erreur upload ressource:', uploadError);
      setError(uploadError.message || 'Impossible de deposer la ressource.');
    }
  };

  const openEditDialog = (resource) => {
    setEditDialog({ open: true, resource });
    setEditForm({
      title: resource.title || '',
      description: resource.description || '',
      chapterId: resource.chapter_id || '',
      file: null,
      publicationState: resource.publication_state || 'published',
      publishAt: toDateTimeLocalValue(resource.publish_at),
      isSyllabus: Boolean(resource.is_syllabus)
    });
  };

  const handleSaveResource = async () => {
    if (!editDialog.resource) {
      return;
    }

    try {
      if (editForm.publicationState === 'scheduled' && !editForm.publishAt) {
        throw new Error('Renseignez une date de publication pour une ressource programmee');
      }

      const chapterId = await resolveChapterId(editForm);
      const publishAt =
        editForm.publicationState === 'scheduled' && editForm.publishAt
          ? new Date(editForm.publishAt).toISOString()
          : null;

      const { error: updateError } = await updateCourseResource(
        editDialog.resource.id,
        {
          title: editForm.title,
          description: editForm.description,
          chapterId,
          publicationState: editForm.publicationState,
          publishAt
        },
        authState.profile.id
      );

      if (updateError) {
        throw updateError;
      }

      setEditDialog({ open: false, resource: null });
      setEditForm(emptyUploadForm);
      await refreshLibrary();
      setSuccessMessage('Ressource mise a jour.');
    } catch (updateError) {
      console.error('Erreur mise a jour ressource:', updateError);
      setError(updateError.message || 'Impossible de mettre a jour la ressource.');
    }
  };

  const handleDeleteResource = async () => {
    if (!resourceToDelete) {
      return;
    }

    try {
      const { error: deleteError } = await deleteCourseResource(resourceToDelete.id, authState.profile.id);

      if (deleteError) {
        throw deleteError;
      }

      setResourceToDelete(null);
      await refreshLibrary();
      setSuccessMessage('Ressource supprimee.');
    } catch (deleteError) {
      console.error('Erreur suppression ressource:', deleteError);
      setError(deleteError.message || 'Impossible de supprimer la ressource.');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
        Mes cours & ressources pedagogiques
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Deposez vos supports, structurez votre bibliotheque par chapitre et maintenez le programme de cours.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {courses.length === 0 ? (
        <Alert severity="info">Aucun cours ne vous est actuellement assigne.</Alert>
      ) : (
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Card elevation={2}>
              <CardHeader title="Cours assignes" />
              <Divider />
              <CardContent sx={{ p: 0 }}>
                <List>
                  {courses.map((course) => {
                    const isSelected = String(course.id) === String(selectedCourseId);

                    return (
                      <ListItem key={course.id} disablePadding divider>
                        <ListItemButton
                          selected={isSelected}
                          onClick={() => {
                            setSelectedCourseId(String(course.id));
                            syncCourseQueryParam(course.id);
                          }}
                        >
                          <ListItemText
                            primary={course.name}
                            secondary={`${course.code} - ${course.department || 'Departement'} - S${course.semester || '-'}`}
                          />
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            {!selectedCourse ? (
              <Alert severity="info">Selectionnez un cours pour gerer ses ressources.</Alert>
            ) : (
              <>
                <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold">
                    {selectedCourse.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedCourse.code} - {selectedCourse.department || 'Departement non renseigne'} - Semestre{' '}
                    {selectedCourse.semester || '-'}
                  </Typography>
                  {selectedCourse.description && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {selectedCourse.description}
                    </Typography>
                  )}
                </Paper>

                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={6} md={3}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Chapitres
                      </Typography>
                      <Typography variant="h6">{stats.chapters}</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Ressources
                      </Typography>
                      <Typography variant="h6">{stats.resources}</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Publiees
                      </Typography>
                      <Typography variant="h6">{stats.published}</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Telechargements
                      </Typography>
                      <Typography variant="h6">{stats.downloads}</Typography>
                    </Paper>
                  </Grid>
                </Grid>

                <Grid container spacing={2}>
                  <Grid item xs={12} lg={5}>
                    <Card elevation={2}>
                      <CardHeader title="Ajouter un chapitre" />
                      <Divider />
                      <CardContent>
                        <TextField
                          fullWidth
                          label="Nom du chapitre"
                          value={chapterName}
                          onChange={(event) => setChapterName(event.target.value)}
                          sx={{ mb: 2 }}
                        />
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Button
                            variant="contained"
                            onClick={() => handleCreateChapter()}
                            disabled={!chapterName.trim()}
                          >
                            Creer le chapitre
                          </Button>
                          <Button
                            variant="outlined"
                            onClick={() => handleCreateChapter(SYLLABUS_CHAPTER_NAME)}
                          >
                            Creer le syllabus
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} lg={7}>
                    <Card elevation={2} component="form" onSubmit={handleUploadResource}>
                      <CardHeader title="Deposer une ressource" />
                      <Divider />
                      <CardContent>
                        <Grid container spacing={2}>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              required
                              label="Titre"
                              value={uploadForm.title}
                              onChange={(event) =>
                                setUploadForm((prev) => ({ ...prev, title: event.target.value }))
                              }
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              multiline
                              minRows={3}
                              label="Description"
                              value={uploadForm.description}
                              onChange={(event) =>
                                setUploadForm((prev) => ({ ...prev, description: event.target.value }))
                              }
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <FormControl fullWidth disabled={uploadForm.isSyllabus}>
                              <InputLabel id="course-chapter-label">Chapitre</InputLabel>
                              <Select
                                labelId="course-chapter-label"
                                value={uploadForm.chapterId}
                                label="Chapitre"
                                onChange={(event) =>
                                  setUploadForm((prev) => ({ ...prev, chapterId: event.target.value }))
                                }
                              >
                                {chapterOptions.map((chapter) => (
                                  <MenuItem key={chapter.id} value={chapter.id}>
                                    {chapter.name}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                              <InputLabel id="publication-state-label">Publication</InputLabel>
                              <Select
                                labelId="publication-state-label"
                                value={uploadForm.publicationState}
                                label="Publication"
                                onChange={(event) =>
                                  setUploadForm((prev) => ({ ...prev, publicationState: event.target.value }))
                                }
                              >
                                <MenuItem value="published">Publier maintenant</MenuItem>
                                <MenuItem value="draft">Brouillon</MenuItem>
                                <MenuItem value="scheduled">Programmer</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          {uploadForm.publicationState === 'scheduled' && (
                            <Grid item xs={12}>
                              <TextField
                                fullWidth
                                type="datetime-local"
                                label="Date de publication"
                                InputLabelProps={{ shrink: true }}
                                value={uploadForm.publishAt}
                                onChange={(event) =>
                                  setUploadForm((prev) => ({ ...prev, publishAt: event.target.value }))
                                }
                              />
                            </Grid>
                          )}
                          <Grid item xs={12}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={uploadForm.isSyllabus}
                                  onChange={(event) =>
                                    setUploadForm((prev) => ({
                                      ...prev,
                                      isSyllabus: event.target.checked
                                    }))
                                  }
                                />
                              }
                              label="Classer cette ressource dans Programme & syllabus"
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <Button variant="outlined" component="label" startIcon={<CloudUploadIcon />}>
                              {uploadForm.file ? uploadForm.file.name : 'Choisir un fichier'}
                              <input
                                hidden
                                type="file"
                                onChange={(event) =>
                                  setUploadForm((prev) => ({
                                    ...prev,
                                    file: event.target.files?.[0] || null
                                  }))
                                }
                              />
                            </Button>
                          </Grid>
                        </Grid>

                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                          <Button type="submit" variant="contained" disabled={!uploadForm.file || !uploadForm.title.trim()}>
                            Ajouter la ressource
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                <Card elevation={2} sx={{ mt: 2 }}>
                  <CardHeader
                    title="Bibliotheque du cours"
                    subheader="Organisation par chapitre, avec gestion des statuts et du programme de cours."
                  />
                  <Divider />
                  <CardContent>
                    {libraryLoading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                        <CircularProgress />
                      </Box>
                    ) : chapters.length === 0 ? (
                      <Alert severity="info">
                        Aucun chapitre n'a encore ete cree pour ce cours.
                      </Alert>
                    ) : (
                      chapters.map((chapter) => (
                        <Paper key={chapter.id} variant="outlined" sx={{ p: 2, mb: 2 }}>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: 1,
                              mb: 2,
                              flexWrap: 'wrap'
                            }}
                          >
                            <Box>
                              <Typography variant="subtitle1" fontWeight="bold">
                                {chapter.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {chapter.resources?.length || 0} ressource(s)
                              </Typography>
                            </Box>
                            {String(chapter.name || '').trim().toLowerCase() ===
                              SYLLABUS_CHAPTER_NAME.toLowerCase() && (
                              <Chip icon={<AutoStoriesIcon />} label="Syllabus" color="primary" />
                            )}
                          </Box>

                          {chapter.resources?.length ? (
                            <List disablePadding>
                              {chapter.resources.map((resource) => (
                                <ListItem
                                  key={resource.id}
                                  divider
                                  secondaryAction={
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                      <Button
                                        size="small"
                                        variant="outlined"
                                        href={resource.file_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        startIcon={<FolderOpenIcon />}
                                      >
                                        Ouvrir
                                      </Button>
                                      <Button
                                        size="small"
                                        variant="outlined"
                                        startIcon={<EditIcon />}
                                        onClick={() => openEditDialog(resource)}
                                      >
                                        Modifier
                                      </Button>
                                      <Button
                                        size="small"
                                        color="error"
                                        variant="outlined"
                                        startIcon={<DeleteIcon />}
                                        onClick={() => setResourceToDelete(resource)}
                                      >
                                        Supprimer
                                      </Button>
                                    </Box>
                                  }
                                  sx={{ pr: 24 }}
                                >
                                  <ListItemText
                                    primary={resource.title}
                                    secondary={
                                      <>
                                        <Typography variant="body2" color="text.secondary">
                                          {resource.description || 'Sans description'}
                                        </Typography>
                                        <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                          <Chip
                                            size="small"
                                            label={getPublicationStateLabel(resource.publication_state)}
                                            color={getPublicationStateColor(resource.publication_state)}
                                          />
                                          <Chip
                                            size="small"
                                            variant="outlined"
                                            label={String(resource.file_type || 'file').toUpperCase()}
                                          />
                                          {resource.is_syllabus && (
                                            <Chip size="small" label="Programme" color="primary" variant="outlined" />
                                          )}
                                          <Chip
                                            size="small"
                                            icon={<DownloadIcon />}
                                            label={`${resource.downloads_count || 0} telechargement(s)`}
                                          />
                                          {resource.publish_at && (
                                            <Chip
                                              size="small"
                                              icon={<ScheduleIcon />}
                                              label={`Publication: ${formatDateTime(resource.publish_at)}`}
                                            />
                                          )}
                                        </Box>
                                      </>
                                    }
                                  />
                                </ListItem>
                              ))}
                            </List>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Aucune ressource dans ce chapitre.
                            </Typography>
                          )}
                        </Paper>
                      ))
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </Grid>
        </Grid>
      )}

      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, resource: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Modifier la ressource</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, pt: 1 }}>
            <TextField
              label="Titre"
              value={editForm.title}
              onChange={(event) => setEditForm((prev) => ({ ...prev, title: event.target.value }))}
              fullWidth
            />
            <TextField
              label="Description"
              value={editForm.description}
              onChange={(event) => setEditForm((prev) => ({ ...prev, description: event.target.value }))}
              fullWidth
              multiline
              minRows={3}
            />
            <FormControl fullWidth disabled={editForm.isSyllabus}>
              <InputLabel id="edit-chapter-label">Chapitre</InputLabel>
              <Select
                labelId="edit-chapter-label"
                value={editForm.chapterId}
                label="Chapitre"
                onChange={(event) => setEditForm((prev) => ({ ...prev, chapterId: event.target.value }))}
              >
                {chapterOptions.map((chapter) => (
                  <MenuItem key={chapter.id} value={chapter.id}>
                    {chapter.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="edit-publication-state-label">Publication</InputLabel>
              <Select
                labelId="edit-publication-state-label"
                value={editForm.publicationState}
                label="Publication"
                onChange={(event) =>
                  setEditForm((prev) => ({ ...prev, publicationState: event.target.value }))
                }
              >
                <MenuItem value="published">Publie</MenuItem>
                <MenuItem value="draft">Brouillon</MenuItem>
                <MenuItem value="scheduled">Programme</MenuItem>
                <MenuItem value="archived">Archive</MenuItem>
              </Select>
            </FormControl>
            {editForm.publicationState === 'scheduled' && (
              <TextField
                fullWidth
                type="datetime-local"
                label="Date de publication"
                InputLabelProps={{ shrink: true }}
                value={editForm.publishAt}
                onChange={(event) => setEditForm((prev) => ({ ...prev, publishAt: event.target.value }))}
              />
            )}
            <FormControlLabel
              control={
                <Checkbox
                  checked={editForm.isSyllabus}
                  onChange={(event) =>
                    setEditForm((prev) => ({ ...prev, isSyllabus: event.target.checked }))
                  }
                />
              }
              label="Classer dans Programme & syllabus"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, resource: null })}>Annuler</Button>
          <Button variant="contained" onClick={handleSaveResource}>
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(resourceToDelete)} onClose={() => setResourceToDelete(null)}>
        <DialogTitle>Supprimer la ressource</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Cette action supprimera la ressource selectionnee et son fichier associe.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResourceToDelete(null)}>Annuler</Button>
          <Button variant="contained" color="error" onClick={handleDeleteResource}>
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage('')}
        message={successMessage}
      />
    </Box>
  );
};

export default ProfessorCoursesPage;
