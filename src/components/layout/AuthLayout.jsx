import React from 'react';
import { Box, Container, Typography } from '@mui/material';

/**
 * Layout pour les pages d'authentification
 * Affiche un conteneur centré avec le contenu des pages d'auth
 * @param {Object} props - Propriétés du composant
 * @param {React.ReactNode} props.children - Contenu à afficher dans le layout
 * @returns {JSX.Element} Composant React
 */
const AuthLayout = ({ children }) => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f5f5f5',
        backgroundImage: 'linear-gradient(rgba(0, 51, 102, 0.05), rgba(0, 51, 102, 0.05))',
        fontFamily: 'Montserrat, sans-serif',
        padding: 2
      }}
    >
      <Container maxWidth="lg">
        {/* Contenu des pages d'authentification */}
        {children}
        
        <Typography 
          variant="body2" 
          color="text.secondary" 
          align="center" 
          sx={{ mt: 3 }}
          fontFamily="Montserrat, sans-serif"
        >
          &copy; {new Date().getFullYear()} ESGIS - Tous droits réservés
        </Typography>
      </Container>
    </Box>
  );
};

export default AuthLayout;
