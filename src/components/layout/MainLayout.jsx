import React, { useState, useEffect } from 'react';
import { getAssetPath } from '@/utils/assetUtils';
import Badge from '@mui/material/Badge';
import { Outlet, useNavigate, Link as RouterLink } from 'react-router-dom';
import notificationService from '@/services/NotificationService';
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
  Grade as GradeIcon,
  Folder as FolderIcon,
  Chat as ChatIcon,
  Book as BookIcon,
  BarChart as BarChartIcon,
  Email as EmailIcon,
  PhotoCamera as PhotoCameraIcon,
  EventNote as EventNoteIcon,
  Campaign as CampaignIcon,
  TrendingUp as TrendingUpIcon,
  SyncAlt as SyncAltIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { announcementsService } from '@/services/cmsService';
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
  const [anchorElAnnouncements, setAnchorElAnnouncements] = useState(null);
  const [anchorElQuickAccess, setAnchorElQuickAccess] = useState(null);
  
  const { authState, signOut } = useAuth();
  const { user, profile, isAdmin, isProfessor } = authState;
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadAnnouncements, setUnreadAnnouncements] = useState([]);

  /**
   * Charger les notifications réelles et annonces
   */
  useEffect(() => {
    if (!profile?.id) return;

    const loadData = async () => {
      try {
        const [{ data: notifsData }, unreadAnnData] = await Promise.all([
          notificationService.getUnread(profile.id),
          announcementsService.getUnread(profile.id)
        ]);

        if (notifsData) {
          setNotifications(notifsData);
          setUnreadCount(notifsData.length);
        }

        if (unreadAnnData) {
          setUnreadAnnouncements(unreadAnnData);
        }
      } catch (err) {
        console.error('Error loading header data:', err);
      }
    };

    loadData();

    // S'abonner aux changements temps réel des notifications
    const subscription = notificationService.subscribeRealtime(
      profile.id, 
      profile?.role, 
      (newNotif) => {
        setNotifications(prev => [newNotif, ...prev]);
        setUnreadCount(prev => prev + 1);
      }
    );

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [profile?.id, profile?.role]);

  /**
   * Marquer une notification comme lue
   */
  const handleNotificationClick = async (notifId) => {
    try {
      await notificationService.markAsRead(notifId);
      setNotifications(prev => prev.filter(n => n.id !== notifId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  /**
   * Marquer une annonce comme lue
   */
  const handleAnnouncementClick = async (annId) => {
    try {
      await announcementsService.markAsRead(annId, profile.id);
      setUnreadAnnouncements(prev => prev.filter(a => a.id !== annId));
    } catch (err) {
      console.error('Error marking announcement as read:', err);
    }
  };

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
   * Gestion du menu annonces
   * @param {React.MouseEvent} event - L'événement de clic
   */
  const handleOpenAnnouncementsMenu = (event) => {
    setAnchorElAnnouncements(event.currentTarget);
  };

  /**
   * Fermeture du menu annonces
   */
  const handleCloseAnnouncementsMenu = () => {
    setAnchorElAnnouncements(null);
  };

  /**
   * Gestion du menu accès rapide
   * @param {React.MouseEvent} event - L'événement de clic
   */
  const handleOpenQuickAccessMenu = (event) => {
    setAnchorElQuickAccess(event.currentTarget);
  };

  /**
   * Fermeture du menu accès rapide
   */
  const handleCloseQuickAccessMenu = () => {
    setAnchorElQuickAccess(null);
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
        { text: 'Étudiants & Comptes', icon: <PeopleIcon />, path: '/admin/students' },
        { text: 'Statut des Comptes', icon: <PersonIcon />, path: '/admin/account-status' },
        { text: 'Emails Autorisés', icon: <EmailIcon />, path: '/admin/allowed-emails' },
        { text: 'Structure Académique', icon: <SchoolIcon />, path: '/admin/academic-structure' },
        { text: 'Assignation de Cours', icon: <AssignmentIcon />, path: '/admin/professor-courses' },
        { text: 'Rôles Professeurs', icon: <PersonIcon />, path: '/admin/professor-roles' },
        { text: 'Paiements', icon: <GradingIcon />, path: '/admin/payments' },
        { text: 'Calendrier', icon: <CalendarMonthIcon />, path: '/admin/calendar' },
        { text: 'EDT Hebdomadaire', icon: <EventNoteIcon />, path: '/admin/weekly-schedules' },
        { text: 'Demandes (Guichet)', icon: <AssignmentIcon />, path: '/admin/validation-queue' },
        { text: 'Générateur Documents', icon: <DescriptionIcon />, path: '/admin/document-generator' },
        { text: 'Modèles Documents', icon: <DescriptionIcon />, path: '/admin/document-templates' },
        { text: 'Bibliothèque & Docs', icon: <FolderIcon />, path: '/documents' },
        { text: 'Génération bulletins', icon: <GradingIcon />, path: '/admin/bulk-bulletins' },
        { text: 'Partenaires & Stages', icon: <WorkIcon />, path: '/admin/partners' },
        { text: 'Annonces', icon: <ChatIcon />, path: '/admin/announcements' },
        { text: 'CMS éditorial', icon: <CampaignIcon />, path: '/admin/cms' },
        { text: 'Permissions CMS', icon: <SettingsIcon />, path: '/admin/cms-permissions' },
        { text: 'Intégrations LMS', icon: <SyncAltIcon />, path: '/admin/lms-bridge' },
        { text: 'Statistiques', icon: <BarChartIcon />, path: '/admin/reports' },
        { text: 'Rôles & Permissions', icon: <PersonIcon />, path: '/admin/roles' },
        { text: 'Journal d\'audit', icon: <BarChartIcon />, path: '/admin/audit-log-new' },
        { text: 'Config système', icon: <SettingsIcon />, path: '/admin/system-config' },
      ];
    } else if (isProfessor) {
      return [
        { text: 'Tableau de bord', icon: <DashboardIcon />, path: '/professor' },
        { text: 'Mes Cours', icon: <BookIcon />, path: '/professor/courses' },
        { text: 'Devoirs & Remises', icon: <AssignmentIcon />, path: '/professor/assignments' },
        { text: 'Mes Promotions', icon: <PeopleIcon />, path: '/professor/students' },
        { text: 'Emploi du temps', icon: <EventIcon />, path: '/schedule' },
        { text: 'EDT Hebdomadaire', icon: <EventNoteIcon />, path: '/professor/weekly-schedules' },
        { text: 'Présences / Appels', icon: <AssignmentIcon />, path: '/professor/attendances' },
        { text: 'Gestion des Notes', icon: <GradingIcon />, path: '/professor/grades' },
        { text: 'Corrections de Notes', icon: <BarChartIcon />, path: '/professor/grades/corrections' },
        { text: 'Examens', icon: <AssignmentIcon />, path: '/professor/exams' },
        { text: 'Banque de questions', icon: <BookIcon />, path: '/professor/question-bank' },
        { text: 'Documents', icon: <DescriptionIcon />, path: '/professor/documents' },
        { text: 'Messages', icon: <ChatIcon />, path: '/messages' },
        { text: 'Forums', icon: <ChatIcon />, path: '/forums' },
        { text: 'Mon Profil', icon: <PersonIcon />, path: '/profile' },
      ];
    } else {
      // Étudiant (par défaut)
      return [
        { text: 'Tableau de bord', icon: <DashboardIcon />, path: '/student' },
        { text: 'Mes Cours', icon: <BookIcon />, path: '/student/courses' },
        { text: 'Devoirs & Remises', icon: <AssignmentIcon />, path: '/student/assignments' },
        { text: 'Mes examens', icon: <AssignmentIcon />, path: '/student/exams' },
        { text: 'Quiz entraînement', icon: <SchoolIcon />, path: '/student/practice' },
        { text: 'Emploi du temps', icon: <CalendarMonthIcon />, path: '/student/schedule' },
        { text: 'EDT Hebdomadaire', icon: <EventNoteIcon />, path: '/student/weekly-schedules' },
        { text: 'Notes', icon: <GradingIcon />, path: '/student/grades' },
        { text: 'Parcours & Progression', icon: <TrendingUpIcon />, path: '/student/progress' },
        { text: 'Bibliothèque', icon: <BookIcon />, path: '/student/library' },
        { text: 'Documents officiels', icon: <AssignmentIcon />, path: '/student/requests' },
        { text: 'Soutenances', icon: <SchoolIcon />, path: '/student/theses' },
        { text: 'Stages & Emplois', icon: <WorkIcon />, path: '/student/internships' },
        { text: 'Documents partagés', icon: <FolderIcon />, path: '/student/documents' },
        { text: 'Messages', icon: <ChatIcon />, path: '/student/messages' },
        { text: 'Forums', icon: <ChatIcon />, path: '/forums' },
        { text: 'Mon Profil', icon: <PersonIcon />, path: '/profile' },
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
          sx={{
            backgroundColor: 'white',
            borderRadius: 2,
            px: 2,
            py: 1.25,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
            mb: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Box
            component="img"
            src={getAssetPath('images/logo-esgis-brand.png')}
            alt="Logo ESGIS"
            sx={{
              height: 48,
              display: 'block'
            }}
          />
        </Box>
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
        <Box sx={{ position: 'relative', display: 'inline-block' }}>
          <Avatar 
            alt={profile?.full_name || user?.email || 'Utilisateur'} 
            src={profile?.avatar_url}
            component={RouterLink}
            to="/profile"
            sx={{ 
              width: 64, 
              height: 64, 
              mx: 'auto', 
              mb: 1,
              bgcolor: '#CC0000', // Rouge ESGIS
              fontFamily: 'Montserrat',
              cursor: 'pointer',
              '&:hover': {
                opacity: 0.8,
                transform: 'scale(1.05)',
                transition: 'all 0.2s'
              }
            }}
          />
          <IconButton
            component={RouterLink}
            to="/profile"
            size="small"
            sx={{
              position: 'absolute',
              bottom: 8,
              right: -4,
              bgcolor: 'white',
              boxShadow: 2,
              '&:hover': { bgcolor: '#f5f5f5' }
            }}
          >
            <PhotoCameraIcon sx={{ fontSize: 16, color: '#003366' }} />
          </IconButton>
        </Box>
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
          
          {/* Menu notifications, annonces & accès rapide */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* Accès Rapide (TrendingUp) */}
            {!isAdmin && (
              <>
                <IconButton 
                  size="large" 
                  color="inherit"
                  onClick={handleOpenQuickAccessMenu}
                  sx={{ mr: 1 }}
                  title="Accès Rapide"
                >
                  <TrendingUpIcon />
                </IconButton>
                <Menu
                  anchorEl={anchorElQuickAccess}
                  open={Boolean(anchorElQuickAccess)}
                  onClose={handleCloseQuickAccessMenu}
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
                  <Box sx={{ p: 1, minWidth: 200 }}>
                    <Typography variant="subtitle2" fontWeight="bold" fontFamily="Montserrat" sx={{ px: 2, py: 1 }}>
                      Accès Rapide
                    </Typography>
                    <Divider sx={{ mb: 1 }} />
                    {(isProfessor ? [
                      { label: 'EDT Hebdomadaire', icon: <EventNoteIcon fontSize="small" />, path: '/professor/weekly-schedules' },
                      { label: 'Devoirs & remises', icon: <AssignmentIcon fontSize="small" />, path: '/professor/assignments' },
                      { label: 'Gestion des notes', icon: <GradingIcon fontSize="small" />, path: '/professor/grades' },
                      { label: 'Banque de questions', icon: <SchoolIcon fontSize="small" />, path: '/professor/question-bank' },
                      { label: 'Mes examens', icon: <AssignmentIcon fontSize="small" />, path: '/professor/exams' }
                    ] : [
                      { label: 'EDT Hebdomadaire', icon: <EventNoteIcon fontSize="small" />, path: '/student/weekly-schedules' },
                      { label: 'Mes devoirs', icon: <AssignmentIcon fontSize="small" />, path: '/student/assignments' },
                      { label: 'Mes notes', icon: <GradeIcon fontSize="small" />, path: '/student/grades' },
                      { label: 'Ma progression', icon: <TrendingUpIcon fontSize="small" />, path: '/student/progress' },
                      { label: 'Mes examens', icon: <SchoolIcon fontSize="small" />, path: '/student/exams' },
                      { label: 'Mes démarches', icon: <AssignmentIcon fontSize="small" />, path: '/student/requests' }
                    ]).map((item) => (
                      <MenuItem 
                        key={item.path} 
                        component={RouterLink} 
                        to={item.path} 
                        onClick={handleCloseQuickAccessMenu}
                        sx={{ py: 1 }}
                      >
                        <ListItemIcon sx={{ minWidth: '36px !important' }}>
                          {item.icon}
                        </ListItemIcon>
                        <Typography variant="body2" fontFamily="Montserrat">
                          {item.label}
                        </Typography>
                      </MenuItem>
                    ))}
                  </Box>
                </Menu>
              </>
            )}

            {/* Icône Annonces (Campaign) */}
            <IconButton 
              size="large" 
              color="inherit"
              onClick={handleOpenAnnouncementsMenu}
              sx={{ mr: 1 }}
            >
              <Badge badgeContent={unreadAnnouncements.length} color="error">
                <CampaignIcon />
              </Badge>
            </IconButton>
            <Menu
              anchorEl={anchorElAnnouncements}
              open={Boolean(anchorElAnnouncements)}
              onClose={handleCloseAnnouncementsMenu}
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
              <Box sx={{ p: 2, minWidth: 280, maxWidth: 400 }}>
                <Typography variant="subtitle2" fontWeight="bold" fontFamily="Montserrat" gutterBottom>
                  Annonces Non Lues
                </Typography>
                <Divider sx={{ mb: 1 }} />
                {unreadAnnouncements.length > 0 ? (
                  unreadAnnouncements.map((ann) => (
                    <Box 
                      key={ann.id} 
                      onClick={() => handleAnnouncementClick(ann.id)}
                      sx={{ 
                        mb: 1.5, 
                        pb: 1, 
                        borderBottom: '1px solid #f0f0f0', 
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' }
                      }}
                    >
                      <Typography variant="body2" fontWeight="bold" fontFamily="Montserrat" color="primary">
                        {ann.title}
                      </Typography>
                      <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                        {ann.content}
                      </Typography>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                    Aucune nouvelle annonce
                  </Typography>
                )}
              </Box>
            </Menu>

            {/* Icône Notifications */}
            <IconButton 
              size="large" 
              color="inherit"
              onClick={handleOpenNotificationsMenu}
            >
              <Badge badgeContent={unreadCount} color="error">
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
              <Box sx={{ p: 1, minWidth: 250, maxWidth: 350 }}>
                <Typography variant="subtitle2" fontWeight="bold" fontFamily="Montserrat" sx={{ px: 2, py: 1 }}>
                  Notifications ({unreadCount})
                </Typography>
                <Divider />
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <MenuItem 
                      key={notif.id} 
                      onClick={() => {
                        handleNotificationClick(notif.id);
                        handleCloseNotificationsMenu();
                        navigate('/notifications');
                      }}
                      sx={{ py: 1.5, borderBottom: '1px solid #f5f5f5', whiteSpace: 'normal' }}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight="bold" fontFamily="Montserrat">
                          {notif.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                          {notif.content?.substring(0, 60)}{notif.content?.length > 60 ? '...' : ''}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem onClick={handleCloseNotificationsMenu}>
                    <Typography variant="body2" color="text.secondary" fontFamily="Montserrat">
                      Aucune notification
                    </Typography>
                  </MenuItem>
                )}
                <Divider />
                <MenuItem component={RouterLink} to="/notifications" onClick={handleCloseNotificationsMenu}>
                  <Typography variant="body2" textAlign="center" fontFamily="Montserrat" color="primary" sx={{ width: '100%' }}>Voir tout l'historique</Typography>
                </MenuItem>
              </Box>
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
                  <PersonIcon fontSize="small" color="primary" />
                </ListItemIcon>
                <Typography textAlign="center" fontFamily="Montserrat">Mon Profil</Typography>
              </MenuItem>
              <MenuItem component={RouterLink} to="/profile" onClick={handleCloseUserMenu}>
                <ListItemIcon>
                  <PhotoCameraIcon fontSize="small" color="primary" />
                </ListItemIcon>
                <Typography textAlign="center" fontFamily="Montserrat">Changer ma photo</Typography>
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
          id="main-footer"
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
