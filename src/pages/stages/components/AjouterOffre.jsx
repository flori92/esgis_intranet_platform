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
import { supabase } from '@/supabase';

/**
 * @typedef {import('../types').Offre} Offre
 * 
 * @typedef {Object} Entreprise
 * @property {number} id - ID de l'entreprise
 * @property {string} nom - Nom de l'entreprise
 * @property {string} secteur - Secteur d'activité de l'entreprise
 * 
 * @typedef {Object} Departement
 * @property {number} id - ID du département
 * @property {string} nom - Nom du département
 * 
 * @typedef {'temps_plein'|'temps_partiel'|'alternance'|'stage_etude'} TypeStage
 */

/**
 * Composant pour ajouter une nouvelle offre de stage
 * @param {Object} props - Propriétés du composant
 * @param {function} props.onSubmit - Fonction pour soumettre la nouvelle offre
 * @param {number} props.departementId - ID du département du professeur
 * @returns {JSX.Element} Composant d'ajout d'offre
 */
const AjouterOffre = ({ onSubmit, departementId }) => {
  // États pour le formulaire
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [entrepriseId, setEntrepriseId] = useState(null);
  const [entrepriseSelectionnee, setEntrepriseSelectionnee] = useState(null);
  const [dateDebut, setDateDebut] = useState(null);
  const [dateFin, setDateFin] = useState(null);
  const [lieu, setLieu] = useState('');
  const [typeStage, setTypeStage] = useState('stage_etude');
  const [competencesRequises, setCompetencesRequises] = useState([]);
  const [remuneration, setRemuneration] = useState('');
  const [duree, setDuree] = useState('');
  const [niveauxRequis, setNiveauxRequis] = useState([]);
  const [nouvelleCompetence, setNouvelleCompetence] = useState('');

  // États pour les données externes
  const [entreprises, setEntreprises] = useState([]);
  const [departements, setDepartements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  
  // Validation
  const [errors, setErrors] = useState({});

  // Chargement initial des données
  useEffect(() => {
    chargerDonnees();
  }, []);

  /**
   * Charger les données nécessaires au formulaire
   */
  const chargerDonnees = async () => {
    try {
      // Charger les entreprises
      const { data: entreprisesData, error: entreprisesError } = await supabase
        .from('entreprises')
        .select('*')
        .order('nom');
      
      if (entreprisesError) {
        throw entreprisesError;
      }
      setEntreprises(entreprisesData || []);

      // Charger les départements
      const { data: departementsData, error: departementsError } = await supabase
        .from('departments')
        .select('id, name')
        .order('name');
      
      if (departementsError) {
        throw departementsError;
      }
      
      // Adapter les données pour correspondre à l'interface Departement
      const formattedDepartments = (departementsData || []).map(dept => ({
        id: dept.id,
        nom: dept.name
      }));
      
      setDepartements(formattedDepartments);
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    }
  };

  /**
   * Gérer le changement du titre
   * @param {React.ChangeEvent<HTMLInputElement>} event - Événement de changement
   */
  const handleTitreChange = (event) => {
    setTitre(event.target.value);
  };

  /**
   * Gérer le changement de la description
   * @param {React.ChangeEvent<HTMLInputElement>} event - Événement de changement
   */
  const handleDescriptionChange = (event) => {
    setDescription(event.target.value);
  };

  /**
   * Gérer le changement de l'entreprise
   * @param {any} _ - Événement non utilisé
   * @param {Entreprise|null} newValue - Nouvelle entreprise sélectionnée
   */
  const handleEntrepriseChange = (_, newValue) => {
    setEntrepriseSelectionnee(newValue);
    setEntrepriseId(newValue ? newValue.id : null);
  };

  /**
   * Gérer le changement du lieu
   * @param {React.ChangeEvent<HTMLInputElement>} event - Événement de changement
   */
  const handleLieuChange = (event) => {
    setLieu(event.target.value);
  };

  /**
   * Gérer le changement du type de stage
   * @param {React.ChangeEvent<HTMLInputElement>} event - Événement de changement
   */
  const handleTypeStageChange = (event) => {
    setTypeStage(event.target.value);
  };

  /**
   * Gérer le changement de la rémunération
   * @param {React.ChangeEvent<HTMLInputElement>} event - Événement de changement
   */
  const handleRemunerationChange = (event) => {
    setRemuneration(event.target.value);
  };

  /**
   * Gérer le changement de la durée
   * @param {React.ChangeEvent<HTMLInputElement>} event - Événement de changement
   */
  const handleDureeChange = (event) => {
    setDuree(event.target.value);
  };

  /**
   * Gérer le changement des niveaux requis
   * @param {React.ChangeEvent<HTMLInputElement>} event - Événement de changement
   */
  const handleNiveauxRequisChange = (event) => {
    setNiveauxRequis(event.target.value);
  };

  /**
   * Gérer le changement de la nouvelle compétence
   * @param {React.ChangeEvent<HTMLInputElement>} event - Événement de changement
   */
  const handleNouvelleCompetenceChange = (event) => {
    setNouvelleCompetence(event.target.value);
  };

  /**
   * Ajouter une compétence à la liste
   */
  const handleAjouterCompetence = () => {
    if (nouvelleCompetence.trim() && !competencesRequises.includes(nouvelleCompetence.trim())) {
      setCompetencesRequises([...competencesRequises, nouvelleCompetence.trim()]);
      setNouvelleCompetence('');
    }
  };

  /**
   * Supprimer une compétence de la liste
   * @param {string} competence - Compétence à supprimer
   */
  const handleSupprimerCompetence = (competence) => {
    setCompetencesRequises(competencesRequises.filter(c => c !== competence));
  };

  /**
   * Valider le formulaire
   * @returns {boolean} Formulaire valide ou non
   */
  const validerFormulaire = () => {
    const newErrors = {};
    
    // Validation du titre
    if (!titre.trim()) {
      newErrors.titre = 'Le titre est requis';
    } else if (titre.length < 5) {
      newErrors.titre = 'Le titre doit contenir au moins 5 caractères';
    }
    
    // Validation de la description
    if (!description.trim()) {
      newErrors.description = 'La description est requise';
    } else if (description.length < 20) {
      newErrors.description = 'La description doit contenir au moins 20 caractères';
    }
    
    // Validation de l'entreprise
    if (!entrepriseId) {
      newErrors.entreprise = 'L\'entreprise est requise';
    }
    
    // Validation des dates
    if (!dateDebut) {
      newErrors.dateDebut = 'La date de début est requise';
    }
    
    if (!dateFin) {
      newErrors.dateFin = 'La date de fin est requise';
    } else if (dateDebut && dateFin && dateDebut > dateFin) {
      newErrors.dateFin = 'La date de fin doit être postérieure à la date de début';
    }
    
    // Validation du lieu
    if (!lieu.trim()) {
      newErrors.lieu = 'Le lieu est requis';
    }
    
    // Validation de la durée
    if (!duree.trim()) {
      newErrors.duree = 'La durée est requise';
    } else if (isNaN(Number(duree)) || Number(duree) <= 0) {
      newErrors.duree = 'La durée doit être un nombre positif';
    }
    
    // Validation des niveaux requis
    if (niveauxRequis.length === 0) {
      newErrors.niveauxRequis = 'Au moins un niveau d\'études est requis';
    }
    
    // Validation des compétences requises
    if (competencesRequises.length === 0) {
      newErrors.competencesRequises = 'Au moins une compétence est requise';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Soumettre le formulaire
   * @param {React.FormEvent} e - Événement de soumission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validerFormulaire()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Créer l'objet offre
      const nouvelleOffre = {
        titre,
        description,
        entreprise: entrepriseSelectionnee,
        dateDebut: dateDebut ? dateDebut.toISOString().split('T')[0] : '',
        dateFin: dateFin ? dateFin.toISOString().split('T')[0] : '',
        lieu,
        typeStage,
        competencesRequises,
        remuneration: remuneration ? Number(remuneration) : 0,
        duree: Number(duree),
        departementId: departementId || 1,
        niveauRequis: niveauxRequis
      };
      
      // Soumettre l'offre
      const result = await onSubmit(nouvelleOffre);
      
      if (result.success) {
        setSuccess(true);
        
        // Réinitialiser le formulaire
        setTitre('');
        setDescription('');
        setEntrepriseId(null);
        setEntrepriseSelectionnee(null);
        setDateDebut(null);
        setDateFin(null);
        setLieu('');
        setTypeStage('stage_etude');
        setCompetencesRequises([]);
        setRemuneration('');
        setDuree('');
        setNiveauxRequis([]);
        setNouvelleCompetence('');
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error('Erreur lors de la soumission de l\'offre:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Publier une nouvelle offre de stage
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            L'offre de stage a été publiée avec succès.
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Titre de l'offre"
                fullWidth
                value={titre}
                onChange={handleTitreChange}
                error={!!errors.titre}
                helperText={errors.titre}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={4}
                value={description}
                onChange={handleDescriptionChange}
                error={!!errors.description}
                helperText={errors.description}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <Autocomplete
                options={entreprises}
                getOptionLabel={(option) => `${option.nom} - ${option.secteur}`}
                value={entrepriseSelectionnee}
                onChange={handleEntrepriseChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Entreprise"
                    error={!!errors.entreprise}
                    helperText={errors.entreprise}
                    required
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <DatePicker
                label="Date de début"
                value={dateDebut}
                onChange={setDateDebut}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    error={!!errors.dateDebut}
                    helperText={errors.dateDebut}
                    required
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <DatePicker
                label="Date de fin"
                value={dateFin}
                onChange={setDateFin}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    error={!!errors.dateFin}
                    helperText={errors.dateFin}
                    required
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Lieu"
                fullWidth
                value={lieu}
                onChange={handleLieuChange}
                error={!!errors.lieu}
                helperText={errors.lieu}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Type de stage</InputLabel>
                <Select
                  value={typeStage}
                  label="Type de stage"
                  onChange={handleTypeStageChange}
                >
                  <MenuItem value="temps_plein">Temps plein</MenuItem>
                  <MenuItem value="temps_partiel">Temps partiel</MenuItem>
                  <MenuItem value="alternance">Alternance</MenuItem>
                  <MenuItem value="stage_etude">Stage d'étude</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Rémunération (€)"
                fullWidth
                value={remuneration}
                onChange={handleRemunerationChange}
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
                onChange={handleDureeChange}
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
                  onChange={handleNiveauxRequisChange}
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
                  onChange={handleNouvelleCompetenceChange}
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
