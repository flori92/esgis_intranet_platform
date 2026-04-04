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
  InputAdornment,
  SelectChangeEvent
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { Offre } from '../types';
import { getStageCompanies } from '@/api/stages';
import { getDepartments } from '@/api/departments';

interface AjouterOffreProps {
  onSubmit: (nouvelleOffre: Omit<Offre, "id">) => Promise<{ success: boolean; message: string; }>;
  departementId: number;
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

type TypeStage = 'temps_plein' | 'temps_partiel' | 'alternance' | 'stage_etude';

const AjouterOffre: React.FC<AjouterOffreProps> = ({ onSubmit, departementId }) => {
  // États pour le formulaire
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [entrepriseId, setEntrepriseId] = useState<number | null>(null);
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [lieu, setLieu] = useState('');
  const [typeStage, setTypeStage] = useState<TypeStage>('stage_etude');
  const [competencesRequises, setCompetencesRequises] = useState<string[]>([]);
  const [remuneration, setRemuneration] = useState<string>('');
  const [duree, setDuree] = useState<string>('');
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
    chargerDonnees();
  }, []);

  const chargerDonnees = async () => {
    try {
      // Charger les entreprises
      const { data: entreprisesData, error: entreprisesError } = await getStageCompanies();

      if (entreprisesError) {
        throw entreprisesError;
      }
      setEntreprises(entreprisesData || []);

      // Charger les départements
      const { departments: departementsData, error: departementsError } = await getDepartments();

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

  // Gestionnaires d'événements
  const handleTitreChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setTitre(event.target.value);
  };

  const handleDescriptionChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setDescription(event.target.value);
  };

  const handleEntrepriseChange = (event: SelectChangeEvent<number | string>) => {
    const nextEntrepriseId = Number(event.target.value);
    setEntrepriseId(Number.isNaN(nextEntrepriseId) ? null : nextEntrepriseId);
  };

  const handleLieuChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setLieu(event.target.value);
  };

  const handleTypeStageChange = (event: SelectChangeEvent<TypeStage>) => {
    setTypeStage(event.target.value as TypeStage);
  };

  const handleRemunerationChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setRemuneration(event.target.value);
  };

  const handleDureeChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setDuree(event.target.value);
  };

  const handleNiveauxRequisChange = (event: SelectChangeEvent<string[]>) => {
    setNiveauxRequis(event.target.value as string[]);
  };

  const handleNouvelleCompetenceChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setNouvelleCompetence(event.target.value);
  };

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

    if (!titre.trim()) {
      nouvellesErreurs.titre = 'Le titre est requis';
    }
    if (!description.trim()) {
      nouvellesErreurs.description = 'La description est requise';
    }
    if (!entrepriseId) {
      nouvellesErreurs.entrepriseId = 'L\'entreprise est requise';
    }
    if (!dateDebut) {
      nouvellesErreurs.dateDebut = 'La date de début est requise';
    }
    if (!dateFin) {
      nouvellesErreurs.dateFin = 'La date de fin est requise';
    }
    if (dateDebut && dateFin && dateFin <= dateDebut) {
      nouvellesErreurs.dateFin = 'La date de fin doit être après la date de début';
    }
    if (!lieu.trim()) {
      nouvellesErreurs.lieu = 'Le lieu est requis';
    }
    if (!typeStage) {
      nouvellesErreurs.typeStage = 'Le type de stage est requis';
    }
    
    if (competencesRequises.length === 0) {
      nouvellesErreurs.competencesRequises = 'Au moins une compétence requise est nécessaire';
    }
    
    if (remuneration && isNaN(parseFloat(remuneration))) {
      nouvellesErreurs.remuneration = 'La rémunération doit être un nombre';
    }
    
    if (!duree.trim()) {
      nouvellesErreurs.duree = 'La durée est requise';
    } else if (isNaN(parseInt(duree, 10))) {
      nouvellesErreurs.duree = 'La durée doit être un nombre';
    }
    
    if (niveauxRequis.length === 0) {
      nouvellesErreurs.niveauxRequis = 'Au moins un niveau requis est nécessaire';
    }

    setErrors(nouvellesErreurs);
    return Object.keys(nouvellesErreurs).length === 0;
  };

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validerFormulaire()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Trouver l'entreprise sélectionnée
      const entrepriseSelectionnee = entreprises.find(e => e.id === entrepriseId);
      
      if (!entrepriseSelectionnee) {
        throw new Error('Entreprise non trouvée');
      }
      
      if (!dateDebut || !dateFin) {
        throw new Error('Les dates sont requises');
      }
      
      // Créer l'objet offre
      const nouvelleOffre: Omit<Offre, 'id'> = {
        titre,
        description,
        entreprise: {
          id: entrepriseSelectionnee.id,
          nom: entrepriseSelectionnee.nom,
          secteur: entrepriseSelectionnee.secteur
        },
        dateDebut,
        dateFin,
        lieu,
        typeStage,
        competencesRequises,
        remuneration: remuneration ? parseFloat(remuneration) : null,
        duree: parseInt(duree, 10),
        professeurContact: 'À définir', // À remplacer par les données du professeur connecté
        datePublication: new Date().toISOString().split('T')[0],
        departementId: departementId,
        niveauRequis: niveauxRequis
      };
      
      // Appeler la fonction onSubmit passée en props
      const result = await onSubmit(nouvelleOffre);
      
      if (result.success) {
        setSuccess(true);
        
        // Réinitialiser le formulaire
        setTitre('');
        setDescription('');
        setEntrepriseId(null);
        setDateDebut('');
        setDateFin('');
        setLieu('');
        setTypeStage('stage_etude');
        setCompetencesRequises([]);
        setRemuneration('');
        setDuree('');
        setNiveauxRequis([]);
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error('Erreur lors de l\'ajout de l\'offre:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Publier une nouvelle offre de stage
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            L'offre de stage a été publiée avec succès.
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit}>
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
              <FormControl fullWidth error={!!errors.entrepriseId} required>
                <InputLabel>Entreprise</InputLabel>
                <Select
                  value={entrepriseId ?? ''}
                  onChange={handleEntrepriseChange}
                  label="Entreprise"
                >
                  {entreprises.map((entreprise) => (
                    <MenuItem key={entreprise.id} value={entreprise.id}>
                      {entreprise.nom}
                    </MenuItem>
                  ))}
                </Select>
                {errors.entrepriseId && (
                  <FormHelperText>{errors.entrepriseId}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Date de début"
                type="date"
                value={dateDebut}
                onChange={(event) => setDateDebut(event.target.value)}
                fullWidth
                required
                error={!!errors.dateDebut}
                helperText={errors.dateDebut}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Date de fin"
                type="date"
                value={dateFin}
                onChange={(event) => setDateFin(event.target.value)}
                fullWidth
                required
                error={!!errors.dateFin}
                helperText={errors.dateFin}
                InputLabelProps={{ shrink: true }}
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
              <FormControl fullWidth error={!!errors.typeStage} required>
                <InputLabel>Type de stage</InputLabel>
                <Select
                  value={typeStage}
                  onChange={handleTypeStageChange}
                  label="Type de stage"
                >
                  <MenuItem value="temps_plein">Temps plein</MenuItem>
                  <MenuItem value="temps_partiel">Temps partiel</MenuItem>
                  <MenuItem value="alternance">Alternance</MenuItem>
                  <MenuItem value="stage_etude">Stage d'étude</MenuItem>
                </Select>
                {errors.typeStage && <FormHelperText>{errors.typeStage}</FormHelperText>}
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
  );
};

export default AjouterOffre;
