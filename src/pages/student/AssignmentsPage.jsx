import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  CloudDownload as CloudDownloadIcon,
  Description as DescriptionIcon,
  DoneAll as DoneAllIcon,
  Grade as GradeIcon,
  Schedule as ScheduleIcon,
  Send as SendIcon,
  UploadFile as UploadFileIcon
} from '@mui/icons-material';

import { useAuth } from '@/context/AuthContext';
import {
  getAssignmentAttachmentUrl,
  getStudentAssignments,
  submitAssignment
} from '@/api/assignments';

const NAVY = '#003366';

const formatDateTime = (value) => {
  if (!value) {
    return 'Non defini';
  }

  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const formatPoints = (value) => {
  const numeric = Number(value || 0);
  return Number.isInteger(numeric) ? `${numeric}` : numeric.toFixed(2);
};

const formatFileSize = (value) => {
  const bytes = Number(value || 0);
  if (!bytes) {
    return '0 o';
  }

  if (bytes < 1024) {
    return `${bytes} o`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} Ko`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
};

const getSubmissionModeLabel = (mode) => {
  switch (mode) {
    case 'text':
      return 'Texte';
    case 'file':
      return 'Fichier';
    default:
      return 'Texte / fichier';
  }
};

const canStillSubmit = (assignment) => {
  if (!assignment) {
    return false;
  }

  if (assignment.status === 'draft' || assignment.status === 'closed' || assignment.status === 'archived') {
    return false;
  }

  if (!assignment.due_at) {
    return true;
  }

  const now = Date.now();
  const dueAt = new Date(assignment.due_at).getTime();

  if (!Number.isFinite(dueAt) || now <= dueAt) {
    return true;
  }

  if (!assignment.allow_late_submission) {
    return false;
  }

  if (!assignment.late_until) {
    return true;
  }

  const lateUntil = new Date(assignment.late_until).getTime();
  return Number.isFinite(lateUntil) && now <= lateUntil;
};

const getSubmissionValidationError = ({ assignment, submissionText, selectedFile }) => {
  const trimmedText = String(submissionText || '').trim();
  const hasExistingText = Boolean(String(assignment?.submission?.submission_text || '').trim());
  const hasExistingFile = Boolean(assignment?.submission?.attachment_path);
  const hasFile = Boolean(selectedFile);

  if (assignment?.submission_mode === 'text' && !trimmedText) {
    return 'Une reponse texte est requise.';
  }

  if (assignment?.submission_mode === 'file' && !hasFile && !hasExistingFile) {
    return 'Ajoutez un fichier avant envoi.';
  }

  if (assignment?.submission_mode === 'text_file' && !trimmedText && !hasFile && !hasExistingText && !hasExistingFile) {
    return 'Ajoutez un texte, un fichier, ou les deux.';
  }

  return null;
};

const SummaryCard = ({ icon, title, value, subtitle, accent }) => (
  <Paper
    elevation={0}
    sx={{
      p: 3,
      borderRadius: 2,
      border: '1px solid #E5E7EB',
      borderTop: `4px solid ${accent}`,
      height: '100%'
    }}
  >
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: `${accent}14`,
          color: accent
        }}
      >
        {icon}
      </Box>
      <Typography variant="body2" color="text.secondary" fontWeight={700}>
        {title}
      </Typography>
    </Stack>

    <Typography variant="h4" fontWeight={900} sx={{ color: NAVY, mb: 0.5 }}>
      {value}
    </Typography>
    <Typography variant="body2" color="text.secondary">
      {subtitle}
    </Typography>
  </Paper>
);

const StudentAssignmentsPage = () => {
  const { authState } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [detailsDialog, setDetailsDialog] = useState({
    open: false,
    assignment: null
  });
  const [submissionText, setSubmissionText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const loadAssignments = async (selectedAssignmentId = null) => {
    if (!authState.profile?.id || !authState.student?.id) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: assignmentsError } = await getStudentAssignments({
        studentProfileId: authState.profile.id,
        studentId: authState.student.id
      });

      if (assignmentsError) {
        throw assignmentsError;
      }

      const loadedAssignments = data || [];
      setAssignments(loadedAssignments);

      if (selectedAssignmentId) {
        const refreshedAssignment = loadedAssignments.find(
          (assignment) => assignment.id === selectedAssignmentId
        );

        setDetailsDialog((prev) => ({
          open: Boolean(refreshedAssignment),
          assignment: refreshedAssignment || null
        }));

        setSubmissionText(refreshedAssignment?.submission?.submission_text || '');
        setSelectedFile(null);
      }
    } catch (loadError) {
      console.error('Erreur chargement devoirs etudiant:', loadError);
      setError(loadError.message || 'Impossible de charger vos devoirs.');
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, [authState.profile?.id, authState.student?.id]);

  const summary = useMemo(() => {
    const dueSoon = assignments.filter((assignment) => {
      if (!assignment?.due_at || assignment?.submission?.submitted_at) {
        return false;
      }

      const dueAt = new Date(assignment.due_at).getTime();
      if (!Number.isFinite(dueAt) || dueAt < Date.now()) {
        return false;
      }

      return dueAt - Date.now() <= 72 * 60 * 60 * 1000;
    }).length;

    const submitted = assignments.filter((assignment) => assignment?.submission?.submitted_at).length;
    const graded = assignments.filter(
      (assignment) => assignment?.submission?.grade !== null && assignment?.submission?.grade !== undefined
    ).length;

    return {
      total: assignments.length,
      dueSoon,
      submitted,
      graded
    };
  }, [assignments]);

  const selectedAssignment = detailsDialog.assignment;
  const submissionWindowOpen = canStillSubmit(selectedAssignment);
  const validationError = selectedAssignment
    ? getSubmissionValidationError({
        assignment: selectedAssignment,
        submissionText,
        selectedFile
      })
    : null;

  const handleOpenDetails = (assignment) => {
    setDetailsDialog({
      open: true,
      assignment
    });
    setSubmissionText(assignment?.submission?.submission_text || '');
    setSelectedFile(null);
  };

  const handleCloseDetails = () => {
    setDetailsDialog({
      open: false,
      assignment: null
    });
    setSubmissionText('');
    setSelectedFile(null);
  };

  const handleDownloadAttachment = async (filePath) => {
    try {
      const { signedUrl, error: signedUrlError } = await getAssignmentAttachmentUrl(filePath);
      if (signedUrlError) {
        throw signedUrlError;
      }

      window.open(signedUrl, '_blank', 'noopener,noreferrer');
    } catch (downloadError) {
      console.error('Erreur telechargement piece jointe:', downloadError);
      setError(downloadError.message || 'Impossible de telecharger ce fichier.');
    }
  };

  const handleSubmitAssignment = async () => {
    if (!selectedAssignment) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { error: submitError } = await submitAssignment({
        assignmentId: selectedAssignment.id,
        studentProfileId: authState.profile.id,
        studentId: authState.student.id,
        submissionText,
        file: selectedFile
      });

      if (submitError) {
        throw submitError;
      }

      setSnackbarMessage(selectedAssignment.submission ? 'Remise mise a jour.' : 'Devoir envoye.');
      await loadAssignments(selectedAssignment.id);
    } catch (submitError) {
      console.error('Erreur remise devoir:', submitError);
      setError(submitError.message || 'Impossible d envoyer votre devoir.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      <Stack spacing={1} sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={900} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AssignmentIcon sx={{ color: NAVY, fontSize: 38 }} />
          Devoirs & Remises
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Retrouvez vos consignes, deposez vos travaux et suivez vos retours enseignants au meme endroit.
        </Typography>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <SummaryCard
            icon={<AssignmentIcon />}
            title="Devoirs visibles"
            value={summary.total}
            subtitle="Travaux publies et accessibles"
            accent={NAVY}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <SummaryCard
            icon={<ScheduleIcon />}
            title="A traiter vite"
            value={summary.dueSoon}
            subtitle="A rendre sous 72 heures"
            accent="#ED6C02"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <SummaryCard
            icon={<DoneAllIcon />}
            title="Remis"
            value={summary.submitted}
            subtitle="Travaux deja envoyes"
            accent="#2E7D32"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <SummaryCard
            icon={<GradeIcon />}
            title="Corriges"
            value={summary.graded}
            subtitle="Avec note ou retour enseignant"
            accent="#7B1FA2"
          />
        </Grid>
      </Grid>

      {!assignments.length ? (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 2,
            border: '1px dashed #CBD5E1',
            textAlign: 'center'
          }}
        >
          <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
            Aucun devoir disponible
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Les nouveaux travaux publies dans vos cours apparaitront ici.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {assignments.map((assignment) => (
            <Grid item xs={12} md={6} xl={4} key={assignment.id}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  borderRadius: 2,
                  border: '1px solid #E5E7EB'
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Stack spacing={2.25}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                      <Box>
                        <Typography variant="overline" color="text.secondary" sx={{ display: 'block' }}>
                          {assignment.course?.code || 'Cours'}
                        </Typography>
                        <Typography variant="h6" fontWeight={800}>
                          {assignment.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {assignment.course?.name || 'Cours non defini'}
                        </Typography>
                      </Box>
                      <Chip
                        size="small"
                        label={assignment.display_status?.label || 'A rendre'}
                        color={assignment.display_status?.color || 'default'}
                      />
                    </Stack>

                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      <Chip size="small" variant="outlined" label={getSubmissionModeLabel(assignment.submission_mode)} />
                      <Chip
                        size="small"
                        variant="outlined"
                        label={`${formatPoints(assignment.max_points)} pts`}
                      />
                    </Stack>

                    <Typography variant="body2" color="text.secondary">
                      {assignment.description || assignment.instructions || 'Consignes a consulter dans le detail du devoir.'}
                    </Typography>

                    <Divider />

                    <Stack spacing={1}>
                      <Typography variant="body2" color="text.secondary">
                        Disponible: <strong>{formatDateTime(assignment.available_from)}</strong>
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Date limite: <strong>{formatDateTime(assignment.due_at)}</strong>
                      </Typography>
                      {assignment.allow_late_submission && assignment.late_until && (
                        <Typography variant="body2" color="text.secondary">
                          Tolere jusqu au: <strong>{formatDateTime(assignment.late_until)}</strong>
                        </Typography>
                      )}
                      {assignment.submission?.submitted_at && (
                        <Typography variant="body2" color="text.secondary">
                          Derniere remise: <strong>{formatDateTime(assignment.submission.submitted_at)}</strong>
                        </Typography>
                      )}
                      {assignment.submission?.grade !== null && assignment.submission?.grade !== undefined && (
                        <Typography variant="body2" sx={{ color: NAVY, fontWeight: 700 }}>
                          Note: {formatPoints(assignment.submission.grade)} / {formatPoints(assignment.max_points)}
                        </Typography>
                      )}
                    </Stack>

                    <Box sx={{ pt: 1 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={() => handleOpenDetails(assignment)}
                        sx={{ borderRadius: 2 }}
                      >
                        Ouvrir le devoir
                      </Button>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={detailsDialog.open} onClose={handleCloseDetails} fullWidth maxWidth="md">
        <DialogTitle sx={{ pb: 1 }}>
          <Stack spacing={0.5}>
            <Typography variant="h6" fontWeight={800}>
              {selectedAssignment?.title || 'Devoir'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedAssignment?.course?.code || ''} {selectedAssignment?.course?.name ? `- ${selectedAssignment.course.name}` : ''}
            </Typography>
          </Stack>
        </DialogTitle>

        <DialogContent dividers>
          {selectedAssignment && (
            <Stack spacing={3}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip
                  size="small"
                  label={selectedAssignment.display_status?.label || 'A rendre'}
                  color={selectedAssignment.display_status?.color || 'default'}
                />
                <Chip size="small" variant="outlined" label={getSubmissionModeLabel(selectedAssignment.submission_mode)} />
                <Chip
                  size="small"
                  variant="outlined"
                  label={`${formatPoints(selectedAssignment.max_points)} points`}
                />
              </Stack>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #E5E7EB', height: '100%' }}>
                    <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>
                      Description
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedAssignment.description || 'Aucune description complementaire.'}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #E5E7EB', height: '100%' }}>
                    <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>
                      Calendrier
                    </Typography>
                    <Stack spacing={0.75}>
                      <Typography variant="body2" color="text.secondary">
                        Disponible: <strong>{formatDateTime(selectedAssignment.available_from)}</strong>
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Limite: <strong>{formatDateTime(selectedAssignment.due_at)}</strong>
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Remise tardive: <strong>{selectedAssignment.allow_late_submission ? 'Oui' : 'Non'}</strong>
                      </Typography>
                      {selectedAssignment.allow_late_submission && selectedAssignment.late_until && (
                        <Typography variant="body2" color="text.secondary">
                          Dernier delai: <strong>{formatDateTime(selectedAssignment.late_until)}</strong>
                        </Typography>
                      )}
                    </Stack>
                  </Paper>
                </Grid>
              </Grid>

              <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #E5E7EB' }}>
                <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>
                  Consignes
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                  {selectedAssignment.instructions || 'Aucune consigne detaillee fournie.'}
                </Typography>
              </Paper>

              {selectedAssignment.rubric?.criteria?.length > 0 && (
                <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #E5E7EB' }}>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.5 }}>
                    Bareme d evaluation
                  </Typography>
                  <Stack spacing={1.25}>
                    {selectedAssignment.rubric.criteria.map((criterion) => (
                      <Box
                        key={criterion.id}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          backgroundColor: '#F8FAFC',
                          border: '1px solid #E5E7EB'
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" spacing={2}>
                          <Typography variant="body2" fontWeight={700}>
                            {criterion.title}
                          </Typography>
                          <Typography variant="body2" sx={{ color: NAVY, fontWeight: 700 }}>
                            {formatPoints(criterion.max_points)} pts
                          </Typography>
                        </Stack>
                        {criterion.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {criterion.description}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Stack>
                </Paper>
              )}

              <Divider />

              <Stack spacing={2}>
                <Typography variant="h6" fontWeight={800}>
                  Votre remise
                </Typography>

                {selectedAssignment.submission?.submitted_at && (
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    Derniere version envoyee le {formatDateTime(selectedAssignment.submission.submitted_at)}.
                  </Alert>
                )}

                {selectedAssignment.submission?.feedback && (
                  <Alert severity="success" sx={{ borderRadius: 2 }}>
                    <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>
                      Feedback enseignant
                    </Typography>
                    <Typography variant="body2">{selectedAssignment.submission.feedback}</Typography>
                  </Alert>
                )}

                {selectedAssignment.submission?.grade !== null &&
                  selectedAssignment.submission?.grade !== undefined && (
                    <Alert severity="success" sx={{ borderRadius: 2 }}>
                      Note obtenue: {formatPoints(selectedAssignment.submission.grade)} / {formatPoints(selectedAssignment.max_points)}
                    </Alert>
                  )}

                {!submissionWindowOpen && (
                  <Alert severity="warning" sx={{ borderRadius: 2 }}>
                    La fenetre de remise est fermee pour ce devoir.
                  </Alert>
                )}

                <TextField
                  label="Votre reponse"
                  value={submissionText}
                  onChange={(event) => setSubmissionText(event.target.value)}
                  multiline
                  minRows={6}
                  fullWidth
                  disabled={!submissionWindowOpen || selectedAssignment.submission_mode === 'file'}
                  helperText={
                    selectedAssignment.submission_mode === 'file'
                      ? 'Ce devoir attend une piece jointe.'
                      : 'Saisissez votre reponse ou votre commentaire de remise.'
                  }
                />

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<UploadFileIcon />}
                    disabled={!submissionWindowOpen || selectedAssignment.submission_mode === 'text'}
                    sx={{ borderRadius: 2, width: { xs: '100%', sm: 'auto' } }}
                  >
                    Choisir un fichier
                    <input
                      hidden
                      type="file"
                      onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                    />
                  </Button>

                  {selectedFile && (
                    <Chip
                      icon={<DescriptionIcon />}
                      label={`${selectedFile.name} (${formatFileSize(selectedFile.size)})`}
                      onDelete={() => setSelectedFile(null)}
                      sx={{ maxWidth: '100%' }}
                    />
                  )}
                </Stack>

                {selectedAssignment.submission?.attachment_path && (
                  <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #E5E7EB' }}>
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={1.5}
                      justifyContent="space-between"
                      alignItems={{ xs: 'flex-start', sm: 'center' }}
                    >
                      <Box>
                        <Typography variant="subtitle2" fontWeight={800}>
                          Piece jointe actuelle
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {selectedAssignment.submission.attachment_name || 'Fichier joint'}
                          {selectedAssignment.submission.attachment_size
                            ? ` (${formatFileSize(selectedAssignment.submission.attachment_size)})`
                            : ''}
                        </Typography>
                      </Box>
                      <Button
                        variant="text"
                        startIcon={<CloudDownloadIcon />}
                        onClick={() => handleDownloadAttachment(selectedAssignment.submission.attachment_path)}
                      >
                        Telecharger
                      </Button>
                    </Stack>
                  </Paper>
                )}
              </Stack>
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseDetails}>Fermer</Button>
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={handleSubmitAssignment}
            disabled={!selectedAssignment || !submissionWindowOpen || Boolean(validationError) || saving}
          >
            {saving
              ? 'Envoi...'
              : selectedAssignment?.submission
                ? 'Mettre a jour la remise'
                : 'Envoyer le devoir'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(snackbarMessage)}
        autoHideDuration={3500}
        onClose={() => setSnackbarMessage('')}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default StudentAssignmentsPage;
