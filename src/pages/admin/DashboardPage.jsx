import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Alert, Box, Button, Card, CardContent, CardHeader, CircularProgress,
  Divider, Grid, List, ListItem, ListItemText, Typography, Paper,
  alpha, keyframes, Stack, Chip, IconButton
} from '@mui/material';
import {
  School as SchoolIcon,
  Event as EventIcon,
  Assignment as AssignmentIcon,
  People as PeopleIcon,
  CalendarToday as CalendarTodayIcon,
  ArrowForward as ArrowForwardIcon,
  TrendingUp as TrendingUpIcon,
  Description as DescriptionIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  History as AuditIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon,
  Campaign as CampaignIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';
import { getAdminDashboardData, getRecentAuditActivity } from '@/api/admin';
import { getCMSBanners, getCMSNews, getCMSEvents } from '@/api/cms';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideIn = keyframes`
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
`;

const EMPTY_DASHBOARD = {
  stats: null, notifications: [], events: [], auditLogs: [], news: []
};

const formatShortDate = (v) => {
  if (!v) return { day: '--', month: '---' };
  try {
    const d = new Date(v);
    return { day: format(d, 'dd'), month: format(d, 'MMM', { locale: fr }).toUpperCase() };
  } catch { return { day: '--', month: '---' }; }
};

/* ── Hero Banner ── */
const HeroBanner = ({ banners }) => {
  const [current, setCurrent] = useState(0);
  const items = banners?.length ? banners : [];
  if (!items.length) return null;
  const b = items[current];

  return (
    <Paper elevation={6} sx={{
      position: 'relative', mb: 4, borderRadius: 4, overflow: 'hidden',
      minHeight: { xs: 220, md: 300 }, display: 'flex', alignItems: 'center',
      backgroundImage: `url(${b.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center',
      '&:hover .nav-btn': { opacity: 1 }
    }}>
      <Box sx={{ position: 'absolute', inset: 0,
        background: `linear-gradient(135deg, ${alpha(b.background_color || '#003366', 0.9)} 0%, ${alpha(b.background_color || '#003366', 0.5)} 60%, transparent 100%)`
      }} />
      <Box sx={{ position: 'relative', zIndex: 1, p: { xs: 3, md: 5 }, maxWidth: 650 }}>
        {b.subtitle && <Chip label={b.subtitle} size="small" sx={{ mb: 1.5, fontWeight: 700, bgcolor: alpha('#fff', 0.2), color: b.text_color || '#fff' }} />}
        <Typography variant="h4" sx={{ color: b.text_color || '#fff', fontWeight: 900, mb: 1, fontSize: { xs: '1.5rem', md: '2.2rem' }, lineHeight: 1.15 }}>
          {b.title}
        </Typography>
        {b.description && <Typography variant="body1" sx={{ color: alpha(b.text_color || '#fff', 0.85), mb: 2, lineHeight: 1.5 }}>{b.description}</Typography>}
        {b.cta_text && b.cta_link && (
          <Button variant="contained" size="medium" endIcon={<ArrowForwardIcon />}
            component={b.cta_link.startsWith('/') ? Link : 'a'}
            {...(b.cta_link.startsWith('/') ? { to: b.cta_link } : { href: b.cta_link, target: '_blank' })}
            sx={{ borderRadius: 3, px: 4, fontWeight: 800, bgcolor: '#CC0000', '&:hover': { bgcolor: '#aa0000' } }}
          >{b.cta_text}</Button>
        )}
      </Box>
      {items.length > 1 && (
        <>
          <IconButton className="nav-btn" onClick={() => setCurrent((p) => (p - 1 + items.length) % items.length)}
            sx={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', bgcolor: alpha('#fff', 0.2), color: '#fff', opacity: 0, transition: 'opacity 0.3s', '&:hover': { bgcolor: alpha('#fff', 0.4) } }}
          ><ChevronLeftIcon /></IconButton>
          <IconButton className="nav-btn" onClick={() => setCurrent((p) => (p + 1) % items.length)}
            sx={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', bgcolor: alpha('#fff', 0.2), color: '#fff', opacity: 0, transition: 'opacity 0.3s', '&:hover': { bgcolor: alpha('#fff', 0.4) } }}
          ><ChevronRightIcon /></IconButton>
          <Stack direction="row" spacing={0.8} sx={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)' }}>
            {items.map((_, i) => <Box key={i} onClick={() => setCurrent(i)} sx={{ width: i === current ? 24 : 8, height: 8, borderRadius: 4, bgcolor: i === current ? '#fff' : alpha('#fff', 0.4), cursor: 'pointer', transition: 'all 0.3s' }} />)}
          </Stack>
        </>
      )}
    </Paper>
  );
};

/* ── Stat Card ── */
const StatCard = ({ icon, value, label, color, delay = 0 }) => (
  <Card sx={{
    height: '180px',
    borderRadius: 3, 
    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
    border: `2px solid ${alpha(color, 0.5)}`,
    animation: `${fadeIn} 0.5s ease ${delay}s both`,
    transition: 'all 0.25s', 
    display: 'flex',
    flexDirection: 'column',
    '&:hover': { 
      transform: 'translateY(-4px)', 
      boxShadow: `0 8px 24px ${alpha(color, 0.15)}`,
      borderColor: color
    }
  }}>
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

/* ── Event Card ── */
const EventCard = ({ event, index }) => {
  const d = formatShortDate(event.start_date);
  return (
    <Card sx={{
      display: 'flex', borderRadius: 3, overflow: 'hidden',
      boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
      animation: `${slideIn} 0.4s ease ${index * 0.08}s both`,
      transition: 'all 0.25s',
      '&:hover': { transform: 'translateX(6px)', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', borderLeft: '3px solid #003366' }
    }}>
      <Box sx={{ width: 70, minHeight: 75, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: alpha('#003366', 0.06), borderRight: '3px solid #003366' }}>
        <Typography variant="h5" fontWeight="900" color="#003366">{d.day}</Typography>
        <Typography variant="caption" fontWeight="700" color="#003366">{d.month}</Typography>
      </Box>
      <CardContent sx={{ flex: 1, py: 1, px: 2 }}>
        <Typography variant="subtitle2" fontWeight="700" noWrap>{event.title}</Typography>
        {event.location && <Typography variant="caption" color="text.secondary">{event.location}</Typography>}
      </CardContent>
    </Card>
  );
};

/* ── Main ── */
const AdminDashboardPage = () => {
  const { authState } = useAuth();
  const [dashboardData, setDashboardData] = useState(EMPTY_DASHBOARD);
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
        if (!authState.isAdmin || !authState.profile?.id) throw new Error('Profil admin non disponible');

        const [dashRes, auditRes, bannersRes, newsRes, eventsRes] = await Promise.all([
          getAdminDashboardData(authState.profile.id),
          getRecentAuditActivity(6),
          getCMSBanners(), 
          getCMSNews(4), 
          getCMSEvents(5)
        ]);

        if (dashRes.error) throw dashRes.error;
        
        if (active) {
          setDashboardData({
            ...dashRes.data,
            auditLogs: auditRes.data || []
          });
          setCmsBanners(bannersRes.data || []);
          setCmsNews(newsRes.data || []);
          setCmsEvents(eventsRes.data || []);
        }
      } catch (e) {
        console.error('AdminDashboard error:', e);
        if (active) { setError(e.message || 'Erreur de chargement'); setDashboardData(EMPTY_DASHBOARD); }
      } finally { if (active) setLoading(false); }
    };
    if (authState.isAdmin) load(); else setLoading(false);
    return () => { active = false; };
  }, [authState.isAdmin, authState.profile?.id]);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}><CircularProgress size={60} thickness={4} /></Box>;
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f8fafc', minHeight: '100vh', animation: `${fadeIn} 0.6s ease-out` }}>
      {error && <Alert severity="error" variant="filled" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} mb={3} spacing={2}>
        <Box>
          <Typography variant="h3" fontWeight="900" color="text.primary" sx={{ letterSpacing: '-0.5px' }}>
            Console Administration
          </Typography>
          <Typography variant="h6" color="text.secondary" fontWeight="400">ESGIS Campus — Gestion Centrale</Typography>
        </Box>
        <Paper elevation={0} sx={{ p: 2, borderRadius: 3, bgcolor: 'white', border: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <CalendarTodayIcon color="primary" />
            <Typography variant="subtitle1" fontWeight="bold">{format(new Date(), 'PPPP', { locale: fr })}</Typography>
          </Stack>
        </Paper>
      </Stack>

      {/* Hero Banner */}
      <HeroBanner banners={cmsBanners} />

      {/* Action Rapide: Pending Requests */}
      {(dashboardData.stats?.pendingRequests || 0) > 0 && (
        <Alert severity="warning" variant="outlined" sx={{ mb: 3, borderRadius: 3, borderLeft: '6px solid #f59e0b', bgcolor: alpha('#f59e0b', 0.04) }}
          action={<Button variant="contained" color="warning" size="small" component={Link} to="/admin/requests" sx={{ borderRadius: 2, fontWeight: 'bold' }}>Valider</Button>}
        >
          <Typography variant="subtitle1" fontWeight="bold">{dashboardData.stats.pendingRequests} demande(s) en attente de validation</Typography>
        </Alert>
      )}

      {/* Stats */}
      {dashboardData.stats && (
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          <Grid item xs={6} md={3}><StatCard icon={<PeopleIcon sx={{ fontSize: 28, color: '#003366' }} />} value={dashboardData.stats.totalStudents} label="Étudiants" color="#003366" delay={0} /></Grid>
          <Grid item xs={6} md={3}><StatCard icon={<SchoolIcon sx={{ fontSize: 28, color: '#2e7d32' }} />} value={dashboardData.stats.totalProfessors} label="Professeurs" color="#2e7d32" delay={0.1} /></Grid>
          <Grid item xs={6} md={3}><StatCard icon={<TrendingUpIcon sx={{ fontSize: 28, color: '#CC0000' }} />} value={dashboardData.stats.activeUsers} label="Utilisateurs Actifs" color="#CC0000" delay={0.2} /></Grid>
          <Grid item xs={6} md={3}><StatCard icon={<DescriptionIcon sx={{ fontSize: 28, color: '#ed6c02' }} />} value={dashboardData.stats.totalCourses} label="Cours" color="#ed6c02" delay={0.3} /></Grid>
        </Grid>
      )}

      <Grid container spacing={3}>
        {/* Main */}
        <Grid item xs={12} md={8}>
          <Stack spacing={3}>
            {/* Audit Logs */}
            <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              <CardHeader title="Activité système récente" avatar={<AuditIcon sx={{ color: '#003366' }} />}
                titleTypographyProps={{ fontWeight: 'bold' }}
                action={<Button size="small" variant="outlined" component={Link} to="/admin/audit" endIcon={<ArrowForwardIcon />} sx={{ borderRadius: 2 }}>Journal complet</Button>}
              />
              <CardContent sx={{ pt: 0 }}>
                {dashboardData.auditLogs.length > 0 ? (
                  <List disablePadding>
                    {dashboardData.auditLogs.map((log, idx) => (
                      <Box key={log.id}>
                        <ListItem sx={{ px: 0, py: 1.5, animation: `${fadeIn} 0.4s ease ${idx * 0.05}s both` }}>
                          <ListItemText
                            primary={<Typography fontWeight="bold" variant="body2">{log.user_name} - {log.action}</Typography>}
                            secondary={<><Typography variant="caption">{log.resource} ({log.resource_id})</Typography> &middot; <Typography variant="caption">{format(new Date(log.created_at), 'HH:mm', { locale: fr })}</Typography></>}
                          />
                          <Chip label={log.user_role} size="small" variant="outlined" sx={{ fontSize: '0.65rem' }} />
                        </ListItem>
                        {idx < dashboardData.auditLogs.length - 1 && <Divider />}
                      </Box>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <HistoryIcon sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
                    <Typography color="text.secondary">Aucun log récent</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Quick Access Grid */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Button fullWidth variant="contained" component={Link} to="/admin/users" startIcon={<PeopleIcon />} sx={{ py: 2, borderRadius: 3, bgcolor: '#003366' }}>Utilisateurs</Button>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button fullWidth variant="contained" component={Link} to="/admin/departments" startIcon={<SettingsIcon />} sx={{ py: 2, borderRadius: 3, bgcolor: '#2e7d32' }}>Départements</Button>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button fullWidth variant="contained" component={Link} to="/admin/config" startIcon={<SecurityIcon />} sx={{ py: 2, borderRadius: 3, bgcolor: '#CC0000' }}>Sécurité</Button>
              </Grid>
            </Grid>
          </Stack>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            {/* Events */}
            <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              <CardHeader title="Événements" avatar={<EventIcon sx={{ color: '#003366' }} />} titleTypographyProps={{ fontWeight: 'bold' }} />
              <CardContent sx={{ pt: 0 }}>
                {cmsEvents.length > 0 ? (
                  <Stack spacing={1.5}>{cmsEvents.slice(0, 4).map((e, i) => <EventCard key={e.id} event={e} index={i} />)}</Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">Aucun événement à venir</Typography>
                )}
              </CardContent>
            </Card>

            {/* News */}
            {cmsNews.length > 0 && (
              <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <CardHeader title="Actualités" avatar={<CampaignIcon sx={{ color: '#CC0000' }} />} titleTypographyProps={{ fontWeight: 'bold' }} />
                <CardContent sx={{ pt: 0 }}>
                  <List disablePadding>
                    {cmsNews.slice(0, 3).map((n, idx) => (
                      <Box key={n.id}>
                        <ListItem sx={{ px: 0, py: 1 }}>
                          <ListItemText
                            primary={<Typography variant="subtitle2" fontWeight="bold">{n.title}</Typography>}
                            secondary={<Typography variant="caption" color="text.secondary">{(n.excerpt || n.content || '').slice(0, 60)}...</Typography>}
                          />
                        </ListItem>
                        {idx < 2 && <Divider />}
                      </Box>
                    ))}
                  </List>
                </CardContent>
              </Card>
            )}
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboardPage;
