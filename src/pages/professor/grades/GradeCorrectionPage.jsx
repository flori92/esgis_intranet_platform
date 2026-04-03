import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Divider,
  Snackbar,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Edit as EditIcon,
  Send as SendIcon,
  History as HistoryIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  HourglassEmpty as PendingIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';
import {
  getProfessorCorrections,
  getProfessorPublishedGrades,
  submitGradeCorrection
} from '@/api/grades';

/**
 * Page de gestion des demandes de correction de notes.
 * Le flux est désormais relié à de vraies notes publiées.
 */
const GradeCorrectionPage = () => {
  const { authState } = useAuth();
  const currentProfileId = authState.profile?.id || authState.user?.id || '';

  const [corrections, setCorrections] = useState([]);
  const [availableGrades, setAvailableGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const [newCorrectionDialog, setNewCorrectionDialog] = useState(false);
  const [correctionForm, setCorrectionForm] = useState({
    noteId: '',
    studentName: '',
    courseName: '',
    evalType: '',
    oldGrade: '',
    newGrade: '',
    justification: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [detailDialog, setDetailDialog] = useState(null);

  const resetCorrectionForm = () => {
    setCorrectionForm({
      noteId: '',
      studentName: '',
      courseName: '',
      evalType: '',
      oldGrade: '',
      newGrade: '',
      justification: ''
    });
  };

  const loadCorrections = useCallback(async () => {
    if (!currentProfileId) {
      setCorrections([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error: requestError } = await getProfessorCorrections(currentProfileId);
      if (requestError) throw requestError;
      setCorrections(data || []);
    } catch (err) {
      console.error('Erreur chargement corrections:', err);
      setError(err.message || 'Erreur lors du chargement des demandes de correction.');
      setCorrections([]);
    } finally {
      setLoading(false);
    }
  }, [currentProfileId]);

  const loadAvailableGrades = useCallback(async () => {
    if (!currentProfileId) {
      setAvailableGrades([]);
      setLoadingGrades(false);
      return;
    }

    setLoadingGrades(true);
    try {
      const { data, error: requestError } = await getProfessorPublishedGrades(currentProfileId);
      if (requestError) throw requestError;
      setAvailableGrades(data || []);
    } catch (err) {
      console.error('Erreur chargement notes publiées:', err);
      setAvailableGrades([]);
    } finally {
      setLoadingGrades(false);
    }
  }, [currentProfileId]);

  useEffect(() => {
    loadCorrections();
    loadAvailableGrades();
  }, [loadCorrections, loadAvailableGrades]);

  const getStatusChip = (statut) => {
    switch (statut) {
      case 'en_attente':
        return <Chip icon={<PendingIcon />} label="En attente" color="warning" size="small" />;
      case 'validee':
        return <Chip icon={<CheckCircleIcon />} label="Validée" color="success" size="small" />;
      case 'rejetee':
        return <Chip icon={<CancelIcon />} label="Rejetée" color="error" size="small" />;
      default:
        return <Chip label={statut || '-'} size="small" />;
    }
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy à HH:mm', { locale: fr });
    } catch {
      return dateString || '-';
    }
  };

  const handleOpenNewCorrectionDialog = async () => {
    setError(null);
    resetCorrectionForm();
    await loadAvailableGrades();
    setNewCorrectionDialog(true);
  };

  const handleSelectGrade = (gradeId) => {
    const selectedGrade = availableGrades.find((grade) => grade.id === gradeId);

    if (!selectedGrade) {
      resetCorrectionForm();
      return;
    }

    setCorrectionForm({
      noteId: selectedGrade.id,
      studentName: `${selectedGrade.etudiant?.last_name || ''} ${selectedGrade.etudiant?.first_name || ''}`.trim(),
      courseName: selectedGrade.cours?.name || '',
      evalType: selectedGrade.type_evaluation || '',
      oldGrade: String(selectedGrade.note ?? ''),
      newGrade: '',
      justification: ''
    });
  };

  const handleCloseNewCorrectionDialog = () => {
    setNewCorrectionDialog(false);
    resetCorrectionForm();
  };

  const handleSubmitCorrection = async () => {
    if (!correctionForm.noteId) {
      setError('Sélectionnez une note publiée à corriger.');
      return;
    }

    if (!correctionForm.newGrade || !correctionForm.justification) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { error: requestError } = await submitGradeCorrection({
        noteId: correctionForm.noteId,
        professorId: currentProfileId,
        oldGrade: parseFloat(correctionForm.oldGrade),
        newGrade: parseFloat(correctionForm.newGrade),
        justification: correctionForm.justification
      });

      if (requestError) throw requestError;

      setSuccessMessage('Demande de correction soumise avec succès.');
      handleCloseNewCorrectionDialog();
      await loadCorrections();
    } catch (err) {
      console.error('Erreur soumission correction:', err);
      setError(err.message || 'Erreur lors de la soumission de la demande de correction.');
    } finally {
      setSubmitting(false);
    }
  };

  const pendingCount = corrections.filter((correction) => correction.statut === 'en_attente').length;
  const approvedCount = corrections.filter((correction) => correction.statut === 'validee').length;
  const rejectedCount = corrections.filter((correction) => correction.statut === 'rejetee').length;

  return (
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <HistoryIcon sx={{ mr: 1, color: 'primary.main', fontSize: 32 }} />
          <Typography variant="h5" fontWeight="bold">
            Demandes de correction
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={handleOpenNewCorrectionDialog}
        >
          Nouvelle demande
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={4}>
          <Card elevation={2} sx={{ borderLeft: '4px solid', borderColor: 'warning.main' }}>
            <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
              <Typography variant="caption" color="text.secondary">En attente</Typography>
              <Typography variant="h4" fontWeight="bold" color="warning.main">{pendingCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={4}>
          <Card elevation={2} sx={{ borderLeft: '4px solid', borderColor: 'success.main' }}>
            <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
              <Typography variant="caption" color="text.secondary">Validées</Typography>
              <Typography variant="h4" fontWeight="bold" color="success.main">{approvedCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={4}>
          <Card elevation={2} sx={{ borderLeft: '4px solid', borderColor: 'error.main' }}>
            <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
              <Typography variant="caption" color="text.secondary">Rejetées</Typography>
              <Typography variant="h4" fontWeight="bold" color="error.main">{rejectedCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      <Snackbar open={!!successMessage} autoHideDuration={4000} onClose={() => setSuccessMessage('')} message={successMessage} />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : corrections.length === 0 ? (
        <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
          <HistoryIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Aucune demande de correction
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Les demandes soumises apparaîtront ici avec leur statut de traitement.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} elevation={2}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#003366' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Date</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Étudiant</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Cours</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Type</TableCell>
                <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Ancienne</TableCell>
                <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Nouvelle</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Statut</TableCell>
                <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {corrections.map((correction) => (
                <TableRow key={correction.id} hover>
                  <TableCell>
                    <Typography variant="body2">{formatDate(correction.created_at)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {correction.note?.etudiant?.last_name} {correction.note?.etudiant?.first_name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{correction.note?.cours?.name || '-'}</Typography>
                    <Typography variant="caption" color="text.secondary">{correction.note?.cours?.code || ''}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={correction.note?.type_evaluation || '-'} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" color="error.main" fontWeight="bold">
                      {correction.ancienne_note}/20
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" color="success.main" fontWeight="bold">
                      {correction.nouvelle_note}/20
                    </Typography>
                  </TableCell>
                  <TableCell>{getStatusChip(correction.statut)}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Voir les détails">
                      <IconButton size="small" onClick={() => setDetailDialog(correction)}>
                        <InfoIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={newCorrectionDialog} onClose={handleCloseNewCorrectionDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EditIcon color="primary" />
          Nouvelle demande de correction
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            La demande sera envoyée à l'administration pour validation. La modification ne sera effective qu'après approbation.
          </Alert>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Note publiée concernée</InputLabel>
            <Select
              value={correctionForm.noteId}
              onChange={(event) => handleSelectGrade(event.target.value)}
              label="Note publiée concernée"
            >
              {availableGrades.map((grade) => (
                <MenuItem key={grade.id} value={grade.id}>
                  {grade.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {loadingGrades && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}
          {!loadingGrades && availableGrades.length === 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Aucune note publiée n'est disponible pour une demande de correction.
            </Alert>
          )}
          <TextField
            label="Nom de l'étudiant"
            fullWidth
            sx={{ mt: 2 }}
            value={correctionForm.studentName}
            InputProps={{ readOnly: true }}
          />
          <TextField
            label="Cours concerné"
            fullWidth
            sx={{ mt: 2 }}
            value={correctionForm.courseName}
            InputProps={{ readOnly: true }}
          />
          <TextField
            label="Type d'évaluation"
            fullWidth
            sx={{ mt: 2 }}
            value={correctionForm.evalType}
            InputProps={{ readOnly: true }}
          />
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={6}>
              <TextField
                label="Note actuelle (/20)"
                type="number"
                fullWidth
                value={correctionForm.oldGrade}
                InputProps={{ readOnly: true }}
                inputProps={{ min: 0, max: 20, step: 0.25 }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Note corrigée (/20)"
                type="number"
                fullWidth
                value={correctionForm.newGrade}
                onChange={(event) => setCorrectionForm((prev) => ({ ...prev, newGrade: event.target.value }))}
                inputProps={{ min: 0, max: 20, step: 0.25 }}
              />
            </Grid>
          </Grid>
          <TextField
            label="Justification *"
            fullWidth
            multiline
            rows={3}
            sx={{ mt: 2 }}
            value={correctionForm.justification}
            onChange={(event) => setCorrectionForm((prev) => ({ ...prev, justification: event.target.value }))}
            placeholder="Expliquez précisément la raison de la correction..."
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNewCorrectionDialog}>Annuler</Button>
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={handleSubmitCorrection}
            disabled={submitting || !correctionForm.noteId || !correctionForm.justification || !correctionForm.newGrade}
          >
            {submitting ? 'Envoi...' : 'Soumettre'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!detailDialog} onClose={() => setDetailDialog(null)} maxWidth="sm" fullWidth>
        {detailDialog && (
          <>
            <DialogTitle>Détails de la demande</DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Statut</Typography>
                  <Box sx={{ mt: 0.5 }}>{getStatusChip(detailDialog.statut)}</Box>
                </Box>
                <Divider />
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Étudiant</Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {detailDialog.note?.etudiant?.last_name} {detailDialog.note?.etudiant?.first_name}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Cours</Typography>
                    <Typography variant="body1">{detailDialog.note?.cours?.name || '-'}</Typography>
                  </Grid>
                </Grid>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Note actuelle</Typography>
                    <Typography variant="h6" color="error.main" fontWeight="bold">
                      {detailDialog.ancienne_note}/20
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Note demandée</Typography>
                    <Typography variant="h6" color="success.main" fontWeight="bold">
                      {detailDialog.nouvelle_note}/20
                    </Typography>
                  </Grid>
                </Grid>
                <Box>
                  <Typography variant="caption" color="text.secondary">Justification</Typography>
                  <Paper variant="outlined" sx={{ p: 1.5, mt: 0.5 }}>
                    <Typography variant="body2">{detailDialog.justification}</Typography>
                  </Paper>
                </Box>
                {detailDialog.commentaire_admin && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Réponse de l'administration</Typography>
                    <Paper variant="outlined" sx={{ p: 1.5, mt: 0.5, bgcolor: detailDialog.statut === 'rejetee' ? 'error.50' : 'success.50' }}>
                      <Typography variant="body2">{detailDialog.commentaire_admin}</Typography>
                    </Paper>
                  </Box>
                )}
                <Box>
                  <Typography variant="caption" color="text.secondary">Date de la demande</Typography>
                  <Typography variant="body2">{formatDate(detailDialog.created_at)}</Typography>
                </Box>
                {detailDialog.validated_at && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Date de traitement</Typography>
                    <Typography variant="body2">{formatDate(detailDialog.validated_at)}</Typography>
                  </Box>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailDialog(null)}>Fermer</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default GradeCorrectionPage;
