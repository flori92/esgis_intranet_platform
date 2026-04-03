import React, { useState, useEffect } from 'react';
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
  LinearProgress,
} from '@mui/material';
import {
  People as PeopleIcon,
  School as SchoolIcon,
  BarChart as BarChartIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Settings as SettingsIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '@/supabase';

/**
 * Dashboard Admin - Vue d'ensemble du système
 */
const AdminDashboard = () => {
  const { authState } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalProfessors: 0,
    totalDepartments: 0,
    totalCourses: 0,
    activeSessions: 0,
    pendingCorrections: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Estudiants
      const { count: studentsCount } = await supabase
        .from('students')
        .select('id', { count: 'exact' })
        .eq('status', 'actif');

      // Professors
      const { count: professorsCount } = await supabase
        .from('professors')
        .select('id', { count: 'exact' });

      // Departments
      const { count: departmentsCount } = await supabase
        .from('departments')
        .select('id', { count: 'exact' });

      // Courses
      const { count: coursesCount } = await supabase
        .from('courses')
        .select('id', { count: 'exact' });

      // Active exam sessions
      const { count: sessionsCount } = await supabase
        .from('exam_sessions')
        .select('id', { count: 'exact' })
        .eq('status', 'in_progress');

      // Pending corrections
      const { count: correctionsCount } = await supabase
        .from('demandes_correction_notes')
        .select('id', { count: 'exact' })
        .eq('status', 'pending');

      setStats({
        totalStudents: studentsCount || 0,
        totalProfessors: professorsCount || 0,
        totalDepartments: departmentsCount || 0,
        totalCourses: coursesCount || 0,
        activeSessions: sessionsCount || 0,
        pendingCorrections: correctionsCount || 0,
      });

      // Activité récente
      const { data: activityData } = await supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentActivity(activityData || []);
    } catch (err) {
      console.error('Erreur chargement dashboard:', err);
      setError('Impossible de charger le dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Tableau de Bord Admin
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Statistiques principales */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Étudiants Actifs
                  </Typography>
                  <Typography variant="h4">{stats.totalStudents}</Typography>
                </Box>
                <PeopleIcon sx={{ fontSize: 40, color: '#2196f3' }} />
              </Box>
            </CardContent>
            <CardActions>
              <Button
                size="small"
                component={Link}
                to="/admin/students"
              >
                Voir Tous
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Professeurs
                  </Typography>
                  <Typography variant="h4">{stats.totalProfessors}</Typography>
                </Box>
                <SchoolIcon sx={{ fontSize: 40, color: '#4caf50' }} />
              </Box>
            </CardContent>
            <CardActions>
              <Button
                size="small"
                component={Link}
                to="/admin/professors"
              >
                Voir Tous
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Cours
                  </Typography>
                  <Typography variant="h4">{stats.totalCourses}</Typography>
                </Box>
                <BarChartIcon sx={{ fontSize: 40, color: '#ff9800' }} />
              </Box>
            </CardContent>
            <CardActions>
              <Button
                size="small"
                component={Link}
                to="/admin/courses"
              >
                Voir Tous
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Demandes Correction
                  </Typography>
                  <Typography variant="h4" sx={{ color: stats.pendingCorrections > 0 ? '#f44336' : '#4caf50' }}>
                    {stats.pendingCorrections}
                  </Typography>
                </Box>
                <WarningIcon sx={{ fontSize: 40, color: stats.pendingCorrections > 0 ? '#f44336' : '#4caf50' }} />
              </Box>
            </CardContent>
            <CardActions>
              <Button
                size="small"
                component={Link}
                to="/admin/correction-requests"
              >
                Voir Tous
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>

      {/* Sections de gestion */}
      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
        Gestion
      </Typography>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Étudiants
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Créer, modifier, importer ou supprimer des étudiants
              </Typography>
            </CardContent>
            <CardActions sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                component={Link}
                to="/admin/students"
              >
                Liste
              </Button>
              <Button
                size="small"
                component={Link}
                to="/admin/students/import"
              >
                Importer
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Professeurs
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Gérer les profils et assignations des professeurs
              </Typography>
            </CardContent>
            <CardActions sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                component={Link}
                to="/admin/professors"
              >
                Liste
              </Button>
              <Button
                size="small"
                component={Link}
                to="/admin/professors/create"
              >
                Créer
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Cours
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Créer et configurer les cours
              </Typography>
            </CardContent>
            <CardActions sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                component={Link}
                to="/admin/courses"
              >
                Liste
              </Button>
              <Button
                size="small"
                component={Link}
                to="/admin/courses/create"
              >
                Créer
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Départements
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Gérer les départements et leurs informations
              </Typography>
            </CardContent>
            <CardActions sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                component={Link}
                to="/admin/departments"
              >
                Liste
              </Button>
              <Button
                size="small"
                component={Link}
                to="/admin/departments/create"
              >
                Créer
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Audit & Logs
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Consulter l'historique des actions et modifications
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                size="small"
                component={Link}
                to="/admin/audit"
              >
                Voir Logs
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Configuration
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Paramètres système et configuration globale
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                size="small"
                component={Link}
                to="/admin/settings"
              >
                Paramètres
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>

      {/* Activité récente */}
      {recentActivity.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Activité Récente
          </Typography>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell>Action</TableCell>
                  <TableCell>Utilisateur</TableCell>
                  <TableCell>Ressource</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentActivity.map(entry => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <Chip
                        label={entry.action}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{entry.user_id || 'System'}</TableCell>
                    <TableCell>{entry.resource_type}</TableCell>
                    <TableCell>
                      {new Date(entry.created_at).toLocaleDateString('fr-FR')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
};

export default AdminDashboard;
