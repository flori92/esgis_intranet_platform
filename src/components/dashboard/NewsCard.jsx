import React from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardMedia, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon, 
  Divider,
  Button,
  Box
} from '@mui/material';
import { 
  Notifications as NotificationsIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from 'react-router-dom';

/**
 * Composant pour afficher les actualités sur le tableau de bord
 * @param {Object} props - Propriétés du composant
 * @param {Array} props.news - Liste des actualités à afficher
 * @param {string} props.title - Titre de la section
 * @param {boolean} [props.showImage=false] - Afficher les images des actualités (optionnel)
 * @returns {JSX.Element} Composant d'affichage des actualités
 */
const NewsCard = ({ news = [], title = "Actualités", showImage = false }) => {
  /**
   * Formater la date pour l'affichage
   * @param {string|Date} date - Date à formater
   * @returns {string} Date formatée
   */
  const formatDate = (date) => {
    if (!date) return '';
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return format(dateObj, 'dd MMMM yyyy', { locale: fr });
    } catch (error) {
      console.error('Erreur lors du formatage de la date:', error);
      return '';
    }
  };

  /**
   * Obtenir l'icône correspondant à la catégorie de l'actualité
   * @param {string} category - Catégorie de l'actualité
   * @returns {JSX.Element} Icône correspondante
   */
  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'important': {
        return <ErrorIcon color="error" />;
      }
      case 'warning': {
        return <WarningIcon color="warning" />;
      }
      case 'information': {
        return <InfoIcon color="info" />;
      }
      default: {
        return <NotificationsIcon color="primary" />;
      }
    }
  };

  return (
    <Card elevation={3}>
      <CardHeader 
        title={title} 
        titleTypographyProps={{ variant: 'h6' }}
      />
      <Divider />
      <CardContent sx={{ p: 0 }}>
        {news.length > 0 ? (
          <>
            <List>
              {news.map((newsItem) => (
                <React.Fragment key={newsItem.id}>
                  <ListItem alignItems="flex-start">
                    <ListItemIcon>
                      {getCategoryIcon(newsItem.category)}
                    </ListItemIcon>
                    <ListItemText
                      primary={newsItem.title}
                      secondary={
                        <>
                          {showImage && newsItem.image_url && (
                            <CardMedia
                              component="img"
                              height="140"
                              image={newsItem.image_url}
                              alt={newsItem.title}
                              sx={{ mt: 1, mb: 1, borderRadius: 1 }}
                            />
                          )}
                          <Typography variant="body2" color="text.primary" component="span">
                            {newsItem.content?.substring(0, 100)}
                            {newsItem.content?.length > 100 ? '...' : ''}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            display="block" 
                            sx={{ mt: 1 }}
                          >
                            {formatDate(newsItem.date || newsItem.published_at)}
                            {newsItem.author && ` - Par: ${newsItem.author}`}
                          </Typography>
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
                to="/actualites" 
                endIcon={<ArrowForwardIcon />}
                size="small"
              >
                Voir toutes les actualités
              </Button>
            </Box>
          </>
        ) : (
          <ListItem>
            <ListItemText primary="Aucune actualité récente" />
          </ListItem>
        )}
      </CardContent>
    </Card>
  );
};

export default NewsCard;
