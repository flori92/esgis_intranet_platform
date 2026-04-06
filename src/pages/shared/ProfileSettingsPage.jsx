import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Paper, Grid, CircularProgress, Alert, Button,
  TextField, Avatar, Divider, Tabs, Tab, Switch, FormControlLabel,
  Card, CardContent, Snackbar, IconButton, Chip, FormControl,
  InputLabel, Select, MenuItem, Stack, alpha
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
    <Box sx={{ 
      p: { xs: 2, md: 4 }, 
      maxWidth: 1000, 
      mx: 'auto',
      animation: 'fadeIn 0.5s ease-out',
      '@keyframes fadeIn': {
        from: { opacity: 0, transform: 'translateY(10px)' },
        to: { opacity: 1, transform: 'translateY(0)' }
      }
    }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="900" sx={{ letterSpacing: '-0.5px' }}>
          Profil & Paramètres
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gérez vos informations personnelles et configurez vos préférences de compte.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError(null)} variant="filled">{error}</Alert>}
      <Snackbar open={!!successMessage} autoHideDuration={4000} onClose={() => setSuccessMessage('')} message={successMessage} />

      <Grid container spacing={4}>
        {/* Colonne Gauche: Résumé Profil */}
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            borderRadius: 5, 
            boxShadow: '0 8px 30px rgba(0,0,0,0.05)',
            textAlign: 'center',
            p: 4,
            height: '100%',
            backgroundColor: 'white',
            border: '1px solid',
            borderColor: 'divider'
          }}>
            <Box sx={{ position: 'relative', display: 'inline-block', mb: 3 }}>
              <Avatar
                src={avatarPreview}
                alt={`${profileData.first_name} ${profileData.last_name}`}
                sx={{ 
                  width: 140, 
                  height: 140, 
                  mx: 'auto',
                  border: '4px solid white',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  bgcolor: '#CC0000', 
                  fontSize: '3rem',
                  fontWeight: 'bold'
                }}
              >
                {profileData.first_name?.[0]}{profileData.last_name?.[0]}
              </Avatar>
              <IconButton
                sx={{
                  position: 'absolute', bottom: 4, right: 4,
                  bgcolor: 'primary.main', color: 'white',
                  boxShadow: '0 4px 12px rgba(26, 86, 219, 0.4)',
                  '&:hover': { bgcolor: 'primary.dark' }, width: 40, height: 40
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <PhotoCameraIcon />
              </IconButton>
              <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
            </Box>
            
            <Typography variant="h5" fontWeight="800" gutterBottom>
              {profileData.first_name} {profileData.last_name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {user?.email}
            </Typography>
            
            <Divider sx={{ mb: 3 }} />
            
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" fontWeight="bold" color="text.secondary">RÔLE</Typography>
                <Chip label={getRoleLabel()} color={getRoleColor()} size="small" sx={{ fontWeight: 'bold', px: 1 }} />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" fontWeight="bold" color="text.secondary">STATUT</Typography>
                <Chip label="ACTIF" color="success" size="small" variant="outlined" sx={{ fontWeight: 'bold' }} />
              </Box>
            </Stack>

            {isStudent && (
              <Box sx={{ mt: 4 }}>
                <Button 
                  fullWidth 
                  variant="outlined" 
                  startIcon={<UploadIcon />}
                  onClick={() => cvInputRef.current?.click()}
                  sx={{ borderRadius: 2, py: 1.2, mb: 2 }}
                >
                  {cvUrl ? 'Actualiser le CV' : 'Téléverser mon CV'}
                </Button>
                <input ref={cvInputRef} type="file" accept=".pdf,.doc,.docx" hidden onChange={handleCvChange} />
                {(cvUrl || cvFile) && (
                  <Chip 
                    icon={<DescriptionIcon />}
                    label={cvFile ? cvFile.name : 'CV en ligne'} 
                    color="primary" 
                    variant="soft" 
                    sx={{ backgroundColor: alpha('#1a56db', 0.05), width: '100%' }}
                    onDelete={cvFile ? () => setCvFile(null) : undefined} 
                  />
                )}
              </Box>
            )}
          </Card>
        </Grid>

        {/* Colonne Droite: Paramètres */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ borderRadius: 5, overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.05)', border: '1px solid', borderColor: 'divider' }}>
            <Tabs 
              value={tabValue} 
              onChange={(_, v) => setTabValue(v)} 
              variant="fullWidth"
              sx={{ 
                borderBottom: 1, 
                borderColor: 'divider',
                backgroundColor: alpha('#f8fafc', 0.5),
                '& .MuiTab-root': { py: 3, fontWeight: 'bold' }
              }}
            >
              <Tab icon={<PersonIcon />} label="Infos" iconPosition="start" />
              <Tab icon={<LockIcon />} label="Sécurité" iconPosition="start" />
              <Tab icon={<NotificationsIcon />} label="Alertes" iconPosition="start" />
              <Tab icon={<LanguageIcon />} label="Langue" iconPosition="start" />
            </Tabs>

            <Box sx={{ p: 4 }}>
              {/* === ONGLET 0 : Informations personnelles === */}
              {tabValue === 0 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Prénom" fullWidth value={profileData.first_name} variant="filled"
                      onChange={(e) => setProfileData(p => ({ ...p, first_name: e.target.value }))} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Nom" fullWidth value={profileData.last_name} variant="filled"
                      onChange={(e) => setProfileData(p => ({ ...p, last_name: e.target.value }))} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Téléphone" fullWidth value={profileData.phone} variant="filled"
                      onChange={(e) => setProfileData(p => ({ ...p, phone: e.target.value }))} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="E-mail secondaire" fullWidth type="email" value={profileData.secondary_email} variant="filled"
                      onChange={(e) => setProfileData(p => ({ ...p, secondary_email: e.target.value }))} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Date de naissance" fullWidth type="date" value={profileData.birth_date} variant="filled"
                      onChange={(e) => setProfileData(p => ({ ...p, birth_date: e.target.value }))}
                      InputLabelProps={{ shrink: true }} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField label="Adresse" fullWidth value={profileData.address} variant="filled"
                      onChange={(e) => setProfileData(p => ({ ...p, address: e.target.value }))} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField label="Biographie / Description" fullWidth multiline rows={4} variant="filled"
                      value={profileData.bio}
                      onChange={(e) => setProfileData(p => ({ ...p, bio: e.target.value }))} />
                  </Grid>
                  <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button 
                      variant="contained" 
                      startIcon={<SaveIcon />} 
                      onClick={handleSaveProfile}
                      disabled={saving} 
                      size="large"
                      sx={{ borderRadius: 3, px: 4, py: 1.5, fontWeight: 'bold' }}
                    >
                      {saving ? 'Sauvegarde...' : 'Enregistrer les modifications'}
                    </Button>
                  </Grid>
                </Grid>
              )}

              {/* === ONGLET 1 : Sécurité === */}
              {tabValue === 1 && (
                <Box sx={{ maxWidth: 500 }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>Changer le mot de passe</Typography>
                  <Stack spacing={3}>
                    <TextField label="Nouveau mot de passe" fullWidth helperText="Minimum 8 caractères"
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      variant="outlined"
                      onChange={(e) => setPasswordData(p => ({ ...p, newPassword: e.target.value }))}
                      InputProps={{
                        endAdornment: (
                          <IconButton onClick={() => setShowPasswords(p => ({ ...p, new: !p.new }))}>
                            {showPasswords.new ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        )
                      }} />
                    <TextField label="Confirmer le nouveau mot de passe" fullWidth
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      variant="outlined"
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
                    <Button 
                      variant="contained" 
                      startIcon={<LockIcon />} 
                      onClick={handleChangePassword}
                      disabled={saving || !passwordData.newPassword || !passwordData.confirmPassword}
                      sx={{ borderRadius: 2, py: 1.5, fontWeight: 'bold' }}
                    >
                      {saving ? 'Modification...' : 'Modifier mon mot de passe'}
                    </Button>
                  </Stack>
                </Box>
              )}

              {/* === ONGLET 2 : Notifications === */}
              {tabValue === 2 && (
                <Box>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>Préférences de notification</Typography>
                  
                  <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, mb: 4 }}>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>Canaux de réception</Typography>
                    <Stack spacing={1}>
                      <FormControlLabel
                        control={<Switch checked={notifPrefs.push_enabled} color="primary"
                          onChange={(e) => setNotifPrefs(p => ({ ...p, push_enabled: e.target.checked }))} />}
                        label="Notifications push navigateur" />
                      <FormControlLabel
                        control={<Switch checked={notifPrefs.email_enabled} color="primary"
                          onChange={(e) => setNotifPrefs(p => ({ ...p, email_enabled: e.target.checked }))} />}
                        label="Notifications par e-mail" />
                      <FormControlLabel
                        control={<Switch checked={notifPrefs.sms_enabled} color="primary"
                          onChange={(e) => setNotifPrefs(p => ({ ...p, sms_enabled: e.target.checked }))} />}
                        label="SMS (alertes urgentes)" />
                    </Stack>
                  </Paper>

                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>Types d'alertes</Typography>
                  <Grid container spacing={1}>
                    {[
                      { key: 'notify_new_grade', label: 'Nouvelle note' },
                      { key: 'notify_new_exam', label: 'Nouvel examen' },
                      { key: 'notify_new_document', label: 'Nouveau cours' },
                      { key: 'notify_new_message', label: 'Messages reçus' },
                      { key: 'notify_schedule_change', label: 'Emploi du temps' },
                      { key: 'notify_internship', label: 'Offres de stages' },
                    ].map(item => (
                      <Grid item xs={12} sm={6} key={item.key}>
                        <FormControlLabel
                          control={<Switch checked={notifPrefs[item.key]}
                            onChange={(e) => setNotifPrefs(p => ({ ...p, [item.key]: e.target.checked }))} />}
                          label={item.label} />
                      </Grid>
                    ))}
                  </Grid>

                  <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveNotifications}
                      disabled={saving} sx={{ borderRadius: 2, fontWeight: 'bold' }}>
                      {saving ? 'Sauvegarde...' : 'Sauvegarder les alertes'}
                    </Button>
                  </Box>
                </Box>
              )}

              {/* === ONGLET 3 : Préférences === */}
              {tabValue === 3 && (
                <Box>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>Préférences d'affichage</Typography>
                  <FormControl fullWidth sx={{ maxWidth: 400 }}>
                    <InputLabel>Langue de l'interface</InputLabel>
                    <Select value={language} label="Langue de l'interface"
                      onChange={(e) => setLanguage(e.target.value)}>
                      <MenuItem value="fr">Français (France)</MenuItem>
                      <MenuItem value="en">English (US)</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveNotifications}
                      disabled={saving} sx={{ borderRadius: 2, fontWeight: 'bold' }}>
                      Enregistrer
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProfileSettingsPage;
