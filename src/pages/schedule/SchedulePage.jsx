import React, { useState, useEffect } from 'react';
import Badge from '@mui/material/Badge';
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
import { supabase } from '../../supabase';
import { format, parseISO, isBefore, isAfter, startOfWeek, addDays, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { styled } from '@mui/material/styles';

/**
 * @typedef {Object} CourseSessionWithDetails
 * @property {string} id - ID de la session
 * @property {string} date - Date de la session
 * @property {number} duration - Durée en minutes
 * @property {string} room - Salle
 * @property {string} status - Statut (scheduled, completed, cancelled)
 * @property {Object} course - Informations sur le cours
 * @property {string} course.id - ID du cours
 * @property {string} course.name - Nom du cours
 * @property {string} course.code - Code du cours
 * @property {string} course.semester - Semestre
 * @property {Object} professor - Informations sur le professeur
 * @property {string} professor.id - ID du professeur
 * @property {string} professor.name - Nom complet du professeur
 */

/**
 * @typedef {Object} WeekDay
 * @property {Date} date - Date du jour
 * @property {string} name - Nom du jour
 * @property {Array} sessions - Sessions de cours pour ce jour
 */

/**
 * @typedef {Object} Course
 * @property {string} id - ID du cours
 * @property {string} name - Nom du cours
 */

/**
 * @typedef {Object} SessionData
 * @property {string} id - ID de la session
 * @property {string} date - Date de la session
 * @property {number} duration - Durée en minutes
 * @property {string} room - Salle
 * @property {string} status - Statut
 * @property {string} course_id - ID du cours
 * @property {string} professor_id - ID du professeur
 * @property {Object|Array} courses - Informations sur le cours
 * @property {Object|Array} professors - Informations sur le professeur
 */

// Styles personnalisés
/**
 * Carte de session qui accepte une prop 'status' pour le style
 */
const SessionCard = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'status',
})(({ theme, status }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  borderLeft: `5px solid ${
    status === 'completed'
      ? theme.palette.success.main
      : status === 'cancelled'
        ? theme.palette.error.main
        : theme.palette.primary.main
  }`,
  backgroundColor: status === 'cancelled' ? '#fff5f5' : 'white',
  opacity: status === 'cancelled' ? 0.8 : 1,
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[3],
  },
}));

const ViewToggle = styled(ToggleButtonGroup)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

/**
 * Puce de statut qui accepte une prop 'status' pour le style
 */
const StatusChip = styled(Chip, {
  shouldForwardProp: (prop) => prop !== 'status',
})(({ theme, status }) => ({
  backgroundColor:
    status === 'completed'
      ? theme.palette.success.light
      : status === 'cancelled'
        ? theme.palette.error.light
        : theme.palette.primary.light,
  color:
    status === 'completed'
      ? theme.palette.success.contrastText
      : status === 'cancelled'
        ? theme.palette.error.contrastText
        : theme.palette.primary.contrastText,
}));

/**
 * Page principale d'emploi du temps ESGIS
 * @returns {React.ReactElement} Composant SchedulePage
 */
