import React, { useState, useEffect, useRef } from 'react';
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
  CircularProgress,
  Button
} from '@mui/material';
import {
  Person as PersonIcon,
  CheckCircle as PresentIcon,
  Cancel as AbsentIcon,
  Schedule as LateIcon,
  Info as ExcusedIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Refresh as RefreshIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  School as SchoolIcon
} from '@mui/icons-material';
import { getCourseAttendanceStats, getAllCoursesAttendanceStats } from '@/api/attendances';

const AttendanceStatsBanner = ({ courseId, courseName }) => {
  const [globalStats, setGlobalStats] = useState([]);
  const [courseStats, setCourseStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState('global'); // 'global' or 'course'
  
  // Carrousel state
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsPerPage = 6;

  const loadGlobalStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: apiError } = await getAllCoursesAttendanceStats();
      if (apiError) throw apiError;
      setGlobalStats(data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques globales:', err);
      setError('Impossible de charger les statistiques globales');
    } finally {
      setLoading(false);
    }
  };

  const loadCourseStats = async () => {
    if (!courseId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: apiError } = await getCourseAttendanceStats(courseId);
      if (apiError) throw apiError;
      setCourseStats(data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques du cours:', err);
      setError('Impossible de charger les statistiques de présence');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGlobalStats();
  }, []);

  useEffect(() => {
    if (courseId) {
      loadCourseStats();
      setCurrentView('course');
    } else {
      setCurrentView('global');
    }
  }, [courseId]);

  // Carrousel navigation
  const handleNext = () => {
    const maxIndex = Math.ceil((currentView === 'global' ? globalStats : courseStats).length / itemsPerPage) - 1;
    setCurrentIndex(prev => Math.min(prev + 1, maxIndex));
  };

  const handlePrev = () => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  };

  const getCurrentItems = () => {
    const stats = currentView === 'global' ? globalStats : courseStats;
    const start = currentIndex * itemsPerPage;
    return stats.slice(start, start + itemsPerPage);
  };

  const getTotalPages = () => {
    const stats = currentView === 'global' ? globalStats : courseStats;
    return Math.ceil(stats.length / itemsPerPage);
  };

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

  const renderStudentCard = (student) => {
    const attendanceRate = currentView === 'global' ? student.global_attendance_rate : student.attendance_rate;
    const totalSessions = currentView === 'global' ? student.total_sessions : student.total_sessions;
    const attendanceSummary = currentView === 'global' ? student.global_summary : student.attendance_summary;
    
    return (
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
            label={`${attendanceRate}%`}
            size="small"
            color={getAttendanceColor(attendanceRate)}
            sx={{ fontWeight: 'bold' }}
          />
        </Box>

        <Box sx={{ mb: 1 }}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', mb: 0.5, display: 'block' }}>
            {attendanceSummary}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={attendanceRate}
            sx={{
              height: 6,
              borderRadius: 3,
              backgroundColor: 'rgba(255,255,255,0.2)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
                backgroundColor: attendanceRate >= 90 ? '#4caf50' :
                                  attendanceRate >= 75 ? '#ff9800' : '#f44336'
              }
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {renderStars(attendanceRate, Math.min(totalSessions, 5))}
          </Box>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            {getAttendanceLabel(attendanceRate)}
          </Typography>
        </Box>

        {/* Afficher les cours si vue globale */}
        {currentView === 'global' && student.courses && student.courses.length > 0 && (
          <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', mb: 0.5, display: 'block' }}>
              Cours ({student.courses.length}):
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {student.courses.slice(0, 3).map((course, idx) => (
                <Chip
                  key={idx}
                  label={`${course.course_code}: ${course.attendance_rate}%`}
                  size="small"
                  variant="outlined"
                  sx={{
                    fontSize: '0.6rem',
                    height: 20,
                    color: 'white',
                    borderColor: 'rgba(255,255,255,0.3)',
                    '& .MuiChip-label': { color: 'white' }
                  }}
                />
              ))}
              {student.courses.length > 3 && (
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                  +{student.courses.length - 3}
                </Typography>
              )}
            </Box>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Card elevation={3} sx={{ mb: 3, background: 'linear-gradient(135deg, #003366 0%, #004080 50%, #0055aa 100%)' }}>
      <CardContent sx={{ color: 'white' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Statistiques de Présence
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
              {currentView === 'global' ? 'Vue Globale - Tous les cours' : (courseName || 'Cours')}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {courseId && (
              <Button
                size="small"
                variant={currentView === 'course' ? 'contained' : 'outlined'}
                onClick={() => setCurrentView('course')}
                sx={{ 
                  color: 'white', 
                  borderColor: 'rgba(255,255,255,0.5)',
                  '&:hover': { borderColor: 'white' }
                }}
              >
                <SchoolIcon sx={{ mr: 1, fontSize: 16 }} />
                Cours
              </Button>
            )}
            <Button
              size="small"
              variant={currentView === 'global' ? 'contained' : 'outlined'}
              onClick={() => setCurrentView('global')}
              sx={{ 
                color: 'white', 
                borderColor: 'rgba(255,255,255,0.5)',
                '&:hover': { borderColor: 'white' }
              }}
            >
              <PersonIcon sx={{ mr: 1, fontSize: 16 }} />
              Global
            </Button>
            <IconButton onClick={currentView === 'global' ? loadGlobalStats : loadCourseStats} sx={{ color: 'white' }} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress sx={{ color: 'white' }} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        ) : (currentView === 'global' ? globalStats : courseStats).length === 0 ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            {currentView === 'global' ? 'Aucune statistique globale disponible.' : 'Aucune statistique disponible pour ce cours.'}
          </Alert>
        ) : (
          <>
            {/* Carrousel Navigation */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <IconButton 
                onClick={handlePrev} 
                disabled={currentIndex === 0}
                sx={{ color: 'white', opacity: currentIndex === 0 ? 0.5 : 1 }}
              >
                <ChevronLeftIcon />
              </IconButton>
              
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                Page {currentIndex + 1} / {getTotalPages()} ({(currentView === 'global' ? globalStats : courseStats).length} étudiants)
              </Typography>
              
              <IconButton 
                onClick={handleNext} 
                disabled={currentIndex >= getTotalPages() - 1}
                sx={{ color: 'white', opacity: currentIndex >= getTotalPages() - 1 ? 0.5 : 1 }}
              >
                <ChevronRightIcon />
              </IconButton>
            </Box>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              {getCurrentItems().map((student, index) => (
                <Grid item xs={12} sm={6} md={4} key={student.student_entity_id || student.student_id}>
                  {renderStudentCard(student)}
                </Grid>
              ))}
            </Grid>

            {/* Page Indicators */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 3 }}>
              {Array.from({ length: getTotalPages() }).map((_, index) => (
                <Box
                  key={index}
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: index === currentIndex ? 'white' : 'rgba(255,255,255,0.3)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.6)'
                    }
                  }}
                  onClick={() => setCurrentIndex(index)}
                />
              ))}
            </Box>

            {/* Statistics Summary */}
            <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: 'white' }}>
                      {(currentView === 'global' ? globalStats : courseStats).length}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      Étudiants
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: 'white' }}>
                      {currentView === 'global' 
                        ? globalStats.reduce((acc, s) => acc + s.total_sessions, 0)
                        : courseStats[0]?.total_sessions || 0
                      }
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      Séances totales
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: 'white' }}>
                      {Math.round(
                        (currentView === 'global' ? globalStats : courseStats)
                          .reduce((acc, s) => acc + (currentView === 'global' ? s.global_attendance_rate : s.attendance_rate), 0) / 
                        (currentView === 'global' ? globalStats : courseStats).length
                      )}%
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      Présence moyenne
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: 'white' }}>
                      {(currentView === 'global' ? globalStats : courseStats)
                        .filter(s => (currentView === 'global' ? s.global_attendance_rate : s.attendance_rate) === 100).length
                      }
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
