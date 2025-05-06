import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import { 
  CalendarToday as CalendarIcon,
  School as SchoolIcon 
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/supabase';
import MainLayout from '@/components/layout/MainLayout';

// Import des données mock (à remplacer par des données réelles)
import { initializeMockData } from '@/utils/mockDataInitializer';

/**
 * Page d'emploi du temps pour les étudiants
 * @returns {JSX.Element} Composant de page d'emploi du temps
 */
const StudentSchedulePage = () => {
  const { authState } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [currentTab, setCurrentTab] = useState(0);

  // Jours de la semaine
  const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  useEffect(() => {
    fetchSchedule();
  }, []);

  /**
   * Récupérer l'emploi du temps
   */
  const fetchSchedule = async () => {
    setLoading(true);
    try {
      // Vérifier si l'utilisateur est connecté et est un étudiant
      if (!authState.user || !authState.isStudent) {
        throw new Error('Accès non autorisé');
      }

      // Tenter de récupérer les données depuis Supabase
      try {
        // Récupérer l'emploi du temps
        const { data, error } = await supabase
          .from('schedule')
          .select('*, professors(full_name), courses(name)')
          .eq('student_id', authState.user.id);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          setSchedule(data.map(item => ({
            id: item.id,
            course_name: item.courses?.name || 'Cours inconnu',
            professor_name: item.professors?.full_name || 'Professeur inconnu',
            day_of_week: item.day_of_week,
            start_time: item.start_time,
            end_time: item.end_time,
            room: item.room || 'Salle non spécifiée'
          })));
        } else {
          // Si aucune donnée n'est trouvée, utiliser les données mock
          const mockData = initializeMockData();
          setSchedule(mockData.schedule);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'emploi du temps:', error);
        // En cas d'erreur, utiliser les données mock
        const mockData = initializeMockData();
        setSchedule(mockData.schedule);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Formater l'heure pour l'affichage
   * @param {string} timeString - Heure au format ISO
   * @returns {string} Heure formatée
   */
  const formatTime = (timeString) => {
    try {
      // Si timeString est déjà au format HH:MM, le retourner tel quel
      if (/^\d{2}:\d{2}(:\d{2})?$/.test(timeString)) {
        return timeString.substring(0, 5);
      }
      
      // Sinon, essayer de le parser comme une date ISO
      const date = new Date(timeString);
      return format(date, 'HH:mm');
    } catch (error) {
      return timeString || 'Heure non spécifiée';
    }
  };

  /**
   * Gérer le changement d'onglet
   * @param {object} event - Événement de changement
   * @param {number} newValue - Nouvel index d'onglet
   */
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  /**
   * Filtrer les cours par jour de la semaine
   * @param {number} dayIndex - Index du jour (0-6)
   * @returns {Array} Cours filtrés
   */
  const getCoursesForDay = (dayIndex) => {
    return schedule.filter(course => course.day_of_week === dayIndex + 1)
      .sort((a, b) => {
        // Trier par heure de début
        const timeA = a.start_time;
        const timeB = b.start_time;
        return timeA.localeCompare(timeB);
      });
  };

  return (
    <MainLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <CalendarIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Emploi du temps
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : (
          <>
            <Paper elevation={3} sx={{ mb: 4 }}>
              <Tabs
                value={currentTab}
                onChange={handleTabChange}
                variant="fullWidth"
                indicatorColor="primary"
                textColor="primary"
                aria-label="jours de la semaine"
              >
                {daysOfWeek.map((day, index) => (
                  <Tab 
                    key={index} 
                    label={day} 
                    icon={<CalendarIcon />} 
                    iconPosition="start"
                  />
                ))}
              </Tabs>
            </Paper>

            {daysOfWeek.map((day, index) => (
              <Box
                key={index}
                role="tabpanel"
                hidden={currentTab !== index}
                id={`tabpanel-${index}`}
                aria-labelledby={`tab-${index}`}
              >
                {currentTab === index && (
                  <Paper elevation={3} sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      {day}
                    </Typography>
                    
                    {getCoursesForDay(index).length > 0 ? (
                      <Grid container spacing={2}>
                        {getCoursesForDay(index).map((course) => (
                          <Grid item xs={12} key={course.id}>
                            <Paper 
                              elevation={2} 
                              sx={{ 
                                p: 2, 
                                borderLeft: '4px solid', 
                                borderColor: 'primary.main' 
                              }}
                            >
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="h6" component="h3">
                                  {course.course_name}
                                </Typography>
                                <Chip 
                                  label={`${formatTime(course.start_time)} - ${formatTime(course.end_time)}`} 
                                  color="primary" 
                                  size="small" 
                                />
                              </Box>
                              
                              <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                  <Typography variant="body2" color="textSecondary">
                                    <strong>Professeur:</strong> {course.professor_name}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                  <Typography variant="body2" color="textSecondary">
                                    <strong>Salle:</strong> {course.room}
                                  </Typography>
                                </Grid>
                              </Grid>
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <SchoolIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" color="textSecondary">
                          Aucun cours ce jour
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                )}
              </Box>
            ))}
          </>
        )}
      </Container>
    </MainLayout>
  );
};

export default StudentSchedulePage;
