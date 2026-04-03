import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Chip,
  Alert,
  CircularProgress,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { supabase } from '@/supabase';
import { useAuth } from '../../hooks/useAuth';

const ACCOUNT_STATUSES = [
  { value: 'actif', label: 'Actif', color: 'success' },
  { value: 'suspendu', label: 'Suspendu', color: 'warning' },
  { value: 'diplomé', label: 'Diplomé', color: 'info' },
  { value: 'radié', label: 'Radi\u00e9', color: 'error' },
];

export default function AccountStatusPage() {
  const { authState } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [editingStudent, setEditingStudent] = useState(null);
  const [statusChangeDialog, setStatusChangeDialog] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch students with status
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error: fetchError } = await supabase
        .from('students')
        .select('*, profiles(full_name, email), is_active:is_active')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setStudents(data || []);
    } catch (err) {
      setError(`Error loading students: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async () => {
    try {
      if (!statusChangeDialog || !newStatus) {
        setError('Please select a status');
        return;
      }

      // Update student status
      const { error: updateError } = await supabase
        .from('students')
        .update({
          status: newStatus,
          is_active: newStatus === 'actif',
          updated_at: new Date().toISOString(),
        })
        .eq('id', statusChangeDialog.id);

      if (updateError) throw updateError;

      // Log audit event
      try {
        await supabase.from('audit_log').insert([
          {
            user_id: authState.user?.id,
            action: 'update',
            resource_type: 'student',
            resource_id: statusChangeDialog.id,
            description: `Student status changed from actif to ${newStatus}${reason ? ` - Raison: ${reason}` : ''}`,
          },
        ]);
      } catch (auditErr) {
        console.warn('Audit log error:', auditErr);
      }

      setSuccess(`Student status updated to ${newStatus}`);
      setStatusChangeDialog(null);
      setNewStatus('');
      setReason('');
      await fetchStudents();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(`Error changing status: ${err.message}`);
    }
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.student_id?.toString().includes(searchQuery);

    const matchesStatus = !filterStatus || student.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'actif':
        return 'success';
      case 'suspendu':
        return 'warning';
      case 'diplomé':
        return 'info';
      case 'radié':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    const found = ACCOUNT_STATUSES.find(s => s.value === status);
    return found?.label || status;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="Gestion du Statut des Comptes"
          subheader="Activation, suspension, diplomation et radiation des étudiants"
        />
        <CardContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
            <TextField
              fullWidth
              placeholder="Rechercher par nom, email ou ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ maxWidth: { md: 400 } }}
            />
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Filtrer par statut</InputLabel>
              <Select
                value={filterStatus}
                label="Filtrer par statut"
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <MenuItem value="">-- Tous les statuts --</MenuItem>
                {ACCOUNT_STATUSES.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell><strong>ID Étudiant</strong></TableCell>
                  <TableCell><strong>Nom Complet</strong></TableCell>
                  <TableCell><strong>Email</strong></TableCell>
                  <TableCell><strong>Statut Actuel</strong></TableCell>
                  <TableCell><strong>Date Création</strong></TableCell>
                  <TableCell align="right"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id} hover>
                      <TableCell sx={{ fontWeight: 'bold' }}>{student.student_id}</TableCell>
                      <TableCell>{student.profiles?.full_name}</TableCell>
                      <TableCell>{student.profiles?.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(student.status)}
                          color={getStatusColor(student.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>
                        {new Date(student.created_at).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<EditIcon />}
                          onClick={() => setStatusChangeDialog(student)}
                        >
                          Modifier
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography color="textSecondary">Aucun étudiant trouvé</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Typography sx={{ mt: 2 }} color="textSecondary" variant="body2">
            Affichage: {filteredStudents.length} étudiants sur {students.length} total
          </Typography>
        </CardContent>
      </Card>

      {/* Status Change Dialog */}
      <Dialog open={Boolean(statusChangeDialog)} onClose={() => setStatusChangeDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Modifier le Statut du Compte</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <Typography variant="body2" color="textSecondary">
              Étudiant: <strong>{statusChangeDialog?.profiles?.full_name}</strong>
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Statut actuel: <Chip label={getStatusLabel(statusChangeDialog?.status)} size="small" />
            </Typography>

            <FormControl fullWidth>
              <InputLabel>Nouveau Statut</InputLabel>
              <Select
                value={newStatus}
                label="Nouveau Statut"
                onChange={(e) => setNewStatus(e.target.value)}
              >
                <MenuItem value="">-- Sélectionner --</MenuItem>
                {ACCOUNT_STATUSES.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Raison (optionnel)"
              placeholder="Ex: Expulsion, Abandon, Diplomation..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />

            <Alert severity="info">
              Cette action sera enregistrée dans le journal d'audit avec la date et l'heure.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusChangeDialog(null)}>Annuler</Button>
          <Button
            onClick={handleStatusChange}
            variant="contained"
            color="primary"
            disabled={!newStatus}
          >
            Confirmer le Changement
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
