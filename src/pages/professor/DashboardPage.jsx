import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Alert, Box, Button, Card, CardContent, CardMedia,
  CircularProgress, Divider, Grid, List, ListItem, ListItemText,
  Typography, Paper, alpha, keyframes, Stack, Chip, IconButton
} from '@mui/material';
import {
  School as SchoolIcon,
  Event as EventIcon,
  Assignment as AssignmentIcon,
  People as PeopleIcon,
  CalendarToday as CalendarTodayIcon,
  ArrowForward as ArrowForwardIcon,
  AccessTime as AccessTimeIcon,
  TrendingUp as TrendingUpIcon,
  Grading as GradingIcon,
  EventNote as EventNoteIcon,
  Campaign as CampaignIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  LocationOn as LocationOnIcon,
  Newspaper as NewspaperIcon,
  MenuBook as MenuBookIcon,
  WarningAmber as WarningAmberIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';
import { getProfessorDashboardData } from '@/api/professorDashboard';
import { getProfessorLearningInsights } from '@/api/professorLearningInsights';
import { getCMSBanners, getCMSNews, getCMSEvents } from '@/api/cms';

/* ─── Animations ─── */
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
`;

/* ─── Theme constants ─── */
const NAVY = '#003366';
const RED = '#CC0000';
const CARD_RADIUS = 3;

/* ─── Helpers ─── */
const EMPTY_DASHBOARD = {
  stats: null, courses: [], exams: [], pendingGrades: [], news: [], events: []
};

const EMPTY_LEARNING_INSIGHTS = {
  summary: {
    totalCourses: 0,
    totalTrackedStudents: 0,
    atRiskStudents: 0,
    overdueActivities: 0,
    averageProgress: 0,
    averageAttendance: 0,
    averagePredictedGrade: 0,
    configuredCourses: 0
  },
  courses: [],
  studentsNeedingAttention: []
};

const formatDate = (v) => {
  if (!v) return '-';
  try { return format(new Date(v), 'PPP', { locale: fr }); }
  catch { return v; }
};

const formatShortDate = (v) => {
  if (!v) return { day: '--', month: '---' };
  try {
    const d = new Date(v);
    return { day: format(d, 'dd'), month: format(d, 'MMM', { locale: fr }).toUpperCase() };
  } catch { return { day: '--', month: '---' }; }
};

const examStatusMap = {
  draft: { label: 'Brouillon', color: 'default' },
  published: { label: 'Publie', color: 'info' },
  in_progress: { label: 'En cours', color: 'warning' },
  grading: { label: 'Correction', color: 'primary' },
  completed: { label: 'Termine', color: 'success' },
  cancelled: { label: 'Annule', color: 'error' }
};

/* ════════════════════════════════════════════════════════════════════
   Hero Banner Carousel — fullwidth, auto-play, cinematic transitions
   ════════════════════════════════════════════════════════════════════ */
const HeroBanner = ({ banners }) => {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);
  const items = banners?.length ? banners : [];

  const resetTimer = useCallback(() => {
    clearInterval(timerRef.current);
    if (items.length > 1) {
      timerRef.current = setInterval(
        () => setCurrent((p) => (p + 1) % items.length),
        6000
      );
    }
  }, [items.length]);

  useEffect(() => { resetTimer(); return () => clearInterval(timerRef.current); }, [resetTimer]);

  if (items.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          position: 'relative', mb: 4, borderRadius: 4, overflow: 'hidden',
          minHeight: { xs: 220, md: 320 },
          background: `linear-gradient(135deg, ${NAVY} 0%, #0a4d8c 50%, #1565c0 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
      >
        <Box sx={{
          position: 'absolute', inset: 0, opacity: 0.06,
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
        }} />
        <Box sx={{ textAlign: 'center', position: 'relative', zIndex: 1, px: 4, py: 6 }}>
          <SchoolIcon sx={{ fontSize: 56, color: alpha('#fff', 0.7), mb: 2 }} />
          <Typography variant="h3" sx={{ color: 'white', fontWeight: 900, mb: 1, fontSize: { xs: '1.6rem', md: '2.4rem' } }}>
            Espace Professeur ESGIS
          </Typography>
          <Typography variant="h6" sx={{ color: alpha('#fff', 0.8), fontWeight: 400 }}>
            Gerez vos cours, examens et notes
          </Typography>
        </Box>
      </Paper>
    );
  }

  const banner = items[current];
  const bgColor = banner.background_color || NAVY;
  const txtColor = banner.text_color || '#FFFFFF';

  const goTo = (i) => { setCurrent(i); resetTimer(); };
  const next = () => goTo((current + 1) % items.length);
  const prev = () => goTo((current - 1 + items.length) % items.length);

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'relative', mb: 4, borderRadius: 4, overflow: 'hidden',
        minHeight: { xs: 240, md: 360 },
        display: 'flex', alignItems: 'center',
        '&:hover .hero-nav': { opacity: 1 }
      }}
    >
      {items.map((b, i) => (
        <Box
          key={b.id || i}
          sx={{
            position: 'absolute', inset: 0,
            backgroundImage: b.image_url ? `url(${b.image_url})` : 'none',
            backgroundColor: b.background_color || NAVY,
            backgroundSize: 'cover', backgroundPosition: 'center',
            opacity: i === current ? 1 : 0,
            transition: 'opacity 0.8s ease-in-out',
            zIndex: 0
          }}
        />
      ))}
      <Box sx={{
        position: 'absolute', inset: 0, zIndex: 1,
        background: `linear-gradient(135deg, ${alpha(bgColor, 0.92)} 0%, ${alpha(bgColor, 0.7)} 45%, ${alpha(bgColor, 0.3)} 100%)`
      }} />
      <Box sx={{ position: 'relative', zIndex: 2, p: { xs: 3, md: 6 }, maxWidth: 680 }}>
        {banner.subtitle && (
          <Chip label={banner.subtitle} size="small" sx={{
            mb: 2, fontWeight: 700, letterSpacing: 0.5,
            bgcolor: alpha(txtColor, 0.18), color: txtColor,
            borderRadius: 2, px: 1, fontSize: '0.75rem'
          }} />
        )}
        <Typography variant="h3" sx={{
          color: txtColor, fontWeight: 900, mb: 2,
          fontSize: { xs: '1.5rem', sm: '2rem', md: '2.6rem' },
          lineHeight: 1.15, textShadow: '0 2px 12px rgba(0,0,0,0.25)',
          letterSpacing: '-0.5px'
        }}>
          {banner.title}
        </Typography>
        {banner.description && (
          <Typography variant="body1" sx={{
            color: alpha(txtColor, 0.88), mb: 3, fontWeight: 400,
            lineHeight: 1.7, maxWidth: 540,
            display: '-webkit-box', WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical', overflow: 'hidden'
          }}>
            {banner.description}
          </Typography>
        )}
        {banner.cta_text && banner.cta_link && (
          <Button
            variant="contained" size="large" endIcon={<ArrowForwardIcon />}
            component={banner.cta_link.startsWith('/') ? Link : 'a'}
            {...(banner.cta_link.startsWith('/') ? { to: banner.cta_link } : { href: banner.cta_link, target: '_blank' })}
            sx={{
              borderRadius: 3, px: 4, py: 1.3, fontWeight: 700,
              bgcolor: RED, color: 'white', textTransform: 'none', fontSize: '0.95rem',
              boxShadow: '0 4px 16px rgba(204,0,0,0.35)',
              '&:hover': { bgcolor: '#b30000', transform: 'translateY(-2px)', boxShadow: '0 6px 24px rgba(204,0,0,0.45)' },
              transition: 'all 0.25s ease'
            }}
          >
            {banner.cta_text}
          </Button>
        )}
      </Box>
      {items.length > 1 && (
        <>
          <IconButton className="hero-nav" onClick={prev} sx={{
            position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
            bgcolor: alpha('#fff', 0.15), color: 'white', opacity: 0, zIndex: 3,
            backdropFilter: 'blur(4px)', transition: 'all 0.3s',
            '&:hover': { bgcolor: alpha('#fff', 0.3) }
          }}>
            <ChevronLeftIcon />
          </IconButton>
          <IconButton className="hero-nav" onClick={next} sx={{
            position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
            bgcolor: alpha('#fff', 0.15), color: 'white', opacity: 0, zIndex: 3,
            backdropFilter: 'blur(4px)', transition: 'all 0.3s',
            '&:hover': { bgcolor: alpha('#fff', 0.3) }
          }}>
            <ChevronRightIcon />
          </IconButton>
          <Stack direction="row" spacing={1} sx={{
            position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 3
          }}>
            {items.map((_, i) => (
              <Box key={i} onClick={() => goTo(i)} sx={{
                width: i === current ? 28 : 8, height: 8, borderRadius: 4,
                bgcolor: i === current ? 'white' : alpha('#fff', 0.35),
                cursor: 'pointer', transition: 'all 0.35s ease',
                '&:hover': { bgcolor: alpha('#fff', 0.7) }
              }} />
            ))}
          </Stack>
        </>
      )}
    </Paper>
  );
};

