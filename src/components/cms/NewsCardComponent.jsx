import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Avatar,
  Stack
} from '@mui/material';
import {
  Newspaper as NewspaperIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Favorite as FavoriteIcon,
  ArrowForward as ArrowForwardIcon,
  Share as ShareIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import styled from 'styled-components';

/**
 * Styled Components pour les effets visuels
 */
const StyledNewsCard = styled(Card)`
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 250, 255, 0.95) 100%);
  border: 1px solid rgba(99, 125, 234, 0.1);
  backdrop-filter: blur(10px);

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 40px rgba(99, 125, 234, 0.15);
    border-color: rgba(99, 125, 234, 0.3);

    .news-image {
      transform: scale(1.05);
    }
  }

  @media (max-width: 768px) {
    &:hover {
      transform: translateY(-4px);
    }
  }
`;

const NewsImageWrapper = styled(Box)`
  position: relative;
  width: 100%;
  height: 180px;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

  .news-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.4s ease;
  }

  .news-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.4) 100%);
  }
`;

const FeaturedBadge = styled(Chip)`
  position: absolute !important;
  top: 12px;
  right: 12px;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%) !important;
  color: white !important;
  font-weight: 700 !important;
`;

const DateMeta = styled(Box)`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(99, 125, 234, 0.08);
  border-radius: 8px;
  width: fit-content;
  margin-bottom: 12px;
`;

/**
 * Composant pour afficher une carte d'actualité attractive
 */
export const NewsCardComponent = ({ news, featured = false, onView, onEdit, onDelete, isAdmin = false }) => {
  const [isFavorited, setIsFavorited] = React.useState(false);

  const publishedDate = news.published_at ? new Date(news.published_at) : new Date(news.created_at);

  return (
    <StyledNewsCard>
      {news.image_url && (
        <NewsImageWrapper>
          <img
            src={news.image_url}
            alt={news.title}
            className="news-image"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <Box className="news-overlay" />
          {featured && <FeaturedBadge label="⭐ Mise en avant" />}
        </NewsImageWrapper>
      )}

      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <DateMeta>
          <NewspaperIcon sx={{ fontSize: 14, color: '#667eea' }} />
          <Typography variant="caption" sx={{ color: '#667eea', fontWeight: 600, fontSize: '0.75rem' }}>
            {format(publishedDate, 'd MMMM yyyy', { locale: fr })}
          </Typography>
        </DateMeta>

        <Typography
          variant="h6"
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
          {news.title}
        </Typography>

        {news.excerpt && (
          <Typography
            variant="body2"
            sx={{
              color: '#666',
              fontSize: '0.9rem',
              lineHeight: 1.5,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              marginBottom: 1.5,
              flex: 1
            }}
          >
            {news.excerpt}
          </Typography>
        )}

        {news.category && (
          <Box sx={{ marginBottom: 1.5 }}>
            <Chip
              label={news.category}
              size="small"
              sx={{
                background: 'rgba(99, 125, 234, 0.1)',
                color: '#667eea',
                fontWeight: 600,
                fontSize: '0.75rem'
              }}
            />
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 1, marginTop: 'auto' }}>
          <Button
            size="small"
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              textTransform: 'none',
              fontWeight: 600,
              flex: 1
            }}
            endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
            onClick={() => onView && onView(news)}
          >
            Lire
          </Button>

          {isAdmin && (
            <>
              <Button size="small" variant="outlined" onClick={() => onEdit && onEdit(news)}>
                Éditer
              </Button>
              <Button size="small" variant="outlined" color="error" onClick={() => onDelete && onDelete(news.id)}>
                Supprimer
              </Button>
            </>
          )}

          {!isAdmin && (
            <Button
              size="small"
              onClick={() => setIsFavorited(!isFavorited)}
              sx={{
                padding: '4px 8px',
                color: isFavorited ? '#ff6b6b' : '#999'
              }}
            >
              {isFavorited ? <FavoriteIcon sx={{ fontSize: 20 }} /> : <FavoriteBorderIcon sx={{ fontSize: 20 }} />}
            </Button>
          )}
        </Box>
      </CardContent>
    </StyledNewsCard>
  );
};

export default NewsCardComponent;
