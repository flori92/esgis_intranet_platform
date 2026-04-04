import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, CircularProgress, Alert, Button,
  TextField, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  Card, CardContent, Divider, Snackbar, IconButton, Tooltip,
  Checkbox, FormGroup, Accordion, AccordionSummary, AccordionDetails,
  Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, FormControl, InputLabel, Select, MenuItem, FormControlLabel,
  Autocomplete
} from '@mui/material';
import {
  Security as SecurityIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  ExpandMore as ExpandMoreIcon,
  Group as GroupIcon,
  Shield as ShieldIcon,
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon,
} from '@mui/icons-material';
import { useAuth } from '@/context/AuthContext';
import {
  getRoles,
  createRole as apiCreateRole,
  updateRole as apiUpdateRole,
  deleteRole as apiDeleteRole,
  getUsersWithRoles,
  assignRoleToUser,
  removeRoleFromUser,
} from '@/api/admin';

const SYSTEM_RESOURCES = [
  { key: 'students', label: 'Étudiants', actions: ['create', 'read', 'update', 'delete', 'import', 'export'] },
  { key: 'professors', label: 'Professeurs', actions: ['create', 'read', 'update', 'delete'] },
  { key: 'courses', label: 'Cours & Matières', actions: ['create', 'read', 'update', 'delete', 'assign'] },
  { key: 'grades', label: 'Notes', actions: ['create', 'read', 'update', 'delete', 'publish'] },
  { key: 'exams', label: 'Examens', actions: ['create', 'read', 'update', 'delete', 'grade'] },
  { key: 'documents', label: 'Documents officiels', actions: ['create', 'read', 'update', 'delete', 'generate', 'validate'] },
  { key: 'schedule', label: 'Emploi du temps', actions: ['create', 'read', 'update', 'delete'] },
  { key: 'messages', label: 'Messagerie', actions: ['create', 'read', 'delete'] },
  { key: 'stages', label: 'Stages & Emplois', actions: ['create', 'read', 'update', 'delete'] },
  { key: 'payments', label: 'Paiements', actions: ['create', 'read', 'update', 'validate'] },
  { key: 'reports', label: 'Rapports & Analytics', actions: ['read', 'export'] },
  { key: 'system', label: 'Configuration système', actions: ['read', 'update'] },
  { key: 'audit', label: 'Audit log', actions: ['read'] },
];

const ACTION_LABELS = {
  create: 'Créer', read: 'Lire', update: 'Modifier', delete: 'Supprimer',
  import: 'Importer', export: 'Exporter', assign: 'Assigner',
  publish: 'Publier', grade: 'Noter', generate: 'Générer', validate: 'Valider',
};

const ROLE_LABELS = { admin: 'Admin', professor: 'Professeur', student: 'Étudiant' };

