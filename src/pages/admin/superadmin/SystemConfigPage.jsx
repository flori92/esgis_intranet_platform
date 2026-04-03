import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, CircularProgress, Alert, Button,
  TextField, Chip, Divider, Snackbar, Card, CardContent, Switch,
  FormControlLabel, Tabs, Tab, IconButton, Avatar
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Save as SaveIcon,
  Palette as PaletteIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Storage as StorageIcon,
  Speed as SpeedIcon,
  People as PeopleIcon,
  Backup as BackupIcon,
  Upload as UploadIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useAuth } from '@/context/AuthContext';
import { getSystemConfig, saveAllConfig } from '@/api/admin';

const MOCK_CONFIG = {
  institution: {
    name: 'ESGIS',
    full_name: 'École Supérieure de Gestion d\'Informatique et des Sciences',
    address: 'Boulevard du 13 Janvier, Lomé, Togo',
    phone: '+228 22 21 00 00',
    email: 'contact@esgis.org',
    website: 'www.esgis.org',
    logo_url: '/images/esgis-logo.png',
    director_name: 'Prof. AMETOWOYONA Kossi',
    director_title: 'Directeur Général',
    legal_info: 'Établissement privé d\'enseignement supérieur — Agrément N° 2015/0042/MESR',
    academic_year: '2025-2026',
  },
  appearance: {
    primary_color: '#003366',
    secondary_color: '#CC0000',
    accent_color: '#FFC107',
    font_family: 'Montserrat',
    dark_mode_available: false,
  },
  smtp: {
    host: 'smtp.gmail.com',
    port: '587',
    user: 'noreply@esgis.org',
    from_name: 'ESGIS Campus',
    tls_enabled: true,
  },
  sms: {
    provider: 'Twilio',
    api_key: '****',
    sender_id: 'ESGIS',
    enabled: false,
  },
  security: {
    session_timeout_minutes: 30,
    max_login_attempts: 5,
    two_factor_admin: true,
    two_factor_professor: false,
    password_min_length: 8,
    password_require_special: true,
  },
  storage: {
    provider: 'Supabase Storage',
    max_file_size_mb: 50,
    allowed_extensions: 'pdf,doc,docx,ppt,pptx,xls,xlsx,zip,mp4,jpg,png',
  },
  monitoring: {
    uptime: '99.7%',
    avg_response_time: '120ms',
    active_users: 342,
    total_users: 520,
    storage_used_gb: 12.4,
    storage_total_gb: 50,
    last_backup: '2026-04-03T02:00:00Z',
  }
};

/**
 * Page Configuration Système — ESGIS Campus §7
 */