const SchedulePage = () => {
  // Hooks d'état
  const { authState } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('week');
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [tabValue, setTabValue] = useState(0);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('all');

  // Déterminer le rôle de l'utilisateur
  const { isAdmin, isProfessor, isStudent } = authState;

  /**
   * Chargement des sessions de cours depuis Supabase
   */
  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('course_sessions')
        .select(`
          id, date, duration, room, status, course_id, professor_id, 
          courses:course_id (id, name, code, semester), 
          professors:professor_id (id, profile_id, full_name)
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

        // Si l'étudiant a des cours, filtrer les sessions par ces cours
        if (studentCourses && studentCourses.length > 0) {
          const courseIds = studentCourses.map(sc => sc.course_id);
          query = query.in('course_id', courseIds);
        }
      }

      // Filtrer par professeur
      if (isProfessor) {
        query = query.eq('professor_id', authState.user.id);
      }

      // Filtrer par cours sélectionné
      if (selectedCourse !== 'all') {
        query = query.eq('course_id', selectedCourse);
      }

      // Exécuter la requête
      const { data: sessionsData, error: sessionsError } = await query;

      if (sessionsError) {
        throw sessionsError;
      }

      // Transformer les données pour l'affichage
      const formattedSessions = sessionsData.map(session => {
        // Gestion sécurisée des données de cours
        let courseData = null;
        if (session.courses) {
          if (Array.isArray(session.courses)) {
            courseData = session.courses.length > 0 ? session.courses[0] : null;
          } else {
            courseData = session.courses;
          }
        }
        
        // Gestion sécurisée des données de professeur
        let professorData = null;
        if (session.professors) {
          if (Array.isArray(session.professors)) {
            professorData = session.professors.length > 0 ? session.professors[0] : null;
          } else {
            professorData = session.professors;
          }
        }
        
        // Construction de l'objet session formaté
        return {
          id: session.id,
          date: session.date,
          duration: session.duration,
          room: session.room,
          status: session.status,
          course: {
            id: courseData?.id,
            name: courseData?.name || 'Cours inconnu',
            code: courseData?.code || '',
            semester: courseData?.semester || ''
          },
          professor: {
            id: professorData?.id,
            name: professorData?.full_name || professorData?.name || 'Professeur inconnu'
          }
        };
      });

      setSessions(formattedSessions);
      
      // Extraire la liste des cours uniques pour le filtre
      const uniqueCourses = [...new Set(formattedSessions.map(s => JSON.stringify({
        id: s.course.id,
        name: s.course.name
      })))].map(s => JSON.parse(s)).filter(c => c.id);
      
      setCourses(uniqueCourses);
    } catch (error) {
      console.error('Erreur lors du chargement des sessions de cours:', error);
      setError('Impossible de charger l\'emploi du temps. Veuillez réessayer plus tard.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Chargement initial des données
   */
  useEffect(() => {
    fetchSessions();
  }, [authState.user, selectedCourse]);

  /**
   * Changement de vue (semaine, jour, liste)
   * @param {React.SyntheticEvent} event - Événement de clic
   * @param {string} newView - Nouvelle vue
   */
  const handleViewChange = (event, newView) => {
    if (newView !== null) {
      setView(newView);
    }
  };

  /**
   * Changement de semaine
   * @param {number} direction - Direction (1: semaine suivante, -1: semaine précédente)
   */
  const handleWeekChange = (direction) => {
    setCurrentWeek(prevWeek => {
      const newWeek = new Date(prevWeek);
      newWeek.setDate(newWeek.getDate() + (7 * direction));
      return newWeek;
    });
  };

  /**
   * Changement d'onglet (à venir, passés, annulés)
   * @param {React.SyntheticEvent} event - Événement de changement
   * @param {number} newValue - Nouvel index d'onglet
   */
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  /**
   * Changement de cours sélectionné
   * @param {React.ChangeEvent} event - Événement de changement
   */
  const handleCourseChange = (event) => {
    setSelectedCourse(event.target.value);
  };

  /**
   * Filtrer les sessions selon l'onglet actif
   * @returns {Array} Sessions filtrées
   */
  const getFilteredSessions = () => {
    const now = new Date();
  
    switch (tabValue) {
      case 0: // À venir
        return sessions.filter(session => 
          isAfter(parseISO(session.date), now) && 
          session.status !== 'cancelled'
        );
      case 1: // Passés
        return sessions.filter(session => 
          isBefore(parseISO(session.date), now) && 
          session.status !== 'cancelled'
        );
      case 2: // Annulés
        return sessions.filter(session => 
          session.status === 'cancelled'
        );
      default:
        return sessions;
    }
  };

  /**
   * Obtenir les jours de la semaine courante
   * @returns {Array} Jours de la semaine avec leurs sessions associées
   */
  const getWeekDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(currentWeek, i);
      days.push({
        date,
        name: format(date, 'EEEE', { locale: fr }),
        sessions: getFilteredSessions().filter(session => 
          isSameDay(parseISO(session.date), date)
        )
      });
    }
    return days;
  };

  /**
   * Formater la date et l'heure
   * @param {string} dateString - Date au format ISO
   * @returns {string} Date formatée
   */
  const formatDateTime = (dateString) => {
    const date = parseISO(dateString);
    return format(date, 'EEEE d MMMM yyyy à HH:mm', { locale: fr });
  };

  /**
   * Formater l'heure
   * @param {string} dateString - Date au format ISO
   * @returns {string} Heure formatée
   */
  const formatTime = (dateString) => {
    const date = parseISO(dateString);
    return format(date, 'HH:mm', { locale: fr });
  };

  /**
   * Rendu d'une session de cours
   * @param {Object} session - Session de cours
   * @returns {React.ReactElement} Carte de session
   */
  const renderSessionCard = (session) => (
    <SessionCard key={session.id} status={session.status} elevation={2}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={8}>
          <Typography variant="h6" component="h3">
            {session.course.name}
            {session.course.code && (
              <Typography variant="caption" sx={{ ml: 1 }}>
                ({session.course.code})
              </Typography>
            )}
          </Typography>
          <StatusChip 
            label={session.status === 'completed' ? 'Terminé' : session.status === 'cancelled' ? 'Annulé' : 'Programmé'}
            size="small"
            status={session.status}
          />
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccessTimeIcon fontSize="small" color="action" />
              <Typography variant="body2">
                {formatDateTime(session.date)} ({session.duration} min)
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <RoomIcon fontSize="small" color="action" />
              <Typography variant="body2">{session.room}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonIcon fontSize="small" color="action" />
              <Typography variant="body2">{session.professor.name || session.professor.full_name}</Typography>
            </Box>
          </Box>
        </Grid>
        <Grid item xs={12} sm={4} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
          <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            {formatTime(session.date)}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Durée: {session.duration} min
          </Typography>
        </Grid>
      </Grid>
    </SessionCard>
  );

  /**
   * Rendu de la vue semaine
   * @returns {React.ReactElement} Vue semaine
   */
  const renderWeekView = () => {
    const weekDays = getWeekDays();
    
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Button 
            startIcon={<TodayIcon />}
            onClick={() => setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }))}
            variant="outlined"
            size="small"
          >
            Semaine actuelle
          </Button>
          <Box>
            <Button onClick={() => handleWeekChange(-1)} sx={{ mr: 1 }}>
              Semaine précédente
            </Button>
            <Button onClick={() => handleWeekChange(1)}>
              Semaine suivante
            </Button>
          </Box>
        </Box>
        <Grid container spacing={2}>
          {weekDays.map(day => (
            <Grid item xs={12} md={day.name === 'samedi' || day.name === 'dimanche' ? 6 : 12} key={day.name}>
              <Box sx={{ p: 2, mb: 2, borderRadius: 2, boxShadow: 1, bgcolor: 'background.paper' }}>
                <Typography variant="h6" sx={{ mb: 2, textTransform: 'capitalize' }}>
                  {day.name} {format(day.date, 'd MMMM', { locale: fr })}
                </Typography>
                {day.sessions.length > 0 ? (
                  day.sessions.map(session => renderSessionCard(session))
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                    Aucun cours programmé ce jour
                  </Typography>
                )}
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  /**
   * Rendu de la vue jour
   * @returns {React.ReactElement} Vue jour
   */
  const renderDayView = () => (
    <Box>
      <Typography variant="h6" color="error">
        Vue Jour - À implémenter
      </Typography>
    </Box>
  );

  /**
   * Rendu de la vue liste
   * @returns {React.ReactElement} Vue liste
   */
  const renderListView = () => {
    const filteredSessions = getFilteredSessions();
    return (
      <Box>
        {filteredSessions.length > 0 ? (
          filteredSessions.map(session => renderSessionCard(session))
        ) : (
          <Typography variant="body1" sx={{ textAlign: 'center', py: 4 }}>
            Aucun cours {tabValue === 0 ? 'à venir' : tabValue === 1 ? 'passé' : 'annulé'} pour le moment
          </Typography>
        )}
      </Box>
    );
  };

  // Rendu principal (JSX)
  return (
    <Box sx={{ py: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Emploi du temps
        </Typography>

        {isAdmin || isProfessor ? (
          <Button
            variant="contained"
            color="primary"
            startIcon={<SchoolIcon />}
            href="/schedule/manage"
          >
            Gérer les cours
          </Button>
        ) : null}
      </Box>

      <Box sx={{ mb: 3 }}>
        <FormControl sx={{ minWidth: 200, mr: 2 }}>
          <InputLabel id="course-select-label">Cours</InputLabel>
          <Select
            labelId="course-select-label"
            id="course-select"
            value={selectedCourse}
            onChange={handleCourseChange}
            label="Cours"
          >
            <MenuItem value="all">Tous les cours</MenuItem>
            {courses.map(course => (
              <MenuItem key={course.id} value={course.id}>
                {course.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <ViewToggle
          value={view}
          exclusive
          onChange={handleViewChange}
          aria-label="vue emploi du temps"
        >
          <ToggleButton value="week" aria-label="vue semaine">
            <ViewWeek sx={{ mr: 1 }} />
            Semaine
          </ToggleButton>
          <ToggleButton value="day" aria-label="vue jour">
            <ViewDay sx={{ mr: 1 }} />
            Jour
          </ToggleButton>
          <ToggleButton value="list" aria-label="vue liste">
            <ViewList sx={{ mr: 1 }} />
            Liste
          </ToggleButton>
        </ViewToggle>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              aria-label="filtres de sessions"
            >
              <Tab 
                label={
                  <Badge badgeContent={getFilteredSessions().filter(s => isAfter(parseISO(s.date), new Date()) && s.status !== 'cancelled').length} 
                    color="primary">
                    À venir
                  </Badge>
                } 
              />
              <Tab 
                label={
                  <Badge badgeContent={getFilteredSessions().filter(s => isBefore(parseISO(s.date), new Date()) && s.status !== 'cancelled').length} 
                    color="success">
                    Passés
                  </Badge>
                } 
              />
              <Tab 
                label={
                  <Badge badgeContent={getFilteredSessions().filter(s => s.status === 'cancelled').length} 
                    color="error">
                    Annulés
                  </Badge>
                } 
              />
            </Tabs>
          </Box>
          
          {view === 'week' && renderWeekView()}
          {view === 'day' && renderDayView()}
          {view === 'list' && renderListView()}
        </Box>
      )}
    </Box>
  );
};

export default SchedulePage;
