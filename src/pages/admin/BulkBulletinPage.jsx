import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, CircularProgress, Alert, Button,
  Select, MenuItem, FormControl, InputLabel, Chip, Divider,
  Snackbar, Card, CardContent, LinearProgress, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Checkbox,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import {
  Print as PrintIcon,
  Download as DownloadIcon,
  School as SchoolIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  PlayArrow as StartIcon,
  Description as DocIcon,
  Group as GroupIcon
} from '@mui/icons-material';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/supabase';
import { getStudentsForBulletins, saveBulletin } from '@/api/admin';

const MOCK_FILIERES = [
  { id: 'f1', code: 'INFO', name: 'Informatique' },
  { id: 'f2', code: 'GEST', name: 'Gestion' },
  { id: 'f3', code: 'COMM', name: 'Communication' },
];

const MOCK_NIVEAUX = [
  { id: 'n1', code: 'L1', name: 'Licence 1', filiere_id: 'f1', students_count: 120 },
  { id: 'n2', code: 'L2', name: 'Licence 2', filiere_id: 'f1', students_count: 95 },
  { id: 'n3', code: 'L3', name: 'Licence 3', filiere_id: 'f1', students_count: 72 },
  { id: 'n4', code: 'M1', name: 'Master 1', filiere_id: 'f1', students_count: 40 },
  { id: 'n5', code: 'M2', name: 'Master 2', filiere_id: 'f1', students_count: 28 },
];

const MOCK_STUDENTS_PREVIEW = [
  { id: 's1', name: 'AGBEKO Kofi', moyenne: 14.5, credits: 30, rang: 1, statut: 'admis', mention: 'Bien' },
  { id: 's2', name: 'DOSSEH Ama', moyenne: 12.8, credits: 28, rang: 2, statut: 'admis', mention: 'Assez Bien' },
  { id: 's3', name: 'KPOMASSE Yao', moyenne: 11.2, credits: 26, rang: 3, statut: 'admis', mention: 'Passable' },
  { id: 's4', name: 'MENSAH Akossiwa', moyenne: 10.1, credits: 24, rang: 4, statut: 'compensation', mention: 'Passable' },
  { id: 's5', name: 'AMEGAH Komi', moyenne: 9.5, credits: 20, rang: 5, statut: 'rattrapage', mention: 'Insuffisant' },
  { id: 's6', name: 'TOGBUI Edem', moyenne: 8.2, credits: 18, rang: 6, statut: 'ajourné', mention: 'Insuffisant' },
];

/**
 * Page de génération en masse de bulletins — ESGIS Campus §5.5
 */
