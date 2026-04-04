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

  const gradesByCourse = useMemo(() => {
    const map = {};
    grades.forEach(grade => {
      const courseId = grade.cours?.id || 'unknown';
      if (!map[courseId]) {
        map[courseId] = {
          course: grade.cours,
          grades: [],
          semester: grade.cours?.semester || 1
        };
      }
      map[courseId].grades.push(grade);
    });

    return Object.values(map).map(item => {
      let totalWeighted = 0;
      let totalCoef = 0;
      item.grades.forEach(g => {
        const valOn20 = normalizeOn20(g.note, g.max_value);
        totalWeighted += valOn20 * (g.coefficient || 1);
        totalCoef += (g.coefficient || 1);
      });
      return {
        ...item,
        average: totalCoef > 0 ? totalWeighted / totalCoef : null
      };
    });
  }, [grades]);

  const gradesBySemester = useMemo(() => {
    const semesters = {};
    gradesByCourse.forEach(item => {
      const sem = item.semester;
      if (!semesters[sem]) semesters[sem] = [];
      semesters[sem].push(item);
    });
    return semesters;
  }, [gradesByCourse]);

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
          Résultats Académiques
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3} sx={{ borderTop: '4px solid #003366' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="caption" fontWeight="bold">
                MOYENNE GÉNÉRALE
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Typography variant="h4" sx={{ mr: 1, fontWeight: 'bold' }}>
                  {stats.count ? stats.average.toFixed(2) : '--'}/20
                </Typography>
                <TrendingUpIcon color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3} sx={{ borderTop: '4px solid #4CAF50' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="caption" fontWeight="bold">
                CRÉDITS OBTENUS
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 1 }}>
                {gradesByCourse.filter(c => (c.average || 0) >= 10).reduce((sum, c) => sum + (c.course?.credits || 0), 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        {/* ... stats existantes ... */}
      </Grid>

      {Object.keys(gradesBySemester).sort().map(sem => (
        <Paper key={sem} elevation={2} sx={{ mb: 4, overflow: 'hidden' }}>
          <Box sx={{ p: 2, bgcolor: '#003366', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Semestre {sem}</Typography>
            <Typography variant="subtitle2">
              Moyenne Semestrielle : {(gradesBySemester[sem].reduce((acc, c) => acc + (c.average || 0), 0) / gradesBySemester[sem].length).toFixed(2)}/20
            </Typography>
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell><strong>Matière</strong></TableCell>
                  <TableCell align="center"><strong>Notes</strong></TableCell>
                  <TableCell align="center"><strong>Moyenne Matière</strong></TableCell>
                  <TableCell align="center"><strong>Crédits</strong></TableCell>
                  <TableCell align="right"><strong>Résultat</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {gradesBySemester[sem].map((item) => (
                  <TableRow key={item.course.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">{item.course.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{item.course.code}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        {item.grades.map(g => (
                          <Tooltip key={g.id} title={`${g.type_evaluation} (Coef ${g.coefficient})`}>
                            <Chip 
                              label={`${normalizeOn20(g.note, g.max_value).toFixed(1)}`}
                              size="small"
                              variant="outlined"
                              color={getGradeColor(g.note, g.max_value)}
                            />
                          </Tooltip>
                        ))}
                      </Stack>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body1" fontWeight="bold">
                        {item.average ? `${item.average.toFixed(2)}/20` : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">{item.course.credits || '-'}</TableCell>
                    <TableCell align="right">
                      <Chip 
                        label={item.average >= 10 ? 'Validé' : item.average === null ? 'En cours' : 'Ajourné'}
                        color={item.average >= 10 ? 'success' : item.average === null ? 'default' : 'error'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      ))}
    </Box>
  );
};

export default StudentGradesPage;
