import React, { useState, useMemo } from 'react';
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
import { useQuery } from '@tanstack/react-query';
import { getCourseAttendanceStats, getAllCoursesAttendanceStats } from '@/api/attendances';

const AttendanceStatsBanner = ({ courseId, courseName }) => {
  const [currentView, setCurrentView] = useState(courseId ? 'course' : 'global');
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsPerPage = 6;

  // React Query for Global Stats
  const { 
    data: globalStatsData, 
    isLoading: loadingGlobal, 
    error: globalError,
    refetch: refetchGlobal 
  } = useQuery({
    queryKey: ['allCoursesAttendanceStats'],
    queryFn: getAllCoursesAttendanceStats,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // React Query for Course Stats
  const { 
    data: courseStatsData, 
    isLoading: loadingCourse, 
    error: courseError,
    refetch: refetchCourse 
  } = useQuery({
    queryKey: ['courseAttendanceStats', courseId],
    queryFn: () => getCourseAttendanceStats(courseId),
    enabled: !!courseId && currentView === 'course',
    staleTime: 1000 * 60 * 5,
  });

  const globalStats = globalStatsData?.data || [];
  const courseStats = courseStatsData?.data || [];
  const error = currentView === 'global' ? globalError : courseError;
  const loading = currentView === 'global' ? loadingGlobal : loadingCourse;

  const activeStats = currentView === 'global' ? globalStats : courseStats;

  // ... rest of helper functions ...
  const handleNext = () => {
    const maxIndex = Math.ceil(activeStats.length / itemsPerPage) - 1;
    setCurrentIndex(prev => Math.min(prev + 1, maxIndex));
  };

  const handlePrev = () => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  };

  const getCurrentItems = () => {
    const start = currentIndex * itemsPerPage;
    return activeStats.slice(start, start + itemsPerPage);
  };

  const getTotalPages = () => Math.ceil(activeStats.length / itemsPerPage);

  const getAttendanceColor = (rate) => {
    if (rate >= 90) return 'success';
    if (rate >= 75) return 'warning';
    return 'error';
  };

  const renderStars = (rate, totalSessions) => {
    const presentCount = Math.round((rate / 100) * totalSessions);
    const stars = [];
    for (let i = 0; i < Math.min(totalSessions, 5); i++) {
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
    const totalSessions = student.total_sessions;
    const attendanceSummary = currentView === 'global' ? student.global_summary : student.attendance_summary;
    
    return (
      <Box key={student.student_id}
        sx={{
          p: 2, 
          borderRadius: 2, 
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)', 
          border: '1px solid rgba(255, 255, 255, 0.2)',
          transition: 'all 0.3s ease', 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.15)', transform: 'translateY(-2px)' }
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
            <Avatar sx={{ width: 40, height: 40, mr: 1.5, bgcolor: 'white', color: 'primary.main', fontWeight: 'bold' }}>
              {student.full_name?.charAt(0) || 'S'}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {student.full_name}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: 'block' }}>
                {student.student_number}
              </Typography>
            </Box>
            <Chip 
              label={`${attendanceRate}%`} 
              size="small" 
              color={getAttendanceColor(attendanceRate)} 
              sx={{ fontWeight: 'bold', height: 20, fontSize: '0.7rem' }} 
            />
          </Box>

          <Box sx={{ mb: 1.5 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>Taux de présence</Typography>
              <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold' }}>{attendanceSummary}</Typography>
            </Stack>
            <LinearProgress 
              variant="determinate" 
              value={attendanceRate} 
              sx={{ 
                height: 6, 
                borderRadius: 3, 
                backgroundColor: 'rgba(255,255,255,0.2)',
                '& .MuiLinearProgress-bar': {
                   borderRadius: 3,
                   backgroundColor: attendanceRate >= 90 ? '#4caf50' : attendanceRate >= 75 ? '#ff9800' : '#f44336'
                }
              }} 
            />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 'auto' }}>
          <Box sx={{ display: 'flex', gap: 0.25 }}>{renderStars(attendanceRate, totalSessions)}</Box>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)', fontStyle: 'italic' }}>
            {getAttendanceLabel(attendanceRate)}
          </Typography>
        </Box>
      </Box>
    );
  };

  return (
    <Card elevation={3} sx={{ mb: 3, background: 'linear-gradient(135deg, #003366 0%, #004080 50%, #0055aa 100%)', borderRadius: 2 }}>
      <CardContent sx={{ color: 'white', p: { xs: 2, md: 3 } }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, mb: 3 }}>
          <Box>
            <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}>Statistiques de Présence</Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.9, fontSize: { xs: '0.875rem', md: '1rem' } }}>
              {currentView === 'global' ? 'Mes Cours - Vue Globale' : (courseName || 'Cours Sélectionné')}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignSelf: { xs: 'stretch', sm: 'auto' }, justifyContent: 'flex-end' }}>
            {courseId && (
              <Button size="small" variant={currentView === 'course' ? 'contained' : 'outlined'}
                onClick={() => { setCurrentView('course'); setCurrentIndex(0); }}
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)', py: 0.5 }}>
                <SchoolIcon sx={{ mr: 1, fontSize: 16 }} /> Cours
              </Button>
            )}
            <Button size="small" variant={currentView === 'global' ? 'contained' : 'outlined'}
              onClick={() => { setCurrentView('global'); setCurrentIndex(0); }}
              sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)', py: 0.5 }}>
              <PersonIcon sx={{ mr: 1, fontSize: 16 }} /> Global
            </Button>
            <IconButton size="small" onClick={() => currentView === 'global' ? refetchGlobal() : refetchCourse()} sx={{ color: 'white' }}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6 }}>
            <CircularProgress sx={{ color: 'white', mb: 2 }} />
            <Typography variant="body2">Analyse des données en cours...</Typography>
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2, backgroundColor: 'rgba(211, 47, 47, 0.1)', color: '#ffcdd2' }}>Erreur lors du chargement des statistiques</Alert>
        ) : activeStats.length === 0 ? (
          <Alert severity="info" sx={{ mb: 2, backgroundColor: 'rgba(2, 136, 209, 0.1)', color: '#b3e5fc' }}>Aucune statistique disponible.</Alert>
        ) : (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <IconButton size="small" onClick={handlePrev} disabled={currentIndex === 0} sx={{ color: 'white', '&.Mui-disabled': { color: 'rgba(255,255,255,0.3)' } }}><ChevronLeftIcon /></IconButton>
              <Typography variant="caption" sx={{ fontWeight: 500 }}>Page {currentIndex + 1} / {getTotalPages()} — {activeStats.length} étudiants</Typography>
              <IconButton size="small" onClick={handleNext} disabled={currentIndex >= getTotalPages() - 1} sx={{ color: 'white', '&.Mui-disabled': { color: 'rgba(255,255,255,0.3)' } }}><ChevronRightIcon /></IconButton>
            </Box>

            <Grid container spacing={2} sx={{ mb: 3 }} alignItems="stretch">
              {getCurrentItems().map(student => (
                <Grid item xs={12} sm={6} md={4} key={student.student_id}>
                  {renderStudentCard(student)}
                </Grid>
              ))}
            </Grid>

            <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
              <Grid container spacing={2} justifyContent="space-around">
                <Grid item xs={4} sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' } }}>{activeStats.length}</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.65rem' }}>Étudiants</Typography>
                </Grid>
                <Grid item xs={4} sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
                    {Math.round(activeStats.reduce((acc, s) => acc + (currentView === 'global' ? s.global_attendance_rate : s.attendance_rate), 0) / activeStats.length)}%
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.65rem' }}>Moyenne</Typography>
                </Grid>
                <Grid item xs={4} sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
                    {activeStats.filter(s => (currentView === 'global' ? s.global_attendance_rate : s.attendance_rate) >= 90).length}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.65rem' }}>Assidus</Typography>
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
