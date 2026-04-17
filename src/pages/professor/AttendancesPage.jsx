import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Typography, Paper, Grid, CircularProgress, Alert, Button,
  Card, CardContent, Divider, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Select, MenuItem,
  Chip, Stack, Avatar, TextField, InputAdornment, IconButton,
  Tooltip
} from '@mui/material';
import {
  Event as EventIcon,
  CheckCircle as PresentIcon,
  Cancel as AbsentIcon,
  Schedule as LateIcon,
  Info as ExcusedIcon,
  Save as SaveIcon,
  Search as SearchIcon,
  SortByAlpha as SortByAlphaIcon,
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getScheduleSessions } from '@/api/schedule';
import { getSessionAttendances, bulkUpsertAttendances } from '@/api/attendances';
import { getStudentsByCourse } from '@/api/grades'; // Reusing this to fetch enrolled students
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import AttendanceStatsBanner from '@/components/AttendanceStatsBanner';

const STATUS_CONFIG = {
  present: { label: 'Présent', color: 'success', icon: <PresentIcon fontSize="small" /> },
  absent: { label: 'Absent', color: 'error', icon: <AbsentIcon fontSize="small" /> },
  late: { label: 'En retard', color: 'warning', icon: <LateIcon fontSize="small" /> },
  excused: { label: 'Excusé', color: 'info', icon: <ExcusedIcon fontSize="small" /> }
};

