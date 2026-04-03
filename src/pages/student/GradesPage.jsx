import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import {
  Grade as GradeIcon,
  School as SchoolIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';

import { useAuth } from '@/context/AuthContext';
import { getStudentPublishedGrades } from '@/api/grades';

const normalizeOn20 = (value, maxValue) => {
  const safeValue = Number(value ?? 0);
  const safeMax = Number(maxValue || 20);
  if (!safeMax) return safeValue;
  return (safeValue / safeMax) * 20;
};

const getGradeColor = (value, maxValue) => {
  const gradeOn20 = normalizeOn20(value, maxValue);
  if (gradeOn20 >= 16) return 'success';
  if (gradeOn20 >= 12) return 'info';
  if (gradeOn20 >= 10) return 'warning';
  return 'error';
};

const StudentGradesPage = () => {
  const { authState } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [grades, setGrades] = useState([]);

  useEffect(() => {
    const loadGrades = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!authState.isStudent || !authState.student?.id) {
          throw new Error('Accès non autorisé');
        }

        const { data, error: gradesError } = await getStudentPublishedGrades(authState.student.id);
        if (gradesError) {
          throw gradesError;
        }

        setGrades(data || []);
      } catch (loadError) {
        console.error('Erreur lors du chargement des notes étudiant:', loadError);
        setError(loadError.message || 'Impossible de charger vos notes pour le moment.');
        setGrades([]);
      } finally {
        setLoading(false);
      }
    };

    loadGrades();
  }, [authState.isStudent, authState.student?.id]);

  const stats = useMemo(() => {
    if (grades.length === 0) {
      return { average: 0, highest: 0, lowest: 0, count: 0 };
    }

    const values = grades.map((grade) => normalizeOn20(grade.note, grade.max_value));
    return {
      average: values.reduce((sum, value) => sum + value, 0) / values.length,
      highest: Math.max(...values),
      lowest: Math.min(...values),
      count: values.length
    };
  }, [grades]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <GradeIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          Mes notes
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Moyenne générale
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h4" sx={{ mr: 1 }}>
                  {stats.count ? stats.average.toFixed(2) : '--'}/20
                </Typography>
                <TrendingUpIcon color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Meilleure note
              </Typography>
              <Typography variant="h4">
                {stats.count ? stats.highest.toFixed(2) : '--'}/20
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Note la plus basse
              </Typography>
              <Typography variant="h4">
                {stats.count ? stats.lowest.toFixed(2) : '--'}/20
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Évaluations publiées
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h4" sx={{ mr: 1 }}>
                  {stats.count}
                </Typography>
                <SchoolIcon color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper elevation={3} sx={{ overflow: 'hidden' }}>
        <Typography variant="h6" sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
          Détail des notes publiées
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Cours</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Note</TableCell>
                <TableCell>Coefficient</TableCell>
                <TableCell>Statut</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {grades.length > 0 ? (
                grades.map((grade) => (
                  <TableRow key={grade.id}>
                    <TableCell>
                      {grade.date_evaluation
                        ? new Date(grade.date_evaluation).toLocaleDateString('fr-FR')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {grade.cours?.code || '-'}
                      </Typography>
                      {grade.cours?.name || 'Cours inconnu'}
                    </TableCell>
                    <TableCell>{grade.type_evaluation}</TableCell>
                    <TableCell>{grade.note}/{grade.max_value}</TableCell>
                    <TableCell>{grade.coefficient}</TableCell>
                    <TableCell>
                      <Chip
                        label={`${normalizeOn20(grade.note, grade.max_value).toFixed(2)}/20`}
                        color={getGradeColor(grade.note, grade.max_value)}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography color="text.secondary" sx={{ py: 2 }}>
                      Aucune note publiée pour le moment.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default StudentGradesPage;
