import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Alert, Box, Button, Card, CardContent, CardMedia,
  CircularProgress, Divider, Grid, List, ListItem, ListItemText,
  Typography, Paper, alpha, keyframes, Stack, Chip, IconButton
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
  EventNote as EventNoteIcon,
  Newspaper as NewspaperIcon,
  MenuBook as MenuBookIcon,
  FiberManualRecord as DotIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';
import { getStudentDashboardData } from '@/api/studentDashboard';

/* ─── Animations ─── */
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

/* ─── Helpers ─── */
const formatDate = (dateString) => {
  if (!dateString) return '-';
  try { return format(new Date(dateString), 'PPP', { locale: fr }); }
  catch { return dateString; }
};

const formatTime = (dateString) => {
  if (!dateString) return '--:--';
  try { return format(new Date(dateString), 'HH:mm'); }
  catch { return '--:--'; }
};

const formatShortDate = (dateString) => {
  if (!dateString) return { day: '--', month: '---' };
  try {
    const d = new Date(dateString);
    return { day: format(d, 'dd'), month: format(d, 'MMM', { locale: fr }).toUpperCase() };
  } catch { return { day: '--', month: '---' }; }
};

/* ─── Theme constants ─── */
const NAVY = '#003366';
const RED = '#CC0000';
const CARD_RADIUS = 3;
const CARD_SHADOW = '0 2px 16px rgba(0,0,0,0.06)';

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
          <MenuBookIcon sx={{ fontSize: 56, color: alpha('#fff', 0.7), mb: 2 }} />
          <Typography variant="h3" sx={{ color: 'white', fontWeight: 900, mb: 1, fontSize: { xs: '1.6rem', md: '2.4rem' } }}>
            Bienvenue sur ESGIS Campus
          </Typography>
          <Typography variant="h6" sx={{ color: alpha('#fff', 0.8), fontWeight: 400 }}>
            Votre espace etudiant centralise
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
      {/* Background images — stacked for crossfade */}
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

      {/* Gradient overlay */}
      <Box sx={{
        position: 'absolute', inset: 0, zIndex: 1,
        background: `linear-gradient(135deg, ${alpha(bgColor, 0.92)} 0%, ${alpha(bgColor, 0.7)} 45%, ${alpha(bgColor, 0.3)} 100%)`
      }} />

      {/* Content */}
      <Box sx={{ position: 'relative', zIndex: 2, p: { xs: 3, md: 6 }, maxWidth: 680 }}>
        {banner.subtitle && (
          <Chip
            label={banner.subtitle}
            size="small"
            sx={{
              mb: 2, fontWeight: 700, letterSpacing: 0.5,
              bgcolor: alpha(txtColor, 0.18), color: txtColor,
              borderRadius: 2, px: 1, fontSize: '0.75rem'
            }}
          />
        )}
        <Typography
          variant="h3"
          sx={{
            color: txtColor, fontWeight: 900, mb: 2,
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.6rem' },
            lineHeight: 1.15, textShadow: '0 2px 12px rgba(0,0,0,0.25)',
            letterSpacing: '-0.5px'
          }}
        >
          {banner.title}
        </Typography>
        {banner.description && (
          <Typography
            variant="body1"
            sx={{
              color: alpha(txtColor, 0.88), mb: 3, fontWeight: 400,
              lineHeight: 1.7, maxWidth: 540,
              display: '-webkit-box', WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical', overflow: 'hidden'
            }}
          >
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

      {/* Navigation arrows */}
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
              <Box
                key={i} onClick={() => goTo(i)}
                sx={{
                  width: i === current ? 28 : 8, height: 8, borderRadius: 4,
                  bgcolor: i === current ? 'white' : alpha('#fff', 0.35),
                  cursor: 'pointer', transition: 'all 0.35s ease',
                  '&:hover': { bgcolor: alpha('#fff', 0.7) }
                }}
              />
            ))}
          </Stack>
        </>
      )}
    </Paper>
  );
};

/* ════════════════════════════════════════════════════════════════════
   Announcements — slim, professional notification bars
   ════════════════════════════════════════════════════════════════════ */
