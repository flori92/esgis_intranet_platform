import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Alert, Box, Button, Card, CardContent, CardHeader, CardMedia,
  CircularProgress, Divider, Grid, List, ListItem, ListItemText,
  Typography, Paper, alpha, keyframes, Stack, Table, TableBody,
  TableRow, TableCell, Chip, IconButton
} from '@mui/material';
import {
  CalendarToday as CalendarTodayIcon,
  Event as EventIcon,
  Grade as GradeIcon,
  School as SchoolIcon,
  Assignment as RequestIcon,
  Warning as WarningIcon,
  ArrowForward as ArrowForwardIcon,
  LocationOn as LocationOnIcon,
  AccessTime as AccessTimeIcon,
  TrendingUp as TrendingUpIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Campaign as CampaignIcon,
  EventNote as EventNoteIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';
import { getStudentDashboardData } from '@/api/studentDashboard';

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

const slideIn = keyframes`
  from { opacity: 0; transform: translateX(30px); }
  to { opacity: 1; transform: translateX(0); }
`;

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

const formatShortDate = (dateString) => {
  if (!dateString) return { day: '--', month: '---' };
  try {
    const d = new Date(dateString);
    return {
      day: format(d, 'dd'),
      month: format(d, 'MMM', { locale: fr }).toUpperCase()
    };
  } catch {
    return { day: '--', month: '---' };
  }
};

/* ─── Hero Banner Carousel ─── */
const HeroBanner = ({ banners }) => {
  const [current, setCurrent] = useState(0);

  const items = banners?.length ? banners : [];
  if (items.length === 0) return null;

  const banner = items[current];
  const bgColor = banner.background_color || '#003366';
  const txtColor = banner.text_color || '#FFFFFF';

  const next = () => setCurrent((prev) => (prev + 1) % items.length);
  const prev = () => setCurrent((prev) => (prev - 1 + items.length) % items.length);

  return (
    <Paper
      elevation={6}
      sx={{
        position: 'relative',
        mb: 5,
        borderRadius: 4,
        overflow: 'hidden',
        minHeight: { xs: 280, md: 380 },
        display: 'flex',
        alignItems: 'center',
        backgroundImage: `url(${banner.image_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover .banner-nav': { opacity: 1 }
      }}
    >
      <Box sx={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(135deg, ${alpha(bgColor, 0.92)} 0%, ${alpha(bgColor, 0.6)} 60%, transparent 100%)`
      }} />
      <Box sx={{ position: 'relative', zIndex: 1, p: { xs: 4, md: 6 }, maxWidth: 700 }}>
        {banner.subtitle && (
          <Chip
            label={banner.subtitle}
            size="small"
            sx={{
              mb: 2, fontWeight: 800, bgcolor: alpha(txtColor, 0.2),
              color: txtColor, borderRadius: 2, px: 1
            }}
          />
        )}
        <Typography
          variant="h3"
          sx={{
            color: txtColor, fontWeight: 900, mb: 2,
            fontSize: { xs: '1.8rem', md: '2.8rem' },
            lineHeight: 1.15, textShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}
        >
          {banner.title}
        </Typography>
        {banner.description && (
          <Typography
            variant="h6"
            sx={{
              color: alpha(txtColor, 0.85), mb: 3,
              fontWeight: 400, lineHeight: 1.6,
              display: '-webkit-box', WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical', overflow: 'hidden'
            }}
          >
            {banner.description}
          </Typography>
        )}
        {banner.cta_text && banner.cta_link && (
          <Button
            variant="contained"
            size="large"
            endIcon={<ArrowForwardIcon />}
            component={banner.cta_link.startsWith('/') ? Link : 'a'}
            {...(banner.cta_link.startsWith('/') ? { to: banner.cta_link } : { href: banner.cta_link, target: '_blank' })}
            sx={{
              borderRadius: 3, px: 5, py: 1.5, fontWeight: 800,
              bgcolor: '#CC0000', color: 'white',
              boxShadow: '0 6px 20px rgba(204,0,0,0.4)',
              '&:hover': { bgcolor: '#aa0000', transform: 'translateY(-2px)' }
            }}
          >
            {banner.cta_text}
          </Button>
        )}
      </Box>
      {items.length > 1 && (
        <>
          <IconButton
            className="banner-nav"
            onClick={prev}
            sx={{
              position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
              bgcolor: alpha('#fff', 0.2), color: 'white', opacity: 0,
              transition: 'opacity 0.3s', '&:hover': { bgcolor: alpha('#fff', 0.4) }
            }}
          >
            <ChevronLeftIcon />
          </IconButton>
          <IconButton
            className="banner-nav"
            onClick={next}
            sx={{
              position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
              bgcolor: alpha('#fff', 0.2), color: 'white', opacity: 0,
              transition: 'opacity 0.3s', '&:hover': { bgcolor: alpha('#fff', 0.4) }
            }}
          >
            <ChevronRightIcon />
          </IconButton>
          <Stack
            direction="row" spacing={1}
            sx={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)' }}
          >
            {items.map((_, i) => (
              <Box
                key={i}
                onClick={() => setCurrent(i)}
                sx={{
                  width: i === current ? 28 : 10, height: 10, borderRadius: 5,
                  bgcolor: i === current ? 'white' : alpha('#fff', 0.4),
                  cursor: 'pointer', transition: 'all 0.3s'
                }}
              />
            ))}
          </Stack>
        </>
      )}
    </Paper>
  );
};

/* ─── Event Card ─── */
const EventCard = ({ event, index }) => {
  const dateParts = formatShortDate(event.start_date);
  const categoryColors = {
    academic: '#003366', cultural: '#CC0000', sports: '#2e7d32',
    conference: '#7b1fa2', general: '#ed6c02'
  };
  const color = categoryColors[event.category] || categoryColors.general;

  return (
    <Card sx={{
      display: 'flex', borderRadius: 3, overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      transition: 'all 0.3s ease',
      animation: `${slideIn} 0.5s ease ${index * 0.1}s both`,
      '&:hover': {
        transform: 'translateX(8px)',
        boxShadow: '0 6px 24px rgba(0,0,0,0.1)',
        borderLeft: `4px solid ${color}`
      }
    }}>
      <Box sx={{
        width: 80, minHeight: 90, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        bgcolor: alpha(color, 0.08), borderRight: `3px solid ${color}`
      }}>
        <Typography variant="h4" fontWeight="900" color={color} lineHeight={1}>
          {dateParts.day}
        </Typography>
        <Typography variant="caption" fontWeight="700" color={color}>
          {dateParts.month}
        </Typography>
      </Box>
      <CardContent sx={{ flex: 1, py: 1.5, px: 2 }}>
        <Typography variant="subtitle2" fontWeight="700" sx={{ mb: 0.5 }}>
          {event.title}
        </Typography>
        {event.location && (
          <Stack direction="row" spacing={0.5} alignItems="center">
            <LocationOnIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">{event.location}</Typography>
          </Stack>
        )}
        <Chip
          label={event.category || 'general'}
          size="small"
          sx={{
            mt: 0.5, height: 20, fontSize: '0.65rem', fontWeight: 700,
            bgcolor: alpha(color, 0.1), color
          }}
        />
      </CardContent>
    </Card>
  );
};

/* ─── News Card ─── */
const NewsCard = ({ item, index }) => (
  <Card sx={{
    height: '100%', display: 'flex', flexDirection: 'column',
    borderRadius: 4, overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
    animation: `${fadeIn} 0.6s ease ${index * 0.15}s both`,
    transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      transform: 'translateY(-8px)',
      boxShadow: '0 16px 40px rgba(0,0,0,0.12)',
      '& .news-img': { transform: 'scale(1.08)' }
    }
  }}>
    <Box sx={{ overflow: 'hidden', height: 200, position: 'relative' }}>
      <CardMedia
        className="news-img"
        component="img"
        height="200"
        image={item.image_url || 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800'}
        alt={item.title}
        sx={{ transition: 'transform 0.5s ease', objectFit: 'cover' }}
      />
      {item.is_featured && (
        <Chip
          label="A la une"
          size="small"
          sx={{
            position: 'absolute', top: 12, left: 12,
            bgcolor: '#CC0000', color: 'white', fontWeight: 800
          }}
        />
      )}
      <Chip
        label={item.category || 'general'}
        size="small"
        sx={{
          position: 'absolute', top: 12, right: 12,
          bgcolor: alpha('#000', 0.6), color: 'white', fontWeight: 600,
          textTransform: 'uppercase', fontSize: '0.65rem'
        }}
      />
    </Box>
    <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1, lineHeight: 1.3 }}>
        {item.title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{
        display: '-webkit-box', WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical', overflow: 'hidden',
        lineHeight: 1.6, mb: 1.5
      }}>
        {item.content || item.excerpt}
      </Typography>
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <AccessTimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
        <Typography variant="caption" color="text.secondary" fontWeight="500">
          {formatDate(item.published_at)}
        </Typography>
      </Stack>
    </CardContent>
  </Card>
);

