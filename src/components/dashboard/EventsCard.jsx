import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon, 
  Divider,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip
} from '@mui/material';
import { 
  Event as EventIcon,
  CalendarToday as CalendarTodayIcon,
  School as SchoolIcon,
  Group as GroupIcon,
  Assignment as AssignmentIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from 'react-router-dom';

/**
 * Composant pour afficher les événements sur le tableau de bord
 * @param {Object} props - Propriétés du composant
 * @param {Array} props.events - Liste des événements à afficher
 * @param {string} props.title - Titre de la section
 * @param {boolean} [props.showFilters=true] - Afficher les filtres (optionnel)
 * @returns {JSX.Element} Composant d'affichage des événements
 */
const EventsCard = ({ events = [], title = "Événements à venir", showFilters = true }) => {
  const [typeFilter, setTypeFilter] = useState('tous');
  
  /**
   * Formater la date pour l'affichage
   * @param {string|Date} date - Date à formater
   * @returns {string} Date formatée
   */
  const formatDate = (date) => {
    if (!date) {
      return '';
    }
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return format(dateObj, 'dd MMMM yyyy', { locale: fr });
    } catch (error) {
      console.error('Erreur lors du formatage de la date:', error);
      return '';
    }
  };

  /**
   * Formater l'heure pour l'affichage
   * @param {string|Date} date - Date à formater
   * @returns {string} Heure formatée
   */
  const formatTime = (date) => {
    if (!date) {
      return '';
    }
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return format(dateObj, 'HH:mm', { locale: fr });
    } catch (error) {
      console.error('Erreur lors du formatage de l\'heure:', error);
      return '';
    }
  };

  /**
   * Obtenir l'icône correspondant au type d'événement
   * @param {string} type - Type d'événement
   * @returns {JSX.Element} Icône correspondante
   */
  const getEventIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'cours':
      case 'formation':
        return <SchoolIcon color="primary" />;
      case 'reunion':
      case 'meeting':
        return <GroupIcon color="secondary" />;
      case 'examen':
      case 'exam':
        return <AssignmentIcon color="error" />;
      default:
        return <EventIcon color="info" />;
    }
  };

  /**
   * Gérer le changement de filtre par type
   * @param {Object} event - Événement de changement
   */
  const handleTypeFilterChange = (event) => {
    setTypeFilter(event.target.value);
  };

  // Filtrer les événements selon le type sélectionné
  const filteredEvents = typeFilter === 'tous' 
    ? events 
    : events.filter(event => event.type?.toLowerCase() === typeFilter);

  return (
    <Card elevation={3}>
      <CardHeader 
        title={title} 
        titleTypographyProps={{ variant: 'h6' }}
        action={
          showFilters && (
            <FormControl variant="standard" size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="event-type-filter-label">Type</InputLabel>
              <Select
                labelId="event-type-filter-label"
                id="event-type-filter"
                value={typeFilter}
                onChange={handleTypeFilterChange}
                label="Type"
              >
                <MenuItem value="tous">Tous</MenuItem>
                <MenuItem value="cours">Cours</MenuItem>
                <MenuItem value="reunion">Réunions</MenuItem>
                <MenuItem value="examen">Examens</MenuItem>
                <MenuItem value="autre">Autres</MenuItem>
              </Select>
            </FormControl>
          )
        }
      />
      <Divider />
      <CardContent sx={{ p: 0 }}>
        {filteredEvents.length > 0 ? (
          <>
            <List>
              {filteredEvents.map((event) => (
                <React.Fragment key={event.id}>
                  <ListItem alignItems="flex-start">
                    <ListItemIcon>
                      {getEventIcon(event.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle1">{event.title}</Typography>
                          <Chip 
                            label={event.type || 'Événement'} 
                            size="small" 
                            color={
                              event.type?.toLowerCase() === 'examen' ? 'error' : 
                              event.type?.toLowerCase() === 'cours' ? 'primary' : 
                              event.type?.toLowerCase() === 'reunion' ? 'secondary' : 
                              'default'
                            }
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" component="span" display="block">
                            <CalendarTodayIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                            {formatDate(event.date || event.start_date)}
                            {event.start_time && ` à ${formatTime(event.start_time)}`}
                            {(event.end_date && event.start_date !== event.end_date) && 
                              ` - ${formatDate(event.end_date)}`}
                          </Typography>
                          {event.location && (
                            <Typography variant="body2" component="span" display="block">
                              Lieu: {event.location}
                            </Typography>
                          )}
                          {event.description && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              {event.description.substring(0, 100)}
                              {event.description.length > 100 ? '...' : ''}
                            </Typography>
                          )}
                        </>
                      }
                    />
                  </ListItem>
                  <Divider variant="inset" component="li" />
                </React.Fragment>
              ))}
            </List>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
              <Button 
                component={Link} 
                to="/evenements" 
                endIcon={<ArrowForwardIcon />}
                size="small"
              >
                Voir tous les événements
              </Button>
            </Box>
          </>
        ) : (
          <ListItem>
            <ListItemText primary="Aucun événement à venir" />
          </ListItem>
        )}
      </CardContent>
    </Card>
  );
};

export default EventsCard;
