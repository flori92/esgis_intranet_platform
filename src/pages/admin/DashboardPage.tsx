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
import { useAuth, AuthContextType } from '../../context/AuthContext';
import supabase from '../../services/supabase';
import { Database } from '../../types/database';

// Types pour les statistiques
interface DashboardStats {
  totalStudents: number;
  totalProfessors: number;
  totalCourses: number;
  totalDepartments: number;
  activeUsers: number;
  pendingRequests: number;
}

// Types pour les notifications
interface Notification {
  id: number;
  title: string;
  content: string;
  created_at: string;
  priority: 'high' | 'medium' | 'low';
  read: boolean;
}

// Types pour les événements
interface Event {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  type: 'exam' | 'meeting' | 'holiday' | 'other';
}

const AdminDashboardPage: React.FC = () => {
  const { authState } = useAuth() as AuthContextType;
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
        const { data: notificationsData, error: notificationsError } = await supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        if (notificationsError) throw notificationsError;
        setNotifications(notificationsData || []);

        // Récupérer les événements à venir
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('*')
          .gte('start_date', new Date().toISOString())
          .order('start_date', { ascending: true })
          .limit(5);

        if (eventsError) throw eventsError;
        setEvents(eventsData || []);
      } catch (error) {
        console.error('Erreur lors du chargement des données du tableau de bord:', error);
        setError('Erreur lors du chargement des données. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Gérer le changement d'onglet
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Formater la date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
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
        <Button variant="contained" onClick={() => window.location.reload()} sx={{ mt: 2 }}>
          Réessayer
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Tableau de bord administrateur
      </Typography>

      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Vue d'ensemble" />
        <Tab label="Notifications" />
        <Tab label="Événements à venir" />
      </Tabs>

      {tabValue === 0 && (
        <>
          {/* Statistiques */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={4} lg={2}>
              <Paper
                elevation={3}
                sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  bgcolor: '#f5f5f5',
                  height: '100%',
                }}
              >
                <PeopleIcon sx={{ fontSize: 40, color: '#003366', mb: 1 }} />
                <Typography variant="h5" component="div">
                  {stats?.totalStudents}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Étudiants
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={2}>
              <Paper
                elevation={3}
                sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  bgcolor: '#f5f5f5',
                  height: '100%',
                }}
              >
                <PeopleIcon sx={{ fontSize: 40, color: '#003366', mb: 1 }} />
                <Typography variant="h5" component="div">
                  {stats?.totalProfessors}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Professeurs
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={2}>
              <Paper
                elevation={3}
                sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  bgcolor: '#f5f5f5',
                  height: '100%',
                }}
              >
                <SchoolIcon sx={{ fontSize: 40, color: '#003366', mb: 1 }} />
                <Typography variant="h5" component="div">
                  {stats?.totalCourses}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Cours
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={2}>
              <Paper
                elevation={3}
                sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  bgcolor: '#f5f5f5',
                  height: '100%',
                }}
              >
                <SchoolIcon sx={{ fontSize: 40, color: '#003366', mb: 1 }} />
                <Typography variant="h5" component="div">
                  {stats?.totalDepartments}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Filières
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={2}>
              <Paper
                elevation={3}
                sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  bgcolor: '#f5f5f5',
                  height: '100%',
                }}
              >
                <PeopleIcon sx={{ fontSize: 40, color: '#4CAF50', mb: 1 }} />
                <Typography variant="h5" component="div">
                  {stats?.activeUsers}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Utilisateurs actifs
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={2}>
              <Paper
                elevation={3}
                sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  bgcolor: '#f5f5f5',
                  height: '100%',
                }}
              >
                <NotificationsIcon sx={{ fontSize: 40, color: '#CC0000', mb: 1 }} />
                <Typography variant="h5" component="div">
                  {stats?.pendingRequests}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Demandes en attente
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Activités récentes et tâches */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card elevation={3}>
                <CardHeader
                  title="Notifications récentes"
                  titleTypographyProps={{ variant: 'h6' }}
                  action={
                    <Button size="small" color="primary" href="/admin/notifications">
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
                                notification.priority === 'high'
                                  ? 'error'
                                  : notification.priority === 'medium'
                                  ? 'warning'
                                  : 'info'
                              }
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={notification.title}
                            secondary={`${notification.content.substring(0, 60)}... - ${formatDate(
                              notification.created_at
                            )}`}
                          />
                        </ListItem>
                      ))
                    ) : (
                      <ListItem>
                        <ListItemText primary="Aucune notification récente" />
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
                    <Button size="small" color="primary" href="/admin/events">
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
                          notification.priority === 'high'
                            ? 'error'
                            : notification.priority === 'medium'
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
