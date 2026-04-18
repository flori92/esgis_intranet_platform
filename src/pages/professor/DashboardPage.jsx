import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
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
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  LocationOn as LocationOnIcon,
  Newspaper as NewspaperIcon,
  MenuBook as MenuBookIcon,
  WarningAmber as WarningAmberIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
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
   Hero Banner Carousel
   ════════════════════════════════════════════════════════════════════ */
const HeroBanner = ({ banners }) => {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);
  const items = banners?.length ? banners : [];

  const resetTimer = useCallback(() => {
    clearInterval(timerRef.current);
    if (items.length > 1) {
      timerRef.current = setInterval(() => setCurrent((p) => (p + 1) % items.length), 6000);
    }
  }, [items.length]);

  useEffect(() => { resetTimer(); return () => clearInterval(timerRef.current); }, [resetTimer]);

  if (items.length === 0) {
    return (
      <Paper elevation={0} sx={{ position: 'relative', mb: 4, borderRadius: 4, overflow: 'hidden', minHeight: { xs: 200, md: 300 }, background: `linear-gradient(135deg, ${NAVY} 0%, #0a4d8c 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ textAlign: 'center', p: 4 }}>
          <SchoolIcon sx={{ fontSize: 56, color: alpha('#fff', 0.7), mb: 2 }} />
          <Typography variant="h3" sx={{ color: 'white', fontWeight: 900, mb: 1, fontSize: { xs: '1.5rem', md: '2.5rem' } }}>Espace Professeur ESGIS</Typography>
          <Typography variant="h6" sx={{ color: alpha('#fff', 0.8), fontWeight: 400 }}>Gestion centralisée de vos cours et examens</Typography>
        </Box>
      </Paper>
    );
  }

  const banner = items[current];
  const bgColor = banner.background_color || NAVY;
  const txtColor = banner.text_color || '#FFFFFF';

  return (
    <Paper elevation={0} sx={{ position: 'relative', mb: 4, borderRadius: 4, overflow: 'hidden', minHeight: { xs: 220, md: 340 }, display: 'flex', alignItems: 'center', '&:hover .hero-nav': { opacity: 1 } }}>
      {items.map((b, i) => (
        <Box key={b.id || i} sx={{ position: 'absolute', inset: 0, backgroundImage: b.image_url ? `url(${b.image_url})` : 'none', backgroundColor: b.background_color || NAVY, backgroundSize: 'cover', backgroundPosition: 'center', opacity: i === current ? 1 : 0, transition: 'opacity 0.8s ease-in-out', zIndex: 0 }} />
      ))}
      <Box sx={{ position: 'absolute', inset: 0, zIndex: 1, background: `linear-gradient(135deg, ${alpha(bgColor, 0.9)} 0%, ${alpha(bgColor, 0.4)} 100%)` }} />
      <Box sx={{ position: 'relative', zIndex: 2, p: { xs: 3, md: 6 }, maxWidth: 700 }}>
        {banner.subtitle && <Chip label={banner.subtitle} size="small" sx={{ mb: 2, fontWeight: 700, bgcolor: alpha(txtColor, 0.15), color: txtColor }} />}
        <Typography variant="h3" sx={{ color: txtColor, fontWeight: 900, mb: 2, fontSize: { xs: '1.4rem', sm: '2rem', md: '2.8rem' }, lineHeight: 1.1 }}>{banner.title}</Typography>
        {banner.description && <Typography variant="body1" sx={{ color: alpha(txtColor, 0.85), mb: 3, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{banner.description}</Typography>}
        {banner.cta_text && banner.cta_link && <Button variant="contained" component={Link} to={banner.cta_link} sx={{ borderRadius: 3, px: 4, py: 1.2, fontWeight: 700, bgcolor: RED, color: 'white' }}>{banner.cta_text}</Button>}
      </Box>
    </Paper>
  );
};

const StatCard = ({ icon, value, label, color, link }) => (
  <Card elevation={0} component={link ? Link : 'div'} to={link}
    sx={{ height: '100%', borderRadius: CARD_RADIUS, textDecoration: 'none', border: `1px solid ${alpha(color, 0.2)}`, borderLeft: `4px solid ${color}`, transition: 'all 0.25s', '&:hover': link ? { transform: 'translateY(-3px)', boxShadow: '0 8px 24px rgba(0,0,0,0.05)' } : {} }}>
    <CardContent sx={{ p: 2.5 }}>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1.5 }}>
        <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: alpha(color, 0.08), display: 'flex' }}>{icon}</Box>
        <Typography variant="body2" color="text.secondary" fontWeight="700">{label}</Typography>
      </Stack>
      <Typography variant="h3" fontWeight="900" color={color} align="center">{value ?? 0}</Typography>
    </CardContent>
  </Card>
);

const ProfessorDashboardPage = () => {
  const { authState } = useAuth();
  const profileId = authState.profile?.id;
  const professorId = authState.professor?.id;

  const { data: dashDataRes, isLoading: loadingDash } = useQuery({
    queryKey: ['professorDashboard', profileId, professorId],
    queryFn: () => getProfessorDashboardData({ profileId, professorId }),
    enabled: !!profileId,
    staleTime: 1000 * 60 * 5,
  });

  const { data: insightsRes, isLoading: loadingInsights } = useQuery({
    queryKey: ['professorLearningInsights', profileId],
    queryFn: () => getProfessorLearningInsights({ profileId }),
    enabled: !!profileId,
    staleTime: 1000 * 60 * 10,
  });

  const { data: bannersRes } = useQuery({ queryKey: ['cmsBanners'], queryFn: getCMSBanners });
  const { data: newsRes } = useQuery({ queryKey: ['cmsNews'], queryFn: () => getCMSNews(4) });
  const { data: eventsRes } = useQuery({ queryKey: ['cmsEvents'], queryFn: () => getCMSEvents(5) });

  if (loadingDash || loadingInsights) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '70vh', gap: 2 }}>
        <CircularProgress size={48} sx={{ color: NAVY }} />
        <Typography variant="body2" color="text.secondary">Chargement de votre console...</Typography>
      </Box>
    );
  }

  const dash = dashDataRes?.data || { stats: {}, courses: [], exams: [], pendingGrades: [] };
  const insights = insightsRes?.data || { summary: {}, courses: [], studentsNeedingAttention: [] };

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1440, mx: 'auto', animation: `${fadeIn} 0.5s ease-out` }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ mb: 4 }} spacing={2}>
        <Box>
          <Typography variant="h4" fontWeight="900" sx={{ letterSpacing: '-0.5px' }}>Bonjour, {authState.profile?.full_name?.split(' ')[0] || 'Professeur'}</Typography>
          <Typography variant="body1" color="text.secondary">Bienvenue sur votre espace professeur ESGIS Campus</Typography>
        </Box>
        <Paper elevation={0} sx={{ py: 1, px: 2, borderRadius: 2, bgcolor: alpha(NAVY, 0.04), border: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <CalendarTodayIcon sx={{ fontSize: 18, color: NAVY }} />
            <Typography variant="body2" fontWeight="600" color={NAVY}>{format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}</Typography>
          </Stack>
        </Paper>
      </Stack>

      <HeroBanner banners={bannersRes?.data} />

      <Grid container spacing={3} sx={{ mb: 4 }} alignItems="stretch">
        <Grid item xs={6} md={3}><StatCard icon={<PeopleIcon sx={{ color: NAVY }} />} value={dash.stats?.totalStudents} label="Étudiants" color={NAVY} link="/professor/students" /></Grid>
        <Grid item xs={6} md={3}><StatCard icon={<SchoolIcon sx={{ color: '#2e7d32' }} />} value={dash.stats?.totalCourses} label="Cours" color="#2e7d32" link="/professor/courses" /></Grid>
        <Grid item xs={6} md={3}><StatCard icon={<AssignmentIcon sx={{ color: RED }} />} value={dash.stats?.totalExams} label="Examens" color={RED} link="/professor/exams" /></Grid>
        <Grid item xs={6} md={3}><StatCard icon={<GradingIcon sx={{ color: '#ed6c02' }} />} value={dash.stats?.pendingGrades} label="À noter" color="#ed6c02" link="/professor/grades" /></Grid>
      </Grid>

      {/* Insights Section */}
      {insights.summary && (
        <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: CARD_RADIUS, border: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <TrendingUpIcon sx={{ color: NAVY }} />
              <Typography variant="h6" fontWeight="800">Pilotage Pédagogique</Typography>
            </Stack>
            <Button component={Link} to="/professor/learning-insights" size="small" endIcon={<ArrowForwardIcon />}>Détails</Button>
          </Stack>
          <Grid container spacing={2}>
            {[
              { label: 'Progression', value: `${Math.round(insights.summary.averageProgress || 0)}%`, color: NAVY },
              { label: 'À Risque', value: insights.summary.atRiskStudents, color: RED },
              { label: 'Projection', value: `${(insights.summary.averagePredictedGrade || 0).toFixed(1)}/20`, color: '#ed6c02' }
            ].map(item => (
              <Grid item xs={4} key={item.label}>
                <Box sx={{ p: 2, textAlign: 'center', borderRadius: 2, bgcolor: alpha(item.color, 0.04), border: `1px solid ${alpha(item.color, 0.1)}` }}>
                  <Typography variant="caption" fontWeight="700" color="text.secondary" sx={{ textTransform: 'uppercase' }}>{item.label}</Typography>
                  <Typography variant="h5" fontWeight="900" color={item.color}>{item.value}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Stack spacing={3}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: CARD_RADIUS, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" fontWeight="800" gutterBottom>Actualités du Campus</Typography>
              <Grid container spacing={2}>
                {(newsRes?.data || []).slice(0, 2).map((item, idx) => (
                  <Grid item xs={12} sm={6} key={item.id}>
                    <Card elevation={0} sx={{ height: '100%', border: '1px solid', borderColor: 'divider' }}>
                      <CardMedia component="img" height="120" image={item.image_url} />
                      <CardContent sx={{ p: 2 }}>
                        <Typography variant="subtitle2" fontWeight="bold" noWrap>{item.title}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.description}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Stack>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: CARD_RADIUS, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <Typography variant="h6" fontWeight="800" gutterBottom>Événements à venir</Typography>
            <Stack spacing={1.5}>
              {(eventsRes?.data || []).slice(0, 4).map(event => {
                const parts = formatShortDate(event.start_date);
                return (
                  <Paper key={event.id} elevation={0} sx={{ display: 'flex', border: '1px solid', borderColor: 'divider', overflow: 'hidden', borderRadius: 2 }}>
                    <Box sx={{ width: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: alpha(NAVY, 0.05), borderRight: `2px solid ${NAVY}` }}>
                      <Typography variant="subtitle1" fontWeight="900" color={NAVY}>{parts.day}</Typography>
                      <Typography variant="caption" fontWeight="700" color={NAVY}>{parts.month}</Typography>
                    </Box>
                    <Box sx={{ p: 1.5, flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2" fontWeight="700" noWrap>{event.title}</Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>{event.location || 'Campus'}</Typography>
                    </Box>
                  </Paper>
                );
              })}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProfessorDashboardPage;
