import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Checkbox, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Chip, CircularProgress, Divider, Stack, alpha, Tooltip
} from '@mui/material';
import {
  Security as SecurityIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { getRoles, createRole, updateRole, deleteRole } from '@/api/admin';
import { toast } from 'react-hot-toast';

const PERMISSIONS_LIST = [
  { key: 'users', label: 'Utilisateurs', actions: ['read', 'create', 'update', 'delete', 'impersonate'] },
  { key: 'courses', label: 'Maquettes & Cours', actions: ['read', 'create', 'update', 'delete'] },
  { key: 'promotions', label: 'Promotions', actions: ['read', 'create', 'update', 'delete'] },
  { key: 'grades', label: 'Notes & Bulletins', actions: ['read', 'create', 'update', 'validate', 'override'] },
  { key: 'cms', label: 'CMS (News/Events)', actions: ['read', 'create', 'update', 'delete'] },
  { key: 'exams', label: 'Examens', actions: ['create', 'read', 'update', 'delete', 'grade'] },
  { key: 'security', label: 'Configuration & Rôles', actions: ['read', 'update'] }
];

const RolesPermissionsPage = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [newRole, setNewRole] = useState({ name: '', label: '', description: '', permissions: [] });

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const { data } = await getRoles();
      setRoles(data || []);
    } catch (err) {
      toast.error('Erreur de chargement des rôles');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePermission = (role, permKey, action) => {
    const permString = `${permKey}.${action}`;
    let newPerms = [...(role.permissions || [])];
    
    if (newPerms.includes(permString)) {
      newPerms = newPerms.filter(p => p !== permString);
    } else {
      newPerms.push(permString);
    }
    
    // Si c'est le rôle en cours d'édition
    if (editingRole && editingRole.id === role.id) {
      setEditingRole({ ...editingRole, permissions: newPerms });
    } else {
      // Mise à jour directe pour les rôles existants (auto-save)
      handleUpdatePermissions(role.id, newPerms);
    }
  };

  const handleUpdatePermissions = async (roleId, permissions) => {
    try {
      await updateRole(roleId, { permissions });
      setRoles(roles.map(r => r.id === roleId ? { ...r, permissions } : r));
      toast.success('Permissions mises à jour');
    } catch (err) {
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleCreateRole = async () => {
    try {
      const { error } = await createRole(newRole);
      if (error) throw error;
      toast.success('Rôle créé avec succès');
      setDialogOpen(false);
      fetchRoles();
    } catch (err) {
      toast.error('Erreur de création');
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold" display="flex" alignItems="center">
            <SecurityIcon sx={{ mr: 2, fontSize: 40, color: 'primary.main' }} />
            Rôles & Permissions
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Définissez les droits d'accès pour chaque profil administratif de l'ESGIS.
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => { setEditingRole(null); setDialogOpen(true); }}
        >
          Nouveau Rôle
        </Button>
      </Stack>

      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 3 }}>
        <Table sx={{ minWidth: 800 }}>
          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', width: 200 }}>Ressource / Action</TableCell>
              {roles.map((role) => (
                <TableCell key={role.id} align="center" sx={{ fontWeight: 'bold' }}>
                  <Tooltip title={role.description || ''}>
                    <Box>
                      {role.label}
                      <Box sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>({role.name})</Box>
                    </Box>
                  </Tooltip>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {PERMISSIONS_LIST.map((resource) => (
              <React.Fragment key={resource.key}>
                <TableRow sx={{ bgcolor: alpha('#003366', 0.02) }}>
                  <TableCell colSpan={roles.length + 1} sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    {resource.label}
                  </TableCell>
                </TableRow>
                {resource.actions.map((action) => (
                  <TableRow key={`${resource.key}-${action}`} hover>
                    <TableCell sx={{ pl: 4, fontSize: '0.85rem' }}>
                      {action.charAt(0).toUpperCase() + action.slice(1)}
                    </TableCell>
                    {roles.map((role) => {
                      const isSuperAdmin = role.name === 'super_admin';
                      const hasPerm = role.permissions?.includes(`${resource.key}.${action}`) || role.permissions?.includes('*');
                      
                      return (
                        <TableCell key={role.id} align="center">
                          <Checkbox 
                            size="small"
                            checked={hasPerm}
                            disabled={isSuperAdmin}
                            onChange={() => handleTogglePermission(role, resource.key, action)}
                          />
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog Nouveau Rôle */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Créer un nouveau rôle</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField 
              label="Nom technique (slug)" 
              placeholder="ex: comptabilite_admin"
              fullWidth
              value={newRole.name}
              onChange={(e) => setNewRole({...newRole, name: e.target.value})}
            />
            <TextField 
              label="Libellé affiché" 
              placeholder="ex: Responsable Financier"
              fullWidth
              value={newRole.label}
              onChange={(e) => setNewRole({...newRole, label: e.target.value})}
            />
            <TextField 
              label="Description" 
              multiline rows={2}
              fullWidth
              value={newRole.description}
              onChange={(e) => setNewRole({...newRole, description: e.target.value})}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleCreateRole}>Créer le rôle</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RolesPermissionsPage;
