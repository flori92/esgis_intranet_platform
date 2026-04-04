import { useEffect, useMemo, useState } from 'react';
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
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { getStudentAccountStatuses, updateStudentAccountStatus } from '@/api/admin';
import { useAuth } from '../../hooks/useAuth';

const ACCOUNT_STATUSES = [
  { value: 'active', label: 'Actif', color: 'success' },
  { value: 'suspended', label: 'Suspendu', color: 'warning' },
  { value: 'graduated', label: 'Diplômé', color: 'info' },
  { value: 'withdrawn', label: 'Radié', color: 'error' }
];

const getStatusLabel = (status) => ACCOUNT_STATUSES.find((item) => item.value === status)?.label || status;
const getStatusColor = (status) => ACCOUNT_STATUSES.find((item) => item.value === status)?.color || 'default';

export default function AccountStatusPage() {
  const { authState } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [statusChangeDialog, setStatusChangeDialog] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error: fetchError } = await getStudentAccountStatuses();

      if (fetchError) {
        throw fetchError;
      }

      setStudents(data || []);
    } catch (err) {
      setError(`Erreur lors du chargement des comptes étudiants: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (student) => {
    setStatusChangeDialog(student);
    setNewStatus(student.status || '');
    setReason('');
    setError('');
  };

  const handleStatusChange = async () => {
    try {
      if (!statusChangeDialog || !newStatus) {
        setError('Sélectionne un nouveau statut.');
        return;
      }

      const actor = {
        id: authState.profile?.id || authState.user?.id || null,
        full_name: authState.profile?.full_name || authState.user?.email || 'Admin ESGIS',
        role: authState.profile?.role || 'admin'
      };

      const { error: updateError } = await updateStudentAccountStatus(statusChangeDialog.id, {
        status: newStatus,
        reason,
        actor
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess(`Le compte de ${statusChangeDialog.full_name} est maintenant ${getStatusLabel(newStatus).toLowerCase()}.`);
      setStatusChangeDialog(null);
      setNewStatus('');
      setReason('');
      await fetchStudents();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(`Erreur lors du changement de statut: ${err.message}`);
    }
  };

  const filteredStudents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return students.filter((student) => {
      const matchesSearch = !query
        || student.full_name?.toLowerCase().includes(query)
        || student.email?.toLowerCase().includes(query)
        || `${student.student_number || ''}`.toLowerCase().includes(query);

      const matchesStatus = !filterStatus || student.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [filterStatus, searchQuery, students]);

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
          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
            <TextField
              fullWidth
              placeholder="Rechercher par nom, email ou numéro étudiant..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              sx={{ maxWidth: { md: 420 } }}
            />
            <FormControl sx={{ minWidth: 220 }}>
              <InputLabel>Filtrer par statut</InputLabel>
              <Select
                value={filterStatus}
                label="Filtrer par statut"
                onChange={(event) => setFilterStatus(event.target.value)}
              >
                <MenuItem value="">Tous les statuts</MenuItem>
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
                  <TableCell><strong>Numéro étudiant</strong></TableCell>
                  <TableCell><strong>Nom complet</strong></TableCell>
                  <TableCell><strong>Email</strong></TableCell>
                  <TableCell><strong>Niveau</strong></TableCell>
                  <TableCell><strong>Statut</strong></TableCell>
                  <TableCell><strong>Compte</strong></TableCell>
                  <TableCell><strong>Département</strong></TableCell>
                  <TableCell align="right"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id} hover>
                      <TableCell sx={{ fontWeight: 'bold' }}>{student.student_number}</TableCell>
                      <TableCell>{student.full_name}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>{student.level || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(student.status)}
                          color={getStatusColor(student.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={student.is_active ? 'Ouvert' : 'Bloqué'}
                          color={student.is_active ? 'success' : 'default'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{student.department_name}</TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<EditIcon />}
                          onClick={() => handleOpenDialog(student)}
                        >
                          Modifier
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="text.secondary">Aucun étudiant trouvé</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Typography sx={{ mt: 2 }} color="text.secondary" variant="body2">
            Affichage: {filteredStudents.length} étudiants sur {students.length}
          </Typography>
        </CardContent>
      </Card>

      <Dialog open={Boolean(statusChangeDialog)} onClose={() => setStatusChangeDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Modifier le statut du compte</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Étudiant: <strong>{statusChangeDialog?.full_name}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Statut actuel: <Chip label={getStatusLabel(statusChangeDialog?.status)} size="small" />
            </Typography>

            <FormControl fullWidth>
              <InputLabel>Nouveau statut</InputLabel>
              <Select
                value={newStatus}
                label="Nouveau statut"
                onChange={(event) => setNewStatus(event.target.value)}
              >
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
              label="Raison"
              placeholder="Ex: impayé, diplômé, abandon, décision disciplinaire..."
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />

            <Alert severity="info">
              Cette action met à jour le statut étudiant, l’activation du compte et le journal d’audit.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusChangeDialog(null)}>Annuler</Button>
          <Button onClick={handleStatusChange} variant="contained" disabled={!newStatus}>
            Confirmer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
