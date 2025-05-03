import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Grid,
  Button,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
  Chip,
  SelectChangeEvent,
} from '@mui/material';
import {
  AccessTime as AccessTimeIcon,
  Room as RoomIcon,
  Person as PersonIcon,
  Today as TodayIcon,
  ViewWeek,
  ViewDay,
  ViewList,
  School as SchoolIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import supabase from '../../services/supabase';
import { CourseSessionWithDetails } from '../../types/app.types';

// Interface pour les jours de la semaine
interface WeekDay {
  date: Date;
  sessions: CourseSessionWithDetails[];
}

const SchedulePage: React.FC = () => {
  const { authState } = useAuth() as any;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weekDays, setWeekDays] = useState<WeekDay[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getWeekStartDate(new Date()));
  const [tabValue, setTabValue] = useState(0);
  const [viewMode, setViewMode] = useState<'week' | 'day' | 'list'>('week');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [sessions, setSessions] = useState<CourseSessionWithDetails[]>([]);

  // Obtenir la date de début de la semaine
  function getWeekStartDate(date: Date): Date {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Ajuster lorsque le jour est dimanche
    return new Date(date.setDate(diff));
  }

  // Générer les jours de la semaine
  function generateWeekDays(startDate: Date): WeekDay[] {
    const days: WeekDay[] = [];
    const dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

    for (let i = 0; i < 6; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push({
        date,
        sessions: [],
      });
    }

    return days;
  }

  // Charger les données de l'emploi du temps
  useEffect(() => {
    const fetchSchedule = async () => {
      setLoading(true);
      setError(null);

      try {
        await fetchCourseSessions();
        
        // Initialiser les jours de la semaine
        const days = [];
        const startDate = getWeekStartDate(currentWeekStart);
        
        for (let i = 0; i < 6; i++) {
          const date = new Date(startDate);
          date.setDate(date.getDate() + i);
          
          days.push({
            date,
            sessions: sessions.filter(session => {
              const sessionDate = new Date(session.date);
              return sessionDate.getDate() === date.getDate() &&
                     sessionDate.getMonth() === date.getMonth() &&
                     sessionDate.getFullYear() === date.getFullYear();
            })
          });
        }

        setWeekDays(days);
        setTabValue(new Date().getDay() - 1 >= 0 && new Date().getDay() - 1 < 6 ? new Date().getDay() - 1 : 0);
      } catch (error) {
        console.error('Erreur lors du chargement de l\'emploi du temps:', error);
        setError('Erreur lors du chargement de l\'emploi du temps. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [authState, currentWeekStart, selectedSemester]);

  // Charger les sessions de cours
  const fetchCourseSessions = async () => {
    setLoading(true);
    setError(null);

    try {
      // Récupérer l'ID de l'étudiant si l'utilisateur est un étudiant
      let studentId = null;
      if (authState.isStudent && authState.student) {
        const { data: studentData } = await supabase
          .from('students')
          .select('id')
          .eq('profile_id', authState.student.id)
          .single();
        
        if (studentData) {
          studentId = studentData.id;
        }
      }

      // Récupérer les cours de l'étudiant si c'est un étudiant
      let courseIds: number[] = [];
      if (studentId) {
        const { data: studentCoursesData } = await supabase
          .from('student_courses')
          .select('course_id')
          .eq('student_id', studentId);
        
        if (studentCoursesData && studentCoursesData.length > 0) {
          courseIds = studentCoursesData.map(sc => sc.course_id);
        }
      }

      // Récupérer les cours
      let { data: coursesData } = await supabase
        .from('courses')
        .select('*');
      
      if (authState.isStudent && courseIds.length > 0) {
        const { data: filteredCoursesData } = await supabase
          .from('courses')
          .select('*')
          .in('id', courseIds);
        
        coursesData = filteredCoursesData;
      }
      
      if (selectedSemester !== 'all' && coursesData) {
        coursesData = coursesData.filter(course => course.semester === parseInt(selectedSemester));
      }
      
      if (!coursesData || coursesData.length === 0) {
        setSessions([]);
        return;
      }

      const courseIds2 = coursesData.map(course => course.id);

      // Récupérer les sessions de cours
      const { data: sessionsData } = await supabase
        .from('course_sessions')
        .select(`
          id,
          date,
          duration,
          room,
          status,
          course_id,
          professor_id,
          courses (
            id,
            name,
            code
          ),
          professors (
            id,
            profile_id,
            profiles (
              full_name
            )
          )
        `)
        .in('course_id', courseIds2);
      
      if (!sessionsData || sessionsData.length === 0) {
        setSessions([]);
        return;
      }

      // Transformer les données
      const transformedSessions: CourseSessionWithDetails[] = sessionsData.map(session => ({
        id: session.id,
        course: {
          id: session.courses.id,
          name: session.courses.name,
          code: session.courses.code
        },
        professor: {
          id: session.professor_id,
          name: session.professors.profiles.full_name
        },
        date: new Date(session.date),
        duration: session.duration,
        room: session.room,
        status: session.status
      }));

      setSessions(transformedSessions);
    } catch (error) {
      console.error('Erreur lors du chargement des sessions de cours:', error);
      setError('Erreur lors du chargement des sessions de cours. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  // Gérer le changement d'onglet
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Naviguer vers la semaine précédente
  const goToPreviousWeek = () => {
    const prevWeek = new Date(currentWeekStart);
    prevWeek.setDate(prevWeek.getDate() - 7);
    setCurrentWeekStart(prevWeek);
  };

  // Naviguer vers la semaine suivante
  const goToNextWeek = () => {
    const nextWeek = new Date(currentWeekStart);
    nextWeek.setDate(nextWeek.getDate() + 7);
    setCurrentWeekStart(nextWeek);
  };

  // Revenir à la semaine actuelle
  const goToCurrentWeek = () => {
    setCurrentWeekStart(getWeekStartDate(new Date()));
  };

  // Changer le mode d'affichage
  const handleViewModeChange = (mode: 'week' | 'day' | 'list') => {
    setViewMode(mode);
  };

  // Gérer le changement de semestre
  const handleSemesterChange = (event: SelectChangeEvent<string>) => {
    setSelectedSemester(event.target.value as string);
  };

  // Formater la date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  // Formater l'heure
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Obtenir la couleur en fonction du statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return '#2196F3'; // Bleu
      case 'in_progress':
        return '#4CAF50'; // Vert
      case 'completed':
        return '#9E9E9E'; // Gris
      case 'cancelled':
        return '#F44336'; // Rouge
      default:
        return '#2196F3'; // Bleu par défaut
    }
  };

  // Obtenir le libellé du statut
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Programmé';
      case 'in_progress':
        return 'En cours';
      case 'completed':
        return 'Terminé';
      case 'cancelled':
        return 'Annulé';
      default:
        return 'Programmé';
    }
  };

  // Afficher un message de chargement
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Afficher un message d'erreur
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button variant="contained" onClick={() => window.location.reload()} sx={{ mt: 2 }}>
          Réessayer
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Emploi du temps
      </Typography>

      {/* Barre d'outils */}
      <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" onClick={goToPreviousWeek} startIcon={<TodayIcon />}>
            Semaine précédente
          </Button>
          <Button variant="contained" onClick={goToCurrentWeek} startIcon={<TodayIcon />}>
            Aujourd'hui
          </Button>
          <Button variant="outlined" onClick={goToNextWeek} startIcon={<TodayIcon />}>
            Semaine suivante
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
          <Button
            variant={viewMode === 'week' ? 'contained' : 'outlined'}
            onClick={() => handleViewModeChange('week')}
          >
            Semaine
          </Button>
          <Button
            variant={viewMode === 'day' ? 'contained' : 'outlined'}
            onClick={() => handleViewModeChange('day')}
          >
            Jour
          </Button>
          <Button
            variant={viewMode === 'list' ? 'contained' : 'outlined'}
            onClick={() => handleViewModeChange('list')}
          >
            Liste
          </Button>
        </Box>

        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Semestre</InputLabel>
          <Select
            value={selectedSemester}
            label="Semestre"
            onChange={handleSemesterChange}
          >
            <MenuItem value="all">Tous les semestres</MenuItem>
            <MenuItem value="1">Semestre 1</MenuItem>
            <MenuItem value="2">Semestre 2</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Affichage de la semaine en cours */}
      <Typography variant="h6" gutterBottom>
        Semaine du {formatDate(currentWeekStart)} au{' '}
        {formatDate(new Date(currentWeekStart.getTime() + 5 * 24 * 60 * 60 * 1000))}
      </Typography>

      {viewMode === 'week' && (
        <Paper elevation={3} sx={{ mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="fullWidth"
            indicatorColor="primary"
            textColor="primary"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            {weekDays.map((day, index) => (
              <Tab
                key={index}
                label={
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Typography variant="body1">{day.date.toLocaleDateString('fr-FR', { weekday: 'long' })}</Typography>
                    <Typography variant="body2">
                      {day.date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                    </Typography>
                  </Box>
                }
              />
            ))}
          </Tabs>

          <Box sx={{ p: 3 }}>
            {weekDays[tabValue].sessions.length > 0 ? (
              <Grid container spacing={2}>
                {weekDays[tabValue].sessions.map((session) => (
                  <Grid item xs={12} key={session.id}>
                    <Paper
                      elevation={2}
                      sx={{
                        p: 2,
                        borderLeft: `4px solid ${getStatusColor(session.status)}`,
                      }}
                    >
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="h6" component="div">
                            {session.course.name}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <SchoolIcon fontSize="small" sx={{ mr: 1 }} />
                            <Typography variant="body2">{session.course.code}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <PersonIcon fontSize="small" sx={{ mr: 1 }} />
                            <Typography variant="body2">{session.professor.name}</Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <AccessTimeIcon fontSize="small" sx={{ mr: 1 }} />
                            <Typography variant="body2">
                              {formatTime(session.date.toISOString())} - {session.duration} min
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <RoomIcon fontSize="small" sx={{ mr: 1 }} />
                            <Typography variant="body2">Salle {session.room}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                            <Chip
                              label={getStatusLabel(session.status)}
                              size="small"
                              sx={{
                                bgcolor: getStatusColor(session.status),
                                color: 'white',
                              }}
                            />
                          </Box>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1">Aucun cours programmé ce jour</Typography>
              </Box>
            )}
          </Box>
        </Paper>
      )}

      {viewMode === 'day' && (
        <Paper elevation={3} sx={{ mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="fullWidth"
            indicatorColor="primary"
            textColor="primary"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            {weekDays.map((day, index) => (
              <Tab
                key={index}
                label={
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Typography variant="body1">{day.date.toLocaleDateString('fr-FR', { weekday: 'long' })}</Typography>
                    <Typography variant="body2">
                      {day.date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                    </Typography>
                  </Box>
                }
              />
            ))}
          </Tabs>

          <Box sx={{ p: 3 }}>
            {weekDays[tabValue].sessions.length > 0 ? (
              <Box sx={{ position: 'relative', minHeight: 600 }}>
                {/* Heures */}
                <Box sx={{ position: 'absolute', left: 0, top: 0, width: 60, bottom: 0 }}>
                  {Array.from({ length: 13 }, (_, i) => i + 8).map((hour) => (
                    <Box
                      key={hour}
                      sx={{
                        position: 'absolute',
                        top: `${((hour - 8) / 12) * 100}%`,
                        left: 0,
                        right: 0,
                        borderTop: '1px solid #ddd',
                        height: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography variant="caption">{hour}:00</Typography>
                    </Box>
                  ))}
                </Box>

                {/* Sessions */}
                <Box sx={{ ml: 60, position: 'relative', height: 600 }}>
                  {weekDays[tabValue].sessions.map((session) => {
                    const startTime = new Date(session.date);
                    const startHour = startTime.getHours() + startTime.getMinutes() / 60;
                    const durationHours = session.duration / 60;
                    const top = ((startHour - 8) / 12) * 100;
                    const height = (durationHours / 12) * 100;

                    return (
                      <Paper
                        key={session.id}
                        elevation={2}
                        sx={{
                          position: 'absolute',
                          top: `${top}%`,
                          left: 0,
                          right: 0,
                          height: `${height}%`,
                          p: 1,
                          borderLeft: `4px solid ${getStatusColor(session.status)}`,
                          overflow: 'hidden',
                          '&:hover': {
                            zIndex: 10,
                            height: 'auto',
                            minHeight: `${height}%`,
                          },
                        }}
                      >
                        <Typography variant="subtitle1" noWrap>
                          {session.course.name}
                        </Typography>
                        <Typography variant="caption" display="block">
                          {formatTime(session.date.toISOString())} - {session.duration} min
                        </Typography>
                        <Typography variant="caption" display="block">
                          Salle {session.room}
                        </Typography>
                        <Typography variant="caption" display="block">
                          {session.professor.name}
                        </Typography>
                      </Paper>
                    );
                  })}
                </Box>
              </Box>
            ) : (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1">Aucun cours programmé ce jour</Typography>
              </Box>
            )}
          </Box>
        </Paper>
      )}

      {viewMode === 'list' && (
        <Paper elevation={3} sx={{ mb: 3, p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Liste des cours de la semaine
          </Typography>

          {weekDays.flatMap((day) => day.sessions).length > 0 ? (
            <Grid container spacing={2}>
              {weekDays.map((day) =>
                day.sessions.map((session) => (
                  <Grid item xs={12} key={`${day.date.toLocaleDateString('fr-FR', { weekday: 'long' })}-${session.id}`}>
                    <Paper
                      elevation={2}
                      sx={{
                        p: 2,
                        borderLeft: `4px solid ${getStatusColor(session.status)}`,
                      }}
                    >
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="h6" component="div">
                            {session.course.name}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <TodayIcon fontSize="small" sx={{ mr: 1 }} />
                            <Typography variant="body2">
                              {day.date.toLocaleDateString('fr-FR', { weekday: 'long' })} {day.date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <SchoolIcon fontSize="small" sx={{ mr: 1 }} />
                            <Typography variant="body2">{session.course.code}</Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <PersonIcon fontSize="small" sx={{ mr: 1 }} />
                            <Typography variant="body2">{session.professor.name}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <AccessTimeIcon fontSize="small" sx={{ mr: 1 }} />
                            <Typography variant="body2">
                              {formatTime(session.date.toISOString())} - {session.duration} min
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <RoomIcon fontSize="small" sx={{ mr: 1 }} />
                            <Typography variant="body2">Salle {session.room}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                            <Chip
                              label={getStatusLabel(session.status)}
                              size="small"
                              sx={{
                                bgcolor: getStatusColor(session.status),
                                color: 'white',
                              }}
                            />
                          </Box>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                ))
              )}
            </Grid>
          ) : (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1">Aucun cours programmé cette semaine</Typography>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default SchedulePage;
