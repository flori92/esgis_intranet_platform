import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
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
  Grid,
  MenuItem,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { supabase } from '@/supabase';
import { useAuth } from '../../hooks/useAuth';

const RESOURCE_TYPES = [
  'student',
  'professor',
  'department',
  'course',
  'grade',
  'exam',
  'attendance',
];

const ACTION_TYPES = [
  'create',
  'update',
  'delete',
  'view',
  'grade',
  'submit',
];

export default function AuditLogPage() {
  const { authState } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterResource, setFilterResource] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');

  // Fetch audit logs
  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError('');

      let query = supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      // Apply date filters
      if (startDate) {
        query = query.gte('created_at', new Date(startDate).toISOString());
      }
      if (endDate) {
        const nextDay = new Date(endDate);
        nextDay.setDate(nextDay.getDate() + 1);
        query = query.lt('created_at', nextDay.toISOString());
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setLogs(data || []);
    } catch (err) {
      setError(`Error loading logs: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Filter logs client-side for multi-criteria search
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      (log.user_id && log.user_id.toString().includes(searchQuery)) ||
      (log.description && log.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.resource_id && log.resource_id.toString().includes(searchQuery));

    const matchesAction = !filterAction || log.action === filterAction;
    const matchesResource = !filterResource || log.resource_type === filterResource;

    return matchesSearch && matchesAction && matchesResource;
  });

  const handleExport = () => {
    try {
      const csv = [
        ['Date', 'Utilisateur', 'Action', 'Ressource', 'ID', 'Description'],
        ...filteredLogs.map((log) => [
          new Date(log.created_at).toLocaleString('fr-FR'),
          log.user_id || '-',
          log.action || '-',
          log.resource_type || '-',
          log.resource_id || '-',
          log.description || '-',
        ]),
      ]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_log_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(`Export failed: ${err.message}`);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getActionColor = (action) => {
    const colors = {
      create: 'success',
      update: 'info',
      delete: 'error',
      view: 'default',
      grade: 'warning',
      submit: 'info',
    };
    return colors[action] || 'default';
  };

  const getResourceColor = (resource) => {
    const colors = {
      student: 'primary',
      professor: 'secondary',
      department: 'success',
      course: 'info',
      grade: 'warning',
      exam: 'error',
      attendance: 'default',
    };
    return colors[resource] || 'default';
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
          title="Journal d'Audit"
          action={
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchLogs}
              >
                Actualiser
              </Button>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleExport}
                disabled={filteredLogs.length === 0}
              >
                Exporter
              </Button>
            </Stack>
          }
        />
        <CardContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {/* Filters */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1 }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                select
                size="small"
                label="Action"
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
              >
                <MenuItem value="">-- Toutes --</MenuItem>
                {ACTION_TYPES.map((action) => (
                  <MenuItem key={action} value={action}>
                    {action.charAt(0).toUpperCase() + action.slice(1)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                select
                size="small"
                label="Ressource"
                value={filterResource}
                onChange={(e) => setFilterResource(e.target.value)}
              >
                <MenuItem value="">-- Toutes --</MenuItem>
                {RESOURCE_TYPES.map((resource) => (
                  <MenuItem key={resource} value={resource}>
                    {resource.charAt(0).toUpperCase() + resource.slice(1)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                type="date"
                size="small"
                label="Du"
                InputLabelProps={{ shrink: true }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                type="date"
                size="small"
                label="Au"
                InputLabelProps={{ shrink: true }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </Grid>
          </Grid>

          {/* Table */}
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell><strong>Date/Heure</strong></TableCell>
                  <TableCell><strong>Utilisateur</strong></TableCell>
                  <TableCell><strong>Action</strong></TableCell>
                  <TableCell><strong>Ressource</strong></TableCell>
                  <TableCell><strong>ID Ressource</strong></TableCell>
                  <TableCell><strong>Description</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id} hover>
                      <TableCell sx={{ fontSize: '0.85rem' }}>
                        {formatDate(log.created_at)}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>
                        <Chip
                          label={String(log.user_id || 'N/A').substring(0, 8)}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={log.action || '-'}
                          size="small"
                          color={getActionColor(log.action)}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={log.resource_type || '-'}
                          size="small"
                          color={getResourceColor(log.resource_type)}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>
                        {log.resource_id || '-'}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.85rem' }}>
                        {log.description || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography color="textSecondary">Aucune entrée trouvée</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Typography sx={{ mt: 2 }} color="textSecondary" variant="body2">
            Affichage: {filteredLogs.length} entrées sur {logs.length} total
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
