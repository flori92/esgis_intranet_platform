import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  CircularProgress,
  Alert,
  Grid,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  CardHeader,
  CardMedia,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Badge
} from '@mui/material';

import {
  Event as EventIcon,
  Grade as GradeIcon,
  School as SchoolIcon,
  Notifications as NotificationsIcon,
  CalendarToday as CalendarTodayIcon
} from '@mui/icons-material';
import { supabase } from '@/services/supabase';
import { useAuth } from '../../hooks/useAuth';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { initializeMockData, mockNews, mockEvents } from '../../utils/mockDataInitializer';

/**
 * @typedef {Object} StudentDashboardData
 * @property {Object} [next_course] - Prochain cours de l'étudiant
 * @property {string} next_course.name - Nom du prochain cours
 * @property {string} next_course.time - Heure du prochain cours
 * @property {Array<Object>} [recent_grades] - Notes récentes de l'étudiant
 * @property {number} recent_grades.id - Identifiant de la note
 * @property {string} recent_grades.course_name - Nom du cours
 * @property {number} recent_grades.value - Valeur de la note
 * @property {number} recent_grades.max_value - Valeur maximale de la note
 */

/**
 * @typedef {Object} ScheduleItem
 * @property {number} id - Identifiant du cours
 * @property {string} course_name - Nom du cours
 * @property {string} start_time - Heure de début
 * @property {string} end_time - Heure de fin
 * @property {number} day_of_week - Jour de la semaine (0-6)
 * @property {string} [room] - Salle de cours
 * @property {string} [professor_name] - Nom du professeur
 */

// Définition des données mock pour l'emploi du temps
const mockSchedule = [
  {
    id: 1,
    course_name: 'Algorithmique Avancée',
    start_time: '2025-05-04T08:30:00Z',
    end_time: '2025-05-04T10:30:00Z',
    day_of_week: 1,
    room: 'B201',
    professor_name: 'Dr. Martin Dubois'
  },
  {
    id: 2,
    course_name: 'Développement Web Frontend',
    start_time: '2025-05-04T13:00:00Z',
    end_time: '2025-05-04T16:00:00Z',
    day_of_week: 1,
    room: 'Labo Info 3',
    professor_name: 'Mme. Sophie Laurent'
  },
  {
    id: 3,
    course_name: 'Base de Données Relationnelles',
    start_time: '2025-05-05T08:30:00Z',
    end_time: '2025-05-05T11:30:00Z',
    day_of_week: 2,
    room: 'A105',
    professor_name: 'Prof. Thomas Moreau'
  }
];

/**
 * Page du tableau de bord étudiant
 * Affiche les informations essentielles pour l'étudiant : prochain cours, notes récentes,
 * emploi du temps, événements à venir et actualités
 */
