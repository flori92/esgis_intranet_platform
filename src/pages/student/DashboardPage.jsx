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
  School as SchoolIcon
} from '@mui/icons-material';
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
    events: []
  });

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!authState.isAuthenticated || !authState.student?.id || !authState.user?.id) {
          throw new Error('Accès non autorisé');
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
            events: []
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
          events: []
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

      <Typography variant="h4" component="h1" gutterBottom>
        Tableau de bord
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
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
                    to="/schedule"
                    sx={{ mt: 2 }}
                    startIcon={<CalendarTodayIcon />}
                  >
                    Voir l'emploi du temps complet
                  </Button>
                </>
              ) : (
                <Typography variant="body1">Aucun cours à venir</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Notes récentes" avatar={<GradeIcon color="primary" />} />
            <CardContent>
              {dashboardData.recent_grades.length > 0 ? (
                <List>
                  {dashboardData.recent_grades.map((grade) => (
                    <ListItem key={grade.id}>
                      <ListItemText
                        primary={grade.course_name}
                        secondary={`Note: ${grade.value}/${grade.max_value}`}
                      />
                    </ListItem>
                  ))}
                  <Divider />
                  <ListItem>
                    <Button variant="outlined" component={Link} to="/grades" fullWidth>
                      Voir toutes les notes
                    </Button>
                  </ListItem>
                </List>
              ) : (
                <Typography variant="body1">Aucune note publiée récemment</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="Emploi du temps"
              avatar={<CalendarTodayIcon color="primary" />}
              action={
                <FormControl variant="outlined" size="small" sx={{ minWidth: 140 }}>
                  <InputLabel id="day-of-week-filter-label">Jour</InputLabel>
                  <Select
                    labelId="day-of-week-filter-label"
                    value={dayOfWeekFilter}
                    onChange={(event) => setDayOfWeekFilter(event.target.value)}
                    label="Jour"
                  >
                    <MenuItem value="all">Tous les jours</MenuItem>
                    <MenuItem value="lundi">Lundi</MenuItem>
                    <MenuItem value="mardi">Mardi</MenuItem>
                    <MenuItem value="mercredi">Mercredi</MenuItem>
                    <MenuItem value="jeudi">Jeudi</MenuItem>
                    <MenuItem value="vendredi">Vendredi</MenuItem>
                    <MenuItem value="samedi">Samedi</MenuItem>
                  </Select>
                </FormControl>
              }
            />
            <CardContent>
              {filteredSchedule.length > 0 ? (
                <List>
                  {filteredSchedule.map((item) => (
                    <ListItem key={item.id}>
                      <ListItemText
                        primary={item.course_name}
                        secondary={
                          <>
                            <Typography component="span" variant="body2">
                              {getDayOfWeekName(item.day_of_week)} • {formatTime(item.start_time)} - {formatTime(item.end_time)}
                            </Typography>
                            <br />
                            <Typography component="span" variant="body2">
                              {item.room ? `Salle: ${item.room}` : 'Salle non renseignée'}
                              {item.professor_name ? ` • Prof: ${item.professor_name}` : ''}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body1">Aucun cours planifié</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="Événements à venir"
              avatar={<EventIcon color="primary" />}
              action={
                <FormControl variant="outlined" size="small" sx={{ minWidth: 160 }}>
                  <InputLabel id="event-type-filter-label">Type</InputLabel>
                  <Select
                    labelId="event-type-filter-label"
                    value={eventTypeFilter}
                    onChange={(event) => setEventTypeFilter(event.target.value)}
                    label="Type"
                  >
                    <MenuItem value="all">Tous les types</MenuItem>
                    <MenuItem value="general">Général</MenuItem>
                    <MenuItem value="exam">Examen</MenuItem>
                    <MenuItem value="conference">Conférence</MenuItem>
                    <MenuItem value="workshop">Atelier</MenuItem>
                  </Select>
                </FormControl>
              }
            />
            <CardContent>
              {filteredEvents.length > 0 ? (
                <List>
                  {filteredEvents.map((event) => (
                    <ListItem key={event.id}>
                      <ListItemText
                        primary={event.title}
                        secondary={
                          <>
                            <Typography component="span" variant="body2">
                              {formatDate(event.start_date)}
                              {event.end_date && event.start_date !== event.end_date ? ` - ${formatDate(event.end_date)}` : ''}
                            </Typography>
                            <br />
                            <Typography component="span" variant="body2">
                              {event.location ? `Lieu: ${event.location}` : 'Lieu non renseigné'}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body1">Aucun événement à venir</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 3 }}>
            Actualités
          </Typography>
          <Grid container spacing={3}>
            {dashboardData.news.length > 0 ? (
              dashboardData.news.map((item) => (
                <Grid item xs={12} md={4} key={item.id || item.title}>
                  <Card>
                    {item.image_url && (
                      <CardMedia component="img" height="140" image={item.image_url} alt={item.title} />
                    )}
                    <CardContent>
                      <Typography variant="h6">{item.title}</Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {formatDate(item.published_at)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {item.content}
                      </Typography>
                      {item.author && (
                        <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                          Par: {item.author}
                        </Typography>
                      )}
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
