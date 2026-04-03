import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Divider,
  Switch,
  FormControlLabel,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  IconButton,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  PhotoCamera as PhotoCameraIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '@/supabase';

/**
 * Page permettant à l'étudiant de gérer ses paramètres de profil
 * Email, téléphone, notification preferences, avatar, etc.
 */
const ProfileSettingsPage = () => {
  const { authState } = useAuth();
  const [profile, setProfile] = useState(null);
  const [studentInfo, setStudentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [preferences, setPreferences] = useState({});
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [avatarFile, setAvatarFile] = useState(null);

  useEffect(() => {
    if (authState?.user?.id) {
      loadProfileData();
    }
  }, [authState?.user?.id]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Charger le profil
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authState.user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);
      setFormData(profileData);

      // Charger les infos étudiant
      const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .eq('profile_id', authState.user.id)
        .single();

      setStudentInfo(studentData);

      // Charger les préférences (stockées dans system_config ou profil)
      setPreferences({
        emailNotifications: profileData?.email_notifications !== false,
        smsNotifications: profileData?.sms_notifications === true,
        weeklyDigest: profileData?.weekly_digest !== false,
        marketingEmails: profileData?.marketing_emails === true,
        forumNotifications: profileData?.forum_notifications !== false,
        examReminders: profileData?.exam_reminders !== false,
      });
    } catch (err) {
      console.error('Erreur chargement profil:', err);
      setError('Impossible de charger les données du profil');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handlePreferenceChange = (field) => {
    setPreferences({
      ...preferences,
      [field]: !preferences[field],
    });
  };

  const handleAvatarChange = async (e) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      setSaving(true);
      setError(null);

      // Upload avatar
      const fileExt = file.name.split('.').pop();
      const fileName = `${authState.user.id}-avatar.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Récupérer l'URL
      const { data } = await supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Mettre à jour le profil
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('id', authState.user.id);

      if (updateError) throw updateError;

      setFormData({
        ...formData,
        avatar_url: data.publicUrl,
      });

      setSuccess('Avatar mis à jour avec succès');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Erreur upload avatar:', err);
      setError('Impossible de mettre à jour l\'avatar');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError(null);

      // Préparer les données à mettre à jour
      const updateData = {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        phone_verified: formData.phone_verified || false,
        email_notifications: preferences.emailNotifications,
        sms_notifications: preferences.smsNotifications,
        weekly_digest: preferences.weeklyDigest,
        marketing_emails: preferences.marketingEmails,
        forum_notifications: preferences.forumNotifications,
        exam_reminders: preferences.examReminders,
      };

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', authState.user.id);

      if (updateError) throw updateError;

      setProfile(updateData);
      setEditMode(false);
      setSuccess('Profil mis à jour avec succès');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Erreur sauvegarde profil:', err);
      setError('Impossible de sauvegarder le profil');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setError('Les mots de passe ne correspondent pas');
        return;
      }

      if (passwordForm.newPassword.length < 6) {
        setError('Le mot de passe doit faire au moins 6 caractères');
        return;
      }

      setSaving(true);
      setError(null);

      // Utiliser Supabase auth pour changer le mot de passe
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (updateError) throw updateError;

      setSuccess('Mot de passe changé avec succès');
      setChangePasswordOpen(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Erreur changement mot de passe:', err);
      setError('Impossible de changer le mot de passe');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Paramètres du Profil
      </Typography>

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

      {/* Section Avatar */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Photo de Profil
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Avatar
            src={formData.avatar_url}
            sx={{
              width: 100,
              height: 100,
              bgcolor: 'primary.main',
              fontSize: '2rem',
            }}
          >
            {formData.full_name?.charAt(0) || 'E'}
          </Avatar>

          <Box>
            <input
              accept="image/*"
              type="file"
              id="avatar-upload"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
            <label htmlFor="avatar-upload">
              <Button
                variant="contained"
                component="span"
                startIcon={<PhotoCameraIcon />}
                disabled={saving}
              >
                Changer la photo
              </Button>
            </label>
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Formats acceptés: JPG, PNG. Taille max: 5MB
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Section Informations Personnelles */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Informations Personnelles</Typography>
          {!editMode && (
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => setEditMode(true)}
            >
              Modifier
            </Button>
          )}
        </Box>

        {editMode ? (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nom Complet"
                name="full_name"
                value={formData.full_name || ''}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email || ''}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Téléphone"
                name="phone"
                value={formData.phone || ''}
                onChange={handleInputChange}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveProfile}
                  disabled={saving}
                >
                  Sauvegarder
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={() => {
                    setEditMode(false);
                    setFormData(profile);
                  }}
                >
                  Annuler
                </Button>
              </Box>
            </Grid>
          </Grid>
        ) : (
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Nom:</strong> {profile?.full_name}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Email:</strong> {profile?.email}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Téléphone:</strong> {profile?.phone || 'Non renseigné'}
            </Typography>
            {studentInfo && (
              <>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>N° Étudiant:</strong> {studentInfo.student_id}
                </Typography>
                <Typography variant="body2">
                  <strong>Niveau:</strong> {studentInfo.level}L
                </Typography>
              </>
            )}
          </Box>
        )}
      </Paper>

      {/* Section Sécurité */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Sécurité
        </Typography>

        <Button
          variant="outlined"
          onClick={() => setChangePasswordOpen(true)}
        >
          Changer le mot de passe
        </Button>
      </Paper>

      {/* Section Préférences de Notification */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Préférences de Notification
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={preferences.emailNotifications}
                onChange={() => handlePreferenceChange('emailNotifications')}
              />
            }
            label="Notifications par Email"
          />

          <FormControlLabel
            control={
              <Switch
                checked={preferences.smsNotifications}
                onChange={() => handlePreferenceChange('smsNotifications')}
              />
            }
            label="Notifications par SMS"
          />

          <FormControlLabel
            control={
              <Switch
                checked={preferences.weeklyDigest}
                onChange={() => handlePreferenceChange('weeklyDigest')}
              />
            }
            label="Résumé Hebdomadaire"
          />

          <FormControlLabel
            control={
              <Switch
                checked={preferences.forumNotifications}
                onChange={() => handlePreferenceChange('forumNotifications')}
              />
            }
            label="Notifications de Forum"
          />

          <FormControlLabel
            control={
              <Switch
                checked={preferences.examReminders}
                onChange={() => handlePreferenceChange('examReminders')}
              />
            }
            label="Rappels d'Examen"
          />

          <FormControlLabel
            control={
              <Switch
                checked={preferences.marketingEmails}
                onChange={() => handlePreferenceChange('marketingEmails')}
              />
            }
            label="Emails Promotionnels"
          />
        </Box>

        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={handleSaveProfile}
          disabled={saving}
        >
          Sauvegarder les Préférences
        </Button>
      </Paper>

      {/* Dialog Changement Mot de Passe */}
      <Dialog open={changePasswordOpen} onClose={() => setChangePasswordOpen(false)}>
        <DialogTitle>Changer le Mot de Passe</DialogTitle>
        <DialogContent sx={{ minWidth: 400 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              fullWidth
              label="Mot de passe actuel"
              type="password"
              value={passwordForm.currentPassword}
              onChange={e =>
                setPasswordForm({
                  ...passwordForm,
                  currentPassword: e.target.value,
                })
              }
            />
            <TextField
              fullWidth
              label="Nouveau mot de passe"
              type="password"
              value={passwordForm.newPassword}
              onChange={e =>
                setPasswordForm({
                  ...passwordForm,
                  newPassword: e.target.value,
                })
              }
            />
            <TextField
              fullWidth
              label="Confirmer le mot de passe"
              type="password"
              value={passwordForm.confirmPassword}
              onChange={e =>
                setPasswordForm({
                  ...passwordForm,
                  confirmPassword: e.target.value,
                })
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChangePasswordOpen(false)}>Annuler</Button>
          <Button
            variant="contained"
            onClick={handleChangePassword}
            disabled={saving}
          >
            Changer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProfileSettingsPage;
