import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Avatar,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Person as PersonIcon,
  CheckCircle as PresentIcon,
  Cancel as AbsentIcon,
  Schedule as LateIcon,
  Info as ExcusedIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { getCourseAttendanceStats } from '@/api/attendances';

const AttendanceStatsBanner = ({ courseId, courseName }) => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadStats = async () => {
    if (!courseId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: apiError } = await getCourseAttendanceStats(courseId);
      if (apiError) throw apiError;
      setStats(data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques:', err);
      setError('Impossible de charger les statistiques de présence');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [courseId]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present': return <PresentIcon fontSize="small" sx={{ color: 'success.main' }} />;
      case 'absent': return <AbsentIcon fontSize="small" sx={{ color: 'error.main' }} />;
      case 'late': return <LateIcon fontSize="small" sx={{ color: 'warning.main' }} />;
      case 'excused': return <ExcusedIcon fontSize="small" sx={{ color: 'info.main' }} />;
      default: return null;
    }
  };

  const getAttendanceColor = (rate) => {
    if (rate >= 90) return 'success';
    if (rate >= 75) return 'warning';
    return 'error';
  };

  const renderStars = (rate, totalSessions) => {
    const presentCount = Math.round((rate / 100) * totalSessions);
    const stars = [];
    
    for (let i = 0; i < totalSessions; i++) {
      if (i < presentCount) {
        stars.push(<StarIcon key={i} fontSize="small" sx={{ color: 'gold' }} />);
      } else {
        stars.push(<StarBorderIcon key={i} fontSize="small" sx={{ color: 'grey.400' }} />);
      }
    }
    
    return stars;
  };

  const getAttendanceLabel = (rate) => {
    if (rate === 100) return 'Parfait';
    if (rate >= 90) return 'Excellent';
    if (rate >= 75) return 'Bon';
    if (rate >= 50) return 'Moyen';
    return 'Faible';
  };

  if (!courseId) {
    return (
      <Alert severity="info" sx={{ mb: 3 }}>
        Veuillez sélectionner un cours pour voir les statistiques de présence.
      </Alert>
    );
  }

  return (
    <Card elevation={3} sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <CardContent sx={{ color: 'white' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Statistiques de Présence
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
              {courseName || 'Cours'}
            </Typography>
          </Box>
          <IconButton onClick={loadStats} sx={{ color: 'white' }} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress sx={{ color: 'white' }} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        ) : stats.length === 0 ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            Aucune statistique disponible pour ce cours.
          </Alert>
        ) : (
          <>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {stats.slice(0, 6).map((student, index) => (
                <Grid item xs={12} sm={6} md={4} key={student.student_id}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ width: 40, height: 40, mr: 2, bgcolor: 'white', color: 'primary.main' }}>
                        {student.full_name?.charAt(0) || 'S'}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ color: 'white' }}>
                          {student.full_name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                          {student.student_number}
                        </Typography>
                      </Box>
                      <Chip
                        label={`${student.attendance_rate}%`}
                        size="small"
                        color={getAttendanceColor(student.attendance_rate)}
                        sx={{ fontWeight: 'bold' }}
                      />
                    </Box>

                    <Box sx={{ mb: 1 }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', mb: 0.5, display: 'block' }}>
                        {student.attendance_summary}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={student.attendance_rate}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: 'rgba(255,255,255,0.2)',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 3,
                            backgroundColor: student.attendance_rate >= 90 ? '#4caf50' :
                                              student.attendance_rate >= 75 ? '#ff9800' : '#f44336'
                          }
                        }}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {renderStars(student.attendance_rate, student.total_sessions)}
                      </Box>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                        {getAttendanceLabel(student.attendance_rate)}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      {student.present_count > 0 && (
                        <Tooltip title={`${student.present_count} présences`}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <PresentIcon fontSize="small" sx={{ color: '#4caf50' }} />
                            <Typography variant="caption" sx={{ color: 'white' }}>
                              {student.present_count}
                            </Typography>
                          </Box>
                        </Tooltip>
                      )}
                      {student.absent_count > 0 && (
                        <Tooltip title={`${student.absent_count} absences`}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <AbsentIcon fontSize="small" sx={{ color: '#f44336' }} />
                            <Typography variant="caption" sx={{ color: 'white' }}>
                              {student.absent_count}
                            </Typography>
                          </Box>
                        </Tooltip>
                      )}
                      {student.late_count > 0 && (
                        <Tooltip title={`${student.late_count} retards`}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <LateIcon fontSize="small" sx={{ color: '#ff9800' }} />
                            <Typography variant="caption" sx={{ color: 'white' }}>
                              {student.late_count}
                            </Typography>
                          </Box>
                        </Tooltip>
                      )}
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>

            {stats.length > 6 && (
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  ... et {stats.length - 6} autres étudiants
                </Typography>
              </Box>
            )}

            <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: 'white' }}>
                      {stats.length}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      Étudiants
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: 'white' }}>
                      {stats[0]?.total_sessions || 0}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      Séances totales
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: 'white' }}>
                      {Math.round(stats.reduce((acc, s) => acc + s.attendance_rate, 0) / stats.length)}%
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      Présence moyenne
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: 'white' }}>
                      {stats.filter(s => s.attendance_rate === 100).length}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      Présence parfaite
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AttendanceStatsBanner;
