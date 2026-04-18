import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
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
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Snackbar,
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
  alpha
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  CloudDownload as CloudDownloadIcon,
  DeleteOutline as DeleteOutlineIcon,
  EditOutlined as EditOutlinedIcon,
  Grading as GradingIcon,
  PlaylistAdd as PlaylistAddIcon,
  Rule as RuleIcon,
  SendTimeExtension as SendTimeExtensionIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';

import { useAuth } from '@/context/AuthContext';
import { getProfessorManagedCourses } from '@/api/courses';
import {
  createAssignmentRubric,
  createCourseAssignment,
  deleteCourseAssignment,
  getAssignmentAttachmentUrl,
  getProfessorAssignmentDetails,
  getProfessorAssignments,
  getProfessorRubrics,
  gradeAssignmentSubmission,
  updateCourseAssignment
} from '@/api/assignments';

const initialAssignmentForm = {
  courseId: '',
  title: '',
  description: '',
  instructions: '',
  availableFrom: '',
  dueAt: '',
  lateUntil: '',
  allowLateSubmission: false,
  submissionMode: 'text_file',
  maxPoints: '20',
  status: 'draft',
  rubricId: ''
};

const initialRubricForm = {
  title: '',
  description: '',
  criteriaText: ''
};

const initialReviewForm = {
  grade: '',
  feedback: ''
};

const submissionModeOptions = [
  { value: 'text', label: 'Texte uniquement' },
  { value: 'file', label: 'Fichier uniquement' },
  { value: 'text_file', label: 'Texte et/ou fichier' }
];

const statusOptions = [
  { value: 'draft', label: 'Brouillon' },
  { value: 'published', label: 'Publie' },
  { value: 'closed', label: 'Clos' },
  { value: 'archived', label: 'Archive' }
];

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

const formatDateTime = (value) => {
  if (!value) {
    return 'Non defini';
  }

  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const formatPoints = (value) => {
  const numeric = Number(value || 0);
  return Number.isInteger(numeric) ? `${numeric}` : numeric.toFixed(2);
};

const getStatusColor = (status) => {
  switch (status) {
    case 'published':
      return 'success';
    case 'closed':
      return 'error';
    case 'archived':
      return 'default';
    default:
      return 'warning';
  }
};

const getSubmissionChip = (student) => {
  if (!student?.submission) {
    return <Chip size="small" label="En attente" color="default" />;
  }

  if (student.submission.grade !== null && student.submission.grade !== undefined) {
    return <Chip size="small" label="Note" color="success" />;
  }

  if (student.submission.status === 'late') {
    return <Chip size="small" label="Rendu tardif" color="warning" />;
  }

  return <Chip size="small" label="Rendu" color="info" />;
};

const parseCriteriaText = (criteriaText) =>
  String(criteriaText || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [title = '', points = '', ...descriptionParts] = line.split('|').map((part) => part.trim());
      return {
        id: `criterion-${index + 1}`,
        title,
        max_points: Number(points || 0) || 0,
        description: descriptionParts.join(' | ')
      };
    })
    .filter((criterion) => criterion.title);

