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
import { supabase } from '@/services/supabase';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * @typedef {Object} CourseSessionWithDetails
 * @property {number} id - ID de la session
 * @property {string} date - Date et heure de la session
 * @property {number} duration - Durée en minutes
 * @property {string|null} room - Salle
 * @property {string} status - Statut de la session
 * @property {Object} course - Informations sur le cours
 * @property {number} course.id - ID du cours
 * @property {string} course.name - Nom du cours
 * @property {string} course.code - Code du cours
 * @property {Object} professor - Informations sur le professeur
 * @property {number} professor.id - ID du professeur
 * @property {string} professor.name - Nom du professeur
 */

/**
 * @typedef {Object} WeekDay
 * @property {Date} date - Date du jour
 * @property {CourseSessionWithDetails[]} sessions - Sessions de cours pour ce jour
 */

/**
 * @typedef {Object} Course
 * @property {number} id - ID du cours
 * @property {string} name - Nom du cours
 * @property {string} code - Code du cours
 * @property {number} semester - Semestre du cours
 */

/**
 * @typedef {Object} SessionData
 * @property {number} id - ID de la session
 * @property {string} date - Date et heure de la session
 * @property {number} duration - Durée en minutes
 * @property {string|null} room - Salle
 * @property {string} status - Statut de la session
 * @property {number} course_id - ID du cours
 * @property {number} professor_id - ID du professeur
 * @property {Object} courses - Informations sur le cours
 * @property {number} courses.id - ID du cours
 * @property {string} courses.name - Nom du cours
 * @property {string} courses.code - Code du cours
 * @property {Object} professors - Informations sur le professeur
 * @property {number} professors.id - ID du professeur
 * @property {string} professors.profile_id - ID du profil
 * @property {Object} professors.profiles - Profil du professeur
 * @property {string} professors.profiles.full_name - Nom complet du professeur
 */

/**
 * Page d'affichage de l'emploi du temps
 * @returns {JSX.Element} Composant de la page d'emploi du temps
 */
