import React, { useState, useEffect, useCallback } from 'react';
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
import { useAuth } from '@/context/AuthContext';
import { getAdminDashboardData } from '@/api/admin';
import { alpha } from '@mui/material';

const StatCard = ({ icon, value, label, color }) => (
  <Card sx={{
    height: '180px',
    borderRadius: 3,
    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
    border: `2px solid ${alpha(color, 0.5)}`,
    transition: 'all 0.25s',
    display: 'flex',
    flexDirection: 'column',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: `0 8px 24px ${alpha(color, 0.15)}`,
      borderColor: color
    }
  }}>
    <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 2.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(color, 0.1), display: 'flex', mr: 2 }}>
          {icon}
        </Box>
        <Typography variant="body2" color="text.secondary" fontWeight="700">{label}</Typography>
      </Box>
      <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h3" fontWeight="900" color={color}>{value ?? 0}</Typography>
      </Box>
    </CardContent>
  </Card>
);

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

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const adminProfileId = authState.profile?.id || authState.user?.id;
      const { data, error: requestError } = await getAdminDashboardData(adminProfileId);

      if (requestError) {
        throw requestError;
      }

      setStats(data?.stats || {
        totalStudents: 0,
        totalProfessors: 0,
        totalCourses: 0,
        totalDepartments: 0,
        activeUsers: 0,
        pendingRequests: 0,
      });
      setNotifications((data?.notifications || []).slice(0, 5));
      setEvents((data?.events || []).slice(0, 5));
    } catch (err) {
      console.error('Erreur lors de la récupération des données du tableau de bord:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }, [authState.profile?.id, authState.user?.id]);

  // Charger les données du tableau de bord
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

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
              <StatCard
                title="Étudiants inscrits"
                value={stats?.totalStudents}
                icon={<PeopleIcon />}
                color="#003366"
                label="Étudiants inscrits"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Professeurs"
                value={stats?.totalProfessors}
                icon={<SchoolIcon />}
                color="#2e7d32"
                label="Professeurs"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Cours"
                value={stats?.totalCourses}
                icon={<AssignmentIcon />}
                color="#CC0000"
                label="Cours"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Demandes en attente"
                value={stats?.pendingRequests}
                icon={<DescriptionIcon />}
                color="#ed6c02"
                label="Demandes en attente"
              />
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
