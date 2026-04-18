import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
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
  Work as WorkIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { getStudentDashboardData } from '@/api/studentDashboard';
import {
  DASHBOARD_CARD_RADIUS,
  getDashboardIconSx,
  getDashboardInteractiveCardSx,
  getDashboardPanelSx
} from '@/components/dashboard/dashboardCardStyles';

/* ─── Animations ─── */
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
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

// ... HeroBanner and other subcomponents ...
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
          position: 'relative', mb: 4, borderRadius: DASHBOARD_CARD_RADIUS, overflow: 'hidden',
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
        position: 'relative', mb: 4, borderRadius: DASHBOARD_CARD_RADIUS, overflow: 'hidden',
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
          <Chip label={banner.subtitle} size="small"
            sx={{ mb: 2, fontWeight: 700, bgcolor: alpha(txtColor, 0.18), color: txtColor, borderRadius: 2 }} />
        )}
        <Typography variant="h3"
          sx={{ color: txtColor, fontWeight: 900, mb: 2, fontSize: { xs: '1.5rem', sm: '2rem', md: '2.6rem' }, lineHeight: 1.15, textShadow: '0 2px 12px rgba(0,0,0,0.25)' }}>
          {banner.title}
        </Typography>
        {banner.description && (
          <Typography variant="body1" sx={{ color: alpha(txtColor, 0.88), mb: 3, lineHeight: 1.7, maxWidth: 540 }}>
            {banner.description}
          </Typography>
        )}
        {banner.cta_text && banner.cta_link && (
          <Button variant="contained" size="large" endIcon={<ArrowForwardIcon />}
            component={banner.cta_link.startsWith('/') ? Link : 'a'}
            {...(banner.cta_link.startsWith('/') ? { to: banner.cta_link } : { href: banner.cta_link, target: '_blank' })}
            sx={{ borderRadius: DASHBOARD_CARD_RADIUS, px: 4, py: 1.3, fontWeight: 700, bgcolor: RED, color: 'white', textTransform: 'none' }}>
            {banner.cta_text}
          </Button>
        )}
      </Box>
      {items.length > 1 && (
        <>
          <IconButton className="hero-nav" onClick={prev} sx={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', bgcolor: alpha('#fff', 0.15), color: 'white', opacity: 0, zIndex: 3 }}><ChevronLeftIcon /></IconButton>
          <IconButton className="hero-nav" onClick={next} sx={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', bgcolor: alpha('#fff', 0.15), color: 'white', opacity: 0, zIndex: 3 }}><ChevronRightIcon /></IconButton>
        </>
      )}
    </Paper>
  );
};

