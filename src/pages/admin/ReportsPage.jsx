import { Suspense, lazy, useEffect, useState, useMemo } from 'react';
import {
  Box, Typography, Paper, FormControl, InputLabel, Select,
  MenuItem, Tab, Tabs, CircularProgress, Grid, Card, CardContent,
  Stack, Divider, Button, Avatar
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Description as DescriptionIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { getReportsData } from '../../api/reports';
import { triggerDownload } from '@/utils/DownloadLinkUtil';
import RouteLoader from '@/components/common/RouteLoader';

const OverviewReportsTab = lazy(() => import('@/components/reports/OverviewReportsTab'));
const StudentReportsTab = lazy(() => import('@/components/reports/StudentReportsTab'));
const ProfessorReportsTab = lazy(() => import('@/components/reports/ProfessorReportsTab'));
const ExamReportsTab = lazy(() => import('@/components/reports/ExamReportsTab'));

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} id={`tabpanel-${index}`} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ReportsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [academicYear, setAcademicYear] = useState('2023-2024');

  const [stats, setStats] = useState({
    departments: [],
    students: [],
    professors: [],
    exams: [],
    filieres: [],
    kpis: { successRate: 0, docVolume: 0, totalStudents: 0 }
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: rawData, error } = await getReportsData();
      if (error) throw error;

      const { departments, filieres, students, professors, exams, grades, documents } = rawData;

      // KPI: Success Rate (Grades >= 10/20)
      const validGrades = grades.filter(g => g.value !== null);
      const successCount = validGrades.filter(g => (g.value / (g.max_value || 20)) * 20 >= 10).length;
      const successRate = validGrades.length > 0 ? (successCount / validGrades.length) * 100 : 0;

      // Dept Stats
      const deptStats = departments.map(d => ({
        name: d.name,
        étudiants: students.filter(s => s.department_id === d.id).length,
        professeurs: professors.filter(p => p.department_id === d.id).length
      }));

      // Student Year Stats
      const yearMap = {};
      students.forEach(s => { yearMap[s.level || 'N/A'] = (yearMap[s.level || 'N/A'] || 0) + 1; });
      const studentStats = Object.keys(yearMap).map(k => ({ name: k, value: yearMap[k] }));

      setStats({
        departments: deptStats,
        students: studentStats,
        professors: [], // can add more detail if needed
        exams: exams.map(e => ({ name: e.courses?.name || 'Examen', value: 1 })),
        filieres: filieres.map(f => ({ name: f.name, value: students.filter(s => s.filiere_id === f.id).length })),
        kpis: {
          successRate: Math.round(successRate),
          docVolume: documents.length,
          totalStudents: students.length
        }
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) fetchData(); }, [user, academicYear]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight="bold">Pilotage & Performance</Typography>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <Select value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}>
            <MenuItem value="2023-2024">2023-2024</MenuItem>
            <MenuItem value="2024-2025">2024-2025</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}><TrendingUpIcon /></Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">{stats.kpis.successRate}%</Typography>
                  <Typography variant="body2">Taux de réussite global</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: 'secondary.main', color: 'white' }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}><DescriptionIcon /></Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">{stats.kpis.docVolume}</Typography>
                  <Typography variant="body2">Documents officiels générés</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}><PeopleIcon /></Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">{stats.kpis.totalStudents}</Typography>
                  <Typography variant="body2">Étudiants inscrits</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Vue d'ensemble" />
          <Tab label="Par Filière" />
          <Tab label="Détails" />
        </Tabs>
        <TabPanel value={tabValue} index={0}>
          <Suspense fallback={<CircularProgress />}>
            <OverviewReportsTab 
              departmentStatsData={stats.departments} 
              studentStatsData={stats.students} 
              examStatsData={stats.filieres} 
            />
          </Suspense>
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>Analyse par filière</Typography>
          <Divider sx={{ mb: 3 }} />
          <Grid container spacing={3}>
            {stats.filieres.map(f => (
              <Grid item xs={12} sm={6} md={4} key={f.name}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">{f.name}</Typography>
                    <Typography variant="h5" fontWeight="bold">{f.value} étudiants</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default ReportsPage;
