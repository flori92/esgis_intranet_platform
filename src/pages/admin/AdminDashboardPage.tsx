import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  MenuBook as MenuBookIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Apartment as ApartmentIcon,
  Assignment as AssignmentIcon,
  Work as WorkIcon,
  Description as DescriptionIcon,
  Payment as PaymentIcon,
  BarChart as BarChartIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

// Interface pour les liens du menu admin
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

  // Navigation vers un module
  const navigateToModule = (path: string, implemented: boolean) => {
    if (implemented) {
      navigate(path);
    } else {
      alert('Ce module est en cours de développement et sera bientôt disponible.');
    }
  };

  if (!authState.isAdmin) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Vous n'avez pas les droits nécessaires pour accéder à cette page.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Tableau de Bord Administratif
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Bienvenue dans la console d'administration de l'intranet ESGIS
        </Typography>
      </Box>

      {/* Statistiques rapides */}
      <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="primary">
                4
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Départements
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="secondary">
                32
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Professeurs
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ color: 'success.main' }}>
                524
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Étudiants
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ color: 'info.main' }}>
                87
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Cours
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Modules administratifs */}
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

      {/* Actions rapides */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Actions rapides
        </Typography>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <List>
                <ListItem button onClick={() => navigate('/admin/departments')}>
                  <ListItemIcon>
                    <ApartmentIcon />
                  </ListItemIcon>
                  <ListItemText primary="Créer un nouveau département" />
                </ListItem>
                <ListItem button onClick={() => navigate('/admin/courses')}>
                  <ListItemIcon>
                    <MenuBookIcon />
                  </ListItemIcon>
                  <ListItemText primary="Ajouter un nouveau cours" />
                </ListItem>
                <ListItem button onClick={() => navigate('/admin/professor-roles')}>
                  <ListItemIcon>
                    <PersonIcon />
                  </ListItemIcon>
                  <ListItemText primary="Assigner des rôles aux professeurs" />
                </ListItem>
              </List>
            </Grid>
            <Grid item xs={12} md={6}>
              <List>
                <ListItem button onClick={() => navigate('/admin/stages')}>
                  <ListItemIcon>
                    <WorkIcon />
                  </ListItemIcon>
                  <ListItemText primary="Publier une offre de stage" />
                </ListItem>
                <ListItem button onClick={() => navigate('/admin/document-generator')}>
                  <ListItemIcon>
                    <DescriptionIcon />
                  </ListItemIcon>
                  <ListItemText primary="Générer un document administratif" />
                </ListItem>
                <ListItem button onClick={() => navigate('/admin/professor-courses')}>
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