const SchedulePage = () => {
  const { authState } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [weekDays, setWeekDays] = useState([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStartDate(new Date()));
  const [tabValue, setTabValue] = useState(0);
  const [viewMode, setViewMode] = useState('week');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [sessions, setSessions] = useState([]);

  /**
   * Obtenir la date de début de la semaine
   * @param {Date} date - Date de référence
   * @returns {Date} Date de début de la semaine
   */
  function getWeekStartDate(date) {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  }

  /**
   * Générer les jours de la semaine
   * @param {Date} startDate - Date de début de la semaine
   * @returns {WeekDay[]} Tableau des jours de la semaine
   */
  function generateWeekDays(startDate) {
    const days = [];
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
      } catch (err) {
        console.error('Erreur lors du chargement de l\'emploi du temps:', err);
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [authState, currentWeekStart, selectedSemester, sessions]);

  /**
   * Charger les sessions de cours
   */
  const fetchCourseSessions = async () => {
    try {
      // Récupérer l'ID de l'étudiant si l'utilisateur est un étudiant
      if (!authState?.user?.id) {
        throw new Error('Vous devez être connecté pour accéder à votre emploi du temps');
      }

      const isStudent = authState.role === 'student';
      const isProfessor = authState.role === 'professor';

      let query = supabase
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
            code,
            semester
          ),
          professors:users!course_sessions_professor_id_fkey (
            id,
            profile_id,
            profiles (
              full_name
            )
          )
        `);

      // Filtrer par étudiant
      if (isStudent) {
        // Récupérer les cours de l'étudiant
        const { data: studentCourses, error: studentCoursesError } = await supabase
          .from('student_courses')
          .select('course_id')
          .eq('student_id', authState.user.id);

        if (studentCoursesError) {
          throw studentCoursesError;
        }

        if (studentCourses && studentCourses.length > 0) {
          const courseIds = studentCourses.map(sc => sc.course_id);
          query = query.in('course_id', courseIds);
        } else {
          // Aucun cours pour cet étudiant
          setSessions([]);
          return;
        }
      }

      // Filtrer par professeur
      if (isProfessor) {
        query = query.eq('professor_id', authState.user.id);
      }

      // Filtrer par semestre si nécessaire
      if (selectedSemester !== 'all') {
        query = query.eq('courses.semester', parseInt(selectedSemester, 10));
      }

      // Filtrer par semaine
      const weekStart = new Date(currentWeekStart);
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      query = query
        .gte('date', weekStart.toISOString())
        .lt('date', weekEnd.toISOString())
        .order('date', { ascending: true });

      const { data: sessionsData, error: sessionsError } = await query;

      if (sessionsError) {
        throw sessionsError;
      }

      // Transformer les données pour l'affichage
      const formattedSessions = sessionsData.map(session => ({
        id: session.id,
        date: session.date,
        duration: session.duration,
        room: session.room,
        status: session.status,
        course: {
          id: session.courses.id,
          name: session.courses.name,
          code: session.courses.code,
          semester: session.courses.semester
        },
        professor: {
          id: session.professor_id,
          name: session.professors?.profiles?.full_name || 'Professeur inconnu'
        }
      }));

      setSessions(formattedSessions);
    } catch (error) {
      console.error('Erreur lors du chargement des sessions de cours:', error);
      setError(error.message || 'Une erreur est survenue lors du chargement des sessions de cours');
    }
  };

  /**
   * Gérer le changement d'onglet
   * @param {React.SyntheticEvent} _event - Événement de changement d'onglet
   * @param {number} newValue - Nouvel index d'onglet
   */
  const handleTabChange = (_event, newValue) => {
    setTabValue(newValue);
  };

  /**
   * Naviguer vers la semaine précédente
   */
  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  /**
   * Naviguer vers la semaine suivante
   */
  const goToNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  /**
   * Naviguer vers la semaine courante
   */
  const goToCurrentWeek = () => {
    setCurrentWeekStart(getWeekStartDate(new Date()));
  };

  /**
   * Gérer le changement de mode d'affichage
   * @param {React.MouseEvent<HTMLElement>} _ - Événement de clic
   * @param {string} mode - Nouveau mode d'affichage
   */
  const handleViewModeChange = (_, mode) => {
    if (mode !== null) {
      setViewMode(mode);
    }
  };

  /**
   * Gérer le changement de semestre
   * @param {Object} event - Événement de changement
   */
  const handleSemesterChange = (event) => {
    setSelectedSemester(event.target.value);
  };

  /**
   * Formater une date
   * @param {Date} date - Date à formater
   * @returns {string} Date formatée
   */
  const formatDate = (date) => {
    return format(new Date(date), 'EEEE d MMMM yyyy', { locale: fr });
  };

  /**
   * Formater une heure
   * @param {Date|string} date - Date ou chaîne de date à formater
   * @returns {string} Heure formatée
   */
  const formatTime = (date) => {
    return format(new Date(date), 'HH:mm', { locale: fr });
  };

  /**
   * Obtenir la couleur du statut
   * @param {string} status - Statut de la session
   * @returns {string} Couleur correspondante
   */
  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'primary';
      case 'in_progress':
        return 'warning';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      case 'rescheduled':
        return 'info';
      default:
        return 'default';
    }
  };

  /**
   * Obtenir le libellé du statut
   * @param {string} status - Statut de la session
   * @returns {string} Libellé correspondant
   */
  const getStatusLabel = (status) => {
    switch (status) {
      case 'scheduled':
        return 'Programmé';
      case 'in_progress':
        return 'En cours';
      case 'completed':
        return 'Terminé';
      case 'cancelled':
        return 'Annulé';
      case 'rescheduled':
        return 'Reporté';
      default:
        return 'Inconnu';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Emploi du temps
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filtres et navigation */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <Typography variant="h6">
              Semaine du {currentWeekStart.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button onClick={goToPreviousWeek} sx={{ mr: 1 }}>
                Semaine précédente
              </Button>
              <Button variant="outlined" onClick={goToCurrentWeek} sx={{ mr: 1 }}>
                Aujourd'hui
              </Button>
              <Button onClick={goToNextWeek}>
                Semaine suivante
              </Button>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <FormControl sx={{ minWidth: 120, mr: 2 }}>
                <InputLabel id="semester-select-label">Semestre</InputLabel>
                <Select
                  labelId="semester-select-label"
                  value={selectedSemester}
                  label="Semestre"
                  onChange={handleSemesterChange}
                  size="small"
                >
                  <MenuItem value="all">Tous</MenuItem>
                  <MenuItem value="1">Semestre 1</MenuItem>
                  <MenuItem value="2">Semestre 2</MenuItem>
                </Select>
              </FormControl>

              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={handleViewModeChange}
                size="small"
              >
                <ToggleButton value="week" aria-label="vue semaine">
                  <ViewWeek />
                </ToggleButton>
                <ToggleButton value="day" aria-label="vue jour">
                  <ViewDay />
                </ToggleButton>
                <ToggleButton value="list" aria-label="vue liste">
                  <ViewList />
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {viewMode === 'week' && (
            <Paper elevation={3} sx={{ mb: 3 }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                variant="fullWidth"
                sx={{ borderBottom: 1, borderColor: 'divider' }}
              >
                {weekDays.map((day, index) => (
                  <Tab
                    key={index}
                    label={
                      <Box>
                        <Typography variant="subtitle2">
                          {day.date.toLocaleDateString('fr-FR', { weekday: 'short' })}
                        </Typography>
                        <Typography variant="body2">
                          {day.date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                        </Typography>
                        <Badge
                          badgeContent={day.sessions.length}
                          color="primary"
                          sx={{ mt: 1 }}
                        />
                      </Box>
                    }
                  />
                ))}
              </Tabs>

              <Box sx={{ p: 3 }}>
                {weekDays[tabValue]?.sessions.length > 0 ? (
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
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                <PersonIcon fontSize="small" sx={{ mr: 1 }} />
                                <Typography variant="body2">{session.professor.name}</Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                <AccessTimeIcon fontSize="small" sx={{ mr: 1 }} />
                                <Typography variant="body2">
                                  {formatTime(session.date)} - {session.duration} min
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
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {formatDate(weekDays[tabValue]?.date)}
                </Typography>

                {weekDays[tabValue]?.sessions.length > 0 ? (
                  <Box>
                    {weekDays[tabValue].sessions.map((session) => (
                      <Paper
                        key={session.id}
                        elevation={2}
                        sx={{
                          p: 2,
                          mb: 2,
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
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                              <PersonIcon fontSize="small" sx={{ mr: 1 }} />
                              <Typography variant="body2">{session.professor.name}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                              <AccessTimeIcon fontSize="small" sx={{ mr: 1 }} />
                              <Typography variant="body2">
                                {formatTime(session.date)} - {session.duration} min
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
                    ))}
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
                                  {formatTime(session.date)} - {session.duration} min
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
        </>
      )}
    </Box>
  );
};

export default SchedulePage;
