import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
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
import { alpha } from '@mui/material/styles';
import {
  ArrowBack as ArrowBackIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  Gavel as GavelIcon,
  People as PeopleIcon,
  Refresh as RefreshIcon,
  Schedule as ScheduleIcon,
  SignalCellularAlt as SignalCellularAltIcon,
  WarningAmber as WarningAmberIcon
} from '@mui/icons-material';
import { format, formatDistanceToNowStrict, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createRealtimeChannel,
  getProfessorExamMonitoringData,
  removeRealtimeChannel
} from '@/api/exams';

const formatDateTime = (value) => {
  if (!value) {
    return 'N/A';
  }

  try {
    return format(parseISO(value), 'dd/MM/yyyy HH:mm', { locale: fr });
  } catch (_error) {
    return value;
  }
};

const formatRelativeTime = (value) => {
  if (!value) {
    return 'N/A';
  }

  try {
    return `il y a ${formatDistanceToNowStrict(parseISO(value), { locale: fr })}`;
  } catch (_error) {
    return value;
  }
};

const getAttemptStatusChip = (status) => {
  const normalized = status || 'not_started';
  const map = {
    not_started: { label: 'Non commencee', color: 'default' },
    in_progress: { label: 'En composition', color: 'warning' },
    submitted: { label: 'Soumise', color: 'success' }
  };

  const config = map[normalized] || { label: normalized, color: 'default' };
  return <Chip size="small" label={config.label} color={config.color} variant="outlined" />;
};

const getResultStatusChip = (status) => {
  const normalized = status || 'pending';
  const map = {
    pending: { label: 'En attente', color: 'default' },
    passed: { label: 'Validee', color: 'success' },
    failed: { label: 'Echec', color: 'error' },
    absent: { label: 'Absent', color: 'warning' }
  };

  const config = map[normalized] || { label: normalized, color: 'default' };
  return <Chip size="small" label={config.label} color={config.color} variant="outlined" />;
};

const getPresenceChip = (attendance) => {
  const normalized = attendance || 'unknown';
  const map = {
    present: { label: 'Present', color: 'success' },
    absent: { label: 'Absent', color: 'warning' },
    late: { label: 'Retard', color: 'warning' }
  };

  const config = map[normalized] || { label: 'N/A', color: 'default' };
  return <Chip size="small" label={config.label} color={config.color} variant="outlined" />;
};

const getRiskChip = (riskLevel) => {
  const normalized = riskLevel || 'low';
  const map = {
    low: { label: 'Faible', color: 'success' },
    medium: { label: 'Moyen', color: 'warning' },
    high: { label: 'Eleve', color: 'error' },
    critical: { label: 'Critique', color: 'error' }
  };

  const config = map[normalized] || { label: normalized, color: 'default' };
  return <Chip size="small" label={config.label} color={config.color} />;
};

const getLiveStatusChip = (participant) => {
  if (participant.attempt_status === 'submitted') {
    return <Chip size="small" label="Terminee" color="success" />;
  }

  if (participant.is_online) {
    return <Chip size="small" label="En ligne" color="warning" />;
  }

  if (participant.is_stale) {
    return <Chip size="small" label="Ping perdu" color="error" variant="outlined" />;
  }

  if (participant.attempt_status === 'in_progress') {
    return <Chip size="small" label="Hors ligne" color="default" variant="outlined" />;
  }

  return <Chip size="small" label="En attente" color="default" variant="outlined" />;
};

const SummaryCard = ({ icon, label, value, helper, tone = 'primary.main' }) => (
  <Paper variant="outlined" sx={{ p: 2.25, height: '100%', borderRadius: 3 }}>
    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
      {icon}
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Stack>
    <Typography variant="h4" sx={{ color: tone, fontWeight: 800, lineHeight: 1.1 }}>
      {value}
    </Typography>
    {helper ? (
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        {helper}
      </Typography>
    ) : null}
  </Paper>
);

const buildRecentEvents = (participants, incidents) => {
  const events = [
    ...(incidents || []).map((incident) => ({
      id: `incident-${incident.id}`,
      type: 'incident',
      title: incident.student_name || 'Etudiant',
      body: incident.details || 'Incident de surveillance',
      occurredAt: incident.occurred_at
    })),
    ...(participants || [])
      .filter((participant) => participant.submitted_at)
      .map((participant) => ({
        id: `submitted-${participant.id}`,
        type: 'submission',
        title: participant.student_name,
        body: 'Copie soumise',
        occurredAt: participant.submitted_at
      })),
    ...(participants || [])
      .filter((participant) => participant.active_start_time)
      .map((participant) => ({
        id: `started-${participant.id}`,
        type: 'start',
        title: participant.student_name,
        body: 'Connexion a la session d examen',
        occurredAt: participant.active_start_time
      }))
  ];

  return events
    .filter((event) => event.occurredAt)
    .sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime())
    .slice(0, 10);
};

const ExamMonitoringPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const examId = Number(id);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [monitoringData, setMonitoringData] = useState({
    exam: null,
    participants: [],
    activeStudents: [],
    incidents: [],
    summary: null
  });

  const loadMonitoringData = useCallback(async ({ silent = false } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    const { exam, participants, activeStudents, incidents, summary, error: loadError } =
      await getProfessorExamMonitoringData(examId);

    if (loadError) {
      setError(loadError.message || "Impossible de charger le suivi de l'examen.");
      setMonitoringData({
        exam: null,
        participants: [],
        activeStudents: [],
        incidents: [],
        summary: null
      });
    } else {
      setMonitoringData({
        exam,
        participants,
        activeStudents,
        incidents,
        summary
      });
      setLastUpdatedAt(new Date().toISOString());
    }

    setRefreshing(false);
    setLoading(false);
  }, [examId]);

  useEffect(() => {
    loadMonitoringData();
  }, [loadMonitoringData]);

  useEffect(() => {
    if (!examId) {
      return undefined;
    }

    const refreshSilently = () => loadMonitoringData({ silent: true });
    const channel = createRealtimeChannel(`exam-monitor-${examId}`, [
      {
        event: '*',
        schema: 'public',
        table: 'student_exams',
        filter: `exam_id=eq.${examId}`,
        callback: refreshSilently
      },
      {
        event: '*',
        schema: 'public',
        table: 'active_students',
        filter: `exam_id=eq.${examId}`,
        callback: refreshSilently
      },
      {
        event: '*',
        schema: 'public',
        table: 'cheating_attempts',
        filter: `exam_id=eq.${examId}`,
        callback: refreshSilently
      },
      {
        event: '*',
        schema: 'public',
        table: 'exams',
        filter: `id=eq.${examId}`,
        callback: refreshSilently
      }
    ]);

    return () => {
      removeRealtimeChannel(channel);
    };
  }, [examId, loadMonitoringData]);

  const sortedParticipants = useMemo(() => (
    [...monitoringData.participants].sort((left, right) => (
      Number(right.is_online) - Number(left.is_online) ||
      Number(right.attempt_status === 'in_progress') - Number(left.attempt_status === 'in_progress') ||
      Number(right.risk_score || 0) - Number(left.risk_score || 0) ||
      left.student_name.localeCompare(right.student_name, 'fr')
    ))
  ), [monitoringData.participants]);

  const watchlist = useMemo(() => (
    [...monitoringData.participants]
      .filter((participant) => ['high', 'critical'].includes(participant.risk_level))
      .sort((left, right) => (
        Number(right.risk_score || 0) - Number(left.risk_score || 0) ||
        Number(right.detected_incidents || 0) - Number(left.detected_incidents || 0)
      ))
      .slice(0, 8)
  ), [monitoringData.participants]);

  const recentEvents = useMemo(
    () => buildRecentEvents(monitoringData.participants, monitoringData.incidents),
    [monitoringData.incidents, monitoringData.participants]
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4, px: { xs: 1.5, md: 2.5 } }}>
      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', lg: 'flex-start' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/professor/exams')}
            sx={{ mb: 1.5 }}
          >
            Retour aux examens
          </Button>
          <Typography variant="h4" gutterBottom>
            Poste de supervision d examen
          </Typography>
          {monitoringData.exam ? (
            <>
              <Typography variant="h6">
                {monitoringData.exam.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {monitoringData.exam.course_name || 'Cours inconnu'} ({monitoringData.exam.course_code || 'N/A'}) •
                {' '}Salle {monitoringData.exam.room || 'N/A'} • {formatDateTime(monitoringData.exam.date)}
              </Typography>
            </>
          ) : null}
        </Box>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => loadMonitoringData({ silent: true })}
            disabled={refreshing}
          >
            Actualiser
          </Button>
          <Button
            variant="outlined"
            startIcon={<WarningAmberIcon />}
            onClick={() => navigate(`/professor/exams/${examId}/integrity`)}
          >
            Rapport d integrite
          </Button>
          <Button
            variant="contained"
            startIcon={<GavelIcon />}
            onClick={() => navigate(`/professor/exams/${examId}/grade`)}
          >
            Ouvrir la notation
          </Button>
        </Stack>
      </Stack>

      {refreshing ? <LinearProgress sx={{ mb: 2, borderRadius: 999 }} /> : null}

      {error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : null}

      {monitoringData.exam ? (
        <Paper variant="outlined" sx={{ p: 2.5, mb: 3, borderRadius: 3 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.25} flexWrap="wrap" useFlexGap>
            <Chip icon={<ScheduleIcon />} label={`${monitoringData.exam.duration || 0} min`} variant="outlined" />
            <Chip icon={<AssignmentTurnedInIcon />} label={`${monitoringData.exam.question_count || 0} questions`} variant="outlined" />
            <Chip icon={<AssignmentTurnedInIcon />} label={`Barreme ${monitoringData.exam.total_points || 0} pts`} variant="outlined" />
            <Chip icon={<GavelIcon />} label={`Validation ${monitoringData.exam.passing_grade || 0}`} variant="outlined" />
            {lastUpdatedAt ? (
              <Chip
                icon={<RefreshIcon />}
                label={`Derniere mise a jour ${formatRelativeTime(lastUpdatedAt)}`}
                variant="outlined"
              />
            ) : null}
          </Stack>
        </Paper>
      ) : null}

      {monitoringData.summary ? (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} xl={2}>
            <SummaryCard
              icon={<PeopleIcon color="primary" />}
              label="Etudiants assignes"
              value={monitoringData.summary.assignedCount}
              helper={`${monitoringData.summary.notStartedCount} en attente`}
            />
          </Grid>
          <Grid item xs={12} sm={6} xl={2}>
            <SummaryCard
              icon={<SignalCellularAltIcon color="warning" />}
              label="En ligne"
              value={monitoringData.summary.activeCount}
              helper={`${monitoringData.summary.staleCount} ping(s) perdus`}
              tone="warning.main"
            />
          </Grid>
          <Grid item xs={12} sm={6} xl={2}>
            <SummaryCard
              icon={<ScheduleIcon color="warning" />}
              label="En composition"
              value={monitoringData.summary.composingCount}
              helper={`${monitoringData.summary.absentCount} absent(s)`}
              tone="warning.main"
            />
          </Grid>
          <Grid item xs={12} sm={6} xl={2}>
            <SummaryCard
              icon={<AssignmentTurnedInIcon color="success" />}
              label="Copies soumises"
              value={monitoringData.summary.submittedCount}
              helper={`${monitoringData.summary.gradedCount} notees`}
              tone="success.main"
            />
          </Grid>
          <Grid item xs={12} sm={6} xl={2}>
            <SummaryCard
              icon={<WarningAmberIcon color="error" />}
              label="Profils suspects"
              value={monitoringData.summary.suspiciousCount}
              helper={`${monitoringData.summary.incidentsCount} incident(s)`}
              tone="error.main"
            />
          </Grid>
          <Grid item xs={12} sm={6} xl={2}>
            <SummaryCard
              icon={<GavelIcon color="info" />}
              label="Note moyenne"
              value={monitoringData.summary.averageGrade ?? '--'}
              helper={`sur ${monitoringData.exam?.total_points || 0} pts`}
              tone="info.main"
            />
          </Grid>
        </Grid>
      ) : null}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={4}>
          <Paper variant="outlined" sx={{ p: 2.5, height: '100%', borderRadius: 3 }}>
            <Typography variant="h6" gutterBottom>
              Composeurs actifs
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {monitoringData.activeStudents.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Aucun etudiant actif pour le moment.
              </Typography>
            ) : (
              <List disablePadding>
                {monitoringData.activeStudents.map((entry) => (
                  <ListItem key={entry.id} divider disableGutters sx={{ alignItems: 'flex-start' }}>
                    <ListItemText
                      primary={entry.student_name}
                      secondary={
                        <>
                          <Typography variant="body2" color="text.secondary" component="span" display="block">
                            Debut: {formatDateTime(entry.start_time)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" component="span" display="block">
                            Dernier ping: {formatRelativeTime(entry.last_ping)}
                          </Typography>
                        </>
                      }
                    />
                    <Stack direction="column" spacing={1} alignItems="flex-end">
                      {entry.is_completed ? (
                        <Chip size="small" label="Termine" color="success" />
                      ) : entry.is_online ? (
                        <Chip size="small" label="En ligne" color="warning" />
                      ) : (
                        <Chip size="small" label="Ping perdu" color="error" variant="outlined" />
                      )}
                      {Number(entry.cheating_attempts || 0) > 0 ? (
                        <Chip size="small" label={`${entry.cheating_attempts} alerte(s)`} color="error" variant="outlined" />
                      ) : null}
                    </Stack>
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper variant="outlined" sx={{ p: 2.5, height: '100%', borderRadius: 3 }}>
            <Typography variant="h6" gutterBottom>
              Watchlist
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {watchlist.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Aucun profil a risque eleve pour le moment.
              </Typography>
            ) : (
              <List disablePadding>
                {watchlist.map((participant) => (
                  <ListItem key={participant.id} divider disableGutters sx={{ alignItems: 'flex-start' }}>
                    <ListItemText
                      primary={participant.student_name}
                      secondary={
                        <>
                          <Typography variant="body2" color="text.secondary" component="span" display="block">
                            {participant.detected_incidents} incident(s) • Score risque {participant.risk_score}/100
                          </Typography>
                          <Typography variant="body2" color="text.secondary" component="span" display="block">
                            {participant.latest_incident_details || 'Surveillance renforcee conseillee'}
                          </Typography>
                        </>
                      }
                    />
                    {getRiskChip(participant.risk_level)}
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper variant="outlined" sx={{ p: 2.5, height: '100%', borderRadius: 3 }}>
            <Typography variant="h6" gutterBottom>
              Evenements recents
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {recentEvents.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Aucun evenement recent sur cette session.
              </Typography>
            ) : (
              <List disablePadding>
                {recentEvents.map((event) => (
                  <ListItem key={event.id} divider disableGutters sx={{ alignItems: 'flex-start' }}>
                    <ListItemText
                      primary={event.title}
                      secondary={
                        <>
                          <Typography variant="body2" color="text.secondary" component="span" display="block">
                            {event.body}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" component="span" display="block">
                            {formatDateTime(event.occurredAt)} • {formatRelativeTime(event.occurredAt)}
                          </Typography>
                        </>
                      }
                    />
                    {event.type === 'incident' ? (
                      <Chip size="small" label="Alerte" color="error" />
                    ) : event.type === 'submission' ? (
                      <Chip size="small" label="Soumise" color="success" />
                    ) : (
                      <Chip size="small" label="Connexion" color="warning" variant="outlined" />
                    )}
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Paper variant="outlined" sx={{ overflow: 'hidden', borderRadius: 3 }}>
        <Box sx={{ p: 2.5 }}>
          <Typography variant="h6">Vue complete des participants</Typography>
          <Typography variant="body2" color="text.secondary">
            Identification, progression, activite, incidents, risque et note en direct.
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Etudiant</TableCell>
                <TableCell>Place</TableCell>
                <TableCell>Composition</TableCell>
                <TableCell>Resultat</TableCell>
                <TableCell>Progression</TableCell>
                <TableCell>Etat live</TableCell>
                <TableCell>Presence</TableCell>
                <TableCell>Incidents</TableCell>
                <TableCell>Risque</TableCell>
                <TableCell>Note</TableCell>
                <TableCell>Terminee</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedParticipants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} align="center">
                    Aucun participant assigne a cet examen.
                  </TableCell>
                </TableRow>
              ) : (
                sortedParticipants.map((participant) => (
                  <TableRow
                    key={participant.id}
                    hover
                    sx={{
                      backgroundColor: participant.is_online
                        ? alpha('#ed6c02', 0.05)
                        : participant.risk_level === 'critical'
                          ? alpha('#d32f2f', 0.06)
                          : 'inherit'
                    }}
                  >
                    <TableCell>
                      <Typography variant="subtitle2">{participant.student_name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {participant.student_email || participant.student_number || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>{participant.seat_number || 'N/A'}</TableCell>
                    <TableCell>{getAttemptStatusChip(participant.attempt_status)}</TableCell>
                    <TableCell>{getResultStatusChip(participant.status)}</TableCell>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {participant.progress_percentage || 0}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {participant.answered_count || 0}/{participant.question_count || 0}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.75} alignItems="flex-start">
                        {getLiveStatusChip(participant)}
                        <Typography variant="body2" color="text.secondary">
                          {participant.active_last_ping
                            ? `Derniere activite ${formatRelativeTime(participant.active_last_ping)}`
                            : participant.submitted_at
                              ? `Soumise ${formatRelativeTime(participant.submitted_at)}`
                              : 'Aucune activite'}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{getPresenceChip(participant.attendance)}</TableCell>
                    <TableCell>
                      <Stack spacing={0.75} alignItems="flex-start">
                        <Chip
                          size="small"
                          color={participant.detected_incidents > 0 ? 'error' : 'default'}
                          label={`${participant.detected_incidents || 0}`}
                          variant="outlined"
                        />
                        {participant.latest_incident_details ? (
                          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 220 }}>
                            {participant.latest_incident_details}
                          </Typography>
                        ) : null}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.75} alignItems="flex-start">
                        {getRiskChip(participant.risk_level)}
                        <Typography variant="body2" color="text.secondary">
                          {participant.risk_score || 0}/100
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      {participant.grade !== null && participant.grade !== undefined
                        ? `${participant.grade}/${monitoringData.exam?.total_points || 0}`
                        : participant.attempt_status === 'submitted'
                          ? 'En attente'
                          : '--'}
                    </TableCell>
                    <TableCell>
                      {participant.submitted_at ? (
                        <>
                          <Typography variant="body2">{formatDateTime(participant.submitted_at)}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {formatRelativeTime(participant.submitted_at)}
                          </Typography>
                        </>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default ExamMonitoringPage;