const RolesPermissionsPage = () => {
  const { authState } = useAuth();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [tabIndex, setTabIndex] = useState(0);

  // Role edit dialog
  const [editDialog, setEditDialog] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [roleForm, setRoleForm] = useState({ name: '', label: '', description: '', permissions: {} });
  const [saving, setSaving] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(null);

  // User assignment
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [assignDialog, setAssignDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRoleId, setSelectedRoleId] = useState('');

  const loadRoles = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error: fetchError } = await getRoles();
      if (fetchError) throw fetchError;
      setRoles(data || []);
    } catch (err) {
      setError('Erreur lors du chargement des rôles: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const { data, error: fetchError } = await getUsersWithRoles();
      if (fetchError) throw fetchError;
      setUsers(data || []);
    } catch (err) {
      setError('Erreur chargement utilisateurs: ' + err.message);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  useEffect(() => {
    if (tabIndex === 1) loadUsers();
  }, [tabIndex, loadUsers]);

  // ---- Role CRUD ----

  const handleOpenEdit = (role = null) => {
    if (role) {
      setEditingRole(role);
      setRoleForm({
        name: role.name, label: role.label,
        description: role.description || '', permissions: { ...role.permissions }
      });
    } else {
      setEditingRole(null);
      setRoleForm({ name: '', label: '', description: '', permissions: {} });
    }
    setEditDialog(true);
  };

  const handleTogglePermission = (resource, action) => {
    setRoleForm(prev => {
      const currentPerms = prev.permissions[resource] || [];
      const newPerms = currentPerms.includes(action)
        ? currentPerms.filter(a => a !== action)
        : [...currentPerms, action];
      return { ...prev, permissions: { ...prev.permissions, [resource]: newPerms } };
    });
  };

  const handleToggleAllResource = (resource, actions) => {
    setRoleForm(prev => {
      const currentPerms = prev.permissions[resource] || [];
      const allChecked = actions.every(a => currentPerms.includes(a));
      return {
        ...prev,
        permissions: { ...prev.permissions, [resource]: allChecked ? [] : [...actions] }
      };
    });
  };

  const handleSaveRole = async () => {
    if (!roleForm.name || !roleForm.label) {
      setError('Le nom et le libellé du rôle sont obligatoires.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: roleForm.name,
        label: roleForm.label,
        description: roleForm.description,
        permissions: roleForm.permissions,
      };

      if (editingRole) {
        const { error: updateError } = await apiUpdateRole(editingRole.id, payload);
        if (updateError) throw updateError;
        setSuccessMessage(`Rôle "${roleForm.label}" mis à jour.`);
      } else {
        const { error: createError } = await apiCreateRole({ ...payload, is_system: false });
        if (createError) throw createError;
        setSuccessMessage(`Rôle "${roleForm.label}" créé.`);
      }
      setEditDialog(false);
      loadRoles();
    } catch (err) {
      setError('Erreur: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async (role) => {
    if (role.is_system) {
      setError('Les rôles système ne peuvent pas être supprimés.');
      return;
    }
    try {
      const { error: delError } = await apiDeleteRole(role.id);
      if (delError) throw delError;
      setSuccessMessage(`Rôle "${role.label}" supprimé.`);
      setDeleteDialog(null);
      loadRoles();
    } catch (err) {
      setError('Erreur suppression: ' + err.message);
    }
  };

  // ---- User assignment ----

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRoleId) {
      setError('Sélectionnez un utilisateur et un rôle.');
      return;
    }
    setSaving(true);
    try {
      const { error: assignError } = await assignRoleToUser(selectedUser.id, selectedRoleId);
      if (assignError) throw assignError;
      setSuccessMessage(`Rôle assigné à ${selectedUser.full_name || selectedUser.email}.`);
      setAssignDialog(false);
      setSelectedUser(null);
      setSelectedRoleId('');
      loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveRole = async (userId, roleId, userName) => {
    try {
      const { error: removeError } = await removeRoleFromUser(userId, roleId);
      if (removeError) throw removeError;
      setSuccessMessage(`Rôle retiré de ${userName}.`);
      loadUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const getPermissionCount = (permissions) =>
    Object.values(permissions || {}).reduce((acc, actions) => acc + (actions?.length || 0), 0);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <SecurityIcon sx={{ mr: 1, color: 'primary.main', fontSize: 32 }} />
          <Typography variant="h5" fontWeight="bold">Gestion des Rôles & Permissions</Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      <Snackbar open={!!successMessage} autoHideDuration={4000} onClose={() => setSuccessMessage('')} message={successMessage} />

      <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} sx={{ mb: 2 }}>
        <Tab label="Rôles & Permissions" />
        <Tab label="Assignation aux utilisateurs" />
      </Tabs>

      {/* TAB 0: Rôles */}
      {tabIndex === 0 && (
        <>
          <Box sx={{ mb: 2 }}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenEdit()}>
              Nouveau rôle
            </Button>
          </Box>

          <Grid container spacing={2}>
            {roles.map((role) => (
              <Grid item xs={12} md={6} key={role.id}>
                <Card elevation={2} sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <ShieldIcon color="primary" />
                          <Typography variant="h6" fontWeight="bold">{role.label}</Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">{role.description}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Modifier">
                          <IconButton size="small" onClick={() => handleOpenEdit(role)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {!role.is_system && (
                          <Tooltip title="Supprimer">
                            <IconButton size="small" color="error" onClick={() => setDeleteDialog(role)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip label={`${getPermissionCount(role.permissions)} permissions`}
                        size="small" color="primary" variant="outlined" />
                      {role.is_system && <Chip label="Système" size="small" color="warning" />}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {roles.length === 0 && (
              <Grid item xs={12}>
                <Alert severity="info">
                  Aucun rôle créé. Cliquez sur "Nouveau rôle" pour créer un rôle personnalisé
                  (ex: Agent Scolarité, Responsable RH, Comptable...).
                </Alert>
              </Grid>
            )}
          </Grid>
        </>
      )}

      {/* TAB 1: Assignation utilisateurs */}
      {tabIndex === 1 && (
        <>
          <Box sx={{ mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={() => setAssignDialog(true)}
              disabled={roles.length === 0}
            >
              Assigner un rôle
            </Button>
            {roles.length === 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                Créez d'abord un rôle dans l'onglet "Rôles & Permissions"
              </Typography>
            )}
          </Box>

          {usersLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Utilisateur</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Rôle système</TableCell>
                    <TableCell>Rôles personnalisés</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.filter(u => u.custom_roles.length > 0).map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>{user.full_name || '—'}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip label={ROLE_LABELS[user.role] || user.role} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {user.custom_roles.map((cr) => (
                            <Chip key={cr.id} label={cr.label} size="small" color="primary" />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        {user.custom_roles.map((cr) => (
                          <Tooltip key={cr.id} title={`Retirer "${cr.label}"`}>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemoveRole(user.id, cr.id, user.full_name || user.email)}
                            >
                              <PersonRemoveIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ))}
                      </TableCell>
                    </TableRow>
                  ))}
                  {users.filter(u => u.custom_roles.length > 0).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                          Aucun utilisateur n'a de rôle personnalisé assigné.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {/* Dialog: Édition de rôle */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingRole ? `Modifier : ${editingRole.label}` : 'Nouveau rôle personnalisé'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Créez des rôles modulaires pour déléguer des fonctions spécifiques
            (ex: accès RH sans accès Finances, ou accès Scolarité sans accès Notes).
          </Typography>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12} sm={4}>
              <TextField label="Identifiant" fullWidth size="small" value={roleForm.name}
                onChange={(e) => setRoleForm(p => ({ ...p, name: e.target.value.toLowerCase().replace(/\s/g, '_') }))}
                disabled={editingRole?.is_system} placeholder="ex: agent_scolarite" />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Libellé" fullWidth size="small" value={roleForm.label}
                onChange={(e) => setRoleForm(p => ({ ...p, label: e.target.value }))}
                placeholder="ex: Agent Scolarité" />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Description" fullWidth size="small" value={roleForm.description}
                onChange={(e) => setRoleForm(p => ({ ...p, description: e.target.value }))}
                placeholder="ex: Accès aux documents et inscriptions" />
            </Grid>
          </Grid>

          <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
            Matrice de permissions
          </Typography>
          <Divider sx={{ mb: 1 }} />

          {SYSTEM_RESOURCES.map((resource) => {
            const perms = roleForm.permissions[resource.key] || [];
            const allChecked = resource.actions.every(a => perms.includes(a));
            const someChecked = resource.actions.some(a => perms.includes(a));

            return (
              <Accordion key={resource.key} disableGutters variant="outlined" sx={{ mb: 0.5 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 48 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                    <Checkbox
                      checked={allChecked}
                      indeterminate={someChecked && !allChecked}
                      onClick={(e) => { e.stopPropagation(); handleToggleAllResource(resource.key, resource.actions); }}
                      size="small"
                    />
                    <Typography variant="body2" fontWeight="bold">{resource.label}</Typography>
                    <Chip label={`${perms.length}/${resource.actions.length}`} size="small"
                      color={perms.length > 0 ? 'primary' : 'default'} variant="outlined" sx={{ ml: 'auto', mr: 1 }} />
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0 }}>
                  <FormGroup row>
                    {resource.actions.map(action => (
                      <FormControlLabel key={action}
                        control={
                          <Checkbox size="small" checked={perms.includes(action)}
                            onChange={() => handleTogglePermission(resource.key, action)} />
                        }
                        label={ACTION_LABELS[action] || action}
                        sx={{ minWidth: 120 }}
                      />
                    ))}
                  </FormGroup>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Annuler</Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveRole} disabled={saving}>
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Assignation de rôle */}
      <Dialog open={assignDialog} onClose={() => setAssignDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assigner un rôle personnalisé</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Sélectionnez un utilisateur et le rôle à lui attribuer.
            Les permissions du rôle s'ajouteront à ses permissions système existantes.
          </Typography>
          <Autocomplete
            options={users}
            getOptionLabel={(u) => `${u.full_name || ''} (${u.email})`}
            value={selectedUser}
            onChange={(_, value) => setSelectedUser(value)}
            renderInput={(params) => <TextField {...params} label="Utilisateur" fullWidth sx={{ mb: 2 }} />}
            sx={{ mt: 1 }}
          />
          <FormControl fullWidth>
            <InputLabel>Rôle à assigner</InputLabel>
            <Select value={selectedRoleId} onChange={(e) => setSelectedRoleId(e.target.value)} label="Rôle à assigner">
              {roles.map((r) => (
                <MenuItem key={r.id} value={r.id}>{r.label} — {r.description || r.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialog(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleAssignRole} disabled={saving || !selectedUser || !selectedRoleId}>
            {saving ? <CircularProgress size={20} /> : 'Assigner'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Suppression */}
      <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)}>
        <DialogTitle>Supprimer le rôle</DialogTitle>
        <DialogContent>
          <Typography>
            Supprimer le rôle <strong>{deleteDialog?.label}</strong> ?
            Les utilisateurs assignés à ce rôle perdront ces permissions.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(null)}>Annuler</Button>
          <Button variant="contained" color="error" onClick={() => handleDeleteRole(deleteDialog)}>
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RolesPermissionsPage;
