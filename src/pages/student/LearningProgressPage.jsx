import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import {
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  AutoGraph as AutoGraphIcon,
  MenuBook as MenuBookIcon,
  MilitaryTech as MilitaryTechIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  WarningAmber as WarningAmberIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { useAuth } from '@/context/AuthContext';
import { getStudentLearningProgress } from '@/api/learningProgress';

const NAVY = '#003366';
const RED = '#CC0000';

const levelLabels = {
  beginner: 'Debutant',
  intermediate: 'Intermediaire',
  advanced: 'Avance',
  expert: 'Expert'
};

const severityColors = {
  low: 'info',
  medium: 'warning',
  high: 'error',
  critical: 'error'
};

const statusLabels = {
  active: 'Actif',
  completed: 'Termine',
  paused: 'En pause'
};

const activityStatusLabels = {
  not_started: 'Non commence',
  in_progress: 'En cours',
  completed: 'Termine',
  overdue: 'En retard',
  failed: 'Echoue'
};

const formatDate = (value) => {
  if (!value) {
    return '-';
  }

  try {
    return format(new Date(value), 'dd MMM yyyy', { locale: fr });
  } catch {
    return value;
  }
};

const SummaryCard = ({ icon, title, value, subtitle, accent }) => (
  <Paper
    elevation={0}
    sx={{
      p: 3,
      borderRadius: 2,
      border: '1px solid #E5E7EB',
      borderTop: `4px solid ${accent}`,
      height: '100%'
    }}
  >
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: `${accent}14`,
          color: accent
        }}
      >
        {icon}
      </Box>
      <Typography variant="body2" color="text.secondary" fontWeight={700}>
        {title}
      </Typography>
    </Stack>

    <Typography variant="h4" fontWeight={900} sx={{ color: NAVY, mb: 0.5 }}>
      {value}
    </Typography>
    <Typography variant="body2" color="text.secondary">
      {subtitle}
    </Typography>
  </Paper>
);

const EmptyState = ({ title, description }) => (
  <Box
    sx={{
      py: 5,
      px: 2,
      textAlign: 'center',
      border: '1px dashed #D1D5DB',
      borderRadius: 2
    }}
  >
    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
      {title}
    </Typography>
    <Typography variant="body2" color="text.secondary">
      {description}
    </Typography>
  </Box>
);