const DashboardPage = () => {
  const { authState } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({});
  const [schedule, setSchedule] = useState([]);
  const [filteredSchedule, setFilteredSchedule] = useState([]);
  const [dayOfWeekFilter, setDayOfWeekFilter] = useState('');
  const [news, setNews] = useState([]);
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [eventTypeFilter, setEventTypeFilter] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!authState.isAuthenticated || !authState.student) {
        setLoading(false);
        return;
      }

      try {
        // Au lieu d'utiliser une fonction RPC qui n'existe pas, nous utilisons des données mock
        // Dans une implémentation réelle, cette fonction RPC devrait être créée côté Supabase
        /*
        const { data, error } = await supabase
          .rpc('get_student_dashboard', { student_id: authState.student.id });
          
        if (error) {
          throw error;
        }
        */
        
        // Utilisation de données mock pour le dashboard
        const mockDashboardData = { 
          next_course: { 
            name: 'Intelligence Artificielle',
            time: '2025-05-06T09:00:00Z'
          },
          recent_grades: [
            { id: 1, course_name: 'Algorithmique', value: 16, max_value: 20 },
            { id: 2, course_name: 'Développement Web', value: 14.5, max_value: 20 }
          ]
        };
        
        setDashboardData(mockDashboardData);
        
        // Au lieu d'utiliser une table 'schedule' qui n'existe pas, nous utilisons des données mock
        // Dans une implémentation réelle, cette table devrait être créée côté Supabase
        /*
        const { data: scheduleData, error: scheduleError } = await supabase
          .from('schedule')
          .select('*')
          .eq('student_id', authState.student.id)
          .order('day_of_week')
          .order('start_time');
          
        if (scheduleError) {
          throw scheduleError;
        }
        
        setSchedule(scheduleData && scheduleData.length > 0 ? scheduleData : mockSchedule);
        */
        
        // Utilisation de données mock pour l'emploi du temps
        setSchedule(mockSchedule);
        setFilteredSchedule(mockSchedule);
        
        // Au lieu d'utiliser une table 'news' qui n'existe pas, nous utilisons des données mock
        // Dans une implémentation réelle, cette table devrait être créée côté Supabase
        /*
        const { data: newsData, error: newsError } = await supabase
          .from('news')
          .select('*')
          .order('published_at', { ascending: false })
          .limit(3);
          
        if (newsError) {
          throw newsError;
        }
        
        setNews(newsData && newsData.length > 0 ? newsData : mockNews);
        */
        
        // Utilisation de données mock pour les actualités
        setNews(mockNews);
        
        // Récupération des événements depuis la table 'events'
        try {
          const { data: eventsData, error: eventsError } = await supabase
            .from('events')
            .select('*')
            .gte('start_date', new Date().toISOString())
            .order('start_date')
            .limit(5);
            
          if (eventsError) {
            throw eventsError;
          }
          
          // Conversion des données d'événements au format EventItem
          if (eventsData && eventsData.length > 0) {
            const formattedEvents = eventsData.map(event => {
              // Extraction des propriétés existantes
              const { 
                id, 
                title, 
                description, 
                start_date, 
                end_date, 
                location, 
                type, 
                created_by, 
                created_at, 
                updated_at 
              } = event;
              
              // Conversion au format EventItem avec valeurs par défaut pour les propriétés manquantes
              return {
                id,
                title,
                description,
                start_date,
                end_date,
                location,
                event_type: (type || 'other'),
                all_day: false,
                course_id: null, // Valeur par défaut si la propriété n'existe pas
                exam_id: null, // Valeur par défaut si la propriété n'existe pas
                created_by: created_by || '',
                created_at: created_at || new Date().toISOString(),
                updated_at: updated_at || new Date().toISOString()
              };
            });
            setEvents(formattedEvents);
            setFilteredEvents(formattedEvents);
          } else {
            setEvents(mockEvents);
            setFilteredEvents(mockEvents);
          }
        } catch (eventError) {
          console.error('Erreur lors de la récupération des événements:', eventError);
          setEvents(mockEvents);
          setFilteredEvents(mockEvents);
        }
        
      } catch (err) {
        console.error('Erreur lors de la récupération des données du dashboard:', err);
        setError('Erreur lors du chargement des données. Veuillez réessayer plus tard.');
        
        // Utilisation des données mock en cas d'erreur
        setDashboardData({ 
          next_course: { 
            name: 'Intelligence Artificielle',
            time: '2025-05-06T09:00:00Z'
          },
          recent_grades: [
            { id: 1, course_name: 'Algorithmique', value: 16, max_value: 20 },
            { id: 2, course_name: 'Développement Web', value: 14.5, max_value: 20 }
          ]
        });
        setSchedule(mockSchedule);
        setFilteredSchedule(mockSchedule);
        setNews(mockNews);
        setEvents(mockEvents);
        setFilteredEvents(mockEvents);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [authState.isAuthenticated, authState.student]);

  /**
   * Fonction pour gérer le changement de filtre
   * @param {Object} event - Événement de changement
   */
  const handleFilterChange = (event) => {
    setDayOfWeekFilter(event.target.value);
  };

  /**
   * Fonction pour gérer le changement de recherche
   * @param {Object} event - Événement de changement
   */
  const handleSearchChange = (event) => {
    setEventTypeFilter(event.target.value);
  };

  /**
   * Gestionnaire pour le changement de filtre par jour de la semaine
   * @param {Object} event - Événement de changement
   */
  const handleDayOfWeekFilterChange = (event) => {
    const target = event.target;
    const value = target.value;
    setDayOfWeekFilter(value);
    
    if (value === 'all') {
      setFilteredSchedule(schedule);
    } else {
      const filtered = schedule.filter(item => {
        const date = new Date(item.start_time);
        const dayOfWeek = format(date, 'EEEE', { locale: fr });
        return dayOfWeek.toLowerCase() === value.toLowerCase();
      });
      setFilteredSchedule(filtered);
    }
  };

  /**
   * Gestionnaire pour le changement de filtre par type d'événement
   * @param {Object} event - Événement de changement
   */
  const handleEventTypeFilterChange = (event) => {
    const target = event.target;
    const value = target.value;
    setEventTypeFilter(value);
    
    if (value === 'all') {
      setFilteredEvents(events);
    } else {
      const filtered = events.filter(event => event.event_type === value);
      setFilteredEvents(filtered);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  /**
   * Formater la date pour l'affichage
   * @param {string} dateString - Chaîne de date à formater
   * @returns {string} Date formatée
   */
  const formatDate = (dateString) => {
    return format(new Date(dateString), 'PPP', { locale: fr });
  };

  /**
   * Formater l'heure pour l'affichage
   * @param {string} dateString - Chaîne de date à formater
   * @returns {string} Heure formatée
   */
  const formatTime = (dateString) => {
    return format(new Date(dateString), 'HH:mm');
  };

  /**
   * Obtenir le nom du jour de la semaine
   * @param {number} dayOfWeek - Jour de la semaine (0-6)
   * @returns {string} Nom du jour de la semaine
   */
  const getDayOfWeekName = (dayOfWeek) => {
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    return days[dayOfWeek] || '';
  };

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

      {/* Prochain cours */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Prochain cours" 
              avatar={<SchoolIcon color="primary" />}
            />
            <CardContent>
              {dashboardData.next_course ? (
                <>
                  <Typography variant="h6" component="div">
                    {dashboardData.next_course.name}
                  </Typography>
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
                <Typography variant="body1">
                  Aucun cours à venir
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Notes récentes */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Notes récentes" 
              avatar={<GradeIcon color="primary" />}
            />
            <CardContent>
              {dashboardData.recent_grades && dashboardData.recent_grades.length > 0 ? (
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
                    <Button 
                      variant="outlined" 
                      component={Link} 
                      to="/grades" 
                      fullWidth
                    >
                      Voir toutes les notes
                    </Button>
                  </ListItem>
                </List>
              ) : (
                <Typography variant="body1">
                  Aucune note récente
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Emploi du temps */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Emploi du temps" 
              avatar={<CalendarTodayIcon color="primary" />}
              action={
                <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
                  <InputLabel id="day-of-week-filter-label">Jour</InputLabel>
                  <Select
                    labelId="day-of-week-filter-label"
                    value={dayOfWeekFilter}
                    onChange={handleDayOfWeekFilterChange}
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
                              {item.room && `Salle: ${item.room}`} {item.professor_name && `• Prof: ${item.professor_name}`}
                            </Typography>
                          </>
                        } 
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body1">
                  Aucun cours planifié
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Événements à venir */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Événements à venir" 
              avatar={<EventIcon color="primary" />}
              action={
                <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
                  <InputLabel id="event-type-filter-label">Type</InputLabel>
                  <Select
                    labelId="event-type-filter-label"
                    value={eventTypeFilter}
                    onChange={handleEventTypeFilterChange}
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
                              {event.start_date !== event.end_date && ` - ${formatDate(event.end_date)}`}
                            </Typography>
                            <br />
                            <Typography component="span" variant="body2">
                              {event.location && `Lieu: ${event.location}`}
                            </Typography>
                          </>
                        } 
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body1">
                  Aucun événement à venir
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Actualités */}
        <Grid item xs={12}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 3 }}>
            Actualités
          </Typography>
          <Grid container spacing={3}>
            {news.map((item) => (
              <Grid item xs={12} md={4} key={item.id || item.title}>
                <Card>
                  {item.image_url && (
                    <CardMedia
                      component="img"
                      height="140"
                      image={item.image_url}
                      alt={item.title}
                    />
                  )}
                  <CardContent>
                    <Typography variant="h6" component="div">
                      {item.title}
                    </Typography>
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
            ))}
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
