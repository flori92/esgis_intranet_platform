import React, { useState, useEffect } from 'react';
import { 
  Grid, 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Alert,
  Button,
  Chip,
  Tabs,
  Tab,
  Avatar,
  CardActionArea,
  Link
} from '@mui/material';
import {
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  Grade as GradeIcon,
  Event as EventIcon,
  CalendarToday as CalendarTodayIcon,
  Description as DescriptionIcon,
  Group as GroupIcon,
  Add as AddIcon,
  People as PeopleIcon,
  MenuBook as MenuBookIcon,
  Groups as GroupsIcon,
  VerifiedUser as VerifiedUserIcon
} from '@mui/icons-material';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/supabase';
import DashboardBase from './DashboardBase';
import StatisticsCard from './StatisticsCard';
import NewsCard from './NewsCard';
import EventsCard from './EventsCard';

// Import des données mock (à remplacer par des données réelles)
import { initializeMockData, mockNews, mockEvents } from '@/utils/mockDataInitializer';
import { Link as RouterLink } from 'react-router-dom';

/**
 * Tableau de bord pour les étudiants
 * Affiche les cours, examens, notes, événements et actualités
 * @returns {JSX.Element} Composant de tableau de bord étudiant
 */
const StudentDashboard = () => {
  const { authState } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // États pour les données
  const [nextCourse, setNextCourse] = useState(null);
  const [recentGrades, setRecentGrades] = useState([]);
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [news, setNews] = useState([]);
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({
    coursesCount: 0,
    examsCount: 0,
    averageGrade: 0,
    documentsCount: 0,
    groupsCount: 0,
    certificatesCount: 0
  });

  /**
   * Charger les données du tableau de bord
   */
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Vérifier si l'utilisateur est connecté et est un étudiant
      if (!authState.user || !authState.isStudent) {
        throw new Error('Accès non autorisé');
      }

      // Tenter de récupérer les données depuis Supabase
      try {
        // Récupérer les données du tableau de bord
        // const { data, error } = await supabase.rpc('get_student_dashboard', { 
        //   student_id: authState.user.id 
        // });
        // if (error) throw error;
        
        // Récupérer les actualités
        // const { data: newsData, error: newsError } = await supabase
        //   .from('news')
        //   .select('*')
        //   .order('published_at', { ascending: false })
        //   .limit(5);
        // if (newsError) throw newsError;
        
        // Récupérer les événements
        // const { data: eventsData, error: eventsError } = await supabase
        //   .from('events')
        //   .select('*')
        //   .gte('date', new Date().toISOString())
        //   .order('date', { ascending: true })
        //   .limit(5);
        // if (eventsError) throw eventsError;
      } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
        // En cas d'erreur, utiliser les données mock
      }
      
      // Utiliser les données mock pour le moment
      const mockData = initializeMockData();
      
      setNextCourse(mockData.nextCourse);
      setRecentGrades(mockData.recentGrades);
      setUpcomingExams(mockData.upcomingExams);
      setSchedule(mockData.schedule);
      setNews(mockNews);
      setEvents(mockEvents);
      setStats({
        coursesCount: mockData.schedule.length,
        examsCount: mockData.upcomingExams.length,
        averageGrade: mockData.recentGrades.reduce((acc, grade) => acc + grade.value, 0) / 
                     (mockData.recentGrades.length || 1),
        documentsCount: 12, // Valeur fictive
        groupsCount: 5, // Valeur fictive
        certificatesCount: 2 // Valeur fictive
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  // Charger les données au chargement du composant
  useEffect(() => {
    fetchDashboardData();
  }, [authState.isStudent]);

  // Formater la date pour l'affichage
  const formatDate = (dateString) => {
    if (!dateString) {
      return '';
    }
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Formater l'heure pour l'affichage
  const formatTime = (dateString) => {
    if (!dateString) {
      return '';
    }
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Obtenir le nom du jour de la semaine
  const getDayOfWeekName = (dayOfWeek) => {
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    return days[dayOfWeek] || '';
  };

  // Si les données sont en cours de chargement, afficher un indicateur de chargement
  if (loading) {
    return (
      <DashboardBase title="Tableau de bord Étudiant" headerActions={null}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </DashboardBase>
    );
  }

  // Si une erreur s'est produite, afficher un message d'erreur
  if (error) {
    return (
      <DashboardBase title="Tableau de bord Étudiant" headerActions={null}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      </DashboardBase>
    );
  }

  return (
    <DashboardBase title="Tableau de bord Étudiant" headerActions={null}>
      {/* Cartes de statistiques */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatisticsCard
            title="Cours"
            value={stats?.coursesCount || 0}
            icon={<MenuBookIcon />}
            color="#2196F3"
            subtitle="Cours inscrits"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatisticsCard
            title="Groupes"
            value={stats?.groupsCount || 0}
            icon={<GroupsIcon />}
            color="#FF9800"
            subtitle="Groupes de TP"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatisticsCard
            title="Documents"
            value={stats?.documentsCount || 0}
            icon={<DescriptionIcon />}
            color="#9C27B0"
            subtitle="Documents disponibles"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatisticsCard
            title="Attestations"
            value={stats?.certificatesCount || 0}
            icon={<VerifiedUserIcon />}
            color="#4CAF50"
            subtitle="Certificats et attestations"
          />
        </Grid>
      </Grid>

      {/* Accès rapide */}
      <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 2 }}>
        Accès rapide
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: '100%' }}>
            <RouterLink to="/documents" style={{ textDecoration: 'none', color: 'inherit' }}>
              <CardActionArea>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      <DescriptionIcon />
                    </Avatar>
                  <Typography variant="h6">Documents</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Accédez à tous vos documents de cours, sujets de TP et examens. Téléchargez vos attestations et certificats.
                  </Typography>
                </CardContent>
              </CardActionArea>
            </RouterLink>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: '100%' }}>
            <RouterLink to="/groups" style={{ textDecoration: 'none', color: 'inherit' }}>
              <CardActionArea>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                      <GroupsIcon />
                    </Avatar>
                  <Typography variant="h6">Groupes de TP</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Rejoignez des groupes de TP et accédez aux documents partagés par vos professeurs.
                  </Typography>
                </CardContent>
              </CardActionArea>
            </RouterLink>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: '100%' }}>
            <RouterLink to="/schedule" style={{ textDecoration: 'none', color: 'inherit' }}>
              <CardActionArea>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                      <MenuBookIcon />
                    </Avatar>
                  <Typography variant="h6">Mes Cours</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Consultez vos cours, emplois du temps et notes. Suivez votre progression académique.
                  </Typography>
                </CardContent>
              </CardActionArea>
            </RouterLink>
          </Card>
        </Grid>
      </Grid>

      {/* Prochain cours et examens à venir */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Prochain cours */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardHeader 
              title="Prochain cours" 
              titleTypographyProps={{ variant: 'h6' }}
            />
            <Divider />
            <CardContent>
              {nextCourse ? (
                <Box>
                  <Typography variant="h6" component="div" gutterBottom>
                    {nextCourse.name}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <CalendarTodayIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                    {formatDate(nextCourse.date)} à {formatTime(nextCourse.start_time)} - {formatTime(nextCourse.end_time)}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <SchoolIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                    {nextCourse.professor_name}
                  </Typography>
                  <Typography variant="body1">
                    Salle: {nextCourse.room}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Button 
                      variant="contained" 
                      color="primary"
                      component={RouterLink}
                      to={`/exams/${nextCourse.id}`}
                    >
                      Détails du cours
                    </Button>
                    {nextCourse.online_meeting_url && (
                      <Button 
                        variant="outlined" 
                        color="secondary"
                        sx={{ ml: 2 }}
                        href={nextCourse.online_meeting_url}
                        target="_blank"
                      >
                        Rejoindre en ligne
                      </Button>
                    )}
                  </Box>
                </Box>
              ) : (
                <Typography variant="body1">
                  Aucun cours programmé prochainement
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Examens à venir */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardHeader 
              title="Examens à venir" 
              titleTypographyProps={{ variant: 'h6' }}
              action={
                <Button 
                  component={RouterLink} 
                  to="/exams" 
                  size="small" 
                  variant="outlined"
                >
                  Voir tous
                </Button>
              }
            />
            <Divider />
            <CardContent sx={{ p: 0 }}>
              <List>
                {upcomingExams.length > 0 ? (
                  upcomingExams.map((exam) => (
                    <ListItem 
                      key={exam.id} 
                      divider 
                      button 
                      component={RouterLink} 
                      to={`/exams/${exam.id}`}
                    >
                      <ListItemIcon>
                        <AssignmentIcon color="secondary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={exam.title}
                        secondary={
                          <>
                            <Typography variant="body2" component="span">
                              Cours: {exam.course_name}
                            </Typography>
                            <br />
                            <Typography variant="body2" component="span">
                              Date: {formatDate(exam.date)}
                            </Typography>
                            <br />
                            <Typography variant="body2" component="span">
                              Durée: {exam.duration} minutes
                            </Typography>
                          </>
                        }
                      />
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
        </Grid>
      </Grid>

      {/* Notes récentes et emploi du temps */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Notes récentes */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardHeader 
              title="Notes récentes" 
              titleTypographyProps={{ variant: 'h6' }}
              action={
                <Button 
                  component={RouterLink} 
                  to="/grades" 
                  size="small" 
                  variant="outlined"
                >
                  Toutes mes notes
                </Button>
              }
            />
            <Divider />
            <CardContent sx={{ p: 0 }}>
              <List>
                {recentGrades.length > 0 ? (
                  recentGrades.map((grade) => (
                    <ListItem 
                      key={grade.id} 
                      divider 
                      button 
                      component={RouterLink} 
                      to={`/grades/${grade.id}`}
                    >
                      <ListItemIcon>
                        <GradeIcon color={grade.value >= grade.max_value * 0.5 ? "success" : "error"} />
                      </ListItemIcon>
                      <ListItemText
                        primary={grade.course_name}
                        secondary={
                          <>
                            <Typography variant="body2" component="span">
                              Note: {grade.value}/{grade.max_value}
                            </Typography>
                            <br />
                            <Typography variant="body2" component="span">
                              Date: {formatDate(grade.date)}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText primary="Aucune note récente" />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Emploi du temps */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardHeader 
              title="Emploi du temps" 
              titleTypographyProps={{ variant: 'h6' }}
              action={
                <Button 
                  component={RouterLink} 
                  to="/schedule" 
                  size="small" 
                  variant="outlined"
                >
                  Voir complet
                </Button>
              }
            />
            <Divider />
            <CardContent sx={{ p: 0 }}>
              <List>
                {schedule.length > 0 ? (
                  schedule.map((course) => (
                    <ListItem 
                      key={course.id} 
                      divider 
                    >
                      <ListItemIcon>
                        <CalendarTodayIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle1">{course.course_name}</Typography>
                            <Chip 
                              label={getDayOfWeekName(course.day_of_week)} 
                              size="small" 
                              color="primary" 
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography variant="body2" component="span">
                              Horaire: {formatTime(course.start_time)} - {formatTime(course.end_time)}
                            </Typography>
                            <br />
                            <Typography variant="body2" component="span">
                              Salle: {course.room}
                            </Typography>
                            <br />
                            <Typography variant="body2" component="span">
                              Professeur: {course.professor_name}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText primary="Aucun cours planifié" />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Actualités et événements */}
      <Grid container spacing={3}>
        {/* Actualités */}
        <Grid item xs={12} md={6}>
          <NewsCard news={news} title="Actualités" showImage={false} />
        </Grid>

        {/* Événements */}
        <Grid item xs={12} md={6}>
          <EventsCard events={events} title="Événements à venir" showFilters={true} />
        </Grid>
      </Grid>
    </DashboardBase>
  );
};

export default StudentDashboard;
