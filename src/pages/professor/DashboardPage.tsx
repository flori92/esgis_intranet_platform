import React, { useState, useEffect } from 'react';
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
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import {
  School as SchoolIcon,
  Event as EventIcon,
  Assignment as AssignmentIcon,
  People as PeopleIcon,
  Notifications as NotificationsIcon,
  CalendarToday as CalendarTodayIcon,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useAuth, AuthContextType } from '../../context/AuthContext';
import supabase from '../../services/supabase';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  mockProfessorStats, 
  mockProfessorCourses, 
  mockProfessorExams, 
  mockPendingGrades, 
  mockProfessorNews, 
  mockProfessorEvents,
  formatDate,
  formatTime,
  ProfessorStats,
  ProfessorCourse,
  ProfessorExam,
  PendingGrade,
  ProfessorNewsItem,
  ProfessorEventItem
} from '../../utils/professorMockData';

const ProfessorDashboardPage: React.FC = () => {
  // État pour les données
  const { authState } = useAuth() as AuthContextType;
  const [stats, setStats] = useState<ProfessorStats | null>(null);
  const [courses, setCourses] = useState<ProfessorCourse[]>([]);
  const [exams, setExams] = useState<ProfessorExam[]>([]);
  const [pendingGrades, setPendingGrades] = useState<PendingGrade[]>([]);
  const [news, setNews] = useState<ProfessorNewsItem[]>([]);
  const [events, setEvents] = useState<ProfessorEventItem[]>([]);
  
  // État pour le chargement et les erreurs
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // État pour les filtres
  const [selectedDay, setSelectedDay] = useState<string>('tous');
  const [selectedEventType, setSelectedEventType] = useState<string>('tous');
  
  // État pour les onglets
  const [tabValue, setTabValue] = useState(0);

  // Fonction pour charger les données du tableau de bord
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      if (!authState.user || !authState.professor) {
        throw new Error('Informations du professeur non disponibles');
      }

      // Essayer de récupérer les données de Supabase, utiliser les données mock en cas d'erreur
      try {
        // Ici, nous utiliserions les vraies requêtes Supabase
        // En cas d'erreur, les blocs catch ci-dessous utiliseront les données mock
      } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
      }
      
      // Utiliser les données mock pour le moment
      setStats(mockProfessorStats);
      setCourses(mockProfessorCourses);
      setExams(mockProfessorExams);
      setPendingGrades(mockPendingGrades);
      setNews(mockProfessorNews);
      setEvents(mockProfessorEvents);
      
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Une erreur inconnue est survenue');
      }
      
      // Utiliser les données mock en cas d'erreur
      setStats(mockProfessorStats);
      setCourses(mockProfessorCourses);
      setExams(mockProfessorExams);
      setPendingGrades(mockPendingGrades);
      setNews(mockProfessorNews);
      setEvents(mockProfessorEvents);
      
      setLoading(false);
    }
  };

  // Charger les données au chargement du composant
  useEffect(() => {
    if (authState.isProfessor) {
      fetchDashboardData();
    }
  }, [authState.isProfessor]);

  // Gérer les changements de filtres
  const handleDayFilterChange = (event: SelectChangeEvent<string>) => {
    setSelectedDay(event.target.value);
  };

  const handleEventTypeFilterChange = (event: SelectChangeEvent<string>) => {
    setSelectedEventType(event.target.value);
  };

  // Filtrer les cours par jour
  const filteredCourses = courses.filter(course => {
    if (selectedDay === 'tous') return true;
    if (!course.nextSession) return false;
    
    const courseDay = format(new Date(course.nextSession), 'EEEE', { locale: fr });
    return courseDay.toLowerCase() === selectedDay.toLowerCase();
  });

  // Filtrer les événements par type
  const filteredEvents = events.filter(event => {
    if (selectedEventType === 'tous') return true;
    return event.type === selectedEventType;
  });

  // Gérer le changement d'onglet
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Afficher un message de chargement
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Afficher un message d'erreur
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Tableau de bord professeur
      </Typography>

      {/* Salutation personnalisée */}
      <Typography variant="h6" sx={{ mb: 3, color: '#003366' }}>
        Bienvenue, {authState.professor?.full_name || 'Professeur'} !
      </Typography>

      {/* Widgets de statistiques */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: '#e3f2fd',
              borderLeft: '4px solid #1976d2',
            }}
          >
            <Typography variant="subtitle2" color="textSecondary">
              Cours
            </Typography>
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
              <SchoolIcon sx={{ fontSize: 40, color: '#1976d2', mr: 2 }} />
              <Typography variant="h4">{stats?.totalCourses || 0}</Typography>
            </Box>
            <Typography variant="body2">Total de cours enseignés</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: '#e8f5e9',
              borderLeft: '4px solid #2e7d32',
            }}
          >
            <Typography variant="subtitle2" color="textSecondary">
              Étudiants
            </Typography>
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
              <PeopleIcon sx={{ fontSize: 40, color: '#2e7d32', mr: 2 }} />
              <Typography variant="h4">{stats?.totalStudents || 0}</Typography>
            </Box>
            <Typography variant="body2">Total d'étudiants</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: '#fff8e1',
              borderLeft: '4px solid #ff9800',
            }}
          >
            <Typography variant="subtitle2" color="textSecondary">
              Examens
            </Typography>
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
              <AssignmentIcon sx={{ fontSize: 40, color: '#ff9800', mr: 2 }} />
              <Typography variant="h4">{stats?.upcomingExams || 0}</Typography>
            </Box>
            <Typography variant="body2">Examens à venir</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: '#ffebee',
              borderLeft: '4px solid #d32f2f',
            }}
          >
            <Typography variant="subtitle2" color="textSecondary">
              Notes
            </Typography>
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
              <AssignmentIcon sx={{ fontSize: 40, color: '#d32f2f', mr: 2 }} />
              <Typography variant="h4">{stats?.pendingGrades || 0}</Typography>
            </Box>
            <Typography variant="body2">Notes à publier</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Onglets */}
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        indicatorColor="primary"
        textColor="primary"
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Vue d'ensemble" />
        <Tab label="Mes cours" />
        <Tab label="Examens" />
        <Tab label="Actualités" />
        <Tab label="Événements" />
      </Tabs>

      {/* Vue d'ensemble */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          {/* Cours du jour */}
          <Grid item xs={12} md={6} lg={4}>
            <Card elevation={3} sx={{ height: '100%' }}>
              <CardHeader
                title="Cours du jour"
                titleTypographyProps={{ variant: 'h6' }}
                action={
                  <FormControl variant="standard" size="small" sx={{ minWidth: 120 }}>
                    <InputLabel id="day-filter-label">Jour</InputLabel>
                    <Select
                      labelId="day-filter-label"
                      id="day-filter"
                      value={selectedDay}
                      onChange={handleDayFilterChange}
                      label="Jour"
                    >
                      <MenuItem value="tous">Tous</MenuItem>
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
              <Divider />
              <CardContent sx={{ p: 0 }}>
                <List>
                  {filteredCourses.filter(course => course.nextSession).length > 0 ? (
                    filteredCourses
                      .filter(course => course.nextSession)
                      .sort((a, b) => {
                        if (!a.nextSession || !b.nextSession) return 0;
                        return new Date(a.nextSession).getTime() - new Date(b.nextSession).getTime();
                      })
                      .slice(0, 5)
                      .map((course) => (
                        <ListItem key={course.id} divider>
                          <SchoolIcon sx={{ mr: 2, color: '#003366' }} />
                          <ListItemText
                            primary={course.name}
                            secondary={
                              course.nextSession
                                ? `${formatDate(course.nextSession)} à ${formatTime(
                                    course.nextSession
                                  )} - Salle ${course.room}`
                                : 'Aucune session programmée'
                            }
                          />
                          <Button
                            variant="outlined"
                            size="small"
                            component={Link}
                            to={`/professor/courses/${course.id}`}
                            sx={{ ml: 2 }}
                          >
                            Détails
                          </Button>
                        </ListItem>
                      ))
                  ) : (
                    <ListItem>
                      <ListItemText primary="Aucun cours programmé pour ce jour" />
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Notes à publier */}
          <Grid item xs={12} md={6} lg={4}>
            <Card elevation={3} sx={{ height: '100%' }}>
              <CardHeader title="Notes à publier" titleTypographyProps={{ variant: 'h6' }} />
              <Divider />
              <CardContent sx={{ p: 0 }}>
                <List>
                  {pendingGrades.length > 0 ? (
                    pendingGrades.map((grade) => (
                      <ListItem key={grade.id} divider>
                        <AssignmentIcon sx={{ mr: 2, color: '#d32f2f' }} />
                        <ListItemText
                          primary={grade.courseName}
                          secondary={
                            <>
                              <Typography variant="body2" component="span">
                                Type: {grade.examType === 'final' ? 'Examen final' : grade.examType === 'midterm' ? 'Examen partiel' : 'Quiz'}
                              </Typography>
                              <br />
                              <Typography variant="body2" component="span">
                                Échéance: {formatDate(grade.dueDate)}
                              </Typography>
                              <br />
                              <Typography variant="body2" component="span">
                                Progression: {grade.gradedCount}/{grade.studentsCount} ({Math.round((grade.gradedCount / grade.studentsCount) * 100)}%)
                              </Typography>
                            </>
                          }
                        />
                        <Button
                          variant="contained"
                          size="small"
                          color="primary"
                          component={Link}
                          to={`/professor/grades/${grade.courseId}`}
                          sx={{ ml: 2 }}
                        >
                          Saisir
                        </Button>
                      </ListItem>
                    ))
                  ) : (
                    <ListItem>
                      <ListItemText primary="Aucune note en attente de publication" />
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Actualités */}
          <Grid item xs={12} md={6} lg={4}>
            <Card elevation={3} sx={{ height: '100%' }}>
              <CardHeader title="Actualités récentes" titleTypographyProps={{ variant: 'h6' }} />
              <Divider />
              <CardContent sx={{ p: 0 }}>
                <List>
                  {news.length > 0 ? (
                    news.map((newsItem) => (
                      <ListItem key={newsItem.id} divider>
                        <ListItemIcon>
                          <NotificationsIcon
                            color={
                              newsItem.category === 'important'
                                ? 'error'
                                : newsItem.category === 'information'
                                ? 'info'
                                : 'warning'
                            }
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={newsItem.title}
                          secondary={`${newsItem.content.substring(0, 60)}... - ${formatDate(
                            newsItem.date
                          )}`}
                        />
                      </ListItem>
                    ))
                  ) : (
                    <ListItem>
                      <ListItemText primary="Aucune actualité récente" />
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Mes cours */}
      {tabValue === 1 && (
        <Card elevation={3}>
          <CardHeader title="Mes cours" titleTypographyProps={{ variant: 'h6' }} />
          <Divider />
          <CardContent sx={{ p: 0 }}>
            <List>
              {courses.length > 0 ? (
                courses.map((course) => (
                  <ListItem key={course.id} divider>
                    <ListItemIcon>
                      <SchoolIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {course.name}
                          <Chip
                            label={course.code}
                            size="small"
                            sx={{ ml: 1, bgcolor: '#003366', color: 'white' }}
                          />
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" component="span">
                            Département: {course.department}
                          </Typography>
                          <br />
                          <Typography variant="body2" component="span">
                            {course.students} étudiants inscrits
                          </Typography>
                          <br />
                          <Typography variant="body2" component="span">
                            {course.nextSession
                              ? `Prochaine session: ${formatDate(course.nextSession)} à ${formatTime(
                                  course.nextSession
                                )} - Salle ${course.room}`
                              : 'Aucune session programmée'}
                          </Typography>
                        </>
                      }
                    />
                    <Button
                      variant="outlined"
                      size="small"
                      component={Link}
                      to={`/professor/courses/${course.id}`}
                      sx={{ ml: 2 }}
                    >
                      Détails
                    </Button>
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText primary="Aucun cours assigné" />
                </ListItem>
              )}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Examens */}
      {tabValue === 2 && (
        <Card elevation={3}>
          <CardHeader title="Examens à venir" titleTypographyProps={{ variant: 'h6' }} />
          <Divider />
          <CardContent sx={{ p: 0 }}>
            <List>
              {exams.length > 0 ? (
                exams.map((exam) => (
                  <ListItem key={exam.id} divider>
                    <ListItemIcon>
                      <AssignmentIcon
                        color={
                          exam.type === 'final'
                            ? 'error'
                            : exam.type === 'midterm'
                            ? 'warning'
                            : 'info'
                        }
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {exam.courseName}
                          <Chip
                            label={
                              exam.type === 'final'
                                ? 'Examen final'
                                : exam.type === 'midterm'
                                ? 'Examen partiel'
                                : 'Quiz'
                            }
                            size="small"
                            sx={{
                              ml: 1,
                              bgcolor:
                                exam.type === 'final'
                                  ? '#CC0000'
                                  : exam.type === 'midterm'
                                  ? '#FF9800'
                                  : '#2196F3',
                              color: 'white',
                            }}
                          />
                          <Chip
                            label={
                              exam.status === 'upcoming'
                                ? 'À venir'
                                : exam.status === 'completed'
                                ? 'Terminé'
                                : 'Noté'
                            }
                            size="small"
                            sx={{
                              ml: 1,
                              bgcolor:
                                exam.status === 'upcoming'
                                  ? '#2196F3'
                                  : exam.status === 'completed'
                                  ? '#FF9800'
                                  : '#4CAF50',
                              color: 'white',
                            }}
                          />
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" component="span">
                            Date: {formatDate(exam.date)} à {formatTime(exam.date)}
                          </Typography>
                          <br />
                          <Typography variant="body2" component="span">
                            Durée: {exam.duration} minutes - Salle: {exam.room}
                          </Typography>
                        </>
                      }
                    />
                    <Button
                      variant="outlined"
                      size="small"
                      component={Link}
                      to={`/professor/exams/${exam.id}`}
                      sx={{ ml: 2 }}
                    >
                      Détails
                    </Button>
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText primary="Aucun examen programmé" />
                </ListItem>
              )}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Actualités */}
      {tabValue === 3 && (
        <Card elevation={3}>
          <CardHeader title="Actualités" titleTypographyProps={{ variant: 'h6' }} />
          <Divider />
          <CardContent sx={{ p: 0 }}>
            <List>
              {news.length > 0 ? (
                news.map((newsItem) => (
                  <ListItem key={newsItem.id} divider>
                    <ListItemIcon>
                      <NotificationsIcon
                        color={
                          newsItem.category === 'important'
                            ? 'error'
                            : newsItem.category === 'information'
                            ? 'info'
                            : 'warning'
                        }
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={newsItem.title}
                      secondary={`${newsItem.content.substring(0, 60)}... - ${formatDate(
                        newsItem.date
                      )}`}
                    />
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText primary="Aucune actualité récente" />
                </ListItem>
              )}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Événements */}
      {tabValue === 4 && (
        <Card elevation={3}>
          <CardHeader 
            title="Événements" 
            titleTypographyProps={{ variant: 'h6' }} 
            action={
              <FormControl variant="standard" size="small" sx={{ minWidth: 120 }}>
                <InputLabel id="event-type-filter-label">Type</InputLabel>
                <Select
                  labelId="event-type-filter-label"
                  id="event-type-filter"
                  value={selectedEventType}
                  onChange={handleEventTypeFilterChange}
                  label="Type"
                >
                  <MenuItem value="tous">Tous</MenuItem>
                  <MenuItem value="reunion">Réunions</MenuItem>
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
                      <CalendarTodayIcon
                        color={
                          event.type === 'reunion'
                            ? 'error'
                            : event.type === 'formation'
                            ? 'info'
                            : event.type === 'administratif'
                            ? 'warning'
                            : 'primary'
                        }
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={event.title}
                      secondary={
                        <>
                          <Typography variant="body2" component="span">
                            Date: {formatDate(event.date)}
                          </Typography>
                          <br />
                          <Typography variant="body2" component="span">
                            Lieu: {event.location}
                          </Typography>
                          <br />
                          <Typography variant="body2" component="span">
                            Type: {event.type}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText primary="Aucun événement programmé" />
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
