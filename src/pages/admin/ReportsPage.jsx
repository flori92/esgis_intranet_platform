import React, { useState, useEffect } from 'react';
// Imports directs pour tous les composants Material-UI
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import CardHeader from '@mui/material/CardHeader';

// Import des composants Recharts
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
// Correction du chemin d'importation de Supabase
import { supabase } from '@/supabase';
import { triggerDownload } from '@/utils/DownloadLinkUtil';

// Couleurs pour les graphiques
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

const ReportsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [academicYear, setAcademicYear] = useState('2023-2024');

  // États pour les statistiques
  const [departmentStatsData, setDepartmentStatsData] = useState([]);
  const [studentStatsData, setStudentStatsData] = useState([]);
  const [professorStatsData, setProfessorStatsData] = useState([]);
  const [examStatsData, setExamStatsData] = useState([]);
  
  // État pour le filtre d'année
  const [availableYears, setAvailableYears] = useState(['2022-2023', '2023-2024', '2024-2025']);

  useEffect(() => {
    // Vérifier si l'utilisateur est authentifié
    if (user) {
      fetchData();
    }
  }, [user, academicYear]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleYearChange = (event) => {
    setAcademicYear(event.target.value);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Charger les données des départements
      const { data: departments, error: departmentsError } = await supabase
        .from('departments')
        .select('*');

      if (departmentsError) throw departmentsError;

      // Charger les données des étudiants
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('*, departments(name)');

      if (studentsError) throw studentsError;

      // Charger les données des professeurs
      const { data: professors, error: professorsError } = await supabase
        .from('professors')
        .select('*, departments(name)');

      if (professorsError) throw professorsError;

      // Charger les données des examens
      const { data: exams, error: examsError } = await supabase
        .from('exams')
        .select('*, professors(full_name), courses(name)');

      if (examsError) throw examsError;

      // Calcul des statistiques par département
      const deptStats = departments.map(dept => {
        const studentsInDept = students.filter(student => student.department_id === dept.id);
        const professorsInDept = professors.filter(prof => prof.department_id === dept.id);
        
        return {
          name: dept.name,
          étudiants: studentsInDept.length,
          professeurs: professorsInDept.length,
          id: dept.id
        };
      });

      // Calcul des statistiques pour les étudiants
      // Grouper les étudiants par année
      const studentsByYear = {};
      students.forEach(student => {
        const year = student.academic_year || 'Inconnu';
        if (!studentsByYear[year]) {
          studentsByYear[year] = 0;
        }
        studentsByYear[year]++;
      });

      const studentStats = Object.keys(studentsByYear).map(year => ({
        name: year,
        value: studentsByYear[year]
      }));

      // Calcul des statistiques pour les professeurs
      // Grouper les professeurs par département
      const profsByDept = {};
      professors.forEach(prof => {
        const deptName = prof.departments?.name || 'Inconnu';
        if (!profsByDept[deptName]) {
          profsByDept[deptName] = 0;
        }
        profsByDept[deptName]++;
      });

      const professorStats = Object.keys(profsByDept).map(dept => ({
        name: dept,
        value: profsByDept[dept]
      }));

      // Calcul des statistiques pour les examens
      // Grouper les examens par cours
      const examsByCourse = {};
      exams.forEach(exam => {
        const courseName = exam.courses?.name || 'Inconnu';
        if (!examsByCourse[courseName]) {
          examsByCourse[courseName] = 0;
        }
        examsByCourse[courseName]++;
      });

      const examStats = Object.keys(examsByCourse).map(course => ({
        name: course,
        value: examsByCourse[course]
      }));

      setDepartmentStatsData(deptStats);
      setStudentStatsData(studentStats);
      setProfessorStatsData(professorStats);
      setExamStatsData(examStats);

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = (event) => {
    // Fonction pour exporter les données en CSV
    const dataType = event.currentTarget.dataset.type;
    let data = [];
    let fileName = '';
    let header = [];

    switch (dataType) {
      case 'departments':
        data = departmentStatsData;
        fileName = `departements_${academicYear}.csv`;
        header = ['Nom', 'Étudiants', 'Professeurs'];
        break;
      case 'students':
        data = studentStatsData;
        fileName = `etudiants_${academicYear}.csv`;
        header = ['Année', 'Nombre'];
        break;
      case 'professors':
        data = professorStatsData;
        fileName = `professeurs_${academicYear}.csv`;
        header = ['Département', 'Nombre'];
        break;
      case 'exams':
        data = examStatsData;
        fileName = `examens_${academicYear}.csv`;
        header = ['Cours', 'Nombre'];
        break;
      default:
        return;
    }

    // Convertir les données en format CSV
    const csvRows = [];
    csvRows.push(header.join(','));

    for (const entry of data) {
      const values = header.map(key => {
        const value = entry[key.toLowerCase()] || entry.value;
        return `"${value}"`;
      });
      csvRows.push(values.join(','));
    }

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    // Utilisation de l'utilitaire mutualisé
    triggerDownload({ url, filename: fileName });

    // Nettoyage de l'URL Blob après téléchargement
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Rapports et Statistiques
        </Typography>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="academic-year-select-label">Année Académique</InputLabel>
          <Select
            labelId="academic-year-select-label"
            id="academic-year-select"
            value={academicYear}
            label="Année Académique"
            onChange={handleYearChange}
          >
            {availableYears.map((year) => (
              <MenuItem key={year} value={year}>{year}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="statistiques tabs">
          <Tab label="Vue d'ensemble" {...a11yProps(0)} />
          <Tab label="Étudiants" {...a11yProps(1)} />
          <Tab label="Professeurs" {...a11yProps(2)} />
          <Tab label="Examens" {...a11yProps(3)} />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Répartition des étudiants par département
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={departmentStatsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="étudiants" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Répartition des professeurs par département
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={departmentStatsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="professeurs" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Répartition des étudiants par année
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={studentStatsData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {studentStatsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Nombre d'examens par cours
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={examStatsData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {examStatsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Paper sx={{ p: 3, mb: 4 }}>
          <Box sx={{ mb: 2 }}>
            <Tabs value={0} onChange={() => {}} aria-label="student stats tabs">
              <Tab label="Statistiques générales" />
              <Tab label="Par département" />
              <Tab label="Par année" />
              <Tab label="Performance" />
            </Tabs>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper elevation={3} sx={{ p: 2 }}>
                <Typography variant="h6" align="center" gutterBottom>
                  Répartition des étudiants par année
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={studentStatsData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {studentStatsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                <Button 
                  variant="contained" 
                  sx={{ mt: 2 }}
                  onClick={exportCSV}
                  data-type="students"
                >
                  Exporter CSV
                </Button>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper elevation={3} sx={{ p: 2 }}>
                <Typography variant="h6" align="center" gutterBottom>
                  Nombre d'étudiants par département
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={departmentStatsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="étudiants" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper elevation={3} sx={{ p: 2 }}>
                <Typography variant="h6" align="center" gutterBottom>
                  Évolution des inscriptions
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={[
                      { year: '2020', students: 120 },
                      { year: '2021', students: 145 },
                      { year: '2022', students: 160 },
                      { year: '2023', students: 185 },
                      { year: '2024', students: 210 }
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="students" stroke="#8884d8" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper elevation={3} sx={{ p: 2 }}>
                <Typography variant="h6" align="center" gutterBottom>
                  Taux de réussite aux examens
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      { name: 'Informatique', rate: 78 },
                      { name: 'Gestion', rate: 82 },
                      { name: 'Communication', rate: 85 },
                      { name: 'Langues', rate: 79 },
                      { name: 'Droit', rate: 76 }
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="rate" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>
        </Paper>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Statistiques des professeurs
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Répartition par département
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={professorStatsData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {professorStatsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                <Button 
                  variant="contained" 
                  sx={{ mt: 2 }}
                  onClick={exportCSV}
                  data-type="professors"
                >
                  Exporter CSV
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Nombre d'examens créés par professeur
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      { name: 'Prof. Martin', count: 12 },
                      { name: 'Prof. Dubois', count: 8 },
                      { name: 'Prof. Bernard', count: 15 },
                      { name: 'Prof. Thomas', count: 7 },
                      { name: 'Prof. Robert', count: 10 }
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Paper sx={{ p: 3, mb: 4 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              Statistiques des examens
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper elevation={3} sx={{ p: 2 }}>
                <Typography variant="h6" align="center" gutterBottom>
                  Répartition par cours
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={examStatsData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {examStatsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                <Button 
                  variant="contained" 
                  sx={{ mt: 2 }}
                  onClick={exportCSV}
                  data-type="exams"
                >
                  Exporter CSV
                </Button>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper elevation={3} sx={{ p: 2 }}>
                <Box sx={{ p: 1 }}>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ fontWeight: 'bold', mb: 1 }}>
                      Types de questions utilisées
                    </Box>
                    <Box sx={{ ml: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Box>Choix multiple:</Box>
                        <Box>45%</Box>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Box>Choix unique:</Box>
                        <Box>30%</Box>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Box>Vrai/Faux:</Box>
                        <Box>15%</Box>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Box>Texte libre:</Box>
                        <Box>10%</Box>
                      </Box>
                    </Box>
                  </Box>
                  
                  <Box sx={{ mt: 4 }}>
                    <Box sx={{ fontWeight: 'bold', mb: 1 }}>
                      Statistiques d'utilisation
                    </Box>
                    <Box sx={{ ml: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Box>Examens créés (total):</Box>
                        <Box>78</Box>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Box>Moyenne de questions par examen:</Box>
                        <Box>25</Box>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Box>Durée moyenne des examens:</Box>
                        <Box>75 min</Box>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Box>Nombre d'examens actifs:</Box>
                        <Box>12</Box>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Paper>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 2 }}>
              <Typography variant="h6" align="center" gutterBottom>
                Résultats moyens par département
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    { name: 'Informatique', average: 14.5 },
                    { name: 'Gestion', average: 13.8 },
                    { name: 'Communication', average: 15.2 },
                    { name: 'Langues', average: 14.1 },
                    { name: 'Droit', average: 13.5 }
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 20]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="average" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
};

export default ReportsPage;
