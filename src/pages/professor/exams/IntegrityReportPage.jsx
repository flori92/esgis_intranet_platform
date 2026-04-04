import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Grid, CircularProgress, Alert, Button,
  Card, CardContent, Chip, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow
} from '@mui/material';
import {
  Security as SecurityIcon, ArrowBack as BackIcon, Warning as WarningIcon,
  CheckCircle as OkIcon, Error as ErrorIcon
} from '@mui/icons-material';
import { useAuth } from '@/context/AuthContext';
import { generateIntegrityReport, getIntegrityReports } from '@/api/security';

const IntegrityReportPage = () => {
  const { id } = useParams();
  const examId = Number(id);
  const navigate = useNavigate();
  const { authState } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadReport = async () => {
      try {
        const { data } = await getIntegrityReports(examId);
        if (data && data.length > 0) {
          setReport(data[0]);
        }
      } catch (err) {
        setError('Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };
    if (examId) loadReport();
  }, [examId]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data, error: apiError } = await generateIntegrityReport(examId, authState.profile?.id);
      if (apiError) throw apiError;
      setReport(data);
    } catch (err) {
      setError('Erreur lors de la génération du rapport');
    } finally {
      setGenerating(false);
    }
  };

  const getRiskColor = (level) => {
    const map = { low: 'success', medium: 'warning', high: 'error', critical: 'error' };
    return map[level] || 'default';
  };

  const getRiskLabel = (level) => {
    const map = { low: 'Faible', medium: 'Moyen', high: 'Élevé', critical: 'Critique' };
    return map[level] || level;
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Button startIcon={<BackIcon />} onClick={() => navigate(-1)}>Retour</Button>
        <SecurityIcon sx={{ color: 'primary.main', fontSize: 28 }} />
        <Typography variant="h5" fontWeight="bold">Rapport d'intégrité</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {!report ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <SecurityIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Aucun rapport d'intégrité généré pour cet examen
          </Typography>
          <Button variant="contained" onClick={handleGenerate} disabled={generating} sx={{ mt: 2 }}>
            {generating ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
            Générer le rapport
          </Button>
        </Paper>
      ) : (
        <>
          {/* Résumé */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <Card elevation={2}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" fontWeight="bold">{report.total_students}</Typography>
                  <Typography variant="body2" color="text.secondary">Étudiants</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card elevation={2}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" fontWeight="bold" color={report.incidents_count > 0 ? 'error.main' : 'success.main'}>
                    {report.incidents_count}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Incidents détectés</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card elevation={2}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Chip label={getRiskLabel(report.risk_level)} color={getRiskColor(report.risk_level)} sx={{ fontSize: '1.2rem', height: 40, mt: 1 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Niveau de risque</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card elevation={2}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Généré le</Typography>
                  <Typography variant="h6">{new Date(report.created_at).toLocaleDateString('fr-FR')}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Résumé textuel */}
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>Résumé</Typography>
            <Typography variant="body1">{report.summary}</Typography>
          </Paper>

          {/* Sorties d'onglet */}
          <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              <WarningIcon sx={{ mr: 1, verticalAlign: 'middle', color: 'warning.main' }} />
              Sorties d'onglet ({(report.tab_switches || []).length})
            </Typography>
            {(report.tab_switches || []).length === 0 ? (
              <Alert severity="success" icon={<OkIcon />}>Aucune sortie d'onglet détectée</Alert>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow><TableCell>Étudiant</TableCell><TableCell>Horodatage</TableCell></TableRow>
                  </TableHead>
                  <TableBody>
                    {(report.tab_switches || []).map((ts, i) => (
                      <TableRow key={i}>
                        <TableCell>{ts.student_name || ts.student_id}</TableCell>
                        <TableCell>{ts.timestamp ? new Date(ts.timestamp).toLocaleString('fr-FR') : '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>

          {/* Reconnexions */}
          <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              <ErrorIcon sx={{ mr: 1, verticalAlign: 'middle', color: 'error.main' }} />
              Reconnexions ({(report.reconnections || []).length})
            </Typography>
            {(report.reconnections || []).length === 0 ? (
              <Alert severity="success" icon={<OkIcon />}>Aucune reconnexion suspecte</Alert>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow><TableCell>Étudiant</TableCell><TableCell>Horodatage</TableCell></TableRow>
                  </TableHead>
                  <TableBody>
                    {(report.reconnections || []).map((r, i) => (
                      <TableRow key={i}>
                        <TableCell>{r.student_name || r.student_id}</TableCell>
                        <TableCell>{r.timestamp ? new Date(r.timestamp).toLocaleString('fr-FR') : '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>

          {/* Temps suspects */}
          <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Temps anormalement courts ({(report.suspicious_timing || []).length})
            </Typography>
            {(report.suspicious_timing || []).length === 0 ? (
              <Alert severity="success" icon={<OkIcon />}>Aucun temps suspect détecté</Alert>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow><TableCell>Étudiant</TableCell><TableCell>Temps passé (s)</TableCell></TableRow>
                  </TableHead>
                  <TableBody>
                    {(report.suspicious_timing || []).map((st, i) => (
                      <TableRow key={i}>
                        <TableCell>{st.student_name || st.student_id}</TableCell>
                        <TableCell>{st.completion_time}s</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>

          <Button variant="contained" onClick={handleGenerate} disabled={generating}>
            Régénérer le rapport
          </Button>
        </>
      )}
    </Box>
  );
};

export default IntegrityReportPage;
