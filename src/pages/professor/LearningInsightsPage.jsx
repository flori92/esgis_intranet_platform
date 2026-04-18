import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Autorenew as AutorenewIcon,
  Save as SaveIcon,
  SettingsSuggest as SettingsSuggestIcon,
  TrendingUp as TrendingUpIcon,
  WarningAmber as WarningAmberIcon
} from '@mui/icons-material';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/context/AuthContext';
import {
  getProfessorLearningInsights,
  resetProfessorCourseCompletionSettings,
  upsertProfessorCourseCompletionSettings
} from '@/api/professorLearningInsights';
import { mergeCourseCompletionSettings } from '@/utils/courseCompletion';

const NAVY = '#003366';

const severityColors = {
  Critique: 'error',
  Elevee: 'warning',
  'A surveiller': 'info'
};

const resourceModeOptions = [
  { value: 'view', label: 'Lecture' },
  { value: 'download', label: 'Telechargement' }
];

const assignmentModeOptions = [
  { value: 'submission', label: 'Remise envoyee' },
  { value: 'graded', label: 'Remise notee' }
];

const forumModeOptions = [
  { value: 'reply_or_post', label: 'Post ou reponse' },
  { value: 'reply', label: 'Reponses uniquement' },
  { value: 'post', label: 'Posts uniquement' },
  { value: 'none', label: 'Forum non comptabilise' }
];

const weightFieldLabels = {
  resource: 'Ressources',
  assignment: 'Devoirs',
  practice_quiz: 'Quiz',
  interactive_resource: 'Interactif',
  forum: 'Forum'
};

const formatDate = (value) => {
  if (!value) return '-';
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric'
    }).format(new Date(value));
  } catch { return value; }
};

const SummaryCard = ({ title, value, subtitle, accent }) => (
  <Paper
    elevation={0}
    sx={{
      p: { xs: 2, md: 3 },
      borderRadius: 2,
      border: `2px solid ${alpha(accent, 0.3)}`,
      bgcolor: alpha(accent, 0.02),
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: `0 12px 24px ${alpha(accent, 0.15)}`,
        borderColor: accent,
        bgcolor: alpha(accent, 0.05)
      }
    }}
  >
    <Typography variant="body2" color="text.secondary" fontWeight={700} sx={{ mb: 1, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 1 }}>
      {title}
    </Typography>
    <Typography variant="h4" fontWeight={900} sx={{ color: NAVY, mb: 0.5, fontSize: { xs: '1.75rem', md: '2.125rem' } }}>
      {value}
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
      {subtitle}
    </Typography>
  </Paper>
);