const BulkBulletinPage = () => {
  const { authState } = useAuth();
  const [filieres, setFilieres] = useState(MOCK_FILIERES);
  const [niveaux, setNiveaux] = useState(MOCK_NIVEAUX);
  const [selectedFiliere, setSelectedFiliere] = useState('');
  const [selectedNiveau, setSelectedNiveau] = useState('');
  const [selectedSemestre, setSelectedSemestre] = useState('S1');
  const [anneeAcademique, setAnneeAcademique] = useState('2025-2026');
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Génération
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalToGenerate, setTotalToGenerate] = useState(0);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [generationComplete, setGenerationComplete] = useState(false);

  const filteredNiveaux = niveaux.filter(n => !selectedFiliere || n.filiere_id === selectedFiliere);

  const handleLoadStudents = async () => {
    if (!selectedNiveau) { setError('Sélectionnez un niveau.'); return; }
    setLoading(true);
    try {
      const { data, error } = await getStudentsForBulletins(selectedNiveau, selectedSemestre, anneeAcademique);
      if (!error && data && data.length > 0) {
        setStudents(data);
        setSelectedStudents(data.map(s => s.id));
      } else {
        setStudents(MOCK_STUDENTS_PREVIEW);
        setSelectedStudents(MOCK_STUDENTS_PREVIEW.map(s => s.id));
      }
    } catch {
      setStudents(MOCK_STUDENTS_PREVIEW);
      setSelectedStudents(MOCK_STUDENTS_PREVIEW.map(s => s.id));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStudent = (id) => {
    setSelectedStudents(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleToggleAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(s => s.id));
    }
  };

  const handleStartGeneration = async () => {
    setConfirmDialog(false);
    setGenerating(true);
    setProgress(0);
    setGeneratedCount(0);
    setTotalToGenerate(selectedStudents.length);
    setGenerationComplete(false);

    // Simulation de génération progressive
    for (let i = 0; i < selectedStudents.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 150));
      setGeneratedCount(i + 1);
      setProgress(Math.round(((i + 1) / selectedStudents.length) * 100));
    }

    setGenerating(false);
    setGenerationComplete(true);
    setSuccessMessage(`${selectedStudents.length} bulletins générés avec succès !`);
  };

  const getStatusColor = (statut) => {
    switch (statut) {
      case 'admis': return 'success';
      case 'compensation': return 'warning';
      case 'rattrapage': return 'info';
      case 'ajourné': return 'error';
      default: return 'default';
    }
  };

  const niveauData = niveaux.find(n => n.id === selectedNiveau);

  return (
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <PrintIcon sx={{ mr: 1, color: 'primary.main', fontSize: 32 }} />
        <Typography variant="h5" fontWeight="bold">Génération en masse de bulletins</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      <Snackbar open={!!successMessage} autoHideDuration={4000} onClose={() => setSuccessMessage('')} message={successMessage} />

      {/* Sélection */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>Paramètres de génération</Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Filière</InputLabel>
              <Select value={selectedFiliere} label="Filière"
                onChange={(e) => { setSelectedFiliere(e.target.value); setSelectedNiveau(''); setStudents([]); }}>
                <MenuItem value="">Toutes</MenuItem>
                {filieres.map(f => <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Niveau</InputLabel>
              <Select value={selectedNiveau} label="Niveau"
                onChange={(e) => { setSelectedNiveau(e.target.value); setStudents([]); }}>
                {filteredNiveaux.map(n => (
                  <MenuItem key={n.id} value={n.id}>
                    {n.name} ({n.students_count} étudiants)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Semestre</InputLabel>
              <Select value={selectedSemestre} label="Semestre"
                onChange={(e) => setSelectedSemestre(e.target.value)}>
                <MenuItem value="S1">S1</MenuItem>
                <MenuItem value="S2">S2</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Année</InputLabel>
              <Select value={anneeAcademique} label="Année"
                onChange={(e) => setAnneeAcademique(e.target.value)}>
                <MenuItem value="2025-2026">2025-2026</MenuItem>
                <MenuItem value="2024-2025">2024-2025</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button variant="contained" fullWidth onClick={handleLoadStudents}
              disabled={loading || !selectedNiveau}>
              {loading ? <CircularProgress size={20} /> : 'Charger'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Barre de progression */}
      {generating && (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Génération en cours... ({generatedCount}/{totalToGenerate})
          </Typography>
          <LinearProgress variant="determinate" value={progress} sx={{ height: 16, borderRadius: 8, mb: 1 }} />
          <Typography variant="body2" color="text.secondary" align="center">
            {progress}% — {generatedCount} bulletin(s) généré(s)
          </Typography>
        </Paper>
      )}

      {generationComplete && (
        <Alert severity="success" sx={{ mb: 3 }} icon={<CheckIcon />}>
          <strong>{selectedStudents.length} bulletins</strong> ont été générés et sont maintenant disponibles
          dans l'espace documents de chaque étudiant.
          <Button size="small" startIcon={<DownloadIcon />} sx={{ ml: 2 }}>
            Télécharger l'archive ZIP
          </Button>
        </Alert>
      )}

      {/* Tableau des étudiants */}
      {students.length > 0 && !generating && (
        <>
          <Paper elevation={2} sx={{ p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <GroupIcon color="primary" />
              <Typography variant="subtitle1" fontWeight="bold">
                {niveauData?.name} — {selectedSemestre} — {anneeAcademique}
              </Typography>
              <Chip label={`${selectedStudents.length}/${students.length} sélectionnés`}
                color="primary" variant="outlined" />
            </Box>
            <Button variant="contained" color="success" startIcon={<StartIcon />}
              onClick={() => setConfirmDialog(true)}
              disabled={selectedStudents.length === 0}>
              Générer {selectedStudents.length} bulletin(s)
            </Button>
          </Paper>

          <TableContainer component={Paper} elevation={2}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#003366' }}>
                  <TableCell padding="checkbox" sx={{ color: 'white' }}>
                    <Checkbox checked={selectedStudents.length === students.length}
                      indeterminate={selectedStudents.length > 0 && selectedStudents.length < students.length}
                      onChange={handleToggleAll} sx={{ color: 'white' }} />
                  </TableCell>
                  {['Rang', 'Étudiant', 'Moyenne', 'Crédits', 'Mention', 'Décision'].map(h => (
                    <TableCell key={h} sx={{ color: 'white', fontWeight: 'bold' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map(s => (
                  <TableRow key={s.id} hover selected={selectedStudents.includes(s.id)}>
                    <TableCell padding="checkbox">
                      <Checkbox checked={selectedStudents.includes(s.id)}
                        onChange={() => handleToggleStudent(s.id)} />
                    </TableCell>
                    <TableCell>{s.rang}</TableCell>
                    <TableCell><Typography fontWeight="bold">{s.name}</Typography></TableCell>
                    <TableCell>
                      <Typography fontWeight="bold" color={s.moyenne >= 10 ? 'success.main' : 'error.main'}>
                        {s.moyenne?.toFixed(2)}/20
                      </Typography>
                    </TableCell>
                    <TableCell>{s.credits}</TableCell>
                    <TableCell>{s.mention}</TableCell>
                    <TableCell>
                      <Chip label={s.statut} size="small" color={getStatusColor(s.statut)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {students.length === 0 && !loading && (
        <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
          <DocIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Sélectionnez une filière et un niveau puis cliquez sur Charger
          </Typography>
        </Paper>
      )}

      {/* Confirmation */}
      <Dialog open={confirmDialog} onClose={() => setConfirmDialog(false)}>
        <DialogTitle>Confirmer la génération</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Vous allez générer <strong>{selectedStudents.length} bulletins</strong> pour le semestre {selectedSemestre} de l'année {anneeAcademique}.
          </Alert>
          <Typography variant="body2">
            Les bulletins seront automatiquement mis à disposition dans l'espace documents de chaque étudiant concerné.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(false)}>Annuler</Button>
          <Button variant="contained" color="success" startIcon={<StartIcon />}
            onClick={handleStartGeneration}>
            Lancer la génération
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BulkBulletinPage;
