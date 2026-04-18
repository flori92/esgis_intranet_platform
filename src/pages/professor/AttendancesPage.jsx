import { useState, useMemo } from 'react';
import {
  Box, Typography, Paper, Grid, CircularProgress, Alert, Button,
  Card, CardContent, Divider, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Select, MenuItem,
  Chip, Stack, Avatar, TextField, InputAdornment, IconButton,
  Tooltip
} from '@mui/material';
import {
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { getScheduleSessions } from '@/api/schedule';
import { getSessionAttendances, bulkUpsertAttendances } from '@/api/attendances';
import { getStudentsByCourse } from '@/api/grades';
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
  const queryClient = useQueryClient();
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [attendances, setAttendances] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [success, setSuccess] = useState(null);

  const profileId = authState.profile?.id;

  // 1. Fetch Sessions
  const { data: sessionsData, isLoading: loadingSessions } = useQuery({
    queryKey: ['professorSessions', profileId],
    queryFn: () => getScheduleSessions({ professorId: profileId }),
    enabled: !!profileId,
    staleTime: 1000 * 60 * 15, // Sessions don't change often
  });

  const sessions = useMemo(() => {
    return (sessionsData?.sessions || []).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [sessionsData]);

  const selectedSession = useMemo(() => 
    sessions.find(s => String(s.id) === String(selectedSessionId)), 
    [sessions, selectedSessionId]
  );

  // 2. Fetch Students and Existing Attendances when session is selected
  const { data: detailsData, isLoading: loadingDetails } = useQuery({
    queryKey: ['sessionDetails', selectedSessionId],
    queryFn: async () => {
      const session = sessions.find(s => String(s.id) === String(selectedSessionId));
      const [studentsRes, attendancesRes] = await Promise.all([
        getStudentsByCourse(session.course_id),
        getSessionAttendances(session.id)
      ]);
      
      const students = (studentsRes.data || []).map(row => row.etudiant);
      const attData = attendancesRes.data || [];
      
      const initialAttendances = {};
      students.forEach(st => {
        const existing = attData.find(a => String(a.student_id) === String(st.id));
        initialAttendances[st.id] = {
          status: existing?.status || 'present',
          comment: existing?.comment || ''
        };
      });

      // Update local state for editing
      setAttendances(initialAttendances);
      return { students };
    },
    enabled: !!selectedSessionId && sessions.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  const students = detailsData?.students || [];

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

  // 3. Save Mutation
  const saveMutation = useMutation({
    mutationFn: (payload) => bulkUpsertAttendances(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessionDetails', selectedSessionId] });
      queryClient.invalidateQueries({ queryKey: ['courseAttendanceStats'] });
      queryClient.invalidateQueries({ queryKey: ['allCoursesAttendanceStats'] });
      setSuccess('Appel enregistré avec succès.');
    }
  });

  const handleSave = () => {
    const payload = Object.entries(attendances).map(([studentId, data]) => ({
      session_id: Number(selectedSessionId),
      student_id: parseInt(studentId, 10),
      status: data.status,
      comment: data.comment
    }));
    saveMutation.mutate(payload);
  };

  const handleStatusChange = (studentId, status) => {
    setAttendances(prev => ({ ...prev, [studentId]: { ...prev[studentId], status } }));
  };

  const handleCommentChange = (studentId, comment) => {
    setAttendances(prev => ({ ...prev, [studentId]: { ...prev[studentId], comment } }));
  };

  if (loadingSessions && sessions.length === 0) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>Gestion des Présences</Typography>
      
      <AttendanceStatsBanner 
        courseId={selectedSession?.course_id} 
        courseName={selectedSession?.courses?.name}
      />
      
      {saveMutation.isError && <Alert severity="error" sx={{ mb: 3 }}>Erreur lors de la sauvegarde</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>Sélectionner une session de cours</Typography>
        <Select
          fullWidth
          value={selectedSessionId}
          onChange={(e) => setSelectedSessionId(e.target.value)}
          displayEmpty
        >
          <MenuItem value="" disabled>-- Choisir une session --</MenuItem>
          {sessions.map(s => {
            const dateStr = s.date ? format(new Date(s.date), 'dd/MM/yyyy HH:mm', { locale: fr }) : '';
            return (
              <MenuItem key={s.id} value={String(s.id)}>
                {dateStr} — {s.courses?.name} ({s.room || 'N/A'})
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
                disabled={saveMutation.isPending || students.length === 0}
              >
                {saveMutation.isPending ? 'Enregistrement...' : 'Enregistrer l\'appel'}
              </Button>
            </Stack>
            
            <Divider sx={{ my: 2 }} />

            {loadingDetails ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
            ) : students.length === 0 ? (
              <Alert severity="info">Aucun étudiant n'est inscrit à ce cours.</Alert>
            ) : (
              <>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                  <TextField
                    size="small" placeholder="Rechercher un étudiant..."
                    value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{ flex: 1, maxWidth: 400 }}
                    InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon color="action" fontSize="small" /></InputAdornment>) }}
                  />
                  <Tooltip title={sortAsc ? 'Tri A → Z' : 'Tri Z → A'}>
                    <IconButton onClick={() => setSortAsc(prev => !prev)} color="primary" size="small"><SortByAlphaIcon /></IconButton>
                  </Tooltip>
                </Stack>

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
                              <Box>
                                <Typography variant="body2" fontWeight="bold" color="primary">{st.full_name}</Typography>
                                <Typography variant="caption" color="text.secondary">{st.student_number}</Typography>
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell align="center">
                            <Stack direction="row" spacing={1} justifyContent="center">
                              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                <Chip
                                  key={key} label={config.label} icon={config.icon} size="small"
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
                              size="small" placeholder="..." variant="standard" fullWidth
                              value={attendances[st.id]?.comment || ''}
                              onChange={(e) => handleCommentChange(st.id, e.target.value)}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default AttendancesPage;