const EventCard = ({ event, index }) => {
  const dateParts = formatShortDate(event.start_date);
  const color = NAVY;
  return (
    <Paper elevation={0}
      sx={{ ...getDashboardInteractiveCardSx(color), display: 'flex', overflow: 'hidden' }}>
      <Box sx={{ width: 72, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: alpha(color, 0.05), borderRight: `1px solid ${alpha(color, 0.14)}`, py: 1.5 }}>
        <Typography variant="h5" fontWeight="900" color={color}>{dateParts.day}</Typography>
        <Typography variant="caption" fontWeight="700" color={color}>{dateParts.month}</Typography>
      </Box>
      <Box sx={{ flex: 1, py: 1.5, px: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Typography variant="subtitle2" fontWeight="700" noWrap>{event.title}</Typography>
        <Typography variant="caption" color="text.secondary" noWrap>{event.location || 'Campus ESGIS'}</Typography>
      </Box>
    </Paper>
  );
};

const NewsCard = ({ item, index }) => (
  <Card elevation={0} sx={{ ...getDashboardInteractiveCardSx(NAVY), height: '100%', display: 'flex', flexDirection: 'column' }}>
    <CardMedia component="img" height="160" image={item.image_url || 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&q=80'} alt={item.title} />
    <CardContent sx={{ flexGrow: 1, p: 2.5, display: 'flex', flexDirection: 'column' }}>
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom noWrap>{item.title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.description}</Typography>
      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 'auto', pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
        <AccessTimeIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
        <Typography variant="caption" color="text.secondary">{formatDate(item.published_at)}</Typography>
      </Stack>
    </CardContent>
  </Card>
);

const SectionHeader = ({ icon, title, action }) => (
  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
    <Stack direction="row" spacing={1.5} alignItems="center">
      {icon}
      <Typography variant="h6" fontWeight="800">{title}</Typography>
    </Stack>
    {action}
  </Stack>
);

const StatCard = ({ icon, label, value, color, link }) => (
  <Card 
    elevation={0} 
    component={link ? Link : 'div'} 
    {...(link ? { to: link } : {})}
    sx={{ 
      ...getDashboardInteractiveCardSx(color),
      height: '100%', 
      textDecoration: 'none',
      '&:hover': link ? getDashboardInteractiveCardSx(color)['&:hover'] : {}
    }}
  >
    <CardContent sx={{ p: 2.5 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
        <Box sx={getDashboardIconSx(color)}>
          {icon}
        </Box>
        <Typography variant="body2" color="text.secondary" fontWeight="700">{label}</Typography>
      </Stack>
      <Box sx={{ minHeight: 48, display: 'flex', alignItems: 'center' }}>{value}</Box>
    </CardContent>
  </Card>
);

const DashboardPage = () => {
  const { authState } = useAuth();
  const profileId = authState.user?.id;
  const studentId = authState.student?.id;

  const { data: dashboardDataRes, isLoading, error, refetch } = useQuery({
    queryKey: ['studentDashboard', profileId, studentId],
    queryFn: () => getStudentDashboardData({ profileId, studentId }),
    enabled: !!profileId && !!studentId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '70vh', gap: 2 }}>
        <CircularProgress size={48} sx={{ color: NAVY }} />
        <Typography variant="body2" color="text.secondary" fontWeight="500">Chargement de votre espace...</Typography>
      </Box>
    );
  }

  const dashboardData = dashboardDataRes?.data || {
    next_course: null, recent_grades: [], schedule: [],
    banners: [], news: [], events: [], announcements: [],
    requests: [], upcoming_exams: []
  };

  const firstName = authState.profile?.full_name?.split(' ')[0] || 'Étudiant';

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1440, mx: 'auto', animation: `${fadeIn} 0.5s ease-out` }}>
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error.message || 'Erreur de chargement'}</Alert>}

      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ mb: 4 }} spacing={2}>
        <Box>
          <Typography variant="h4" fontWeight="900" color="text.primary">Bonjour, {firstName}</Typography>
          <Typography variant="body1" color="text.secondary">Bienvenue sur votre espace ESGIS Campus</Typography>
        </Box>
        <Paper elevation={0} sx={{ ...getDashboardPanelSx(NAVY), py: 1, px: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <CalendarTodayIcon sx={{ fontSize: 18, color: NAVY }} />
            <Typography variant="body2" fontWeight="600" color={NAVY}>{format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}</Typography>
          </Stack>
        </Paper>
      </Stack>

      <HeroBanner banners={dashboardData.banners} />

      <Grid container spacing={3} sx={{ mb: 4 }} alignItems="stretch">
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<SchoolIcon sx={{ color: NAVY }} />} label="Prochain cours" color={NAVY} link="/student/schedule"
            value={dashboardData.next_course ? (
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" noWrap>{dashboardData.next_course.name}</Typography>
                <Typography variant="caption" color="text.secondary">{formatTime(dashboardData.next_course.time)}</Typography>
              </Box>
            ) : <Typography variant="body2" color="text.secondary">Aucun cours</Typography>}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<GradeIcon sx={{ color: RED }} />} label="Dernière note" color={RED} link="/student/grades"
            value={dashboardData.recent_grades[0] ? (
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" noWrap>{dashboardData.recent_grades[0].course_name}</Typography>
                <Chip label={`${dashboardData.recent_grades[0].value}/${dashboardData.recent_grades[0].max_value}`} size="small" sx={{ fontWeight: 800, mt: 0.5 }} />
              </Box>
            ) : <Typography variant="body2" color="text.secondary">Aucune note</Typography>}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<EventIcon sx={{ color: '#6a1b9a' }} />} label="Événements" color="#6a1b9a"
            value={<Typography variant="h4" fontWeight="900" color="#6a1b9a">{dashboardData.events.length} <Typography component="span" variant="body2" color="text.secondary">à venir</Typography></Typography>}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<RequestIcon sx={{ color: '#2e7d32' }} />} label="Mes demandes" color="#2e7d32" link="/student/requests"
            value={<Typography variant="h4" fontWeight="900" color="#2e7d32">{dashboardData.requests.length} <Typography component="span" variant="body2" color="text.secondary">en cours</Typography></Typography>}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ ...getDashboardPanelSx(NAVY), p: 3, height: '100%' }}>
            <SectionHeader icon={<EventIcon sx={{ color: NAVY }} />} title="Événements" action={<Button size="small" onClick={() => refetch()}>Actualiser</Button>} />
            <Stack spacing={2}>
              {dashboardData.events.slice(0, 4).map((event, idx) => <EventCard key={event.id} event={event} index={idx} />)}
              {dashboardData.events.length === 0 && <Box sx={{ py: 4, textAlign: 'center' }}><Typography variant="body2" color="text.secondary">Aucun événement</Typography></Box>}
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={7}>
          <Stack spacing={3}>
            <Paper elevation={0} sx={{ ...getDashboardPanelSx('#2e7d32'), p: 3 }}>
              <SectionHeader icon={<WorkIcon sx={{ color: NAVY }} />} title="Carrière & Stages" action={<Button component={Link} to="/student/stages" size="small">Voir tout</Button>} />
              <List disablePadding>
                {dashboardData.career_opportunities?.slice(0, 3).map((opp, idx) => (
                  <Box key={idx}><ListItem sx={{ px: 0 }}><ListItemText primary={opp.title} secondary={opp.company} /><Chip label={opp.type} size="small" variant="outlined" /></ListItem>{idx < 2 && <Divider />}</Box>
                ))}
              </List>
            </Paper>
            <Paper elevation={0} sx={{ ...getDashboardPanelSx(RED), p: 3 }}>
              <SectionHeader icon={<TrendingUpIcon sx={{ color: RED }} />} title="Résultats Récents" action={<Button component={Link} to="/student/grades" size="small">Tout voir</Button>} />
              <List disablePadding>
                {dashboardData.recent_grades.slice(0, 3).map((grade, idx) => (
                  <Box key={grade.id}><ListItem sx={{ px: 0 }}><ListItemText primary={grade.course_name} secondary={formatDate(grade.published_at)} /><Typography fontWeight="800" color={grade.value >= 10 ? 'primary' : 'error'}>{grade.value}/{grade.max_value}</Typography></ListItem>{idx < 2 && <Divider />}</Box>
                ))}
              </List>
            </Paper>
          </Stack>
        </Grid>
      </Grid>

      <Box sx={{ mt: 5 }}>
        <SectionHeader icon={<NewspaperIcon sx={{ color: NAVY }} />} title="Actualités" />
        <Grid container spacing={3} alignItems="stretch">
          {dashboardData.news.slice(0, 3).map((item, idx) => (
            <Grid item xs={12} sm={6} md={4} key={item.id}><NewsCard item={item} index={idx} /></Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};

export default DashboardPage;
