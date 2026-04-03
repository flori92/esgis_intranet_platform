import React from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  LinearProgress, Divider, Alert, Accordion, AccordionSummary,
  AccordionDetails, Tooltip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Timer as TimerIcon,
  Devices as DevicesIcon,
  TabUnselected as TabIcon,
  ContentCopy as CopyIcon,
  Mouse as MouseIcon,
  Fullscreen as FullscreenIcon,
  BugReport as BugIcon
} from '@mui/icons-material';

/**
 * Composant de rapport d'intégrité post-examen — ESGIS Campus §6.3
 * Affiché au professeur après chaque examen pour lister les incidents détectés
 * 
 * @param {Object} props
 * @param {Object} props.report - Rapport d'intégrité généré par AntiCheatService
 * @param {string} props.studentName - Nom de l'étudiant
 * @param {string} props.examTitle - Titre de l'examen
 */
const IntegrityReport = ({ report, studentName, examTitle }) => {
  if (!report) {
    return (
      <Alert severity="info">
        Aucun rapport d'intégrité disponible pour cet examen.
      </Alert>
    );
  }

  const getRiskColor = (level) => {
    switch (level) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  const getRiskLabel = (level) => {
    switch (level) {
      case 'low': return 'Faible';
      case 'medium': return 'Modéré';
      case 'high': return 'Élevé';
      case 'critical': return 'Critique';
      default: return 'Inconnu';
    }
  };

  const getRiskIcon = (level) => {
    switch (level) {
      case 'low': return <CheckCircleIcon color="success" />;
      case 'medium': return <WarningIcon color="warning" />;
      case 'high': return <ErrorIcon color="error" />;
      case 'critical': return <ErrorIcon color="error" />;
      default: return <SecurityIcon />;
    }
  };

  const getIncidentIcon = (type) => {
    switch (type) {
      case 'tab_switch':
      case 'window_blur': return <TabIcon fontSize="small" />;
      case 'copy_attempt':
      case 'paste_attempt':
      case 'cut_attempt': return <CopyIcon fontSize="small" />;
      case 'right_click': return <MouseIcon fontSize="small" />;
      case 'fullscreen_exit': return <FullscreenIcon fontSize="small" />;
      case 'devtools_attempt':
      case 'view_source_attempt': return <BugIcon fontSize="small" />;
      default: return <WarningIcon fontSize="small" />;
    }
  };

  const getIncidentLabel = (type) => {
    const labels = {
      tab_switch: "Sortie d'onglet",
      window_blur: 'Perte de focus',
      copy_attempt: 'Tentative de copie',
      paste_attempt: 'Tentative de collage',
      cut_attempt: 'Tentative de coupe',
      right_click: 'Clic droit',
      fullscreen_exit: 'Sortie plein écran',
      devtools_attempt: 'DevTools',
      view_source_attempt: 'Code source',
      alt_tab: 'Alt+Tab',
      print_attempt: 'Impression',
      window_resize: 'Redimensionnement',
      auto_submit: 'Soumission auto',
      fullscreen_denied: 'Plein écran refusé'
    };
    return labels[type] || type;
  };

  const formatTimestamp = (ts) => {
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return ts;
    }
  };

  const summary = report.incidentsSummary || {};

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      {/* En-tête */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <SecurityIcon sx={{ fontSize: 36, color: 'primary.main' }} />
        <Box>
          <Typography variant="h5" fontWeight="bold">
            Rapport d'Intégrité
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {examTitle} — {studentName}
          </Typography>
        </Box>
      </Box>

      {/* Score de risque global */}
      <Card elevation={2} sx={{ mb: 3, borderLeft: '6px solid', borderColor: `${getRiskColor(report.riskLevel)}.main` }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {getRiskIcon(report.riskLevel)}
                <Box>
                  <Typography variant="caption" color="text.secondary">Niveau de risque</Typography>
                  <Typography variant="h4" fontWeight="bold">
                    <Chip
                      label={getRiskLabel(report.riskLevel)}
                      color={getRiskColor(report.riskLevel)}
                      size="medium"
                      sx={{ fontSize: '1rem' }}
                    />
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="caption" color="text.secondary">Score de risque</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ flex: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={report.riskScore}
                    color={getRiskColor(report.riskLevel)}
                    sx={{ height: 12, borderRadius: 6 }}
                  />
                </Box>
                <Typography variant="h6" fontWeight="bold">
                  {report.riskScore}/100
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="caption" color="text.secondary">Incidents détectés</Typography>
              <Typography variant="h4" fontWeight="bold" color={summary.total > 0 ? 'warning.main' : 'success.main'}>
                {summary.total || 0}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Résumé des incidents par type */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: "Sorties d'onglet", count: summary.tabSwitches || 0, icon: <TabIcon />, color: 'warning' },
          { label: 'Pertes de focus', count: summary.windowBlurs || 0, icon: <TabIcon />, color: 'warning' },
          { label: 'Copies/Collages', count: (summary.copyAttempts || 0) + (summary.pasteAttempts || 0), icon: <CopyIcon />, color: 'error' },
          { label: 'Clics droits', count: summary.rightClicks || 0, icon: <MouseIcon />, color: 'info' },
          { label: 'DevTools', count: summary.devtoolsAttempts || 0, icon: <BugIcon />, color: 'error' },
          { label: 'Sorties plein écran', count: summary.fullscreenExits || 0, icon: <FullscreenIcon />, color: 'warning' },
        ].map((item, idx) => (
          <Grid item xs={6} sm={4} md={2} key={idx}>
            <Card variant="outlined" sx={{ textAlign: 'center', py: 1 }}>
              <Box sx={{ color: `${item.color}.main`, mb: 0.5 }}>{item.icon}</Box>
              <Typography variant="h5" fontWeight="bold" color={item.count > 0 ? `${item.color}.main` : 'text.secondary'}>
                {item.count}
              </Typography>
              <Typography variant="caption" color="text.secondary">{item.label}</Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Journal détaillé des incidents */}
      <Accordion defaultExpanded={report.incidents && report.incidents.length > 0}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1" fontWeight="bold">
            Journal détaillé des incidents ({report.incidents?.length || 0})
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {report.incidents && report.incidents.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>Heure</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Question</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Détails</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {report.incidents.map((incident, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {formatTimestamp(incident.timestamp)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getIncidentIcon(incident.type)}
                          label={getIncidentLabel(incident.type)}
                          size="small"
                          variant="outlined"
                          color={
                            incident.type.includes('devtools') || incident.type.includes('auto_submit')
                              ? 'error'
                              : incident.type.includes('tab') || incident.type.includes('blur')
                              ? 'warning'
                              : 'default'
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Chip label={`Q${(incident.questionIndex || 0) + 1}`} size="small" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{incident.details}</Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="success">Aucun incident détecté pendant cet examen.</Alert>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Analyse des temps par question */}
      {report.timeAnalysis && Object.keys(report.timeAnalysis).length > 0 && (
        <Accordion sx={{ mt: 1 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TimerIcon color="info" />
              <Typography variant="subtitle1" fontWeight="bold">
                Analyse des temps par question
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>Question</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Durée</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Statut</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(report.timeAnalysis).map(([qIdx, analysis]) => (
                    <TableRow key={qIdx} hover sx={{ bgcolor: analysis.isAnomalous ? 'warning.50' : 'transparent' }}>
                      <TableCell><Chip label={`Q${parseInt(qIdx) + 1}`} size="small" /></TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {analysis.durationFormatted}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {analysis.isAnomalous ? (
                          <Tooltip title="Temps anormalement court sur cette question">
                            <Chip label="Suspect" color="warning" size="small" icon={<WarningIcon />} />
                          </Tooltip>
                        ) : (
                          <Chip label="Normal" color="success" size="small" variant="outlined" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Informations de connexion */}
      {report.connectionInfo && (
        <Accordion sx={{ mt: 1 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DevicesIcon color="info" />
              <Typography variant="subtitle1" fontWeight="bold">
                Informations de connexion
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {[
                { label: 'Navigateur', value: report.connectionInfo.browser },
                { label: 'Système', value: report.connectionInfo.os },
                { label: 'Écran', value: `${report.connectionInfo.screenWidth}x${report.connectionInfo.screenHeight}` },
                { label: 'Langue', value: report.connectionInfo.language },
                { label: 'Plateforme', value: report.connectionInfo.platform },
              ].map((info, idx) => (
                <Grid item xs={6} sm={4} key={idx}>
                  <Typography variant="caption" color="text.secondary">{info.label}</Typography>
                  <Typography variant="body2" fontWeight="bold">{info.value}</Typography>
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Période d'examen */}
      <Box sx={{ mt: 2, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {report.startedAt && (
          <Typography variant="body2" color="text.secondary">
            <strong>Début :</strong> {new Date(report.startedAt).toLocaleString('fr-FR')}
          </Typography>
        )}
        {report.completedAt && (
          <Typography variant="body2" color="text.secondary">
            <strong>Fin :</strong> {new Date(report.completedAt).toLocaleString('fr-FR')}
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

export default IntegrityReport;
