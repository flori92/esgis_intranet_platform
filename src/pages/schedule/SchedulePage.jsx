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
  Badge
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
 * @property {CourseSessionWithDetails[]} sessions - Sessions de cours pour ce jour
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
const SessionCard = styled(Paper)(({ theme, status }) => ({
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

const StatusChip = styled(Chip)(({ theme, status }) => ({
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
 * Page d'emploi du temps
 * @returns {JSX.Element} Composant SchedulePage
 */
const SchedulePage = () => {
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
  const isAdmin = authState.isAdmin;
  const isProfessor = authState.isProfessor;
  const isStudent = authState.isStudent;

  /**
   * Chargement des sessions de cours
   */
  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Requête de base
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
          courses:course_id (
            id,
            name,
            code,
            semester
          ),
          professors:professor_id (
            id,
            profile_id,
            full_name
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

      // Transformer les données pour l'affichage en gérant tous les cas possibles
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
        
        // Construction de l'objet session formaté avec vérifications
        return {
          id: session.id,
          date: session.date,
          duration: session.duration || 60, // Valeur par défaut si null
          room: session.room || 'Salle non définie',
          status: session.status || 'scheduled',
          course: {
            id: courseData?.id || session.course_id || null,
            name: courseData?.name || 'Cours inconnu',
            code: courseData?.code || '',
            semester: courseData?.semester || null
          },
          professor: {
            id: session.professor_id || null,
            name: professorData?.full_name || 'Professeur inconnu'
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
   * @param {Event} event - Événement de clic
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
   * @param {Event} event - Événement de changement
   * @param {number} newValue - Nouvel index d'onglet
   */
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  /**
   * Changement de cours sélectionné
   * @param {Event} event - Événement de changement
   */
  const handleCourseChange = (event) => {
    setSelectedCourse(event.target.value);
  };

  /**
   * Filtrer les sessions selon l'onglet actif
   * @returns {CourseSessionWithDetails[]} Sessions filtrées
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
   * @returns {WeekDay[]} Jours de la semaine
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
   * @param {CourseSessionWithDetails} session - Session de cours
   * @returns {JSX.Element} Carte de session
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
          
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <PersonIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2">{session.professor.name}</Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <RoomIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2">{session.room}</Typography>
          </Box>
        </Grid>
        
        <Grid item xs={12} sm={4} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'flex-start', sm: 'flex-end' }, mb: 1 }}>
            <TodayIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2">
              {format(parseISO(session.date), 'EEEE d MMMM', { locale: fr })}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'flex-start', sm: 'flex-end' }, mb: 1 }}>
            <AccessTimeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2">
              {formatTime(session.date)} - {format(addDays(parseISO(session.date), 0, session.duration * 60 * 1000), 'HH:mm')}
            </Typography>
          </Box>
          
          <StatusChip 
            label={
              session.status === 'completed' ? 'Terminé' : 
              session.status === 'cancelled' ? 'Annulé' : 
              'Programmé'
            }
            size="small"
            status={session.status}
          />
        </Grid>
      </Grid>
    </SessionCard>
  );

  /**
   * Rendu de la vue semaine
   * @returns {JSX.Element} Vue semaine
   */
  const renderWeekView = () => {
    const weekDays = getWeekDays();
    
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Button 
            variant="outlined" 
            onClick={() => handleWeekChange(-1)}
            startIcon={<TodayIcon />}
          >
            Semaine précédente
          </Button>
          
          <Typography variant="h6">
            Semaine du {format(currentWeek, 'd MMMM', { locale: fr })}
          </Typography>
          
          <Button 
            variant="outlined" 
            onClick={() => handleWeekChange(1)}
            endIcon={<TodayIcon />}
          >
            Semaine suivante
          </Button>
        </Box>
        
        <Grid container spacing={2}>
          {weekDays.map(day => (
            <Grid item xs={12} md={day.name === 'samedi' || day.name === 'dimanche' ? 6 : 12} key={day.name}>
              <Paper sx={{ p: 2, mb: 2 }}>
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
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  /**
   * Rendu de la vue liste
   * @returns {JSX.Element} Vue liste
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

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        <SchoolIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Emploi du temps
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <ViewToggle
          value={view}
          exclusive
          onChange={handleViewChange}
          aria-label="vue de l'emploi du temps"
        >
          <ToggleButton value="week" aria-label="vue semaine">
            <ViewWeek sx={{ mr: 1 }} /> Semaine
          </ToggleButton>
          <ToggleButton value="list" aria-label="vue liste">
            <ViewList sx={{ mr: 1 }} /> Liste
          </ToggleButton>
        </ViewToggle>
        
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="course-select-label">Filtrer par cours</InputLabel>
          <Select
            labelId="course-select-label"
            value={selectedCourse}
            onChange={handleCourseChange}
            label="Filtrer par cours"
            size="small"
          >
            <MenuItem value="all">Tous les cours</MenuItem>
            {courses.map(course => (
              <MenuItem key={course.id} value={course.id}>
                {course.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab 
            label={
              <Badge 
                badgeContent={getFilteredSessions().filter(s => isAfter(parseISO(s.date), new Date()) && s.status !== 'cancelled').length} 
                color="primary"
                showZero
              >
                À venir
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge 
                badgeContent={getFilteredSessions().filter(s => isBefore(parseISO(s.date), new Date()) && s.status !== 'cancelled').length} 
                color="secondary"
                showZero
              >
                Passés
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge 
                badgeContent={getFilteredSessions().filter(s => s.status === 'cancelled').length} 
                color="error"
                showZero
              >
                Annulés
              </Badge>
            } 
          />
        </Tabs>
      </Paper>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        view === 'week' ? renderWeekView() : renderListView()
      )}
    </Box>
  );
};

export default SchedulePage;
