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
  mockAdminStats,
  mockActiveUsers,
  mockSystemAlerts,
  mockPerformanceMetrics,
  mockPendingRequests,
  mockNewRegistrations,
  getTimeAgo,
  formatDateTime
} from '../../utils/adminMockData';

/**
 * @typedef {Object} AdminMenuLink
 * @property {string} id - Identifiant unique du module
 * @property {string} title - Titre du module
 * @property {string} description - Description du module
 * @property {React.ReactNode} icon - Icône du module
 * @property {string} path - Chemin d'accès au module
 * @property {string} color - Couleur de fond du module
 * @property {boolean} implemented - Indique si le module est implémenté
 */

/**
 * Tableau de bord administrateur
 * Affiche les statistiques, alertes système, modules disponibles et actions rapides
 */
const AdminDashboardPage = () => {
  const { authState } = useAuth();
  const navigate = useNavigate();
  
  // États pour les données
  const [stats] = useState(mockAdminStats);
  const [activeUsers] = useState(mockActiveUsers);
  const [systemAlerts] = useState(mockSystemAlerts);
  const [performanceMetrics] = useState(mockPerformanceMetrics);
  const [pendingRequests] = useState(mockPendingRequests);
  const [newRegistrations] = useState(mockNewRegistrations);
  
  // État pour les onglets
  const [tabValue, setTabValue] = useState(0);

  // Liste des modules administratifs
  const adminModules = [
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
      title: 'Paiements & Finances',
      description: 'Gérer les paiements, frais de scolarité et comptabilité',
      icon: <PaymentIcon fontSize="large" />,
      path: '/admin/payments',
      color: '#00796b',
      implemented: false
    },
    {
      id: 'reports',
      title: 'Rapports & Statistiques',
      description: 'Consulter et générer des rapports et statistiques',
      icon: <BarChartIcon fontSize="large" />,
      path: '/admin/reports',
      color: '#5c6bc0',
      implemented: true
    },
    {
      id: 'settings',
      title: 'Paramètres & Configuration',
      description: 'Configurer le système et les paramètres globaux',
      icon: <SettingsIcon fontSize="large" />,
      path: '/admin/settings',
      color: '#455a64',
      implemented: false
    },
    {
      id: 'init',
      title: 'Initialisation des données',
      description: 'Réinitialiser et configurer les données du système',
      icon: <SettingsIcon fontSize="large" />,
      path: '/admin/initialize-data',
      color: '#3949ab',
      implemented: true
    },
    {
      id: 'users',
      title: 'Gestion des utilisateurs',
      description: 'Gérer les utilisateurs et les permissions',
      icon: <PeopleIcon fontSize="large" />,
      path: '/admin/users',
      color: '#2196f3',
      implemented: true
    }
  ];

  /**
   * Gérer le changement d'onglet
   */
  const handleTabChange = (_event, newValue) => {
    setTabValue(newValue);
  };

  /**
   * Navigation vers un module
   */
  const navigateToModule = (path, implemented) => {
    if (implemented) {
      navigate(path);
    } else {
      // Dans une version réelle, on pourrait afficher une notification
      console.info('Ce module n\'est pas encore implémenté.');
    }
  };

  // Vérifier si l'utilisateur est administrateur
  useEffect(() => {
    if (!authState.isAdmin) {
      navigate('/');
    }
  }, [authState.isAdmin, navigate]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Tableau de bord administrateur
      </Typography>
      
      {/* Statistiques principales */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">{stats.totalStudents}</Typography>
            <Typography variant="body2" color="textSecondary">Étudiants</Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">{stats.totalProfessors}</Typography>
            <Typography variant="body2" color="textSecondary">Professeurs</Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">{stats.totalCourses}</Typography>
            <Typography variant="body2" color="textSecondary">Cours</Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">{stats.totalDepartments}</Typography>
            <Typography variant="body2" color="textSecondary">Départements</Typography>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Tableaux de bord */}
      <Box sx={{ mb: 4 }}>
        <Paper sx={{ width: '100%' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            variant="scrollable" 
            scrollButtons="auto"
          >
            <Tab label="Alertes système" />
            <Tab label="Utilisateurs actifs" />
            <Tab label="Performance" />
            <Tab label="Demandes en attente" />
            <Tab label="Nouvelles inscriptions" />
          </Tabs>
          
          {/* Contenu des onglets */}
          <Box sx={{ p: 3 }}>
            {/* Alertes système */}
            {tabValue === 0 && (
              <List>
                {systemAlerts.length > 0 ? (
                  systemAlerts.map((alert) => (
                    <ListItem key={alert.id} divider>
                      <ListItemIcon>
                        {alert.severity === 'error' && <ErrorIcon color="error" />}
                        {alert.severity === 'warning' && <WarningIcon color="warning" />}
                        {alert.severity === 'info' && <InfoIcon color="info" />}
                      </ListItemIcon>
                      <ListItemText 
                        primary={alert.message}
                        secondary={`${alert.system} - ${getTimeAgo(alert.timestamp)}`}
                      />
                      <Chip 
                        label={alert.severity} 
                        color={
                          alert.severity === 'error' ? 'error' : 
                          alert.severity === 'warning' ? 'warning' : 'info'
                        }
                        size="small"
                      />
                    </ListItem>
                  ))
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    Aucune alerte système à afficher.
                  </Typography>
                )}
              </List>
            )}

            {/* Utilisateurs actifs */}
            {tabValue === 1 && (
              <List>
                {activeUsers.length > 0 ? (
                  activeUsers.map((user) => (
                    <ListItem key={user.id} divider>
                      <ListItemIcon>
                        <Avatar src={user.avatar} alt={user.name}>
                          {user.name.charAt(0)}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText 
                        primary={user.name}
                        secondary={`${user.role} - ${getTimeAgo(user.lastActive)}`}
                      />
                      <Chip 
                        label={user.status} 
                        color={
                          user.status === 'online' ? 'success' : 
                          user.status === 'idle' ? 'warning' : 'default'
                        }
                        size="small"
                      />
                    </ListItem>
                  ))
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    Aucun utilisateur actif à afficher.
                  </Typography>
                )}
              </List>
            )}

            {/* Performance */}
            {tabValue === 2 && (
              <Grid container spacing={2}>
                {performanceMetrics.length > 0 ? (
                  performanceMetrics.map((metric) => (
                    <Grid item xs={12} sm={6} md={4} key={metric.id}>
                      <Card variant="outlined">
                        <CardHeader
                          title={metric.name}
                          subheader={metric.description}
                          titleTypographyProps={{ variant: 'subtitle1' }}
                          subheaderTypographyProps={{ variant: 'body2' }}
                        />
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="h5">
                              {metric.value}{metric.unit}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {metric.trend === 'up' && <ArrowUpwardIcon color="success" />}
                              {metric.trend === 'down' && <ArrowDownwardIcon color="error" />}
                              {metric.trend === 'stable' && <RemoveCircleOutlineIcon color="info" />}
                              <Typography variant="body2" color="textSecondary">
                                {metric.trendValue}%
                              </Typography>
                            </Box>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={(metric.value / metric.maxValue) * 100} 
                            color={
                              metric.status === 'good' ? 'success' : 
                              metric.status === 'warning' ? 'warning' : 'error'
                            }
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                  ))
                ) : (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">
                      Aucune métrique de performance à afficher.
                    </Typography>
                  </Grid>
                )}
              </Grid>
            )}

            {/* Demandes en attente */}
            {tabValue === 3 && (
              <List>
                {pendingRequests.length > 0 ? (
                  pendingRequests.map((request) => (
                    <ListItem key={request.id} divider>
                      <ListItemText 
                        primary={request.title}
                        secondary={`De: ${request.from} - ${formatDateTime(request.timestamp)}`}
                      />
                      <Chip 
                        label={request.type} 
                        color={
                          request.priority === 'high' ? 'error' : 
                          request.priority === 'medium' ? 'warning' : 'info'
                        }
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      <Button size="small" variant="outlined">
                        Traiter
                      </Button>
                    </ListItem>
                  ))
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    Aucune demande en attente à afficher.
                  </Typography>
                )}
              </List>
            )}

            {/* Nouvelles inscriptions */}
            {tabValue === 4 && (
              <List>
                {newRegistrations.length > 0 ? (
                  newRegistrations.map((registration) => (
                    <ListItem key={registration.id} divider>
                      <ListItemIcon>
                        <Avatar>
                          {registration.name.charAt(0)}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText 
                        primary={registration.name}
                        secondary={`Email: ${registration.email} - ${formatDateTime(registration.timestamp)}`}
                      />
                      <Chip 
                        label={registration.status} 
                        color={
                          registration.status === 'approved' ? 'success' : 
                          registration.status === 'pending' ? 'warning' : 'error'
                        }
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      {registration.status === 'pending' && (
                        <Box>
                          <Button size="small" color="success" sx={{ minWidth: 0, px: 1, mr: 0.5 }}>
                            ✓
                          </Button>
                          <Button size="small" color="error" sx={{ minWidth: 0, px: 1 }}>
                            ✗
                          </Button>
                        </Box>
                      )}
                    </ListItem>
                  ))
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    Aucune nouvelle inscription à afficher.
                  </Typography>
                )}
              </List>
            )}
          </Box>
        </Paper>
      </Box>
      
      {/* Modules d'administration */}
      <Box sx={{ mb: 4 }}>
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
