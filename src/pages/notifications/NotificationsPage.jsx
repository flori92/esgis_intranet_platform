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
import { useAuth } from '../../context/AuthContext';

// Correction du chemin d'importation de Supabase
import { supabase } from '@/supabase';

/**
 * @typedef {Object} Notification
 * @property {number} id - Identifiant de la notification
 * @property {string} user_id - Identifiant de l'utilisateur
 * @property {string} title - Titre de la notification
 * @property {string} message - Message de la notification
 * @property {'info'|'warning'|'error'|'success'} type - Type de notification
 * @property {'course'|'exam'|'event'|'message'|'system'|'other'} related_to - Catégorie liée
 * @property {number|null} related_id - Identifiant de l'élément lié
 * @property {string} created_at - Date de création
 * @property {boolean} read - Statut de lecture
 */

/**
 * Page de gestion des notifications
 * @returns {JSX.Element} Composant de la page des notifications
 */
const NotificationsPage = () => {
  const { authState } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);

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

    /**
     * Fonction pour récupérer la liste des notifications
     */
    const fetchNotificationsList = async () => {
      try {
        // Récupérer les notifications de l'utilisateur
        const { data: notificationsData, error: notificationsError } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', authState.user?.id)
          .order('created_at', { ascending: false });

        if (notificationsError) {
          throw notificationsError;
        }

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

  /**
   * Gérer le changement d'onglet
   * @param {React.SyntheticEvent} _event - Événement de changement d'onglet
   * @param {number} newValue - Nouvel index d'onglet
   */
  const handleTabChange = (_event, newValue) => {
    setTabValue(newValue);
  };

  /**
   * Marquer une notification comme lue
   * @param {Notification} notification - Notification à marquer comme lue
   */
  const handleMarkAsRead = async (notification) => {
    try {
      // Mettre à jour la notification dans la base de données
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notification.id);

      if (updateError) {
        throw updateError;
      }

      // Mettre à jour l'état local
      setNotifications(
        notifications.map((n) =>
          n.id === notification.id ? { ...n, read: true } : n
        )
      );
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la notification:', error);
      setError('Erreur lors de la mise à jour de la notification. Veuillez réessayer.');
    }
  };

  /**
   * Marquer toutes les notifications comme lues
   */
  const handleMarkAllAsRead = async () => {
    try {
      // Mettre à jour toutes les notifications non lues dans la base de données
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', authState.user?.id)
        .eq('read', false);

      if (updateError) {
        throw updateError;
      }

      // Mettre à jour l'état local
      setNotifications(
        notifications.map((n) => ({ ...n, read: true }))
      );
    } catch (error) {
      console.error('Erreur lors de la mise à jour des notifications:', error);
      setError('Erreur lors de la mise à jour des notifications. Veuillez réessayer.');
    }
  };

  /**
   * Supprimer une notification
   * @param {Notification} notification - Notification à supprimer
   */
  const handleDeleteNotification = async (notification) => {
    try {
      // Supprimer la notification de la base de données
      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notification.id);

      if (deleteError) {
        throw deleteError;
      }

      // Mettre à jour l'état local
      setNotifications(notifications.filter((n) => n.id !== notification.id));
      handleCloseMenu();
    } catch (error) {
      console.error('Erreur lors de la suppression de la notification:', error);
      setError('Erreur lors de la suppression de la notification. Veuillez réessayer.');
    }
  };

  /**
   * Supprimer toutes les notifications lues
   */
  const handleDeleteAllRead = async () => {
    try {
      // Supprimer toutes les notifications lues de la base de données
      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', authState.user?.id)
        .eq('read', true);

      if (deleteError) {
        throw deleteError;
      }

      // Mettre à jour l'état local
      setNotifications(notifications.filter((n) => !n.read));
    } catch (error) {
      console.error('Erreur lors de la suppression des notifications:', error);
      setError('Erreur lors de la suppression des notifications. Veuillez réessayer.');
    }
  };

  /**
   * Ouvrir le menu
   * @param {React.MouseEvent<HTMLElement>} event - Événement de clic
   * @param {Notification} notification - Notification sélectionnée
   */
  const handleOpenMenu = (event, notification) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedNotification(notification);
  };

  /**
   * Fermer le menu
   */
  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
    setSelectedNotification(null);
  };

  /**
   * Obtenir l'icône en fonction du type de notification
   * @param {string} type - Type de notification
   * @param {string} relatedTo - Catégorie liée
   * @returns {JSX.Element} Icône correspondante
   */
  const getNotificationIcon = (type, relatedTo) => {
    // D'abord vérifier le type de relation
    if (relatedTo === 'course') {
      return <SchoolIcon />;
    } else if (relatedTo === 'exam') {
      return <AssignmentIcon />;
    } else if (relatedTo === 'event') {
      return <EventIcon />;
    } else if (relatedTo === 'message') {
      return <EmailIcon />;
    } else if (relatedTo === 'system') {
      return <AnnouncementIcon />;
    }

    // Sinon, utiliser l'icône basée sur le type
    if (type === 'info') {
      return <InfoIcon />;
    } else if (type === 'warning') {
      return <WarningIcon />;
    } else if (type === 'error') {
      return <ErrorIcon />;
    }

    return <NotificationsIcon />;
  };

  /**
   * Obtenir la couleur en fonction du type de notification
   * @param {string} type - Type de notification
   * @returns {string} Couleur correspondante
   */
  const getNotificationColor = (type) => {
    if (type === 'info') {
      return 'primary.main';
    } else if (type === 'warning') {
      return 'warning.main';
    } else if (type === 'error') {
      return 'error.main';
    } else if (type === 'success') {
      return 'success.main';
    }

    return 'primary.main';
  };

  /**
   * Formater la date
   * @param {string} dateString - Date au format ISO
   * @returns {string} Date formatée
   */
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);

    if (diffSec < 60) {
      return 'il y a quelques secondes';
    } else if (diffMin < 60) {
      return `il y a ${diffMin} minute${diffMin > 1 ? 's' : ''}`;
    } else if (diffHour < 24) {
      return `il y a ${diffHour} heure${diffHour > 1 ? 's' : ''}`;
    } else if (diffDay < 7) {
      return `il y a ${diffDay} jour${diffDay > 1 ? 's' : ''}`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  // Filtrer les notifications en fonction de l'onglet sélectionné
  const filteredNotifications = tabValue === 0
    ? notifications
    : tabValue === 1
      ? notifications.filter((n) => !n.read)
      : notifications.filter((n) => n.read);

  // Compter les notifications non lues
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Notifications
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Actions */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Box>
              <Badge badgeContent={unreadCount} color="primary" sx={{ mr: 2 }}>
                <Chip
                  icon={<NotificationsIcon />}
                  label={`${notifications.length} notification${notifications.length > 1 ? 's' : ''}`}
                  color="primary"
                  variant="outlined"
                />
              </Badge>
            </Box>
            <Box>
              {unreadCount > 0 && (
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  onClick={handleMarkAllAsRead}
                  sx={{ mr: 1 }}
                >
                  Tout marquer comme lu
                </Button>
              )}
              {notifications.some((n) => n.read) && (
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={handleDeleteAllRead}
                >
                  Supprimer les notifications lues
                </Button>
              )}
            </Box>
          </Box>

          {/* Onglets */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="Toutes" />
              <Tab
                label={
                  <Badge badgeContent={unreadCount} color="primary">
                    <Box sx={{ pr: unreadCount ? 2 : 0 }}>Non lues</Box>
                  </Badge>
                }
              />
              <Tab label="Lues" />
            </Tabs>
          </Box>

          {/* Liste des notifications */}
          <Paper elevation={1}>
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
              if (selectedNotification) {
                handleDeleteNotification(selectedNotification);
              }
            }}>
              <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
              Supprimer
            </MenuItem>
          </Menu>
        </>
      )}
    </Box>
  );
};

export default NotificationsPage;
