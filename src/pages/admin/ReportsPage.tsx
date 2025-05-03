import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Button
} from '@mui/material';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../utils/supabase';

// Types
interface StatData {
  name: string;
  value: number;
  fill?: string;
}

interface DepartmentStats {
  id: number;
  name: string;
  studentCount: number;
  professorCount: number;
  courseCount: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Composant Tab Panel
const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`stats-tabpanel-${index}`}
      aria-labelledby={`stats-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

// Couleurs pour les graphiques
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#A4DE6C', '#D0ED57'];

const ReportsPage: React.FC = () => {
  const { authState } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [academicYear, setAcademicYear] = useState('2024-2025');
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([]);
  const [genderStats, setGenderStats] = useState<StatData[]>([]);
  const [levelStats, setLevelStats] = useState<StatData[]>([]);
  const [statusStats, setStatusStats] = useState<StatData[]>([]);
  const [enrollmentTrend, setEnrollmentTrend] = useState<{ name: string; étudiants: number }[]>([]);

  // Années académiques
  const academicYears = ['2022-2023', '2023-2024', '2024-2025', '2025-2026'];

  // Référence pour éviter les recréations de fonctions
  const fetchDataRef = useRef(async () => {
    setLoading(true);
    setError(null);
    try {
      // Récupérer les statistiques par département
      const { data: departmentsData, error: departmentsError } = await supabase
        .from('departments')
        .select('id, name')
        .order('name');
      
      if (departmentsError) throw departmentsError;

      // Pour chaque département, récupérer le nombre d'étudiants, de professeurs et de cours
      const departmentStatsData: DepartmentStats[] = [];
      
      for (const dept of departmentsData || []) {
        // Compter les étudiants
        const { count: studentCount, error: studentError } = await supabase
          .from('students')
          .select('id', { count: 'exact', head: true })
          .eq('department_id', dept.id)
          .eq('academic_year', academicYear);
        
        if (studentError) throw studentError;

        // Compter les professeurs
        const { count: professorCount, error: professorError } = await supabase
          .from('professors')
          .select('id', { count: 'exact', head: true })
          .eq('department_id', dept.id);
        
        if (professorError) throw professorError;

        // Compter les cours
        const { count: courseCount, error: courseError } = await supabase
          .from('courses')
          .select('id', { count: 'exact', head: true })
          .eq('department_id', dept.id);
        
        if (courseError) throw courseError;

        departmentStatsData.push({
          id: dept.id,
          name: dept.name,
          studentCount: studentCount || 0,
          professorCount: professorCount || 0,
          courseCount: courseCount || 0
        });
      }

      setDepartmentStats(departmentStatsData);

      // Récupérer les statistiques par genre
      const { data: genderData, error: genderError } = await supabase
        .from('profiles')
        .select('gender')
        .in('role', ['student']);
      
      if (genderError) throw genderError;

      const genderCounts: {[key: string]: number} = {};
      genderData?.forEach(profile => {
        const gender = profile.gender || 'Non spécifié';
        genderCounts[gender] = (genderCounts[gender] || 0) + 1;
      });

      const genderChartData: StatData[] = Object.keys(genderCounts).map((gender, index) => ({
        name: gender,
        value: genderCounts[gender],
        fill: COLORS[index % COLORS.length]
      }));

      setGenderStats(genderChartData);

      // Récupérer les statistiques par niveau
      const { data: levelData, error: levelError } = await supabase
        .from('students')
        .select('level')
        .eq('academic_year', academicYear);
      
      if (levelError) throw levelError;

      const levelCounts: {[key: string]: number} = {};
      levelData?.forEach(student => {
        const level = student.level || 'Non spécifié';
        levelCounts[level] = (levelCounts[level] || 0) + 1;
      });

      const levelChartData: StatData[] = Object.keys(levelCounts).map((level, index) => ({
        name: level,
        value: levelCounts[level],
        fill: COLORS[index % COLORS.length]
      }));

      setLevelStats(levelChartData);

      // Récupérer les statistiques par statut
      const { data: statusData, error: statusError } = await supabase
        .from('students')
        .select('status')
        .eq('academic_year', academicYear);
      
      if (statusError) throw statusError;

      const statusCounts: {[key: string]: number} = {};
      statusData?.forEach(student => {
        const status = student.status || 'Non spécifié';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      const statusChartData: StatData[] = Object.keys(statusCounts).map((status, index) => ({
        name: status,
        value: statusCounts[status],
        fill: COLORS[index % COLORS.length]
      }));

      setStatusStats(statusChartData);

      // Calculer la tendance des inscriptions pour les 5 dernières années
      const trend = [];
      for (let i = 0; i < 5; i++) {
        const year = (parseInt(academicYear.split('-')[0]) - 4 + i).toString();
        const academicYearStr = `${year}-${(parseInt(year) + 1).toString()}`;
        
        const { count, error: trendError } = await supabase
          .from('students')
          .select('id', { count: 'exact', head: true })
          .eq('academic_year', academicYearStr);
        
        if (trendError) throw trendError;

        trend.push({
          name: academicYearStr,
          étudiants: count || 0
        });
      }

      setEnrollmentTrend(trend);
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques:', err);
      setError('Une erreur est survenue lors du chargement des statistiques.');
    } finally {
      setLoading(false);
    }
  });

  useEffect(() => {
    const fetchData = async () => {
      if (fetchDataRef.current) {
        await fetchDataRef.current();
      }
    };
    fetchData();
  }, [academicYear]);

  // Changement d'onglet
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Changement d'année académique
  const handleYearChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setAcademicYear(event.target.value as string);
  };

  // Fonction pour exporter les données en CSV
  const exportCSV = (data: any[], filename: string) => {
    if (!data.length) return;
    
    // Déterminer les en-têtes
    const headers = Object.keys(data[0]);
    
    // Créer le contenu CSV
    const csvContent = [
      headers.join(','),
      ...data.map(item => headers.map(header => item[header]).join(','))
    ].join('\n');
    
    // Créer le blob et télécharger
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!authState.isAdmin) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Vous n'avez pas les droits nécessaires pour accéder à cette page.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Rapports et Statistiques
        </Typography>
        <FormControl sx={{ minWidth: 150 }} size="small">
          <InputLabel>Année académique</InputLabel>
          <Select
            value={academicYear}
            label="Année académique"
            onChange={handleYearChange as any}
          >
            {academicYears.map((year) => (
              <MenuItem key={year} value={year}>{year}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Statistiques rapides */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={3}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" color="primary">
                    {departmentStats.reduce((sum, dept) => sum + dept.studentCount, 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Étudiants inscrits
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" color="secondary">
                    {departmentStats.reduce((sum, dept) => sum + dept.professorCount, 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Professeurs
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" sx={{ color: 'success.main' }}>
                    {departmentStats.reduce((sum, dept) => sum + dept.courseCount, 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Cours
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" sx={{ color: 'info.main' }}>
                    {departmentStats.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Départements
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Onglets de statistiques */}
          <Paper sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                aria-label="onglets statistiques"
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab label="Vue d'ensemble" />
                <Tab label="Étudiants" />
                <Tab label="Départements" />
                <Tab label="Professeurs" />
              </Tabs>
            </Box>

            {/* Onglet Vue d'ensemble */}
            <TabPanel value={tabValue} index={0}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Tendance des inscriptions
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, height: 400 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={enrollmentTrend}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="étudiants" 
                          stroke="#8884d8" 
                          activeDot={{ r: 8 }} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Répartition par niveau
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, height: 400 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={levelStats}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" name="Étudiants">
                          {levelStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Répartition par genre
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, height: 400 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={genderStats}
                          cx="50%"
                          cy="50%"
                          outerRadius={120}
                          dataKey="value"
                          nameKey="name"
                          label={(entry) => `${entry.name}: ${entry.value}`}
                        >
                          {genderStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>
              </Grid>
            </TabPanel>

            {/* Onglet Étudiants */}
            <TabPanel value={tabValue} index={1}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button 
                  variant="outlined" 
                  onClick={() => exportCSV(
                    statusStats.map(s => ({ Statut: s.name, Nombre: s.value })), 
                    'statistiques_etudiants'
                  )}
                >
                  Exporter CSV
                </Button>
              </Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Statut des étudiants
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, height: 400 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusStats}
                          cx="50%"
                          cy="50%"
                          outerRadius={120}
                          dataKey="value"
                          nameKey="name"
                          label={(entry) => `${entry.name}: ${entry.value}`}
                        >
                          {statusStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Répartition par niveau
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, height: 400 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={levelStats}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" name="Étudiants">
                          {levelStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>
              </Grid>
            </TabPanel>

            {/* Onglet Départements */}
            <TabPanel value={tabValue} index={2}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button 
                  variant="outlined" 
                  onClick={() => exportCSV(
                    departmentStats.map(d => ({ 
                      Département: d.name, 
                      Étudiants: d.studentCount, 
                      Professeurs: d.professorCount, 
                      Cours: d.courseCount 
                    })), 
                    'statistiques_departements'
                  )}
                >
                  Exporter CSV
                </Button>
              </Box>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Répartition des étudiants par département
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, height: 400 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={departmentStats}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="studentCount" name="Étudiants" fill="#8884d8" />
                        <Bar dataKey="professorCount" name="Professeurs" fill="#82ca9d" />
                        <Bar dataKey="courseCount" name="Cours" fill="#ffc658" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Détail par département
                  </Typography>
                  <Paper variant="outlined">
                    <Box sx={{ width: '100%', overflow: 'auto' }}>
                      <Box sx={{ width: '100%', display: 'table', tableLayout: 'fixed' }}>
                        <Box sx={{ display: 'table-header-group' }}>
                          <Box sx={{ display: 'table-row' }}>
                            <Box sx={{ display: 'table-cell', p: 2, fontWeight: 'bold' }}>Département</Box>
                            <Box sx={{ display: 'table-cell', p: 2, fontWeight: 'bold' }}>Étudiants</Box>
                            <Box sx={{ display: 'table-cell', p: 2, fontWeight: 'bold' }}>Professeurs</Box>
                            <Box sx={{ display: 'table-cell', p: 2, fontWeight: 'bold' }}>Cours</Box>
                            <Box sx={{ display: 'table-cell', p: 2, fontWeight: 'bold' }}>Ratio Étudiant/Prof</Box>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'table-row-group' }}>
                          {departmentStats.map((dept) => (
                            <Box key={dept.id} sx={{ display: 'table-row' }}>
                              <Box sx={{ display: 'table-cell', p: 2 }}>{dept.name}</Box>
                              <Box sx={{ display: 'table-cell', p: 2 }}>{dept.studentCount}</Box>
                              <Box sx={{ display: 'table-cell', p: 2 }}>{dept.professorCount}</Box>
                              <Box sx={{ display: 'table-cell', p: 2 }}>{dept.courseCount}</Box>
                              <Box sx={{ display: 'table-cell', p: 2 }}>
                                {dept.professorCount ? (dept.studentCount / dept.professorCount).toFixed(1) : 'N/A'}
                              </Box>
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </TabPanel>

            {/* Onglet Professeurs */}
            <TabPanel value={tabValue} index={3}>
              <Typography variant="h6" gutterBottom>
                Distribution des professeurs
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardHeader title="Professeurs par département" />
                    <Divider />
                    <CardContent sx={{ height: 400 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={departmentStats}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="professorCount" fill="#8884d8" name="Professeurs" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardHeader title="Charge de cours par département" />
                    <Divider />
                    <CardContent sx={{ height: 400 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={departmentStats.map(dept => ({
                            name: dept.name,
                            coursParProf: dept.professorCount ? (dept.courseCount / dept.professorCount).toFixed(1) : 0
                          }))}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="coursParProf" fill="#82ca9d" name="Cours par professeur" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </TabPanel>
          </Paper>
        </>
      )}
    </Box>
  );
};

export default ReportsPage;
