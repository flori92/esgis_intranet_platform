import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Typography,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { cmsPermissionsService } from '@/services/cmsPermissionsService';

/**
 * Page de gestion des permissions CMS pour les admins
 */
export const CMSPermissionsPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // État pour les utilisateurs avec accès CMS
  const [cmsUsers, setCmsUsers] = useState([]);

  // État pour le formulaire d'ajout de permission
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [permissionType, setPermissionType] = useState('editor');
  const [targetModule, setTargetModule] = useState('all');
  const [allUsers, setAllUsers] = useState([]);

  // État pour les logs
  const [showLogs, setShowLogs] = useState(false);
  const [accessLogs, setAccessLogs] = useState([]);

  /**
   * Charger les données
   */
  const loadData = async () => {
    setLoading(true);
    try {
      const [users, logs] = await Promise.all([
        cmsPermissionsService.getAllCmsUsers(),
        cmsPermissionsService.getAccessLogs({ limit: 50 })
      ]);

      setCmsUsers(users);
      setAccessLogs(logs);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /**
   * Ajouter une permission
   */
  const handleAddPermission = async () => {
    if (!selectedUser) {
      setError('Veuillez sélectionner un utilisateur');
      return;
    }

    try {
      await cmsPermissionsService.grantPermission(
        selectedUser.id,
        permissionType,
        targetModule
      );

      setSuccess(`Permission accordée à ${selectedUser.email}`);
      setDialogOpen(false);
      setSelectedUser(null);
      setPermissionType('editor');
      setTargetModule('all');
      await loadData();
    } catch (err) {
      setError('Erreur: ' + err.message);
    }
  };

  /**
   * Retirer une permission
   */
  const handleRevokePermission = async (userId, module) => {
    if (!window.confirm('Êtes-vous sûr de vouloir retirer cette permission?')) {
      return;
    }

    try {
      await cmsPermissionsService.revokePermission(userId, module);
      setSuccess('Permission retirée');
      await loadData();
    } catch (err) {
      setError('Erreur: ' + err.message);
    }
  };

  /**
   * Statistiques
   */
  const stats = {
    totalUsers: cmsUsers.length,
    editors: cmsUsers.filter((u) => u.permissions.some((p) => p.type === 'editor')).length,
    viewers: cmsUsers.filter((u) => u.permissions.some((p) => p.type === 'viewer')).length
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <SecurityIcon sx={{ fontSize: 40, color: '#1976d2' }} />
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Gestion des permissions CMS
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
        >
          Ajouter un accès
        </Button>
      </Box>

      {/* Statistiques */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Utilisateurs avec accès
              </Typography>
              <Typography variant="h4">{stats.totalUsers}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Éditeurs
              </Typography>
              <Typography variant="h4" sx={{ color: '#1976d2' }}>
                {stats.editors}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Lecteurs
              </Typography>
              <Typography variant="h4" sx={{ color: '#388e3c' }}>
                {stats.viewers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Button
                size="small"
                onClick={() => setShowLogs(!showLogs)}
                sx={{ width: '100%' }}
              >
                {showLogs ? 'Masquer' : 'Voir'} les logs
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tableau des permissions */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ mb: 4 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Permissions</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Modules</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Accordée le</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cmsUsers.map((user) => (
                  <TableRow key={user.user_id} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{user.user_id}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {user.permissions.map((perm, idx) => (
                          <Chip
                            key={idx}
                            label={perm.type}
                            size="small"
                            color={perm.type === 'editor' ? 'primary' : 'default'}
                          />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {user.permissions.map((perm, idx) => (
                          <Chip
                            key={idx}
                            label={perm.module}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.85rem' }}>
                      {new Date(user.permissions[0].createdAt).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell align="right">
                      {user.permissions.map((perm, idx) => (
                        <IconButton
                          key={idx}
                          size="small"
                          color="error"
                          onClick={() => handleRevokePermission(user.user_id, perm.module)}
                          title="Retirer cette permission"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      ))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Logs */}
          {showLogs && (
            <Paper sx={{ p: 3, mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                Logs d'activité CMS (50 derniers)
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell sx={{ fontWeight: 700 }}>Utilisateur</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Table</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Titre</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {accessLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell sx={{ fontSize: '0.85rem' }}>{log.user_id}</TableCell>
                        <TableCell>
                          <Chip label={log.action} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.85rem' }}>{log.table_name}</TableCell>
                        <TableCell sx={{ fontSize: '0.85rem' }}>{log.record_title || '-'}</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem' }}>
                          {new Date(log.created_at).toLocaleString('fr-FR')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </>
      )}

      {/* Dialog d'ajout de permission */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Ajouter une permission CMS</DialogTitle>

        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 3 }}>
          <TextField
            fullWidth
            label="Email de l'utilisateur"
            placeholder="email@example.com"
            value={selectedUser?.email || ''}
            onChange={(e) => setSelectedUser({ id: e.target.value, email: e.target.value })}
            helperText="Entrez l'email de l'utilisateur"
          />

          <FormControl fullWidth>
            <InputLabel>Type de permission</InputLabel>
            <Select
              value={permissionType}
              onChange={(e) => setPermissionType(e.target.value)}
              label="Type de permission"
            >
              <MenuItem value="editor">Éditeur (CRUD complet)</MenuItem>
              <MenuItem value="viewer">Lecteur (lecture seule)</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Module cible</InputLabel>
            <Select
              value={targetModule}
              onChange={(e) => setTargetModule(e.target.value)}
              label="Module cible"
            >
              <MenuItem value="all">Tous les modules</MenuItem>
              <MenuItem value="events">Événements uniquement</MenuItem>
              <MenuItem value="news">Actualités uniquement</MenuItem>
              <MenuItem value="announcements">Annonces uniquement</MenuItem>
              <MenuItem value="banners">Bannières uniquement</MenuItem>
            </Select>
          </FormControl>

          <Alert severity="info">
            <strong>Éditeur</strong>: Peut créer, modifier et supprimer le contenu
            <br />
            <strong>Lecteur</strong>: Peut seulement voir le contenu (lecture seule)
          </Alert>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Annuler</Button>
          <Button onClick={handleAddPermission} variant="contained">
            Accorder l'accès
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CMSPermissionsPage;
