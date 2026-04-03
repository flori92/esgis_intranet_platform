import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const departmentAverageData = [
  { name: 'Informatique', average: 14.5 },
  { name: 'Gestion', average: 13.8 },
  { name: 'Communication', average: 15.2 },
  { name: 'Langues', average: 14.1 },
  { name: 'Droit', average: 13.5 }
];

const ExamReportsTab = ({ examStatsData, exportCSV }) => (
  <>
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
            <BarChart data={departmentAverageData}>
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
  </>
);

export default ExamReportsTab;
