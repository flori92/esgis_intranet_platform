import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, TextField, Button, Card, 
  CardContent, Divider, CircularProgress, Alert, Stack,
  Chip, Stepper, Step, StepLabel, IconButton
} from '@mui/material';
import {
  School as GraduationIcon,
  CloudUpload as UploadIcon,
  Person as PersonIcon,
  Event as CalendarIcon,
  Description as FileIcon
} from '@mui/icons-material';
import { supabase } from '@/supabase';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const STEPS = ['Dépôt du sujet', 'Validation pédagogique', 'Attribution encadreur', 'Planification', 'Résultat final'];

const ThesesPage = () => {
  const { authState } = useAuth();
  const [thesis, setThesis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  const [form, setForm] = useState({ title: '', description: '' });

  const fetchThesis = async () => {
    setLoading(true);
    try {
      const { data, error: fetchErr } = await supabase
        .from('theses')
        .select('*, profiles:supervisor_id(full_name)')
        .eq('student_id', authState.profile?.id)
        .maybeSingle();
      
      if (fetchErr) throw fetchErr;
      setThesis(data);
      if (data) setForm({ title: data.title, description: data.description });
    } catch (err) {
      console.error(err);
      setError('Erreur lors du chargement de votre dossier de soutenance.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authState.profile?.id) fetchThesis();
  }, [authState.profile?.id]);

  const handleSubmit = async () => {
    if (!form.title) return;
    setSubmitting(true);
    try {
      const payload = {
        student_id: authState.profile.id,
        title: form.title,
        description: form.description,
        status: 'pending'
      };

      const { error: saveErr } = thesis?.id 
        ? await supabase.from('theses').update(payload).eq('id', thesis.id)
        : await supabase.from('theses').insert(payload);

      if (saveErr) throw saveErr;
      await fetchThesis();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getActiveStep = (status) => {
    const map = { pending: 0, validated: 1, supervisor_assigned: 2, scheduled: 3, completed: 4 };
    return map[status] || 0;
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <GraduationIcon color="primary" fontSize="large" />
          Soutenances & Mémoires
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gestion de votre projet de fin d'études, dépôt de mémoire et planning de soutenance.
        </Typography>
      </Box>

      {thesis && (
        <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>Progression de votre dossier</Typography>
          <Box sx={{ py: 2 }}>
            <Stepper activeStep={getActiveStep(thesis.status)} alternativeLabel>
              {STEPS.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>
        </Paper>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Informations du projet</Typography>
              <Divider sx={{ mb: 3 }} />
              <Stack spacing={3}>
                <TextField 
                  fullWidth 
                  label="Titre de la thèse / du mémoire *" 
                  value={form.title} 
                  onChange={(e) => setForm({...form, title: e.target.value})}
                  disabled={thesis?.status === 'completed'}
                />
                <TextField 
                  fullWidth 
                  multiline 
                  rows={4} 
                  label="Problématique / Description" 
                  value={form.description} 
                  onChange={(e) => setForm({...form, description: e.target.value})}
                  disabled={thesis?.status === 'completed'}
                />
                <Button 
                  variant="contained" 
                  onClick={handleSubmit} 
                  disabled={submitting || !form.title || thesis?.status === 'completed'}
                >
                  {submitting ? 'Enregistrement...' : 'Mettre à jour mon projet'}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Stack spacing={3}>
            <Card elevation={2} sx={{ bgcolor: 'primary.dark', color: 'white' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Planning & Encadrement</Typography>
                <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.2)' }} />
                <Stack spacing={2} sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <PersonIcon />
                    <Box>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>Encadreur (Directeur de mémoire)</Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {thesis?.profiles?.full_name || 'En attente d\'attribution'}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CalendarIcon />
                    <Box>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>Date de soutenance</Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {thesis?.defense_date ? format(new Date(thesis.defense_date), 'PPPP p', { locale: fr }) : 'Non planifiée'}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <GraduationIcon />
                    <Box>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>Note finale</Typography>
                      <Typography variant="h5" fontWeight="bold">
                        {thesis?.grade ? `${thesis.grade}/20` : '-- / 20'}
                      </Typography>
                    </Box>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FileIcon /> Document final
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Alert severity="info" sx={{ mb: 2 }}>
                  Déposez ici la version finale de votre mémoire au format PDF uniquement.
                </Alert>
                <Button fullWidth variant="outlined" startIcon={<UploadIcon />} component="label">
                  Uploader le mémoire (PDF)
                  <input type="file" hidden accept="application/pdf" />
                </Button>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ThesesPage;
