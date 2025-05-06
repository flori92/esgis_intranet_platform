import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import { 
  Grade as GradeIcon,
  School as SchoolIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/supabase';
import MainLayout from '@/components/layout/MainLayout';

// Import des données mock (à remplacer par des données réelles)
import { initializeMockData } from '@/utils/mockDataInitializer';

/**
 * Page de notes pour les étudiants
 * @returns {JSX.Element} Composant de page de notes
 */
const StudentGradesPage = () => {
  const { authState } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [grades, setGrades] = useState([]);
  const [stats, setStats] = useState({
    average: 0,
    highest: 0,
    lowest: 0,
    count: 0
  });

  useEffect(() => {
    fetchGrades();
  }, []);

  /**
   * Récupérer les notes
   */
  const fetchGrades = async () => {
    setLoading(true);
    try {
      // Vérifier si l'utilisateur est connecté et est un étudiant
      if (!authState.user || !authState.isStudent) {
        throw new Error('Accès non autorisé');
      }

      // Tenter de récupérer les données depuis Supabase
      try {
        // Récupérer les notes
        const { data, error } = await supabase
          .from('grades')
          .select('*, courses(name), exams(title)')
          .eq('student_id', authState.user.id)
          .order('date', { ascending: false });
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          const formattedGrades = data.map(item => ({
            id: item.id,
            course_name: item.courses?.name || item.exams?.title || 'Évaluation inconnue',
            value: item.value,
            max_value: item.max_value || 20,
            date: item.date,
            type: item.type || 'Examen',
            comment: item.comment
          }));
          
          setGrades(formattedGrades);
          
          // Calculer les statistiques
          const values = formattedGrades.map(grade => (grade.value / grade.max_value) * 20);
          setStats({
            average: values.reduce((acc, val) => acc + val, 0) / values.length,
            highest: Math.max(...values),
            lowest: Math.min(...values),
            count: values.length
          });
        } else {
          // Si aucune donnée n'est trouvée, utiliser les données mock
          const mockData = initializeMockData();
          setGrades(mockData.recentGrades);
          
          // Calculer les statistiques
          const values = mockData.recentGrades.map(grade => (grade.value / grade.max_value) * 20);
          setStats({
            average: values.reduce((acc, val) => acc + val, 0) / values.length,
            highest: Math.max(...values),
            lowest: Math.min(...values),
            count: values.length
          });
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des notes:', error);
        // En cas d'erreur, utiliser les données mock
        const mockData = initializeMockData();
        setGrades(mockData.recentGrades);
        
        // Calculer les statistiques
        const values = mockData.recentGrades.map(grade => (grade.value / grade.max_value) * 20);
        setStats({
          average: values.reduce((acc, val) => acc + val, 0) / values.length,
          highest: Math.max(...values),
          lowest: Math.min(...values),
          count: values.length
        });
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Formater la date pour l'affichage
   * @param {string} dateString - Date au format ISO
   * @returns {string} Date formatée
   */
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd MMMM yyyy', { locale: fr });
    } catch (error) {
      return dateString || 'Date non spécifiée';
    }
  };

  /**
   * Obtenir la couleur en fonction de la note
   * @param {number} value - Valeur de la note
   * @param {number} maxValue - Valeur maximale
   * @returns {string} Couleur
   */
  const getGradeColor = (value, maxValue) => {
    const percentage = (value / maxValue) * 100;
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'info';
    if (percentage >= 40) return 'warning';
    return 'error';
  };

  return (
    <MainLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <GradeIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Mes notes
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : (
          <>
            {/* Statistiques */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={3}>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Moyenne générale
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="h4" component="div" sx={{ mr: 1 }}>
                        {stats.average.toFixed(2)}/20
                      </Typography>
                      <TrendingUpIcon color="primary" />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={3}>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Meilleure note
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="h4" component="div" sx={{ mr: 1 }}>
                        {stats.highest.toFixed(2)}/20
                      </Typography>
                      <GradeIcon color="success" />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={3}>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Note la plus basse
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="h4" component="div" sx={{ mr: 1 }}>
                        {stats.lowest.toFixed(2)}/20
                      </Typography>
                      <GradeIcon color="error" />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={3}>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Nombre d'évaluations
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="h4" component="div" sx={{ mr: 1 }}>
                        {stats.count}
                      </Typography>
                      <SchoolIcon color="primary" />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Tableau des notes */}
            <Paper elevation={3} sx={{ p: 0, overflow: 'hidden' }}>
              <Typography variant="h6" sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
                Détail des notes
              </Typography>
              <Divider />
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Cours/Évaluation</strong></TableCell>
                      <TableCell><strong>Type</strong></TableCell>
                      <TableCell><strong>Date</strong></TableCell>
                      <TableCell align="center"><strong>Note</strong></TableCell>
                      <TableCell><strong>Commentaire</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {grades.length > 0 ? (
                      grades.map((grade) => (
                        <TableRow key={grade.id}>
                          <TableCell>{grade.course_name}</TableCell>
                          <TableCell>{grade.type}</TableCell>
                          <TableCell>{formatDate(grade.date)}</TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={`${grade.value}/${grade.max_value}`} 
                              color={getGradeColor(grade.value, grade.max_value)}
                              sx={{ fontWeight: 'bold' }}
                            />
                          </TableCell>
                          <TableCell>{grade.comment || '-'}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                          <Box sx={{ textAlign: 'center' }}>
                            <SchoolIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                            <Typography variant="h6" color="textSecondary">
                              Aucune note disponible
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </>
        )}
      </Container>
    </MainLayout>
  );
};

export default StudentGradesPage;
