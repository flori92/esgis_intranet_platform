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
  if (!value) {
    return '-';
  }

  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const SummaryCard = ({ title, value, subtitle, accent }) => (
  <Paper
    elevation={0}
    sx={{
      p: { xs: 2, md: 3 },
      borderRadius: 2,
      border: '1px solid #E5E7EB',
      borderTop: `4px solid ${accent}`,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
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

// ... other code ...

const LearningInsightsPage = () => {
  // ... state and hooks ...
  // (Assuming these are already present)

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', py: 12, minHeight: '60vh' }}>
        <CircularProgress size={48} sx={{ color: NAVY, mb: 2 }} />
        <Typography variant="body1" color="text.secondary" fontWeight={500}>Calcul des indicateurs pédagogiques...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      <Box sx={{ mb: 4 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }}>
          <TrendingUpIcon sx={{ color: NAVY, fontSize: { xs: 40, md: 48 } }} />
          <Box>
            <Typography
              variant="h4"
              fontWeight={900}
              sx={{ letterSpacing: '-0.4px', lineHeight: 1.2, fontSize: { xs: '1.5rem', md: '2.125rem' } }}
            >
              Progression & Analytics
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Pilotez les regles de completion et surveillez les cohortes alimentees par le moteur natif ESGIS.
            </Typography>
          </Box>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <SummaryCard
            title="Cours suivis"
            value={insights.summary.totalCourses}
            subtitle={`${insights.summary.configuredCourses} personnalisés`}
            accent={NAVY}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <SummaryCard
            title="Progression moyenne"
            value={`${Math.round(insights.summary.averageProgress)}%`}
            subtitle={`${insights.summary.totalTrackedStudents} étudiants`}
            accent="#2E7D32"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <SummaryCard
            title="Étudiants à risque"
            value={insights.summary.atRiskStudents}
            subtitle={`${insights.summary.overdueActivities} retards`}
            accent="#CC0000"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <SummaryCard
            title="Projection moyenne"
            value={`${insights.summary.averagePredictedGrade.toFixed(1)}/20`}
            subtitle={`${Math.round(insights.summary.averageAttendance)}% prés.`
            }
            accent="#ED6C02"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} xl={8}>
          <Stack spacing={3}>
            <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: '1px solid #E5E7EB' }}>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', md: 'center' }}
                spacing={2}
                sx={{ mb: 3 }}
              >
                <Box>
                  <Typography variant="h6" fontWeight={800}>Vue par cours</Typography>
                  <Typography variant="body2" color="text.secondary">Suivi de la progression agrégée.</Typography>
                </Box>

                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AutorenewIcon />}
                  onClick={() => refetch()}
                  sx={{ borderRadius: 2, alignSelf: { xs: 'flex-end', md: 'center' } }}
                >
                  Actualiser
                </Button>
              </Stack>

              <TableContainer sx={{ maxHeight: 440 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800 }}>Cours</TableCell>
                      <TableCell sx={{ minWidth: 150, fontWeight: 800 }}>Progression</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800 }}>Effectif</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800 }}>A risque</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800 }}>Présence</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {insights.courses.map((courseItem) => (
                      <TableRow
                        key={courseItem.course.id}
                        hover
                        selected={String(courseItem.course.id) === String(selectedCourseId)}
                        onClick={() => setSelectedCourseId(String(courseItem.course.id))}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight={700}>{courseItem.course.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{courseItem.course.code || 'S/C'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ flex: 1 }}>
                              <LinearProgress variant="determinate" value={courseItem.averageProgress} sx={{ height: 6, borderRadius: 3 }} />
                            </Box>
                            <Typography variant="caption" fontWeight={700}>{Math.round(courseItem.averageProgress)}%</Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">{courseItem.studentCount}</TableCell>
                        <TableCell align="right">
                           <Chip size="small" color={courseItem.atRiskStudents > 0 ? 'error' : 'success'} label={courseItem.atRiskStudents} sx={{ fontWeight: 'bold' }} />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={500}>{courseItem.averageAttendance ? `${Math.round(courseItem.averageAttendance)}%` : '-'}</Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
            {/* ... other sections ... */}
          </Stack>
        </Grid>
        {/* ... right column ... */}
      </Grid>
    </Box>
  );
};

            <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid #E5E7EB' }}>
              <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2 }}>
                <WarningAmberIcon sx={{ color: '#CC0000' }} />
                <Typography variant="h6" fontWeight={800}>
                  Etudiants a surveiller
                </Typography>
              </Stack>

              {insights.studentsNeedingAttention.length ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Etudiant</TableCell>
                        <TableCell>Cours</TableCell>
                        <TableCell align="right">Progression</TableCell>
                        <TableCell align="right">Presence</TableCell>
                        <TableCell align="right">Projection</TableCell>
                        <TableCell align="right">Retards</TableCell>
                        <TableCell align="right">Niveau</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {insights.studentsNeedingAttention.slice(0, 12).map((studentItem) => (
                        <TableRow key={studentItem.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={700}>
                              {studentItem.studentName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {studentItem.studentNumber}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{studentItem.courseName}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {(studentItem.reasons || []).slice(0, 2).join(' · ') || 'Aucun detail'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">{Math.round(studentItem.progress)}%</TableCell>
                          <TableCell align="right">
                            {studentItem.attendance ? `${studentItem.attendance.toFixed(0)}%` : '-'}
                          </TableCell>
                          <TableCell align="right">
                            {studentItem.predictedGrade
                              ? `${studentItem.predictedGrade.toFixed(1)}/20`
                              : '-'}
                          </TableCell>
                          <TableCell align="right">{studentItem.overdueActivities}</TableCell>
                          <TableCell align="right">
                            <Chip
                              size="small"
                              color={severityColors[studentItem.severity] || 'warning'}
                              label={studentItem.severity}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="success" sx={{ borderRadius: 2 }}>
                  Aucun etudiant ne remonte actuellement en vigilance sur vos cours.
                </Alert>
              )}
            </Paper>
          </Stack>
        </Grid>

        <Grid item xs={12} xl={4}>
          <Stack spacing={3}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid #E5E7EB' }}>
              <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2 }}>
                <SettingsSuggestIcon sx={{ color: NAVY }} />
                <Typography variant="h6" fontWeight={800}>
                  Regles de completion
                </Typography>
              </Stack>

              <Stack spacing={2.5}>
                <FormControl fullWidth size="small">
                  <InputLabel id="course-select-label">Cours</InputLabel>
                  <Select
                    labelId="course-select-label"
                    value={selectedCourseId}
                    label="Cours"
                    onChange={(event) => setSelectedCourseId(event.target.value)}
                  >
                    {insights.courses.map((courseItem) => (
                      <MenuItem key={courseItem.course.id} value={String(courseItem.course.id)}>
                        {courseItem.course.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {selectedCourse ? (
                  <>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: '#F8FAFC',
                        border: '1px solid #E5E7EB'
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Typography variant="subtitle2" fontWeight={800}>
                          {selectedCourse.course.name}
                        </Typography>
                        <Chip
                          size="small"
                          variant={selectedCourse.hasCustomSettings ? 'filled' : 'outlined'}
                          color={selectedCourse.hasCustomSettings ? 'primary' : 'default'}
                          label={selectedCourse.hasCustomSettings ? 'Regles personnalisees' : 'Regles ESGIS'}
                        />
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        Dernier recalcul: {formatDate(selectedCourse.updatedAt)}
                      </Typography>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel id="resource-mode-label">Ressources</InputLabel>
                          <Select
                            labelId="resource-mode-label"
                            value={formValues.resource_completion_mode}
                            label="Ressources"
                            onChange={handleScalarFieldChange('resource_completion_mode')}
                          >
                            {resourceModeOptions.map((option) => (
                              <MenuItem key={option.value} value={option.value}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel id="assignment-mode-label">Devoirs</InputLabel>
                          <Select
                            labelId="assignment-mode-label"
                            value={formValues.assignment_completion_mode}
                            label="Devoirs"
                            onChange={handleScalarFieldChange('assignment_completion_mode')}
                          >
                            {assignmentModeOptions.map((option) => (
                              <MenuItem key={option.value} value={option.value}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12}>
                        <FormControl fullWidth size="small">
                          <InputLabel id="forum-mode-label">Forum</InputLabel>
                          <Select
                            labelId="forum-mode-label"
                            value={formValues.forum_completion_mode}
                            label="Forum"
                            onChange={handleScalarFieldChange('forum_completion_mode')}
                          >
                            {forumModeOptions.map((option) => (
                              <MenuItem key={option.value} value={option.value}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label="Cible forum"
                          value={formValues.forum_target_count}
                          onChange={handleScalarFieldChange('forum_target_count')}
                          inputProps={{ min: 0, max: 20 }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label="Seuil quiz (%)"
                          value={formValues.quiz_completion_threshold}
                          onChange={handleScalarFieldChange('quiz_completion_threshold')}
                          inputProps={{ min: 1, max: 100 }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label="Seuil interactif (%)"
                          value={formValues.interactive_completion_threshold}
                          onChange={handleScalarFieldChange('interactive_completion_threshold')}
                          inputProps={{ min: 1, max: 100 }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label="Presence alerte (%)"
                          value={formValues.attendance_alert_threshold}
                          onChange={handleScalarFieldChange('attendance_alert_threshold')}
                          inputProps={{ min: 0, max: 100 }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label="Retards avant alerte"
                          value={formValues.assignment_overdue_alert_threshold}
                          onChange={handleScalarFieldChange('assignment_overdue_alert_threshold')}
                          inputProps={{ min: 1, max: 20 }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label="Seuil de reussite (/20)"
                          value={formValues.passing_grade_threshold}
                          onChange={handleScalarFieldChange('passing_grade_threshold')}
                          inputProps={{ min: 0, max: 20, step: 0.5 }}
                        />
                      </Grid>
                    </Grid>

                    <Box>
                      <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.5 }}>
                        Pondération de la progression
                      </Typography>
                      <Grid container spacing={2}>
                        {Object.entries(weightFieldLabels).map(([field, label]) => (
                          <Grid item xs={12} sm={6} key={field}>
                            <TextField
                              fullWidth
                              size="small"
                              type="number"
                              label={label}
                              value={formValues.course_progress_weights?.[field] ?? 0}
                              onChange={handleWeightChange(field)}
                              inputProps={{ min: 0, max: 100 }}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    </Box>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={handleSave}
                        disabled={saving || resetting}
                        sx={{ borderRadius: 2 }}
                      >
                        {saving ? 'Enregistrement...' : 'Enregistrer'}
                      </Button>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<AutorenewIcon />}
                        onClick={handleReset}
                        disabled={saving || resetting}
                        sx={{ borderRadius: 2 }}
                      >
                        {resetting ? 'Restauration...' : 'Revenir aux regles ESGIS'}
                      </Button>
                    </Stack>
                  </>
                ) : (
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    Selectionnez un cours pour modifier ses regles de completion.
                  </Alert>
                )}
              </Stack>
            </Paper>
          </Stack>
        </Grid>
      </Grid>

      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage('')}
        message={successMessage}
      />
    </Box>
  );
};

export default LearningInsightsPage;
