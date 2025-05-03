import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Button,
  Tabs,
  Tab,
  Alert,
  Chip,
} from '@mui/material';
import {
  School as SchoolIcon,
  Event as EventIcon,
  Assignment as AssignmentIcon,
  People as PeopleIcon,
  Notifications as NotificationsIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import { useAuth, AuthContextType } from '../../context/AuthContext';
import supabase from '../../services/supabase';
import { Database } from '../../types/database';

// Types pour les statistiques
interface DashboardStats {
  totalCourses: number;
  totalStudents: number;
  upcomingExams: number;
  pendingGrades: number;
}

// Types pour les cours
interface Course {
  id: number;
  name: string;
  code: string;
  department_id: number;
  department_name: string;
  students_count: number;
  next_session: string | null;
  room: string | null;
}

// Types pour les notifications
interface Notification {
  id: number;
  title: string;
  content: string;
  created_at: string;
  priority: 'high' | 'medium' | 'low';
  read: boolean;
}

// Types pour les examens
interface Exam {
  id: number;
  course_id: number;
  course_name: string;
  date: string;
  duration: number;
  room: string;
  type: 'midterm' | 'final' | 'quiz';
  status: 'upcoming' | 'completed' | 'graded';
}

const ProfessorDashboardPage: React.FC = () => {
  const { authState } = useAuth() as AuthContextType;
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  // Vérifier si l'utilisateur est un professeur
  useEffect(() => {
    if (!authState.isProfessor) {
      // Rediriger vers la page d'accueil si l'utilisateur n'est pas un professeur
      window.location.href = '/';
    }
  }, [authState.isProfessor]);

  // Charger les données du tableau de bord
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        if (!authState.user || !authState.professor) {
          throw new Error('Informations du professeur non disponibles');
        }

        const professorId = authState.professor.id;

        // Récupérer les cours du professeur
        const { data: coursesData, error: coursesError } = await supabase
          .from('professor_courses')
          .select(`
            course_id,
            courses (
              id,
              name,
              code,
              department_id,
              departments (name)
            )
          `)
          .eq('professor_id', professorId);

        if (coursesError) throw coursesError;

        // Transformer les données des cours
        const transformedCourses: Course[] = [];
        
        if (coursesData) {
          for (const item of coursesData) {
            const course = item.courses;
            
            // Récupérer le nombre d'étudiants pour ce cours
            const { count: studentsCount } = await supabase
              .from('student_courses')
              .select('*', { count: 'exact', head: true })
              .eq('course_id', course.id);

            // Récupérer la prochaine session pour ce cours
            const { data: nextSessionData } = await supabase
              .from('course_sessions')
              .select('date, room')
              .eq('course_id', course.id)
              .gte('date', new Date().toISOString())
              .order('date', { ascending: true })
              .limit(1)
              .single();

            transformedCourses.push({
              id: course.id,
              name: course.name,
              code: course.code,
              department_id: course.department_id,
              department_name: course.departments.name,
              students_count: studentsCount || 0,
              next_session: nextSessionData?.date || null,
              room: nextSessionData?.room || null,
            });
          }
        }

        setCourses(transformedCourses);

        // Récupérer les statistiques
        const totalCourses = transformedCourses.length;

        // Calculer le nombre total d'étudiants (sans doublons)
        let totalStudents = 0;
        if (transformedCourses.length > 0) {
          const courseIds = transformedCourses.map(course => course.id);
          const { data: uniqueStudents } = await supabase
            .from('student_courses')
            .select('student_id')
            .in('course_id', courseIds);

          // Utiliser un Set pour éliminer les doublons
          const uniqueStudentIds = new Set(uniqueStudents?.map(item => item.student_id));
          totalStudents = uniqueStudentIds.size;
        }

        // Récupérer le nombre d'examens à venir
        const { count: upcomingExams } = await supabase
          .from('exams')
          .select('*', { count: 'exact', head: true })
          .in('course_id', transformedCourses.map(course => course.id))
          .gte('date', new Date().toISOString())
          .eq('status', 'upcoming');

        // Récupérer le nombre de notes en attente
        const { count: pendingGrades } = await supabase
          .from('exam_results')
          .select('*', { count: 'exact', head: true })
          .in('course_id', transformedCourses.map(course => course.id))
          .is('grade', null);

        setStats({
          totalCourses,
          totalStudents,
          upcomingExams: upcomingExams || 0,
          pendingGrades: pendingGrades || 0,
        });

        // Récupérer les notifications
        const { data: notificationsData, error: notificationsError } = await supabase
          .from('notifications')
          .select('*')
          .or(`recipient_id.eq.${authState.user.id},recipient_role.eq.professor`)
          .order('created_at', { ascending: false })
          .limit(5);

        if (notificationsError) throw notificationsError;
        setNotifications(notificationsData || []);

        // Récupérer les examens à venir
        const { data: examsData, error: examsError } = await supabase
          .from('exams')
          .select(`
            id,
            course_id,
            courses (name),
            date,
            duration,
            room,
            type,
            status
          `)
          .in('course_id', transformedCourses.map(course => course.id))
          .order('date', { ascending: true })
          .limit(5);

        if (examsError) throw examsError;

        // Transformer les données des examens
        const transformedExams = examsData?.map(exam => ({
          id: exam.id,
          course_id: exam.course_id,
          course_name: exam.courses.name,
          date: exam.date,
          duration: exam.duration,
          room: exam.room,
          type: exam.type,
          status: exam.status,
        })) || [];

        setExams(transformedExams);
      } catch (error) {
        console.error('Erreur lors du chargement des données du tableau de bord:', error);
        setError('Erreur lors du chargement des données. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [authState.user, authState.professor, authState.isProfessor]);

  // Gérer le changement d'onglet
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Formater la date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  // Formater l'heure
  const formatTime = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
    };
    return new Date(dateString).toLocaleTimeString('fr-FR', options);
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
        Tableau de bord professeur
      </Typography>

      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Vue d'ensemble" />
        <Tab label="Mes cours" />
        <Tab label="Examens" />
      </Tabs>

      {tabValue === 0 && (
        <>
          {/* Statistiques */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                elevation={3}
                sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  bgcolor: '#f5f5f5',
                  height: '100%',
                }}
              >
                <SchoolIcon sx={{ fontSize: 40, color: '#003366', mb: 1 }} />
                <Typography variant="h5" component="div">
                  {stats?.totalCourses}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Cours
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                elevation={3}
                sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  bgcolor: '#f5f5f5',
                  height: '100%',
                }}
              >
                <PeopleIcon sx={{ fontSize: 40, color: '#003366', mb: 1 }} />
                <Typography variant="h5" component="div">
                  {stats?.totalStudents}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Étudiants
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                elevation={3}
                sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  bgcolor: '#f5f5f5',
                  height: '100%',
                }}
              >
                <EventIcon sx={{ fontSize: 40, color: '#CC0000', mb: 1 }} />
                <Typography variant="h5" component="div">
                  {stats?.upcomingExams}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Examens à venir
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                elevation={3}
                sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  bgcolor: '#f5f5f5',
                  height: '100%',
                }}
              >
                <AssignmentIcon sx={{ fontSize: 40, color: '#FF9800', mb: 1 }} />
                <Typography variant="h5" component="div">
                  {stats?.pendingGrades}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Notes en attente
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Cours et notifications */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card elevation={3}>
                <CardHeader
                  title="Mes prochains cours"
                  titleTypographyProps={{ variant: 'h6' }}
                  action={
                    <Button size="small" color="primary" href="/professor/courses">
                      Voir tout
                    </Button>
                  }
                />
                <Divider />
                <CardContent sx={{ p: 0 }}>
                  <List>
                    {courses.filter(course => course.next_session).length > 0 ? (
                      courses
                        .filter(course => course.next_session)
                        .sort((a, b) => {
                          if (!a.next_session || !b.next_session) return 0;
                          return new Date(a.next_session).getTime() - new Date(b.next_session).getTime();
                        })
                        .slice(0, 5)
                        .map((course) => (
                          <ListItem key={course.id} divider>
                            <ListItemIcon>
                              <SchoolIcon color="primary" />
                            </ListItemIcon>
                            <ListItemText
                              primary={course.name}
                              secondary={
                                course.next_session
                                  ? `${formatDate(course.next_session)} à ${formatTime(
                                      course.next_session
                                    )} - Salle ${course.room}`
                                  : 'Aucune session programmée'
                              }
                            />
                          </ListItem>
                        ))
                    ) : (
                      <ListItem>
                        <ListItemText primary="Aucun cours programmé" />
                      </ListItem>
                    )}
                  </List>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card elevation={3}>
                <CardHeader
                  title="Notifications récentes"
                  titleTypographyProps={{ variant: 'h6' }}
                  action={
                    <Button size="small" color="primary" href="/professor/notifications">
                      Voir tout
                    </Button>
                  }
                />
                <Divider />
                <CardContent sx={{ p: 0 }}>
                  <List>
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <ListItem key={notification.id} divider>
                          <ListItemIcon>
                            <NotificationsIcon
                              color={
                                notification.priority === 'high'
                                  ? 'error'
                                  : notification.priority === 'medium'
                                  ? 'warning'
                                  : 'info'
                              }
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={notification.title}
                            secondary={`${notification.content.substring(0, 60)}... - ${formatDate(
                              notification.created_at
                            )}`}
                          />
                        </ListItem>
                      ))
                    ) : (
                      <ListItem>
                        <ListItemText primary="Aucune notification récente" />
                      </ListItem>
                    )}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}

      {tabValue === 1 && (
        <Card elevation={3}>
          <CardHeader title="Tous mes cours" titleTypographyProps={{ variant: 'h6' }} />
          <Divider />
          <CardContent sx={{ p: 0 }}>
            <List>
              {courses.length > 0 ? (
                courses.map((course) => (
                  <ListItem key={course.id} divider>
                    <ListItemIcon>
                      <SchoolIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {course.name}
                          <Chip
                            label={course.code}
                            size="small"
                            sx={{ ml: 1, bgcolor: '#003366', color: 'white' }}
                          />
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" component="span">
                            Département: {course.department_name}
                          </Typography>
                          <br />
                          <Typography variant="body2" component="span">
                            {course.students_count} étudiants inscrits
                          </Typography>
                          <br />
                          <Typography variant="body2" component="span">
                            {course.next_session
                              ? `Prochaine session: ${formatDate(course.next_session)} à ${formatTime(
                                  course.next_session
                                )} - Salle ${course.room}`
                              : 'Aucune session programmée'}
                          </Typography>
                        </>
                      }
                    />
                    <Button
                      variant="outlined"
                      size="small"
                      href={`/professor/courses/${course.id}`}
                      sx={{ ml: 2 }}
                    >
                      Détails
                    </Button>
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText primary="Aucun cours assigné" />
                </ListItem>
              )}
            </List>
          </CardContent>
        </Card>
      )}

      {tabValue === 2 && (
        <Card elevation={3}>
          <CardHeader title="Examens à venir" titleTypographyProps={{ variant: 'h6' }} />
          <Divider />
          <CardContent sx={{ p: 0 }}>
            <List>
              {exams.length > 0 ? (
                exams.map((exam) => (
                  <ListItem key={exam.id} divider>
                    <ListItemIcon>
                      <AssignmentIcon
                        color={
                          exam.type === 'final'
                            ? 'error'
                            : exam.type === 'midterm'
                            ? 'warning'
                            : 'info'
                        }
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {exam.course_name}
                          <Chip
                            label={
                              exam.type === 'final'
                                ? 'Examen final'
                                : exam.type === 'midterm'
                                ? 'Examen partiel'
                                : 'Quiz'
                            }
                            size="small"
                            sx={{
                              ml: 1,
                              bgcolor:
                                exam.type === 'final'
                                  ? '#CC0000'
                                  : exam.type === 'midterm'
                                  ? '#FF9800'
                                  : '#2196F3',
                              color: 'white',
                            }}
                          />
                          <Chip
                            label={
                              exam.status === 'upcoming'
                                ? 'À venir'
                                : exam.status === 'completed'
                                ? 'Terminé'
                                : 'Noté'
                            }
                            size="small"
                            sx={{
                              ml: 1,
                              bgcolor:
                                exam.status === 'upcoming'
                                  ? '#2196F3'
                                  : exam.status === 'completed'
                                  ? '#FF9800'
                                  : '#4CAF50',
                              color: 'white',
                            }}
                          />
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" component="span">
                            Date: {formatDate(exam.date)} à {formatTime(exam.date)}
                          </Typography>
                          <br />
                          <Typography variant="body2" component="span">
                            Durée: {exam.duration} minutes - Salle: {exam.room}
                          </Typography>
                        </>
                      }
                    />
                    <Button
                      variant="outlined"
                      size="small"
                      href={`/professor/exams/${exam.id}`}
                      sx={{ ml: 2 }}
                    >
                      Détails
                    </Button>
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText primary="Aucun examen programmé" />
                </ListItem>
              )}
            </List>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default ProfessorDashboardPage;
