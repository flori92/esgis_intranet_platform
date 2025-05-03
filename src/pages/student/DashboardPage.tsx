import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Chip,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Event as EventIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  Notifications as NotificationsIcon,
  CalendarToday as CalendarTodayIcon,
  AccessTime as AccessTimeIcon,
  Room as RoomIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import supabase from '../../services/supabase';

/**
 * Tableau de bord étudiant
 * Page principale pour les utilisateurs avec le rôle "student"
 */
const DashboardPage: React.FC = () => {
  const { authState } = useAuth();
  const { user, profile, student } = authState;

  // États pour les données
  const [loading, setLoading] = useState({
    courses: true,
    schedule: true,
    announcements: true,
    grades: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [todayClasses, setTodayClasses] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [recentGrades, setRecentGrades] = useState<any[]>([]);

  // Récupérer les données au chargement du composant
  useEffect(() => {
    if (user && student) {
      fetchDashboardData();
    }
  }, [user, student]);

  // Fonction pour récupérer toutes les données du tableau de bord
  const fetchDashboardData = async () => {
    try {
      // Récupérer les cours de l'étudiant
      fetchCourses();
      
      // Récupérer l'emploi du temps du jour
      fetchTodaySchedule();
      
      // Récupérer les annonces
      fetchAnnouncements();
      
      // Récupérer les notes récentes
      fetchRecentGrades();
    } catch (err) {
      console.error('Erreur lors de la récupération des données du tableau de bord:', err);
      setError('Une erreur est survenue lors du chargement des données. Veuillez rafraîchir la page.');
    }
  };

  // Récupérer les cours de l'étudiant
  const fetchCourses = async () => {
    try {
      if (!student) return;
      
      const { data, error } = await supabase
        .from('course_enrollments')
        .select(`
          *,
          course:courses(*)
        `)
        .eq('student_id', student.id)
        .eq('status', 'enrolled');
      
      if (error) throw error;
      
      setCourses(data || []);
    } catch (err) {
      console.error('Erreur lors de la récupération des cours:', err);
    } finally {
      setLoading(prev => ({ ...prev, courses: false }));
    }
  };

  // Récupérer l'emploi du temps du jour
  const fetchTodaySchedule = async () => {
    try {
      if (!student) return;
      
      // Obtenir le jour de la semaine (0 = dimanche, 1 = lundi, etc.)
      const today = new Date();
      const dayOfWeek = today.getDay();
      
      // Formater la date pour la comparaison
      const formattedDate = today.toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('schedules')
        .select(`
          *,
          course:courses(*),
          professor:professors(*)
        `)
        .eq('day_of_week', dayOfWeek)
        .lte('start_date', formattedDate)
        .gte('end_date', formattedDate)
        .order('start_time', { ascending: true });
      
      if (error) throw error;
      
      // Filtrer pour ne garder que les cours auxquels l'étudiant est inscrit
      const enrolledCourseIds = courses.map(enrollment => enrollment.course_id);
      const filteredSchedule = data?.filter(schedule => 
        enrolledCourseIds.includes(schedule.course_id)
      ) || [];
      
      setTodayClasses(filteredSchedule);
    } catch (err) {
      console.error('Erreur lors de la récupération de l\'emploi du temps:', err);
    } finally {
      setLoading(prev => ({ ...prev, schedule: false }));
    }
  };

  // Récupérer les annonces
  const fetchAnnouncements = async () => {
    try {
      if (!profile) return;
      
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .or(`target_audience.eq.all,target_audience.eq.students`)
        .eq('is_published', true)
        .lte('publish_date', new Date().toISOString())
        .order('publish_date', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      
      setAnnouncements(data || []);
    } catch (err) {
      console.error('Erreur lors de la récupération des annonces:', err);
    } finally {
      setLoading(prev => ({ ...prev, announcements: false }));
    }
  };

  // Récupérer les notes récentes
  const fetchRecentGrades = async () => {
    try {
      if (!student) return;
      
      const { data, error } = await supabase
        .from('grades')
        .select(`
          *,
          course:courses(*),
          exam:exams(*)
        `)
        .eq('student_id', student.id)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      
      setRecentGrades(data || []);
    } catch (err) {
      console.error('Erreur lors de la récupération des notes:', err);
    } finally {
      setLoading(prev => ({ ...prev, grades: false }));
    }
  };

  // Formater l'heure (HH:MM)
  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5);
  };

  // Vérifier si toutes les données sont chargées
  const isLoading = Object.values(loading).some(value => value);

  return (
    <Box sx={{ p: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* En-tête du tableau de bord */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="bold" fontFamily="Montserrat" gutterBottom>
          Tableau de bord
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Bienvenue, {profile?.full_name || 'Étudiant'} ! Voici un aperçu de votre activité.
        </Typography>
      </Box>
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* Cours d'aujourd'hui */}
          <Grid item xs={12} md={6}>
            <Card elevation={2}>
              <CardHeader 
                title="Cours d'aujourd'hui" 
                titleTypographyProps={{ fontFamily: 'Montserrat', fontWeight: 'bold' }}
                avatar={<Avatar sx={{ bgcolor: '#003366' }}><EventIcon /></Avatar>}
              />
              <Divider />
              <CardContent sx={{ p: 0 }}>
                {todayClasses.length > 0 ? (
                  <List>
                    {todayClasses.map((schedule) => (
                      <ListItem key={schedule.id} divider>
                        <ListItemIcon>
                          <SchoolIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={schedule.course.name}
                          secondary={
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AccessTimeIcon fontSize="small" color="action" />
                                <Typography variant="body2">
                                  {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <RoomIcon fontSize="small" color="action" />
                                <Typography variant="body2">
                                  {schedule.room}
                                </Typography>
                              </Box>
                            </Box>
                          }
                        />
                        <Chip 
                          label="À venir"
                          size="small"
                          color="primary"
                          sx={{ ml: 1 }}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body1" color="text.secondary">
                      Aucun cours prévu aujourd'hui
                    </Typography>
                  </Box>
                )}
                <Box sx={{ p: 2, textAlign: 'right' }}>
                  <Button 
                    variant="text" 
                    endIcon={<CalendarTodayIcon />}
                    component="a"
                    href="/student/schedule"
                  >
                    Voir l'emploi du temps complet
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Annonces récentes */}
          <Grid item xs={12} md={6}>
            <Card elevation={2}>
              <CardHeader 
                title="Annonces récentes" 
                titleTypographyProps={{ fontFamily: 'Montserrat', fontWeight: 'bold' }}
                avatar={<Avatar sx={{ bgcolor: '#CC0000' }}><NotificationsIcon /></Avatar>}
              />
              <Divider />
              <CardContent sx={{ p: 0 }}>
                {announcements.length > 0 ? (
                  <List>
                    {announcements.map((announcement) => (
                      <ListItem key={announcement.id} divider>
                        <ListItemText
                          primary={announcement.title}
                          secondary={
                            <>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {new Date(announcement.publish_date).toLocaleDateString('fr-FR')}
                              </Typography>
                              <Typography variant="body2" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {announcement.content}
                              </Typography>
                            </>
                          }
                        />
                        {announcement.priority === 'high' && (
                          <Chip 
                            label="Important"
                            size="small"
                            color="error"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body1" color="text.secondary">
                      Aucune annonce récente
                    </Typography>
                  </Box>
                )}
                <Box sx={{ p: 2, textAlign: 'right' }}>
                  <Button 
                    variant="text" 
                    component="a"
                    href="/student/announcements"
                  >
                    Voir toutes les annonces
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Notes récentes */}
          <Grid item xs={12} md={6}>
            <Card elevation={2}>
              <CardHeader 
                title="Notes récentes" 
                titleTypographyProps={{ fontFamily: 'Montserrat', fontWeight: 'bold' }}
                avatar={<Avatar sx={{ bgcolor: '#003366' }}><AssignmentIcon /></Avatar>}
              />
              <Divider />
              <CardContent sx={{ p: 0 }}>
                {recentGrades.length > 0 ? (
                  <List>
                    {recentGrades.map((grade) => (
                      <ListItem key={grade.id} divider>
                        <ListItemText
                          primary={grade.exam ? grade.exam.title : grade.course.name}
                          secondary={
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
                              <Typography variant="body2" color="text.secondary">
                                {grade.course.name}
                              </Typography>
                              <Typography variant="body2">
                                Note: <strong>{grade.grade}/{grade.max_grade}</strong> ({((grade.grade / grade.max_grade) * 100).toFixed(1)}%)
                              </Typography>
                            </Box>
                          }
                        />
                        <Chip 
                          label={grade.grade >= (grade.max_grade * 0.5) ? "Réussi" : "Échec"}
                          size="small"
                          color={grade.grade >= (grade.max_grade * 0.5) ? "success" : "error"}
                          sx={{ ml: 1 }}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body1" color="text.secondary">
                      Aucune note récente
                    </Typography>
                  </Box>
                )}
                <Box sx={{ p: 2, textAlign: 'right' }}>
                  <Button 
                    variant="text" 
                    component="a"
                    href="/student/grades"
                  >
                    Voir toutes les notes
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Mes cours */}
          <Grid item xs={12} md={6}>
            <Card elevation={2}>
              <CardHeader 
                title="Mes cours" 
                titleTypographyProps={{ fontFamily: 'Montserrat', fontWeight: 'bold' }}
                avatar={<Avatar sx={{ bgcolor: '#003366' }}><SchoolIcon /></Avatar>}
              />
              <Divider />
              <CardContent sx={{ p: 0 }}>
                {courses.length > 0 ? (
                  <List>
                    {courses.slice(0, 5).map((enrollment) => (
                      <ListItem key={enrollment.id} divider>
                        <ListItemIcon>
                          <SchoolIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={enrollment.course.name}
                          secondary={
                            <Typography variant="body2" color="text.secondary">
                              Code: {enrollment.course.code} | Crédits: {enrollment.course.credits}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body1" color="text.secondary">
                      Aucun cours inscrit
                    </Typography>
                  </Box>
                )}
                <Box sx={{ p: 2, textAlign: 'right' }}>
                  <Button 
                    variant="text" 
                    component="a"
                    href="/student/courses"
                  >
                    Voir tous mes cours
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default DashboardPage;
