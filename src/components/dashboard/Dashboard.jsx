import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useAuth } from '@/context/AuthContext';
import AdminDashboard from './AdminDashboard';
import ProfessorDashboard from './ProfessorDashboard';
import StudentDashboard from './StudentDashboard';

/**
 * Composant principal du tableau de bord
 * Affiche le tableau de bord correspondant au rôle de l'utilisateur connecté
 * @returns {JSX.Element} Composant de tableau de bord
 */
const Dashboard = () => {
  const { authState } = useAuth();
  const { isAdmin, isProfessor, isStudent, loading } = authState;

  // Si les données d'authentification sont en cours de chargement
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Si l'utilisateur n'est pas authentifié ou n'a pas de rôle défini
  if (!isAdmin && !isProfessor && !isStudent) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h5" color="error" gutterBottom>
          Accès non autorisé
        </Typography>
        <Typography variant="body1">
          Vous n'avez pas les permissions nécessaires pour accéder au tableau de bord.
        </Typography>
      </Box>
    );
  }

  // Afficher le tableau de bord correspondant au rôle de l'utilisateur
  if (isAdmin) {
    return <AdminDashboard />;
  } else if (isProfessor) {
    return <ProfessorDashboard />;
  } else if (isStudent) {
    return <StudentDashboard />;
  }

  // Fallback (ne devrait jamais être atteint)
  return null;
};

export default Dashboard;
