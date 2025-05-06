import React from 'react';
import { Box, Container, Typography, Grid } from '@mui/material';
import { useAuth } from '@/context/AuthContext';

/**
 * Composant de base pour les tableaux de bord
 * Fournit une structure commune pour tous les tableaux de bord
 * @param {Object} props - Propriétés du composant
 * @param {React.ReactNode} props.children - Contenu du tableau de bord
 * @param {string} props.title - Titre du tableau de bord
 * @param {React.ReactNode} [props.headerActions] - Actions à afficher dans l'en-tête (optionnel)
 * @returns {JSX.Element} Composant de base du tableau de bord
 */
const DashboardBase = ({ children, title, headerActions }) => {
  const { authState } = useAuth();
  const { isAdmin, isProfessor, isStudent } = authState;

  // Déterminer le rôle pour l'affichage
  let roleDisplay = 'Utilisateur';
  if (isAdmin) {
    roleDisplay = 'Administrateur';
  } else if (isProfessor) {
    roleDisplay = 'Professeur';
  } else if (isStudent) {
    roleDisplay = 'Étudiant';
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {title || `Tableau de bord ${roleDisplay}`}
        </Typography>
        {headerActions && (
          <Box>
            {headerActions}
          </Box>
        )}
      </Box>
      
      {children}
    </Container>
  );
};

export default DashboardBase;
