import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Paper, Grid, CircularProgress, Alert, Button,
  TextField, Avatar, Divider, Tabs, Tab, Switch, FormControlLabel,
  Card, CardContent, Snackbar, IconButton, Chip, FormControl,
  InputLabel, Select, MenuItem
} from '@mui/material';
import {
  Person as PersonIcon,
  Settings as SettingsIcon,
  Lock as LockIcon,
  Notifications as NotificationsIcon,
  Language as LanguageIcon,
  PhotoCamera as PhotoCameraIcon,
  Save as SaveIcon,
  Upload as UploadIcon,
  Description as DescriptionIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { useAuth } from '@/context/AuthContext';
import {
  getProfileSettings,
  updateCurrentUserPassword,
  updateProfileSettings,
  uploadProfileAvatar,
  uploadStudentCv
} from '@/api/profile';

/**
 * Page Profil & Paramètres — ESGIS Campus §3.9
 * Commune à tous les rôles (étudiant, professeur, admin)
 */
const ProfileSettingsPage = () => {
  const { authState, updateProfile } = useAuth();
  const { user, profile, isAdmin, isProfessor, isStudent } = authState;
  const currentProfileId = profile?.id || user?.id || null;
  const fileInputRef = useRef(null);
  const cvInputRef = useRef(null);

  const [tabValue, setTabValue] = useState(0);

  // Profil
  const [profileData, setProfileData] = useState({
    first_name: '', last_name: '', phone: '', address: '',
    bio: '', birth_date: '', secondary_email: ''
  });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [cvFile, setCvFile] = useState(null);
  const [cvUrl, setCvUrl] = useState('');

  // Mot de passe
  const [passwordData, setPasswordData] = useState({
    currentPassword: '', newPassword: '', confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });

  // Notifications
  const [notifPrefs, setNotifPrefs] = useState({
    push_enabled: true, email_enabled: true, sms_enabled: false,
    email_digest: 'immediate',
    notify_new_grade: true, notify_new_exam: true,
    notify_new_document: true, notify_new_message: true,
    notify_schedule_change: true, notify_internship: true,
  });

  // Langue
  const [language, setLanguage] = useState('fr');

  // UI
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        if (!user || !currentProfileId) {
          return;
        }

        const { profile: detailedProfile, error: profileError } = await getProfileSettings(currentProfileId);

        if (!profileError && detailedProfile) {
          setProfileData({
            first_name: detailedProfile.first_name || '',
            last_name: detailedProfile.last_name || '',
            phone: detailedProfile.phone || '',
            address: detailedProfile.address || '',
            bio: detailedProfile.bio || '',
            birth_date: detailedProfile.birth_date || '',
            secondary_email: detailedProfile.secondary_email || '',
          });
          setAvatarPreview(detailedProfile.avatar_url || null);
          setCvUrl(detailedProfile.cv_url || '');
          if (detailedProfile.notification_preferences) {
            setNotifPrefs(prev => ({ ...prev, ...detailedProfile.notification_preferences }));
          }
          if (detailedProfile.language) {
            setLanguage(detailedProfile.language);
          }
        } else if (profile) {
          setProfileData(prev => ({
            ...prev,
            first_name: profile.first_name || profile.full_name?.split(' ')[0] || '',
            last_name: profile.last_name || profile.full_name?.split(' ').slice(1).join(' ') || '',
          }));
          setAvatarPreview(profile.avatar_url || null);
        }
      } catch (err) {
        console.error('Erreur chargement profil:', err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [user, profile, currentProfileId]);

  const handleAvatarChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('La photo ne doit pas dépasser 5 Mo.'); return; }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleCvChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError('Le CV ne doit pas dépasser 10 Mo.'); return; }
    setCvFile(file);
    setSuccessMessage(`CV "${file.name}" sélectionné. Cliquez sur Sauvegarder.`);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setError(null);
    try {
      if (!currentProfileId) {
        throw new Error('Profil introuvable');
      }

      let avatarUrl = avatarPreview;
      let newCvUrl = cvUrl;

      if (avatarFile) {
        const { url, error: uploadError } = await uploadProfileAvatar(currentProfileId, avatarFile);
        if (uploadError) {
          throw uploadError;
        }
        avatarUrl = url;
      }

      if (cvFile) {
        const { url, error: uploadError } = await uploadStudentCv(currentProfileId, cvFile);
        if (uploadError) {
          throw uploadError;
        }
        newCvUrl = url;
      }

      const { error: updateError } = await updateProfileSettings(currentProfileId, {
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        phone: profileData.phone,
        address: profileData.address,
        bio: profileData.bio,
        birth_date: profileData.birth_date || null,
        secondary_email: profileData.secondary_email,
        avatar_url: avatarUrl,
        cv_url: newCvUrl,
        notification_preferences: notifPrefs,
        language
      });

      if (updateError) throw updateError;

      if (updateProfile) {
        await updateProfile({
          full_name: `${profileData.first_name} ${profileData.last_name}`,
          avatar_url: avatarUrl,
        });
      }

      setAvatarFile(null);
      setCvFile(null);
      setCvUrl(newCvUrl);
      setSuccessMessage('Profil mis à jour avec succès.');
    } catch (err) {
      setError('Erreur lors de la mise à jour: ' + (err.message || 'Erreur inconnue'));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.'); return;
    }
    if (passwordData.newPassword.length < 8) {
      setError('Le nouveau mot de passe doit contenir au moins 8 caractères.'); return;
    }
    setSaving(true);
    setError(null);
    try {
      const { error } = await updateCurrentUserPassword(passwordData.newPassword);
      if (error) throw error;
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setSuccessMessage('Mot de passe modifié avec succès.');
    } catch (err) {
      setError('Erreur: ' + (err.message || 'Erreur inconnue'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      if (!currentProfileId) {
        throw new Error('Profil introuvable');
      }

      const { error } = await updateProfileSettings(currentProfileId, {
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        phone: profileData.phone,
        address: profileData.address,
        bio: profileData.bio,
        birth_date: profileData.birth_date || null,
        secondary_email: profileData.secondary_email,
        avatar_url: avatarPreview,
        cv_url: cvUrl,
        notification_preferences: notifPrefs,
        language
      });

      if (error) {
        throw error;
      }
      setSuccessMessage('Préférences sauvegardées.');
    } catch (err) {
      setError('Erreur: ' + (err.message || ''));
    } finally {
      setSaving(false);
    }
  };

  const getRoleLabel = () => {
    if (isAdmin) return 'Administrateur';
    if (isProfessor) return 'Professeur';
    return 'Étudiant';
  };

  const getRoleColor = () => {
    if (isAdmin) return 'error';
    if (isProfessor) return 'info';
    return 'success';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, md: 2 }, maxWidth: 900, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <SettingsIcon sx={{ mr: 1, color: 'primary.main', fontSize: 32 }} />
        <Typography variant="h5" fontWeight="bold">Mon Profil & Paramètres</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      <Snackbar open={!!successMessage} autoHideDuration={4000} onClose={() => setSuccessMessage('')} message={successMessage} />

      {/* Carte profil résumé */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
        <Box sx={{ position: 'relative' }}>
          <Avatar
            src={avatarPreview}
            alt={`${profileData.first_name} ${profileData.last_name}`}
            sx={{ width: 100, height: 100, bgcolor: '#CC0000', fontSize: '2rem' }}
          >
            {profileData.first_name?.[0]}{profileData.last_name?.[0]}
          </Avatar>
          <IconButton
            sx={{
              position: 'absolute', bottom: -4, right: -4,
              bgcolor: 'primary.main', color: 'white',
              '&:hover': { bgcolor: 'primary.dark' }, width: 32, height: 32
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <PhotoCameraIcon fontSize="small" />
          </IconButton>
          <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" fontWeight="bold">
            {profileData.first_name} {profileData.last_name}
          </Typography>
          <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
          <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
            <Chip label={getRoleLabel()} color={getRoleColor()} size="small" />
          </Box>
        </Box>
      </Paper>

      {/* Onglets */}
      <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 3 }} variant="scrollable" scrollButtons="auto">
        <Tab icon={<PersonIcon />} label="Informations" iconPosition="start" />
        <Tab icon={<LockIcon />} label="Sécurité" iconPosition="start" />
        <Tab icon={<NotificationsIcon />} label="Notifications" iconPosition="start" />
        <Tab icon={<LanguageIcon />} label="Préférences" iconPosition="start" />
      </Tabs>

      {/* === ONGLET 0 : Informations personnelles === */}
      {tabValue === 0 && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>Informations personnelles</Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField label="Prénom" fullWidth value={profileData.first_name}
                onChange={(e) => setProfileData(p => ({ ...p, first_name: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Nom" fullWidth value={profileData.last_name}
                onChange={(e) => setProfileData(p => ({ ...p, last_name: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Téléphone" fullWidth value={profileData.phone}
                onChange={(e) => setProfileData(p => ({ ...p, phone: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="E-mail secondaire" fullWidth type="email" value={profileData.secondary_email}
                onChange={(e) => setProfileData(p => ({ ...p, secondary_email: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Date de naissance" fullWidth type="date" value={profileData.birth_date}
                onChange={(e) => setProfileData(p => ({ ...p, birth_date: e.target.value }))}
                InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Adresse" fullWidth value={profileData.address}
                onChange={(e) => setProfileData(p => ({ ...p, address: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Biographie / Description" fullWidth multiline rows={3}
                value={profileData.bio}
                onChange={(e) => setProfileData(p => ({ ...p, bio: e.target.value }))} />
            </Grid>
            {isStudent && (
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Curriculum Vitae</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Button variant="outlined" startIcon={<UploadIcon />}
                    onClick={() => cvInputRef.current?.click()}>
                    {cvUrl ? 'Mettre à jour le CV' : 'Téléverser mon CV'}
                  </Button>
                  <input ref={cvInputRef} type="file" accept=".pdf,.doc,.docx" hidden onChange={handleCvChange} />
                  {(cvUrl || cvFile) && (
                    <Chip icon={<DescriptionIcon />}
                      label={cvFile ? cvFile.name : 'CV téléversé'} color="success" variant="outlined"
                      onDelete={cvFile ? () => setCvFile(null) : undefined} />
                  )}
                </Box>
              </Grid>
            )}
          </Grid>
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveProfile}
              disabled={saving} size="large">
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </Box>
        </Paper>
      )}

      {/* === ONGLET 1 : Sécurité === */}
      {tabValue === 1 && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>Changer le mot de passe</Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2} sx={{ maxWidth: 500 }}>
            <Grid item xs={12}>
              <TextField label="Mot de passe actuel" fullWidth
                type={showPasswords.current ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(p => ({ ...p, currentPassword: e.target.value }))}
                InputProps={{
                  endAdornment: (
                    <IconButton onClick={() => setShowPasswords(p => ({ ...p, current: !p.current }))}>
                      {showPasswords.current ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  )
                }} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Nouveau mot de passe" fullWidth helperText="Minimum 8 caractères"
                type={showPasswords.new ? 'text' : 'password'}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(p => ({ ...p, newPassword: e.target.value }))}
                InputProps={{
                  endAdornment: (
                    <IconButton onClick={() => setShowPasswords(p => ({ ...p, new: !p.new }))}>
                      {showPasswords.new ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  )
                }} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Confirmer le nouveau mot de passe" fullWidth
                type={showPasswords.confirm ? 'text' : 'password'}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(p => ({ ...p, confirmPassword: e.target.value }))}
                error={!!passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword}
                helperText={passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword ? 'Les mots de passe ne correspondent pas' : ''}
                InputProps={{
                  endAdornment: (
                    <IconButton onClick={() => setShowPasswords(p => ({ ...p, confirm: !p.confirm }))}>
                      {showPasswords.confirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  )
                }} />
            </Grid>
          </Grid>
          <Box sx={{ mt: 3 }}>
            <Button variant="contained" startIcon={<LockIcon />} onClick={handleChangePassword}
              disabled={saving || !passwordData.newPassword || !passwordData.confirmPassword}>
              {saving ? 'Modification...' : 'Modifier le mot de passe'}
            </Button>
          </Box>
        </Paper>
      )}

      {/* === ONGLET 2 : Notifications === */}
      {tabValue === 2 && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>Préférences de notification</Typography>
          <Divider sx={{ mb: 2 }} />

          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>Canaux</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 2 }}>
            <FormControlLabel
              control={<Switch checked={notifPrefs.push_enabled}
                onChange={(e) => setNotifPrefs(p => ({ ...p, push_enabled: e.target.checked }))} />}
              label="Notifications push (navigateur/mobile)" />
            <FormControlLabel
              control={<Switch checked={notifPrefs.email_enabled}
                onChange={(e) => setNotifPrefs(p => ({ ...p, email_enabled: e.target.checked }))} />}
              label="Notifications par e-mail" />
            <FormControlLabel
              control={<Switch checked={notifPrefs.sms_enabled}
                onChange={(e) => setNotifPrefs(p => ({ ...p, sms_enabled: e.target.checked }))} />}
              label="Notifications par SMS (événements critiques uniquement)" />
          </Box>

          {notifPrefs.email_enabled && (
            <FormControl size="small" sx={{ mb: 3, minWidth: 250 }}>
              <InputLabel>Fréquence e-mail</InputLabel>
              <Select value={notifPrefs.email_digest} label="Fréquence e-mail"
                onChange={(e) => setNotifPrefs(p => ({ ...p, email_digest: e.target.value }))}>
                <MenuItem value="immediate">Immédiate</MenuItem>
                <MenuItem value="daily">Résumé quotidien</MenuItem>
                <MenuItem value="weekly">Résumé hebdomadaire</MenuItem>
              </Select>
            </FormControl>
          )}

          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>Types d'alertes</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <FormControlLabel
              control={<Switch checked={notifPrefs.notify_new_grade}
                onChange={(e) => setNotifPrefs(p => ({ ...p, notify_new_grade: e.target.checked }))} />}
              label="Nouvelle note publiée" />
            <FormControlLabel
              control={<Switch checked={notifPrefs.notify_new_exam}
                onChange={(e) => setNotifPrefs(p => ({ ...p, notify_new_exam: e.target.checked }))} />}
              label="Nouvel examen planifié" />
            <FormControlLabel
              control={<Switch checked={notifPrefs.notify_new_document}
                onChange={(e) => setNotifPrefs(p => ({ ...p, notify_new_document: e.target.checked }))} />}
              label="Nouveau document déposé" />
            <FormControlLabel
              control={<Switch checked={notifPrefs.notify_new_message}
                onChange={(e) => setNotifPrefs(p => ({ ...p, notify_new_message: e.target.checked }))} />}
              label="Nouveau message reçu" />
            <FormControlLabel
              control={<Switch checked={notifPrefs.notify_schedule_change}
                onChange={(e) => setNotifPrefs(p => ({ ...p, notify_schedule_change: e.target.checked }))} />}
              label="Modification d'emploi du temps" />
            <FormControlLabel
              control={<Switch checked={notifPrefs.notify_internship}
                onChange={(e) => setNotifPrefs(p => ({ ...p, notify_internship: e.target.checked }))} />}
              label="Nouvelle offre de stage correspondant à mon profil" />
          </Box>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveNotifications}
              disabled={saving}>
              {saving ? 'Sauvegarde...' : 'Sauvegarder les préférences'}
            </Button>
          </Box>
        </Paper>
      )}

      {/* === ONGLET 3 : Préférences === */}
      {tabValue === 3 && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>Préférences d'affichage</Typography>
          <Divider sx={{ mb: 2 }} />

          <FormControl sx={{ minWidth: 250 }}>
            <InputLabel>Langue de l'interface</InputLabel>
            <Select value={language} label="Langue de l'interface"
              onChange={(e) => setLanguage(e.target.value)}>
              <MenuItem value="fr">Français</MenuItem>
              <MenuItem value="en">English</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveNotifications}
              disabled={saving}>
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default ProfileSettingsPage;