/* ─── Announcement Banner ─── */
const AnnouncementsBanner = ({ announcements }) => {
  if (!announcements?.length) return null;

  const priorityColors = { urgent: '#d32f2f', high: '#ed6c02', normal: '#003366', low: '#2e7d32' };

  return (
    <Stack spacing={1.5} sx={{ mb: 4 }}>
      {announcements.map((a) => {
        const color = priorityColors[a.priority] || priorityColors.normal;
        return (
          <Paper
            key={a.id}
            elevation={0}
            sx={{
              p: 2, borderRadius: 3,
              border: `1px solid ${alpha(color, 0.3)}`,
              bgcolor: alpha(color, 0.04),
              display: 'flex', alignItems: 'center', gap: 2,
              transition: 'all 0.2s',
              '&:hover': { bgcolor: alpha(color, 0.08), transform: 'translateX(4px)' }
            }}
          >
            <CampaignIcon sx={{ color, fontSize: 28 }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" fontWeight="bold" color={color}>
                {a.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{
                display: '-webkit-box', WebkitLineClamp: 1,
                WebkitBoxOrient: 'vertical', overflow: 'hidden'
              }}>
                {a.content}
              </Typography>
            </Box>
            <Chip
              label={a.priority === 'urgent' ? 'Urgent' : a.priority === 'high' ? 'Important' : 'Info'}
              size="small"
              sx={{ fontWeight: 700, bgcolor: alpha(color, 0.15), color }}
            />
          </Paper>
        );
      })}
    </Stack>
  );
};

/* ─── Main Dashboard ─── */
const DashboardPage = () => {
  const { authState } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    next_course: null, recent_grades: [], schedule: [],
    banners: [], news: [], events: [], announcements: [],
    requests: [], upcoming_exams: []
  });

  const stats = useMemo(() => {
    const requests = dashboardData?.requests || [];
    const exams = dashboardData?.upcoming_exams || [];
    return {
      pendingRequests: requests.filter(r => r.status !== 'ready' && r.status !== 'rejected').length,
      upcomingExams: exams.length
    };
  }, [dashboardData]);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const studentId = authState.student?.id;
      const profileId = authState.user?.id;
      const numericStudentId = Number(studentId);

      if (!authState.isAuthenticated || !profileId) {
        throw new Error('Acces non autorise');
      }

      if (!studentId || isNaN(numericStudentId)) {
        if (authState.isStudent) {
          setTimeout(loadDashboard, 2000);
          return;
        }
        throw new Error('Votre profil etudiant est en cours de finalisation.');
      }

      const { data, error: dashboardError } = await getStudentDashboardData({
        profileId,
        studentId: numericStudentId
      });

      if (dashboardError) throw dashboardError;

      setDashboardData(data || {
        next_course: null, recent_grades: [], schedule: [],
        banners: [], news: [], events: [], announcements: [],
        requests: [], upcoming_exams: []
      });
    } catch (loadError) {
      setError(loadError.message || 'Impossible de charger le tableau de bord.');
    } finally {
      setLoading(false);
    }
  }, [authState.isAuthenticated, authState.student?.id, authState.user?.id, authState.isStudent]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  return (
    <Box sx={{
      p: { xs: 2, md: 4 }, backgroundColor: '#f8fafc',
      minHeight: '100vh', animation: `${fadeIn} 0.6s ease-out`
    }}>
      {error && (
        <Alert severity="error" variant="filled" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>
      )}

      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} mb={4} spacing={2}>
        <Box>
          <Typography variant="h3" fontWeight="900" color="text.primary" sx={{ letterSpacing: '-0.5px' }}>
            Bonjour, {authState.profile?.full_name?.split(' ')[0] || 'Etudiant'}
          </Typography>
          <Typography variant="h6" color="text.secondary" fontWeight="400">
            Bienvenue sur votre espace ESGIS
          </Typography>
        </Box>
        <Paper elevation={0} sx={{
          p: 2, borderRadius: 3, bgcolor: 'white',
          border: '1px solid', borderColor: 'divider'
        }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <CalendarTodayIcon color="primary" />
            <Typography variant="subtitle1" fontWeight="bold">
              {format(new Date(), 'PPPP', { locale: fr })}
            </Typography>
          </Stack>
        </Paper>
      </Stack>

      {/* Hero Banner Carousel (CMS Banners) */}
      <HeroBanner banners={dashboardData.banners} />

      {/* Announcements */}
      <AnnouncementsBanner announcements={dashboardData.announcements} />

      {/* Priority Actions */}
      {(stats.upcomingExams > 0 || stats.pendingRequests > 0) && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon color="error" /> Actions prioritaires
          </Typography>
          <Grid container spacing={2}>
            {dashboardData.upcoming_exams.map(exam => (
              <Grid item xs={12} md={6} key={exam.id}>
                <Alert
                  severity="warning" variant="outlined"
                  sx={{
                    borderRadius: 3, borderLeft: '6px solid #f59e0b',
                    bgcolor: alpha('#f59e0b', 0.04), animation: `${pulse} 2s infinite`
                  }}
                  action={
                    <Button variant="contained" color="warning" size="small" component={Link} to="/student/exams" sx={{ borderRadius: 2, fontWeight: 'bold' }}>
                      Voir
                    </Button>
                  }
                >
                  <Typography variant="subtitle1" fontWeight="bold">Examen : {exam.title}</Typography>
                  <Typography variant="body2">Debut a {formatTime(exam.start_time)}</Typography>
                </Alert>
              </Grid>
            ))}
            {dashboardData.requests.filter(r => r.status === 'ready').map(req => (
              <Grid item xs={12} md={6} key={req.id}>
                <Alert
                  severity="success" variant="outlined"
                  sx={{ borderRadius: 3, borderLeft: '6px solid green', bgcolor: alpha('#66bb6a', 0.04) }}
                  action={
                    <Button variant="contained" color="success" size="small" component={Link} to="/student/requests" sx={{ borderRadius: 2 }}>
                      Telecharger
                    </Button>
                  }
                >
                  <Typography variant="subtitle1" fontWeight="bold">Document pret : {req.request_type}</Typography>
                </Alert>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      <Grid container spacing={4}>
        {/* Main Column */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={3}>
            {/* Next Course */}
            <Grid item xs={12} sm={6}>
              <Card sx={{
                height: '100%', borderRadius: 4,
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                transition: 'all 0.25s ease',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' },
                borderTop: '5px solid #003366'
              }}>
                <CardHeader title="Prochain cours" avatar={<SchoolIcon color="primary" />} />
                <CardContent>
                  {dashboardData.next_course ? (
                    <>
                      <Typography variant="h5" fontWeight="bold" gutterBottom>{dashboardData.next_course.name}</Typography>
                      <Stack spacing={1} mb={2}>
                        <Stack direction="row" spacing={1} alignItems="center" color="text.secondary">
                          <AccessTimeIcon fontSize="small" />
                          <Typography variant="body1">{formatTime(dashboardData.next_course.time)}</Typography>
                        </Stack>
                      </Stack>
                      <Button variant="contained" component={Link} to="/student/schedule" fullWidth
                        sx={{ borderRadius: 2, bgcolor: '#003366' }} startIcon={<CalendarTodayIcon />}
                      >
                        Voir mon agenda
                      </Button>
                    </>
                  ) : (
                    <Typography variant="body1" color="text.secondary" textAlign="center" py={2}>
                      Aucun cours prevu prochainement
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Recent Grades */}
            <Grid item xs={12} sm={6}>
              <Card sx={{
                height: '100%', borderRadius: 4,
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                transition: 'all 0.25s ease',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' },
                borderTop: '5px solid #CC0000'
              }}>
                <CardHeader title="Dernieres notes" avatar={<GradeIcon color="error" />} />
                <CardContent sx={{ pt: 0 }}>
                  {dashboardData.recent_grades.length > 0 ? (
                    <List disablePadding>
                      {dashboardData.recent_grades.map((grade, idx) => (
                        <Box key={grade.id}>
                          <ListItem sx={{ px: 0, py: 1 }}>
                            <ListItemText
                              primary={<Typography fontWeight="bold" variant="body2">{grade.course_name}</Typography>}
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
                        Voir tous les resultats
                      </Button>
                    </List>
                  ) : (
                    <Typography variant="body1" color="text.secondary">Aucune note recente.</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Admin Requests */}
            <Grid item xs={12}>
              <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <CardHeader
                  title="Mes Demarches"
                  avatar={<RequestIcon color="secondary" />}
                  action={
                    <Button variant="outlined" size="small" component={Link} to="/student/requests" sx={{ borderRadius: 2 }}>
                      Tout voir
                    </Button>
                  }
                />
                <CardContent sx={{ pt: 0 }}>
                  {dashboardData.requests.length > 0 ? (
                    <Table size="small">
                      <TableBody>
                        {dashboardData.requests.map(req => (
                          <TableRow key={req.id}>
                            <TableCell sx={{ pl: 0, fontWeight: 500 }}>{req.request_type}</TableCell>
                            <TableCell>{formatDate(req.created_at)}</TableCell>
                            <TableCell align="right">
                              <Chip
                                label={req.status === 'ready' ? 'Disponible' : req.status === 'approved' ? 'Approuve' : 'En cours'}
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

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            {/* Upcoming Events */}
            <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              <CardHeader
                title="Evenements a venir"
                avatar={<EventIcon color="primary" />}
                titleTypographyProps={{ fontWeight: 'bold' }}
              />
              <CardContent sx={{ pt: 0 }}>
                {dashboardData.events.length > 0 ? (
                  <Stack spacing={1.5}>
                    {dashboardData.events.slice(0, 4).map((event, idx) => (
                      <EventCard key={event.id} event={event} index={idx} />
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">Aucun evenement prevu.</Typography>
                )}
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card sx={{
              borderRadius: 4,
              background: 'linear-gradient(135deg, #003366 0%, #0052a3 100%)',
              color: 'white', boxShadow: '0 8px 30px rgba(0,51,102,0.2)'
            }}>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUpIcon /> Acces rapide
                </Typography>
                <Stack spacing={1.5} sx={{ mt: 2 }}>
                  <Button
                    fullWidth variant="outlined" component={Link} to="/student/weekly-schedules"
                    startIcon={<EventNoteIcon />}
                    sx={{
                      color: 'white', borderColor: alpha('#fff', 0.4),
                      borderRadius: 2, justifyContent: 'flex-start',
                      '&:hover': { borderColor: 'white', bgcolor: alpha('#fff', 0.1) }
                    }}
                  >
                    EDT Hebdomadaire
                  </Button>
                  <Button
                    fullWidth variant="outlined" component={Link} to="/student/grades"
                    startIcon={<GradeIcon />}
                    sx={{
                      color: 'white', borderColor: alpha('#fff', 0.4),
                      borderRadius: 2, justifyContent: 'flex-start',
                      '&:hover': { borderColor: 'white', bgcolor: alpha('#fff', 0.1) }
                    }}
                  >
                    Mes notes
                  </Button>
                  <Button
                    fullWidth variant="outlined" component={Link} to="/student/exams"
                    startIcon={<SchoolIcon />}
                    sx={{
                      color: 'white', borderColor: alpha('#fff', 0.4),
                      borderRadius: 2, justifyContent: 'flex-start',
                      '&:hover': { borderColor: 'white', bgcolor: alpha('#fff', 0.1) }
                    }}
                  >
                    Mes examens
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* News Grid Section */}
        <Grid item xs={12}>
          <Typography variant="h4" gutterBottom sx={{ mt: 2, mb: 3, fontWeight: 900, letterSpacing: '-0.5px' }}>
            Dernieres Actualites
          </Typography>
          <Grid container spacing={3}>
            {dashboardData.news.length > 0 ? (
              dashboardData.news.map((item, idx) => (
                <Grid item xs={12} sm={6} md={4} key={item.id}>
                  <NewsCard item={item} index={idx} />
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Paper sx={{
                  p: 5, textAlign: 'center', borderRadius: 4,
                  bgcolor: alpha('#003366', 0.02), border: '2px dashed #e2e8f0'
                }}>
                  <Typography variant="h6" color="text.secondary">Aucune actualite pour le moment.</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Revenez plus tard pour les nouveautes du campus !
                  </Typography>
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