const SystemConfigPage = () => {
  const { authState } = useAuth();
  const [config, setConfig] = useState(MOCK_CONFIG);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadConfig = async () => {
      setLoading(true);
      try {
        const { data, error } = await getSystemConfig();
        if (!error && data && Object.keys(data).length > 0) {
          setConfig(prev => ({
            institution: data.institution || prev.institution,
            appearance: data.appearance || prev.appearance,
            smtp: data.smtp || prev.smtp,
            sms: data.sms || prev.sms,
            security: data.security || prev.security,
            storage: data.storage || prev.storage,
            monitoring: data.monitoring || prev.monitoring,
          }));
        }
      } catch (err) {
        console.error('Erreur chargement config:', err);
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, []);

  const updateConfig = (section, field, value) => {
    setConfig(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: value }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await saveAllConfig(config, authState.user?.id);
      if (error) throw error;
      setSuccessMessage('Configuration sauvegardée.');
    } catch (err) {
      setError('Erreur lors de la sauvegarde: ' + (err.message || ''));
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (d) => {
    try { return new Date(d).toLocaleString('fr-FR'); } catch { return d || '-'; }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <SettingsIcon sx={{ mr: 1, color: 'primary.main', fontSize: 32 }} />
          <Typography variant="h5" fontWeight="bold">Configuration Système</Typography>
        </Box>
        <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving}>
          {saving ? 'Sauvegarde...' : 'Sauvegarder tout'}
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      <Snackbar open={!!successMessage} autoHideDuration={3000} onClose={() => setSuccessMessage('')} message={successMessage} />

      <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 3 }} variant="scrollable" scrollButtons="auto">
        <Tab icon={<BusinessIcon />} label="Établissement" iconPosition="start" />
        <Tab icon={<PaletteIcon />} label="Apparence" iconPosition="start" />
        <Tab icon={<EmailIcon />} label="E-mail & SMS" iconPosition="start" />
        <Tab icon={<SettingsIcon />} label="Sécurité" iconPosition="start" />
        <Tab icon={<SpeedIcon />} label="Monitoring" iconPosition="start" />
      </Tabs>

      {/* === Onglet 0: Établissement === */}
      {tabValue === 0 && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>Informations de l'établissement</Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField label="Nom court" fullWidth value={config.institution.name}
                onChange={(e) => updateConfig('institution', 'name', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Nom complet" fullWidth value={config.institution.full_name}
                onChange={(e) => updateConfig('institution', 'full_name', e.target.value)} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Adresse" fullWidth value={config.institution.address}
                onChange={(e) => updateConfig('institution', 'address', e.target.value)} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Téléphone" fullWidth value={config.institution.phone}
                onChange={(e) => updateConfig('institution', 'phone', e.target.value)} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="E-mail" fullWidth value={config.institution.email}
                onChange={(e) => updateConfig('institution', 'email', e.target.value)} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Site web" fullWidth value={config.institution.website}
                onChange={(e) => updateConfig('institution', 'website', e.target.value)} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Année académique" fullWidth value={config.institution.academic_year}
                onChange={(e) => updateConfig('institution', 'academic_year', e.target.value)} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Nom du directeur" fullWidth value={config.institution.director_name}
                onChange={(e) => updateConfig('institution', 'director_name', e.target.value)} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Titre du directeur" fullWidth value={config.institution.director_title}
                onChange={(e) => updateConfig('institution', 'director_title', e.target.value)} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Informations légales (pour les documents officiels)" fullWidth multiline rows={2}
                value={config.institution.legal_info}
                onChange={(e) => updateConfig('institution', 'legal_info', e.target.value)} />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>Logo de l'établissement</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar src={config.institution.logo_url} sx={{ width: 64, height: 64 }} variant="rounded" />
                <Button variant="outlined" startIcon={<UploadIcon />}>Changer le logo</Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* === Onglet 1: Apparence === */}
      {tabValue === 1 && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>Personnalisation de l'apparence</Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <TextField label="Couleur primaire" fullWidth type="color" value={config.appearance.primary_color}
                onChange={(e) => updateConfig('appearance', 'primary_color', e.target.value)}
                InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Couleur secondaire" fullWidth type="color" value={config.appearance.secondary_color}
                onChange={(e) => updateConfig('appearance', 'secondary_color', e.target.value)}
                InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Couleur d'accent" fullWidth type="color" value={config.appearance.accent_color}
                onChange={(e) => updateConfig('appearance', 'accent_color', e.target.value)}
                InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Police de caractères" fullWidth value={config.appearance.font_family}
                onChange={(e) => updateConfig('appearance', 'font_family', e.target.value)} />
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel
                control={<Switch checked={config.appearance.dark_mode_available}
                  onChange={(e) => updateConfig('appearance', 'dark_mode_available', e.target.checked)} />}
                label="Mode sombre disponible" />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>Aperçu</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip label="Primaire" sx={{ bgcolor: config.appearance.primary_color, color: 'white' }} />
                <Chip label="Secondaire" sx={{ bgcolor: config.appearance.secondary_color, color: 'white' }} />
                <Chip label="Accent" sx={{ bgcolor: config.appearance.accent_color, color: 'black' }} />
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* === Onglet 2: E-mail & SMS === */}
      {tabValue === 2 && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>Configuration E-mail (SMTP)</Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={8}><TextField label="Serveur SMTP" fullWidth value={config.smtp.host}
              onChange={(e) => updateConfig('smtp', 'host', e.target.value)} /></Grid>
            <Grid item xs={4}><TextField label="Port" fullWidth value={config.smtp.port}
              onChange={(e) => updateConfig('smtp', 'port', e.target.value)} /></Grid>
            <Grid item xs={6}><TextField label="Utilisateur" fullWidth value={config.smtp.user}
              onChange={(e) => updateConfig('smtp', 'user', e.target.value)} /></Grid>
            <Grid item xs={6}><TextField label="Nom d'expédition" fullWidth value={config.smtp.from_name}
              onChange={(e) => updateConfig('smtp', 'from_name', e.target.value)} /></Grid>
            <Grid item xs={12}>
              <FormControlLabel control={<Switch checked={config.smtp.tls_enabled}
                onChange={(e) => updateConfig('smtp', 'tls_enabled', e.target.checked)} />}
                label="TLS activé" />
            </Grid>
          </Grid>
          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" fontWeight="bold" gutterBottom>Passerelle SMS</Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}><TextField label="Fournisseur" fullWidth value={config.sms.provider}
              onChange={(e) => updateConfig('sms', 'provider', e.target.value)} /></Grid>
            <Grid item xs={6}><TextField label="Sender ID" fullWidth value={config.sms.sender_id}
              onChange={(e) => updateConfig('sms', 'sender_id', e.target.value)} /></Grid>
            <Grid item xs={12}>
              <FormControlLabel control={<Switch checked={config.sms.enabled}
                onChange={(e) => updateConfig('sms', 'enabled', e.target.checked)} />}
                label="SMS activé (événements critiques uniquement)" />
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* === Onglet 3: Sécurité === */}
      {tabValue === 3 && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>Paramètres de sécurité</Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField label="Expiration de session (minutes)" type="number" fullWidth
                value={config.security.session_timeout_minutes}
                onChange={(e) => updateConfig('security', 'session_timeout_minutes', parseInt(e.target.value) || 30)} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Tentatives de connexion max" type="number" fullWidth
                value={config.security.max_login_attempts}
                onChange={(e) => updateConfig('security', 'max_login_attempts', parseInt(e.target.value) || 5)} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Longueur min. du mot de passe" type="number" fullWidth
                value={config.security.password_min_length}
                onChange={(e) => updateConfig('security', 'password_min_length', parseInt(e.target.value) || 8)} />
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel control={<Switch checked={config.security.password_require_special}
                onChange={(e) => updateConfig('security', 'password_require_special', e.target.checked)} />}
                label="Caractère spécial obligatoire" />
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel control={<Switch checked={config.security.two_factor_admin}
                onChange={(e) => updateConfig('security', 'two_factor_admin', e.target.checked)} />}
                label="2FA obligatoire pour les administrateurs" />
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel control={<Switch checked={config.security.two_factor_professor}
                onChange={(e) => updateConfig('security', 'two_factor_professor', e.target.checked)} />}
                label="2FA disponible pour les professeurs" />
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* === Onglet 4: Monitoring === */}
      {tabValue === 4 && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>Monitoring Système</Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            {[
              { label: 'Disponibilité', value: config.monitoring.uptime, icon: <SpeedIcon />, color: 'success' },
              { label: 'Temps de réponse moyen', value: config.monitoring.avg_response_time, icon: <SpeedIcon />, color: 'info' },
              { label: 'Utilisateurs connectés', value: config.monitoring.active_users, icon: <PeopleIcon />, color: 'primary' },
              { label: 'Total utilisateurs', value: config.monitoring.total_users, icon: <PeopleIcon />, color: 'default' },
              { label: 'Stockage utilisé', value: `${config.monitoring.storage_used_gb} / ${config.monitoring.storage_total_gb} Go`, icon: <StorageIcon />, color: 'warning' },
              { label: 'Dernière sauvegarde', value: formatDate(config.monitoring.last_backup), icon: <BackupIcon />, color: 'info' },
            ].map((m, i) => (
              <Grid item xs={6} sm={4} key={i}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                    <Box sx={{ color: `${m.color}.main`, mb: 0.5 }}>{m.icon}</Box>
                    <Typography variant="caption" color="text.secondary">{m.label}</Typography>
                    <Typography variant="h6" fontWeight="bold">{m.value}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button variant="contained" startIcon={<BackupIcon />} color="warning">
              Déclencher une sauvegarde manuelle
            </Button>
            <Button variant="outlined" startIcon={<RefreshIcon />}>
              Rafraîchir les métriques
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default SystemConfigPage;
