import React, { useState } from 'react';
import { Outlet, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Event as EventIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  Description as DescriptionIcon,
  Work as WorkIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  CalendarMonth as CalendarMonthIcon,
  Grading as GradingIcon,
  Folder as FolderIcon,
  Chat as ChatIcon,
  Book as BookIcon,
  BarChart as BarChartIcon,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
// Suppression de l'import de AuthContextType

// Largeur du drawer
const drawerWidth = 240;

/**
 * Layout principal pour les pages authentifiées
 * Inclut une barre de navigation supérieure, un menu latéral et un pied de page
 * @returns {JSX.Element} Le composant de layout principal
 */
const MainLayout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [anchorElNotifications, setAnchorElNotifications] = useState(null);
  
  const { authState, signOut } = useAuth();
  const { user, profile, isAdmin, isProfessor } = authState;
  const navigate = useNavigate();

  /**
   * Gestion du menu utilisateur
   * @param {React.MouseEvent} event - L'événement de clic
   */
  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  /**
   * Fermeture du menu utilisateur
   */
  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  /**
   * Gestion du menu notifications
   * @param {React.MouseEvent} event - L'événement de clic
   */
  const handleOpenNotificationsMenu = (event) => {
    setAnchorElNotifications(event.currentTarget);
  };

  /**
   * Fermeture du menu notifications
   */
  const handleCloseNotificationsMenu = () => {
    setAnchorElNotifications(null);
  };

  /**
   * Gestion du drawer mobile
   */
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  /**
   * Déconnexion de l'utilisateur
   */
  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  /**
   * Définition des éléments de menu selon le rôle de l'utilisateur
   * @returns {Array} Tableau d'items du menu
   */
  const getMenuItems = () => {
    if (isAdmin) {
      return [
        { text: 'Tableau de bord', icon: <DashboardIcon />, path: '/admin' },
        { text: 'Départements & Filières', icon: <SchoolIcon />, path: '/admin/departments' },
        { text: 'Rôles Professeurs', icon: <PersonIcon />, path: '/admin/professor-roles' },
        { text: 'Matières & Cours', icon: <BookIcon />, path: '/admin/courses' },
        { text: 'Assignation de Cours', icon: <AssignmentIcon />, path: '/admin/professor-courses' },
        { text: 'Gestion Étudiants', icon: <PeopleIcon />, path: '/admin/students' },
        { text: 'Stages & Emplois', icon: <WorkIcon />, path: '/stages' },
        { text: 'Documents', icon: <DescriptionIcon />, path: '/admin/document-generator' },
        { text: 'Statistiques', icon: <BarChartIcon />, path: '/admin/reports' },
        { text: 'Emplois du temps', icon: <EventIcon />, path: '/schedule' },
        { text: 'Paramètres', icon: <SettingsIcon />, path: '/settings' },
      ];
    } else if (isProfessor) {
      return [
        { text: 'Tableau de bord', icon: <DashboardIcon />, path: '/professor/dashboard' },
        { text: 'Emploi du temps', icon: <EventIcon />, path: '/professor/schedule' },
        { text: 'Mes cours', icon: <SchoolIcon />, path: '/professor/courses' },
        { text: 'Notes', icon: <AssignmentIcon />, path: '/professor/grades' },
        { text: 'Examens', icon: <AssignmentIcon />, path: '/professor/exams' },
        { text: 'Documents', icon: <DescriptionIcon />, path: '/professor/documents' },
        { text: 'Messages', icon: <ChatIcon />, path: '/professor/messages' },
      ];
    } else {
      // Étudiant (par défaut)
      return [
        { text: 'Tableau de bord', icon: <DashboardIcon />, path: '/student' },
        { text: 'Mes examens', icon: <AssignmentIcon />, path: '/student/exams' },
        { text: 'Emploi du temps', icon: <CalendarMonthIcon />, path: '/schedule' },
        { text: 'Cours', icon: <SchoolIcon />, path: '/courses' },
        { text: 'Notes', icon: <GradingIcon />, path: '/grades' },
        { text: 'Stages & Emplois', icon: <WorkIcon />, path: '/stages' },
        { text: 'Documents', icon: <FolderIcon />, path: '/documents' },
        { text: 'Messages', icon: <ChatIcon />, path: '/messages' },
      ];
    }
  };

  // Récupération des éléments de menu
  const menuItems = getMenuItems();
  
  // Contenu du drawer (menu latéral)
  const drawer = (
    <div>
      <Toolbar sx={{ 
        bgcolor: '#003366', // Bleu ESGIS
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        py: 2,
      }}>
        <Box
          component="img"
          src="https://flori92.github.io/esgis_intranet_platform/images/logo-esgis-white.svg"
          alt="Logo ESGIS"
          sx={{
            height: 60,
            mb: 1,
          }}
        />
        <Typography 
          variant="subtitle1" 
          component="div"
          fontFamily="Montserrat"
          fontWeight="bold"
        >
          {isAdmin ? 'Administration' : isProfessor ? 'Espace Professeur' : 'Espace Étudiant'}
        </Typography>
      </Toolbar>
      <Divider />
      
      {/* Informations utilisateur */}
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Avatar 
          alt={profile?.full_name || user?.email || 'Utilisateur'} 
          src={profile?.avatar_url}
          sx={{ 
            width: 64, 
            height: 64, 
            mx: 'auto', 
            mb: 1,
            bgcolor: '#CC0000', // Rouge ESGIS
            fontFamily: 'Montserrat'
          }}
        />
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2, mb: 2 }}>
          {profile?.full_name && (
            <Typography variant="subtitle1" fontWeight="bold" fontFamily="Montserrat" sx={{ mt: 1, textAlign: 'center' }}>
              {profile?.full_name}
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary" fontFamily="Montserrat" sx={{ textAlign: 'center' }}>
            {user?.email}
          </Typography>
        </Box>
      </Box>
      
      <Divider />
      
      {/* Liste des éléments du menu */}
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton 
              component={RouterLink} 
              to={item.path}
              sx={{ 
                '&.active': { 
                  bgcolor: 'rgba(0, 51, 102, 0.1)',
                  borderLeft: '4px solid #003366',
                },
                fontFamily: 'Montserrat'
              }}
            >
              <ListItemIcon sx={{ color: '#003366' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{ 
                  fontFamily: 'Montserrat',
                  fontSize: '0.9rem'
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* Barre de navigation supérieure */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'white',
          color: '#003366',
          boxShadow: 1,
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        <Toolbar>
          {/* Bouton menu mobile */}
          <IconButton
            color="inherit"
            aria-label="ouvrir le menu"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          {/* Titre */}
          <Typography
            variant="h6"
            noWrap
            component="div"
            fontFamily="Montserrat"
            fontWeight="bold"
            sx={{ flexGrow: 1 }}
          >
            {isAdmin ? 'ESGIS Admin' : isProfessor ? 'ESGIS Professeur' : 'ESGIS Intranet'}
          </Typography>
          
          {/* Menu notifications */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton 
              size="large" 
              color="inherit"
              onClick={handleOpenNotificationsMenu}
            >
              <Badge badgeContent={4} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
            <Menu
              anchorEl={anchorElNotifications}
              open={Boolean(anchorElNotifications)}
              onClose={handleCloseNotificationsMenu}
              sx={{ mt: '45px' }}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <MenuItem component={RouterLink} to="/notifications" onClick={handleCloseNotificationsMenu}>
                <Typography textAlign="center" fontFamily="Montserrat">Note publiée: Développement Web</Typography>
              </MenuItem>
              <MenuItem component={RouterLink} to="/notifications" onClick={handleCloseNotificationsMenu}>
                <Typography textAlign="center" fontFamily="Montserrat">Nouvel examen: Algorithmique</Typography>
              </MenuItem>
              <Divider />
              <MenuItem component={RouterLink} to="/notifications" onClick={handleCloseNotificationsMenu}>
                <Typography textAlign="center" fontFamily="Montserrat" color="primary">Voir toutes les notifications</Typography>
              </MenuItem>
            </Menu>
            
            {/* Menu utilisateur */}
            <IconButton onClick={handleOpenUserMenu} sx={{ ml: 1 }}>
              <Avatar 
                alt={profile?.full_name || user?.email || 'Utilisateur'} 
                src={profile?.avatar_url || undefined}
                sx={{ 
                  bgcolor: '#CC0000', // Rouge ESGIS pour les avatars sans image
                  fontFamily: 'Montserrat'
                }}
              />
            </IconButton>
            <Menu
              anchorEl={anchorElUser}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
              sx={{ mt: '45px' }}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <MenuItem component={RouterLink} to="/profile" onClick={handleCloseUserMenu}>
                <ListItemIcon>
                  <PersonIcon fontSize="small" sx={{ color: '#003366' }} />
                </ListItemIcon>
                <Typography textAlign="center" fontFamily="Montserrat">Mon profil</Typography>
              </MenuItem>
              <MenuItem component={RouterLink} to="/settings" onClick={handleCloseUserMenu}>
                <ListItemIcon>
                  <SettingsIcon fontSize="small" sx={{ color: '#003366' }} />
                </ListItemIcon>
                <Typography textAlign="center" fontFamily="Montserrat">Paramètres</Typography>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" sx={{ color: '#CC0000' }} />
                </ListItemIcon>
                <Typography textAlign="center" fontFamily="Montserrat">Déconnexion</Typography>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      
      {/* Menu latéral */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="menu principal"
      >
        {/* Menu mobile */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Meilleure performance sur mobile
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Menu desktop */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      {/* Contenu principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'Montserrat', // Police principale
        }}
      >
        <Toolbar /> {/* Espace pour la barre d'outils */}
        
        {/* Contenu des pages */}
        <Box sx={{ flexGrow: 1, py: 2 }}>
          <Outlet />
        </Box>
        
        {/* Pied de page */}
        <Box
          component="footer"
          sx={{
            py: 3,
            px: 2,
            mt: 'auto',
            backgroundColor: (theme) =>
              theme.palette.mode === 'light' ? theme.palette.grey[200] : theme.palette.grey[800],
          }}
        >
          <Typography 
            variant="body2" 
            color="text.secondary" 
            align="center"
            fontFamily="Montserrat"
          >
            &copy; {new Date().getFullYear()} ESGIS - Tous droits réservés
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;
