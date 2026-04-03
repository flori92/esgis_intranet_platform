import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, CircularProgress, Alert, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  Card, CardContent, Divider, Snackbar, IconButton, Tooltip,
  FormControl, InputLabel, Select, MenuItem, Pagination, Tabs, Tab
} from '@mui/material';
import {
  Payment as PaymentIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  HourglassEmpty as PendingIcon,
  Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon,
  Person as PersonIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';
import { getAllPaymentStatuses, recordPayment } from '@/api/payments';

const MOCK_PAYMENTS = [
  { id: 'p1', student_name: 'AGBEKO Kofi', filiere: 'L3 Informatique', montant_du: 850000, montant_paye: 850000, solde: 0, statut: 'payé', derniere_date: '2026-03-15', methode: 'Virement', reference: 'PAY-2026-001' },
  { id: 'p2', student_name: 'DOSSEH Ama', filiere: 'L2 Informatique', montant_du: 850000, montant_paye: 500000, solde: 350000, statut: 'partiel', derniere_date: '2026-02-28', methode: 'Espèces', reference: 'PAY-2026-002' },
  { id: 'p3', student_name: 'KPOMASSE Yao', filiere: 'L3 Informatique', montant_du: 850000, montant_paye: 0, solde: 850000, statut: 'impayé', derniere_date: null, methode: '-', reference: '-' },
  { id: 'p4', student_name: 'MENSAH Akossiwa', filiere: 'L2 Gestion', montant_du: 750000, montant_paye: 750000, solde: 0, statut: 'payé', derniere_date: '2026-01-20', methode: 'Mobile Money', reference: 'PAY-2026-004' },
  { id: 'p5', student_name: 'AMEGAH Komi', filiere: 'M1 Informatique', montant_du: 950000, montant_paye: 475000, solde: 475000, statut: 'partiel', derniere_date: '2026-03-01', methode: 'Chèque', reference: 'PAY-2026-005' },
  { id: 'p6', student_name: 'TOGBUI Edem', filiere: 'L1 Informatique', montant_du: 850000, montant_paye: 850000, solde: 0, statut: 'exonéré', derniere_date: '2026-01-05', methode: 'Bourse', reference: 'PAY-2026-006' },
];

const PAYMENT_METHODS = ['Espèces', 'Virement', 'Chèque', 'Mobile Money', 'Carte bancaire', 'Bourse'];

/**
 * Page de gestion des paiements — ESGIS Campus §5.2
 */
const PaymentsPage = () => {
  const { authState } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 15;
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  // Dialog versement
  const [paymentDialog, setPaymentDialog] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ montant: '', methode: 'Espèces', reference: '', date: new Date().toISOString().split('T')[0] });
  const [saving, setSaving] = useState(false);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await getAllPaymentStatuses();
      if (!error && data && data.length > 0) {
        setPayments(data);
      } else {
        setPayments(MOCK_PAYMENTS);
      }
    } catch {
      setPayments(MOCK_PAYMENTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  // Filtrage
  const filtered = payments.filter(p => {
    if (filterStatut && p.statut !== filterStatut) return false;
    if (search) {
      const s = search.toLowerCase();
      return p.student_name.toLowerCase().includes(s) || p.filiere.toLowerCase().includes(s) || p.reference.toLowerCase().includes(s);
    }
    return true;
  });

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  // Stats
  const totalDu = payments.reduce((s, p) => s + p.montant_du, 0);
  const totalPaye = payments.reduce((s, p) => s + p.montant_paye, 0);
  const totalSolde = payments.reduce((s, p) => s + p.solde, 0);
  const tauxRecouvrement = totalDu > 0 ? Math.round((totalPaye / totalDu) * 100) : 0;
  const countPaye = payments.filter(p => p.statut === 'payé' || p.statut === 'exonéré').length;
  const countPartiel = payments.filter(p => p.statut === 'partiel').length;
  const countImpaye = payments.filter(p => p.statut === 'impayé').length;

  const formatMoney = (v) => new Intl.NumberFormat('fr-FR').format(v) + ' XOF';
  const formatDate = (d) => { try { return format(new Date(d), 'dd MMM yyyy', { locale: fr }); } catch { return d || '-'; } };

  const getStatutChip = (statut) => {
    const cfg = {
      'payé': { icon: <CheckIcon />, color: 'success' },
      'partiel': { icon: <PendingIcon />, color: 'warning' },
      'impayé': { icon: <CancelIcon />, color: 'error' },
      'exonéré': { icon: <CheckIcon />, color: 'info' },
    };
    const c = cfg[statut] || { color: 'default' };
    return <Chip icon={c.icon} label={statut} size="small" color={c.color} />;
  };

  const handleRecordPayment = async () => {
    if (!paymentForm.montant || parseFloat(paymentForm.montant) <= 0) { setError('Montant invalide'); return; }
    setSaving(true);
    try {
      const amount = parseFloat(paymentForm.montant);
      const { error: paymentError } = await recordPayment({
        student_id: paymentDialog.student_id,
        montant: amount,
        methode: paymentForm.methode,
        reference: paymentForm.reference,
        date: paymentForm.date,
        academic_year: paymentDialog.annee_academique,
        semester: paymentDialog.semester,
        enregistre_par: authState.profile?.id || authState.user?.id || null,
      });

      if (paymentError) {
        throw paymentError;
      }

      await loadPayments();
      setPaymentDialog(null);
      setPaymentForm({ montant: '', methode: 'Espèces', reference: '', date: new Date().toISOString().split('T')[0] });
      setSuccessMessage(`Versement de ${formatMoney(amount)} enregistré.`);
    } catch (err) {
      setError(err.message || 'Impossible d’enregistrer le versement.');
    } finally {
      setSaving(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Étudiant', 'Filière', 'Montant dû', 'Montant payé', 'Solde', 'Statut', 'Dernière date', 'Méthode', 'Référence'];
    const rows = filtered.map(p => [p.student_name, p.filiere, p.montant_du, p.montant_paye, p.solde, p.statut, p.derniere_date || '-', p.methode, p.reference]);
    const csv = [headers, ...rows].map(r => r.join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `paiements_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <PaymentIcon sx={{ mr: 1, color: 'primary.main', fontSize: 32 }} />
          <Typography variant="h5" fontWeight="bold">Gestion des Paiements</Typography>
        </Box>
        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExportCSV}>Exporter CSV</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      <Snackbar open={!!successMessage} autoHideDuration={3000} onClose={() => setSuccessMessage('')} message={successMessage} />

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total dû', value: formatMoney(totalDu), color: 'primary', icon: <PaymentIcon /> },
          { label: 'Total encaissé', value: formatMoney(totalPaye), color: 'success', icon: <CheckIcon /> },
          { label: 'Restant à percevoir', value: formatMoney(totalSolde), color: 'error', icon: <PendingIcon /> },
          { label: 'Taux de recouvrement', value: `${tauxRecouvrement}%`, color: tauxRecouvrement >= 70 ? 'success' : 'warning', icon: <TrendingUpIcon /> },
        ].map((s, i) => (
          <Grid item xs={6} sm={3} key={i}>
            <Card elevation={2}>
              <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                <Box sx={{ color: `${s.color}.main`, mb: 0.5 }}>{s.icon}</Box>
                <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                <Typography variant="h6" fontWeight="bold" color={`${s.color}.main`}>{s.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        {[
          { label: 'À jour', count: countPaye, color: 'success' },
          { label: 'Partiel', count: countPartiel, color: 'warning' },
          { label: 'Impayé', count: countImpaye, color: 'error' },
        ].map((s, i) => (
          <Grid item xs={4} key={i}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center', py: 1 }}>
                <Typography variant="h5" fontWeight="bold" color={`${s.color}.main`}>{s.count}</Typography>
                <Typography variant="caption">{s.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filtres */}
      <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <TextField size="small" fullWidth placeholder="Rechercher un étudiant, une filière..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'grey.400' }} /> }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl size="small" fullWidth>
              <InputLabel>Statut</InputLabel>
              <Select value={filterStatut} label="Statut" onChange={(e) => setFilterStatut(e.target.value)}>
                <MenuItem value="">Tous</MenuItem>
                <MenuItem value="payé">Payé</MenuItem>
                <MenuItem value="partiel">Partiel</MenuItem>
                <MenuItem value="impayé">Impayé</MenuItem>
                <MenuItem value="exonéré">Exonéré</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Tableau */}
      <TableContainer component={Paper} elevation={2}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#003366' }}>
              {['Étudiant', 'Filière', 'Montant dû', 'Payé', 'Solde', 'Statut', 'Dernière date', 'Actions'].map(h => (
                <TableCell key={h} sx={{ color: 'white', fontWeight: 'bold' }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.map(p => (
              <TableRow key={p.id} hover>
                <TableCell><Typography fontWeight="bold" variant="body2">{p.student_name}</Typography></TableCell>
                <TableCell><Typography variant="body2">{p.filiere}</Typography></TableCell>
                <TableCell><Typography variant="body2">{formatMoney(p.montant_du)}</Typography></TableCell>
                <TableCell><Typography variant="body2" color="success.main" fontWeight="bold">{formatMoney(p.montant_paye)}</Typography></TableCell>
                <TableCell>
                  <Typography variant="body2" color={p.solde > 0 ? 'error.main' : 'success.main'} fontWeight="bold">
                    {formatMoney(p.solde)}
                  </Typography>
                </TableCell>
                <TableCell>{getStatutChip(p.statut)}</TableCell>
                <TableCell><Typography variant="body2">{formatDate(p.derniere_date)}</Typography></TableCell>
                <TableCell>
                  <Tooltip title="Enregistrer un versement">
                    <IconButton size="small" color="primary" onClick={() => setPaymentDialog(p)} disabled={p.solde === 0}>
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Imprimer le reçu">
                    <IconButton size="small"><ReceiptIcon fontSize="small" /></IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" />
        </Box>
      )}

      {/* Dialog versement */}
      <Dialog open={!!paymentDialog} onClose={() => setPaymentDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Enregistrer un versement</DialogTitle>
        <DialogContent>
          {paymentDialog && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" gutterBottom>
                <strong>{paymentDialog.student_name}</strong> — Solde restant : <strong style={{ color: '#d32f2f' }}>{formatMoney(paymentDialog.solde)}</strong>
              </Typography>
              <Divider sx={{ my: 1 }} />
              <TextField label="Montant (XOF)" type="number" fullWidth sx={{ mt: 1 }}
                value={paymentForm.montant}
                onChange={(e) => setPaymentForm(p => ({ ...p, montant: e.target.value }))}
                inputProps={{ min: 1, max: paymentDialog.solde }} />
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Méthode</InputLabel>
                <Select value={paymentForm.methode} label="Méthode"
                  onChange={(e) => setPaymentForm(p => ({ ...p, methode: e.target.value }))}>
                  {PAYMENT_METHODS.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField label="Référence" fullWidth sx={{ mt: 2 }} value={paymentForm.reference}
                onChange={(e) => setPaymentForm(p => ({ ...p, reference: e.target.value }))} />
              <TextField label="Date" type="date" fullWidth sx={{ mt: 2 }} value={paymentForm.date}
                onChange={(e) => setPaymentForm(p => ({ ...p, date: e.target.value }))}
                InputLabelProps={{ shrink: true }} />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialog(null)}>Annuler</Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={handleRecordPayment} disabled={saving}>
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaymentsPage;
