import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardMedia,
  CircularProgress,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  Typography,
  Paper,
  alpha,
  keyframes
} from '@mui/material';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(204, 0, 0, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(204, 0, 0, 0); }
  100% { box-shadow: 0 0 0 0 rgba(204, 0, 0, 0); }
`;

const shimmer = keyframes`
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
`;
import {
  CalendarToday as CalendarTodayIcon,
  Event as EventIcon,
  Grade as GradeIcon,
  School as SchoolIcon,
  Assignment as RequestIcon,
  Warning as WarningIcon,
  Description as DocumentIcon,
  ArrowForward as ArrowForwardIcon,
  LocationOn as LocationOnIcon,
  AccessTime as AccessTimeIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { Stack, Table, TableBody, TableRow, TableCell, Chip } from '@mui/material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';
import { getStudentDashboardData } from '@/api/studentDashboard';

const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    return format(new Date(dateString), 'PPP', { locale: fr });
  } catch {
    return dateString;
  }
};

const formatTime = (dateString) => {
  if (!dateString) return '--:--';
  try {
    return format(new Date(dateString), 'HH:mm');
  } catch {
    return '--:--';
  }
};

const NewsHero = ({ news }) => {
  if (!news || news.length === 0) return null;
  const hero = news[0];

  return (
    <Paper
      elevation={4}
      sx={{
        position: 'relative',
        backgroundColor: 'grey.800',
        color: '#fff',
        mb: 6,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundImage: `url(${hero.image_url || 'https://images.unsplash.com/photo-1523050853063-bd8012fbb20a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'})`,
        borderRadius: 6,
        overflow: 'hidden',
        minHeight: { xs: 350, md: 450 },
        display: 'flex',
        alignItems: 'flex-end',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          '& .hero-content': { transform: 'translateY(-10px)' }
        }
      }}
    >
      {/* Overlay */}
      <Box
        sx={{
          position: 'absolute',
          top: 0, bottom: 0, right: 0, left: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.1) 100%)'
        }}
      />
      <Grid container>
        <Grid item md={9} lg={7}>
          <Box
            className="hero-content"
            sx={{
              position: 'relative',
              p: { xs: 4, md: 8 },
              transition: 'transform 0.4s ease'
            }}
          >
            <Stack direction="row" spacing={1} mb={2} alignItems="center">
              <Chip 
                label="ACTUALITÉ" 
                color="primary" 
                size="small" 
                sx={{ fontWeight: '800', borderRadius: 1.5, px: 1 }} 
              />
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>
                Publié le {formatDate(hero.published_at)}
              </Typography>
            </Stack>
            <Typography component="h1" variant="h2" color="inherit" gutterBottom fontWeight="900" sx={{ 
              lineHeight: 1.1, 
              mb: 3,
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              textShadow: '0 4px 12px rgba(0,0,0,0.3)' 
            }}>
              {hero.title}
            </Typography>
            <Typography variant="h6" color="inherit" paragraph sx={{ 
              opacity: 0.9, 
              mb: 4, 
              fontWeight: '400',
              lineHeight: 1.6,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {hero.content}
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              size="large"
              endIcon={<ArrowForwardIcon />}
              sx={{ 
                borderRadius: 3, 
                px: 5, 
                py: 2, 
                fontWeight: '800', 
                fontSize: '1rem',
                boxShadow: '0 8px 20px rgba(26, 86, 219, 0.4)',
                '&:hover': { backgroundColor: '#1e429f' }
              }}
            >
              Lire l'article
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

const DashboardPage = () => {
  const { authState } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    next_course: null,
    recent_grades: [],
    schedule: [],
    news: [],
    events: [],
    requests: [],
    upcoming_exams: []
  });

  const stats = useMemo(() => {
    const requests = dashboardData?.requests || [];
    const exams = dashboardData?.upcoming_exams || [];
    const news = dashboardData?.news || [];

    return {
      pendingRequests: requests.filter(r => r.status !== 'ready' && r.status !== 'rejected').length,
      upcomingExams: exams.length,
      recentNews: news.length
    };
  }, [dashboardData]);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError(null);

      try {
        const studentId = authState.student?.id;
        const profileId = authState.user?.id;
        const numericStudentId = Number(studentId);

        if (!authState.isAuthenticated || !profileId) {
          throw new Error('Accès non autorisé');
        }

        // Si l'utilisateur est un étudiant mais n'a pas encore son ID numérique, on attend un peu (auto-fix en cours)
        if (!studentId || isNaN(numericStudentId)) {
          if (authState.isStudent) {
             // On peut essayer de recharger ou afficher un message d'attente
             setTimeout(loadDashboard, 2000);
             return;
          }
          throw new Error('Votre profil étudiant est en cours de finalisation. Veuillez patienter ou contacter l\'administration.');
        }

        const { data, error: dashboardError } = await getStudentDashboardData({
          profileId: profileId,
          studentId: numericStudentId
        });

        if (dashboardError) throw dashboardError;

        setDashboardData(data || {
          next_course: null, recent_grades: [], schedule: [],
          news: [], events: [], requests: [], upcoming_exams: []
        });
      } catch (loadError) {
        console.error('Erreur lors du chargement du dashboard étudiant:', loadError);
        setError(loadError.message || 'Impossible de charger le tableau de bord.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [authState.isAuthenticated, authState.student?.id, authState.user?.id, authState.isStudent]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: { xs: 2, md: 4 }, 
      backgroundColor: '#f8fafc', 
      minHeight: '100vh',
      animation: `${fadeIn} 0.8s ease-out`
    }}>
      {error && (
        <Alert severity="error" variant="filled" sx={{ mb: 4, borderRadius: 2, boxShadow: 2 }}>
          {error}
        </Alert>
      )}

      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} mb={4} spacing={2}>
        <Box>
          <Typography variant="h3" component="h1" fontWeight="800" color="text.primary" gutterBottom sx={{ letterSpacing: '-0.5px' }}>
            Bonjour, {authState.profile?.full_name?.split(' ')[0] || 'Étudiant'} 👋
          </Typography>
          <Typography variant="h6" color="text.secondary" fontWeight="500">
            Prêt pour vos cours d'aujourd'hui ?
          </Typography>
        </Box>
        <Paper elevation={0} sx={{ p: 2, borderRadius: 3, backgroundColor: 'white', border: '1px solid', borderColor: 'divider', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <CalendarTodayIcon color="primary" />
            <Typography variant="subtitle1" fontWeight="bold">
              {format(new Date(), 'PPPP', { locale: fr })}
            </Typography>
          </Stack>
        </Paper>
      </Stack>

      {/* Hero Banner Actualités */}
      <NewsHero news={dashboardData.news} />

      {/* Barre d'Actions Prioritaires */}
      {(stats.upcomingExams > 0 || stats.pendingRequests > 0) && (
        <Box sx={{ mb: 5 }}>
          <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <WarningIcon color="error" /> Actions prioritaires
          </Typography>
          <Grid container spacing={2}>
            {dashboardData.upcoming_exams.map(exam => (
              <Grid item xs={12} md={6} key={exam.id}>
                <Alert 
                  severity="warning" 
                  variant="outlined"
                  sx={{ 
                    borderRadius: 3, 
                    borderLeft: '6px solid #f59e0b', 
                    backgroundColor: alpha('#f59e0b', 0.05),
                    animation: `${pulse} 2s infinite`,
                    '& .MuiAlert-icon': { fontSize: '2rem' }
                  }}
                  action={
                    <Button variant="contained" color="warning" size="small" component={Link} to={`/student/exams`} sx={{ borderRadius: 2, fontWeight: 'bold' }}>
                      Accéder à l'examen
                    </Button>
                  }
                >
                  <Typography variant="subtitle1" fontWeight="bold">Examen imminent : {exam.title}</Typography>
                  <Typography variant="body2">Début à {formatTime(exam.start_time || exam.exam_date || exam.date)}</Typography>
                </Alert>
              </Grid>
            ))}
            {dashboardData.requests.filter(r => r.status === 'ready').map(req => (
              <Grid item xs={12} md={6} key={req.id}>
                <Alert 
                  severity="success" 
                  variant="outlined"
                  sx={{ borderRadius: 3, borderLeft: '6px solid green', backgroundColor: alpha('#66bb6a', 0.05) }}
                  action={
                    <Button variant="contained" color="success" size="small" component={Link} to="/student/requests" sx={{ borderRadius: 2 }}>
                      Télécharger
                    </Button>
                  }
                >
                  <Typography variant="subtitle1" fontWeight="bold">Document prêt : {req.request_type}</Typography>
                  <Typography variant="body2">Votre demande a été finalisée avec succès.</Typography>
                </Alert>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      <Grid container spacing={4}>
        {/* Colonne Principale */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={4}>
            {/* Prochain Cours */}
            <Grid item xs={12} md={6}>
              <Card sx={{ 
                height: '100%', 
                borderRadius: 4, 
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' },
                borderTop: '6px solid #003366'
              }}>
                <CardHeader title="Prochain cours" avatar={<SchoolIcon color="primary" />} />
                <CardContent>
                  {dashboardData.next_course ? (
                    <>
                      <Typography variant="h5" fontWeight="bold" gutterBottom>{dashboardData.next_course.name}</Typography>
                      <Stack spacing={1} mb={2}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                          <AccessTimeIcon fontSize="small" />
                          <Typography variant="body1">{formatTime(dashboardData.next_course.time)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                          <LocationOnIcon fontSize="small" />
                          <Typography variant="body1">Salle 204 (Campus ESGIS)</Typography>
                        </Box>
                      </Stack>
                      <Button
                        variant="contained"
                        component={Link}
                        to="/student/schedule"
                        fullWidth
                        sx={{ mt: 1, borderRadius: 2 }}
                        startIcon={<CalendarTodayIcon />}
                      >
                        Voir mon agenda
                      </Button>
                    </>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="body1" color="text.secondary">Aucun cours prévu prochainement</Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Dernières Notes */}
            <Grid item xs={12} md={6}>
              <Card sx={{ 
                height: '100%', 
                borderRadius: 4, 
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' },
                borderTop: '6px solid #CC0000'
              }}>
                <CardHeader title="Dernières notes" avatar={<GradeIcon color="error" />} />
                <CardContent sx={{ pt: 0 }}>
                  {dashboardData.recent_grades.length > 0 ? (
                    <List disablePadding>
                      {dashboardData.recent_grades.map((grade, idx) => (
                        <Box key={grade.id}>
                          <ListItem sx={{ px: 0, py: 1.5 }}>
                            <ListItemText
                              primary={<Typography fontWeight="bold">{grade.course_name}</Typography>}
                              secondary={formatDate(grade.published_at)}
                            />
                            <Typography variant="h6" fontWeight="800" color="primary.main">
                              {grade.value}/{grade.max_value}
                            </Typography>
                          </ListItem>
                          {idx < dashboardData.recent_grades.length - 1 && <Divider />}
                        </Box>
                      ))}
                      <Button variant="text" component={Link} to="/student/grades" fullWidth sx={{ mt: 1, fontWeight: 'bold' }}>
                        Voir tous les résultats
                      </Button>
                    </List>
                  ) : (
                    <Typography variant="body1" color="text.secondary">Aucune note récente.</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Suivi Administratif */}
            <Grid item xs={12}>
              <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <CardHeader 
                  title="Mes Démarches Administratives" 
                  avatar={<RequestIcon color="secondary" />} 
                  action={<Button variant="outlined" size="small" component={Link} to="/student/requests" sx={{ borderRadius: 2 }}>Tout voir</Button>}
                />
                <CardContent sx={{ pt: 0 }}>
                  {dashboardData.requests.length > 0 ? (
                    <Table size="medium">
                      <TableBody>
                        {dashboardData.requests.map(req => (
                          <TableRow key={req.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                            <TableCell sx={{ pl: 0, fontWeight: '500' }}>{req.request_type}</TableCell>
                            <TableCell>{formatDate(req.created_at)}</TableCell>
                            <TableCell align="right">
                              <Chip 
                                label={req.status === 'ready' ? 'Disponible' : req.status === 'approved' ? 'Approuvé' : 'En cours'} 
                                size="small" 
                                color={req.status === 'ready' ? 'secondary' : req.status === 'approved' ? 'success' : 'default'} 
                                sx={{ fontWeight: 'bold' }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <Typography variant="body2" color="text.secondary">Aucune demande en cours.</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Colonne Latérale */}
        <Grid item xs={12} md={4}>
          <Stack spacing={4}>
            {/* Agenda / Événements */}
            <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', backgroundColor: 'white' }}>
              <CardHeader title="Événements à venir" avatar={<EventIcon color="primary" />} />
              <CardContent sx={{ pt: 0 }}>
                {dashboardData.events.length > 0 ? (
                  <List>
                    {dashboardData.events.map((event, idx) => (
                      <Box key={event.id}>
                        <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                          <ListItemText
                            primary={<Typography fontWeight="bold">{event.title}</Typography>}
                            secondary={
                              <Stack spacing={0.5} mt={0.5}>
                                <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <CalendarTodayIcon sx={{ fontSize: 12 }} /> {formatDate(event.start_date)}
                                </Typography>
                                <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <LocationOnIcon sx={{ fontSize: 12 }} /> {event.location || 'Campus ESGIS'}
                                </Typography>
                              </Stack>
                            }
                          />
                        </ListItem>
                        {idx < dashboardData.events.length - 1 && <Divider component="li" />}
                      </Box>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">Aucun événement prévu.</Typography>
                )}
              </CardContent>
            </Card>

            {/* Widget Statistiques */}
            <Card sx={{ 
              borderRadius: 4, 
              background: 'linear-gradient(135deg, #003366 0%, #0052a3 100%)', 
              color: 'white',
              boxShadow: '0 8px 30px rgba(0,51,102,0.2)'
            }}>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUpIcon /> Ma Progression
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>Cours suivis</Typography>
                    <Typography variant="h4" fontWeight="800">12</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>Moyenne G.</Typography>
                    <Typography variant="h4" fontWeight="800">14.5</Typography>
                  </Grid>
                </Grid>
                <Button 
                  fullWidth 
                  variant="outlined" 
                  sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)', mt: 3, borderRadius: 2, '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.1)' } }}
                >
                  Voir mon bilan
                </Button>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* Section News Grid */}
        <Grid item xs={12}>
          <Typography variant="h4" component="h2" gutterBottom sx={{ mt: 2, mb: 4, fontWeight: '900', letterSpacing: '-0.5px' }}>
            Dernières Actualités
          </Typography>
          <Grid container spacing={4}>
            {dashboardData.news.slice(1).length > 0 ? (
              dashboardData.news.slice(1).map((item) => (
                <Grid item xs={12} sm={6} md={4} key={item.id || item.title}>
                  <Card sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    borderRadius: 5,
                    overflow: 'hidden',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': { 
                      transform: 'translateY(-10px)', 
                      boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
                      '& .MuiCardMedia-root': { transform: 'scale(1.1)' }
                    }
                  }}>
                    <Box sx={{ overflow: 'hidden', height: 220 }}>
                      <CardMedia 
                        component="img" 
                        height="220" 
                        image={item.image_url || 'https://images.unsplash.com/photo-1541339907198-e08756cdfb3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'} 
                        alt={item.title} 
                        sx={{ transition: 'transform 0.5s ease' }}
                      />
                    </Box>
                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                      <Typography variant="caption" color="primary" fontWeight="bold" sx={{ textTransform: 'uppercase', mb: 1, display: 'block' }}>
                        Campus Life
                      </Typography>
                      <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ lineHeight: 1.3, mb: 2 }}>
                        {item.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ 
                        lineClamp: 3, 
                        display: '-webkit-box', 
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical', 
                        overflow: 'hidden',
                        mb: 2,
                        lineHeight: 1.6
                      }}>
                        {item.content}
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 'auto' }}>
                        <AccessTimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary" fontWeight="500">
                          {formatDate(item.published_at)}
                        </Typography>
                      </Stack>
                    </CardContent>
                    <Box sx={{ p: 3, pt: 0 }}>
                      <Button 
                        variant="outlined" 
                        fullWidth 
                        endIcon={<ArrowForwardIcon />}
                        sx={{ borderRadius: 2, fontWeight: 'bold' }}
                      >
                        Lire plus
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 5, backgroundColor: alpha('#003366', 0.02), border: '2px dashed #e2e8f0' }}>
                  <Typography variant="h6" color="text.secondary">Aucune autre actualité pour le moment.</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Revenez plus tard pour les nouveautés du campus !</Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