/* ════════════════════════════════════════════════════════════════════
   Section Header
   ════════════════════════════════════════════════════════════════════ */
const SectionHeader = ({ icon, title, action }) => (
  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
    <Stack direction="row" spacing={1.5} alignItems="center">
      {icon}
      <Typography variant="h6" fontWeight="800" letterSpacing="-0.3px">{title}</Typography>
    </Stack>
    {action}
  </Stack>
);

/* ════════════════════════════════════════════════════════════════════
   Stat Card
   ════════════════════════════════════════════════════════════════════ */
const StatCard = ({ icon, value, label, color, delay = 0, link }) => (
  <Card
    elevation={0}
    component={link ? Link : 'div'}
    to={link || undefined}
    sx={{
      height: '180px', borderRadius: CARD_RADIUS, textDecoration: 'none',
      border: `2px solid ${alpha(color, 0.5)}`,
      animation: `${fadeIn} 0.5s ease ${delay}s both`,
      transition: 'all 0.25s', display: 'flex', flexDirection: 'column',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: `0 8px 24px ${alpha(color, 0.15)}`,
        borderColor: color
      }
    }}
  >
    <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 2.5 }}>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(color, 0.1), display: 'flex' }}>
          {icon}
        </Box>
        <Typography variant="body2" color="text.secondary" fontWeight="700">{label}</Typography>
      </Stack>
      <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h3" fontWeight="900" color={color}>{value ?? 0}</Typography>
      </Box>
    </CardContent>
  </Card>
);

