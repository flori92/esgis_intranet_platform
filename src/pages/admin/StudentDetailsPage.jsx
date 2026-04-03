import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Edit as EditIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Print as PrintIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '@/supabase';

/**
 * Page Admin pour voir le dossier complet d'un étudiant
 * Infos personnelles, notes, absences, demandes de correction, alertes
 */
const StudentDetailsPage = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { authState } = useAuth();

  const [student, setStudent] = useState(null);
  const [profile, setProfile] = useState(null);
  const [grades, setGrades] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [corrections, setCorrections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState({
    level: 1,
    status: 'actif',
    department_id: null,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authState?.user?.id && studentId) {
      loadStudentData();
    }
  }, [studentId, authState?.user?.id]);

  const loadStudentData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Charger les infos estudiants
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();

      if (studentError) throw studentError;
      setStudent(studentData);
      setEditData(studentData);

      // Charger le profil
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', studentData.profile_id)
        .single();

      setProfile(profileData);

      // Charger les notes
      const { data: gradesData } = await supabase
        .from('grades')
        .select(`
          *,
          course:courses(name, code, credits, semester)
        `)
        .eq('student_id', studentId)
        .order('courses.semester');

      setGrades(gradesData || []);

      // Charger l'assiduité
      const { data: attendanceData } = await supabase
        .from('grades')
        .select('attendance')
        .eq('student_id', studentId)
        .not('attendance', 'is', null);

      setAttendance(attendanceData || []);

      // Charger les demandes de correction
      const { data: correctionsData } = await supabase
        .from('demandes_correction_notes')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      setCorrections(correctionsData || []);
    } catch (err) {
      console.error('Erreur chargement dossier étudiant:', err);
      setError('Impossible de charger le dossier de l\'étudiant');
    } finally {
      setLoading(false);
    }
  };

  const handleEditOpen = () => {
    setEditData(student);
    setEditOpen(true);
  };

  const handleEditClose = () => {
    setEditOpen(false);
  };

  const handleEditSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('students')
        .update({
          level: editData.level,
          status: editData.status,
          department_id: editData.department_id,
        })
        .eq('id', studentId);

      if (updateError) throw updateError;

      setStudent(editData);
      setEditOpen(false);
      alert('Étudiant mis à jour avec succès');
    } catch (err) {
      console.error('Erreur mise à jour étudiant:', err);
      setError('Impossible de mettre à jour l\'étudiant');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet étudiant ?')) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Supprimer l'étudiant (cascade delete géré by database)
      const { error: deleteError } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId);

      if (deleteError) throw deleteError;

      alert('Étudiant supprimé avec succès');
      navigate('/admin/students');
    } catch (err) {
      console.error('Erreur suppression étudiant:', err);
      setError('Impossible de supprimer l\'étudiant');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!student) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Étudiant non trouvé</Alert>
        <Button onClick={() => navigate('/admin/students')} sx={{ mt: 2 }}>
          Retour à la liste
        </Button>
      </Box>
    );
  }

  const totalCredits = grades.reduce((acc, g) => acc + (g.course?.credits || 0), 0);
  const earnedCredits = grades
    .filter(g => g.score >= 10)
    .reduce((acc, g) => acc + (g.course?.credits || 0), 0);
  const averageGrade =
    grades.length > 0 ? (grades.reduce((acc, g) => acc + g.score, 0) / grades.length).toFixed(2) : 0;
  const totalAbsences = attendance.reduce(
    (acc, a) => acc + (a.attendance?.absences || 0),
    0,
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Dossier Étudiant</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button startIcon={<PrintIcon />} onClick={handlePrint} variant="outlined">
            Imprimer
          </Button>
          <Button startIcon={<EditIcon />} onClick={handleEditOpen} variant="outlined">
            Modifier
          </Button>
          <Button startIcon={<DeleteIcon />} onClick={handleDeleteStudent} variant="outlined" color="error">
            Supprimer
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Section Infos Personnelles */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Informations Personnelles
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="textSecondary">
              Nom Complet
            </Typography>
            <Typography variant="body1">{profile?.full_name}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="textSecondary">
              N° Étudiant
            </Typography>
            <Typography variant="body1">{student?.student_id}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="textSecondary">
              Email
            </Typography>
            <Typography variant="body1">{profile?.email}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="textSecondary">
              Téléphone
            </Typography>
            <Typography variant="body1">{profile?.phone || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="textSecondary">
              Niveau
            </Typography>
            <Typography variant="body1">{student?.level}L</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="textSecondary">
              Statut
            </Typography>
            <Chip
              label={student?.status || 'Actif'}
              color={student?.status === 'actif' ? 'success' : 'warning'}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Section Statistiques Académiques */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Moyenne Générale
              </Typography>
              <Typography variant="h4">{averageGrade}/20</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Crédits Obtenus
              </Typography>
              <Typography variant="h4">
                {earnedCredits}/{totalCredits}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Absences Total
              </Typography>
              <Typography variant="h4">{totalAbsences}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Section Notes */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Notes et Résultats
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell>Matière</TableCell>
                <TableCell align="right">Note</TableCell>
                <TableCell align="right">Crédits</TableCell>
                <TableCell>Semestre</TableCell>
                <TableCell>Statut</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {grades.map(grade => (
                <TableRow key={grade.id}>
                  <TableCell>{grade.course?.name}</TableCell>
                  <TableCell align="right">{(grade.score || 0).toFixed(2)}</TableCell>
                  <TableCell align="right">{grade.course?.credits}</TableCell>
                  <TableCell>S{grade.course?.semester}</TableCell>
                  <TableCell>
                    <Chip
                      label={grade.score >= 10 ? 'Validé' : 'Échoué'}
                      size="small"
                      color={grade.score >= 10 ? 'success' : 'error'}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {grades.length === 0 && (
          <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
            Aucune note
          </Typography>
        )}
      </Paper>

      {/* Section Demandes de Correction */}
      {corrections.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Demandes de Correction ({corrections.length})
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell>Matière</TableCell>
                  <TableCell>Raison</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {corrections.map(correction => (
                  <TableRow key={correction.id}>
                    <TableCell>{correction.course_name || 'N/A'}</TableCell>
                    <TableCell>{correction.reason}</TableCell>
                    <TableCell>
                      <Chip
                        label={correction.status || 'Pending'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(correction.created_at).toLocaleDateString('fr-FR')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Dialog Modification */}
      <Dialog open={editOpen} onClose={handleEditClose} maxWidth="sm" fullWidth>
        <DialogTitle>Modifier l'Étudiant</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Niveau</InputLabel>
            <Select
              value={String(editData.level || 1)}
              label="Niveau"
              onChange={e => setEditData({ ...editData, level: Number(e.target.value) })}
            >
              <MenuItem value={1}>L1</MenuItem>
              <MenuItem value={2}>L2</MenuItem>
              <MenuItem value={3}>L3</MenuItem>
              <MenuItem value={4}>Master 1</MenuItem>
              <MenuItem value={5}>Master 2</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Statut</InputLabel>
            <Select
              value={editData.status || 'actif'}
              label="Statut"
              onChange={e => setEditData({ ...editData, status: e.target.value })}
            >
              <MenuItem value="actif">Actif</MenuItem>
              <MenuItem value="suspendu">Suspendu</MenuItem>
              <MenuItem value="diplomé">Diplomé</MenuItem>
              <MenuItem value="radié">Radié</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose}>Annuler</Button>
          <Button
            variant="contained"
            onClick={handleEditSave}
            disabled={saving}
          >
            Sauvegarder
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentDetailsPage;
