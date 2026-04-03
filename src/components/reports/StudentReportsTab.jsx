import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const enrollmentTrendData = [
  { year: '2020', students: 120 },
  { year: '2021', students: 145 },
  { year: '2022', students: 160 },
  { year: '2023', students: 185 },
  { year: '2024', students: 210 }
];

const examSuccessRateData = [
  { name: 'Informatique', rate: 78 },
  { name: 'Gestion', rate: 82 },
  { name: 'Communication', rate: 85 },
  { name: 'Langues', rate: 79 },
  { name: 'Droit', rate: 76 }
];

const StudentReportsTab = ({ departmentStatsData, studentStatsData, exportCSV }) => (
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
                  <Cell key={`${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
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
            <LineChart data={enrollmentTrendData}>
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
            <BarChart data={examSuccessRateData}>
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
);

export default StudentReportsTab;
