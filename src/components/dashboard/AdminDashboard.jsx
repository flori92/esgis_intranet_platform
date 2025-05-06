import React, { useState, useEffect } from 'react';
import { 
  Grid, 
  Box, 
  Button, 
  Typography, 
  Card, 
  CardContent, 
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemAvatar,
  Avatar,
  CircularProgress,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import {
  People as PeopleIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  Announcement as AnnouncementIcon,
  Add as AddIcon,
  Settings as SettingsIcon,
  SupervisorAccount as AdminIcon,
  Apartment as DepartmentIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/supabase';
import DashboardBase from './DashboardBase';
import StatisticsCard from './StatisticsCard';
import NewsCard from './NewsCard';
import EventsCard from './EventsCard';

// Import des données mock (à remplacer par des données réelles)
import { mockProfessorNews, mockProfessorEvents } from '@/utils/professorMockData';

/**
 * Tableau de bord pour les administrateurs
 * Affiche les statistiques, utilisateurs, départements, actualités et paramètres
 * @returns {JSX.Element} Composant de tableau de bord administrateur
 */
const AdminDashboard = () => {
  const { authState } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // États pour les données
  const [stats, setStats] = useState({
    studentsCount: 0,
    professorsCount: 0,
    departmentsCount: 0,
    classesCount: 0,
    coursesCount: 0,
    examsCount: 0,
    newsCount: 0,
    adminsCount: 0
  });
  const [recentStudents, setRecentStudents] = useState([]);
  const [recentProfessors, setRecentProfessors] = useState([]);
  const [recentNews, setRecentNews] = useState([]);
  const [events, setEvents] = useState([]);
  
  // État pour les onglets
  const [activeTab, setActiveTab] = useState(0);

  /**
   * Charger les données du tableau de bord
   */
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Vérifier si l'utilisateur est connecté et est un administrateur
      if (!authState.user || !authState.isAdmin) {
        throw new Error('Accès non autorisé');
      }

      // Tenter de récupérer les données depuis Supabase
      try {
        // Récupérer les statistiques
        // const { data: statsData, error: statsError } = await supabase.rpc('get_admin_stats');
        // if (statsError) throw statsError;
        // setStats(statsData);
        
        // Récupérer les étudiants récents
        // const { data: studentsData, error: studentsError } = await supabase
        //   .from('profiles')
        //   .select('id, first_name, last_name, email, created_at, avatar_url')
        //   .eq('role', 'student')
        //   .order('created_at', { ascending: false })
        //   .limit(5);
        // if (studentsError) throw studentsError;
        // setRecentStudents(studentsData);
        
        // Récupérer les professeurs récents
        // const { data: professorsData, error: professorsError } = await supabase
        //   .from('profiles')
        //   .select('id, first_name, last_name, email, created_at, avatar_url, speciality')
        //   .eq('role', 'professor')
        //   .order('created_at', { ascending: false })
        //   .limit(5);
        // if (professorsError) throw professorsError;
        // setRecentProfessors(professorsData);
        
        // Récupérer les actualités récentes
        // const { data: newsData, error: newsError } = await supabase
        //   .from('news')
        //   .select('*')
        //   .order('published_at', { ascending: false })
        //   .limit(5);
        // if (newsError) throw newsError;
        // setRecentNews(newsData);
        
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
      
      // Utiliser des données mock pour le moment
      setStats({
        studentsCount: 245,
        professorsCount: 32,
        departmentsCount: 5,
        classesCount: 18,
        coursesCount: 87,
        examsCount: 42,
        newsCount: 15,
        adminsCount: 3
      });
      
      setRecentStudents([
        {
          id: 1,
          first_name: 'Marie',
          last_name: 'Koné',
          email: 'marie.kone@example.com',
          created_at: '2025-04-15T10:30:00Z',
          avatar_url: null
        },
        {
          id: 2,
          first_name: 'Jean',
          last_name: 'Dupont',
          email: 'jean.dupont@example.com',
          created_at: '2025-04-14T14:20:00Z',
          avatar_url: null
        },
        {
          id: 3,
          first_name: 'Aminata',
          last_name: 'Diallo',
          email: 'aminata.diallo@example.com',
          created_at: '2025-04-13T09:45:00Z',
          avatar_url: null
        }
      ]);
      
      setRecentProfessors([
        {
          id: 1,
          first_name: 'Floraice',
          last_name: 'FAVI',
          email: 'floraice.favi@example.com',
          created_at: '2025-04-10T11:20:00Z',
          avatar_url: null,
          speciality: 'Cloud Computing'
        },
        {
          id: 2,
          first_name: 'Sophie',
          last_name: 'Laurent',
          email: 'sophie.laurent@example.com',
          created_at: '2025-04-08T15:30:00Z',
          avatar_url: null,
          speciality: 'Développement Web'
        }
      ]);
      
      setRecentNews(mockProfessorNews);
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
  }, [authState.isAdmin]);

  /**
   * Gérer le changement d'onglet
   * @param {Object} _event - Événement de changement
   * @param {number} newValue - Nouvel index d'onglet
   */
  const handleTabChange = (_event, newValue) => {
    setActiveTab(newValue);
  };

  // Actions à afficher dans l'en-tête
  const headerActions = (
    <Button
      variant="contained"
      color="primary"
      startIcon={<AddIcon />}
      component={Link}
      to="/admin/news/new"
    >
      Nouvelle actualité
    </Button>
  );

  // Formater la date pour l'affichage
  const formatDate = (dateString) => {
    if (!dateString) return '';
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
      <DashboardBase title="Tableau de bord Administrateur" headerActions={null}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </DashboardBase>
    );
  }

  // Si une erreur s'est produite, afficher un message d'erreur
  if (error) {
    return (
      <DashboardBase title="Tableau de bord Administrateur" headerActions={null}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      </DashboardBase>
    );
  }

  return (
    <DashboardBase title="Tableau de bord Administrateur" headerActions={headerActions}>
      {/* Cartes de statistiques */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatisticsCard
            title="Étudiants"
            value={stats.studentsCount}
            icon={<PeopleIcon />}
            color="primary"
            subtitle="Inscrits"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatisticsCard
            title="Professeurs"
            value={stats.professorsCount}
            icon={<SchoolIcon />}
            color="secondary"
            subtitle="Actifs"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatisticsCard
            title="Départements"
            value={stats.departmentsCount}
            icon={<DepartmentIcon />}
            color="success"
            subtitle="Académiques"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatisticsCard
            title="Classes"
            value={stats.classesCount}
            icon={<PeopleIcon />}
            color="info"
            subtitle="Actives"
          />
        </Grid>
      </Grid>

      {/* Onglets pour les différentes sections */}
      <Box sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="dashboard tabs"
        >
          <Tab label="Étudiants" />
          <Tab label="Professeurs" />
          <Tab label="Actualités" />
          <Tab label="Événements" />
          <Tab label="Paramètres" />
        </Tabs>
      </Box>

      {/* Contenu des onglets */}
      {/* Onglet Étudiants */}
      {activeTab === 0 && (
        <Card elevation={3}>
          <CardHeader 
            title="Étudiants récemment inscrits" 
            titleTypographyProps={{ variant: 'h6' }}
            action={
              <Button 
                component={Link} 
                to="/admin/students" 
                size="small" 
                variant="outlined"
              >
                Gérer les étudiants
              </Button>
            }
          />
          <Divider />
          <CardContent sx={{ p: 0 }}>
            <List>
              {recentStudents.length > 0 ? (
                recentStudents.map((student) => (
                  <ListItem 
                    key={student.id} 
                    divider 
                    button 
                    component={Link} 
                    to={`/admin/students/${student.id}`}
                  >
                    <ListItemAvatar>
                      <Avatar src={student.avatar_url}>
                        {student.first_name.charAt(0)}{student.last_name.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={`${student.first_name} ${student.last_name}`}
                      secondary={
                        <>
                          <Typography variant="body2" component="span">
                            {student.email}
                          </Typography>
                          <br />
                          <Typography variant="body2" component="span">
                            Inscrit le: {formatDate(student.created_at)}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText primary="Aucun étudiant récemment inscrit" />
                </ListItem>
              )}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Onglet Professeurs */}
      {activeTab === 1 && (
        <Card elevation={3}>
          <CardHeader 
            title="Professeurs récemment inscrits" 
            titleTypographyProps={{ variant: 'h6' }}
            action={
              <Button 
                component={Link} 
                to="/admin/professors" 
                size="small" 
                variant="outlined"
              >
                Gérer les professeurs
              </Button>
            }
          />
          <Divider />
          <CardContent sx={{ p: 0 }}>
            <List>
              {recentProfessors.length > 0 ? (
                recentProfessors.map((professor) => (
                  <ListItem 
                    key={professor.id} 
                    divider 
                    button 
                    component={Link} 
                    to={`/admin/professors/${professor.id}`}
                  >
                    <ListItemAvatar>
                      <Avatar src={professor.avatar_url}>
                        {professor.first_name.charAt(0)}{professor.last_name.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={`${professor.first_name} ${professor.last_name}`}
                      secondary={
                        <>
                          <Typography variant="body2" component="span">
                            {professor.email}
                          </Typography>
                          <br />
                          <Typography variant="body2" component="span">
                            Spécialité: {professor.speciality}
                          </Typography>
                          <br />
                          <Typography variant="body2" component="span">
                            Inscrit le: {formatDate(professor.created_at)}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText primary="Aucun professeur récemment inscrit" />
                </ListItem>
              )}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Onglet Actualités */}
      {activeTab === 2 && (
        <NewsCard news={recentNews} title="Actualités récentes" showImage={true} />
      )}

      {/* Onglet Événements */}
      {activeTab === 3 && (
        <EventsCard events={events} title="Événements à venir" showFilters={true} />
      )}

      {/* Onglet Paramètres */}
      {activeTab === 4 && (
        <Card elevation={3}>
          <CardHeader 
            title="Paramètres du système" 
            titleTypographyProps={{ variant: 'h6' }}
          />
          <Divider />
          <CardContent>
            <List>
              <ListItem 
                button 
                component={Link} 
                to="/admin/settings/general"
              >
                <ListItemIcon>
                  <SettingsIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Paramètres généraux" 
                  secondary="Configuration générale de l'application"
                />
              </ListItem>
              <Divider />
              <ListItem 
                button 
                component={Link} 
                to="/admin/settings/departments"
              >
                <ListItemIcon>
                  <DepartmentIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Gestion des départements" 
                  secondary="Ajouter, modifier ou supprimer des départements"
                />
              </ListItem>
              <Divider />
              <ListItem 
                button 
                component={Link} 
                to="/admin/settings/admins"
              >
                <ListItemIcon>
                  <AdminIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Gestion des administrateurs" 
                  secondary="Gérer les comptes administrateurs"
                />
              </ListItem>
              <Divider />
              <ListItem 
                button 
                component={Link} 
                to="/admin/settings/reports"
              >
                <ListItemIcon>
                  <AssignmentIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Configuration des rapports" 
                  secondary="Paramètres pour le dépôt des rapports de stage"
                />
              </ListItem>
              <Divider />
              <ListItem 
                button 
                component={Link} 
                to="/admin/settings/notifications"
              >
                <ListItemIcon>
                  <AnnouncementIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Paramètres de notification" 
                  secondary="Configuration des notifications push"
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      )}
    </DashboardBase>
  );
};

export default AdminDashboard;
