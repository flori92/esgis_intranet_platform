import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Gavel as GavelIcon,
  People as PeopleIcon,
  Refresh as RefreshIcon,
  Timer as TimerIcon,
  WarningAmber as WarningAmberIcon
} from '@mui/icons-material';
import { format, formatDistanceToNowStrict, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate, useParams } from 'react-router-dom';
import { getProfessorExamMonitoringData } from '@/api/exams';
import { supabase } from '@/supabase';

const getRelation = (value) => (Array.isArray(value) ? value[0] : value);

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
    not_started: { label: 'Non commence', color: 'default' },
    in_progress: { label: 'En cours', color: 'warning' },
    submitted: { label: 'Soumis', color: 'success' }
  };

  const config = map[normalized] || { label: normalized, color: 'default' };

  return <Chip size="small" label={config.label} color={config.color} variant="outlined" />;
};

const getResultStatusChip = (status) => {
  const normalized = status || 'pending';
  const map = {
    pending: { label: 'En attente', color: 'default' },
    passed: { label: 'Valide', color: 'success' },
    failed: { label: 'Echec', color: 'error' },
    absent: { label: 'Absent', color: 'warning' }
  };

  const config = map[normalized] || { label: normalized, color: 'default' };

  return <Chip size="small" label={config.label} color={config.color} variant="outlined" />;
};

const SummaryCard = ({ icon, label, value, tone = 'primary.main' }) => (
  <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
      {icon}
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Box>
    <Typography variant="h4" sx={{ color: tone, fontWeight: 700 }}>
      {value}
    </Typography>
  </Paper>
);

const ExamMonitoringPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const examId = Number(id);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [monitoringData, setMonitoringData] = useState({
    exam: null,
    participants: [],
    activeStudents: [],
    incidents: [],
    summary: null
  });

  const loadMonitoringData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { exam, participants, activeStudents, incidents, summary, error: loadError } = await getProfessorExamMonitoringData(examId);

    if (loadError) {
      setError(loadError.message || "Impossible de charger le suivi de l'examen.");
      setMonitoringData({
        exam: null,
        participants: [],
        activeStudents: [],
        incidents: [],
        summary: null
      });
      setLoading(false);
      return;
    }

    setMonitoringData({
      exam,
      participants,
      activeStudents,
      incidents,
      summary
    });
    setLoading(false);
  }, [examId]);

  useEffect(() => {
    loadMonitoringData();
  }, [loadMonitoringData]);

  useEffect(() => {
    if (!examId) {
      return undefined;
    }

    const channel = supabase
      .channel(`exam-monitor-${examId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'student_exams',
        filter: `exam_id=eq.${examId}`
      }, () => loadMonitoringData())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'active_students',
        filter: `exam_id=eq.${examId}`
      }, () => loadMonitoringData())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'cheating_attempts',
        filter: `exam_id=eq.${examId}`
      }, () => loadMonitoringData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [examId, loadMonitoringData]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4, px: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Box>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/professor/exams')}
            sx={{ mb: 1 }}
          >
            Retour aux examens
          </Button>
          <Typography variant="h4" gutterBottom>
            Suivi temps reel de l'examen
          </Typography>
          {monitoringData.exam && (
            <>
              <Typography variant="h6">
                {monitoringData.exam.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {monitoringData.exam.course_name || 'Cours inconnu'} ({monitoringData.exam.course_code || 'N/A'}) - {formatDateTime(monitoringData.exam.date)}
              </Typography>
            </>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadMonitoringData}>
            Actualiser
          </Button>
          <Button
            variant="contained"
            startIcon={<GavelIcon />}
            onClick={() => navigate(`/professor/exams/${examId}/grade`)}
          >
            Ouvrir la notation
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {monitoringData.summary && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} lg={3}>
            <SummaryCard icon={<PeopleIcon color="primary" />} label="Etudiants assignes" value={monitoringData.summary.assignedCount} />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <SummaryCard icon={<TimerIcon color="warning" />} label="Actifs maintenant" value={monitoringData.summary.activeCount} tone="warning.main" />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <SummaryCard icon={<GavelIcon color="success" />} label="Copies soumises" value={monitoringData.summary.submittedCount} tone="success.main" />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <SummaryCard icon={<WarningAmberIcon color="error" />} label="Incidents detectes" value={monitoringData.summary.incidentsCount} tone="error.main" />
          </Grid>
        </Grid>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={5}>
          <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Etudiants actifs
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {monitoringData.activeStudents.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Aucun etudiant actif pour le moment.
              </Typography>
            ) : (
              <List disablePadding>
                {monitoringData.activeStudents.map((entry) => {
                  const profile = getRelation(entry.profiles);
                  return (
                    <ListItem key={entry.id} divider disableGutters>
                      <ListItemText
                        primary={profile?.full_name || 'Etudiant'}
                        secondary={`Dernier ping: ${formatRelativeTime(entry.last_ping)} | Debut: ${formatDateTime(entry.start_time)}`}
                      />
                      <Chip size="small" color={entry.is_completed ? 'default' : 'warning'} label={entry.is_completed ? 'Termine' : 'En ligne'} />
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} lg={7}>
          <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Incidents recents
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {monitoringData.incidents.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Aucun incident remonte sur cet examen.
              </Typography>
            ) : (
              <List disablePadding>
                {monitoringData.incidents.slice(0, 8).map((incident) => {
                  const profile = getRelation(incident.profiles);
                  return (
                    <ListItem key={incident.id} divider disableGutters>
                      <ListItemText
                        primary={`${profile?.full_name || 'Etudiant'} - ${incident.details || 'Incident signale'}`}
                        secondary={`${formatDateTime(incident.timestamp || incident.detected_at)} | Compteur: ${incident.attempt_count || 1}`}
                      />
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">Participants</Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Etudiant</TableCell>
                <TableCell>Place</TableCell>
                <TableCell>Tentative</TableCell>
                <TableCell>Resultat</TableCell>
                <TableCell>Presence</TableCell>
                <TableCell>Activite</TableCell>
                <TableCell>Incidents</TableCell>
                <TableCell>Note</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {monitoringData.participants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    Aucun participant assigne a cet examen.
                  </TableCell>
                </TableRow>
              ) : (
                monitoringData.participants.map((participant) => (
                  <TableRow key={participant.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2">{participant.student_name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {participant.student_email || participant.student_number || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>{participant.seat_number || 'N/A'}</TableCell>
                    <TableCell>{getAttemptStatusChip(participant.attempt_status)}</TableCell>
                    <TableCell>{getResultStatusChip(participant.status)}</TableCell>
                    <TableCell>{participant.attendance || 'N/A'}</TableCell>
                    <TableCell>
                      {participant.is_active ? (
                        <Chip size="small" color="warning" label={`Actif (${formatRelativeTime(participant.active_last_ping)})`} />
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          {participant.active_last_ping ? `Derniere activite ${formatRelativeTime(participant.active_last_ping)}` : 'Hors ligne'}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={participant.detected_incidents > 0 ? 'error' : 'default'}
                        label={participant.detected_incidents}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {participant.grade !== null && participant.grade !== undefined
                        ? `${participant.grade}/${monitoringData.exam?.total_points || 0}`
                        : 'En attente'}
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
