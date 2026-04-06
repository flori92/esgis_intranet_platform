import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardMedia,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  Typography
} from '@mui/material';
import {
  CalendarToday as CalendarTodayIcon,
  Event as EventIcon,
  Grade as GradeIcon,
  School as SchoolIcon,
  Assignment as RequestIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  Description as DocumentIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { Stack, Table, TableBody, TableRow, TableCell, Chip } from '@mui/material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';
import { getStudentDashboardData } from '@/api/studentDashboard';

const getDayOfWeekName = (dayOfWeek) => {
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  return days[dayOfWeek] || '';
};

const formatDate = (dateString) => {
  if (!dateString) {
    return '-';
  }

  try {
    return format(new Date(dateString), 'PPP', { locale: fr });
  } catch {
    return dateString;
  }
};

const formatTime = (dateString) => {
  if (!dateString) {
    return '--:--';
  }

  try {
    return format(new Date(dateString), 'HH:mm');
  } catch {
    return '--:--';
  }
};

const DashboardPage = () => {
  const { authState } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dayOfWeekFilter, setDayOfWeekFilter] = useState('all');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [dashboardData, setDashboardData] = useState({
    next_course: null,
    recent_grades: [],
    schedule: [],
    news: [],
    events: [],
    requests: [],
    upcoming_exams: []
  });

  const stats = useMemo(() => {
    const requests = dashboardData?.requests || [];
    const exams = dashboardData?.upcoming_exams || [];
    const news = dashboardData?.news || [];

    return {
      pendingRequests: requests.filter(r => r.status !== 'ready' && r.status !== 'rejected').length,
      upcomingExams: exams.length,
      recentNews: news.length
    };
  }, [dashboardData]);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!authState.isAuthenticated || !authState.student?.id || !authState.user?.id) {
          throw new Error('Accès non autorisé ou profil incomplet');
        }

        const { data, error: dashboardError } = await getStudentDashboardData({
          profileId: authState.user.id,
          studentId: authState.student.id
        });

        if (dashboardError) {
          throw dashboardError;
        }

        setDashboardData(
          data || {
            next_course: null,
            recent_grades: [],
            schedule: [],
            news: [],
            events: [],
            requests: [],
            upcoming_exams: []
          }
        );
      } catch (loadError) {
        console.error('Erreur lors du chargement du dashboard étudiant:', loadError);
        setError(loadError.message || 'Impossible de charger le tableau de bord.');
        setDashboardData({
          next_course: null,
          recent_grades: [],
          schedule: [],
          news: [],
          events: [],
          requests: [],
          upcoming_exams: []
        });
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [authState.isAuthenticated, authState.student?.id, authState.user?.id]);

  const filteredSchedule = useMemo(() => {
    if (dayOfWeekFilter === 'all') {
      return dashboardData.schedule;
    }

    return dashboardData.schedule.filter((item) => {
      const dayName = format(new Date(item.start_time), 'EEEE', { locale: fr });
      return dayName.toLowerCase() === dayOfWeekFilter.toLowerCase();
    });
  }, [dashboardData.schedule, dayOfWeekFilter]);

  const filteredEvents = useMemo(() => {
    if (eventTypeFilter === 'all') {
      return dashboardData.events;
    }

    return dashboardData.events.filter((event) => event.event_type === eventTypeFilter);
  }, [dashboardData.events, eventTypeFilter]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Bonjour, {authState.profile?.full_name?.split(' ')[0] || 'Étudiant'} 👋
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          {format(new Date(), 'PPPP', { locale: fr })}
        </Typography>
      </Stack>

      {/* Barre d'Actions Urgentes */}
      {(stats.upcomingExams > 0 || stats.pendingRequests > 0) && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom color="error.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon fontSize="small" /> Actions prioritaires
          </Typography>
          <Grid container spacing={2}>
            {dashboardData.upcoming_exams.map(exam => (
              <Grid item xs={12} md={6} key={exam.id}>
                <Alert 
                  severity="warning" 
                  action={
                    <Button color="inherit" size="small" component={Link} to={`/student/exams`}>
                      Voir l'examen
                    </Button>
                  }
                >
                  <Typography variant="body2" fontWeight="bold">Examen imminent : {exam.title}</Typography>
                  <Typography variant="caption">Début à {formatTime(exam.start_time)}</Typography>
                </Alert>
              </Grid>
            ))}
            {dashboardData.requests.filter(r => r.status === 'ready').map(req => (
              <Grid item xs={12} md={6} key={req.id}>
                <Alert 
                  severity="success" 
                  action={
                    <Button color="inherit" size="small" component={Link} to="/student/requests">
                      Télécharger
                    </Button>
                  }
                >
                  <Typography variant="body2" fontWeight="bold">Document disponible : {req.request_type}</Typography>
                  <Typography variant="caption">Votre demande a été finalisée.</Typography>
                </Alert>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      <Grid container spacing={3}>
        {/* Résumé de situation */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%', borderLeft: '4px solid #003366' }}>
                <CardHeader title="Prochain cours" avatar={<SchoolIcon color="primary" />} />
                <CardContent>
                  {dashboardData.next_course ? (
                    <>
                      <Typography variant="h6">{dashboardData.next_course.name}</Typography>
                      <Typography variant="body1" color="text.secondary">
                        {formatDate(dashboardData.next_course.time)} à {formatTime(dashboardData.next_course.time)}
                      </Typography>
                      <Button
                        variant="outlined"
                        component={Link}
                        to="/student/schedule"
                        sx={{ mt: 2 }}
                        startIcon={<CalendarTodayIcon />}
                        size="small"
                      >
                        Mon emploi du temps
                      </Button>
                    </>
                  ) : (
                    <Typography variant="body1">Aucun cours à venir</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%', borderLeft: '4px solid #CC0000' }}>
                <CardHeader title="Dernières notes" avatar={<GradeIcon color="error" />} />
                <CardContent>
                  {dashboardData.recent_grades.length > 0 ? (
                    <List dense sx={{ py: 0 }}>
                      {dashboardData.recent_grades.map((grade) => (
                        <ListItem key={grade.id} sx={{ px: 0 }}>
                          <ListItemText
                            primary={grade.course_name}
                            secondary={`Note: ${grade.value}/${grade.max_value}`}
                          />
                        </ListItem>
                      ))}
                      <Button variant="text" component={Link} to="/student/grades" fullWidth size="small">
                        Voir tous mes résultats
                      </Button>
                    </List>
                  ) : (
                    <Typography variant="body1">Aucune note publiée récemment</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardHeader 
                  title="Suivi des Demandes" 
                  avatar={<RequestIcon color="secondary" />} 
                  action={<Button size="small" component={Link} to="/student/requests">Voir tout</Button>}
                />
                <CardContent sx={{ pt: 0 }}>
                  {dashboardData.requests.length > 0 ? (
                    <Table size="small">
                      <TableBody>
                        {dashboardData.requests.map(req => (
                          <TableRow key={req.id}>
                            <TableCell sx={{ pl: 0 }}>{req.request_type}</TableCell>
                            <TableCell align="right">
                              <Chip 
                                label={req.status} 
                                size="small" 
                                color={req.status === 'ready' ? 'secondary' : req.status === 'approved' ? 'success' : 'default'} 
                                variant="outlined" 
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <Typography variant="body2" color="text.secondary">Aucune demande en cours.</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Colonne latérale événements */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardHeader title="Agenda" avatar={<EventIcon color="primary" />} />
            <CardContent>
              {dashboardData.events.length > 0 ? (
                <List dense>
                  {dashboardData.events.map((event) => (
                    <ListItem key={event.id} alignItems="flex-start" sx={{ px: 0 }}>
                      <ListItemText
                        primary={event.title}
                        secondary={
                          <>
                            <Typography component="span" variant="caption" display="block">
                              {formatDate(event.start_date)} • {event.location}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2">Aucun événement à venir</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 3, fontWeight: 'bold' }}>
            Actualités ESGIS
          </Typography>
          <Grid container spacing={3}>
            {dashboardData.news.length > 0 ? (
              dashboardData.news.map((item) => (
                <Grid item xs={12} md={4} key={item.id || item.title}>
                  <Card sx={{ height: '100%' }}>
                    {item.image_url && (
                      <CardMedia component="img" height="140" image={item.image_url} alt={item.title} />
                    )}
                    <CardContent>
                      <Typography variant="h6" gutterBottom>{item.title}</Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {formatDate(item.published_at)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {item.content}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Alert severity="info">Aucune actualité publiée pour le moment.</Alert>
              </Grid>
            )}
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
