import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Divider,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  SelectChangeEvent
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Business as BusinessIcon,
  EuroSymbol as EuroIcon,
  School as SchoolIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/supabase';

/**
 * @typedef {import('../types').Offre} Offre
 */

/**
 * Composant d'affichage des offres de stage
 * @param {Object} props - Propriétés du composant
 * @param {Offre[]} props.offres - Liste des offres de stage
 * @param {function} props.postuler - Fonction pour postuler à une offre
 * @param {string} props.filtreActif - Filtre actif
 * @param {function} props.changerFiltre - Fonction pour changer le filtre
 * @param {boolean} props.isStudent - Si l'utilisateur est un étudiant
 * @param {boolean} props.isAuthenticated - Si l'utilisateur est authentifié
 * @returns {JSX.Element} Composant d'affichage des offres
 */
const OffresListComponent = ({ 
  offres, 
  postuler, 
  filtreActif, 
  changerFiltre,
  isStudent,
  isAuthenticated
}) => {
  const [offreSelectionnee, setOffreSelectionnee] = useState(null);
  const [modalCandidatureOuverte, setModalCandidatureOuverte] = useState(false);
  const [lettreMotivation, setLettreMotivation] = useState('');
  const [fichierCV, setFichierCV] = useState(null);
  const [chargementCV, setChargementCV] = useState(false);
  const [cvError, setCvError] = useState(null);
  const [cvPath, setCvPath] = useState('');

  /**
   * Ouvrir le modal de candidature
   * @param {Offre} offre - Offre sélectionnée
   */
  const handleOuvrirModalCandidature = (offre) => {
    setOffreSelectionnee(offre);
    setModalCandidatureOuverte(true);
    setLettreMotivation('');
    setFichierCV(null);
    setCvPath('');
    setCvError(null);
  };

  /**
   * Fermer le modal de candidature
   */
  const handleFermerModalCandidature = () => {
    setModalCandidatureOuverte(false);
    setOffreSelectionnee(null);
  };

  /**
   * Gérer le changement de fichier CV
   * @param {React.ChangeEvent<HTMLInputElement>} event - Événement de changement
   */
  const handleChangementCV = (event) => {
    if (event.target.files && event.target.files.length > 0) {
      const fichier = event.target.files[0];
      
      // Vérifier le type de fichier
      if (fichier.type !== 'application/pdf') {
        setCvError('Seuls les fichiers PDF sont acceptés');
        return;
      }
      
      // Vérifier la taille du fichier (max 5MB)
      if (fichier.size > 5 * 1024 * 1024) {
        setCvError('La taille du fichier ne doit pas dépasser 5MB');
        return;
      }
      
      setFichierCV(fichier);
      setCvError(null);
    }
  };

  /**
   * Envoyer la candidature
   */
  const handleEnvoyerCandidature = async () => {
    if (!offreSelectionnee || !fichierCV) {
      return;
    }
    
    try {
      setChargementCV(true);
      
      // 1. Uploader le CV
      const fileName = `cv_${Date.now()}_${fichierCV.name}`;
      const filePath = `stages/cv/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('files')
        .upload(filePath, fichierCV, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        throw uploadError;
      }
      
      // 2. Obtenir l'URL du CV
      const { data: urlData } = supabase.storage
        .from('files')
        .getPublicUrl(filePath);
      
      const fileUrl = urlData.publicUrl;
      setCvPath(fileUrl);
      
      // 3. Envoyer la candidature
      await postuler(offreSelectionnee.id, lettreMotivation, fileUrl);
      
      // 4. Fermer le modal
      handleFermerModalCandidature();
      
    } catch (error) {
      console.error('Erreur lors de l\'upload du CV:', error);
      setCvError('Une erreur est survenue lors de l\'upload du CV');
    } finally {
      setChargementCV(false);
    }
  };

  /**
   * Formater la rémunération
   * @param {number|null} remuneration - Montant de la rémunération
   * @returns {string} Rémunération formatée
   */
  const formaterRemuneration = (remuneration) => {
    if (remuneration === null) {
      return 'Non rémunéré';
    }
    if (remuneration === 0) {
      return 'Non rémunéré';
    }
    if (remuneration < 1000) {
      return `${remuneration}€/mois`;
    }
    return `${remuneration}€/mois`;
  };

  // Filtrer les offres selon le filtre actif
  const offresFiltrees = offres.filter(offre => {
    if (filtreActif === 'all') {
      return true;
    }
    if (filtreActif === 'temps_plein' && offre.typeStage === 'temps_plein') {
      return true;
    }
    if (filtreActif === 'temps_partiel' && offre.typeStage === 'temps_partiel') {
      return true;
    }
    if (filtreActif === 'alternance' && offre.typeStage === 'alternance') {
      return true;
    }
    return false;
  });

  return (
    <Box>
      {/* Filtre des offres */}
      <Box sx={{ mb: 3 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="filtre-offres-label">Type de stage</InputLabel>
          <Select
            labelId="filtre-offres-label"
            id="filtre-offres"
            value={filtreActif}
            label="Type de stage"
            onChange={(e) => changerFiltre(e.target.value)}
          >
            <MenuItem value="all">Tous les types</MenuItem>
            <MenuItem value="temps_plein">Temps plein</MenuItem>
            <MenuItem value="temps_partiel">Temps partiel</MenuItem>
            <MenuItem value="alternance">Alternance</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      {/* Liste des offres */}
      {offresFiltrees.length === 0 ? (
        <Typography variant="body1" sx={{ mt: 2 }}>
          Aucune offre de stage ne correspond à vos critères.
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {offresFiltrees.map((offre) => (
            <Grid item xs={12} md={6} lg={4} key={offre.id}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {offre.titre}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {offre.description.length > 100 
                      ? `${offre.description.substring(0, 100)}...` 
                      : offre.description}
                  </Typography>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <BusinessIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="body2">
                      {offre.entreprise.nom} - {offre.entreprise.secteur}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <LocationIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="body2">
                      {offre.lieu}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CalendarIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="body2">
                      {format(new Date(offre.dateDebut), 'dd MMMM yyyy', { locale: fr })} - 
                      {format(new Date(offre.dateFin), 'dd MMMM yyyy', { locale: fr })}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <EuroIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="body2">
                      {formaterRemuneration(offre.remuneration)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <SchoolIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="body2">
                      {offre.niveauRequis.join(', ')}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    <Chip 
                      label={offre.typeStage.replace('_', ' ')} 
                      size="small" 
                      color="primary" 
                      variant="outlined" 
                    />
                    {offre.competencesRequises.slice(0, 3).map((competence, index) => (
                      <Chip key={index} label={competence} size="small" />
                    ))}
                    {offre.competencesRequises.length > 3 && (
                      <Chip 
                        label={`+${offre.competencesRequises.length - 3}`} 
                        size="small" 
                        variant="outlined" 
                      />
                    )}
                  </Box>
                </CardContent>
                
                <CardActions>
                  {isStudent && isAuthenticated ? (
                    <Button 
                      size="small" 
                      variant="contained" 
                      onClick={() => handleOuvrirModalCandidature(offre)}
                    >
                      Postuler
                    </Button>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      Connectez-vous en tant qu'étudiant pour postuler
                    </Typography>
                  )}
                  
                  <Button size="small" endIcon={<DescriptionIcon />}>
                    Détails
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Modal de candidature */}
      <Dialog 
        open={modalCandidatureOuverte} 
        onClose={handleFermerModalCandidature}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Postuler pour : {offreSelectionnee?.titre}
        </DialogTitle>
        
        <DialogContent>
          {offreSelectionnee && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Entreprise : {offreSelectionnee.entreprise.nom}
              </Typography>
              
              <TextField
                label="Lettre de motivation"
                multiline
                rows={6}
                fullWidth
                value={lettreMotivation}
                onChange={(e) => setLettreMotivation(e.target.value)}
                placeholder="Présentez-vous et expliquez pourquoi ce stage vous intéresse..."
                margin="normal"
                required
              />
              
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  component="label"
                >
                  Sélectionner votre CV (PDF)
                  <input
                    type="file"
                    hidden
                    accept="application/pdf"
                    onChange={handleChangementCV}
                  />
                </Button>
                
                {fichierCV && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Fichier sélectionné : {fichierCV.name}
                  </Typography>
                )}
                
                {cvError && (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    {cvError}
                  </Alert>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleFermerModalCandidature}>
            Annuler
          </Button>
          <Button 
            onClick={handleEnvoyerCandidature}
            variant="contained"
            disabled={!lettreMotivation || !fichierCV || chargementCV}
          >
            {chargementCV ? 'Envoi en cours...' : 'Envoyer ma candidature'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OffresListComponent;
