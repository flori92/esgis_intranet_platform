import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  CardMedia,
  Avatar,
  Grid
} from '@mui/material';
import {
  Event as EventIcon,
  CalendarToday as CalendarTodayIcon,
  LocationOn as LocationOnIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import styled from 'styled-components';

/**
 * Styled Components pour les effets visuels
 */
const StyledEventCard = styled(Card)`
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 245, 250, 0.95) 100%);
  border: 1px solid rgba(25, 118, 210, 0.1);
  backdrop-filter: blur(10px);

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 40px rgba(25, 118, 210, 0.15);
    border-color: rgba(25, 118, 210, 0.3);

    .event-image {
      transform: scale(1.05);
    }

    .event-details {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @media (max-width: 768px) {
    &:hover {
      transform: translateY(-4px);
    }
  }
`;

const EventImageWrapper = styled(Box)`
  position: relative;
  width: 100%;
  height: 160px;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

  .event-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.4s ease;
  }

  .event-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.3) 100%);
  }
`;

const DateBadge = styled(Box)`
  position: absolute;
  top: 12px;
  left: 12px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 8px 12px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 12px;
  color: #1976d2;
  border: 1px solid rgba(25, 118, 210, 0.2);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const CategoryChip = styled(Chip)`
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(25, 118, 210, 0.15) !important;
  color: #1976d2 !important;
  border: 1px solid rgba(25, 118, 210, 0.3) !important;
  font-weight: 600;
  font-size: 11px !important;
`;

/**
 * Composant pour afficher une carte d'événement attractive
 */
export const EventCardComponent = ({ event, onView, onEdit, onDelete, isAdmin = false }) => {
  const startDate = new Date(event.start_date);
  const endDate = event.end_date ? new Date(event.end_date) : null;

  const formatDateRange = () => {
    if (endDate && endDate !== startDate) {
      return `${format(startDate, 'd MMM', { locale: fr })} - ${format(endDate, 'd MMM yyyy', { locale: fr })}`;
    }
    return format(startDate, 'd MMMM yyyy', { locale: fr });
  };

  return (
    <StyledEventCard>
      {event.image_url && (
        <EventImageWrapper>
          <img
            src={event.image_url}
            alt={event.title}
            className="event-image"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <Box className="event-overlay" />
          <DateBadge>
            <CalendarTodayIcon sx={{ fontSize: 12, marginRight: 0.5 }} />
            {format(startDate, 'd MMM', { locale: fr })}
          </DateBadge>
          {event.category && <CategoryChip label={event.category} size="small" />}
        </EventImageWrapper>
      )}

      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', pb: 2 }}>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 700,
            marginBottom: 1,
            color: '#1a1a1a',
            lineHeight: 1.3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}
        >
          {event.title}
        </Typography>

        {event.location && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
            <LocationOnIcon sx={{ fontSize: 14, color: '#666' }} />
            <Typography variant="caption" sx={{ color: '#666', fontSize: '0.8rem' }}>
              {event.location}
            </Typography>
          </Box>
        )}

        <Typography variant="caption" sx={{ color: '#999', mb: 1.5, fontSize: '0.75rem' }}>
          {formatDateRange()}
        </Typography>

        {event.description && (
          <Typography
            variant="body2"
            sx={{
              color: '#555',
              fontSize: '0.85rem',
              lineHeight: 1.4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              marginBottom: 1.5,
              flex: 1
            }}
          >
            {event.description}
          </Typography>
        )}

        <Box sx={{ display: 'flex', gap: 1, marginTop: 'auto' }}>
          <Button
            size="small"
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              textTransform: 'none',
              fontWeight: 600
            }}
            endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
            onClick={() => onView && onView(event)}
          >
            Détails
          </Button>
          {isAdmin && (
            <>
              <Button size="small" variant="outlined" onClick={() => onEdit && onEdit(event)}>
                Éditer
              </Button>
              <Button size="small" variant="outlined" color="error" onClick={() => onDelete && onDelete(event.id)}>
                Supprimer
              </Button>
            </>
          )}
        </Box>
      </CardContent>
    </StyledEventCard>
  );
};

export default EventCardComponent;
