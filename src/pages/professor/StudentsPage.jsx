import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import {
  Campaign as CampaignIcon,
  MailOutline as MailOutlineIcon,
  WarningAmber as WarningAmberIcon
} from '@mui/icons-material';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getProfessorManagedCourses } from '@/api/courses';
import { sendMessage } from '@/api/messages';
import { getProfessorCourseStudentsOverview } from '@/api/professorStudents';

const defaultMessageDraft = {
  mode: 'single',
  subject: '',
  content: ''
};

const formatDate = (value) => {
  if (!value) {
    return 'N/A';
  }

  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(value));
  } catch (_error) {
    return value;
  }
};

const ProfessorStudentsPage = () => {
  const { authState } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [overview, setOverview] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [messageTarget, setMessageTarget] = useState(null);
  const [messageDraft, setMessageDraft] = useState(defaultMessageDraft);
  const [submittingMessage, setSubmittingMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    let active = true;

    const loadCourses = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: coursesError } = await getProfessorManagedCourses(authState.profile?.id);

        if (coursesError) {
          throw coursesError;
        }

        if (!active) {
          return;
        }

        const nextCourses = data || [];
        setCourses(nextCourses);

        const requestedCourseId = Number(searchParams.get('course'));
        const initialCourse =
          nextCourses.find((course) => course.id === requestedCourseId) ||
          nextCourses[0] ||
          null;

        setSelectedCourseId(initialCourse?.id ? String(initialCourse.id) : '');
      } catch (loadError) {
        console.error('Erreur chargement suivi etudiants:', loadError);
        if (active) {
          setCourses([]);
          setError(loadError.message || 'Impossible de charger les cours assignes.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    if (authState.profile?.id) {
      loadCourses();
    }

    return () => {
      active = false;
    };
  }, [authState.profile?.id, searchParams]);

  useEffect(() => {
    let active = true;

    const loadOverview = async () => {
      if (!selectedCourseId || !authState.profile?.id) {
        setOverview(null);
        setSelectedStudentId(null);
        return;
      }

      setOverviewLoading(true);

      try {
        const { data, error: overviewError } = await getProfessorCourseStudentsOverview({
          profileId: authState.profile.id,
          courseId: Number(selectedCourseId)
        });

        if (overviewError) {
          throw overviewError;
        }

        if (!active) {
          return;
        }

        setOverview(data);

        const requestedStudentId = Number(searchParams.get('student'));
        const matchedStudent = requestedStudentId
          ? (data?.students || []).find((s) => s.id === requestedStudentId)
          : null;
        setSelectedStudentId(matchedStudent?.id || data?.students?.[0]?.id || null);
      } catch (overviewError) {
        console.error('Erreur chargement vue etudiants:', overviewError);
        if (active) {
          setOverview(null);
          setSelectedStudentId(null);
          setError(overviewError.message || 'Impossible de charger le suivi des etudiants.');
        }
      } finally {
        if (active) {
          setOverviewLoading(false);
        }
      }
    };

    loadOverview();

    return () => {
      active = false;
    };
  }, [selectedCourseId, authState.profile?.id]);

  const filteredStudents = useMemo(() => {
    const students = overview?.students || [];
    const query = search.trim().toLowerCase();

    if (!query) {
      return students;
    }

    return students.filter((student) => {
      return (
        student.full_name.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query) ||
        student.student_number.toLowerCase().includes(query)
      );
    });
  }, [overview?.students, search]);

  const selectedStudent = useMemo(
    () => filteredStudents.find((student) => student.id === selectedStudentId) ||
      overview?.students?.find((student) => student.id === selectedStudentId) ||
      null,
    [filteredStudents, overview?.students, selectedStudentId]
  );

  const syncCourseQueryParam = (courseId) => {
    const nextParams = new URLSearchParams(searchParams);

    if (courseId) {
      nextParams.set('course', String(courseId));
    } else {
      nextParams.delete('course');
    }

    setSearchParams(nextParams, { replace: true });
  };

  const openStudentMessage = (student) => {
    setMessageTarget(student);
    setMessageDraft({
      mode: 'single',
      subject: `Suivi pedagogique - ${overview?.course?.name || ''}`.trim(),
      content: ''
    });
    setMessageDialogOpen(true);
  };

  const openCourseAnnouncement = () => {
    setMessageTarget(null);
    setMessageDraft({
      mode: 'course',
      subject: `Annonce - ${overview?.course?.name || ''}`.trim(),
      content: ''
    });
    setMessageDialogOpen(true);
  };

  const handleSendMessage = async () => {
    const senderId = authState.profile?.id;

    if (!senderId) {
      setError('Profil professeur introuvable');
      return;
    }

    if (!messageDraft.subject.trim() || !messageDraft.content.trim()) {
      setError('Objet et contenu sont obligatoires');
      return;
    }

    const recipients =
      messageDraft.mode === 'course'
        ? (overview?.students || []).map((student) => student.profile_id).filter(Boolean)
        : [messageTarget?.profile_id].filter(Boolean);

    if (!recipients.length) {
      setError('Aucun destinataire disponible');
      return;
    }

    setSubmittingMessage(true);

    try {
      const results = await Promise.all(
        recipients.map((recipientId) =>
          sendMessage({
            sender_id: senderId,
            recipient_id: recipientId,
            subject: messageDraft.subject.trim(),
            content: messageDraft.content.trim()
          })
        )
      );

      const failed = results.find((result) => result.error);

      if (failed?.error) {
        throw failed.error;
      }

      setMessageDialogOpen(false);
      setMessageDraft(defaultMessageDraft);
      setMessageTarget(null);
      setSuccessMessage(
        messageDraft.mode === 'course'
          ? 'Annonce envoyee a la promotion du cours.'
          : "Message envoye a l'etudiant."
      );
    } catch (sendError) {
      console.error('Erreur envoi message professeur:', sendError);
      setError(sendError.message || "Impossible d'envoyer le message.");
    } finally {
      setSubmittingMessage(false);
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
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
        Mes promotions & suivi etudiant
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Suivez les etudiants par cours, identifiez les profils en difficulte et communiquez directement avec eux.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {courses.length === 0 ? (
        <Alert severity="info">Aucun cours ne vous est actuellement assigne.</Alert>
      ) : (
        <>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="course-select-label">Cours</InputLabel>
                <Select
                  labelId="course-select-label"
                  value={selectedCourseId}
                  label="Cours"
                  onChange={(event) => {
                    setSelectedCourseId(event.target.value);
                    syncCourseQueryParam(event.target.value);
                  }}
                >
                  {courses.map((course) => (
                    <MenuItem key={course.id} value={String(course.id)}>
                      {course.name} ({course.code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: { md: 'flex-end', xs: 'flex-start' } }}>
              <Button
                variant="contained"
                startIcon={<CampaignIcon />}
                onClick={openCourseAnnouncement}
                disabled={!overview?.students?.length}
              >
                Annoncer a ce cours
              </Button>
            </Grid>
          </Grid>

          {overviewLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : !overview ? (
            <Alert severity="info">Selectionnez un cours pour voir les etudiants inscrits.</Alert>
          ) : (
            <>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6} md={3}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Etudiants inscrits
                    </Typography>
                    <Typography variant="h6">{overview.stats.totalStudents}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Moyenne du cours
                    </Typography>
                    <Typography variant="h6">
                      {overview.stats.classAverage !== null ? `${overview.stats.classAverage}/20` : 'N/A'}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Etudiants en difficulte
                    </Typography>
                    <Typography variant="h6">{overview.stats.studentsAtRisk}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Notes publiees
                    </Typography>
                    <Typography variant="h6">{overview.stats.publishedGradesCount}</Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={12} lg={7}>
                  <Card elevation={2}>
                    <CardHeader
                      title="Liste des etudiants"
                      subheader={overview.course ? `${overview.course.name} (${overview.course.code})` : ''}
                    />
                    <Divider />
                    <CardContent>
                      <TextField
                        fullWidth
                        size="small"
                        label="Rechercher un etudiant"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        sx={{ mb: 2 }}
                      />

                      {filteredStudents.length === 0 ? (
                        <Alert severity="info">Aucun etudiant ne correspond a la recherche.</Alert>
                      ) : (
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Etudiant</TableCell>
                              <TableCell>Moyenne</TableCell>
                              <TableCell>Derniere note</TableCell>
                              <TableCell align="right">Action</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {filteredStudents.map((student) => (
                              <TableRow
                                key={student.id}
                                hover
                                selected={student.id === selectedStudentId}
                                sx={{ cursor: 'pointer' }}
                                onClick={() => setSelectedStudentId(student.id)}
                              >
                                <TableCell>
                                  <Typography variant="body2" fontWeight="bold">
                                    {student.full_name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {student.student_number} - {student.level}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  {student.average !== null ? `${student.average}/20` : 'N/A'}
                                  {student.alert && (
                                    <Chip
                                      icon={<WarningAmberIcon />}
                                      size="small"
                                      color="warning"
                                      label="Alerte"
                                      sx={{ ml: 1 }}
                                    />
                                  )}
                                </TableCell>
                                <TableCell>
                                  {student.latestGrade.value !== undefined && student.latestGrade.value !== null ? (
                                    <>
                                      <Typography variant="body2">
                                        {student.latestGrade.value}/{student.latestGrade.maxValue}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {student.latestGrade.evaluationType} - {formatDate(student.latestGrade.date)}
                                      </Typography>
                                    </>
                                  ) : (
                                    'Aucune'
                                  )}
                                </TableCell>
                                <TableCell align="right">
                                  <Button
                                    size="small"
                                    startIcon={<MailOutlineIcon />}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      openStudentMessage(student);
                                    }}
                                  >
                                    Ecrire
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} lg={5}>
                  <Card elevation={2}>
                    <CardHeader title="Fiche etudiant dans la matiere" />
                    <Divider />
                    <CardContent>
                      {!selectedStudent ? (
                        <Alert severity="info">Selectionnez un etudiant dans la liste.</Alert>
                      ) : (
                        <>
                          <Typography variant="h6" fontWeight="bold">
                            {selectedStudent.full_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {selectedStudent.student_number} - {selectedStudent.level}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {selectedStudent.email}
                          </Typography>

                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                            <Chip
                              label={
                                selectedStudent.average !== null
                                  ? `Moyenne: ${selectedStudent.average}/20`
                                  : 'Moyenne: N/A'
                              }
                              color={selectedStudent.alert ? 'warning' : 'primary'}
                            />
                            <Chip label={`${selectedStudent.gradesCount} note(s)`} variant="outlined" />
                            {selectedStudent.academic_year && (
                              <Chip label={selectedStudent.academic_year} variant="outlined" />
                            )}
                          </Box>

                          <Button
                            variant="outlined"
                            startIcon={<MailOutlineIcon />}
                            onClick={() => openStudentMessage(selectedStudent)}
                            sx={{ mb: 2 }}
                          >
                            Envoyer un message
                          </Button>

                          <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            Historique des notes dans ce cours
                          </Typography>

                          {selectedStudent.grades.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">
                              Aucune note enregistree pour le moment.
                            </Typography>
                          ) : (
                            selectedStudent.grades.map((grade) => (
                              <Paper key={grade.id} variant="outlined" sx={{ p: 1.5, mb: 1 }}>
                                <Typography variant="body2" fontWeight="bold">
                                  {grade.type_evaluation}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {grade.note}/{grade.max_value} - Coef. {grade.coefficient}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {formatDate(grade.date_evaluation || grade.created_at)}
                                </Typography>
                              </Paper>
                            ))
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </>
          )}
        </>
      )}

      <Dialog open={messageDialogOpen} onClose={() => setMessageDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>
          {messageDraft.mode === 'course'
            ? 'Annonce au cours'
            : `Message a ${messageTarget?.full_name || "l'etudiant"}`}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, pt: 1 }}>
            <TextField
              label="Objet"
              value={messageDraft.subject}
              onChange={(event) => setMessageDraft((prev) => ({ ...prev, subject: event.target.value }))}
              fullWidth
            />
            <TextField
              label="Message"
              value={messageDraft.content}
              onChange={(event) => setMessageDraft((prev) => ({ ...prev, content: event.target.value }))}
              fullWidth
              multiline
              minRows={5}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMessageDialogOpen(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleSendMessage} disabled={submittingMessage}>
            Envoyer
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage('')}
        message={successMessage}
      />
    </Box>
  );
};

export default ProfessorStudentsPage;
