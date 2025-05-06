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
} from '@mui/material';
import {
  People as PeopleIcon,
  School as SchoolIcon,
  Event as EventIcon,
  Assignment as AssignmentIcon,
  Notifications as NotificationsIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
// Correction du chemin d'importation de Supabase
import { supabase } from '@/supabase';

const AdminDashboardPage = () => {
  const { authState } = useAuth();
  const [stats, setStats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  // Vérifier si l'utilisateur est un administrateur
  useEffect(() => {
    if (!authState.isAdmin) {
      // Rediriger vers la page d'accueil si l'utilisateur n'est pas un administrateur
      window.location.href = '/';
    }
  }, [authState.isAdmin]);

  // Charger les données du tableau de bord
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Récupérer les statistiques
        const statsPromises = [
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'professor'),
          supabase.from('courses').select('*', { count: 'exact', head: true }),
          supabase.from('departments').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', true),
          supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        ];

        const [
          { count: totalStudents },
          { count: totalProfessors },
          { count: totalCourses },
          { count: totalDepartments },
          { count: activeUsers },
          { count: pendingRequests },
        ] = await Promise.all(statsPromises);

        setStats({
          totalStudents: totalStudents || 0,
          totalProfessors: totalProfessors || 0,
          totalCourses: totalCourses || 0,
          totalDepartments: totalDepartments || 0,
          activeUsers: activeUsers || 0,
          pendingRequests: pendingRequests || 0,
        });

        // Récupérer les notifications
        const fetchNotifications = async () => {
          try {
            const { data, error } = await supabase
              .from('notifications')
              .select('*')
              .eq('recipient_id', authState.user?.id || '')
              .order('created_at', { ascending: false })
              .limit(5);
            
            if (error) {
              throw error;
            }
            
            setNotifications(data || []);
          } catch (err) {
            console.error('Erreur lors de la récupération des notifications:', err);
            setError('Erreur lors de la récupération des notifications');
          }
        };

        // Récupérer les événements à venir
        const fetchEvents = async () => {
          try {
            const { data, error } = await supabase
              .from('events')
              .select('*')
              .gte('start_date', new Date().toISOString())
              .order('start_date', { ascending: true })
              .limit(5);
            
            if (error) {
              throw error;
            }
            
            setEvents(data || []);
          } catch (err) {
            console.error('Erreur lors de la récupération des événements:', err);
            setError('Erreur lors de la récupération des événements');
          }
        };

        // Exécuter les requêtes en parallèle
        await Promise.all([fetchNotifications(), fetchEvents()]);
      } catch (err) {
        console.error('Erreur lors de la récupération des données du tableau de bord:', err);
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [authState.user?.id]);

  // Gérer le changement d'onglet
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Afficher une erreur si nécessaire
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  // Afficher un chargement si nécessaire
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Tableau de bord administrateur
      </Typography>

      <Box sx={{ mb: 4 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="dashboard tabs">
          <Tab label="Vue d'ensemble" />
          <Tab label="Notifications" />
          <Tab label="Événements" />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <PeopleIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                    <Typography variant="h5">{stats?.totalStudents}</Typography>
                  </Box>
                  <Typography color="textSecondary" variant="body2">
                    Étudiants inscrits
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <SchoolIcon color="secondary" sx={{ fontSize: 40, mr: 2 }} />
                    <Typography variant="h5">{stats?.totalProfessors}</Typography>
                  </Box>
                  <Typography color="textSecondary" variant="body2">
                    Professeurs
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <AssignmentIcon color="info" sx={{ fontSize: 40, mr: 2 }} />
                    <Typography variant="h5">{stats?.totalCourses}</Typography>
                  </Box>
                  <Typography color="textSecondary" variant="body2">
                    Cours
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <DescriptionIcon color="warning" sx={{ fontSize: 40, mr: 2 }} />
                    <Typography variant="h5">{stats?.pendingRequests}</Typography>
                  </Box>
                  <Typography color="textSecondary" variant="body2">
                    Demandes en attente
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card elevation={3}>
                <CardHeader
                  title="Notifications récentes"
                  titleTypographyProps={{ variant: 'h6' }}
                  action={
                    <Button size="small" color="primary">
                      Voir tout
                    </Button>
                  }
                />
                <Divider />
                <CardContent sx={{ p: 0 }}>
                  <List>
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <ListItem key={notification.id} divider>
                          <ListItemIcon>
                            <NotificationsIcon
                              color={
                                notification.type === 'high'
                                  ? 'error'
                                  : notification.type === 'medium'
                                  ? 'warning'
                                  : 'info'
                              }
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={notification.title}
                            secondary={`${notification.content} - ${formatDate(notification.created_at)}`}
                          />
                        </ListItem>
                      ))
                    ) : (
                      <ListItem>
                        <ListItemText primary="Aucune notification" />
                      </ListItem>
                    )}
                  </List>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card elevation={3}>
                <CardHeader
                  title="Événements à venir"
                  titleTypographyProps={{ variant: 'h6' }}
                  action={
                    <Button size="small" color="primary">
                      Voir tout
                    </Button>
                  }
                />
                <Divider />
                <CardContent sx={{ p: 0 }}>
                  <List>
                    {events.length > 0 ? (
                      events.map((event) => (
                        <ListItem key={event.id} divider>
                          <ListItemIcon>
                            <EventIcon
                              color={
                                event.type === 'exam'
                                  ? 'error'
                                  : event.type === 'meeting'
                                  ? 'primary'
                                  : 'action'
                              }
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={event.title}
                            secondary={`${formatDate(event.start_date)} - ${event.location}`}
                          />
                        </ListItem>
                      ))
                    ) : (
                      <ListItem>
                        <ListItemText primary="Aucun événement à venir" />
                      </ListItem>
                    )}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}

      {tabValue === 1 && (
        <Card elevation={3}>
          <CardHeader title="Toutes les notifications" titleTypographyProps={{ variant: 'h6' }} />
          <Divider />
          <CardContent sx={{ p: 0 }}>
            <List>
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <ListItem key={notification.id} divider>
                    <ListItemIcon>
                      <NotificationsIcon
                        color={
                          notification.type === 'high'
                            ? 'error'
                            : notification.type === 'medium'
                            ? 'warning'
                            : 'info'
                        }
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={notification.title}
                      secondary={`${notification.content} - ${formatDate(notification.created_at)}`}
                    />
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText primary="Aucune notification" />
                </ListItem>
              )}
            </List>
          </CardContent>
        </Card>
      )}

      {tabValue === 2 && (
        <Card elevation={3}>
          <CardHeader title="Tous les événements à venir" titleTypographyProps={{ variant: 'h6' }} />
          <Divider />
          <CardContent sx={{ p: 0 }}>
            <List>
              {events.length > 0 ? (
                events.map((event) => (
                  <ListItem key={event.id} divider>
                    <ListItemIcon>
                      <EventIcon
                        color={
                          event.type === 'exam'
                            ? 'error'
                            : event.type === 'meeting'
                            ? 'primary'
                            : 'action'
                        }
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={event.title}
                      secondary={
                        <>
                          <Typography variant="body2" component="span">
                            {formatDate(event.start_date)} - {formatDate(event.end_date)}
                          </Typography>
                          <br />
                          <Typography variant="body2" component="span">
                            {event.location}
                          </Typography>
                          <br />
                          <Typography variant="body2" component="span">
                            {event.description}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText primary="Aucun événement à venir" />
                </ListItem>
              )}
            </List>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default AdminDashboardPage;
