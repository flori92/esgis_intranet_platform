import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, CircularProgress, Alert, Button,
  Select, MenuItem, FormControl, InputLabel, Chip, Divider,
  Snackbar, Card, CardContent, LinearProgress, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Checkbox,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import {
  Print as PrintIcon, Download as DownloadIcon, School as SchoolIcon,
  CheckCircle as CheckIcon, PlayArrow as StartIcon,
  Description as DocIcon, Group as GroupIcon
} from '@mui/icons-material';
import { useAuth } from '@/context/AuthContext';
import { getStudentsForBulletins, saveBulletin } from '@/api/admin';
import { supabase } from '@/supabase';

const BulkBulletinPage = () => {
  const { authState } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedNiveau, setSelectedNiveau] = useState('');
  const [selectedSemestre, setSelectedSemestre] = useState('S1');
  const [anneeAcademique, setAnneeAcademique] = useState('2025-2026');
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalToGenerate, setTotalToGenerate] = useState(0);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [generationComplete, setGenerationComplete] = useState(false);

  const NIVEAUX = [
    { id: 'n1', code: 'L1', name: 'Licence 1' },
    { id: 'n2', code: 'L2', name: 'Licence 2' },
    { id: 'n3', code: 'L3', name: 'Licence 3' },
    { id: 'n4', code: 'M1', name: 'Master 1' },
    { id: 'n5', code: 'M2', name: 'Master 2' },
  ];

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const { data, error } = await supabase.from('departments').select('id, name, code').order('name');
        if (!error) setDepartments(data || []);
      } catch (err) {
        // departments are optional for filtering
      } finally {
        setLoadingDepts(false);
      }
    };
    loadDepartments();
  }, []);

  const handleLoadStudents = async () => {
    if (!selectedNiveau) { setError('Sélectionnez un niveau.'); return; }
    setLoading(true);
    setError(null);
    try {
      const { data, error: apiError } = await getStudentsForBulletins(selectedNiveau, selectedSemestre, anneeAcademique);
      if (apiError) throw apiError;
      if (!data || data.length === 0) {
        setStudents([]);
        setSelectedStudents([]);
        setError('Aucun étudiant trouvé pour cette sélection.');
        return;
      }
      setStudents(data);
      setSelectedStudents(data.map(s => s.id));
    } catch (err) {
      setError(`Erreur lors du chargement: ${err.message || 'Erreur inconnue'}`);
      setStudents([]);
      setSelectedStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStudent = (id) => {
    setSelectedStudents(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const handleToggleAll = () => {
    setSelectedStudents(prev => prev.length === students.length ? [] : students.map(s => s.id));
  };

  const handleStartGeneration = async () => {
    setConfirmDialog(false);
    setGenerating(true);
    setProgress(0);
    setGeneratedCount(0);
    setTotalToGenerate(selectedStudents.length);
    setGenerationComplete(false);

    const selectedData = students.filter(s => selectedStudents.includes(s.id));
    let successCount = 0;
    const errors = [];

    for (let i = 0; i < selectedData.length; i++) {
      const student = selectedData[i];
      try {
        // Generate PDF bulletin using pdf-lib
        const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([595, 842]); // A4
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        // Header
        page.drawText('ESGIS - Bulletin de Notes', { x: 150, y: 790, size: 18, font: boldFont, color: rgb(0, 0.2, 0.4) });
        page.drawText(`Année Académique: ${anneeAcademique}`, { x: 50, y: 760, size: 11, font });
        page.drawText(`Semestre: ${selectedSemestre}`, { x: 350, y: 760, size: 11, font });

        // Student info
        page.drawText(`Étudiant: ${student.name}`, { x: 50, y: 730, size: 12, font: boldFont });
        page.drawText(`Rang: ${student.rang}/${selectedData.length}`, { x: 400, y: 730, size: 11, font });

        // Results
        page.drawText(`Moyenne Générale: ${student.moyenne?.toFixed(2)}/20`, { x: 50, y: 700, size: 14, font: boldFont, color: student.moyenne >= 10 ? rgb(0, 0.5, 0) : rgb(0.8, 0, 0) });
        page.drawText(`Crédits Validés: ${student.credits}`, { x: 50, y: 675, size: 12, font });
        page.drawText(`Mention: ${student.mention}`, { x: 250, y: 675, size: 12, font });
        page.drawText(`Décision: ${student.statut}`, { x: 400, y: 675, size: 12, font: boldFont });

        // Footer
        page.drawText(`Document généré le ${new Date().toLocaleDateString('fr-FR')}`, { x: 50, y: 50, size: 9, font, color: rgb(0.5, 0.5, 0.5) });
        page.drawText('Ce document est généré électroniquement et peut être vérifié via QR code.', { x: 50, y: 35, size: 8, font, color: rgb(0.5, 0.5, 0.5) });

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const fileName = `bulletin_${student.id}_${selectedSemestre}_${anneeAcademique.replace('-', '_')}.pdf`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(`bulletins/${fileName}`, blob, { contentType: 'application/pdf', upsert: true });

        // Save record in generated_documents
        const { error: saveError } = await saveBulletin({
          student_id: student.id,
          file_path: `bulletins/${fileName}`,
          status: 'approved',
          generated_by: authState.profile?.id,
          approved_by: authState.profile?.id,
          approval_date: new Date().toISOString(),
        });

        if (saveError) throw saveError;
        successCount++;
      } catch (err) {
        errors.push({ student: student.name, error: err.message });
      }

      setGeneratedCount(i + 1);
      setProgress(Math.round(((i + 1) / selectedData.length) * 100));
    }

    setGenerating(false);
    setGenerationComplete(true);

    if (errors.length > 0) {
      setSuccessMessage(`${successCount} bulletins générés. ${errors.length} erreur(s).`);
    } else {
      setSuccessMessage(`${successCount} bulletins générés avec succès !`);
    }
  };

  const getStatusColor = (statut) => {
    const colors = { admis: 'success', compensation: 'warning', rattrapage: 'info', 'ajourné': 'error' };
    return colors[statut] || 'default';
  };

  const niveauData = NIVEAUX.find(n => n.id === selectedNiveau);

  return (
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <PrintIcon sx={{ mr: 1, color: 'primary.main', fontSize: 32 }} />
        <Typography variant="h5" fontWeight="bold">Génération en masse de bulletins</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      <Snackbar open={!!successMessage} autoHideDuration={4000} onClose={() => setSuccessMessage('')} message={successMessage} />

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>Paramètres de génération</Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Filière</InputLabel>
              <Select value={selectedDepartment} label="Filière"
                onChange={(e) => { setSelectedDepartment(e.target.value); setStudents([]); }}>
                <MenuItem value="">Toutes</MenuItem>
                {departments.map(d => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Niveau</InputLabel>
              <Select value={selectedNiveau} label="Niveau"
                onChange={(e) => { setSelectedNiveau(e.target.value); setStudents([]); }}>
                {NIVEAUX.map(n => <MenuItem key={n.id} value={n.id}>{n.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Semestre</InputLabel>
              <Select value={selectedSemestre} label="Semestre" onChange={(e) => setSelectedSemestre(e.target.value)}>
                <MenuItem value="S1">S1</MenuItem>
                <MenuItem value="S2">S2</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Année</InputLabel>
              <Select value={anneeAcademique} label="Année" onChange={(e) => setAnneeAcademique(e.target.value)}>
                <MenuItem value="2025-2026">2025-2026</MenuItem>
                <MenuItem value="2024-2025">2024-2025</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button variant="contained" fullWidth onClick={handleLoadStudents} disabled={loading || !selectedNiveau}>
              {loading ? <CircularProgress size={20} /> : 'Charger'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {generating && (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Génération en cours... ({generatedCount}/{totalToGenerate})
          </Typography>
          <LinearProgress variant="determinate" value={progress} sx={{ height: 16, borderRadius: 8, mb: 1 }} />
          <Typography variant="body2" color="text.secondary" align="center">{progress}%</Typography>
        </Paper>
      )}

      {generationComplete && (
        <Alert severity="success" sx={{ mb: 3 }} icon={<CheckIcon />}>
          <strong>{generatedCount} bulletins</strong> ont été générés et enregistrés dans l'espace documents de chaque étudiant.
        </Alert>
      )}

      {students.length > 0 && !generating && (
        <>
          <Paper elevation={2} sx={{ p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <GroupIcon color="primary" />
              <Typography variant="subtitle1" fontWeight="bold">
                {niveauData?.name} — {selectedSemestre} — {anneeAcademique}
              </Typography>
              <Chip label={`${selectedStudents.length}/${students.length} sélectionnés`} color="primary" variant="outlined" />
            </Box>
            <Button variant="contained" color="success" startIcon={<StartIcon />}
              onClick={() => setConfirmDialog(true)} disabled={selectedStudents.length === 0}>
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
                      <Checkbox checked={selectedStudents.includes(s.id)} onChange={() => handleToggleStudent(s.id)} />
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
                    <TableCell><Chip label={s.statut} size="small" color={getStatusColor(s.statut)} /></TableCell>
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

      <Dialog open={confirmDialog} onClose={() => setConfirmDialog(false)}>
        <DialogTitle>Confirmer la génération</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Vous allez générer <strong>{selectedStudents.length} bulletins PDF</strong> pour le semestre {selectedSemestre} de l'année {anneeAcademique}.
          </Alert>
          <Typography variant="body2">
            Les bulletins seront automatiquement uploadés et mis à disposition dans l'espace documents de chaque étudiant.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(false)}>Annuler</Button>
          <Button variant="contained" color="success" startIcon={<StartIcon />} onClick={handleStartGeneration}>
            Lancer la génération
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BulkBulletinPage;
