import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Avatar,
  CardActionArea,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  CardHeader
} from '@mui/material';
import {
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  Grade as GradeIcon,
  Group as GroupIcon,
  CalendarToday as CalendarTodayIcon,
  Add as AddIcon,
  People as PeopleIcon,
  MenuBook as MenuBookIcon,
  Groups as GroupsIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/supabase';
import DashboardBase from './DashboardBase';
import StatisticsCard from './StatisticsCard';
import NewsCard from './NewsCard';
import EventsCard from './EventsCard';

// Import des données mock (à remplacer par des données réelles)
import { 
  mockProfessorStats, 
  mockProfessorCourses, 
  mockProfessorExams, 
  mockPendingGrades, 
  mockProfessorNews, 
  mockProfessorEvents 
} from '@/utils/professorMockData';

/**
 * Tableau de bord pour les professeurs
 * Affiche les statistiques, cours, examens, notes à évaluer et événements
 * @returns {JSX.Element} Composant de tableau de bord professeur
 */
const ProfessorDashboard = () => {
  const { authState } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // États pour les données
  const [stats, setStats] = useState(null);
  const [courses, setCourses] = useState([]);
  const [exams, setExams] = useState([]);
  const [pendingGrades, setPendingGrades] = useState([]);
  const [news, setNews] = useState([]);
  const [events, setEvents] = useState([]);
  
  // État pour les onglets
  const [tabValue, setTabValue] = useState(0);

  /**
   * Charger les données du tableau de bord
   */
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Vérifier si l'utilisateur est connecté et est un professeur
      if (!authState.user || !authState.isProfessor) {
        throw new Error('Accès non autorisé');
      }

      // Tenter de récupérer les données depuis Supabase
      try {
        // Récupérer les statistiques
        // const { data: statsData, error: statsError } = await supabase.rpc('get_professor_stats');
        // if (statsError) throw statsError;
        // setStats(statsData);
        
        // Récupérer les cours
        // const { data: coursesData, error: coursesError } = await supabase
        //   .from('courses')
        //   .select('*')
        //   .eq('professor_id', authState.user.id);
        // if (coursesError) throw coursesError;
        // setCourses(coursesData);
        
        // Récupérer les examens
        // const { data: examsData, error: examsError } = await supabase
        //   .from('exams')
        //   .select('*')
        //   .eq('professor_id', authState.user.id);
        // if (examsError) throw examsError;
        // setExams(examsData);
        
        // Récupérer les notes en attente
        // const { data: gradesData, error: gradesError } = await supabase.rpc('get_pending_grades');
        // if (gradesError) throw gradesError;
        // setPendingGrades(gradesData);
        
        // Récupérer les actualités
        // const { data: newsData, error: newsError } = await supabase
        //   .from('news')
        //   .select('*')
        //   .order('published_at', { ascending: false })
        //   .limit(5);
        // if (newsError) throw newsError;
        // setNews(newsData);
        
        // Récupérer les événements
        // const { data: eventsData, error: eventsError } = await supabase
        //   .from('events')
        //   .select('*')
        //   .gte('date', new Date().toISOString())
        //   .order('date', { ascending: true })
        //   .limit(5);
        // if (eventsError) throw eventsError;
        // setEvents(eventsData);
      } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
        // En cas d'erreur, utiliser les données mock
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
      setError(error.message);
      setLoading(false);
    }
  };

  // Charger les données au chargement du composant
  useEffect(() => {
    fetchDashboardData();
  }, [authState.isProfessor]);

  /**
   * Gérer le changement d'onglet
   * @param {Object} _event - Événement de changement
   * @param {number} newValue - Nouvel index d'onglet
   */
  const handleTabChange = (_event, newValue) => {
    setTabValue(newValue);
  };

  // Actions à afficher dans l'en-tête
  const headerActions = (
    <Button
      variant="contained"
      color="primary"
      startIcon={<AddIcon />}
      component={RouterLink}
      to="/professor/exams/new"
    >
      Nouvel examen
    </Button>
  );

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

  // Si les données sont en cours de chargement, afficher un indicateur de chargement
  if (loading) {
    return (
      <DashboardBase title="Tableau de bord Professeur" headerActions={null}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </DashboardBase>
    );
  }

  // Si une erreur s'est produite, afficher un message d'erreur
  if (error) {
    return (
      <DashboardBase title="Tableau de bord Professeur" headerActions={null}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      </DashboardBase>
    );
  }

  return (
    <DashboardBase title="Tableau de bord Professeur" headerActions={headerActions}>
      {/* Cartes de statistiques */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatisticsCard
            title="Étudiants"
            value={stats?.studentsCount || 0}
            icon={<PeopleIcon />}
            color="#4CAF50"
            subtitle="Dans vos cours"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatisticsCard
            title="Cours"
            value={stats?.coursesCount || 0}
            icon={<MenuBookIcon />}
            color="#2196F3"
            subtitle="Cours actifs ce semestre"
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
            subtitle="Documents partagés"
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
            <RouterLink to="/professor/documents" style={{ textDecoration: 'none', color: 'inherit' }}>
              <CardActionArea>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      <DescriptionIcon />
                    </Avatar>
                    <Typography variant="h6">Mes Documents</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Gérez vos documents de cours, sujets de TP et examens. Partagez-les avec vos étudiants.
                  </Typography>
                </CardContent>
              </CardActionArea>
            </RouterLink>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: '100%' }}>
            <RouterLink to="/professor/groups" style={{ textDecoration: 'none', color: 'inherit' }}>
              <CardActionArea>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                      <GroupsIcon />
                    </Avatar>
                    <Typography variant="h6">Groupes de TP</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Créez et gérez des groupes de TP. Ajoutez des étudiants et partagez des documents spécifiques.
                  </Typography>
                </CardContent>
              </CardActionArea>
            </RouterLink>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: '100%' }}>
            <RouterLink to="/professor/courses" style={{ textDecoration: 'none', color: 'inherit' }}>
              <CardActionArea>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                      <MenuBookIcon />
                    </Avatar>
                    <Typography variant="h6">Mes Cours</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Consultez et gérez vos cours. Planifiez vos séances et suivez votre progression.
                  </Typography>
                </CardContent>
              </CardActionArea>
            </RouterLink>
          </Card>
        </Grid>
      </Grid>

      {/* Onglets pour les différentes sections */}
      <Box sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="dashboard tabs"
        >
          <Tab label="Mes cours" />
          <Tab label="Examens" />
          <Tab label="Notes à évaluer" />
          <Tab label="Actualités" />
          <Tab label="Événements" />
        </Tabs>
      </Box>

      {/* Contenu des onglets */}
      {/* Onglet Mes cours */}
      {tabValue === 0 && (
        <Card elevation={3}>
          <CardHeader 
            title="Mes cours" 
            titleTypographyProps={{ variant: 'h6' }}
            action={
              <Button 
                component={RouterLink} 
                to="/professor/courses" 
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
              {courses.length > 0 ? (
                courses.map((course) => (
                  <ListItem 
                    key={course.id} 
                    divider 
                    button 
                    component={RouterLink} 
                    to={`/professor/courses/${course.id}`}
                  >
                    <ListItemIcon>
                      <SchoolIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={course.name}
                      secondary={
                        <>
                          <Typography variant="body2" component="span">
                            {course.class_name}
                          </Typography>
                          <br />
                          <Typography variant="body2" component="span">
                            {course.schedule}
                          </Typography>
                        </>
                      }
                    />
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

      {/* Onglet Examens */}
      {tabValue === 1 && (
        <Card elevation={3}>
          <CardHeader 
            title="Examens programmés" 
            titleTypographyProps={{ variant: 'h6' }}
            action={
              <Button 
                component={RouterLink} 
                to="/professor/exams" 
                size="small" 
                variant="outlined"
              >
                Gérer les examens
              </Button>
            }
          />
          <Divider />
          <CardContent sx={{ p: 0 }}>
            <List>
              {exams.length > 0 ? (
                exams.map((exam) => (
                  <ListItem 
                    key={exam.id} 
                    divider 
                    button 
                    component={RouterLink} 
                    to={`/professor/exams/${exam.id}`}
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
      )}

      {/* Onglet Notes à évaluer */}
      {tabValue === 2 && (
        <Card elevation={3}>
          <CardHeader 
            title="Notes à évaluer" 
            titleTypographyProps={{ variant: 'h6' }}
            action={
              <Button 
                component={RouterLink} 
                to="/professor/grades" 
                size="small" 
                variant="outlined"
              >
                Gérer les notes
              </Button>
            }
          />
          <Divider />
          <CardContent sx={{ p: 0 }}>
            <List>
              {pendingGrades.length > 0 ? (
                pendingGrades.map((grade) => (
                  <ListItem 
                    key={grade.id} 
                    divider 
                    button 
                    component={RouterLink} 
                    to={`/professor/grades/${grade.id}`}
                  >
                    <ListItemIcon>
                      <GradeIcon color="warning" />
                    </ListItemIcon>
                    <ListItemText
                      primary={grade.exam_title}
                      secondary={
                        <>
                          <Typography variant="body2" component="span">
                            Étudiant: {grade.student_name}
                          </Typography>
                          <br />
                          <Typography variant="body2" component="span">
                            Classe: {grade.class_name}
                          </Typography>
                          <br />
                          <Typography variant="body2" component="span">
                            Soumis le: {formatDate(grade.submission_date)}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText primary="Aucune note en attente d'évaluation" />
                </ListItem>
              )}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Onglet Actualités */}
      {tabValue === 3 && (
        <NewsCard news={news} title="Actualités récentes" showImage={true} />
      )}

      {/* Onglet Événements */}
      {tabValue === 4 && (
        <EventsCard events={events} title="Événements à venir" showFilters={true} />
      )}
    </DashboardBase>
  );
};

export default ProfessorDashboard;
