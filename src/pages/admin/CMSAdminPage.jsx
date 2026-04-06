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

import { eventsService, newsService, announcementsService, bannersService } from '@/services/cmsService';
import EventEditDialog from './EventEditDialog';

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

  /**
   * Load all data
   */
  const loadData = async () => {
    setLoading(true);
    try {
      const [eventsData, newsData, announcementsData, bannersData] = await Promise.all([
        eventsService.getAll(),
        newsService.getAll(),
        announcementsService.getAll(),
        bannersService.getAll()
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
    loadData();
  }, []);

  /**
   * Events handlers
   */
  const handleEventSave = async (formData) => {
    try {
      if (editingEvent) {
        await eventsService.update(editingEvent.id, formData);
        setSuccess('Événement mis à jour avec succès');
      } else {
        await eventsService.create(formData);
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
        await eventsService.delete(id);
        setSuccess('Événement supprimé');
        await loadData();
      } catch (err) {
        setError('Erreur: ' + err.message);
      }
    }
  };

  const handleEventToggle = async (event) => {
    try {
      await eventsService.update(event.id, { is_published: !event.is_published });
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
        await eventsService.reorder(newEvents);
      } catch (err) {
        setError('Erreur lors du réordonnage: ' + err.message);
      }
    }
  };

  /**
   * Core UI Tab Content
   */
  const EventsTabContent = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Gestion des événements</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => {
          setEditingEvent(null);
          setEventDialogOpen(true);
        }}>
          Créer un événement
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleEventDragEnd}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell sx={{ width: '40px' }} />
                <TableCell sx={{ fontWeight: 700 }}>Titre</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Catégorie</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Modifié</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <SortableContext items={events.map((e) => e.id)} strategy={verticalListSortingStrategy}>
                {events.map((event) => (
                  <DraggableRow
                    key={event.id}
                    item={event}
                    onEdit={() => {
                      setEditingEvent(event);
                      setEventDialogOpen(true);
                    }}
                    onDelete={handleEventDelete}
                    onToggle={handleEventToggle}
                  />
                ))}
              </SortableContext>
            </TableBody>
          </Table>
        </DndContext>
      </TableContainer>

      <EventEditDialog
        open={eventDialogOpen}
        event={editingEvent}
        onSave={handleEventSave}
        onCancel={() => {
          setEventDialogOpen(false);
          setEditingEvent(null);
        }}
      />
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
          <Tab label="Événements" id="cms-tab-0" aria-controls="cms-tabpanel-0" />
          <Tab label="Actualités" id="cms-tab-1" aria-controls="cms-tabpanel-1" />
          <Tab label="Annonces" id="cms-tab-2" aria-controls="cms-tabpanel-2" />
          <Tab label="Bannières" id="cms-tab-3" aria-controls="cms-tabpanel-3" />
        </Tabs>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TabPanel value={currentTab} index={0}>
            <EventsTabContent />
          </TabPanel>
          {/* Additional tabs would go here */}
        </>
      )}
    </Container>
  );
};

export default CMSAdminPage;
