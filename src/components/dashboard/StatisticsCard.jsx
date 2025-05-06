import React from 'react';
import { Card, CardContent, Typography, Box, Avatar } from '@mui/material';

/**
 * Carte de statistique pour le tableau de bord
 * @param {Object} props - Propriétés du composant
 * @param {string} props.title - Titre de la statistique
 * @param {string|number} props.value - Valeur de la statistique
 * @param {React.ReactNode} props.icon - Icône à afficher
 * @param {string} props.color - Couleur de l'icône (primary, secondary, error, warning, info, success)
 * @param {string} props.subtitle - Sous-titre optionnel
 * @returns {JSX.Element} Composant de carte de statistique
 */
const StatisticsCard = ({ title, value, icon, color = 'primary', subtitle }) => {
  return (
    <Card elevation={3} sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" component="div" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div" fontWeight="bold">
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar
            sx={{
              bgcolor: `${color}.main`,
              width: 56,
              height: 56,
              boxShadow: 2
            }}
          >
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatisticsCard;