const LearningInsightsPage = () => {
  const { authState } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [successMessage, setSuccessMessage] = useState('');
  
  const profileId = authState.profile?.id;

  const { data: insightsData, isLoading: loading, error, refetch } = useQuery({
    queryKey: ['professorLearningInsights', profileId],
    queryFn: () => getProfessorLearningInsights({ profileId }),
    enabled: !!profileId && authState.isProfessor,
    staleTime: 1000 * 60 * 10,
  });

  const insights = insightsData?.data || {
    summary: {
      totalCourses: 0, totalTrackedStudents: 0, atRiskStudents: 0,
      overdueActivities: 0, averageProgress: 0, averageAttendance: 0,
      averagePredictedGrade: 0, configuredCourses: 0
    },
    courses: [],
    studentsNeedingAttention: []
  };

  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [formValues, setFormValues] = useState(mergeCourseCompletionSettings());

  const selectedCourse = useMemo(
    () => insights.courses.find((c) => String(c.course.id) === String(selectedCourseId)) || null,
    [insights.courses, selectedCourseId]
  );

  useEffect(() => {
    if (selectedCourse) {
      setFormValues(mergeCourseCompletionSettings(selectedCourse.settings));
      if (searchParams.get('course') !== String(selectedCourse.course.id)) {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.set('course', String(selectedCourse.course.id));
        setSearchParams(nextParams, { replace: true });
      }
    } else if (insights.courses.length > 0 && !selectedCourseId) {
        setSelectedCourseId(String(insights.courses[0].course.id));
    }
  }, [insights.courses, selectedCourse, selectedCourseId, searchParams, setSearchParams]);

  const saveMutation = useMutation({
    mutationFn: (values) => upsertProfessorCourseCompletionSettings({
      profileId, courseId: Number(selectedCourseId), settings: values
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professorLearningInsights'] });
      setSuccessMessage('Règles de complétion mises à jour.');
    }
  });

  const resetMutation = useMutation({
    mutationFn: () => resetProfessorCourseCompletionSettings({ profileId, courseId: Number(selectedCourseId) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professorLearningInsights'] });
      setSuccessMessage('Règles ESGIS par défaut restaurées.');
    }
  });

  const handleScalarFieldChange = (field) => (event) => {
    setFormValues(prev => ({ ...prev, [field]: event.target.value }));
  };

  const handleWeightChange = (field) => (event) => {
    setFormValues(prev => ({
      ...prev,
      course_progress_weights: { ...prev.course_progress_weights, [field]: event.target.value }
    }));
  };

  const handleSave = () => selectedCourseId && saveMutation.mutate(formValues);
  const handleReset = () => selectedCourseId && resetMutation.mutate();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', py: 12, minHeight: '60vh' }}>
        <CircularProgress size={48} sx={{ color: NAVY, mb: 2 }} />
        <Typography variant="body1" color="text.secondary">Calcul des indicateurs pédagogiques...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      <Box sx={{ mb: 4 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }}>
          <TrendingUpIcon sx={{ color: NAVY, fontSize: { xs: 40, md: 48 } }} />
          <Box>
            <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: '-0.5px', fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
              Progression & Analytics
            </Typography>
            <Typography variant="body1" color="text.secondary">Pilotez les règles de complétion et surveillez les cohortes ESGIS.</Typography>
          </Box>
        </Stack>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error.message}</Alert>}

      <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={3}><SummaryCard title="Cours suivis" value={insights.summary.totalCourses} subtitle={`${insights.summary.configuredCourses} personnalisés`} accent={NAVY} /></Grid>
        <Grid item xs={12} sm={6} lg={3}><SummaryCard title="Progression moyenne" value={`${Math.round(insights.summary.averageProgress)}%`} subtitle={`${insights.summary.totalTrackedStudents} étudiants`} accent="#2E7D32" /></Grid>
        <Grid item xs={12} sm={6} lg={3}><SummaryCard title="Étudiants à risque" value={insights.summary.atRiskStudents} subtitle={`${insights.summary.overdueActivities} retards`} accent="#CC0000" /></Grid>
        <Grid item xs={12} sm={6} lg={3}><SummaryCard title="Projection moyenne" value={`${insights.summary.averagePredictedGrade.toFixed(1)}/20`} subtitle={`${Math.round(insights.summary.averageAttendance)}% prés.`} accent="#ED6C02" /></Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} xl={8}>
          <Stack spacing={3}>
            {/* Table par cours */}
            <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: '1px solid #E5E7EB' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Typography variant="h6" fontWeight={800}>Vue par cours</Typography>
                <Button variant="outlined" size="small" startIcon={<AutorenewIcon />} onClick={() => refetch()}>Actualiser</Button>
              </Stack>
              <TableContainer sx={{ maxHeight: 440 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800 }}>Cours</TableCell>
                      <TableCell sx={{ minWidth: 150, fontWeight: 800 }}>Progression</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800 }}>Effectif</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800 }}>À risque</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {insights.courses.map((c) => (
                      <TableRow key={c.course.id} hover selected={String(c.course.id) === String(selectedCourseId)} onClick={() => setSelectedCourseId(String(c.course.id))} sx={{ cursor: 'pointer' }}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700}>{c.course.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{c.course.code || 'S/C'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ flex: 1 }}><LinearProgress variant="determinate" value={c.averageProgress} sx={{ height: 6, borderRadius: 3 }} /></Box>
                            <Typography variant="caption" fontWeight={700}>{Math.round(c.averageProgress)}%</Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">{c.studentCount}</TableCell>
                        <TableCell align="right"><Chip size="small" color={c.atRiskStudents > 0 ? 'error' : 'success'} label={c.atRiskStudents} sx={{ fontWeight: 'bold' }} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            {/* Vigilance */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid #E5E7EB' }}>
              <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2 }}>
                <WarningAmberIcon sx={{ color: '#CC0000' }} />
                <Typography variant="h6" fontWeight={800}>Étudiants à surveiller</Typography>
              </Stack>
              {insights.studentsNeedingAttention.length ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800 }}>Étudiant</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Signaux</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800 }}>Niveau</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {insights.studentsNeedingAttention.slice(0, 10).map((st) => (
                        <TableRow key={st.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={700}>{st.studentName}</Typography>
                            <Typography variant="caption" color="text.secondary">{st.studentNumber} · {st.courseName}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">{(st.reasons || []).join(' · ')}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Chip size="small" color={severityColors[st.severity] || 'warning'} label={st.severity} sx={{ fontWeight: 'bold' }} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="success">Aucune alerte pour le moment.</Alert>
              )}
            </Paper>
          </Stack>
        </Grid>

        <Grid item xs={12} xl={4}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid #E5E7EB', height: '100%' }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
              <SettingsSuggestIcon sx={{ color: NAVY }} />
              <Typography variant="h6" fontWeight="800">Règles de complétion</Typography>
            </Stack>

            {selectedCourse ? (
              <Stack spacing={3}>
                <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#F8FAFC', border: '1px solid #E5E7EB' }}>
                  <Typography variant="subtitle2" fontWeight="800">{selectedCourse.course.name}</Typography>
                  <Typography variant="caption" color="text.secondary">Dernier recalcul : {formatDate(selectedCourse.updatedAt)}</Typography>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Mode Ressources</InputLabel>
                      <Select value={formValues.resource_completion_mode} label="Mode Ressources" onChange={handleScalarFieldChange('resource_completion_mode')}>
                        {resourceModeOptions.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Mode Devoirs</InputLabel>
                      <Select value={formValues.assignment_completion_mode} label="Mode Devoirs" onChange={handleScalarFieldChange('assignment_completion_mode')}>
                        {assignmentModeOptions.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                <Box>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 2 }}>Pondération (%)</Typography>
                  <Grid container spacing={2}>
                    {Object.entries(weightFieldLabels).map(([f, l]) => (
                      <Grid item xs={6} key={f}>
                        <TextField fullWidth size="small" type="number" label={l} value={formValues.course_progress_weights?.[f] ?? 0} onChange={handleWeightChange(f)} />
                      </Grid>
                    ))}
                  </Grid>
                </Box>

                <Stack spacing={1}>
                  <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={saveMutation.isPending} sx={{ bgcolor: NAVY }}>Enregistrer</Button>
                  <Button variant="outlined" startIcon={<AutorenewIcon />} onClick={handleReset} disabled={resetMutation.isPending}>Restaurer ESGIS</Button>
                </Stack>
              </Stack>
            ) : <Alert severity="info">Sélectionnez un cours pour ajuster les règles.</Alert>}
          </Paper>
        </Grid>
      </Grid>

      <Snackbar open={Boolean(successMessage)} autoHideDuration={4000} onClose={() => setSuccessMessage('')} message={successMessage} />
    </Box>
  );
};

export default LearningInsightsPage;
