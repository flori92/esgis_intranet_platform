import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Container, Paper, Typography } from '@mui/material';

/**
 * Layout pour les pages d'authentification
 * Affiche un conteneur centré avec le logo ESGIS et le contenu des pages d'auth
 * @returns {JSX.Element} Composant React
 */
const AuthLayout = () => {
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
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 2,
            borderTop: '4px solid #003366', // Bordure supérieure bleue ESGIS
          }}
        >
          {/* Logo ESGIS */}
          <Box
            component="img"
            src="/logo-esgis.png"
            alt="Logo ESGIS"
            sx={{
              height: 80,
              mb: 2,
            }}
          />
          
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom 
            align="center" 
            fontWeight="bold"
            fontFamily="Montserrat, sans-serif"
            color="#003366" // Bleu ESGIS
          >
            INTRANET ESGIS
          </Typography>
          
          {/* Contenu des pages d'authentification */}
          <Outlet />
        </Paper>
        
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
