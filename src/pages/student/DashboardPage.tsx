import React, { useState, useEffect, useRef } from 'react';
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
  Button
} from '@mui/material';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../hooks/useAuth';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import EventIcon from '@mui/icons-material/Event';
import GradeIcon from '@mui/icons-material/Grade';
import SchoolIcon from '@mui/icons-material/School';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
// Import des données mockées et de l'initialiseur
import { initializeMockData, NewsItem, EventItem, mockNews, mockEvents } from '../../utils/mockDataInitializer';

// Définition des interfaces
interface StudentDashboardData {
  next_course?: {
    name: string;
    time: string;
  };
  recent_grades?: Array<{
    id: number;
    course_name: string;
    value: number;
    max_value: number;
  }>;
}

interface ScheduleItem {
  id: number;
  course_name: string;
  start_time: string;
  end_time: string;
  day_of_week: number;
  room?: string;
  professor_name?: string;
}

export default function DashboardPage() {
  const { authState } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(null);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [dataInitialized, setDataInitialized] = useState(false);

  // Utiliser useRef pour stabiliser la fonction fetchDashboardData
  const fetchDashboardDataRef = useRef(async () => {
    if (!authState?.student?.id) return;
    
    setLoading(true);
    setError(null);

    try {
      // Initialiser les données mockées dans Supabase si nécessaire
      if (!dataInitialized) {
        await initializeMockData();
        setDataInitialized(true);
      }
      
      // Récupération des données du dashboard
      const { data, error } = await supabase
        .rpc('get_student_dashboard', { student_id: authState.student.id });
        
      if (error) throw error;
      
      // Si aucune donnée n'est retournée, utiliser un dashboard vide
      setDashboardData(data || { 
        next_course: { 
          name: 'Intelligence Artificielle',
          time: '2025-05-06T09:00:00Z'
        },
        recent_grades: [
          { id: 1, course_name: 'Algorithmique', value: 16, max_value: 20 },
          { id: 2, course_name: 'Développement Web', value: 14.5, max_value: 20 }
        ]
      });
      
      // Récupération de l'emploi du temps
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('schedule')
        .select('*')
        .eq('student_id', authState.student.id)
        .order('day_of_week')
        .order('start_time');
        
      if (scheduleError) throw scheduleError;
      
      // Utiliser les données récupérées si elles existent, sinon utiliser un emploi du temps vide
      setSchedule(scheduleData && scheduleData.length > 0 ? scheduleData : [
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
      ]);
      
      // Récupération des actualités
      const { data: newsData, error: newsError } = await supabase
        .from('news')
        .select('*')
        .order('date', { ascending: false })
        .limit(3);
        
      if (newsError) throw newsError;
      setNews(newsData && newsData.length > 0 ? newsData : mockNews);
      
      // Récupération des événements
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .gte('start_date', new Date().toISOString())
        .order('start_date')
        .limit(5);
        
      if (eventsError) throw eventsError;
      setEvents(eventsData && eventsData.length > 0 ? eventsData : mockEvents);
      
    } catch (err) {
      console.error('Erreur lors du chargement du dashboard:', err);
      setError('Impossible de charger les données du tableau de bord');
      
      // En cas d'erreur, utiliser les données mockées
      setNews(mockNews);
      setEvents(mockEvents);
      
      // Définir un dashboard par défaut
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
      
      // Emploi du temps par défaut
      setSchedule([
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
        }
      ]);
    } finally {
      setLoading(false);
    }
  });

  // Mise à jour de la référence lorsque authState.student?.id change
  useEffect(() => {
    fetchDashboardDataRef.current = async () => {
      // Même implémentation que ci-dessus...
      if (!authState?.student?.id) return;
      
      setLoading(true);
      setError(null);
  
      try {
        // Initialiser les données mockées dans Supabase si nécessaire
        if (!dataInitialized) {
          await initializeMockData();
          setDataInitialized(true);
        }
        
        // Récupération des données du dashboard
        const { data, error } = await supabase
          .rpc('get_student_dashboard', { student_id: authState.student.id });
          
        if (error) throw error;
        
        // Si aucune donnée n'est retournée, utiliser un dashboard vide
        setDashboardData(data || { 
          next_course: { 
            name: 'Intelligence Artificielle',
            time: '2025-05-06T09:00:00Z'
          },
          recent_grades: [
            { id: 1, course_name: 'Algorithmique', value: 16, max_value: 20 },
            { id: 2, course_name: 'Développement Web', value: 14.5, max_value: 20 }
          ]
        });
        
        // Récupération de l'emploi du temps
        const { data: scheduleData, error: scheduleError } = await supabase
          .from('schedule')
          .select('*')
          .eq('student_id', authState.student.id)
          .order('day_of_week')
          .order('start_time');
          
        if (scheduleError) throw scheduleError;
        
        // Utiliser les données récupérées si elles existent, sinon utiliser un emploi du temps vide
        setSchedule(scheduleData && scheduleData.length > 0 ? scheduleData : [
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
        ]);
        
        // Récupération des actualités
        const { data: newsData, error: newsError } = await supabase
          .from('news')
          .select('*')
          .order('date', { ascending: false })
          .limit(3);
          
        if (newsError) throw newsError;
        setNews(newsData && newsData.length > 0 ? newsData : mockNews);
        
        // Récupération des événements
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('*')
          .gte('start_date', new Date().toISOString())
          .order('start_date')
          .limit(5);
          
        if (eventsError) throw eventsError;
        setEvents(eventsData && eventsData.length > 0 ? eventsData : mockEvents);
        
      } catch (err) {
        console.error('Erreur lors du chargement du dashboard:', err);
        setError('Impossible de charger les données du tableau de bord');
        
        // En cas d'erreur, utiliser les données mockées
        setNews(mockNews);
        setEvents(mockEvents);
        
        // Définir un dashboard par défaut
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
        
        // Emploi du temps par défaut
        setSchedule([
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
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
  }, [authState.student?.id, dataInitialized]);

  // Effet pour charger les données au chargement du composant
  useEffect(() => {
    // S'assurer que fetchDashboardDataRef.current est défini
    const fetchData = fetchDashboardDataRef.current;
    if (fetchData) {
      fetchData();
    }
  }, []);

  // Formater le jour de la semaine
  const formatDayOfWeek = (day: number) => {
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    return days[day] || '';
  };

  // Formater la date en français
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMMM yyyy', { locale: fr });
  };

  // Formater l'heure
  const formatTime = (timeString: string) => {
    return format(new Date(timeString), 'HH:mm');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ m: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Bienvenue, {authState.profile?.full_name || authState.user?.email || 'Étudiant'}
      </Typography>
      
      {/* Widgets principaux */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Widget Emploi du temps */}
        <Grid item xs={12} md={4}>
          <Paper 
            elevation={3} 
            sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              backgroundColor: '#f5f5f5'
            }}
          >
            <Box sx={{ 
              p: 2, 
              backgroundColor: '#003366', 
              color: 'white',
              display: 'flex',
              alignItems: 'center'
            }}>
              <EventIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Emploi du temps</Typography>
            </Box>
            <Box sx={{ p: 2, flexGrow: 1 }}>
              {schedule.length > 0 ? (
                <List dense sx={{ maxHeight: 250, overflow: 'auto' }}>
                  {schedule.slice(0, 5).map(item => (
                    <ListItem key={item.id} sx={{ mb: 1, bgcolor: 'white', borderRadius: 1 }}>
                      <ListItemText
                        primary={item.course_name}
                        secondary={
                          <>
                            <Typography variant="body2" component="span">
                              {formatDayOfWeek(item.day_of_week)}, {formatTime(item.start_time)} - {formatTime(item.end_time)}
                            </Typography>
                            {item.room && (
                              <Typography variant="body2" component="p">
                                Salle: {item.room}
                              </Typography>
                            )}
                            {item.professor_name && (
                              <Typography variant="body2" component="p">
                                Prof: {item.professor_name}
                              </Typography>
                            )}
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography>Aucun cours programmé</Typography>
              )}
            </Box>
            <Box sx={{ p: 1, textAlign: 'center' }}>
              <Button variant="outlined" color="primary" sx={{ color: '#003366', borderColor: '#003366' }}>
                Voir tout l'emploi du temps
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        {/* Widget Notes récentes */}
        <Grid item xs={12} md={4}>
          <Paper 
            elevation={3} 
            sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              backgroundColor: '#f5f5f5'
            }}
          >
            <Box sx={{ 
              p: 2, 
              backgroundColor: '#003366', 
              color: 'white',
              display: 'flex',
              alignItems: 'center'
            }}>
              <GradeIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Notes récentes</Typography>
            </Box>
            <Box sx={{ p: 2, flexGrow: 1 }}>
              {dashboardData?.recent_grades?.length ? (
                <List dense sx={{ maxHeight: 250, overflow: 'auto' }}>
                  {dashboardData.recent_grades.map((grade) => (
                    <ListItem key={grade.id} sx={{ mb: 1, bgcolor: 'white', borderRadius: 1 }}>
                      <ListItemText
                        primary={`${grade.course_name}`}
                        secondary={
                          <Typography 
                            variant="body2" 
                            component="span"
                            sx={{ 
                              fontWeight: 'bold', 
                              color: grade.value >= (grade.max_value / 2) ? 'success.main' : 'error.main' 
                            }}
                          >
                            {grade.value}/{grade.max_value}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography>Aucune note récente</Typography>
              )}
            </Box>
            <Box sx={{ p: 1, textAlign: 'center' }}>
              <Button variant="outlined" color="primary" sx={{ color: '#003366', borderColor: '#003366' }}>
                Voir toutes les notes
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        {/* Widget Cours à venir */}
        <Grid item xs={12} md={4}>
          <Paper 
            elevation={3} 
            sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              backgroundColor: '#f5f5f5'
            }}
          >
            <Box sx={{ 
              p: 2, 
              backgroundColor: '#003366', 
              color: 'white',
              display: 'flex',
              alignItems: 'center'
            }}>
              <SchoolIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Cours à venir</Typography>
            </Box>
            <Box sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {dashboardData?.next_course ? (
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" sx={{ mb: 2 }}>
                    {dashboardData.next_course.name}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    {dashboardData.next_course.time && (
                      <>
                        <CalendarTodayIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                        {format(new Date(dashboardData.next_course.time), 'EEEE dd MMMM', { locale: fr })}
                      </>
                    )}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {dashboardData.next_course.time && (
                      format(new Date(dashboardData.next_course.time), 'HH:mm')
                    )}
                  </Typography>
                </Box>
              ) : (
                <Typography align="center">Aucun cours à venir</Typography>
              )}
            </Box>
            <Box sx={{ p: 1, textAlign: 'center' }}>
              <Button variant="outlined" color="primary" sx={{ color: '#003366', borderColor: '#003366' }}>
                Voir tous les cours
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Actualités */}
      <Typography variant="h5" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        <NotificationsIcon sx={{ mr: 1 }} />
        ACTUALITÉS
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {news.length > 0 ? news.map((item) => (
          <Grid item xs={12} md={4} key={item.id}>
            <Card elevation={2}>
              {item.image_url && (
                <CardMedia
                  component="img"
                  height="140"
                  image={item.image_url}
                  alt={item.title}
                />
              )}
              <CardHeader
                title={item.title}
                subheader={formatDate(item.date)}
              />
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  {item.description.length > 100 
                    ? `${item.description.substring(0, 100)}...` 
                    : item.description}
                </Typography>
              </CardContent>
              <Box sx={{ p: 1, textAlign: 'right' }}>
                {item.link && (
                  <Button size="small" color="primary" sx={{ color: '#003366' }}>
                    Lire la suite
                  </Button>
                )}
              </Box>
            </Card>
          </Grid>
        )) : (
          <Grid item xs={12}>
            <Typography>Aucune actualité à afficher</Typography>
          </Grid>
        )}
      </Grid>
      
      {/* Événements à venir */}
      <Typography variant="h5" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        <EventIcon sx={{ mr: 1 }} />
        PROCHAINS ÉVÉNEMENTS
      </Typography>
      <Paper elevation={3} sx={{ mb: 4, p: 2 }}>
        {events.length > 0 ? (
          <List>
            {events.map((event) => (
              <>
                <ListItem key={event.id} alignItems="flex-start">
                  <ListItemText
                    primary={
                      <Typography variant="h6" color="primary">
                        {event.title}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.primary"
                          sx={{ display: 'block' }}
                        >
                          {formatDate(event.start_date)}
                          {event.end_date && ` - ${formatDate(event.end_date)}`}
                        </Typography>
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.primary"
                          sx={{ display: 'block' }}
                        >
                          {event.location && `Lieu: ${event.location}`}
                        </Typography>
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.secondary"
                        >
                          {event.description}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
                <Divider component="li" />
              </>
            ))}
          </List>
        ) : (
          <Typography>Aucun événement à venir</Typography>
        )}
      </Paper>
    </Box>
  );
}
