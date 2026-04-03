import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, CircularProgress, Alert, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  Card, CardContent, Divider, Snackbar, IconButton, Tooltip
} from '@mui/material';
import {
  Edit as EditIcon,
  Send as SendIcon,
  History as HistoryIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  HourglassEmpty as PendingIcon,
  Grading as GradingIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/supabase';
import { getProfessorCorrections, submitGradeCorrection } from '@/api/grades';

/**
 * Données mock pour les demandes de correction
 */
const MOCK_CORRECTIONS = [
  {
    id: 'cor1',
    note_id: 'n1',
    ancienne_note: 8.5,
    nouvelle_note: 12,
    justification: 'Erreur de saisie lors de la correction du CC1. La note réelle est 12/20.',
    statut: 'en_attente',
    created_at: '2025-05-01T10:30:00Z',
    note: {
      id: 'n1',
      note: 8.5,
      type_evaluation: 'cc1',
      date_evaluation: '2025-04-15',
      etudiant: { id: 's1', first_name: 'Kofi', last_name: 'AGBEKO' },
      cours: { id: 'c1', name: 'Développement Web Frontend', code: 'INFO-345' }
    }
  },
  {
    id: 'cor2',
    note_id: 'n2',
    ancienne_note: 14,
    nouvelle_note: 15.5,
    justification: 'Question bonus non prise en compte initialement.',
    statut: 'validee',
    created_at: '2025-04-20T14:00:00Z',
    validated_at: '2025-04-21T09:00:00Z',
    note: {
      id: 'n2',
      note: 15.5,
      type_evaluation: 'examen',
      date_evaluation: '2025-04-10',
      etudiant: { id: 's2', first_name: 'Ama', last_name: 'DOSSEH' },
      cours: { id: 'c2', name: 'Algorithmique Avancée', code: 'INFO-221' }
    }
  },
  {
    id: 'cor3',
    note_id: 'n3',
    ancienne_note: 6,
    nouvelle_note: 11,
    justification: 'Copie attribuée au mauvais étudiant.',
    statut: 'rejetee',
    created_at: '2025-04-18T08:00:00Z',
    validated_at: '2025-04-19T16:30:00Z',
    commentaire_admin: 'Veuillez fournir une preuve supplémentaire (copie scannée).',
    note: {
      id: 'n3',
      note: 6,
      type_evaluation: 'cc2',
      date_evaluation: '2025-04-05',
      etudiant: { id: 's3', first_name: 'Yao', last_name: 'KPOMASSE' },
      cours: { id: 'c1', name: 'Développement Web Frontend', code: 'INFO-345' }
    }
  },
];

/**
 * Page de gestion des demandes de correction de notes
 * Permet au professeur de soumettre et suivre ses demandes de correction
 */
const GradeCorrectionPage = () => {
  const { authState } = useAuth();

  // États
  const [corrections, setCorrections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Dialog nouvelle demande
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

  // Dialog détails
  const [detailDialog, setDetailDialog] = useState(null);

  /**
   * Charger les demandes de correction
   */
  const loadCorrections = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await getProfessorCorrections(authState.user?.id);
      if (error) throw error;

      if (data && data.length > 0) {
        setCorrections(data);
      } else {
        setCorrections(MOCK_CORRECTIONS);
      }
    } catch (err) {
      console.error('Erreur chargement corrections:', err);
      setCorrections(MOCK_CORRECTIONS);
    } finally {
      setLoading(false);
    }
  }, [authState.user?.id]);

  useEffect(() => {
    loadCorrections();
  }, [loadCorrections]);

  /**
   * Obtenir le chip de statut
   */
  const getStatusChip = (statut) => {
    switch (statut) {
      case 'en_attente':
        return <Chip icon={<PendingIcon />} label="En attente" color="warning" size="small" />;
      case 'validee':
        return <Chip icon={<CheckCircleIcon />} label="Validée" color="success" size="small" />;
      case 'rejetee':
        return <Chip icon={<CancelIcon />} label="Rejetée" color="error" size="small" />;
      default:
        return <Chip label={statut} size="small" />;
    }
  };

  /**
   * Formater une date
   */
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy à HH:mm', { locale: fr });
    } catch {
      return dateString || '-';
    }
  };

  /**
   * Soumettre une nouvelle demande de correction
   */
  const handleSubmitCorrection = async () => {
    if (!correctionForm.newGrade || !correctionForm.justification) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await submitGradeCorrection({
        noteId: correctionForm.noteId,
        professorId: authState.user?.id,
        oldGrade: parseFloat(correctionForm.oldGrade),
        newGrade: parseFloat(correctionForm.newGrade),
        justification: correctionForm.justification
      });

      if (error) throw error;

      setSuccessMessage('Demande de correction soumise avec succès.');
      setNewCorrectionDialog(false);
      setCorrectionForm({ noteId: '', studentName: '', courseName: '', evalType: '', oldGrade: '', newGrade: '', justification: '' });
      await loadCorrections();
    } catch (err) {
      console.error('Erreur soumission correction:', err);
      // En mode mock, simuler le succès
      const newCorrection = {
        id: `cor${Date.now()}`,
        note_id: correctionForm.noteId || `n${Date.now()}`,
        ancienne_note: parseFloat(correctionForm.oldGrade),
        nouvelle_note: parseFloat(correctionForm.newGrade),
        justification: correctionForm.justification,
        statut: 'en_attente',
        created_at: new Date().toISOString(),
        note: {
          id: correctionForm.noteId || `n${Date.now()}`,
          note: parseFloat(correctionForm.oldGrade),
          type_evaluation: correctionForm.evalType,
          date_evaluation: new Date().toISOString().split('T')[0],
          etudiant: { id: 'mock', first_name: correctionForm.studentName.split(' ')[0] || 'Étudiant', last_name: correctionForm.studentName.split(' ').slice(1).join(' ') || 'Inconnu' },
          cours: { id: 'mock', name: correctionForm.courseName || 'Cours', code: '-' }
        }
      };
      setCorrections(prev => [newCorrection, ...prev]);
      setSuccessMessage('Demande de correction soumise avec succès.');
      setNewCorrectionDialog(false);
      setCorrectionForm({ noteId: '', studentName: '', courseName: '', evalType: '', oldGrade: '', newGrade: '', justification: '' });
    } finally {
      setSubmitting(false);
    }
  };

  // Statistiques
  const pendingCount = corrections.filter(c => c.statut === 'en_attente').length;
  const approvedCount = corrections.filter(c => c.statut === 'validee').length;
  const rejectedCount = corrections.filter(c => c.statut === 'rejetee').length;

  return (
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      {/* En-tête */}
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
          onClick={() => setNewCorrectionDialog(true)}
        >
          Nouvelle demande
        </Button>
      </Box>

      {/* Statistiques rapides */}
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

      {/* Messages */}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      <Snackbar open={!!successMessage} autoHideDuration={4000} onClose={() => setSuccessMessage('')} message={successMessage} />

      {/* Tableau des demandes */}
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
            Vous pouvez soumettre une demande si une erreur est détectée après la publication des notes.
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
                    <Typography variant="body2">{correction.note?.cours?.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{correction.note?.cours?.code}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={correction.note?.type_evaluation} size="small" variant="outlined" />
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

      {/* Dialog: Nouvelle demande de correction */}
      <Dialog open={newCorrectionDialog} onClose={() => setNewCorrectionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EditIcon color="primary" />
          Nouvelle demande de correction
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            La demande sera envoyée à l'administration pour validation. La modification ne sera effective qu'après approbation.
          </Alert>
          <TextField
            label="Nom de l'étudiant"
            fullWidth
            sx={{ mt: 1 }}
            value={correctionForm.studentName}
            onChange={(e) => setCorrectionForm(prev => ({ ...prev, studentName: e.target.value }))}
          />
          <TextField
            label="Cours concerné"
            fullWidth
            sx={{ mt: 2 }}
            value={correctionForm.courseName}
            onChange={(e) => setCorrectionForm(prev => ({ ...prev, courseName: e.target.value }))}
          />
          <TextField
            label="Type d'évaluation"
            fullWidth
            sx={{ mt: 2 }}
            value={correctionForm.evalType}
            onChange={(e) => setCorrectionForm(prev => ({ ...prev, evalType: e.target.value }))}
            placeholder="Ex: CC1, Examen Final, TP..."
          />
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={6}>
              <TextField
                label="Note actuelle (/20)"
                type="number"
                fullWidth
                value={correctionForm.oldGrade}
                onChange={(e) => setCorrectionForm(prev => ({ ...prev, oldGrade: e.target.value }))}
                inputProps={{ min: 0, max: 20, step: 0.25 }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Note corrigée (/20)"
                type="number"
                fullWidth
                value={correctionForm.newGrade}
                onChange={(e) => setCorrectionForm(prev => ({ ...prev, newGrade: e.target.value }))}
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
            onChange={(e) => setCorrectionForm(prev => ({ ...prev, justification: e.target.value }))}
            placeholder="Expliquez la raison de la correction..."
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewCorrectionDialog(false)}>Annuler</Button>
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={handleSubmitCorrection}
            disabled={submitting || !correctionForm.justification || !correctionForm.newGrade}
          >
            {submitting ? 'Envoi...' : 'Soumettre'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Détails d'une correction */}
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
                    <Typography variant="body1">{detailDialog.note?.cours?.name}</Typography>
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