const AnnouncementsBanner = ({ announcements }) => {
  if (!announcements?.length) return null;

  const priorityConfig = {
    urgent: { color: '#d32f2f', label: 'Urgent', icon: '🔴' },
    high:   { color: '#e65100', label: 'Important', icon: '🟠' },
    normal: { color: NAVY, label: 'Info', icon: '🔵' },
    low:    { color: '#2e7d32', label: 'Info', icon: '🟢' }
  };

  return (
    <Stack spacing={1.5} sx={{ mb: 4 }}>
      {announcements.map((a) => {
        const cfg = priorityConfig[a.priority] || priorityConfig.normal;
        return (
          <Paper
            key={a.id} elevation={0}
            sx={{
              px: 3, py: 2, borderRadius: CARD_RADIUS,
              borderLeft: `4px solid ${cfg.color}`,
              bgcolor: alpha(cfg.color, 0.04),
              display: 'flex', alignItems: 'flex-start', gap: 2,
              transition: 'all 0.2s ease',
              '&:hover': { bgcolor: alpha(cfg.color, 0.08), boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }
            }}
          >
            <CampaignIcon sx={{ color: cfg.color, fontSize: 24, mt: 0.3, flexShrink: 0 }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.3 }}>
                <Typography variant="subtitle2" fontWeight="bold" color={cfg.color} noWrap>
                  {a.title}
                </Typography>
                <Chip
                  label={cfg.label} size="small"
                  sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: alpha(cfg.color, 0.12), color: cfg.color }}
                />
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{
                display: '-webkit-box', WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5,
                whiteSpace: 'pre-line'
              }}>
                {(a.content || '').replace(/\\n/g, '\n')}
              </Typography>
            </Box>
          </Paper>
        );
      })}
    </Stack>
  );
};

/* ════════════════════════════════════════════════════════════════════
   Event Card — compact, date-prominent
   ════════════════════════════════════════════════════════════════════ */
const EventCard = ({ event, index }) => {
  const dateParts = formatShortDate(event.start_date);
  const colors = {
    academic: NAVY, cultural: RED, sports: '#2e7d32',
    conference: '#6a1b9a', general: '#455a64'
  };
  const color = colors[event.category] || colors.general;

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
            WebkitBoxOrient: 'vertical', overflow: 'hidden', mb: 0.5,
            whiteSpace: 'pre-line'
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
        lineHeight: 1.6, mb: 'auto', whiteSpace: 'pre-line'
      }}>
        {((item.content || item.excerpt || '').replace(/\\n/g, '\n'))}
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
   Section Header — reusable
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
   Stat Card — compact key-info block
   ════════════════════════════════════════════════════════════════════ */
