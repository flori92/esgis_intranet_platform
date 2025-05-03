import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Avatar,
  IconButton,
  Divider,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Menu,
  MenuItem,
  Badge,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  School as SchoolIcon,
  Event as EventIcon,
  Assignment as AssignmentIcon,
  Email as EmailIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Check as CheckIcon,
  Announcement as AnnouncementIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useAuth, AuthContextType } from '../../context/AuthContext';
import supabase from '../../services/supabase';

// Types pour les notifications
interface Notification {
  id: number;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  related_to: 'course' | 'exam' | 'event' | 'message' | 'system' | 'other';
  related_id: number | null;
  created_at: string;
  read: boolean;
}

const NotificationsPage: React.FC = () => {
  const { authState } = useAuth() as AuthContextType;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  // Charger les notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        if (!authState.user) {
          throw new Error('Utilisateur non connecté');
        }

        // Abonnement aux nouvelles notifications
        const notificationsSubscription = supabase
          .channel('notifications')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${authState.user.id}`,
            },
            () => {
              fetchNotificationsList();
            }
          )
          .subscribe();

        // Récupérer la liste des notifications
        fetchNotificationsList();

        // Nettoyage de l'abonnement
        return () => {
          supabase.removeChannel(notificationsSubscription);
        };
      } catch (error) {
        console.error('Erreur lors du chargement des notifications:', error);
        setError('Erreur lors du chargement des notifications. Veuillez réessayer.');
        setLoading(false);
      }
    };

    // Fonction pour récupérer la liste des notifications
    const fetchNotificationsList = async () => {
      try {
        // Récupérer les notifications de l'utilisateur
        const { data: notificationsData, error: notificationsError } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', authState.user?.id)
          .order('created_at', { ascending: false });

        if (notificationsError) throw notificationsError;

        if (notificationsData) {
          setNotifications(notificationsData);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des notifications:', error);
        setError('Erreur lors du chargement des notifications. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [authState]);

  // Gérer le changement d'onglet
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Marquer une notification comme lue
  const handleMarkAsRead = async (notification: Notification) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notification.id);

      if (error) throw error;

      // Mettre à jour l'état local
      setNotifications(
        notifications.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la notification:', error);
      alert('Erreur lors de la mise à jour de la notification. Veuillez réessayer.');
    }
  };

  // Marquer toutes les notifications comme lues
  const handleMarkAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', authState.user?.id)
        .eq('read', false);

      if (error) throw error;

      // Mettre à jour l'état local
      setNotifications(notifications.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error('Erreur lors de la mise à jour des notifications:', error);
      alert('Erreur lors de la mise à jour des notifications. Veuillez réessayer.');
    }
  };

  // Supprimer une notification
  const handleDeleteNotification = async (notification: Notification) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notification.id);

      if (error) throw error;

      // Mettre à jour l'état local
      setNotifications(notifications.filter((n) => n.id !== notification.id));
      handleCloseMenu();
    } catch (error) {
      console.error('Erreur lors de la suppression de la notification:', error);
      alert('Erreur lors de la suppression de la notification. Veuillez réessayer.');
      handleCloseMenu();
    }
  };

  // Supprimer toutes les notifications lues
  const handleDeleteAllRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', authState.user?.id)
        .eq('read', true);

      if (error) throw error;

      // Mettre à jour l'état local
      setNotifications(notifications.filter((n) => !n.read));
    } catch (error) {
      console.error('Erreur lors de la suppression des notifications:', error);
      alert('Erreur lors de la suppression des notifications. Veuillez réessayer.');
    }
  };

  // Ouvrir le menu
  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, notification: Notification) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedNotification(notification);
  };

  // Fermer le menu
  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
    setSelectedNotification(null);
  };

  // Obtenir l'icône en fonction du type de notification
  const getNotificationIcon = (type: string, relatedTo: string) => {
    if (relatedTo === 'course') return <SchoolIcon />;
    if (relatedTo === 'exam') return <AssignmentIcon />;
    if (relatedTo === 'event') return <EventIcon />;
    if (relatedTo === 'message') return <EmailIcon />;

    // Par défaut, utiliser l'icône en fonction du type
    switch (type) {
      case 'info':
        return <InfoIcon color="info" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'success':
        return <CheckIcon color="success" />;
      default:
        return <NotificationsIcon />;
    }
  };

  // Obtenir la couleur en fonction du type de notification
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'info':
        return '#2196F3'; // Bleu
      case 'warning':
        return '#FF9800'; // Orange
      case 'error':
        return '#F44336'; // Rouge
      case 'success':
        return '#4CAF50'; // Vert
      default:
        return '#2196F3'; // Bleu par défaut
    }
  };

  // Formater la date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) {
      return 'À l\'instant';
    } else if (diffInMinutes < 60) {
      return `Il y a ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
    } else if (diffInHours < 24) {
      return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
    } else if (diffInDays < 7) {
      return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }
  };

  // Filtrer les notifications en fonction de l'onglet sélectionné
  const filteredNotifications = notifications.filter((notification) => {
    if (tabValue === 0) return true; // Toutes les notifications
    if (tabValue === 1) return !notification.read; // Non lues
    if (tabValue === 2) return notification.read; // Lues
    return true;
  });

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
        Notifications
      </Typography>

      <Paper elevation={3} sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ flexGrow: 1 }}
          >
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body1">Toutes</Typography>
                  <Chip
                    label={notifications.length}
                    size="small"
                    sx={{ ml: 1, height: 20, fontSize: '0.75rem' }}
                  />
                </Box>
              }
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body1">Non lues</Typography>
                  <Badge
                    badgeContent={notifications.filter((n) => !n.read).length}
                    color="primary"
                    sx={{ ml: 1 }}
                  />
                </Box>
              }
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body1">Lues</Typography>
                  <Chip
                    label={notifications.filter((n) => n.read).length}
                    size="small"
                    sx={{ ml: 1, height: 20, fontSize: '0.75rem' }}
                  />
                </Box>
              }
            />
          </Tabs>
          <Box sx={{ display: 'flex', p: 1 }}>
            <Button
              variant="text"
              color="primary"
              onClick={handleMarkAllAsRead}
              disabled={!notifications.some((n) => !n.read)}
              sx={{ mr: 1 }}
            >
              Tout marquer comme lu
            </Button>
            <Button
              variant="text"
              color="error"
              onClick={handleDeleteAllRead}
              disabled={!notifications.some((n) => n.read)}
            >
              Supprimer les lues
            </Button>
          </Box>
        </Box>

        <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  alignItems="flex-start"
                  sx={{
                    bgcolor: notification.read ? 'inherit' : 'rgba(33, 150, 243, 0.05)',
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.04)',
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor: getNotificationColor(notification.type),
                      }}
                    >
                      {getNotificationIcon(notification.type, notification.related_to)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: notification.read ? 'normal' : 'bold',
                        }}
                      >
                        {notification.title}
                      </Typography>
                    }
                    secondary={
                      <React.Fragment>
                        <Typography
                          variant="body2"
                          color="text.primary"
                          sx={{
                            display: 'inline',
                            fontWeight: notification.read ? 'normal' : 'medium',
                          }}
                        >
                          {notification.message}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block', mt: 0.5 }}
                        >
                          {formatDate(notification.created_at)}
                        </Typography>
                      </React.Fragment>
                    }
                  />
                  <ListItemSecondaryAction>
                    {!notification.read && (
                      <IconButton
                        edge="end"
                        aria-label="marquer comme lu"
                        onClick={() => handleMarkAsRead(notification)}
                        sx={{ mr: 1 }}
                      >
                        <CheckIcon />
                      </IconButton>
                    )}
                    <IconButton
                      edge="end"
                      aria-label="plus d'options"
                      onClick={(event) => handleOpenMenu(event, notification)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < filteredNotifications.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))
          ) : (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1">Aucune notification</Typography>
            </Box>
          )}
        </List>
      </Paper>

      {/* Menu contextuel */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleCloseMenu}
      >
        {selectedNotification && !selectedNotification.read && (
          <MenuItem onClick={() => {
            handleMarkAsRead(selectedNotification);
            handleCloseMenu();
          }}>
            <CheckIcon fontSize="small" sx={{ mr: 1 }} />
            Marquer comme lu
          </MenuItem>
        )}
        <MenuItem onClick={() => {
          if (selectedNotification) handleDeleteNotification(selectedNotification);
        }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Supprimer
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default NotificationsPage;
