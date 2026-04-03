import { Suspense, lazy, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import CircularProgress from '@mui/material/CircularProgress';
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

const TabContentFallback = () => <RouteLoader label="Chargement des graphiques..." />;

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
      const { data: rawData, error: fetchError } = await getReportsData();

      if (fetchError) throw fetchError;

      const { departments, students, professors, exams } = rawData;

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
        <Suspense fallback={<TabContentFallback />}>
          <OverviewReportsTab
            departmentStatsData={departmentStatsData}
            studentStatsData={studentStatsData}
            examStatsData={examStatsData}
          />
        </Suspense>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Suspense fallback={<TabContentFallback />}>
          <StudentReportsTab
            departmentStatsData={departmentStatsData}
            studentStatsData={studentStatsData}
            exportCSV={exportCSV}
          />
        </Suspense>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Statistiques des professeurs
          </Typography>
        </Box>

        <Suspense fallback={<TabContentFallback />}>
          <ProfessorReportsTab
            professorStatsData={professorStatsData}
            exportCSV={exportCSV}
          />
        </Suspense>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Suspense fallback={<TabContentFallback />}>
          <ExamReportsTab
            examStatsData={examStatsData}
            exportCSV={exportCSV}
          />
        </Suspense>
      </TabPanel>
    </Box>
  );
};

export default ReportsPage;