/* ════════════════════════════════════════════════════════════════════
   Event Card — compact, date-prominent
   ════════════════════════════════════════════════════════════════════ */
const EventCard = ({ event, index }) => {
  const dateParts = formatShortDate(event.start_date);
  const colors = {
    reunion: NAVY, formation: '#6a1b9a', administratif: RED,
    academic: NAVY, cultural: RED, sports: '#2e7d32',
    conference: '#6a1b9a', general: '#455a64'
  };
  const color = colors[event.type || event.category] || colors.general;

  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex', borderRadius: CARD_RADIUS, overflow: 'hidden',
        border: '1px solid', borderColor: 'divider',
        animation: `${slideUp} 0.4s ease ${index * 0.08}s both`,
        transition: 'all 0.25s ease',
        '&:hover': {
          borderColor: color, boxShadow: `0 4px 16px ${alpha(color, 0.12)}`,
          transform: 'translateY(-2px)'
        }
      }}
    >
      <Box sx={{
        width: 72, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: `linear-gradient(180deg, ${alpha(color, 0.08)} 0%, ${alpha(color, 0.02)} 100%)`,
        borderRight: `3px solid ${color}`, py: 1.5
      }}>
        <Typography variant="h5" fontWeight="900" color={color} lineHeight={1}>
          {dateParts.day}
        </Typography>
        <Typography variant="caption" fontWeight="700" color={color} sx={{ mt: 0.3 }}>
          {dateParts.month}
        </Typography>
      </Box>
      <Box sx={{ flex: 1, py: 1.5, px: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Typography variant="subtitle2" fontWeight="700" sx={{ mb: 0.3, lineHeight: 1.3 }}>
          {event.title}
        </Typography>
        {event.description && (
          <Typography variant="caption" color="text.secondary" sx={{
            display: '-webkit-box', WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical', overflow: 'hidden', mb: 0.5
          }}>
            {(event.description || '').replace(/\\n/g, '\n')}
          </Typography>
        )}
        {event.location && (
          <Stack direction="row" spacing={0.5} alignItems="center">
            <LocationOnIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
            <Typography variant="caption" color="text.secondary" fontSize="0.7rem">{event.location}</Typography>
          </Stack>
        )}
      </Box>
    </Paper>
  );
};

