import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Chip,
  FormHelperText,
  Alert,
  Autocomplete,
  InputAdornment
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { fr } from 'date-fns/locale';
import { Offre } from '../types';
import { supabase } from '../../../utils/supabase';

interface AjouterOffreProps {
  ajouterOffre: (offre: Omit<Offre, 'id'>) => Promise<void>;
}

interface Entreprise {
  id: number;
  nom: string;
  secteur: string;
}

interface Departement {
  id: number;
  nom: string;
}

const AjouterOffre: React.FC<AjouterOffreProps> = ({ ajouterOffre }) => {
  // États pour le formulaire
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [entrepriseId, setEntrepriseId] = useState<number | null>(null);
  const [dateDebut, setDateDebut] = useState<Date | null>(null);
  const [dateFin, setDateFin] = useState<Date | null>(null);
  const [lieu, setLieu] = useState('');
  const [typeStage, setTypeStage] = useState<'temps_plein' | 'temps_partiel' | 'alternance' | 'stage_etude'>('stage_etude');
  const [competencesRequises, setCompetencesRequises] = useState<string[]>([]);
  const [remuneration, setRemuneration] = useState<string>('');
  const [duree, setDuree] = useState<string>('');
  const [departementId, setDepartementId] = useState<number | null>(null);
  const [niveauxRequis, setNiveauxRequis] = useState<string[]>([]);
  const [nouvelleCompetence, setNouvelleCompetence] = useState('');

  // États pour les données externes
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [departements, setDepartements] = useState<Departement[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Validation
  const [errors, setErrors] = useState<{
    [key: string]: string;
  }>({});

  // Chargement initial des données
  useEffect(() => {
    const chargerDonnees = async () => {
      try {
        // Charger les entreprises
        const { data: entreprisesData, error: entreprisesError } = await supabase
          .from('entreprises')
          .select('*')
          .order('nom');
        
        if (entreprisesError) throw entreprisesError;
        setEntreprises(entreprisesData || []);

        // Charger les départements
        const { data: departementsData, error: departementsError } = await supabase
          .from('departements')
          .select('id, nom')
          .order('nom');
        
        if (departementsError) throw departementsError;
        setDepartements(departementsData || []);
      } catch (err) {
        console.error('Erreur lors du chargement des données:', err);
        setError('Une erreur est survenue lors du chargement des données.');
      }
    };

    chargerDonnees();
  }, []);

  // Fonction pour ajouter une compétence
  const handleAjouterCompetence = () => {
    if (nouvelleCompetence.trim() && !competencesRequises.includes(nouvelleCompetence.trim())) {
      setCompetencesRequises([...competencesRequises, nouvelleCompetence.trim()]);
      setNouvelleCompetence('');
    }
  };

  // Fonction pour supprimer une compétence
  const handleSupprimerCompetence = (competence: string) => {
    setCompetencesRequises(competencesRequises.filter(c => c !== competence));
  };

  // Validation du formulaire
  const validerFormulaire = (): boolean => {
    const nouvellesErreurs: { [key: string]: string } = {};

    if (!titre.trim()) nouvellesErreurs.titre = 'Le titre est requis';
    if (!description.trim()) nouvellesErreurs.description = 'La description est requise';
    if (!entrepriseId) nouvellesErreurs.entrepriseId = 'Veuillez sélectionner une entreprise';
    if (!dateDebut) nouvellesErreurs.dateDebut = 'La date de début est requise';
    if (!dateFin) nouvellesErreurs.dateFin = 'La date de fin est requise';
    if (dateDebut && dateFin && dateDebut > dateFin) {
      nouvellesErreurs.dateFin = 'La date de fin doit être postérieure à la date de début';
    }
    if (!lieu.trim()) nouvellesErreurs.lieu = 'Le lieu est requis';
    if (!typeStage) nouvellesErreurs.typeStage = 'Le type de stage est requis';
    if (competencesRequises.length === 0) nouvellesErreurs.competencesRequises = 'Au moins une compétence est requise';
    if (!departementId) nouvellesErreurs.departementId = 'Veuillez sélectionner un département';
    if (niveauxRequis.length === 0) nouvellesErreurs.niveauxRequis = 'Au moins un niveau d\'étude est requis';
    
    // Validation de la rémunération (optionnelle mais doit être un nombre si présente)
    if (remuneration.trim() && isNaN(Number(remuneration))) {
      nouvellesErreurs.remuneration = 'La rémunération doit être un nombre';
    }
    
    // Validation de la durée (requise et doit être un nombre)
    if (!duree.trim()) {
      nouvellesErreurs.duree = 'La durée est requise';
    } else if (isNaN(Number(duree)) || Number(duree) <= 0) {
      nouvellesErreurs.duree = 'La durée doit être un nombre positif';
    }

    setErrors(nouvellesErreurs);
    return Object.keys(nouvellesErreurs).length === 0;
  };

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validerFormulaire()) return;
    
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Préparer l'objet offre
      const nouvelleOffre: Omit<Offre, 'id'> = {
        titre,
        description,
        entreprise: entreprises.find(e => e.id === entrepriseId) || { id: 0, nom: '', secteur: '' },
        dateDebut: dateDebut?.toISOString() || '',
        dateFin: dateFin?.toISOString() || '',
        lieu,
        typeStage,
        competencesRequises,
        remuneration: remuneration.trim() ? Number(remuneration) : null,
        duree: Number(duree),
        professeurContact: '', // Sera défini côté serveur avec l'utilisateur connecté
        datePublication: new Date().toISOString(),
        departementId: departementId || 0,
        niveauRequis: niveauxRequis
      };
      
      // Appeler la fonction d'ajout
      await ajouterOffre(nouvelleOffre);
      
      // Réinitialiser le formulaire
      setTitre('');
      setDescription('');
      setEntrepriseId(null);
      setDateDebut(null);
      setDateFin(null);
      setLieu('');
      setTypeStage('stage_etude');
      setCompetencesRequises([]);
      setRemuneration('');
      setDuree('');
      setDepartementId(null);
      setNiveauxRequis([]);
      
      setSuccess(true);
    } catch (err) {
      console.error('Erreur lors de l\'ajout de l\'offre:', err);
      setError('Une erreur est survenue lors de l\'ajout de l\'offre.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Ajouter une nouvelle offre de stage
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(false)}>
            L'offre a été ajoutée avec succès.
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Titre"
                fullWidth
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                error={!!errors.titre}
                helperText={errors.titre}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Description"
                multiline
                rows={4}
                fullWidth
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                error={!!errors.description}
                helperText={errors.description}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.entrepriseId} required>
                <InputLabel>Entreprise</InputLabel>
                <Select
                  value={entrepriseId || ''}
                  onChange={(e) => setEntrepriseId(e.target.value as number)}
                  label="Entreprise"
                >
                  {entreprises.map((entreprise) => (
                    <MenuItem key={entreprise.id} value={entreprise.id}>
                      {entreprise.nom}
                    </MenuItem>
                  ))}
                </Select>
                {errors.entrepriseId && <FormHelperText>{errors.entrepriseId}</FormHelperText>}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.departementId} required>
                <InputLabel>Département</InputLabel>
                <Select
                  value={departementId || ''}
                  onChange={(e) => setDepartementId(e.target.value as number)}
                  label="Département"
                >
                  {departements.map((departement) => (
                    <MenuItem key={departement.id} value={departement.id}>
                      {departement.nom}
                    </MenuItem>
                  ))}
                </Select>
                {errors.departementId && <FormHelperText>{errors.departementId}</FormHelperText>}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <DatePicker
                label="Date de début"
                value={dateDebut}
                onChange={(date) => setDateDebut(date)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    error: !!errors.dateDebut,
                    helperText: errors.dateDebut
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <DatePicker
                label="Date de fin"
                value={dateFin}
                onChange={(date) => setDateFin(date)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    error: !!errors.dateFin,
                    helperText: errors.dateFin
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Lieu"
                fullWidth
                value={lieu}
                onChange={(e) => setLieu(e.target.value)}
                error={!!errors.lieu}
                helperText={errors.lieu}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.typeStage} required>
                <InputLabel>Type de stage</InputLabel>
                <Select
                  value={typeStage}
                  onChange={(e) => setTypeStage(e.target.value as any)}
                  label="Type de stage"
                >
                  <MenuItem value="stage_etude">Stage d'études</MenuItem>
                  <MenuItem value="alternance">Alternance</MenuItem>
                  <MenuItem value="temps_plein">Temps plein</MenuItem>
                  <MenuItem value="temps_partiel">Temps partiel</MenuItem>
                </Select>
                {errors.typeStage && <FormHelperText>{errors.typeStage}</FormHelperText>}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Rémunération (€)"
                fullWidth
                value={remuneration}
                onChange={(e) => setRemuneration(e.target.value)}
                error={!!errors.remuneration}
                helperText={errors.remuneration || 'Laissez vide si non rémunéré'}
                InputProps={{
                  endAdornment: <InputAdornment position="end">€</InputAdornment>,
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Durée (semaines)"
                fullWidth
                value={duree}
                onChange={(e) => setDuree(e.target.value)}
                error={!!errors.duree}
                helperText={errors.duree}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth error={!!errors.niveauxRequis} required>
                <InputLabel>Niveaux d'études requis</InputLabel>
                <Select
                  multiple
                  value={niveauxRequis}
                  onChange={(e) => setNiveauxRequis(e.target.value as string[])}
                  input={<OutlinedInput label="Niveaux d'études requis" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} />
                      ))}
                    </Box>
                  )}
                >
                  <MenuItem value="Bachelor 1">Bachelor 1</MenuItem>
                  <MenuItem value="Bachelor 2">Bachelor 2</MenuItem>
                  <MenuItem value="Bachelor 3">Bachelor 3</MenuItem>
                  <MenuItem value="Master 1">Master 1</MenuItem>
                  <MenuItem value="Master 2">Master 2</MenuItem>
                </Select>
                {errors.niveauxRequis && <FormHelperText>{errors.niveauxRequis}</FormHelperText>}
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Compétences requises {errors.competencesRequises && (
                  <Typography component="span" color="error" variant="caption">
                    ({errors.competencesRequises})
                  </Typography>
                )}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TextField
                  label="Ajouter une compétence"
                  size="small"
                  value={nouvelleCompetence}
                  onChange={(e) => setNouvelleCompetence(e.target.value)}
                  sx={{ mr: 1, flexGrow: 1 }}
                />
                <Button 
                  variant="outlined" 
                  onClick={handleAjouterCompetence}
                  disabled={!nouvelleCompetence.trim()}
                >
                  Ajouter
                </Button>
              </Box>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {competencesRequises.map((competence) => (
                  <Chip
                    key={competence}
                    label={competence}
                    onDelete={() => handleSupprimerCompetence(competence)}
                  />
                ))}
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <LoadingButton
                  type="submit"
                  variant="contained"
                  loading={loading}
                >
                  Publier l'offre
                </LoadingButton>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </LocalizationProvider>
  );
};

export default AjouterOffre;
