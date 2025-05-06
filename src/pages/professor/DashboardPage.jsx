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
  MenuItem
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
import { useAuth } from '../../context/AuthContext';
// Correction du chemin d'importation de Supabase
import { supabase } from '@/supabase';
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
  formatTime
} from '@/utils/professorMockData';

/**
 * Page de tableau de bord pour les professeurs
 * Affiche des statistiques, cours, examens, notes en attente, actualités et événements
 */
const ProfessorDashboardPage = () => {
  // État pour les données
  const { authState } = useAuth();
  const [stats, setStats] = useState(null);
  const [courses, setCourses] = useState([]);
  const [exams, setExams] = useState([]);
  const [pendingGrades, setPendingGrades] = useState([]);
  const [news, setNews] = useState([]);
  const [events, setEvents] = useState([]);
  
  // État pour le chargement et les erreurs
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // État pour les filtres
  const [selectedDay, setSelectedDay] = useState('tous');
  const [selectedEventType, setSelectedEventType] = useState('tous');
  
  // État pour les onglets
  const [tabValue, setTabValue] = useState(0);

  /**
   * Fonction pour charger les données du tableau de bord
   */
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
      setError(error.message || 'Une erreur inconnue est survenue');
      
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

  /**
   * Gérer les changements de filtres
   */
  const handleDayFilterChange = (event) => {
    setSelectedDay(event.target.value);
  };

  const handleEventTypeFilterChange = (event) => {
    setSelectedEventType(event.target.value);
  };

  // Filtrer les événements en fonction des filtres sélectionnés
  const filteredEvents = events.filter((event) => {
    if (selectedDay !== 'tous') {
      const today = new Date();
      const eventDate = new Date(event.date);
      
      if (selectedDay === 'aujourd_hui' && formatDate(eventDate) !== formatDate(today)) {
        return false;
      }
      
      if (selectedDay === 'semaine') {
        const diffTime = Math.abs(eventDate - today);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 7) {
          return false;
        }
      }

      if (selectedDay === 'mois') {
        const diffTime = Math.abs(eventDate - today);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 30) {
          return false;
        }
      }
    }
    
    if (selectedEventType !== 'tous' && event.type !== selectedEventType) {
      return false;
    }
    
    return true;
  });

  /**
   * Gérer le changement d'onglet
   */
  const handleTabChange = (_event, newValue) => {
    setTabValue(newValue);
  };

  // Si chargement
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
      
      {/* Statistiques */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
              <SchoolIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="h6">{stats.totalStudents}</Typography>
              <Typography variant="body2" color="textSecondary">Étudiants</Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
              <PeopleIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="h6">{stats.totalCourses}</Typography>
              <Typography variant="body2" color="textSecondary">Cours</Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
              <AssignmentIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="h6">{stats.totalExams}</Typography>
              <Typography variant="body2" color="textSecondary">Examens</Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
              <EventIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="h6">{stats.pendingGrades}</Typography>
              <Typography variant="body2" color="textSecondary">Notes en attente</Typography>
            </Paper>
          </Grid>
        </Grid>
      )}
      
      {/* Onglets */}
      <Box sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Mes cours" />
          <Tab label="Mes examens" />
          <Tab label="Notes en attente" />
          <Tab label="Actualités" />
          <Tab label="Événements" />
        </Tabs>
      </Box>
      
      {/* Contenu des onglets */}
      {/* Mes cours */}
      {tabValue === 0 && (
        <Card elevation={3}>
          <CardHeader 
            title="Mes cours" 
            titleTypographyProps={{ variant: 'h6' }} 
            action={
              <Button 
                variant="outlined" 
                component={Link} 
                to="/professor/courses"
                size="small"
              >
                Voir tout
              </Button>
            }
          />
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
                      primary={course.title}
                      secondary={
                        <>
                          <Typography variant="body2" component="span">
                            {course.department} - {course.level}
                          </Typography>
                          <br />
                          <Typography variant="body2" component="span">
                            Étudiants: {course.students} - Sessions: {course.sessions}
                          </Typography>
                        </>
                      }
                    />
                    <Button
                      variant="outlined"
                      size="small"
                      component={Link}
                      to={`/professor/courses/${course.id}`}
                    >
                      Détails
                    </Button>
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText primary="Vous n'avez pas de cours assignés" />
                </ListItem>
              )}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Mes examens */}
      {tabValue === 1 && (
        <Card elevation={3}>
          <CardHeader 
            title="Mes examens" 
            titleTypographyProps={{ variant: 'h6' }} 
            action={
              <Button 
                variant="outlined" 
                component={Link} 
                to="/professor/exams"
                size="small"
              >
                Voir tout
              </Button>
            }
          />
          <Divider />
          <CardContent sx={{ p: 0 }}>
            <List>
              {exams.length > 0 ? (
                exams.map((exam) => (
                  <ListItem key={exam.id} divider>
                    <ListItemIcon>
                      <AssignmentIcon 
                        color={
                          exam.status === 'scheduled' 
                            ? 'info' 
                            : exam.status === 'in_progress' 
                            ? 'warning' 
                            : 'success'
                        } 
                      />
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
                            Date: {formatDate(exam.date)}
                          </Typography>
                          <br />
                          <Typography variant="body2" component="span">
                            Statut: {exam.status === 'scheduled' 
                              ? 'Programmé' 
                              : exam.status === 'in_progress' 
                              ? 'En cours' 
                              : 'Terminé'}
                          </Typography>
                        </>
                      }
                    />
                    <Button
                      variant="outlined"
                      size="small"
                      component={Link}
                      to={`/professor/exams/${exam.id}`}
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

      {/* Notes en attente */}
      {tabValue === 2 && (
        <Card elevation={3}>
          <CardHeader 
            title="Notes en attente" 
            titleTypographyProps={{ variant: 'h6' }} 
          />
          <Divider />
          <CardContent sx={{ p: 0 }}>
            <List>
              {pendingGrades.length > 0 ? (
                pendingGrades.map((grade) => (
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
                            Date: {formatDate(grade.date)}
                          </Typography>
                          <br />
                          <Typography variant="body2" component="span">
                            À noter: {grade.pendingCount} étudiant(s)
                          </Typography>
                        </>
                      }
                    />
                    <Button
                      variant="contained"
                      size="small"
                      component={Link}
                      to={`/professor/exams/${grade.examId}/grading`}
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
