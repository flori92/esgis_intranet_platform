import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Avatar,
  CardHeader,
  Tabs,
  Tab,
  LinearProgress,
  CardActions,
} from '@mui/material';
import {
  People as PeopleIcon,
  MenuBook as MenuBookIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Apartment as ApartmentIcon,
  Assignment as AssignmentIcon,
  Work as WorkIcon,
  Description as DescriptionIcon,
  Payment as PaymentIcon,
  BarChart as BarChartIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  RemoveCircleOutline as RemoveCircleOutlineIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  AdminStats,
  ActiveUser,
  SystemAlert,
  PerformanceMetric,
  PendingRequest,
  NewRegistration,
  mockAdminStats,
  mockActiveUsers,
  mockSystemAlerts,
  mockPerformanceMetrics,
  mockPendingRequests,
  mockNewRegistrations,
  getTimeAgo,
  formatDateTime
} from '../../utils/adminMockData';

interface AdminMenuLink {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  color: string;
  implemented: boolean;
}

const AdminDashboardPage: React.FC = () => {
  const { authState } = useAuth();
  const navigate = useNavigate();
  
  // États pour les données
  const [stats] = useState<AdminStats>(mockAdminStats);
  const [activeUsers] = useState<ActiveUser[]>(mockActiveUsers);
  const [systemAlerts] = useState<SystemAlert[]>(mockSystemAlerts);
  const [performanceMetrics] = useState<PerformanceMetric[]>(mockPerformanceMetrics);
  const [pendingRequests] = useState<PendingRequest[]>(mockPendingRequests);
  const [newRegistrations] = useState<NewRegistration[]>(mockNewRegistrations);
  
  // État pour les onglets
  const [tabValue, setTabValue] = useState(0);

  // Liste des modules administratifs
  const adminModules: AdminMenuLink[] = [
    {
      id: 'departments',
      title: 'Départements & Filières',
      description: 'Gérer les filières, départements et responsables académiques',
      icon: <ApartmentIcon fontSize="large" />,
      path: '/admin/departments',
      color: '#1976d2',
      implemented: true
    },
    {
      id: 'professors',
      title: 'Professeurs & Rôles',
      description: 'Gérer les professeurs et leurs rôles administratifs',
      icon: <PersonIcon fontSize="large" />,
      path: '/admin/professor-roles',
      color: '#9c27b0',
      implemented: true
    },
    {
      id: 'courses',
      title: 'Matières & Cours',
      description: 'Gérer les cours, matières et programmes académiques',
      icon: <MenuBookIcon fontSize="large" />,
      path: '/admin/courses',
      color: '#2e7d32',
      implemented: true
    },
    {
      id: 'professor-courses',
      title: 'Assignation des Cours',
      description: 'Associer des professeurs aux cours et matières',
      icon: <AssignmentIcon fontSize="large" />,
      path: '/admin/professor-courses',
      color: '#ed6c02',
      implemented: true
    },
    {
      id: 'students',
      title: 'Gestion des Étudiants',
      description: 'Gérer les étudiants, inscriptions et parcours académiques',
      icon: <PeopleIcon fontSize="large" />,
      path: '/admin/students',
      color: '#d32f2f',
      implemented: false
    },
    {
      id: 'documents',
      title: 'Générateur de Documents',
      description: 'Créer et générer des documents administratifs',
      icon: <DescriptionIcon fontSize="large" />,
      path: '/admin/document-generator',
      color: '#0288d1',
      implemented: true
    },
    {
      id: 'stages',
      title: 'Stages & Emplois',
      description: 'Gérer les offres de stages et opportunités professionnelles',
      icon: <WorkIcon fontSize="large" />,
      path: '/admin/stages',
      color: '#7b1fa2',
      implemented: true
    },
    {
      id: 'payments',
      title: 'Finances & Paiements',
      description: 'Gestion des paiements, frais de scolarité et comptabilité',
      icon: <PaymentIcon fontSize="large" />,
      path: '/admin/finances',
      color: '#00796b',
      implemented: false
    },
    {
      id: 'reports',
      title: 'Rapports & Statistiques',
      description: 'Générer des rapports et visualiser les statistiques de l\'établissement',
      icon: <BarChartIcon fontSize="large" />,
      path: '/admin/reports',
      color: '#795548',
      implemented: false
    },
    {
      id: 'settings',
      title: 'Paramètres du Système',
      description: 'Configurer les paramètres globaux de la plateforme',
      icon: <SettingsIcon fontSize="large" />,
      path: '/admin/settings',
      color: '#607d8b',
      implemented: false
    }
  ];

  // Effet pour charger les données
  useEffect(() => {
    // Ici nous utiliserions normalement des appels à l'API Supabase
    // Mais pour le moment, les données mock sont déjà chargées dans les états
  }, []);

  // Gérer le changement d'onglet
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Navigation vers un module
  const navigateToModule = (path: string, implemented: boolean) => {
    if (implemented) {
      navigate(path);
    } else {
      // Afficher un message d'information
      alert('Ce module sera bientôt disponible !');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Tableau de bord administrateur
      </Typography>

      {/* Salutation personnalisée */}
      <Typography variant="h6" sx={{ mb: 3, color: '#003366' }}>
        Bienvenue, {authState?.user?.email || 'Administrateur'} !
      </Typography>

      {/* Onglets */}
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        indicatorColor="primary"
        textColor="primary"
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Vue d'ensemble" />
        <Tab label="Utilisateurs actifs" />
        <Tab label="Alertes système" />
        <Tab label="Demandes" />
        <Tab label="Inscriptions" />
      </Tabs>

      {/* Vue d'ensemble */}
      {tabValue === 0 && (
        <>
          {/* Widgets de statistiques */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  height: 140,
                  bgcolor: '#e3f2fd',
                  borderLeft: '4px solid #1976d2',
                }}
              >
                <Typography variant="subtitle2" color="textSecondary">
                  Étudiants
                </Typography>
                <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
                  <PeopleIcon sx={{ fontSize: 40, color: '#1976d2', mr: 2 }} />
                  <Typography variant="h4">{stats.totalStudents}</Typography>
                </Box>
                <Typography variant="body2">Total d'étudiants inscrits</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  height: 140,
                  bgcolor: '#e8f5e9',
                  borderLeft: '4px solid #2e7d32',
                }}
              >
                <Typography variant="subtitle2" color="textSecondary">
                  Professeurs
                </Typography>
                <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
                  <PersonIcon sx={{ fontSize: 40, color: '#2e7d32', mr: 2 }} />
                  <Typography variant="h4">{stats.totalProfessors}</Typography>
                </Box>
                <Typography variant="body2">Total de professeurs</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  height: 140,
                  bgcolor: '#fff8e1',
                  borderLeft: '4px solid #ff9800',
                }}
              >
                <Typography variant="subtitle2" color="textSecondary">
                  Cours
                </Typography>
                <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
                  <MenuBookIcon sx={{ fontSize: 40, color: '#ff9800', mr: 2 }} />
                  <Typography variant="h4">{stats.totalCourses}</Typography>
                </Box>
                <Typography variant="body2">Total de cours</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  height: 140,
                  bgcolor: '#ffebee',
                  borderLeft: '4px solid #d32f2f',
                }}
              >
                <Typography variant="subtitle2" color="textSecondary">
                  Demandes
                </Typography>
                <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
                  <AssignmentIcon sx={{ fontSize: 40, color: '#d32f2f', mr: 2 }} />
                  <Typography variant="h4">{stats.pendingRequests}</Typography>
                </Box>
                <Typography variant="body2">Demandes en attente</Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Tableau de bord principal */}
          <Grid container spacing={3}>
            {/* Utilisateurs actifs */}
            <Grid item xs={12} md={6} lg={4}>
              <Card elevation={3} sx={{ height: '100%' }}>
                <CardHeader 
                  title="Utilisateurs actifs" 
                  titleTypographyProps={{ variant: 'h6' }}
                  action={
                    <Button size="small" color="primary" onClick={() => setTabValue(1)}>
                      Voir tout
                    </Button>
                  }
                />
                <Divider />
                <CardContent sx={{ p: 0 }}>
                  <List>
                    {activeUsers.slice(0, 5).map((user) => (
                      <ListItem key={user.id} divider>
                        <ListItemIcon>
                          <Avatar 
                            sx={{ 
                              bgcolor: user.role === 'student' 
                                ? '#1976d2' 
                                : user.role === 'professor' 
                                  ? '#2e7d32' 
                                  : '#9c27b0'
                            }}
                          >
                            {user.name.substring(0, 1)}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {user.name}
                              <Chip
                                size="small"
                                label={
                                  user.role === 'student' 
                                    ? 'Étudiant' 
                                    : user.role === 'professor' 
                                      ? 'Professeur' 
                                      : 'Admin'
                                }
                                sx={{ 
                                  ml: 1, 
                                  bgcolor: user.role === 'student' 
                                    ? '#1976d2' 
                                    : user.role === 'professor' 
                                      ? '#2e7d32' 
                                      : '#9c27b0',
                                  color: 'white'
                                }}
                              />
                              <Box 
                                sx={{ 
                                  width: 10, 
                                  height: 10, 
                                  borderRadius: '50%', 
                                  bgcolor: user.status === 'online' 
                                    ? '#4caf50' 
                                    : user.status === 'idle' 
                                      ? '#ff9800' 
                                      : '#bdbdbd',
                                  ml: 1
                                }}
                              />
                            </Box>
                          }
                          secondary={`Dernière activité: ${getTimeAgo(user.lastActivity)}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Alertes système */}
            <Grid item xs={12} md={6} lg={4}>
              <Card elevation={3} sx={{ height: '100%' }}>
                <CardHeader 
                  title="Alertes système" 
                  titleTypographyProps={{ variant: 'h6' }}
                  action={
                    <Button size="small" color="primary" onClick={() => setTabValue(2)}>
                      Voir tout
                    </Button>
                  }
                />
                <Divider />
                <CardContent sx={{ p: 0 }}>
                  <List>
                    {systemAlerts.slice(0, 3).map((alert) => (
                      <ListItem key={alert.id} divider>
                        <ListItemIcon>
                          {alert.severity === 'error' && <ErrorIcon color="error" />}
                          {alert.severity === 'warning' && <WarningIcon color="warning" />}
                          {alert.severity === 'info' && <InfoIcon color="info" />}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {alert.title}
                              {alert.resolved && (
                                <Chip 
                                  size="small" 
                                  label="Résolu" 
                                  sx={{ ml: 1, bgcolor: '#4caf50', color: 'white' }} 
                                />
                              )}
                            </Box>
                          }
                          secondary={`${alert.description.substring(0, 60)}... - ${formatDateTime(alert.date)}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Indicateurs de performance */}
            <Grid item xs={12} md={6} lg={4}>
              <Card elevation={3} sx={{ height: '100%' }}>
                <CardHeader 
                  title="Indicateurs de performance" 
                  titleTypographyProps={{ variant: 'h6' }}
                />
                <Divider />
                <CardContent sx={{ p: 0 }}>
                  <List>
                    {performanceMetrics.map((metric) => (
                      <ListItem key={metric.id} divider>
                        <ListItemText
                          primary={metric.name}
                          secondary={
                            <>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <Typography variant="h6" component="span">
                                  {metric.value}{metric.unit}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                                  {metric.trend === 'up' && (
                                    <ArrowUpwardIcon 
                                      fontSize="small" 
                                      sx={{ color: metric.change > 0 ? '#4caf50' : '#f44336' }} 
                                    />
                                  )}
                                  {metric.trend === 'down' && (
                                    <ArrowDownwardIcon 
                                      fontSize="small" 
                                      sx={{ color: metric.change < 0 ? '#4caf50' : '#f44336' }} 
                                    />
                                  )}
                                  {metric.trend === 'stable' && (
                                    <RemoveCircleOutlineIcon fontSize="small" sx={{ color: '#757575' }} />
                                  )}
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      ml: 0.5, 
                                      color: (metric.trend === 'up' && metric.change > 0) || 
                                             (metric.trend === 'down' && metric.change < 0) 
                                        ? '#4caf50' 
                                        : (metric.trend === 'stable' ? '#757575' : '#f44336')
                                    }}
                                  >
                                    {metric.change > 0 && '+'}
                                    {metric.change}{metric.unit}
                                  </Typography>
                                </Box>
                              </Box>
                              <LinearProgress 
                                variant="determinate" 
                                value={Math.min(metric.value, 100)} 
                                sx={{ height: 6, borderRadius: 3 }}
                              />
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}

      {/* Onglet Utilisateurs actifs */}
      {tabValue === 1 && (
        <Card>
          <CardHeader 
            title="Utilisateurs actifs" 
            titleTypographyProps={{ variant: 'h6' }}
            subheader="Liste de tous les utilisateurs actifs sur la plateforme"
          />
          <Divider />
          <CardContent>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body1">
                {activeUsers.length} utilisateurs actifs
              </Typography>
            </Box>
            <List>
              {activeUsers.map((user) => (
                <ListItem 
                  key={user.id} 
                  divider 
                  sx={{ 
                    borderRadius: 1, 
                    mb: 1, 
                    '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' } 
                  }}
                >
                  <ListItemIcon>
                    <Avatar 
                      sx={{ 
                        bgcolor: user.role === 'student' 
                          ? '#1976d2' 
                          : user.role === 'professor' 
                            ? '#2e7d32' 
                            : '#9c27b0'
                      }}
                    >
                      {user.name.substring(0, 1)}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {user.name}
                        <Chip
                          size="small"
                          label={
                            user.role === 'student' 
                              ? 'Étudiant' 
                              : user.role === 'professor' 
                                ? 'Professeur' 
                                : 'Admin'
                          }
                          sx={{ 
                            ml: 1, 
                            bgcolor: user.role === 'student' 
                              ? '#1976d2' 
                              : user.role === 'professor' 
                                ? '#2e7d32' 
                                : '#9c27b0',
                            color: 'white'
                          }}
                        />
                        <Box 
                          sx={{ 
                            width: 10, 
                            height: 10, 
                            borderRadius: '50%', 
                            bgcolor: user.status === 'online' 
                              ? '#4caf50' 
                              : user.status === 'idle' 
                                ? '#ff9800' 
                                : '#bdbdbd',
                            ml: 1
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" component="span">
                          {user.email}
                        </Typography>
                        <Typography variant="body2" component="div" sx={{ color: 'text.secondary' }}>
                          Dernière activité: {getTimeAgo(user.lastActivity)}
                        </Typography>
                      </>
                    }
                  />
                  <Button 
                    size="small" 
                    variant="outlined" 
                    color="primary" 
                    onClick={() => navigateToModule(
                      user.role === 'student' 
                        ? '/admin/students' 
                        : user.role === 'professor' 
                          ? '/admin/professor-roles' 
                          : '/admin/settings', 
                      true
                    )}
                  >
                    Voir le profil
                  </Button>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Onglet Alertes système */}
      {tabValue === 2 && (
        <Card>
          <CardHeader 
            title="Alertes système" 
            titleTypographyProps={{ variant: 'h6' }}
            subheader="Alertes et notifications du système"
          />
          <Divider />
          <CardContent>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body1">
                {systemAlerts.filter(alert => !alert.resolved).length} alertes non résolues
              </Typography>
            </Box>
            <List>
              {systemAlerts.map((alert) => (
                <ListItem 
                  key={alert.id} 
                  divider 
                  sx={{ 
                    borderRadius: 1, 
                    mb: 1, 
                    bgcolor: alert.severity === 'error' 
                      ? 'rgba(244, 67, 54, 0.08)' 
                      : alert.severity === 'warning' 
                        ? 'rgba(255, 152, 0, 0.08)' 
                        : 'rgba(3, 169, 244, 0.08)',
                    '&:hover': { 
                      bgcolor: alert.severity === 'error' 
                        ? 'rgba(244, 67, 54, 0.12)' 
                        : alert.severity === 'warning' 
                          ? 'rgba(255, 152, 0, 0.12)' 
                          : 'rgba(3, 169, 244, 0.12)' 
                    } 
                  }}
                >
                  <ListItemIcon>
                    {alert.severity === 'error' && <ErrorIcon color="error" />}
                    {alert.severity === 'warning' && <WarningIcon color="warning" />}
                    {alert.severity === 'info' && <InfoIcon color="info" />}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {alert.title}
                        {alert.resolved && (
                          <Chip 
                            size="small" 
                            label="Résolu" 
                            sx={{ ml: 1, bgcolor: '#4caf50', color: 'white' }} 
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          {alert.description}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {formatDateTime(alert.date)}
                        </Typography>
                      </>
                    }
                  />
                  <Button 
                    size="small" 
                    variant="outlined" 
                    color="primary" 
                    disabled={alert.resolved}
                  >
                    {alert.resolved ? 'Résolu' : 'Marquer comme résolu'}
                  </Button>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Onglet Demandes */}
      {tabValue === 3 && (
        <Card>
          <CardHeader 
            title="Demandes" 
            titleTypographyProps={{ variant: 'h6' }}
            subheader="Liste des demandes en attente"
          />
          <Divider />
          <CardContent>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body1">
                {pendingRequests.length} demandes en attente
              </Typography>
            </Box>
            <List>
              {pendingRequests.map((request) => (
                <ListItem 
                  key={request.id} 
                  divider 
                  sx={{ 
                    borderRadius: 1, 
                    mb: 1, 
                    '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' } 
                  }}
                >
                  <ListItemIcon>
                    <AssignmentIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {request.title}
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          {request.description}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {formatDateTime(request.date)}
                        </Typography>
                      </>
                    }
                  />
                  <Button 
                    size="small" 
                    variant="outlined" 
                    color="primary" 
                  >
                    Traiter la demande
                  </Button>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Onglet Inscriptions */}
      {tabValue === 4 && (
        <Card>
          <CardHeader 
            title="Inscriptions" 
            titleTypographyProps={{ variant: 'h6' }}
            subheader="Liste des nouvelles inscriptions"
          />
          <Divider />
          <CardContent>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body1">
                {newRegistrations.length} nouvelles inscriptions
              </Typography>
            </Box>
            <List>
              {newRegistrations.map((registration) => (
                <ListItem 
                  key={registration.id} 
                  divider 
                  sx={{ 
                    borderRadius: 1, 
                    mb: 1, 
                    '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' } 
                  }}
                >
                  <ListItemIcon>
                    <PeopleIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {registration.student.name}
                        <Chip
                          size="small"
                          label={registration.status}
                          sx={{ 
                            ml: 1, 
                            bgcolor: registration.status === 'approved' 
                              ? '#4caf50' 
                              : registration.status === 'pending' 
                                ? '#ff9800' 
                                : registration.status === 'waiting_for_documents'
                                  ? '#2196f3'
                                  : '#f44336',
                            color: 'white'
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" component="div">
                          <strong>Email :</strong> {registration.student.email}
                        </Typography>
                        <Typography variant="body2" component="div">
                          <strong>Programme :</strong> {registration.program.name} ({registration.program.degree})
                        </Typography>
                        <Typography variant="body2" component="div">
                          <strong>Documents :</strong> {registration.documents.filter(doc => doc.submitted).length}/{registration.documents.length} soumis
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1 }}>
                          Demande soumise le {formatDateTime(registration.applicationDate)}
                        </Typography>
                      </>
                    }
                  />
                  <Button 
                    size="small" 
                    variant="outlined" 
                    color="primary" 
                  >
                    Voir le profil
                  </Button>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Modules administratifs */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Modules d'administration
        </Typography>

        <Grid container spacing={3}>
          {adminModules.map((module) => (
            <Grid item xs={12} sm={6} md={4} key={module.id}>
              <Card 
                variant="outlined" 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  opacity: module.implemented ? 1 : 0.7
                }}
              >
                <Box 
                  sx={{ 
                    p: 2, 
                    backgroundColor: module.color,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {module.icon}
                  <Typography variant="h6" sx={{ ml: 1 }}>
                    {module.title}
                  </Typography>
                </Box>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {module.description}
                  </Typography>
                </CardContent>
                <Divider />
                <CardActions>
                  <Button 
                    size="small" 
                    onClick={() => navigateToModule(module.path, module.implemented)}
                    disabled={!module.implemented}
                  >
                    {module.implemented ? 'Accéder' : 'Bientôt disponible'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Actions rapides */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Actions rapides
        </Typography>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <List>
                <ListItem button onClick={() => navigateToModule('/admin/departments', true)}>
                  <ListItemIcon>
                    <ApartmentIcon />
                  </ListItemIcon>
                  <ListItemText primary="Créer un nouveau département" />
                </ListItem>
                <ListItem button onClick={() => navigateToModule('/admin/courses', true)}>
                  <ListItemIcon>
                    <MenuBookIcon />
                  </ListItemIcon>
                  <ListItemText primary="Ajouter un nouveau cours" />
                </ListItem>
                <ListItem button onClick={() => navigateToModule('/admin/professor-roles', true)}>
                  <ListItemIcon>
                    <PersonIcon />
                  </ListItemIcon>
                  <ListItemText primary="Assigner des rôles aux professeurs" />
                </ListItem>
              </List>
            </Grid>
            <Grid item xs={12} md={6}>
              <List>
                <ListItem button onClick={() => navigateToModule('/admin/stages', true)}>
                  <ListItemIcon>
                    <WorkIcon />
                  </ListItemIcon>
                  <ListItemText primary="Publier une offre de stage" />
                </ListItem>
                <ListItem button onClick={() => navigateToModule('/admin/document-generator', true)}>
                  <ListItemIcon>
                    <DescriptionIcon />
                  </ListItemIcon>
                  <ListItemText primary="Générer un document administratif" />
                </ListItem>
                <ListItem button onClick={() => navigateToModule('/admin/professor-courses', true)}>
                  <ListItemIcon>
                    <AssignmentIcon />
                  </ListItemIcon>
                  <ListItemText primary="Assigner un professeur à un cours" />
                </ListItem>
              </List>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Box>
  );
};

export default AdminDashboardPage;
