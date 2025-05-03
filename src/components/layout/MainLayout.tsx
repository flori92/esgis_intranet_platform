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
} from '@mui/icons-material';
import { useAuth, AuthContextType } from '../../context/AuthContext';

// Largeur du drawer
const drawerWidth = 240;

/**
 * Layout principal pour les pages authentifiées
 * Inclut une barre de navigation supérieure, un menu latéral et un pied de page
 */
const MainLayout: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const [anchorElNotifications, setAnchorElNotifications] = useState<null | HTMLElement>(null);
  
  const { authState, signOut } = useAuth() as AuthContextType;
  const { user, profile, isAdmin, isProfessor } = authState;
  const navigate = useNavigate();

  // Gestion du menu utilisateur
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  // Gestion du menu notifications
  const handleOpenNotificationsMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNotifications(event.currentTarget);
  };

  const handleCloseNotificationsMenu = () => {
    setAnchorElNotifications(null);
  };

  // Gestion du drawer mobile
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Déconnexion
  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  // Définition des éléments de menu selon le rôle
  const getMenuItems = () => {
    if (isAdmin) {
      return [
        { text: 'Tableau de bord', icon: <DashboardIcon />, path: '/admin/dashboard' },
        { text: 'Utilisateurs', icon: <PeopleIcon />, path: '/admin/users' },
        { text: 'Filières', icon: <SchoolIcon />, path: '/admin/departments' },
        { text: 'Cours', icon: <SchoolIcon />, path: '/admin/courses' },
        { text: 'Emplois du temps', icon: <EventIcon />, path: '/admin/schedule' },
        { text: 'Documents', icon: <DescriptionIcon />, path: '/admin/documents' },
        { text: 'Stages', icon: <WorkIcon />, path: '/admin/internships' },
        { text: 'Paiements', icon: <AssignmentIcon />, path: '/admin/payments' },
        { text: 'Rapports', icon: <DescriptionIcon />, path: '/admin/reports' },
      ];
    } else if (isProfessor) {
      return [
        { text: 'Tableau de bord', icon: <DashboardIcon />, path: '/professor/dashboard' },
        { text: 'Emploi du temps', icon: <EventIcon />, path: '/professor/schedule' },
        { text: 'Mes cours', icon: <SchoolIcon />, path: '/professor/courses' },
        { text: 'Notes', icon: <AssignmentIcon />, path: '/professor/grades' },
        { text: 'Examens', icon: <AssignmentIcon />, path: '/professor/exams' },
        { text: 'Étudiants', icon: <PeopleIcon />, path: '/professor/students' },
        { text: 'Documents', icon: <DescriptionIcon />, path: '/professor/documents' },
      ];
    } else {
      return [
        { text: 'Tableau de bord', icon: <DashboardIcon />, path: '/student/dashboard' },
        { text: 'Emploi du temps', icon: <EventIcon />, path: '/student/schedule' },
        { text: 'Cours', icon: <SchoolIcon />, path: '/student/courses' },
        { text: 'Notes', icon: <AssignmentIcon />, path: '/student/grades' },
        { text: 'Examens', icon: <AssignmentIcon />, path: '/student/exams' },
        { text: 'Documents', icon: <DescriptionIcon />, path: '/student/documents' },
        { text: 'Stages', icon: <WorkIcon />, path: '/student/internships' },
      ];
    }
  };

  // Contenu du drawer
  const drawer = (
    <Box>
      <Toolbar
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: [1],
          py: 1,
          bgcolor: '#003366', // Bleu ESGIS
          color: 'white',
        }}
      >
        <Typography variant="h6" noWrap component="div" fontWeight="bold" fontFamily="Montserrat">
          INTRANET ESGIS
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {getMenuItems().map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              component={RouterLink}
              to={item.path}
              onClick={() => isMobile && setMobileOpen(false)}
              sx={{
                '&:hover': {
                  bgcolor: 'rgba(0, 51, 102, 0.08)', // Bleu ESGIS très clair
                },
                '&.Mui-selected': {
                  bgcolor: 'rgba(0, 51, 102, 0.12)', // Bleu ESGIS clair
                  '&:hover': {
                    bgcolor: 'rgba(0, 51, 102, 0.18)', // Bleu ESGIS un peu plus foncé
                  },
                },
              }}
            >
              <ListItemIcon sx={{ color: '#003366' }}>{item.icon}</ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{ 
                  fontFamily: 'Montserrat',
                  fontWeight: 500
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
        <ListItemButton
          component={RouterLink}
          to="/schedule"
          onClick={() => isMobile && setMobileOpen(false)}
          sx={{
            '&:hover': {
              bgcolor: 'rgba(0, 51, 102, 0.08)', // Bleu ESGIS très clair
            },
            '&.Mui-selected': {
              bgcolor: 'rgba(0, 51, 102, 0.12)', // Bleu ESGIS clair
              '&:hover': {
                bgcolor: 'rgba(0, 51, 102, 0.18)', // Bleu ESGIS un peu plus foncé
              },
            },
          }}
        >
          <ListItemIcon sx={{ color: '#003366' }}>
            <CalendarMonthIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Emploi du temps" 
            primaryTypographyProps={{ 
              fontFamily: 'Montserrat',
              fontWeight: 500
            }}
          />
        </ListItemButton>
        <ListItemButton
          component={RouterLink}
          to="/grades"
          onClick={() => isMobile && setMobileOpen(false)}
          sx={{
            '&:hover': {
              bgcolor: 'rgba(0, 51, 102, 0.08)', // Bleu ESGIS très clair
            },
            '&.Mui-selected': {
              bgcolor: 'rgba(0, 51, 102, 0.12)', // Bleu ESGIS clair
              '&:hover': {
                bgcolor: 'rgba(0, 51, 102, 0.18)', // Bleu ESGIS un peu plus foncé
              },
            },
          }}
        >
          <ListItemIcon sx={{ color: '#003366' }}>
            <GradingIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Notes" 
            primaryTypographyProps={{ 
              fontFamily: 'Montserrat',
              fontWeight: 500
            }}
          />
        </ListItemButton>
        <ListItemButton
          component={RouterLink}
          to="/documents"
          onClick={() => isMobile && setMobileOpen(false)}
          sx={{
            '&:hover': {
              bgcolor: 'rgba(0, 51, 102, 0.08)', // Bleu ESGIS très clair
            },
            '&.Mui-selected': {
              bgcolor: 'rgba(0, 51, 102, 0.12)', // Bleu ESGIS clair
              '&:hover': {
                bgcolor: 'rgba(0, 51, 102, 0.18)', // Bleu ESGIS un peu plus foncé
              },
            },
          }}
        >
          <ListItemIcon sx={{ color: '#003366' }}>
            <FolderIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Documents" 
            primaryTypographyProps={{ 
              fontFamily: 'Montserrat',
              fontWeight: 500
            }}
          />
        </ListItemButton>
        <ListItemButton
          component={RouterLink}
          to="/messages"
          onClick={() => isMobile && setMobileOpen(false)}
          sx={{
            '&:hover': {
              bgcolor: 'rgba(0, 51, 102, 0.08)', // Bleu ESGIS très clair
            },
            '&.Mui-selected': {
              bgcolor: 'rgba(0, 51, 102, 0.12)', // Bleu ESGIS clair
              '&:hover': {
                bgcolor: 'rgba(0, 51, 102, 0.18)', // Bleu ESGIS un peu plus foncé
              },
            },
          }}
        >
          <ListItemIcon sx={{ color: '#003366' }}>
            <ChatIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Messages" 
            primaryTypographyProps={{ 
              fontFamily: 'Montserrat',
              fontWeight: 500
            }}
          />
        </ListItemButton>
        <ListItemButton
          component={RouterLink}
          to="/notifications"
          onClick={() => isMobile && setMobileOpen(false)}
          sx={{
            '&:hover': {
              bgcolor: 'rgba(0, 51, 102, 0.08)', // Bleu ESGIS très clair
            },
            '&.Mui-selected': {
              bgcolor: 'rgba(0, 51, 102, 0.12)', // Bleu ESGIS clair
              '&:hover': {
                bgcolor: 'rgba(0, 51, 102, 0.18)', // Bleu ESGIS un peu plus foncé
              },
            },
          }}
        >
          <ListItemIcon sx={{ color: '#003366' }}>
            <NotificationsIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Notifications" 
            primaryTypographyProps={{ 
              fontFamily: 'Montserrat',
              fontWeight: 500
            }}
          />
        </ListItemButton>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* Barre de navigation supérieure */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: '#003366', // Bleu ESGIS
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          {/* Logo et titre */}
          <Box
            component="img"
            src="/logo-esgis-white.png"
            alt="Logo ESGIS"
            sx={{
              height: 40,
              mr: 1,
              display: { xs: 'none', sm: 'block' },
            }}
          />
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ 
              flexGrow: 1, 
              display: { xs: 'none', sm: 'block' },
              fontFamily: 'Montserrat',
              fontWeight: 700
            }}
          >
            INTRANET ESGIS
          </Typography>
          
          {/* Notifications */}
          <IconButton color="inherit" onClick={handleOpenNotificationsMenu}>
            <Badge badgeContent={3} color="error" sx={{ '& .MuiBadge-badge': { bgcolor: '#CC0000' } }}>
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
            <MenuItem onClick={handleCloseNotificationsMenu}>
              <Typography textAlign="center" fontFamily="Montserrat">Notification 1</Typography>
            </MenuItem>
            <MenuItem onClick={handleCloseNotificationsMenu}>
              <Typography textAlign="center" fontFamily="Montserrat">Notification 2</Typography>
            </MenuItem>
            <MenuItem onClick={handleCloseNotificationsMenu}>
              <Typography textAlign="center" fontFamily="Montserrat">Notification 3</Typography>
            </MenuItem>
          </Menu>
          
          {/* Menu utilisateur */}
          <Box sx={{ ml: 1 }}>
            <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
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