const StudentLearningProgressPage = () => {
  const { authState } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progressData, setProgressData] = useState(null);

  useEffect(() => {
    const loadProgress = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!authState.isStudent || !authState.profile?.id || !authState.student?.id) {
          throw new Error('Acces non autorise');
        }

        const { data, error: progressError } = await getStudentLearningProgress({
          profileId: authState.profile.id,
          studentId: authState.student.id
        });

        if (progressError) {
          throw progressError;
        }

        setProgressData(data);
      } catch (loadError) {
        console.error('Erreur lors du chargement de la progression etudiante:', loadError);
        setError(loadError.message || 'Impossible de charger votre progression pour le moment.');
        setProgressData(null);
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, [authState.isStudent, authState.profile?.id, authState.student?.id]);

  const groupedCompetencies = useMemo(() => {
    const groups = {};

    (progressData?.competencies || []).forEach((competency) => {
      const category = competency.category || 'Autres';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(competency);
    });

    return Object.entries(groups);
  }, [progressData?.competencies]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const summary = progressData?.summary || {
    activePaths: 0,
    averageProgress: 0,
    totalActivities: 0,
    completedActivities: 0,
    overdueActivities: 0,
    coursesInProgress: 0,
    competenciesCount: 0,
    masteredCompetencies: 0,
    activeAlerts: 0,
    atRiskCourses: 0,
    averageAttendance: 0,
    predictedAverage: 0,
    totalLearningHours: 0
  };
  const courseActivityRows = progressData?.courseActivity || [];
  const overdueActivities = progressData?.overdueActivities || [];

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          fontWeight={900}
          sx={{ letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: 1.5 }}
        >
          <TrendingUpIcon sx={{ color: NAVY, fontSize: 40 }} />
          Parcours & Progression
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Suivez vos parcours d apprentissage, vos competences acquises et les signaux academiques a surveiller.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <SummaryCard
            icon={<TrendingUpIcon />}
            title="Progression globale"
            value={`${Math.round(summary.averageProgress)}%`}
            subtitle={`${summary.activePaths} parcours actifs · ${summary.coursesInProgress} cours en cours`}
            accent={NAVY}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <SummaryCard
            icon={<AssignmentTurnedInIcon />}
            title="Activites"
            value={`${summary.completedActivities}/${summary.totalActivities}`}
            subtitle={`${summary.overdueActivities} activite(s) en retard`}
            accent="#ED6C02"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <SummaryCard
            icon={<MilitaryTechIcon />}
            title="Competences"
            value={summary.competenciesCount}
            subtitle={`${summary.masteredCompetencies} competences a niveau avance ou expert`}
            accent="#2E7D32"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <SummaryCard
            icon={<WarningAmberIcon />}
            title="Alertes academiques"
            value={summary.activeAlerts}
            subtitle={`${summary.atRiskCourses} cours marques a risque`}
            accent={RED}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={7}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid #E5E7EB' }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
              <TimelineIcon sx={{ color: NAVY }} />
              <Typography variant="h6" fontWeight={800}>
                Parcours d apprentissage
              </Typography>
            </Stack>

            {(progressData?.learningPaths || []).length ? (
              <Stack spacing={2}>
                {progressData.learningPaths.map((path) => (
                  <Box
                    key={path.id}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      border: '1px solid #E5E7EB',
                      backgroundColor: '#FFFFFF'
                    }}
                  >
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      justifyContent="space-between"
                      alignItems={{ xs: 'flex-start', sm: 'center' }}
                      spacing={1}
                      sx={{ mb: 1 }}
                    >
                      <Box>
                        <Typography variant="subtitle1" fontWeight={800}>
                          {path.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {path.course?.name || 'Parcours transversal'}
                        </Typography>
                      </Box>
                      <Chip
                        size="small"
                        label={statusLabels[path.status] || path.status || 'Actif'}
                        color={path.status === 'completed' ? 'success' : 'primary'}
                      />
                    </Stack>

                    {path.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                        {path.description}
                      </Typography>
                    )}

                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ mb: 1 }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Progression
                      </Typography>
                      <Typography variant="body2" fontWeight={700}>
                        {Math.round(path.progress)}%
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={path.progress}
                      sx={{ height: 8, borderRadius: 4, mb: 1.5 }}
                    />

                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={2}
                      useFlexGap
                      sx={{ color: 'text.secondary' }}
                    >
                      <Typography variant="body2">
                        Ressources completes: {path.completedResources}/{path.totalResources || 0}
                      </Typography>
                      <Typography variant="body2">
                        Charge estimee: {path.estimatedHours ? `${path.estimatedHours} h` : 'n.c.'}
                      </Typography>
                      <Typography variant="body2">
                        Mise a jour: {formatDate(path.updatedAt)}
                      </Typography>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            ) : (
              <EmptyState
                title="Aucun parcours visible"
                description="Aucun parcours d apprentissage n a encore ete assigne a votre profil."
              />
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid #E5E7EB', mb: 3 }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
              <WarningAmberIcon sx={{ color: RED }} />
              <Typography variant="h6" fontWeight={800}>
                Alertes & vigilance
              </Typography>
            </Stack>

            {(progressData?.alerts || []).length ? (
              <Stack spacing={1.5}>
                {progressData.alerts.slice(0, 6).map((alertItem) => (
                  <Box
                    key={alertItem.id}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      border: '1px solid #E5E7EB',
                      backgroundColor: alertItem.resolved ? '#F8FAFC' : '#FFF7ED'
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" spacing={1} sx={{ mb: 0.75 }}>
                      <Typography variant="subtitle2" fontWeight={800}>
                        {alertItem.title}
                      </Typography>
                      <Chip
                        size="small"
                        color={severityColors[alertItem.severity] || 'warning'}
                        label={alertItem.severity || 'medium'}
                      />
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
                      {alertItem.description || 'Aucune precision complementaire.'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {alertItem.course?.name ? `${alertItem.course.name} · ` : ''}
                      {formatDate(alertItem.triggeredAt)}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            ) : (
              <EmptyState
                title="Aucune alerte active"
                description="Aucun signal academique critique n a ete detecte pour le moment."
              />
            )}
          </Paper>

          <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid #E5E7EB' }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
              <AutoGraphIcon sx={{ color: '#ED6C02' }} />
              <Typography variant="h6" fontWeight={800}>
                Indicateurs globaux
              </Typography>
            </Stack>

            <Stack spacing={2}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Presence moyenne
                </Typography>
                <Typography variant="h5" fontWeight={800} sx={{ color: NAVY }}>
                  {summary.averageAttendance ? summary.averageAttendance.toFixed(0) : 0}%
                </Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Moyenne previsionnelle
                </Typography>
                <Typography variant="h5" fontWeight={800} sx={{ color: NAVY }}>
                  {summary.predictedAverage ? summary.predictedAverage.toFixed(1) : '0.0'}/20
                </Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Heures d apprentissage tracees
                </Typography>
                <Typography variant="h5" fontWeight={800} sx={{ color: NAVY }}>
                  {summary.totalLearningHours ? summary.totalLearningHours.toFixed(1) : '0.0'} h
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid #E5E7EB' }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
              <MenuBookIcon sx={{ color: NAVY }} />
              <Typography variant="h6" fontWeight={800}>
                Progression par cours
              </Typography>
            </Stack>

            {courseActivityRows.length ? (
              <Stack spacing={2.5}>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Cours</TableCell>
                        <TableCell sx={{ minWidth: 220 }}>Progression</TableCell>
                        <TableCell align="right">Activites</TableCell>
                        <TableCell align="right">En retard</TableCell>
                        <TableCell align="right">Derniere activite</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {courseActivityRows.slice(0, 10).map((courseItem) => (
                        <TableRow key={courseItem.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={700}>
                              {courseItem.course?.name || 'Cours'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {courseItem.course?.code || 'Sans code'}
                              {courseItem.course?.semester ? ` · S${courseItem.course.semester}` : ''}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Stack spacing={0.75}>
                              <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography variant="caption" color="text.secondary">
                                  {courseItem.completedActivities}/{courseItem.totalActivities} terminees
                                </Typography>
                                <Typography variant="body2" fontWeight={700}>
                                  {Math.round(courseItem.averageProgress)}%
                                </Typography>
                              </Stack>
                              <LinearProgress
                                variant="determinate"
                                value={courseItem.averageProgress}
                                sx={{ height: 8, borderRadius: 4 }}
                              />
                            </Stack>
                          </TableCell>
                          <TableCell align="right">
                            {courseItem.completedActivities}/{courseItem.totalActivities}
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              size="small"
                              color={courseItem.overdueActivities ? 'error' : 'success'}
                              label={courseItem.overdueActivities ? `${courseItem.overdueActivities}` : '0'}
                            />
                          </TableCell>
                          <TableCell align="right">{formatDate(courseItem.lastActivityAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {overdueActivities.length ? (
                  <Box>
                    <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.25, color: RED }}>
                      Activites a relancer
                    </Typography>
                    <Stack spacing={1.25}>
                      {overdueActivities.slice(0, 4).map((item) => (
                        <Box
                          key={item.id}
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            border: '1px solid #FECACA',
                            backgroundColor: '#FEF2F2'
                          }}
                        >
                          <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            justifyContent="space-between"
                            spacing={1}
                            sx={{ mb: 0.75 }}
                          >
                            <Box>
                              <Typography variant="subtitle2" fontWeight={800}>
                                {item.title}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {item.course?.name || 'Cours'} · {item.typeLabel}
                              </Typography>
                            </Box>
                            <Chip size="small" color="error" label={activityStatusLabels[item.status] || item.status} />
                          </Stack>
                          <Typography variant="caption" color="text.secondary">
                            {item.dueAt
                              ? `Echeance ${formatDate(item.dueAt)}`
                              : `Derniere activite ${formatDate(item.lastActivityAt)}`}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                ) : null}
              </Stack>
            ) : (
              <EmptyState
                title="Aucune activite tracee"
                description="La progression par cours apparaitra ici des que vos interactions ESGIS seront calculees."
              />
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} lg={7}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid #E5E7EB' }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
              <MilitaryTechIcon sx={{ color: '#2E7D32' }} />
              <Typography variant="h6" fontWeight={800}>
                Competences acquises
              </Typography>
            </Stack>

            {groupedCompetencies.length ? (
              <Stack spacing={2.5}>
                {groupedCompetencies.map(([category, competencies]) => (
                  <Box key={category}>
                    <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.25, color: NAVY }}>
                      {category}
                    </Typography>
                    <Stack spacing={1.25}>
                      {competencies.map((competency) => (
                        <Box
                          key={competency.id}
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            border: '1px solid #E5E7EB'
                          }}
                        >
                          <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            justifyContent="space-between"
                            spacing={1}
                            sx={{ mb: 1 }}
                          >
                            <Box>
                              <Typography variant="subtitle2" fontWeight={800}>
                                {competency.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {competency.description || competency.source || 'Competence rattachee a votre parcours'}
                              </Typography>
                            </Box>
                            <Chip
                              size="small"
                              color={['advanced', 'expert'].includes(competency.level) ? 'success' : 'primary'}
                              label={levelLabels[competency.level] || competency.level}
                            />
                          </Stack>

                          <LinearProgress
                            variant="determinate"
                            value={competency.score}
                            sx={{ height: 8, borderRadius: 4, mb: 0.75 }}
                          />

                          <Typography variant="caption" color="text.secondary">
                            {competency.verified ? 'Competence validee' : 'Competence detectee'} · {formatDate(competency.acquiredAt)}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                ))}
              </Stack>
            ) : (
              <EmptyState
                title="Aucune competence tracee"
                description="Aucune competence n a encore ete associee a votre dossier academique."
              />
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid #E5E7EB' }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
              <MenuBookIcon sx={{ color: NAVY }} />
              <Typography variant="h6" fontWeight={800}>
                Analyse par cours
              </Typography>
            </Stack>

            {(progressData?.analytics || []).length ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Cours</TableCell>
                      <TableCell align="right">Presence</TableCell>
                      <TableCell align="right">Projection</TableCell>
                      <TableCell align="right">Risque</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {progressData.analytics.slice(0, 8).map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700}>
                            {item.course?.name || 'Cours'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.course?.code || 'Sans code'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {item.attendance ? `${item.attendance.toFixed(0)}%` : '-'}
                        </TableCell>
                        <TableCell align="right">
                          {item.predictedGrade ? `${item.predictedGrade.toFixed(1)}/20` : '-'}
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            size="small"
                            color={item.riskFlag ? 'error' : 'success'}
                            label={item.riskFlag ? 'A surveiller' : 'Stable'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <EmptyState
                title="Pas encore de donnees analytiques"
                description="Les indicateurs de performance apparaitront ici des que les donnees de cours seront consolidees."
              />
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StudentLearningProgressPage;