const AttendancesPage = () => {
  const { authState } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);

  // Data for the active session
  const [students, setStudents] = useState([]);
  const [attendances, setAttendances] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Search and sort
  const [searchQuery, setSearchQuery] = useState('');
  const [sortAsc, setSortAsc] = useState(true);

  const filteredStudents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = query
      ? students.filter(st =>
          st.full_name?.toLowerCase().includes(query) ||
          st.student_number?.toLowerCase().includes(query)
        )
      : [...students];

    filtered.sort((a, b) => {
      const nameA = (a.full_name || '').toLowerCase();
      const nameB = (b.full_name || '').toLowerCase();
      return sortAsc ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });

    return filtered;
  }, [students, searchQuery, sortAsc]);

  const handleStudentClick = (studentId) => {
    if (!selectedSession?.course_id) return;
    navigate(`/professor/students?course=${selectedSession.course_id}&student=${studentId}`);
  };

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch professor's sessions
      const { sessions: sessionsData, error: sessionsError } = await getScheduleSessions({
        professorId: authState.user?.id
      });
      
      if (sessionsError) throw sessionsError;

      // Filter recent or today's sessions (for simplicity here, we take all or upcoming/recent)
      // Ideally, we could filter by date. Let's just show them sorted by date desc.
      const sorted = (sessionsData || []).sort((a, b) => new Date(b.date) - new Date(a.date));
      setSessions(sorted);
    } catch (err) {
      console.error(err);
      setError('Erreur lors du chargement des sessions.');
    } finally {
      setLoading(false);
    }
  }, [authState.user?.id]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleSelectSession = async (sessionId) => {
    if (!sessionId) {
      setSelectedSession(null);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const session = sessions.find(s => String(s.id) === String(sessionId));
      setSelectedSession(session);

      // Fetch enrolled students for this course
      const { data: studentsData, error: stErr } = await getStudentsByCourse(session.course_id);
      if (stErr) throw stErr;

      // Fetch existing attendances
      const { data: attData, error: attErr } = await getSessionAttendances(session.id);
      if (attErr) throw attErr;

      const formattedStudents = (studentsData || []).map(row => row.etudiant);
      setStudents(formattedStudents);

      const attMap = {};
      // Default all to 'present' if new, otherwise load existing
      formattedStudents.forEach(st => {
        const existing = attData.find(a => String(a.student_id) === String(st.id));
        attMap[st.id] = {
          status: existing?.status || 'present',
          comment: existing?.comment || ''
        };
      });

      setAttendances(attMap);
    } catch (err) {
      console.error(err);
      setError('Impossible de charger les détails de la session.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendances(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status }
    }));
  };

  const handleCommentChange = (studentId, comment) => {
    setAttendances(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], comment }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      const payload = Object.entries(attendances).map(([studentId, data]) => ({
        session_id: selectedSession.id,
        student_id: parseInt(studentId, 10),
        status: data.status,
        comment: data.comment
      }));

      const { error: saveErr } = await bulkUpsertAttendances(payload);
      if (saveErr) throw saveErr;

      setSuccess('Appel enregistré avec succès.');
    } catch (err) {
      console.error(err);
      setError('Erreur lors de la sauvegarde de l\'appel.');
    } finally {
      setSaving(false);
    }
  };

  if (loading && sessions.length === 0) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Gestion des Présences
      </Typography>
      
      {/* Hero Banner avec statistiques de présence */}
      <AttendanceStatsBanner 
        courseId={selectedSession?.course_id} 
        courseName={selectedSession?.courses?.name}
      />
      
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>Sélectionner une session de cours</Typography>
        <Select
          fullWidth
          value={selectedSession?.id || ''}
          onChange={(e) => handleSelectSession(e.target.value)}
          displayEmpty
        >
          <MenuItem value="" disabled>-- Choisir une session --</MenuItem>
          {sessions.map(s => {
            const courseName = s.courses?.name || 'Cours';
            const dateStr = s.date ? format(new Date(s.date), 'dd/MM/yyyy HH:mm', { locale: fr }) : '';
            return (
              <MenuItem key={s.id} value={s.id}>
                {dateStr} — {courseName} ({s.room || 'Salle non assignée'})
              </MenuItem>
            );
          })}
        </Select>
      </Paper>

      {selectedSession && (
        <Card elevation={2}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Box>
                <Typography variant="h5" fontWeight="bold">{selectedSession.courses?.name}</Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  {format(new Date(selectedSession.date), 'EEEE dd MMMM yyyy - HH:mm', { locale: fr })} | Salle: {selectedSession.room || 'N/A'}
                </Typography>
              </Box>
              <Button 
                variant="contained" 
                startIcon={<SaveIcon />} 
                onClick={handleSave} 
                disabled={saving || students.length === 0}
              >
                {saving ? 'Enregistrement...' : 'Enregistrer l\'appel'}
              </Button>
            </Stack>
            
            <Divider sx={{ my: 2 }} />

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
            ) : students.length === 0 ? (
              <Alert severity="info">Aucun étudiant n'est inscrit à ce cours.</Alert>
            ) : (
              <>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                  <TextField
                    size="small"
                    placeholder="Rechercher un étudiant..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{ flex: 1, maxWidth: 400 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon color="action" fontSize="small" />
                        </InputAdornment>
                      )
                    }}
                  />
                  <Tooltip title={sortAsc ? 'Tri A → Z' : 'Tri Z → A'}>
                    <IconButton
                      onClick={() => setSortAsc(prev => !prev)}
                      color={sortAsc ? 'primary' : 'secondary'}
                      size="small"
                    >
                      <SortByAlphaIcon />
                    </IconButton>
                  </Tooltip>
                  <Typography variant="caption" color="text.secondary">
                    {filteredStudents.length} / {students.length} étudiant(s)
                  </Typography>
                </Stack>

                {filteredStudents.length === 0 ? (
                  <Alert severity="info">Aucun étudiant ne correspond à la recherche.</Alert>
                ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: 'grey.50' }}>
                    <TableRow>
                      <TableCell><strong>Étudiant</strong></TableCell>
                      <TableCell align="center"><strong>Statut</strong></TableCell>
                      <TableCell><strong>Observation</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredStudents.map(st => (
                      <TableRow key={st.id} hover>
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Avatar sx={{ width: 32, height: 32 }}>{st.full_name?.charAt(0)}</Avatar>
                            <Box
                              sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                              onClick={() => handleStudentClick(st.id)}
                            >
                              <Stack direction="row" spacing={0.5} alignItems="center">
                                <Typography variant="body2" fontWeight="bold" color="primary">
                                  {st.full_name}
                                </Typography>
                                <OpenInNewIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                              </Stack>
                              <Typography variant="caption" color="text.secondary">{st.student_number}</Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={1} justifyContent="center">
                            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                              <Chip
                                key={key}
                                label={config.label}
                                icon={config.icon}
                                size="small"
                                variant={attendances[st.id]?.status === key ? 'filled' : 'outlined'}
                                color={attendances[st.id]?.status === key ? config.color : 'default'}
                                onClick={() => handleStatusChange(st.id, key)}
                                sx={{ cursor: 'pointer' }}
                              />
                            ))}
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            placeholder="Motif (ex: maladie, transport...)"
                            variant="standard"
                            fullWidth
                            value={attendances[st.id]?.comment || ''}
                            onChange={(e) => handleCommentChange(st.id, e.target.value)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default AttendancesPage;
