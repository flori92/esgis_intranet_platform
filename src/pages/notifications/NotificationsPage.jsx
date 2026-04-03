import React, { useEffect, useMemo, useState } from 'react';
import Badge from '@mui/material/Badge';
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
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import {
  deleteNotification,
  deleteReadNotifications,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  subscribeToNotifications
} from '@/api/notifications';

const NotificationsPage = () => {
  const { authState } = useAuth();
  const currentProfileId = authState.profile?.id || authState.user?.id || '';
  const currentRole = authState.profile?.role || authState.user?.role || null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);

  const loadNotifications = async () => {
    if (!currentProfileId) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error: notificationsError } = await getNotifications(currentProfileId, currentRole);
      if (notificationsError) throw notificationsError;
      setNotifications(data || []);
    } catch (fetchError) {
      console.error('Erreur lors du chargement des notifications:', fetchError);
      setError('Erreur lors du chargement des notifications. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setError(null);
    loadNotifications();

    const subscription = subscribeToNotifications(currentProfileId, () => {
      loadNotifications();
    });

    return () => {
      subscription?.unsubscribe?.();
    };
  }, [currentProfileId, currentRole]);

  const handleTabChange = (_event, newValue) => {
    setTabValue(newValue);
  };

  const handleMarkAsRead = async (notification) => {
    try {
      const { error: updateError } = await markNotificationAsRead(notification.id);
      if (updateError) throw updateError;

      setNotifications((previous) =>
        previous.map((item) =>
          item.id === notification.id ? { ...item, read: true } : item
        )
      );
    } catch (updateError) {
      console.error('Erreur lors de la mise à jour de la notification:', updateError);
      setError('Erreur lors de la mise à jour de la notification. Veuillez réessayer.');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const { error: updateError } = await markAllNotificationsAsRead(currentProfileId, currentRole);
      if (updateError) throw updateError;

      setNotifications((previous) => previous.map((item) => ({ ...item, read: true })));
    } catch (updateError) {
      console.error('Erreur lors de la mise à jour des notifications:', updateError);
      setError('Erreur lors de la mise à jour des notifications. Veuillez réessayer.');
    }
  };

  const handleDeleteNotification = async (notification) => {
    try {
      const { error: deleteError } = await deleteNotification(notification.id);
      if (deleteError) throw deleteError;

      setNotifications((previous) => previous.filter((item) => item.id !== notification.id));
      handleCloseMenu();
    } catch (deleteError) {
      console.error('Erreur lors de la suppression de la notification:', deleteError);
      setError('Erreur lors de la suppression de la notification. Veuillez réessayer.');
    }
  };

  const handleDeleteAllRead = async () => {
    try {
      const { error: deleteError } = await deleteReadNotifications(currentProfileId, currentRole);
      if (deleteError) throw deleteError;

      setNotifications((previous) => previous.filter((item) => !item.read));
    } catch (deleteError) {
      console.error('Erreur lors de la suppression des notifications:', deleteError);
      setError('Erreur lors de la suppression des notifications. Veuillez réessayer.');
    }
  };

  const handleOpenMenu = (event, notification) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedNotification(notification);
  };

  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
    setSelectedNotification(null);
  };

  const inferNotificationCategory = (notification) => {
    const text = `${notification.title || ''} ${notification.content || ''}`.toLowerCase();

    if (text.includes('message')) return 'message';
    if (text.includes('cours')) return 'course';
    if (text.includes('examen') || text.includes('note')) return 'exam';
    if (text.includes('événement') || text.includes('evenement') || text.includes('planning')) return 'event';
    if (text.includes('annonce')) return 'system';
    return 'other';
  };

  const getNotificationIcon = (notification) => {
    const category = inferNotificationCategory(notification);

    if (category === 'course') return <SchoolIcon />;
    if (category === 'exam') return <AssignmentIcon />;
    if (category === 'event') return <EventIcon />;
    if (category === 'message') return <EmailIcon />;
    if (category === 'system') return <AnnouncementIcon />;

    if (notification.priority === 'high') return <ErrorIcon />;
    if (notification.priority === 'medium') return <WarningIcon />;
    return <InfoIcon />;
  };

  const getNotificationColor = (notification) => {
    if (notification.priority === 'high') return 'error.main';
    if (notification.priority === 'medium') return 'warning.main';
    if (notification.priority === 'low') return 'info.main';
    return 'primary.main';
  };

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
    }
    if (diffMin < 60) {
      return `il y a ${diffMin} minute${diffMin > 1 ? 's' : ''}`;
    }
    if (diffHour < 24) {
      return `il y a ${diffHour} heure${diffHour > 1 ? 's' : ''}`;
    }
    if (diffDay < 7) {
      return `il y a ${diffDay} jour${diffDay > 1 ? 's' : ''}`;
    }

    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredNotifications = useMemo(() => {
    if (tabValue === 1) {
      return notifications.filter((item) => !item.read);
    }
    if (tabValue === 2) {
      return notifications.filter((item) => item.read);
    }
    return notifications;
  }, [notifications, tabValue]);

  const unreadCount = notifications.filter((item) => !item.read).length;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Notifications
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, gap: 1, flexWrap: 'wrap' }}>
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
              {notifications.some((item) => item.read) && (
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
                            bgcolor: getNotificationColor(notification),
                          }}
                        >
                          {getNotificationIcon(notification)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={(
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: notification.read ? 'normal' : 'bold' }}
                          >
                            {notification.title}
                          </Typography>
                        )}
                        secondary={(
                          <>
                            <Typography
                              variant="body2"
                              color="text.primary"
                              sx={{
                                display: 'inline',
                                fontWeight: notification.read ? 'normal' : 'medium',
                              }}
                            >
                              {notification.content}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: 'block', mt: 0.5 }}
                            >
                              {formatDate(notification.created_at)}
                            </Typography>
                          </>
                        )}
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

          <Menu
            anchorEl={menuAnchorEl}
            open={Boolean(menuAnchorEl)}
            onClose={handleCloseMenu}
          >
            {selectedNotification && !selectedNotification.read && (
              <MenuItem
                onClick={() => {
                  handleMarkAsRead(selectedNotification);
                  handleCloseMenu();
                }}
              >
                <CheckIcon fontSize="small" sx={{ mr: 1 }} />
                Marquer comme lu
              </MenuItem>
            )}
            <MenuItem
              onClick={() => {
                if (selectedNotification) {
                  handleDeleteNotification(selectedNotification);
                }
              }}
            >
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