const ProfessorAssignmentsPage = () => {
  const { authState } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [courses, setCourses] = useState([]);
  const [rubrics, setRubrics] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [courseFilter, setCourseFilter] = useState('all');
  const [editingAssignmentId, setEditingAssignmentId] = useState(null);
  const [assignmentForm, setAssignmentForm] = useState(initialAssignmentForm);
  const [rubricDialogOpen, setRubricDialogOpen] = useState(false);
  const [rubricForm, setRubricForm] = useState(initialRubricForm);
  const [submissionsDialog, setSubmissionsDialog] = useState({
    open: false,
    loading: false,
    assignment: null,
    students: [],
    error: null
  });
  const [reviewDialog, setReviewDialog] = useState({
    open: false,
    assignment: null,
    student: null
  });
  const [reviewForm, setReviewForm] = useState(initialReviewForm);

  const NAVY = '#003366';

  const loadData = async (selectedCourseId = courseFilter) => {
    if (!authState.profile?.id) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [coursesResult, rubricsResult, assignmentsResult] = await Promise.all([
        getProfessorManagedCourses(authState.profile.id),
        getProfessorRubrics(authState.profile.id),
        getProfessorAssignments(authState.profile.id, {
          courseId: selectedCourseId === 'all' ? null : selectedCourseId
        })
      ]);

      if (coursesResult.error) throw coursesResult.error;
      if (rubricsResult.error) throw rubricsResult.error;
      if (assignmentsResult.error) throw assignmentsResult.error;

      setCourses(coursesResult.data || []);
      setRubrics(rubricsResult.data || []);
      setAssignments(assignmentsResult.data || []);

      if (!editingAssignmentId && !assignmentForm.courseId && coursesResult.data?.[0]?.id) {
        setAssignmentForm((prev) => ({
          ...prev,
          courseId: String(coursesResult.data[0].id)
        }));
      }
    } catch (loadError) {
      console.error('Erreur chargement devoirs professeur:', loadError);
      setError(loadError.message || 'Impossible de charger les devoirs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(courseFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState.profile?.id, courseFilter]);

  const filteredAssignments = useMemo(() => {
    if (courseFilter === 'all') {
      return assignments;
    }

    return assignments.filter((assignment) => String(assignment.course_id) === String(courseFilter));
  }, [assignments, courseFilter]);

  const selectedRubric = useMemo(
    () => rubrics.find((rubric) => String(rubric.id) === String(assignmentForm.rubricId)) || null,
    [assignmentForm.rubricId, rubrics]
  );

  const handleAssignmentFormChange = (field, value) => {
    setAssignmentForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetAssignmentForm = () => {
    setEditingAssignmentId(null);
    setAssignmentForm({
      ...initialAssignmentForm,
      courseId: courses[0]?.id ? String(courses[0].id) : ''
    });
  };

  const handleSaveAssignment = async () => {
    setSaving(true);
    setError(null);

    try {
      const payload = {
        courseId: Number(assignmentForm.courseId),
        professorProfileId: authState.profile.id,
        title: assignmentForm.title,
        description: assignmentForm.description,
        instructions: assignmentForm.instructions,
        availableFrom: assignmentForm.availableFrom,
        dueAt: assignmentForm.dueAt,
        lateUntil: assignmentForm.lateUntil,
        allowLateSubmission: assignmentForm.allowLateSubmission,
        submissionMode: assignmentForm.submissionMode,
        maxPoints: assignmentForm.maxPoints,
        status: assignmentForm.status,
        rubricId: assignmentForm.rubricId || null
      };

      const result = editingAssignmentId
        ? await updateCourseAssignment(editingAssignmentId, payload)
        : await createCourseAssignment(payload);

      if (result.error) {
        throw result.error;
      }

      setSnackbarMessage(editingAssignmentId ? 'Devoir mis a jour.' : 'Devoir cree.');
      resetAssignmentForm();
      await loadData(courseFilter);
    } catch (saveError) {
      console.error('Erreur sauvegarde devoir:', saveError);
      setError(saveError.message || 'Impossible de sauvegarder le devoir.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditAssignment = (assignment) => {
    setEditingAssignmentId(assignment.id);
    setAssignmentForm({
      courseId: String(assignment.course_id),
      title: assignment.title,
      description: assignment.description || '',
      instructions: assignment.instructions || '',
      availableFrom: toDateTimeLocalValue(assignment.available_from),
      dueAt: toDateTimeLocalValue(assignment.due_at),
      lateUntil: toDateTimeLocalValue(assignment.late_until),
      allowLateSubmission: Boolean(assignment.allow_late_submission),
      submissionMode: assignment.submission_mode || 'text_file',
      maxPoints: String(assignment.max_points || 20),
      status: assignment.status || 'draft',
      rubricId: assignment.rubric_id || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm('Supprimer ce devoir et toutes ses soumissions ?')) {
      return;
    }

    try {
      const { error: deleteError } = await deleteCourseAssignment(assignmentId, authState.profile.id);
      if (deleteError) {
        throw deleteError;
      }

      if (editingAssignmentId === assignmentId) {
        resetAssignmentForm();
      }

      setSnackbarMessage('Devoir supprime.');
      await loadData(courseFilter);
    } catch (deleteError) {
      console.error('Erreur suppression devoir:', deleteError);
      setError(deleteError.message || 'Impossible de supprimer ce devoir.');
    }
  };

  const openSubmissions = async (assignment) => {
    setSubmissionsDialog({
      open: true,
      loading: true,
      assignment: null,
      students: [],
      error: null
    });

    try {
      const { data, error: detailError } = await getProfessorAssignmentDetails(
        assignment.id,
        authState.profile.id
      );

      if (detailError) {
        throw detailError;
      }

      setSubmissionsDialog({
        open: true,
        loading: false,
        assignment: data.assignment,
        students: data.students,
        error: null
      });
    } catch (detailError) {
      console.error('Erreur chargement soumissions:', detailError);
      setSubmissionsDialog({
        open: true,
        loading: false,
        assignment: null,
        students: [],
        error: detailError.message || 'Impossible de charger les soumissions.'
      });
    }
  };

  const refreshCurrentSubmissions = async () => {
    if (!submissionsDialog.assignment?.id) {
      return;
    }

    const { data, error: detailError } = await getProfessorAssignmentDetails(
      submissionsDialog.assignment.id,
      authState.profile.id
    );

    if (detailError) {
      throw detailError;
    }

    setSubmissionsDialog({
      open: true,
      loading: false,
      assignment: data.assignment,
      students: data.students,
      error: null
    });
  };

  const handleOpenReview = (student) => {
    setReviewDialog({
      open: true,
      assignment: submissionsDialog.assignment,
      student
    });
    setReviewForm({
      grade:
        student?.submission?.grade === null || student?.submission?.grade === undefined
          ? ''
          : String(student.submission.grade),
      feedback: student?.submission?.feedback || ''
    });
  };

  const handleDownloadSubmission = async (student) => {
    try {
      if (!student?.submission?.attachment_path) {
        throw new Error('Aucune piece jointe pour cette soumission');
      }

      const { signedUrl, error: signedUrlError } = await getAssignmentAttachmentUrl(
        student.submission.attachment_path
      );

      if (signedUrlError) {
        throw signedUrlError;
      }

      window.open(signedUrl, '_blank', 'noopener,noreferrer');
    } catch (downloadError) {
      console.error('Erreur telechargement soumission:', downloadError);
      setError(downloadError.message || 'Impossible de telecharger la soumission.');
    }
  };

  const handleSaveReview = async () => {
    try {
      const submissionId = reviewDialog.student?.submission?.id;
      if (!submissionId) {
        throw new Error('Soumission introuvable');
      }

      const { error: gradingError } = await gradeAssignmentSubmission({
        submissionId,
        professorProfileId: authState.profile.id,
        grade: reviewForm.grade,
        feedback: reviewForm.feedback
      });

      if (gradingError) {
        throw gradingError;
      }

      setReviewDialog({ open: false, assignment: null, student: null });
      setReviewForm(initialReviewForm);
      setSnackbarMessage('Evaluation enregistree.');
      await Promise.all([loadData(courseFilter), refreshCurrentSubmissions()]);
    } catch (gradingError) {
      console.error('Erreur evaluation soumission:', gradingError);
      setError(gradingError.message || 'Impossible d enregistrer l evaluation.');
    }
  };

  const handleCreateRubric = async () => {
    try {
      const criteria = parseCriteriaText(rubricForm.criteriaText);
      const { data, error: rubricError } = await createAssignmentRubric({
        professorProfileId: authState.profile.id,
        title: rubricForm.title,
        description: rubricForm.description,
        criteria
      });

      if (rubricError) {
        throw rubricError;
      }

      setRubrics((prev) => [data, ...prev]);
      setAssignmentForm((prev) => ({ ...prev, rubricId: data.id }));
      setRubricDialogOpen(false);
      setRubricForm(initialRubricForm);
      setSnackbarMessage('Rubric creee.');
    } catch (rubricError) {
      console.error('Erreur creation rubric:', rubricError);
      setError(rubricError.message || 'Impossible de creer la rubric.');
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
    <Box sx={{ p: { xs: 2, md: 4 }, backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      <Stack spacing={1} sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={900} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AssignmentIcon sx={{ color: NAVY, fontSize: 38 }} />
          Devoirs & Remises
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Creez des devoirs, rattachez des baremes, suivez les remises et centralisez le feedback.
        </Typography>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} lg={4}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: `2px solid ${alpha(NAVY, 0.3)}`, bgcolor: alpha(NAVY, 0.01) }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6" fontWeight={800} color={NAVY}>
                {editingAssignmentId ? 'Modifier le devoir' : 'Nouveau devoir'}
              </Typography>
              {editingAssignmentId && (
                <Button size="small" onClick={resetAssignmentForm}>
                  Annuler
                </Button>
              )}
            </Stack>

            <Stack spacing={2}>
              <FormControl fullWidth size="small">
                <InputLabel id="assignment-course-label">Cours</InputLabel>
                <Select
                  labelId="assignment-course-label"
                  label="Cours"
                  value={assignmentForm.courseId}
                  onChange={(event) => handleAssignmentFormChange('courseId', event.target.value)}
                >
                  {courses.map((course) => (
                    <MenuItem key={course.id} value={String(course.id)}>
                      {course.code} - {course.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                size="small"
                label="Titre du devoir"
                value={assignmentForm.title}
                onChange={(event) => handleAssignmentFormChange('title', event.target.value)}
                fullWidth
              />

              <TextField
                size="small"
                label="Description"
                value={assignmentForm.description}
                onChange={(event) => handleAssignmentFormChange('description', event.target.value)}
                fullWidth
                multiline
                minRows={2}
              />

              <TextField
                size="small"
                label="Consignes"
                value={assignmentForm.instructions}
                onChange={(event) => handleAssignmentFormChange('instructions', event.target.value)}
                fullWidth
                multiline
                minRows={4}
              />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    size="small"
                    label="Disponible a partir de"
                    type="datetime-local"
                    value={assignmentForm.availableFrom}
                    onChange={(event) => handleAssignmentFormChange('availableFrom', event.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    size="small"
                    label="Date limite"
                    type="datetime-local"
                    value={assignmentForm.dueAt}
                    onChange={(event) => handleAssignmentFormChange('dueAt', event.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>

              <FormControlLabel
                control={
                  <Switch
                    checked={assignmentForm.allowLateSubmission}
                    onChange={(event) => handleAssignmentFormChange('allowLateSubmission', event.target.checked)}
                  />
                }
                label={<Typography variant="body2">Autoriser les remises tardives</Typography>}
              />

              <TextField
                size="small"
                label="Cloture remises tardives"
                type="datetime-local"
                value={assignmentForm.lateUntil}
                onChange={(event) => handleAssignmentFormChange('lateUntil', event.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
                disabled={!assignmentForm.allowLateSubmission}
              />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="assignment-mode-label">Mode de remise</InputLabel>
                    <Select
                      labelId="assignment-mode-label"
                      label="Mode de remise"
                      value={assignmentForm.submissionMode}
                      onChange={(event) => handleAssignmentFormChange('submissionMode', event.target.value)}
                    >
                      {submissionModeOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    size="small"
                    label="Bareme / points max"
                    type="number"
                    value={assignmentForm.maxPoints}
                    onChange={(event) => handleAssignmentFormChange('maxPoints', event.target.value)}
                    fullWidth
                    inputProps={{ min: 1, step: 0.5 }}
                  />
                </Grid>
              </Grid>

              <FormControl fullWidth size="small">
                <InputLabel id="assignment-status-label">Statut</InputLabel>
                <Select
                  labelId="assignment-status-label"
                  label="Statut"
                  value={assignmentForm.status}
                  onChange={(event) => handleAssignmentFormChange('status', event.target.value)}
                >
                  {statusOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle2" fontWeight={700}>
                    Rubric / bareme
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<PlaylistAddIcon />}
                    onClick={() => setRubricDialogOpen(true)}
                  >
                    Nouvelle
                  </Button>
                </Stack>
                <FormControl fullWidth size="small">
                  <InputLabel id="assignment-rubric-label">Rubric</InputLabel>
                  <Select
                    labelId="assignment-rubric-label"
                    label="Rubric"
                    value={assignmentForm.rubricId}
                    onChange={(event) => handleAssignmentFormChange('rubricId', event.target.value)}
                  >
                    <MenuItem value="">
                      <em>Aucune</em>
                    </MenuItem>
                    {rubrics.map((rubric) => (
                      <MenuItem key={rubric.id} value={rubric.id}>
                        {rubric.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>

              <Button
                variant="contained"
                startIcon={<CheckCircleOutlineIcon />}
                onClick={handleSaveAssignment}
                disabled={saving}
                sx={{ bgcolor: NAVY, borderRadius: 2 }}
              >
                {editingAssignmentId ? 'Mettre a jour' : 'Creer le devoir'}
              </Button>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={8}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid #E5E7EB' }}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', md: 'center' }}
              spacing={2}
              sx={{ mb: 3 }}
            >
              <Typography variant="h6" fontWeight={800}>
                Devoirs publies et brouillons
              </Typography>
              <FormControl sx={{ minWidth: 240 }} size="small">
                <InputLabel id="assignment-filter-course-label">Filtrer par cours</InputLabel>
                <Select
                  labelId="assignment-filter-course-label"
                  label="Filtrer par cours"
                  value={courseFilter}
                  onChange={(event) => setCourseFilter(event.target.value)}
                >
                  <MenuItem value="all">Tous les cours</MenuItem>
                  {courses.map((course) => (
                    <MenuItem key={course.id} value={String(course.id)}>
                      {course.code} - {course.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            <Stack spacing={2.5}>
              {filteredAssignments.length ? (
                filteredAssignments.map((assignment) => (
                  <Card key={assignment.id} elevation={0} sx={{ 
                    borderRadius: 2, 
                    border: `2px solid ${alpha(NAVY, 0.2)}`,
                    bgcolor: alpha(NAVY, 0.005),
                    transition: 'all 0.3s ease',
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 24px rgba(0,0,0,0.05)', borderColor: alpha(NAVY, 0.4) }
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      <Stack spacing={2.5}>
                        <Stack
                          direction={{ xs: 'column', sm: 'row' }}
                          justifyContent="space-between"
                          alignItems={{ xs: 'flex-start', sm: 'center' }}
                          spacing={1}
                        >
                          <Box>
                            <Typography variant="h6" fontWeight={800} color={NAVY}>
                              {assignment.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" fontWeight={500}>
                              {assignment.course?.code} · {assignment.course?.name}
                            </Typography>
                          </Box>
                          <Chip
                            size="small"
                            color={getStatusColor(assignment.status)}
                            label={statusOptions.find((option) => option.value === assignment.status)?.label || assignment.status}
                            sx={{ fontWeight: 'bold' }}
                          />
                        </Stack>

                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                          <Chip size="small" icon={<SendTimeExtensionIcon />} label={`Le: ${formatDateTime(assignment.available_from)}`} variant="outlined" />
                          <Chip size="small" icon={<AssignmentIcon />} label={`Deadline: ${formatDateTime(assignment.due_at)}`} variant="outlined" />
                          <Chip size="small" icon={<GradingIcon />} label={`${formatPoints(assignment.max_points)} pts`} variant="outlined" />
                        </Stack>

                        <Grid container spacing={2}>
                          {[
                            { label: 'Attendues', value: assignment.stats.expected_count, color: '#455a64' },
                            { label: 'Recues', value: assignment.stats.submitted_count, color: NAVY },
                            { label: 'Notees', value: assignment.stats.graded_count, color: '#2e7d32' }
                          ].map((stat) => (
                            <Grid item xs={4} key={stat.label}>
                              <Box sx={{ 
                                p: 1.5, textAlign: 'center', borderRadius: 2, 
                                border: `1px solid ${alpha(stat.color, 0.2)}`,
                                bgcolor: alpha(stat.color, 0.03)
                              }}>
                                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase' }}>{stat.label}</Typography>
                                <Typography variant="h5" fontWeight={900} color={stat.color}>{stat.value}</Typography>
                              </Box>
                            </Grid>
                          ))}
                        </Grid>

                        <Stack direction="row" spacing={1.5}>
                          <Button variant="contained" size="small" startIcon={<VisibilityIcon />} onClick={() => openSubmissions(assignment)} sx={{ borderRadius: 2, bgcolor: NAVY }}>
                            Remises
                          </Button>
                          <Button variant="outlined" size="small" startIcon={<EditOutlinedIcon />} onClick={() => handleEditAssignment(assignment)} sx={{ borderRadius: 2 }}>
                            Modifier
                          </Button>
                          <Button color="error" variant="text" size="small" startIcon={<DeleteOutlineIcon />} onClick={() => handleDeleteAssignment(assignment.id)} sx={{ fontWeight: 'bold' }}>
                            Supprimer
                          </Button>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  Aucun devoir n a encore ete cree pour ce filtre.
                </Alert>
              )}
            </Stack>
          </Paper>
        </Grid>
      </Grid>


      <Dialog open={rubricDialogOpen} onClose={() => setRubricDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Nouvelle rubric</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Titre de la rubric"
              value={rubricForm.title}
              onChange={(event) => setRubricForm((prev) => ({ ...prev, title: event.target.value }))}
              fullWidth
            />
            <TextField
              label="Description"
              value={rubricForm.description}
              onChange={(event) => setRubricForm((prev) => ({ ...prev, description: event.target.value }))}
              fullWidth
              multiline
              minRows={2}
            />
            <TextField
              label="Criteres"
              helperText={'Un critere par ligne: Nom | Points | Description'}
              value={rubricForm.criteriaText}
              onChange={(event) => setRubricForm((prev) => ({ ...prev, criteriaText: event.target.value }))}
              fullWidth
              multiline
              minRows={6}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRubricDialogOpen(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleCreateRubric}>
            Enregistrer la rubric
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={submissionsDialog.open}
        onClose={() =>
          setSubmissionsDialog({ open: false, loading: false, assignment: null, students: [], error: null })
        }
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle>
          {submissionsDialog.assignment?.title || 'Soumissions du devoir'}
        </DialogTitle>
        <DialogContent dividers>
          {submissionsDialog.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : submissionsDialog.error ? (
            <Alert severity="error">{submissionsDialog.error}</Alert>
          ) : (
            <Stack spacing={2}>
              {submissionsDialog.assignment?.rubric?.criteria?.length ? (
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>
                    Bareme associe
                  </Typography>
                  <List dense disablePadding>
                    {submissionsDialog.assignment.rubric.criteria.map((criterion) => (
                      <ListItem key={criterion.id} disableGutters sx={{ py: 0.5 }}>
                        <ListItemText
                          primary={`${criterion.title} (${formatPoints(criterion.max_points)} pts)`}
                          secondary={criterion.description || null}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              ) : null}

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Etudiant</TableCell>
                      <TableCell>Numero</TableCell>
                      <TableCell>Statut</TableCell>
                      <TableCell>Soumis le</TableCell>
                      <TableCell>Note</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {submissionsDialog.students.map((student) => (
                      <TableRow key={student.profile_id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700}>
                            {student.full_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {student.email}
                          </Typography>
                        </TableCell>
                        <TableCell>{student.student_number || '-'}</TableCell>
                        <TableCell>{getSubmissionChip(student)}</TableCell>
                        <TableCell>{formatDateTime(student.submission?.submitted_at)}</TableCell>
                        <TableCell>
                          {student.submission?.grade !== null && student.submission?.grade !== undefined
                            ? `${formatPoints(student.submission.grade)} / ${formatPoints(submissionsDialog.assignment?.max_points)}`
                            : '-'}
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            {student.submission?.attachment_path ? (
                              <Button
                                size="small"
                                startIcon={<CloudDownloadIcon />}
                                onClick={() => handleDownloadSubmission(student)}
                              >
                                Piece jointe
                              </Button>
                            ) : null}
                            {student.submission ? (
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<GradingIcon />}
                                onClick={() => handleOpenReview(student)}
                              >
                                Evaluer
                              </Button>
                            ) : null}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setSubmissionsDialog({ open: false, loading: false, assignment: null, students: [], error: null })
            }
          >
            Fermer
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={reviewDialog.open}
        onClose={() => setReviewDialog({ open: false, assignment: null, student: null })}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          Evaluation - {reviewDialog.student?.full_name || ''}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>
                Reponse de l etudiant
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                {reviewDialog.student?.submission?.submission_text || 'Aucune reponse texte.'}
              </Typography>
            </Paper>

            {reviewDialog.student?.submission?.attachment_name ? (
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={800}>
                      Piece jointe
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {reviewDialog.student.submission.attachment_name}
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    startIcon={<CloudDownloadIcon />}
                    onClick={() => handleDownloadSubmission(reviewDialog.student)}
                  >
                    Ouvrir
                  </Button>
                </Stack>
              </Paper>
            ) : null}

            <Divider />

            <TextField
              label={`Note / ${formatPoints(reviewDialog.assignment?.max_points || 20)}`}
              type="number"
              value={reviewForm.grade}
              onChange={(event) => setReviewForm((prev) => ({ ...prev, grade: event.target.value }))}
              fullWidth
              inputProps={{ min: 0, max: reviewDialog.assignment?.max_points || 20, step: 0.5 }}
            />

            <TextField
              label="Feedback"
              value={reviewForm.feedback}
              onChange={(event) => setReviewForm((prev) => ({ ...prev, feedback: event.target.value }))}
              fullWidth
              multiline
              minRows={5}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialog({ open: false, assignment: null, student: null })}>
            Annuler
          </Button>
          <Button variant="contained" onClick={handleSaveReview}>
            Enregistrer l evaluation
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(snackbarMessage)}
        autoHideDuration={3500}
        onClose={() => setSnackbarMessage('')}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default ProfessorAssignmentsPage;