/* ════════════════════════════════════════════════════════════════════
   News Card — magazine-style with image
   ════════════════════════════════════════════════════════════════════ */
const NewsCard = ({ item, index }) => (
  <Card
    elevation={0}
    sx={{
      height: '100%', display: 'flex', flexDirection: 'column',
      borderRadius: CARD_RADIUS, overflow: 'hidden',
      border: '1px solid', borderColor: 'divider',
      animation: `${slideUp} 0.5s ease ${index * 0.1}s both`,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        transform: 'translateY(-6px)',
        boxShadow: '0 12px 32px rgba(0,0,0,0.1)',
        borderColor: 'transparent',
        '& .news-img': { transform: 'scale(1.05)' }
      }
    }}
  >
    <Box sx={{ overflow: 'hidden', height: 180, position: 'relative' }}>
      <CardMedia
        className="news-img"
        component="img" height="180"
        image={item.image_url || 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&q=80'}
        alt={item.title}
        sx={{ transition: 'transform 0.5s ease', objectFit: 'cover' }}
      />
      <Box sx={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 50%)'
      }} />
      {item.is_featured && (
        <Chip label="A la une" size="small" sx={{
          position: 'absolute', top: 10, left: 10,
          bgcolor: RED, color: 'white', fontWeight: 700, fontSize: '0.7rem', height: 24
        }} />
      )}
      <Chip
        label={item.category || 'general'} size="small"
        sx={{
          position: 'absolute', top: 10, right: 10,
          bgcolor: alpha('#000', 0.55), color: 'white', fontWeight: 600,
          textTransform: 'uppercase', fontSize: '0.6rem', height: 22,
          backdropFilter: 'blur(4px)'
        }}
      />
    </Box>
    <CardContent sx={{ flexGrow: 1, p: 2.5, display: 'flex', flexDirection: 'column' }}>
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1, lineHeight: 1.35 }}>
        {item.title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{
        display: '-webkit-box', WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical', overflow: 'hidden',
        lineHeight: 1.6, mb: 'auto'
      }}>
        {(item.content || item.excerpt || '').replace(/\\n/g, '\n')}
      </Typography>
      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
        <AccessTimeIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
        <Typography variant="caption" color="text.secondary" fontWeight="500">
          {formatDate(item.published_at)}
        </Typography>
      </Stack>
    </CardContent>
  </Card>
);

/* ════════════════════════════════════════════════════════════════════
   MAIN PROFESSOR DASHBOARD
   ════════════════════════════════════════════════════════════════════ */
