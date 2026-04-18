import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Stack,
  alpha
} from '@mui/material';
import {
  People as PeopleIcon,
  School as SchoolIcon,
  BarChart as BarChartIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  ArrowForward as ArrowForwardIcon,
  Settings as SettingsIcon,
  History as HistoryIcon,
  Business as DeptIcon,
  LibraryBooks as CoursesIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { getAdminDashboardData } from '@/api/adminDashboard';

const NAVY = '#003366';
const CARD_RADIUS = 3;

const StatCard = ({ title, value, icon, color, link }) => (
  <Card 
    elevation={0} 
    sx={{ 
      height: '100%', 
      borderRadius: CARD_RADIUS, 
      border: `2px solid ${alpha(color, 0.3)}`, 
      bgcolor: alpha(color, 0.02),
      transition: 'all 0.3s ease',
      '&:hover': { 
        transform: 'translateY(-5px)', 
        boxShadow: `0 12px 24px ${alpha(color, 0.15)}`,
        borderColor: color,
        bgcolor: alpha(color, 0.05)
      }
    }}
  >
    <CardContent>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography color="text.secondary" variant="overline" fontWeight="700">{title}</Typography>
          <Typography variant="h4" fontWeight="900" sx={{ color: NAVY }}>{value}</Typography>
        </Box>
        <Box sx={{ 
          p: 1.5, borderRadius: 2, 
          bgcolor: alpha(color, 0.1), color: color 
        }}>
          {icon}
        </Box>
      </Stack>
    </CardContent>
    {link && (
      <CardActions sx={{ px: 2, pb: 2 }}>
        <Button size="small" component={Link} to={link} endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}>
          Détails
        </Button>
      </CardActions>
    )}
  </Card>
);

const ManagementLink = ({ title, desc, link, icon }) => (
  <Card elevation={0} sx={{ height: '100%', borderRadius: CARD_RADIUS, border: '1px solid', borderColor: 'divider' }}>
    <CardContent>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <Box sx={{ color: NAVY }}>{icon}</Box>
        <Typography variant="h6" fontWeight="800">{title}</Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>{desc}</Typography>
    </CardContent>
    <CardActions sx={{ px: 2, pb: 2, mt: 'auto' }}>
      <Button variant="outlined" size="small" component={Link} to={link} fullWidth sx={{ borderRadius: 2 }}>
        Gérer
      </Button>
    </CardActions>
  </Card>
);

const AdminDashboard = () => {
  const { authState } = useAuth();
  
  const { data: dashboardRes, isLoading, error, refetch } = useQuery({
    queryKey: ['adminDashboard'],
    queryFn: getAdminDashboardData,
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '70vh', gap: 2 }}>
        <CircularProgress size={48} sx={{ color: NAVY }} />
        <Typography variant="body2" color="text.secondary" fontWeight="500">Initialisation de la console...</Typography>
      </Box>
    );
  }

  const { stats, recentActivity } = dashboardRes?.data || { stats: {}, recentActivity: [] };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1440, mx: 'auto' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="900" sx={{ letterSpacing: '-0.5px' }}>Console Admin</Typography>
          <Typography variant="body1" color="text.secondary">Vue d'ensemble de la plateforme ESGIS Campus</Typography>
        </Box>
        <Button variant="contained" startIcon={<RefreshIcon />} onClick={() => refetch()} sx={{ borderRadius: 2, bgcolor: NAVY }}>
          Actualiser
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 3 }}>Erreur de chargement des données</Alert>}

      <Grid container spacing={3} sx={{ mb: 6 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Étudiants Actifs" value={stats.totalStudents} icon={<PeopleIcon />} color="#2196f3" link="/admin/students" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Professeurs" value={stats.totalProfessors} icon={<SchoolIcon />} color="#4caf50" link="/admin/professors" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Cours" value={stats.totalCourses} icon={<CoursesIcon />} color="#ff9800" link="/admin/courses" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Corrections en attente" value={stats.pendingCorrections} icon={<WarningIcon />} color={stats.pendingCorrections > 0 ? '#f44336' : '#9e9e9e'} link="/admin/validation-queue" />
        </Grid>
      </Grid>

      <Typography variant="h5" fontWeight="900" gutterBottom sx={{ mb: 3 }}>Actions de Gestion</Typography>
      <Grid container spacing={3} sx={{ mb: 6 }}>
        <Grid item xs={12} sm={6} md={4}><ManagementLink title="Scolarité" desc="Gestion des inscriptions, départements et niveaux d'études." link="/admin/academic" icon={<DeptIcon />} /></Grid>
        <Grid item xs={12} sm={6} md={4}><ManagementLink title="Utilisateurs" desc="Contrôle des accès, rôles et sécurité des comptes." link="/admin/users" icon={<PeopleIcon />} /></Grid>
        <Grid item xs={12} sm={6} md={4}><ManagementLink title="Système" desc="Logs d'audit, configuration globale et outils avancés." link="/admin/settings" icon={<SettingsIcon />} /></Grid>
      </Grid>

      <Paper elevation={0} sx={{ p: 3, borderRadius: CARD_RADIUS, border: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
          <HistoryIcon color="action" />
          <Typography variant="h6" fontWeight="800">Activité Récente du Système</Typography>
        </Stack>

        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: alpha(NAVY, 0.03) }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Action</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Utilisateur</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Ressource</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentActivity.map(entry => (
                <TableRow key={entry.id} hover>
                  <TableCell><Chip label={entry.action} size="small" sx={{ fontWeight: 600, textTransform: 'capitalize' }} /></TableCell>
                  <TableCell><Typography variant="body2">{entry.user_email || entry.user_id || 'Système'}</Typography></TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{entry.resource_type}</Typography></TableCell>
                  <TableCell align="right"><Typography variant="caption">{format(new Date(entry.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}</Typography></TableCell>
                </TableRow>
              ))}
              {recentActivity.length === 0 && (
                <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4 }}><Typography color="text.secondary">Aucune activité enregistrée</Typography></TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default AdminDashboard;
