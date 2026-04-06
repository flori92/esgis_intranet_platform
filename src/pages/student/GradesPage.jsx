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
  Typography,
  Tooltip,
  Stack,
  alpha
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
    <Box sx={{ p: { xs: 2, md: 4 }, backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="900" sx={{ letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: 2 }}>
          <GradeIcon color="primary" sx={{ fontSize: 40 }} />
          Mes Résultats Académiques
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Consultez vos notes par matière et suivez votre progression tout au long du semestre.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 4, borderRadius: 2 }} variant="filled">
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 4, 
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            borderTop: '6px solid #003366',
            height: '100%'
          }}>
            <CardContent p={3}>
              <Typography color="text.secondary" gutterBottom variant="caption" fontWeight="bold" sx={{ textTransform: 'uppercase' }}>
                Moyenne Générale
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 1 }}>
                <Typography variant="h3" fontWeight="900" color="primary">
                  {stats.count ? stats.average.toFixed(2) : '--'}
                </Typography>
                <Typography variant="h6" color="text.secondary">/20</Typography>
                {stats.average >= 10 && <TrendingUpIcon color="success" />}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 4, 
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            borderTop: '6px solid #4CAF50',
            height: '100%'
          }}>
            <CardContent p={3}>
              <Typography color="text.secondary" gutterBottom variant="caption" fontWeight="bold" sx={{ textTransform: 'uppercase' }}>
                Crédits Obtenus
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', mt: 1, gap: 1 }}>
                <Typography variant="h3" fontWeight="900" color="success.main">
                  {gradesByCourse.filter(c => (c.average || 0) >= 10).reduce((sum, c) => sum + (c.course?.credits || 0), 0)}
                </Typography>
                <Typography variant="h6" color="text.secondary">ECTS</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 4, 
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            borderTop: '6px solid #2196F3',
            height: '100%'
          }}>
            <CardContent p={3}>
              <Typography color="text.secondary" gutterBottom variant="caption" fontWeight="bold" sx={{ textTransform: 'uppercase' }}>
                Matières Validées
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', mt: 1, gap: 1 }}>
                <Typography variant="h3" fontWeight="900" color="info.main">
                  {gradesByCourse.filter(c => (c.average || 0) >= 10).length}
                </Typography>
                <Typography variant="h6" color="text.secondary">/ {gradesByCourse.length}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 4, 
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            borderTop: '6px solid #FF9800',
            height: '100%'
          }}>
            <CardContent p={3}>
              <Typography color="text.secondary" gutterBottom variant="caption" fontWeight="bold" sx={{ textTransform: 'uppercase' }}>
                Meilleure Note
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', mt: 1, gap: 1 }}>
                <Typography variant="h3" fontWeight="900" color="warning.main">
                  {stats.count ? stats.highest.toFixed(1) : '--'}
                </Typography>
                <Typography variant="h6" color="text.secondary">/20</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {Object.keys(gradesBySemester).sort().map(sem => (
        <Paper key={sem} sx={{ borderRadius: 5, mb: 5, overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.04)', border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ 
            p: 3, 
            background: 'linear-gradient(90deg, #003366 0%, #0052a3 100%)', 
            color: 'white', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center' 
          }}>
            <Box>
              <Typography variant="h5" fontWeight="800">Semestre {sem}</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>Session 2025-2026</Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 'bold', opacity: 0.8 }}>Moyenne Semestrielle</Typography>
              <Typography variant="h4" fontWeight="900">
                {(gradesBySemester[sem].reduce((acc, c) => acc + (c.average || 0), 0) / gradesBySemester[sem].length).toFixed(2)}
                <Typography component="span" variant="h6" sx={{ ml: 0.5, opacity: 0.8 }}>/20</Typography>
              </Typography>
            </Box>
          </Box>

          <TableContainer>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: alpha('#f8fafc', 0.8) }}>
                  <TableCell sx={{ fontWeight: 'bold', py: 2 }}>MATIÈRE</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>NOTES DÉTAILLÉES</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>MOYENNE</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>ECTS</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', pr: 3 }}>STATUT</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {gradesBySemester[sem].map((item) => (
                  <TableRow key={item.course.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell sx={{ py: 2.5 }}>
                      <Typography variant="body1" fontWeight="800" color="text.primary">{item.course.name}</Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight="bold">{item.course.code}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" useFlexGap>
                        {item.grades.map(g => (
                          <Tooltip key={g.id} title={`${g.type_evaluation || 'Évaluation'} (Coef ${g.coefficient || 1})`}>
                            <Chip 
                              label={normalizeOn20(g.note, g.max_value).toFixed(1)}
                              size="small"
                              sx={{ 
                                fontWeight: 'bold',
                                borderRadius: 1.5,
                                backgroundColor: alpha(getGradeColor(g.note, g.max_value) === 'success' ? '#4caf50' : 
                                                     getGradeColor(g.note, g.max_value) === 'info' ? '#2196f3' : 
                                                     getGradeColor(g.note, g.max_value) === 'warning' ? '#ff9800' : '#f44336', 0.1),
                                color: getGradeColor(g.note, g.max_value) === 'success' ? '#2e7d32' : 
                                       getGradeColor(g.note, g.max_value) === 'info' ? '#1565c0' : 
                                       getGradeColor(g.note, g.max_value) === 'warning' ? '#ed6c02' : '#d32f2f',
                                border: 'none'
                              }}
                            />
                          </Tooltip>
                        ))}
                      </Stack>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ 
                        display: 'inline-block', 
                        px: 1.5, py: 0.5, 
                        borderRadius: 2, 
                        backgroundColor: alpha('#003366', 0.05),
                        border: '1px solid',
                        borderColor: alpha('#003366', 0.1)
                      }}>
                        <Typography variant="body1" fontWeight="900" color="primary.main">
                          {item.average ? `${item.average.toFixed(2)}` : '-'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight="bold" color="text.secondary">{item.course.credits || '-'}</Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ pr: 3 }}>
                      <Chip 
                        label={item.average >= 10 ? 'VALIDÉ' : item.average === null ? 'EN COURS' : 'AJOURNÉ'}
                        color={item.average >= 10 ? 'success' : item.average === null ? 'default' : 'error'}
                        size="small"
                        sx={{ fontWeight: '900', fontSize: '0.7rem', borderRadius: 1.5 }}
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
