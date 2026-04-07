import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Tabs,
  Tab,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Chip,
  Alert,
  CircularProgress,
  Typography,
  Grid
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  DragIndicator as DragIndicatorIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import styled from 'styled-components';

import {
  securedEventsService,
  securedNewsService,
  securedAnnouncementsService,
  securedBannersService,
  checkCMSPermission
} from '@/services/securedCmsService';
import { cmsPermissionsService } from '@/services/cmsPermissionsService';
import { supabase } from '@/supabase';
import EventEditDialog from '@/components/cms/EventEditDialog';

/**
 * TabPanel Component
 */
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div role="tabpanel" hidden={value !== index} id={`cms-tabpanel-${index}`} aria-labelledby={`cms-tab-${index}`} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

/**
 * Draggable Row Component
 */
const DraggableRow = ({ item, isActive, isDragging, listeners, transform, transition, onEdit, onDelete, onToggle }) => {
  const { setNodeRef } = useSortable({
    id: item.id,
    data: item
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <TableRow ref={setNodeRef} style={style} hover={!isDragging}>
      <TableCell sx={{ width: '40px', cursor: 'grab', '&:active': { cursor: 'grabbing' } }} {...listeners}>
        <DragIndicatorIcon sx={{ color: '#999', fontSize: 20 }} />
      </TableCell>
      <TableCell>{item.title}</TableCell>
      <TableCell sx={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {item.description || item.content || item.subtitle || '-'}
      </TableCell>
      <TableCell>{item.category || item.priority || '-'}</TableCell>
      <TableCell align="center">
        <Chip
          label={item.is_published || item.is_active ? 'Publié' : 'Brouillon'}
          size="small"
          color={item.is_published || item.is_active ? 'success' : 'default'}
        />
      </TableCell>
      <TableCell sx={{ width: '120px' }}>
        {format(new Date(item.updated_at || item.created_at), 'd MMM yyyy', { locale: fr })}
      </TableCell>
      <TableCell align="right" sx={{ width: '100px' }}>
        <IconButton size="small" onClick={() => onToggle(item)}>
          {item.is_published || item.is_active ? (
            <VisibilityIcon fontSize="small" />
          ) : (
            <VisibilityOffIcon fontSize="small" />
          )}
        </IconButton>
        <IconButton size="small" onClick={() => onEdit(item)}>
          <EditIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" color="error" onClick={() => onDelete(item.id)}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      </TableCell>
    </TableRow>
  );
};

/**
 * Page CMS Admin
 */
export const CMSAdminPage = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Events
  const [events, setEvents] = useState([]);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);

  // News
  const [news, setNews] = useState([]);
  const [editingNews, setEditingNews] = useState(null);
  const [newsDialogOpen, setNewsDialogOpen] = useState(false);

  // Announcements
  const [announcements, setAnnouncements] = useState([]);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [announcementDialogOpen, setAnnouncementDialogOpen] = useState(false);

  // Banners
  const [banners, setBanners] = useState([]);
  const [editingBanner, setEditingBanner] = useState(null);
  const [bannerDialogOpen, setBannerDialogOpen] = useState(false);

  // Drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, { distance: 8 }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Permission tracking
  const [userPermissions, setUserPermissions] = useState({
    events: false,
    news: false,
    announcements: false,
    banners: false
  });
  const [currentUserId, setCurrentUserId] = useState(null);

  /**
   * Load user permissions
   */
  const loadUserPermissions = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user?.id) {
        setError('Non authentifié');
        return;
      }

      setCurrentUserId(user.user.id);

      // Check permissions for each module
      const permissions = {
        events: await checkCMSPermission(user.user.id, 'events'),
        news: await checkCMSPermission(user.user.id, 'news'),
        announcements: await checkCMSPermission(user.user.id, 'announcements'),
        banners: await checkCMSPermission(user.user.id, 'banners')
      };

      setUserPermissions(permissions);

      // If no permissions at all, show warning
      if (!Object.values(permissions).some((p) => p)) {
        setError('Vous n\'avez pas accès au CMS');
      }
    } catch (err) {
      console.error('Erreur chargement permissions:', err);
    }
  };

  /**
   * Load all data
   */
  const loadData = async () => {
    setLoading(true);
    try {
      const [eventsData, newsData, announcementsData, bannersData] = await Promise.all([
        securedEventsService.getAll(),
        securedNewsService.getAll(),
        securedAnnouncementsService.getAll(),
        securedBannersService.getAll()
      ]);

      setEvents(eventsData);
      setNews(newsData);
      setAnnouncements(announcementsData);
      setBanners(bannersData);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des données: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserPermissions();
    loadData();
  }, []);

  /**
   * Events handlers
   */
  const handleEventSave = async (formData) => {
    try {
      if (!userPermissions.events) {
        throw new Error('Vous n\'avez pas la permission de modifier les événements');
      }

      if (editingEvent) {
        await securedEventsService.update(editingEvent.id, formData);
        setSuccess('Événement mis à jour avec succès');
      } else {
        await securedEventsService.create(formData);
        setSuccess('Événement créé avec succès');
      }
      await loadData();
      setEventDialogOpen(false);
      setEditingEvent(null);
    } catch (err) {
      setError('Erreur: ' + err.message);
    }
  };

  const handleEventDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet événement?')) {
      try {
        if (!userPermissions.events) {
          throw new Error('Vous n\'avez pas la permission de supprimer les événements');
        }
        await securedEventsService.delete(id);
        setSuccess('Événement supprimé');
        await loadData();
      } catch (err) {
        setError('Erreur: ' + err.message);
      }
    }
  };

  const handleEventToggle = async (event) => {
    try {
      if (!userPermissions.events) {
        throw new Error('Vous n\'avez pas la permission de modifier les événements');
      }
      await securedEventsService.update(event.id, { is_published: !event.is_published });
      await loadData();
    } catch (err) {
      setError('Erreur: ' + err.message);
    }
  };

  const handleEventDragEnd = async (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = events.findIndex((e) => e.id === active.id);
      const newIndex = events.findIndex((e) => e.id === over?.id);
      const newEvents = arrayMove(events, oldIndex, newIndex);
      setEvents(newEvents);
      try {
        if (!userPermissions.events) {
          throw new Error('Vous n\'avez pas la permission de réorganiser les événements');
        }
        await securedEventsService.reorder(newEvents);
      } catch (err) {
        setError('Erreur lors du réordonnage: ' + err.message);
      }
    }
  };

  /**
   * News handlers
   */
  const handleNewsSave = async (formData) => {
    try {
      if (!userPermissions.news) {
        throw new Error('Vous n\'avez pas la permission de modifier les actualités');
      }

      if (editingNews) {
        await securedNewsService.update(editingNews.id, formData);
        setSuccess('Actualité mise à jour avec succès');
      } else {
        await securedNewsService.create(formData);
        setSuccess('Actualité créée avec succès');
      }
      await loadData();
      setNewsDialogOpen(false);
      setEditingNews(null);
    } catch (err) {
      setError('Erreur: ' + err.message);
    }
  };

  const handleNewsDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette actualité?')) {
      try {
        if (!userPermissions.news) {
          throw new Error('Vous n\'avez pas la permission de supprimer les actualités');
        }
        await securedNewsService.delete(id);
        setSuccess('Actualité supprimée');
        await loadData();
      } catch (err) {
        setError('Erreur: ' + err.message);
      }
    }
  };

  const handleNewsToggle = async (item) => {
    try {
      if (!userPermissions.news) {
        throw new Error('Vous n\'avez pas la permission de modifier les actualités');
      }
      await securedNewsService.update(item.id, { is_published: !item.is_published });
      await loadData();
    } catch (err) {
      setError('Erreur: ' + err.message);
    }
  };

  const handleNewsDragEnd = async (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = news.findIndex((e) => e.id === active.id);
      const newIndex = news.findIndex((e) => e.id === over?.id);
      const newNews = arrayMove(news, oldIndex, newIndex);
      setNews(newNews);
      try {
        if (!userPermissions.news) {
          throw new Error('Vous n\'avez pas la permission de réorganiser les actualités');
        }
        await securedNewsService.reorder(newNews);
      } catch (err) {
        setError('Erreur lors du réordonnage: ' + err.message);
      }
    }
  };

  /**
   * Announcements handlers
   */
  const handleAnnouncementSave = async (formData) => {
    try {
      if (!userPermissions.announcements) {
        throw new Error('Vous n\'avez pas la permission de modifier les annonces');
      }

      if (editingAnnouncement) {
        await securedAnnouncementsService.update(editingAnnouncement.id, formData);
        setSuccess('Annonce mise à jour avec succès');
      } else {
        await securedAnnouncementsService.create(formData);
        setSuccess('Annonce créée avec succès');
      }
      await loadData();
      setAnnouncementDialogOpen(false);
      setEditingAnnouncement(null);
    } catch (err) {
      setError('Erreur: ' + err.message);
    }
  };

  const handleAnnouncementDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette annonce?')) {
      try {
        if (!userPermissions.announcements) {
          throw new Error('Vous n\'avez pas la permission de supprimer les annonces');
        }
        await securedAnnouncementsService.delete(id);
        setSuccess('Annonce supprimée');
        await loadData();
      } catch (err) {
        setError('Erreur: ' + err.message);
      }
    }
  };

  const handleAnnouncementToggle = async (item) => {
    try {
      if (!userPermissions.announcements) {
        throw new Error('Vous n\'avez pas la permission de modifier les annonces');
      }
      await securedAnnouncementsService.update(item.id, { is_published: !item.is_published });
      await loadData();
    } catch (err) {
      setError('Erreur: ' + err.message);
    }
  };

  const handleAnnouncementDragEnd = async (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = announcements.findIndex((e) => e.id === active.id);
      const newIndex = announcements.findIndex((e) => e.id === over?.id);
      const newAnnouncements = arrayMove(announcements, oldIndex, newIndex);
      setAnnouncements(newAnnouncements);
      try {
        if (!userPermissions.announcements) {
          throw new Error('Vous n\'avez pas la permission de réorganiser les annonces');
        }
        await securedAnnouncementsService.reorder(newAnnouncements);
      } catch (err) {
        setError('Erreur lors du réordonnage: ' + err.message);
      }
    }
  };

  /**
   * Banners handlers
   */
  const handleBannerSave = async (formData) => {
    try {
      if (!userPermissions.banners) {
        throw new Error('Vous n\'avez pas la permission de modifier les bannières');
      }

      if (editingBanner) {
        await securedBannersService.update(editingBanner.id, formData);
        setSuccess('Bannière mise à jour avec succès');
      } else {
        await securedBannersService.create(formData);
        setSuccess('Bannière créée avec succès');
      }
      await loadData();
      setBannerDialogOpen(false);
      setEditingBanner(null);
    } catch (err) {
      setError('Erreur: ' + err.message);
    }
  };

  const handleBannerDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette bannière?')) {
      try {
        if (!userPermissions.banners) {
          throw new Error('Vous n\'avez pas la permission de supprimer les bannières');
        }
        await securedBannersService.delete(id);
        setSuccess('Bannière supprimée');
        await loadData();
      } catch (err) {
        setError('Erreur: ' + err.message);
      }
    }
  };

  const handleBannerToggle = async (item) => {
    try {
      if (!userPermissions.banners) {
        throw new Error('Vous n\'avez pas la permission de modifier les bannières');
      }
      await securedBannersService.update(item.id, { is_active: !item.is_active });
      await loadData();
    } catch (err) {
      setError('Erreur: ' + err.message);
    }
  };

  const handleBannerDragEnd = async (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = banners.findIndex((e) => e.id === active.id);
      const newIndex = banners.findIndex((e) => e.id === over?.id);
      const newBanners = arrayMove(banners, oldIndex, newIndex);
      setBanners(newBanners);
      try {
        if (!userPermissions.banners) {
          throw new Error('Vous n\'avez pas la permission de réorganiser les bannières');
        }
        await securedBannersService.reorder(newBanners);
      } catch (err) {
        setError('Erreur lors du réordonnage: ' + err.message);
      }
    }
  };

  /**
   * Tab Content Components
   */
  const GenericTabContent = ({ title, items, onAdd, onEdit, onDelete, onToggle, onDragEnd }) => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">{title}</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={onAdd}>
          Créer
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell sx={{ width: '40px' }} />
                <TableCell sx={{ fontWeight: 700 }}>Titre</TableCell>
                <TableCell sx={{ fontWeight: 700, maxWidth: '200px' }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Catégorie</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Modifié</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <SortableContext items={items.map((e) => e.id)} strategy={verticalListSortingStrategy}>
                {items.map((item) => (
                  <DraggableRow
                    key={item.id}
                    item={item}
                    onEdit={() => onEdit(item)}
                    onDelete={onDelete}
                    onToggle={onToggle}
                  />
                ))}
              </SortableContext>
            </TableBody>
          </Table>
        </DndContext>
      </TableContainer>
    </Box>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
          <Tab
            label={`Événements ${userPermissions.events ? '✓' : ''}`}
            id="cms-tab-0"
            aria-controls="cms-tabpanel-0"
            disabled={!userPermissions.events}
          />
          <Tab
            label={`Actualités ${userPermissions.news ? '✓' : ''}`}
            id="cms-tab-1"
            aria-controls="cms-tabpanel-1"
            disabled={!userPermissions.news}
          />
          <Tab
            label={`Annonces ${userPermissions.announcements ? '✓' : ''}`}
            id="cms-tab-2"
            aria-controls="cms-tabpanel-2"
            disabled={!userPermissions.announcements}
          />
          <Tab
            label={`Bannières ${userPermissions.banners ? '✓' : ''}`}
            id="cms-tab-3"
            aria-controls="cms-tabpanel-3"
            disabled={!userPermissions.banners}
          />
        </Tabs>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TabPanel value={currentTab} index={0}>
            {userPermissions.events ? (
              <GenericTabContent
                title="Gestion des événements"
                items={events}
                onAdd={() => {
                  setEditingEvent(null);
                  setEventDialogOpen(true);
                }}
                onEdit={(event) => {
                  setEditingEvent(event);
                  setEventDialogOpen(true);
                }}
                onDelete={handleEventDelete}
                onToggle={handleEventToggle}
                onDragEnd={handleEventDragEnd}
              />
            ) : (
              <Alert severity="warning">Vous n'avez pas accès à cette section</Alert>
            )}
          </TabPanel>

          <TabPanel value={currentTab} index={1}>
            {userPermissions.news ? (
              <GenericTabContent
                title="Gestion des actualités"
                items={news}
                onAdd={() => {
                  setEditingNews(null);
                  setNewsDialogOpen(true);
                }}
                onEdit={(item) => {
                  setEditingNews(item);
                  setNewsDialogOpen(true);
                }}
                onDelete={handleNewsDelete}
                onToggle={handleNewsToggle}
                onDragEnd={handleNewsDragEnd}
              />
            ) : (
              <Alert severity="warning">Vous n'avez pas accès à cette section</Alert>
            )}
          </TabPanel>

          <TabPanel value={currentTab} index={2}>
            {userPermissions.announcements ? (
              <GenericTabContent
                title="Gestion des annonces"
                items={announcements}
                onAdd={() => {
                  setEditingAnnouncement(null);
                  setAnnouncementDialogOpen(true);
                }}
                onEdit={(item) => {
                  setEditingAnnouncement(item);
                  setAnnouncementDialogOpen(true);
                }}
                onDelete={handleAnnouncementDelete}
                onToggle={handleAnnouncementToggle}
                onDragEnd={handleAnnouncementDragEnd}
              />
            ) : (
              <Alert severity="warning">Vous n'avez pas accès à cette section</Alert>
            )}
          </TabPanel>

          <TabPanel value={currentTab} index={3}>
            {userPermissions.banners ? (
              <GenericTabContent
                title="Gestion des bannières"
                items={banners}
                onAdd={() => {
                  setEditingBanner(null);
                  setBannerDialogOpen(true);
                }}
                onEdit={(item) => {
                  setEditingBanner(item);
                  setBannerDialogOpen(true);
                }}
                onDelete={handleBannerDelete}
                onToggle={handleBannerToggle}
                onDragEnd={handleBannerDragEnd}
              />
            ) : (
              <Alert severity="warning">Vous n'avez pas accès à cette section</Alert>
            )}
          </TabPanel>
        </>
      )}

      {/* Dialogs */}
      <EventEditDialog
        open={eventDialogOpen}
        event={editingEvent}
        onSave={handleEventSave}
        onCancel={() => {
          setEventDialogOpen(false);
          setEditingEvent(null);
        }}
      />

      {/* Placeholder dialogs for other content types - would be implemented similarly */}
    </Container>
  );
};

export default CMSAdminPage;
