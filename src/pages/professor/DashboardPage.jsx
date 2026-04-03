import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Button,
  Tabs,
  Tab,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  School as SchoolIcon,
  Event as EventIcon,
  Assignment as AssignmentIcon,
  People as PeopleIcon,
  Notifications as NotificationsIcon,
  CalendarToday as CalendarTodayIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';
import { getProfessorDashboardData } from '@/api/professorDashboard';

const EMPTY_DASHBOARD = {
  stats: null,
  courses: [],
  exams: [],
  pendingGrades: [],
  news: [],
  events: []
};

const formatDisplayDate = (value) => {
  if (!value) {
    return 'Date non disponible';
  }

  try {
    return format(new Date(value), 'dd MMMM yyyy', { locale: fr });
  } catch (error) {
    console.error('Erreur de formatage de date:', error);
    return value;
  }
};

const getExamStatusLabel = (status) => {
  switch (status) {
    case 'draft':
      return 'Brouillon';
    case 'published':
      return 'Publie';
    case 'in_progress':
      return 'En cours';
    case 'grading':
      return 'Correction';
    case 'completed':
      return 'Termine';
    case 'cancelled':
      return 'Annule';
    default:
      return status || 'Inconnu';
  }
};

const getExamStatusColor = (status) => {
  switch (status) {
    case 'draft':
      return 'default';
    case 'published':
      return 'info';
    case 'in_progress':
      return 'warning';
    case 'grading':
      return 'primary';
    case 'completed':
      return 'success';
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
};

const getNewsColor = (category) => {
  switch (category) {
    case 'important':
      return 'error';
    case 'warning':
      return 'warning';
    default:
      return 'info';
  }
};

const getEventColor = (type) => {
  switch (type) {
    case 'reunion':
      return 'error';
    case 'formation':
      return 'info';
    case 'administratif':
      return 'warning';
    default:
      return 'primary';
  }
};

const getEventTypeLabel = (type) => {
  switch (type) {
    case 'reunion':
      return 'Reunion';
    case 'formation':
      return 'Formation';
    case 'administratif':
      return 'Administratif';
    default:
      return 'Autre';
  }
};

const ProfessorDashboardPage = () => {
  const { authState } = useAuth();
  const [dashboardData, setDashboardData] = useState(EMPTY_DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEventType, setSelectedEventType] = useState('tous');
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    let active = true;

    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!authState.isProfessor || !authState.profile?.id) {
          throw new Error('Informations du professeur non disponibles');
        }

        const { data, error: dashboardError } = await getProfessorDashboardData({
          profileId: authState.profile.id,
          professorId: authState.professor?.id
        });

        if (dashboardError) {
          throw dashboardError;
        }

        if (active) {
          setDashboardData(data || EMPTY_DASHBOARD);
        }
      } catch (fetchError) {
        console.error('Erreur lors du chargement du dashboard professeur:', fetchError);
        if (active) {
          setDashboardData(EMPTY_DASHBOARD);
          setError(fetchError.message || 'Une erreur inconnue est survenue');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    if (authState.isProfessor) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }

    return () => {
      active = false;
    };
  }, [authState.isProfessor, authState.profile?.id, authState.professor?.id]);

  const filteredEvents = useMemo(
    () =>
      dashboardData.events.filter((event) => {
        if (selectedEventType === 'tous') {
          return true;
        }

        return event.type === selectedEventType;
      }),
    [dashboardData.events, selectedEventType]
  );

  const handleTabChange = (_event, newValue) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4, px: 2 }}>
      <Typography variant="h4" gutterBottom>
        Tableau de bord
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {dashboardData.stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
              <SchoolIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="h6">{dashboardData.stats.totalStudents}</Typography>
              <Typography variant="body2" color="textSecondary">
                Etudiants
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
              <PeopleIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="h6">{dashboardData.stats.totalCourses}</Typography>
              <Typography variant="body2" color="textSecondary">
                Cours
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
              <AssignmentIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="h6">{dashboardData.stats.totalExams}</Typography>
              <Typography variant="body2" color="textSecondary">
                Examens
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
              <EventIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="h6">{dashboardData.stats.pendingGrades}</Typography>
              <Typography variant="body2" color="textSecondary">
                Notes en attente
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      <Box sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab label="Mes cours" />
          <Tab label="Mes examens" />
          <Tab label="Notes en attente" />
          <Tab label="Actualites" />
          <Tab label="Evenements" />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <Card elevation={3}>
          <CardHeader
            title="Mes cours"
            titleTypographyProps={{ variant: 'h6' }}
            action={
              <Button variant="outlined" component={Link} to="/professor/courses" size="small">
                Voir tout
              </Button>
            }
          />
          <Divider />
          <CardContent sx={{ p: 0 }}>
            <List>
              {dashboardData.courses.length > 0 ? (
                dashboardData.courses.map((course) => (
                  <ListItem key={course.id} divider>
                    <ListItemIcon>
                      <SchoolIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={course.title}
                      secondary={
                        <>
                          <Typography variant="body2" component="span">
                            {course.department} - {course.level}
                          </Typography>
                          <br />
                          <Typography variant="body2" component="span">
                            Etudiants: {course.students} - Sessions: {course.sessions}
                          </Typography>
                        </>
                      }
                    />
                    <Button
                      variant="outlined"
                      size="small"
                      component={Link}
                      to={`/professor/courses?course=${course.id}`}
                    >
                      Gerer
                    </Button>
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText primary="Vous n'avez pas de cours assignes" />
                </ListItem>
              )}
            </List>
          </CardContent>
        </Card>
      )}

      {tabValue === 1 && (
        <Card elevation={3}>
          <CardHeader
            title="Mes examens"
            titleTypographyProps={{ variant: 'h6' }}
            action={
              <Button variant="outlined" component={Link} to="/professor/exams" size="small">
                Voir tout
              </Button>
            }
          />
          <Divider />
          <CardContent sx={{ p: 0 }}>
            <List>
              {dashboardData.exams.length > 0 ? (
                dashboardData.exams.map((exam) => (
                  <ListItem key={exam.id} divider>
                    <ListItemIcon>
                      <AssignmentIcon color={getExamStatusColor(exam.status)} />
                    </ListItemIcon>
                    <ListItemText
                      primary={exam.title}
                      secondary={
                        <>
                          <Typography variant="body2" component="span">
                            {exam.course}
                          </Typography>
                          <br />
                          <Typography variant="body2" component="span">
                            Date: {formatDisplayDate(exam.date)}
                          </Typography>
                          <br />
                          <Chip
                            size="small"
                            label={getExamStatusLabel(exam.status)}
                            color={getExamStatusColor(exam.status)}
                            sx={{ mt: 1 }}
                          />
                        </>
                      }
                    />
                    <Button
                      variant="outlined"
                      size="small"
                      component={Link}
                      to={`/professor/exams/${exam.id}`}
                    >
                      Details
                    </Button>
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText primary="Aucun examen programme" />
                </ListItem>
              )}
            </List>
          </CardContent>
        </Card>
      )}

      {tabValue === 2 && (
        <Card elevation={3}>
          <CardHeader title="Notes en attente" titleTypographyProps={{ variant: 'h6' }} />
          <Divider />
          <CardContent sx={{ p: 0 }}>
            <List>
              {dashboardData.pendingGrades.length > 0 ? (
                dashboardData.pendingGrades.map((grade) => (
                  <ListItem key={grade.id} divider>
                    <ListItemIcon>
                      <AssignmentIcon color="warning" />
                    </ListItemIcon>
                    <ListItemText
                      primary={grade.examTitle}
                      secondary={
                        <>
                          <Typography variant="body2" component="span">
                            Cours: {grade.course}
                          </Typography>
                          <br />
                          <Typography variant="body2" component="span">
                            Date: {formatDisplayDate(grade.date)}
                          </Typography>
                          <br />
                          <Typography variant="body2" component="span">
                            A noter: {grade.pendingCount} etudiant(s)
                          </Typography>
                        </>
                      }
                    />
                    <Button
                      variant="contained"
                      size="small"
                      component={Link}
                      to={`/professor/exams/${grade.examId}/grade`}
                      color="primary"
                    >
                      Noter
                    </Button>
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText primary="Aucune note en attente" />
                </ListItem>
              )}
            </List>
          </CardContent>
        </Card>
      )}

      {tabValue === 3 && (
        <Card elevation={3}>
          <CardHeader title="Actualites" titleTypographyProps={{ variant: 'h6' }} />
          <Divider />
          <CardContent sx={{ p: 0 }}>
            <List>
              {dashboardData.news.length > 0 ? (
                dashboardData.news.map((newsItem) => (
                  <ListItem key={newsItem.id} divider>
                    <ListItemIcon>
                      <NotificationsIcon color={getNewsColor(newsItem.category)} />
                    </ListItemIcon>
                    <ListItemText
                      primary={newsItem.title}
                      secondary={`${(newsItem.content || '').slice(0, 60)}${
                        newsItem.content?.length > 60 ? '...' : ''
                      } - ${formatDisplayDate(newsItem.date)}`}
                    />
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText primary="Aucune actualite recente" />
                </ListItem>
              )}
            </List>
          </CardContent>
        </Card>
      )}

      {tabValue === 4 && (
        <Card elevation={3}>
          <CardHeader
            title="Evenements"
            titleTypographyProps={{ variant: 'h6' }}
            action={
              <FormControl variant="standard" size="small" sx={{ minWidth: 120 }}>
                <InputLabel id="event-type-filter-label">Type</InputLabel>
                <Select
                  labelId="event-type-filter-label"
                  id="event-type-filter"
                  value={selectedEventType}
                  onChange={(event) => setSelectedEventType(event.target.value)}
                  label="Type"
                >
                  <MenuItem value="tous">Tous</MenuItem>
                  <MenuItem value="reunion">Reunions</MenuItem>
                  <MenuItem value="formation">Formations</MenuItem>
                  <MenuItem value="administratif">Administratif</MenuItem>
                  <MenuItem value="autre">Autres</MenuItem>
                </Select>
              </FormControl>
            }
          />
          <Divider />
          <CardContent sx={{ p: 0 }}>
            <List>
              {filteredEvents.length > 0 ? (
                filteredEvents.map((event) => (
                  <ListItem key={event.id} divider>
                    <ListItemIcon>
                      <CalendarTodayIcon color={getEventColor(event.type)} />
                    </ListItemIcon>
                    <ListItemText
                      primary={event.title}
                      secondary={
                        <>
                          <Typography variant="body2" component="span">
                            Date: {formatDisplayDate(event.date)}
                          </Typography>
                          <br />
                          <Typography variant="body2" component="span">
                            Lieu: {event.location}
                          </Typography>
                          <br />
                          <Typography variant="body2" component="span">
                            Type: {getEventTypeLabel(event.type)}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText primary="Aucun evenement programme" />
                </ListItem>
              )}
            </List>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default ProfessorDashboardPage;
