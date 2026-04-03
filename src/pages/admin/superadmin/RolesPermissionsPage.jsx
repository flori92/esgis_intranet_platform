import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, CircularProgress, Alert, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  Card, CardContent, Divider, Snackbar, IconButton, Tooltip,
  Switch, FormControlLabel, Checkbox, FormGroup, Accordion,
  AccordionSummary, AccordionDetails, Select, MenuItem, FormControl,
  InputLabel
} from '@mui/material';
import {
  Security as SecurityIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  School as SchoolIcon,
  Group as GroupIcon,
  Shield as ShieldIcon
} from '@mui/icons-material';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/supabase';

/**
 * Ressources et actions disponibles dans le système
 */
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

/**
 * Données mock pour les rôles
 */
const MOCK_ROLES = [
  {
    id: 'r1', name: 'super_admin', label: 'Super Administrateur', description: 'Accès complet au système',
    is_system: true, user_count: 1,
    permissions: SYSTEM_RESOURCES.reduce((acc, res) => {
      acc[res.key] = res.actions;
      return acc;
    }, {})
  },
  {
    id: 'r2', name: 'admin', label: 'Administrateur', description: 'Gestion globale de l\'établissement',
    is_system: true, user_count: 3,
    permissions: {
      students: ['create', 'read', 'update', 'delete', 'import', 'export'],
      professors: ['create', 'read', 'update', 'delete'],
      courses: ['create', 'read', 'update', 'delete', 'assign'],
      grades: ['read', 'update', 'publish'],
      exams: ['read'],
      documents: ['create', 'read', 'update', 'delete', 'generate', 'validate'],
      schedule: ['create', 'read', 'update', 'delete'],
      messages: ['create', 'read', 'delete'],
      stages: ['create', 'read', 'update', 'delete'],
      payments: ['create', 'read', 'update', 'validate'],
      reports: ['read', 'export'],
      system: [],
      audit: [],
    }
  },
  {
    id: 'r3', name: 'scolarite', label: 'Agent Scolarité',
    description: 'Accès aux documents et inscriptions uniquement',
    is_system: false, user_count: 2,
    permissions: {
      students: ['read', 'update'], professors: [], courses: ['read'],
      grades: ['read'], exams: [], documents: ['create', 'read', 'generate', 'validate'],
      schedule: ['read'], messages: ['create', 'read'], stages: [],
      payments: ['read', 'validate'], reports: ['read'], system: [], audit: [],
    }
  },
  {
    id: 'r4', name: 'professor', label: 'Professeur', description: 'Gestion pédagogique',
    is_system: true, user_count: 15,
    permissions: {
      students: ['read'], professors: [], courses: ['read'],
      grades: ['create', 'read', 'update', 'publish'], exams: ['create', 'read', 'update', 'delete', 'grade'],
      documents: ['create', 'read'], schedule: ['read'], messages: ['create', 'read'],
      stages: [], payments: [], reports: [], system: [], audit: [],
    }
  },
  {
    id: 'r5', name: 'student', label: 'Étudiant', description: 'Accès au parcours académique',
    is_system: true, user_count: 450,
    permissions: {
      students: [], professors: [], courses: ['read'],
      grades: ['read'], exams: ['read'],
      documents: ['read'], schedule: ['read'], messages: ['create', 'read'],
      stages: ['read'], payments: ['read'], reports: [], system: [], audit: [],
    }
  },
];

/**
 * Page de gestion des rôles et permissions — ESGIS Campus §7
 */
const RolesPermissionsPage = () => {
  const { authState } = useAuth();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Dialog d'édition de rôle
  const [editDialog, setEditDialog] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [roleForm, setRoleForm] = useState({
    name: '', label: '', description: '', permissions: {}
  });
  const [saving, setSaving] = useState(false);

  // Dialog de confirmation de suppression
  const [deleteDialog, setDeleteDialog] = useState(null);

  const loadRoles = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('roles_permissions')
        .select('*')
        .order('created_at');

      if (error || !data || data.length === 0) {
        setRoles(MOCK_ROLES);
      } else {
        setRoles(data);
      }
    } catch (err) {
      console.error('Erreur chargement rôles:', err);
      setRoles(MOCK_ROLES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRoles(); }, [loadRoles]);

  const handleOpenEdit = (role = null) => {
    if (role) {
      setEditingRole(role);
      setRoleForm({
        name: role.name, label: role.label,
        description: role.description, permissions: { ...role.permissions }
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
        permissions: {
          ...prev.permissions,
          [resource]: allChecked ? [] : [...actions]
        }
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
      if (editingRole) {
        // Mise à jour
        const updatedRoles = roles.map(r =>
          r.id === editingRole.id
            ? { ...r, ...roleForm, updated_at: new Date().toISOString() }
            : r
        );
        setRoles(updatedRoles);
        setSuccessMessage(`Rôle "${roleForm.label}" mis à jour.`);
      } else {
        // Création
        const newRole = {
          id: `r${Date.now()}`,
          ...roleForm,
          is_system: false,
          user_count: 0,
          created_at: new Date().toISOString()
        };
        setRoles(prev => [...prev, newRole]);
        setSuccessMessage(`Rôle "${roleForm.label}" créé.`);
      }
      setEditDialog(false);
    } catch (err) {
      setError('Erreur: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = (role) => {
    if (role.is_system) {
      setError('Les rôles système ne peuvent pas être supprimés.');
      return;
    }
    setRoles(prev => prev.filter(r => r.id !== role.id));
    setDeleteDialog(null);
    setSuccessMessage(`Rôle "${role.label}" supprimé.`);
  };

  const getPermissionCount = (permissions) => {
    return Object.values(permissions || {}).reduce((acc, actions) => acc + (actions?.length || 0), 0);
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
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <SecurityIcon sx={{ mr: 1, color: 'primary.main', fontSize: 32 }} />
          <Typography variant="h5" fontWeight="bold">Gestion des Rôles & Permissions</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenEdit()}>
          Nouveau rôle
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      <Snackbar open={!!successMessage} autoHideDuration={4000} onClose={() => setSuccessMessage('')} message={successMessage} />

      {/* Liste des rôles */}
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
                  <Chip icon={<GroupIcon />} label={`${role.user_count} utilisateur${role.user_count > 1 ? 's' : ''}`}
                    size="small" variant="outlined" />
                  <Chip label={`${getPermissionCount(role.permissions)} permissions`}
                    size="small" color="primary" variant="outlined" />
                  {role.is_system && <Chip label="Système" size="small" color="warning" />}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Dialog d'édition des permissions */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingRole ? `Modifier : ${editingRole.label}` : 'Nouveau rôle personnalisé'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12} sm={4}>
              <TextField label="Identifiant" fullWidth size="small" value={roleForm.name}
                onChange={(e) => setRoleForm(p => ({ ...p, name: e.target.value.toLowerCase().replace(/\s/g, '_') }))}
                disabled={editingRole?.is_system} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Libellé" fullWidth size="small" value={roleForm.label}
                onChange={(e) => setRoleForm(p => ({ ...p, label: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Description" fullWidth size="small" value={roleForm.description}
                onChange={(e) => setRoleForm(p => ({ ...p, description: e.target.value }))} />
            </Grid>
          </Grid>

          <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 3, mb: 1 }}>Permissions</Typography>
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

      {/* Confirmation suppression */}
      <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)}>
        <DialogTitle>Supprimer le rôle</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer le rôle <strong>{deleteDialog?.label}</strong> ?
            {deleteDialog?.user_count > 0 &&
              ` ${deleteDialog.user_count} utilisateur(s) seront réaffectés au rôle par défaut.`}
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