const StatCard = ({ icon, label, value, color, link, borderColor }) => (
  <Card
    elevation={0}
    component={link ? Link : 'div'}
    to={link || undefined}
    sx={{
      height: '100%', borderRadius: CARD_RADIUS, textDecoration: 'none',
      border: '1px solid', borderColor: 'divider',
      borderTop: `4px solid ${borderColor || color || NAVY}`,
      transition: 'all 0.25s ease',
      '&:hover': link ? { transform: 'translateY(-3px)', boxShadow: CARD_SHADOW, borderColor: 'transparent' } : {}
    }}
  >
    <CardContent sx={{ p: 2.5 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
        <Box sx={{
          width: 40, height: 40, borderRadius: 2, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          bgcolor: alpha(color || NAVY, 0.08)
        }}>
          {icon}
        </Box>
        <Typography variant="body2" color="text.secondary" fontWeight="600">{label}</Typography>
      </Stack>
      {value}
    </CardContent>
  </Card>
);

/* ════════════════════════════════════════════════════════════════════
   MAIN DASHBOARD
   ════════════════════════════════════════════════════════════════════ */
const DashboardPage = () => {
  const { authState } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    next_course: null, recent_grades: [], schedule: [],
    banners: [], news: [], events: [], announcements: [],
    requests: [], upcoming_exams: []
  });

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
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '70vh', gap: 2 }}>
        <CircularProgress size={48} thickness={3} sx={{ color: NAVY }} />
        <Typography variant="body2" color="text.secondary" fontWeight="500">Chargement de votre espace...</Typography>
      </Box>
    );
  }

  const firstName = authState.profile?.full_name?.split(' ')[0] || 'Etudiant';

  return (
    <Box sx={{
      p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1280, mx: 'auto',
      animation: `${fadeIn} 0.5s ease-out`
    }}>
      {error && (
        <Alert severity="error" variant="filled" sx={{ mb: 3, borderRadius: CARD_RADIUS }}>{error}</Alert>
      )}

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
            Bienvenue sur votre espace ESGIS
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
      <HeroBanner banners={dashboardData.banners} />

      {/* ─── Announcements ─── */}
      <AnnouncementsBanner announcements={dashboardData.announcements} />

      {/* ─── Quick Stats Row ─── */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<SchoolIcon sx={{ color: NAVY, fontSize: 22 }} />}
            label="Prochain cours"
            color={NAVY}
            borderColor={NAVY}
            link="/student/schedule"
            value={
              dashboardData.next_course ? (
                <>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ lineHeight: 1.3, mb: 0.5 }}>
                    {dashboardData.next_course.name}
                  </Typography>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <AccessTimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">{formatTime(dashboardData.next_course.time)}</Typography>
                  </Stack>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">Aucun cours prevu</Typography>
              )
            }
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<GradeIcon sx={{ color: RED, fontSize: 22 }} />}
            label="Dernieres notes"
            color={RED}
            borderColor={RED}
            link="/student/grades"
            value={
              dashboardData.recent_grades.length > 0 ? (
                <Stack spacing={0.5}>
                  {dashboardData.recent_grades.slice(0, 2).map((g) => (
                    <Stack key={g.id} direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" noWrap sx={{ maxWidth: 120 }}>{g.course_name}</Typography>
                      <Chip label={`${g.value}/${g.max_value}`} size="small" sx={{
                        fontWeight: 800, fontSize: '0.75rem', bgcolor: alpha(NAVY, 0.08), color: NAVY
                      }} />
                    </Stack>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">Aucune note recente</Typography>
              )
            }
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<EventIcon sx={{ color: '#6a1b9a', fontSize: 22 }} />}
            label="Evenements"
            color="#6a1b9a"
            borderColor="#6a1b9a"
            value={
              <Typography variant="h4" fontWeight="900" color="#6a1b9a">
                {dashboardData.events.length}
                <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>a venir</Typography>
              </Typography>
            }
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<RequestIcon sx={{ color: '#2e7d32', fontSize: 22 }} />}
            label="Mes demarches"
            color="#2e7d32"
            borderColor="#2e7d32"
            link="/student/requests"
            value={
              <Typography variant="h4" fontWeight="900" color="#2e7d32">
                {dashboardData.requests.length}
                <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>en cours</Typography>
              </Typography>
            }
          />
        </Grid>
      </Grid>

      {/* ─── Priority Actions ─── */}
      {(dashboardData.upcoming_exams.length > 0 || dashboardData.requests.filter(r => r.status === 'ready').length > 0) && (
        <Box sx={{ mb: 4 }}>
          <SectionHeader
            icon={<WarningIcon sx={{ color: '#f59e0b' }} />}
            title="Actions prioritaires"
          />
          <Grid container spacing={2}>
            {dashboardData.upcoming_exams.map(exam => (
              <Grid item xs={12} md={6} key={exam.id}>
                <Alert severity="warning" variant="outlined" sx={{
                  borderRadius: CARD_RADIUS, borderLeft: '5px solid #f59e0b',
                  bgcolor: alpha('#f59e0b', 0.03)
                }}
                  action={
                    <Button variant="contained" color="warning" size="small" component={Link} to="/student/exams" sx={{ borderRadius: 2 }}>
                      Voir
                    </Button>
                  }
                >
                  <Typography variant="subtitle2" fontWeight="bold">Examen : {exam.title}</Typography>
                  <Typography variant="body2">Debut a {formatTime(exam.start_time)}</Typography>
                </Alert>
              </Grid>
            ))}
            {dashboardData.requests.filter(r => r.status === 'ready').map(req => (
              <Grid item xs={12} md={6} key={req.id}>
                <Alert severity="success" variant="outlined" sx={{
                  borderRadius: CARD_RADIUS, borderLeft: '5px solid #2e7d32',
                  bgcolor: alpha('#2e7d32', 0.03)
                }}
                  action={
                    <Button variant="contained" color="success" size="small" component={Link} to="/student/requests" sx={{ borderRadius: 2 }}>
                      Telecharger
                    </Button>
                  }
                >
                  <Typography variant="subtitle2" fontWeight="bold">Document pret : {req.request_type}</Typography>
                </Alert>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* ─── Main Content Grid ─── */}
      <Grid container spacing={3}>
        {/* ── Events Column ── */}
        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: CARD_RADIUS, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <SectionHeader
              icon={<EventIcon sx={{ color: NAVY }} />}
              title="Evenements a venir"
            />
            {dashboardData.events.length > 0 ? (
              <Stack spacing={1.5}>
                {dashboardData.events.slice(0, 5).map((event, idx) => (
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

        {/* ── Quick Access Column ── */}
        <Grid item xs={12} md={7}>
          <Stack spacing={3} sx={{ height: '100%' }}>
            {/* Grades detail */}
            {dashboardData.recent_grades.length > 0 && (
              <Paper elevation={0} sx={{ p: 3, borderRadius: CARD_RADIUS, border: '1px solid', borderColor: 'divider' }}>
                <SectionHeader
                  icon={<GradeIcon sx={{ color: RED }} />}
                  title="Resultats recents"
                  action={
                    <Button variant="text" size="small" component={Link} to="/student/grades"
                      endIcon={<ArrowForwardIcon />} sx={{ fontWeight: 600, color: NAVY }}
                    >
                      Tout voir
                    </Button>
                  }
                />
                <List disablePadding>
                  {dashboardData.recent_grades.map((grade, idx) => (
                    <Box key={grade.id}>
                      <ListItem sx={{ px: 0, py: 1.2 }}>
                        <ListItemText
                          primary={<Typography fontWeight="600" variant="body2">{grade.course_name}</Typography>}
                          secondary={formatDate(grade.published_at)}
                        />
                        <Chip
                          label={`${grade.value}/${grade.max_value}`}
                          sx={{
                            fontWeight: 800, fontSize: '0.85rem',
                            bgcolor: grade.value >= 14 ? alpha('#2e7d32', 0.1) : grade.value >= 10 ? alpha(NAVY, 0.08) : alpha(RED, 0.08),
                            color: grade.value >= 14 ? '#2e7d32' : grade.value >= 10 ? NAVY : RED
                          }}
                        />
                      </ListItem>
                      {idx < dashboardData.recent_grades.length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              </Paper>
            )}

            {/* Quick Links */}
            <Paper
              elevation={0}
              sx={{
                p: 3, borderRadius: CARD_RADIUS,
                background: `linear-gradient(135deg, ${NAVY} 0%, #0a4d8c 100%)`,
                color: 'white'
              }}
            >
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUpIcon fontSize="small" /> Acces rapide
              </Typography>
              <Grid container spacing={1.5}>
                {[
                  { label: 'EDT Hebdomadaire', icon: <EventNoteIcon />, to: '/student/weekly-schedules' },
                  { label: 'Mes notes', icon: <GradeIcon />, to: '/student/grades' },
                  { label: 'Mes examens', icon: <SchoolIcon />, to: '/student/exams' },
                  { label: 'Mes demarches', icon: <RequestIcon />, to: '/student/requests' }
                ].map((item) => (
                  <Grid item xs={6} key={item.to}>
                    <Button
                      fullWidth variant="outlined" component={Link} to={item.to}
                      startIcon={item.icon}
                      sx={{
                        color: 'white', borderColor: alpha('#fff', 0.25),
                        borderRadius: 2, justifyContent: 'flex-start', py: 1.2,
                        textTransform: 'none', fontWeight: 600, fontSize: '0.8rem',
                        '&:hover': { borderColor: 'white', bgcolor: alpha('#fff', 0.1) }
                      }}
                    >
                      {item.label}
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Stack>
        </Grid>
      </Grid>

      {/* ─── News Section ─── */}
      <Box sx={{ mt: 5 }}>
        <SectionHeader
          icon={<NewspaperIcon sx={{ color: NAVY, fontSize: 28 }} />}
          title="Dernieres Actualites"
        />
        <Grid container spacing={3}>
          {dashboardData.news.length > 0 ? (
            dashboardData.news.map((item, idx) => (
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
                <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
                  Les nouveautes du campus apparaitront ici
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Box>
    </Box>
  );
};

export default DashboardPage;
