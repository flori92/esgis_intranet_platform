import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
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
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Upload as UploadIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import {
  getAllowedEmails,
  addAllowedEmail,
  addAllowedEmailsBulk,
  updateAllowedEmail,
  deleteAllowedEmail,
} from '../../api/allowedEmails';
import { supabase } from '../../supabase';

const ROLES = [
  { value: 'student', label: 'Étudiant', color: 'primary' },
  { value: 'professor', label: 'Professeur', color: 'success' },
  { value: 'admin', label: 'Administrateur', color: 'error' },
];

const LEVELS = ['L1', 'L2', 'L3', 'M1', 'M2'];

const INITIAL_FORM = {
  email: '',
  role: 'student',
  full_name: '',
  department_id: '',
  level: '',
};

export default function AllowedEmailsPage() {
  const { authState } = useAuth();

  const [emails, setEmails] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [registeredFilter, setRegisteredFilter] = useState('');

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Dialog states
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openBulk, setOpenBulk] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [bulkText, setBulkText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchEmails = useCallback(async () => {
    setLoading(true);
    setError(null);

    const filters = {};
    if (roleFilter) filters.role = roleFilter;
    if (searchQuery) filters.search = searchQuery;
    if (registeredFilter !== '') filters.is_registered = registeredFilter === 'true';

    const { data, error: fetchError } = await getAllowedEmails(filters);

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setEmails(data);
    }

    setLoading(false);
  }, [roleFilter, searchQuery, registeredFilter]);

  const fetchDepartments = useCallback(async () => {
    const { data } = await supabase
      .from('departments')
      .select('id, name')
      .order('name');
    setDepartments(data || []);
  }, []);

  useEffect(() => {
    fetchEmails();
    fetchDepartments();
  }, [fetchEmails, fetchDepartments]);

  const filteredEmails = useMemo(() => emails, [emails]);

  const handleFormChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleAddEmail = async () => {
    if (!formData.email) {
      setError('L\'email est obligatoire.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const { error: addError } = await addAllowedEmail({
      ...formData,
      department_id: formData.department_id || null,
    });

    if (addError) {
      setError(addError.message);
    } else {
      setSuccess('Email ajouté avec succès.');
      setOpenAdd(false);
      setFormData(INITIAL_FORM);
      fetchEmails();
    }

    setSubmitting(false);
  };

  const handleEditEmail = async () => {
    if (!selectedEmail) return;

    setSubmitting(true);
    setError(null);

    const { error: editError } = await updateAllowedEmail(selectedEmail.id, {
      email: formData.email,
      role: formData.role,
      full_name: formData.full_name || null,
      department_id: formData.department_id || null,
      level: formData.level || null,
    });

    if (editError) {
      setError(editError.message);
    } else {
      setSuccess('Email mis à jour avec succès.');
      setOpenEdit(false);
      setSelectedEmail(null);
      setFormData(INITIAL_FORM);
      fetchEmails();
    }

    setSubmitting(false);
  };

  const handleDeleteEmail = async () => {
    if (!selectedEmail) return;

    setSubmitting(true);
    setError(null);

    const { error: delError } = await deleteAllowedEmail(selectedEmail.id);

    if (delError) {
      setError(delError.message);
    } else {
      setSuccess('Email supprimé avec succès.');
      setOpenDelete(false);
      setSelectedEmail(null);
      fetchEmails();
    }

    setSubmitting(false);
  };

  const handleBulkImport = async () => {
    if (!bulkText.trim()) {
      setError('Veuillez entrer au moins un email.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const lines = bulkText.split('\n').filter((l) => l.trim());
    const emailsToAdd = lines.map((line) => {
      const parts = line.split(',').map((p) => p.trim());
      return {
        email: parts[0] || '',
        full_name: parts[1] || null,
        role: parts[2] || 'student',
        level: parts[3] || null,
      };
    });

    const validEmails = emailsToAdd.filter((e) => e.email.includes('@'));

    if (validEmails.length === 0) {
      setError('Aucun email valide trouvé.');
      setSubmitting(false);
      return;
    }

    const { success: added, errors } = await addAllowedEmailsBulk(validEmails);

    if (errors.length > 0) {
      setError(`Erreurs: ${errors.map((e) => e.error).join(', ')}`);
    }

    if (added.length > 0) {
      setSuccess(`${added.length} email(s) importé(s) avec succès.`);
    }

    setOpenBulk(false);
    setBulkText('');
    fetchEmails();
    setSubmitting(false);
  };

  const openEditDialog = (emailItem) => {
    setSelectedEmail(emailItem);
    setFormData({
      email: emailItem.email,
      role: emailItem.role,
      full_name: emailItem.full_name || '',
      department_id: emailItem.department_id || '',
      level: emailItem.level || '',
    });
    setOpenEdit(true);
  };

  const openDeleteDialog = (emailItem) => {
    setSelectedEmail(emailItem);
    setOpenDelete(true);
  };

  const getRoleChip = (role) => {
    const roleConfig = ROLES.find((r) => r.value === role);
    return (
      <Chip
        label={roleConfig?.label || role}
        color={roleConfig?.color || 'default'}
        size="small"
      />
    );
  };

  const renderFormFields = () => (
    <Stack spacing={2} sx={{ mt: 1 }}>
      <TextField
        label="Email"
        type="email"
        value={formData.email}
        onChange={handleFormChange('email')}
        fullWidth
        required
        placeholder="exemple@gmail.com"
      />
      <TextField
        label="Nom complet"
        value={formData.full_name}
        onChange={handleFormChange('full_name')}
        fullWidth
        placeholder="Nom Prénom"
      />
      <FormControl fullWidth>
        <InputLabel>Rôle</InputLabel>
        <Select value={formData.role} onChange={handleFormChange('role')} label="Rôle">
          {ROLES.map((r) => (
            <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl fullWidth>
        <InputLabel>Département</InputLabel>
        <Select
          value={formData.department_id}
          onChange={handleFormChange('department_id')}
          label="Département"
        >
          <MenuItem value="">Aucun</MenuItem>
          {departments.map((d) => (
            <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
          ))}
        </Select>
      </FormControl>
      {formData.role === 'student' && (
        <FormControl fullWidth>
          <InputLabel>Niveau</InputLabel>
          <Select value={formData.level} onChange={handleFormChange('level')} label="Niveau">
            <MenuItem value="">Non défini</MenuItem>
            {LEVELS.map((l) => (
              <MenuItem key={l} value={l}>{l}</MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    </Stack>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gestion des emails autorisés
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Ajoutez les adresses email (Gmail, Yahoo, etc.) des personnes autorisées à se connecter
        à la plateforme. Seuls les emails présents dans cette liste pourront accéder à l'intranet.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Actions & Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="center">
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => { setFormData(INITIAL_FORM); setOpenAdd(true); }}
          >
            Ajouter un email
          </Button>
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={() => setOpenBulk(true)}
          >
            Import en masse
          </Button>

          <Box sx={{ flexGrow: 1 }} />

          <TextField
            size="small"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchEmails()}
            InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
            sx={{ minWidth: 200 }}
          />
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Rôle</InputLabel>
            <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} label="Rôle">
              <MenuItem value="">Tous</MenuItem>
              {ROLES.map((r) => (
                <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Statut</InputLabel>
            <Select
              value={registeredFilter}
              onChange={(e) => setRegisteredFilter(e.target.value)}
              label="Statut"
            >
              <MenuItem value="">Tous</MenuItem>
              <MenuItem value="true">Inscrit</MenuItem>
              <MenuItem value="false">Non inscrit</MenuItem>
            </Select>
          </FormControl>
          <Button variant="text" onClick={fetchEmails}>Filtrer</Button>
        </Stack>
      </Paper>

      {/* Stats */}
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <Chip label={`Total: ${emails.length}`} variant="outlined" />
        <Chip
          label={`Inscrits: ${emails.filter((e) => e.is_registered).length}`}
          color="success"
          variant="outlined"
        />
        <Chip
          label={`En attente: ${emails.filter((e) => !e.is_registered).length}`}
          color="warning"
          variant="outlined"
        />
      </Stack>

      {/* Table */}
      <TableContainer component={Paper}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Email</TableCell>
                  <TableCell>Nom</TableCell>
                  <TableCell>Rôle</TableCell>
                  <TableCell>Département</TableCell>
                  <TableCell>Niveau</TableCell>
                  <TableCell align="center">Inscrit</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredEmails.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                        Aucun email autorisé. Ajoutez des emails pour permettre aux utilisateurs de se connecter.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmails
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {item.email}
                          </Typography>
                        </TableCell>
                        <TableCell>{item.full_name || '—'}</TableCell>
                        <TableCell>{getRoleChip(item.role)}</TableCell>
                        <TableCell>{item.department?.name || '—'}</TableCell>
                        <TableCell>{item.level || '—'}</TableCell>
                        <TableCell align="center">
                          {item.is_registered ? (
                            <Tooltip title="Compte créé">
                              <CheckCircleIcon color="success" fontSize="small" />
                            </Tooltip>
                          ) : (
                            <Tooltip title="En attente d'inscription">
                              <CancelIcon color="disabled" fontSize="small" />
                            </Tooltip>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Modifier">
                            <IconButton size="small" onClick={() => openEditDialog(item)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Supprimer">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => openDeleteDialog(item)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={filteredEmails.length}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              labelRowsPerPage="Lignes par page"
            />
          </>
        )}
      </TableContainer>

      {/* Dialog: Ajouter */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Ajouter un email autorisé</DialogTitle>
        <DialogContent>{renderFormFields()}</DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdd(false)}>Annuler</Button>
          <Button
            variant="contained"
            onClick={handleAddEmail}
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={20} /> : 'Ajouter'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Modifier */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Modifier l'email autorisé</DialogTitle>
        <DialogContent>{renderFormFields()}</DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)}>Annuler</Button>
          <Button
            variant="contained"
            onClick={handleEditEmail}
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={20} /> : 'Enregistrer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Supprimer */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Supprimer l'email <strong>{selectedEmail?.email}</strong> de la liste des emails autorisés ?
            {selectedEmail?.is_registered && (
              <Alert severity="warning" sx={{ mt: 1 }}>
                Cet utilisateur a déjà créé un compte. La suppression empêchera sa prochaine connexion.
              </Alert>
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)}>Annuler</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteEmail}
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={20} /> : 'Supprimer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Import en masse */}
      <Dialog open={openBulk} onClose={() => setOpenBulk(false)} maxWidth="md" fullWidth>
        <DialogTitle>Import en masse d'emails</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Entrez un email par ligne. Format optionnel : <code>email, nom complet, rôle, niveau</code>
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
            Exemples :<br />
            etudiant1@gmail.com, Jean Dupont, student, L1<br />
            prof@yahoo.fr, Marie Martin, professor<br />
            admin@hotmail.com
          </Typography>
          <TextField
            multiline
            rows={10}
            fullWidth
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder="email@exemple.com, Nom Prénom, student, L1"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBulk(false)}>Annuler</Button>
          <Button
            variant="contained"
            onClick={handleBulkImport}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} /> : <UploadIcon />}
          >
            Importer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