const ProfessorDashboardPage = () => {
  const { authState } = useAuth();
  const [dashboardData, setDashboardData] = useState(EMPTY_DASHBOARD);
  const [learningInsights, setLearningInsights] = useState(EMPTY_LEARNING_INSIGHTS);
  const [cmsBanners, setCmsBanners] = useState([]);
  const [cmsNews, setCmsNews] = useState([]);
  const [cmsEvents, setCmsEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!authState.isProfessor || !authState.profile?.id) throw new Error('Profil professeur non disponible');

        const [dashRes, bannersRes, newsRes, eventsRes, insightsRes] = await Promise.all([
          getProfessorDashboardData({ profileId: authState.profile.id, professorId: authState.professor?.id }),
          getCMSBanners(), getCMSNews(4), getCMSEvents(5),
          getProfessorLearningInsights({ profileId: authState.profile.id })
        ]);

        if (dashRes.error) throw dashRes.error;
        if (active) {
          setDashboardData(dashRes.data || EMPTY_DASHBOARD);
          setLearningInsights(insightsRes.data || EMPTY_LEARNING_INSIGHTS);
          setCmsBanners(bannersRes.data || []);
          setCmsNews(newsRes.data || []);
          setCmsEvents(eventsRes.data || []);
        }
      } catch (e) {
        if (active) {
          setError(e.message || 'Erreur de chargement');
          setDashboardData(EMPTY_DASHBOARD);
          setLearningInsights(EMPTY_LEARNING_INSIGHTS);
        }
      } finally { if (active) setLoading(false); }
    };
    if (authState.isProfessor) load(); else setLoading(false);
    return () => { active = false; };
  }, [authState.isProfessor, authState.profile?.id, authState.professor?.id]);

  const urgentGrades = useMemo(() => dashboardData.pendingGrades?.length || 0, [dashboardData.pendingGrades]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '70vh', gap: 2 }}>
        <CircularProgress size={48} thickness={3} sx={{ color: NAVY }} />
        <Typography variant="body2" color="text.secondary" fontWeight="500">Chargement de votre espace...</Typography>
      </Box>
    );
  }

  const firstName = authState.profile?.full_name?.split(' ')[0] || 'Professeur';

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1280, mx: 'auto', animation: `${fadeIn} 0.5s ease-out` }}>
      {error && <Alert severity="error" variant="filled" sx={{ mb: 3, borderRadius: CARD_RADIUS }}>{error}</Alert>}

      {/* ─── Header ─── */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        sx={{ mb: 3 }} spacing={2}
      >
        <Box>
          <Typography variant="h4" fontWeight="900" color="text.primary" sx={{ letterSpacing: '-0.5px' }}>
            Bonjour, {firstName}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Bienvenue sur votre espace professeur ESGIS
          </Typography>
        </Box>
        <Paper elevation={0} sx={{
          py: 1, px: 2, borderRadius: 2, bgcolor: alpha(NAVY, 0.04),
          border: '1px solid', borderColor: 'divider'
        }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <CalendarTodayIcon sx={{ fontSize: 18, color: NAVY }} />
            <Typography variant="body2" fontWeight="600" color={NAVY}>
              {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
            </Typography>
          </Stack>
        </Paper>
      </Stack>

      {/* ─── Hero Carousel ─── */}
      <HeroBanner banners={cmsBanners} />

      {/* ─── Urgent: Pending Grades ─── */}
      {urgentGrades > 0 && (
        <Alert severity="warning" variant="outlined" sx={{
          mb: 3, borderRadius: CARD_RADIUS, border: '2px solid #f59e0b',
          bgcolor: alpha('#f59e0b', 0.04)
        }}
          action={<Button variant="contained" color="warning" size="small" component={Link} to="/professor/grades" sx={{ borderRadius: 2, fontWeight: 'bold' }}>Noter</Button>}
        >
          <Typography variant="subtitle1" fontWeight="bold">{urgentGrades} note(s) en attente de correction</Typography>
        </Alert>
      )}

      {/* ─── Stats ─── */}
      {dashboardData.stats && (
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          <Grid item xs={6} md={3}>
            <StatCard icon={<PeopleIcon sx={{ fontSize: 28, color: NAVY }} />} value={dashboardData.stats.totalStudents} label="Etudiants" color={NAVY} delay={0} link="/professor/students" />
          </Grid>
          <Grid item xs={6} md={3}>
            <StatCard icon={<SchoolIcon sx={{ fontSize: 28, color: '#2e7d32' }} />} value={dashboardData.stats.totalCourses} label="Cours" color="#2e7d32" delay={0.1} link="/professor/courses" />
          </Grid>
          <Grid item xs={6} md={3}>
            <StatCard icon={<AssignmentIcon sx={{ fontSize: 28, color: RED }} />} value={dashboardData.stats.totalExams} label="Examens" color={RED} delay={0.2} link="/professor/exams" />
          </Grid>
          <Grid item xs={6} md={3}>
            <StatCard icon={<GradingIcon sx={{ fontSize: 28, color: '#ed6c02' }} />} value={dashboardData.stats.pendingGrades} label="Notes en attente" color="#ed6c02" delay={0.3} link="/professor/grades" />
          </Grid>
        </Grid>
      )}

      {learningInsights.courses.length > 0 && (
        <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: CARD_RADIUS, border: '1px solid', borderColor: 'divider' }}>
          <SectionHeader
            icon={<TrendingUpIcon sx={{ color: NAVY }} />}
            title="Pilotage pedagogique ESGIS"
            action={
              <Button
                size="small"
                variant="text"
                component={Link}
                to="/professor/learning-insights"
                endIcon={<ArrowForwardIcon />}
                sx={{ fontWeight: 600, color: NAVY }}
              >
                Configurer
              </Button>
            }
          />

          <Grid container spacing={2} sx={{ mb: learningInsights.studentsNeedingAttention.length ? 2.5 : 0 }}>
            {[
              {
                label: 'Progression moyenne',
                value: `${Math.round(learningInsights.summary.averageProgress)}%`,
                subtitle: `${learningInsights.summary.totalTrackedStudents} etudiants traces`,
                color: NAVY
              },
              {
                label: 'Cours personnalises',
                value: learningInsights.summary.configuredCourses,
                subtitle: `${learningInsights.summary.totalCourses} cours suivis`,
                color: '#2e7d32'
              },
              {
                label: 'Etudiants a risque',
                value: learningInsights.summary.atRiskStudents,
                subtitle: `${learningInsights.summary.overdueActivities} activite(s) en retard`,
                color: RED
              },
              {
                label: 'Projection moyenne',
                value: `${learningInsights.summary.averagePredictedGrade.toFixed(1)}/20`,
                subtitle: `${Math.round(learningInsights.summary.averageAttendance)}% de presence moyenne`,
                color: '#ed6c02'
              }
            ].map((item) => (
              <Grid item xs={12} sm={6} md={3} key={item.label}>
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: alpha(item.color, 0.25),
                    backgroundColor: alpha(item.color, 0.04),
                    height: '100%'
                  }}
                >
                  <Typography variant="body2" color="text.secondary" fontWeight="700" sx={{ mb: 1 }}>
                    {item.label}
                  </Typography>
                  <Typography variant="h4" fontWeight="900" sx={{ color: item.color, mb: 0.5 }}>
                    {item.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.subtitle}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          {learningInsights.studentsNeedingAttention.length > 0 && (
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: alpha(RED, 0.2),
                backgroundColor: alpha(RED, 0.03)
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                <WarningAmberIcon sx={{ color: RED, fontSize: 20 }} />
                <Typography variant="subtitle2" fontWeight="800">
                  Vigilance immediate
                </Typography>
              </Stack>
              <Stack spacing={1}>
                {learningInsights.studentsNeedingAttention.slice(0, 3).map((studentItem) => (
                  <Stack
                    key={studentItem.id}
                    direction={{ xs: 'column', sm: 'row' }}
                    justifyContent="space-between"
                    spacing={1}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight="700">
                        {studentItem.studentName} · {studentItem.courseName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {(studentItem.reasons || []).slice(0, 2).join(' · ') || 'Aucun detail'}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip size="small" color="warning" label={`${Math.round(studentItem.progress)}%`} />
                      <Chip size="small" color="error" label={studentItem.severity} />
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            </Box>
          )}
        </Paper>
      )}

      {/* ─── Main Content Grid ─── */}
      <Grid container spacing={3}>
        {/* ── Left: Courses + Exams ── */}
        <Grid item xs={12} md={7}>
          <Stack spacing={3}>
            {/* Courses */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: CARD_RADIUS, border: '1px solid', borderColor: 'divider' }}>
              <SectionHeader
                icon={<SchoolIcon sx={{ color: NAVY }} />}
                title="Mes cours"
                action={<Button size="small" variant="text" component={Link} to="/professor/courses" endIcon={<ArrowForwardIcon />} sx={{ fontWeight: 600, color: NAVY }}>Tout voir</Button>}
              />
              {dashboardData.courses.length > 0 ? (
                <Grid container spacing={2}>
                  {dashboardData.courses.slice(0, 4).map((course, idx) => (
                    <Grid item xs={12} sm={6} key={course.id}>
                      <Paper elevation={0} sx={{
                        p: 2, borderRadius: CARD_RADIUS, border: '1px solid', borderColor: 'divider',
                        animation: `${fadeIn} 0.4s ease ${idx * 0.1}s both`,
                        transition: 'all 0.2s',
                        '&:hover': { borderColor: NAVY, boxShadow: `0 4px 12px ${alpha(NAVY, 0.08)}`, transform: 'translateY(-2px)' }
                      }}>
                        <Typography variant="subtitle1" fontWeight="bold" noWrap>{course.title}</Typography>
                        <Typography variant="caption" color="text.secondary">{course.department} - {course.level}</Typography>
                        <Stack direction="row" spacing={1} mt={1}>
                          <Chip icon={<PeopleIcon sx={{ fontSize: 14 }} />} label={`${course.students} etud.`} size="small" variant="outlined" />
                          <Chip icon={<EventIcon sx={{ fontSize: 14 }} />} label={`${course.sessions} sess.`} size="small" variant="outlined" />
                        </Stack>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <SchoolIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                  <Typography color="text.secondary">Aucun cours assigne</Typography>
                </Box>
              )}
            </Paper>

            {/* Exams */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: CARD_RADIUS, border: '1px solid', borderColor: 'divider' }}>
              <SectionHeader
                icon={<AssignmentIcon sx={{ color: RED }} />}
                title="Mes examens"
                action={<Button size="small" variant="text" component={Link} to="/professor/exams" endIcon={<ArrowForwardIcon />} sx={{ fontWeight: 600, color: NAVY }}>Tout voir</Button>}
              />
              {dashboardData.exams.length > 0 ? (
                <List disablePadding>
                  {dashboardData.exams.slice(0, 4).map((exam, idx) => {
                    const st = examStatusMap[exam.status] || { label: exam.status, color: 'default' };
                    return (
                      <Box key={exam.id}>
                        <ListItem sx={{ px: 0, py: 1.5, animation: `${fadeIn} 0.4s ease ${idx * 0.1}s both` }}>
                          <ListItemText
                            primary={<Typography fontWeight="bold">{exam.title}</Typography>}
                            secondary={<><Typography variant="caption">{exam.course}</Typography> &middot; <Typography variant="caption">{formatDate(exam.date)}</Typography></>}
                          />
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Chip label={st.label} size="small" color={st.color} sx={{ fontWeight: 700 }} />
                            <Button size="small" variant="text" component={Link} to={`/professor/exams/${exam.id}`}>Details</Button>
                          </Stack>
                        </ListItem>
                        {idx < Math.min(dashboardData.exams.length, 4) - 1 && <Divider />}
                      </Box>
                    );
                  })}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <AssignmentIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                  <Typography color="text.secondary">Aucun examen programme</Typography>
                </Box>
              )}
            </Paper>
          </Stack>
        </Grid>

        {/* ── Right: Events ── */}
        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: CARD_RADIUS, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <SectionHeader
              icon={<EventIcon sx={{ color: NAVY }} />}
              title="Evenements a venir"
            />
            {cmsEvents.length > 0 ? (
              <Stack spacing={1.5}>
                {cmsEvents.slice(0, 5).map((event, idx) => (
                  <EventCard key={event.id} event={event} index={idx} />
                ))}
              </Stack>
            ) : (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <EventIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">Aucun evenement a venir</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* ─── News Section ─── */}
      <Box sx={{ mt: 5 }}>
        <SectionHeader
          icon={<NewspaperIcon sx={{ color: NAVY, fontSize: 28 }} />}
          title="Dernieres Actualites"
        />
        <Grid container spacing={3}>
          {cmsNews.length > 0 ? (
            cmsNews.map((item, idx) => (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
                <NewsCard item={item} index={idx} />
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Paper elevation={0} sx={{
                p: 5, textAlign: 'center', borderRadius: CARD_RADIUS,
                border: '1px dashed', borderColor: 'divider', bgcolor: alpha(NAVY, 0.01)
              }}>
                <NewspaperIcon sx={{ fontSize: 44, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body1" color="text.secondary" fontWeight="500">
                  Aucune actualite pour le moment
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Box>
    </Box>
  );
};

export default ProfessorDashboardPage;
