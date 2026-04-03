import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, CircularProgress, Alert, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Chip, Card, CardContent, Divider, IconButton, Tooltip,
  FormControl, InputLabel, Select, MenuItem, Pagination
} from '@mui/material';
import {
  History as HistoryIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Person as PersonIcon,
  Login as LoginIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Description as DocIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/supabase';
import { getAuditLogs } from '@/api/admin';

/**
 * Données mock pour l'audit log
 */
const MOCK_AUDIT_LOGS = [
  { id: 'a1', user_name: 'Admin Principal', user_role: 'admin', action: 'login', resource: 'auth', details: 'Connexion réussie', ip_address: '192.168.1.10', created_at: '2026-04-03T08:00:00Z' },
  { id: 'a2', user_name: 'Prof. MENSAH', user_role: 'professor', action: 'create', resource: 'grades', details: 'Publication des notes CC1 — INFO-345 (45 étudiants)', ip_address: '192.168.1.25', created_at: '2026-04-03T07:45:00Z' },
  { id: 'a3', user_name: 'Admin Principal', user_role: 'admin', action: 'update', resource: 'students', details: 'Modification du statut financier de AGBEKO Kofi (payé)', ip_address: '192.168.1.10', created_at: '2026-04-03T07:30:00Z' },
  { id: 'a4', user_name: 'Prof. DOSSEH', user_role: 'professor', action: 'create', resource: 'exams', details: 'Création examen "Algorithmique Avancée — Examen Final"', ip_address: '192.168.1.30', created_at: '2026-04-02T16:00:00Z' },
  { id: 'a5', user_name: 'Admin Principal', user_role: 'admin', action: 'generate', resource: 'documents', details: 'Génération en masse de 120 bulletins semestriels (L2 INFO)', ip_address: '192.168.1.10', created_at: '2026-04-02T14:20:00Z' },
  { id: 'a6', user_name: 'KPOMASSE Yao', user_role: 'student', action: 'generate', resource: 'documents', details: 'Génération certificat de scolarité (REF: CERT-2026-0452)', ip_address: '10.0.0.55', created_at: '2026-04-02T11:10:00Z' },
  { id: 'a7', user_name: 'Prof. MENSAH', user_role: 'professor', action: 'correction', resource: 'grades', details: 'Demande de correction note: AGBEKO Kofi, CC1 (8.5 → 12)', ip_address: '192.168.1.25', created_at: '2026-04-02T10:30:00Z' },
  { id: 'a8', user_name: 'Admin Principal', user_role: 'admin', action: 'validate', resource: 'grades', details: 'Validation correction note AGBEKO Kofi (CC1)', ip_address: '192.168.1.10', created_at: '2026-04-02T10:45:00Z' },
  { id: 'a9', user_name: 'Super Admin', user_role: 'super_admin', action: 'update', resource: 'system', details: 'Modification de la configuration SMTP du serveur e-mail', ip_address: '192.168.1.1', created_at: '2026-04-01T09:00:00Z' },
  { id: 'a10', user_name: 'Admin Principal', user_role: 'admin', action: 'create', resource: 'students', details: 'Import CSV: 85 nouveaux étudiants (L1 INFO, année 2026-2027)', ip_address: '192.168.1.10', created_at: '2026-04-01T08:00:00Z' },
  { id: 'a11', user_name: 'Super Admin', user_role: 'super_admin', action: 'update', resource: 'roles', details: 'Création du rôle "Agent Scolarité" avec permissions limitées', ip_address: '192.168.1.1', created_at: '2026-03-31T15:00:00Z' },
  { id: 'a12', user_name: 'AMEGAH Komi', user_role: 'student', action: 'login', resource: 'auth', details: 'Connexion échouée (mot de passe incorrect, tentative 3/5)', ip_address: '10.0.0.88', created_at: '2026-03-31T14:00:00Z' },
];

const ACTION_CONFIG = {
  login: { label: 'Connexion', color: 'info', icon: <LoginIcon fontSize="small" /> },
  create: { label: 'Création', color: 'success', icon: <AddIcon fontSize="small" /> },
  update: { label: 'Modification', color: 'warning', icon: <EditIcon fontSize="small" /> },
  delete: { label: 'Suppression', color: 'error', icon: <DeleteIcon fontSize="small" /> },
  generate: { label: 'Génération', color: 'primary', icon: <DocIcon fontSize="small" /> },
  validate: { label: 'Validation', color: 'success', icon: <SecurityIcon fontSize="small" /> },
  correction: { label: 'Correction', color: 'warning', icon: <EditIcon fontSize="small" /> },
  view: { label: 'Consultation', color: 'default', icon: <ViewIcon fontSize="small" /> },
};

const ROLE_CONFIG = {
  super_admin: { label: 'Super Admin', color: 'error' },
  admin: { label: 'Admin', color: 'warning' },
  professor: { label: 'Professeur', color: 'info' },
  student: { label: 'Étudiant', color: 'success' },
};

/**
 * Page d'audit log — ESGIS Campus §7
 * Journal complet de toutes les actions sensibles sur la plateforme
 */
const AuditLogPage = () => {
  const { authState } = useAuth();
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtres
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterResource, setFilterResource] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 15;

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await getAuditLogs({}, 1, 500);
      if (!error && data && data.length > 0) {
        setLogs(data);
      } else {
        setLogs(MOCK_AUDIT_LOGS);
      }
    } catch {
      setLogs(MOCK_AUDIT_LOGS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  // Appliquer les filtres
  useEffect(() => {
    let result = [...logs];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(l =>
        l.user_name?.toLowerCase().includes(s) ||
        l.details?.toLowerCase().includes(s) ||
        l.resource?.toLowerCase().includes(s)
      );
    }
    if (filterAction) result = result.filter(l => l.action === filterAction);
    if (filterRole) result = result.filter(l => l.user_role === filterRole);
    if (filterResource) result = result.filter(l => l.resource === filterResource);
    setFilteredLogs(result);
    setPage(1);
  }, [logs, search, filterAction, filterRole, filterResource]);

  const paginatedLogs = filteredLogs.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filteredLogs.length / perPage);

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy HH:mm:ss', { locale: fr });
    } catch { return dateString || '-'; }
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Utilisateur', 'Rôle', 'Action', 'Ressource', 'Détails', 'IP'];
    const rows = filteredLogs.map(l => [
      formatDate(l.created_at), l.user_name, l.user_role,
      l.action, l.resource, l.details, l.ip_address
    ]);
    const csv = [headers, ...rows].map(r => r.join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit_log_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const uniqueResources = [...new Set(logs.map(l => l.resource))].sort();

  return (
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <HistoryIcon sx={{ mr: 1, color: 'primary.main', fontSize: 32 }} />
          <Typography variant="h5" fontWeight="bold">Journal d'Audit</Typography>
        </Box>
        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExportCSV}>
          Exporter CSV
        </Button>
      </Box>

      {/* Statistiques rapides */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card elevation={1}>
            <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
              <Typography variant="caption" color="text.secondary">Total</Typography>
              <Typography variant="h4" fontWeight="bold" color="primary.main">{filteredLogs.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card elevation={1}>
            <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
              <Typography variant="caption" color="text.secondary">Connexions</Typography>
              <Typography variant="h4" fontWeight="bold" color="info.main">
                {filteredLogs.filter(l => l.action === 'login').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card elevation={1}>
            <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
              <Typography variant="caption" color="text.secondary">Modifications</Typography>
              <Typography variant="h4" fontWeight="bold" color="warning.main">
                {filteredLogs.filter(l => ['update', 'correction'].includes(l.action)).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card elevation={1}>
            <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
              <Typography variant="caption" color="text.secondary">Suppressions</Typography>
              <Typography variant="h4" fontWeight="bold" color="error.main">
                {filteredLogs.filter(l => l.action === 'delete').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtres */}
      <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <TextField size="small" fullWidth placeholder="Rechercher..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'grey.400' }} /> }} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <FormControl size="small" fullWidth>
              <InputLabel>Action</InputLabel>
              <Select value={filterAction} label="Action" onChange={(e) => setFilterAction(e.target.value)}>
                <MenuItem value="">Toutes</MenuItem>
                {Object.entries(ACTION_CONFIG).map(([key, cfg]) => (
                  <MenuItem key={key} value={key}>{cfg.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={3}>
            <FormControl size="small" fullWidth>
              <InputLabel>Rôle</InputLabel>
              <Select value={filterRole} label="Rôle" onChange={(e) => setFilterRole(e.target.value)}>
                <MenuItem value="">Tous</MenuItem>
                {Object.entries(ROLE_CONFIG).map(([key, cfg]) => (
                  <MenuItem key={key} value={key}>{cfg.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={3}>
            <FormControl size="small" fullWidth>
              <InputLabel>Ressource</InputLabel>
              <Select value={filterResource} label="Ressource" onChange={(e) => setFilterResource(e.target.value)}>
                <MenuItem value="">Toutes</MenuItem>
                {uniqueResources.map(r => (
                  <MenuItem key={r} value={r}>{r}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Tableau */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
      ) : (
        <>
          <TableContainer component={Paper} elevation={2}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#003366' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Date</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Utilisateur</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Action</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Ressource</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Détails</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>IP</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedLogs.map((log) => {
                  const actionCfg = ACTION_CONFIG[log.action] || { label: log.action, color: 'default', icon: null };
                  const roleCfg = ROLE_CONFIG[log.user_role] || { label: log.user_role, color: 'default' };
                  return (
                    <TableRow key={log.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace" fontSize="0.8rem">
                          {formatDate(log.created_at)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">{log.user_name}</Typography>
                          <Chip label={roleCfg.label} color={roleCfg.color} size="small" variant="outlined" />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip icon={actionCfg.icon} label={actionCfg.label} color={actionCfg.color} size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip label={log.resource} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 350, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {log.details}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace" fontSize="0.8rem" color="text.secondary">
                          {log.ip_address}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {paginatedLogs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">Aucun enregistrement trouvé</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default AuditLogPage;
