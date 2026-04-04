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
import { Offre } from '../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { uploadFile, getPublicUrl } from '../../../api/storage';

interface OffresListProps {
  offres: Offre[];
  postuler: (offreId: number, lettreMotivation: string, cvPath: string) => Promise<{success: boolean; message: string}>;
  filtreActif: string;
  changerFiltre: (filtre: string) => void;
  isStudent: boolean;
  isAuthenticated: boolean;
}

const OffresListComponent: React.FC<OffresListProps> = ({ 
  offres, 
  postuler, 
  filtreActif, 
  changerFiltre,
  isStudent,
  isAuthenticated
}) => {
  const [offreSelectionnee, setOffreSelectionnee] = useState<Offre | null>(null);
  const [modalCandidatureOuverte, setModalCandidatureOuverte] = useState(false);
  const [lettreMotivation, setLettreMotivation] = useState('');
  const [fichierCV, setFichierCV] = useState<File | null>(null);
  const [chargementCV, setChargementCV] = useState(false);
  const [cvError, setCvError] = useState<string | null>(null);
  const [cvPath, setCvPath] = useState('');

  const handleOuvrirModalCandidature = (offre: Offre) => {
    setOffreSelectionnee(offre);
    setModalCandidatureOuverte(true);
    setLettreMotivation('');
    setFichierCV(null);
    setCvPath('');
    setCvError(null);
  };

  const handleFermerModalCandidature = () => {
    setModalCandidatureOuverte(false);
    setOffreSelectionnee(null);
  };

  const handleChangementCV = (event: React.ChangeEvent<HTMLInputElement>) => {
    if ((event.target as HTMLInputElement).files && (event.target as HTMLInputElement).files.length > 0) {
      const fichier = (event.target as HTMLInputElement).files[0];
      
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

  const handleEnvoyerCandidature = async () => {
    if (!offreSelectionnee || !fichierCV) {
      return;
    }
    
    try {
      setChargementCV(true);
      
      // 1. Uploader le CV
      const fileName = `cv_${Date.now()}_${fichierCV.name}`;
      const filePath = `stages/cv/${fileName}`;
      
      const { error: uploadError } = await uploadFile('files', filePath, fichierCV, {
        cacheControl: '3600',
        upsert: false
      });

      if (uploadError) {
        throw uploadError;
      }

      // 2. Obtenir l'URL du CV
      const { publicUrl } = getPublicUrl('files', filePath);

      const fileUrl = publicUrl;
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

  // Fonction pour formater la rémunération
  const formaterRemuneration = (remuneration: number | null): string => {
    if (remuneration === null) {
      return 'Non rémunéré';
    }
    if (remuneration === 0) {
      return 'Non rémunéré';
    }
    
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(remuneration);
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          {offres.length} offre{offres.length > 1 ? 's' : ''} disponible{offres.length > 1 ? 's' : ''}
        </Typography>
        
        <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="filtre-label">Filtrer les offres</InputLabel>
          <Select
            labelId="filtre-label"
            value={filtreActif}
            onChange={(event: SelectChangeEvent) => {
              // Utilisation du type correct pour l'événement
              changerFiltre(event.target.value);
            }}
            label="Filtrer les offres"
          >
            <MenuItem value="toutes">Toutes les offres</MenuItem>
            <MenuItem value="récentes">Offres récentes (1 mois)</MenuItem>
            <MenuItem value="département">Mon département</MenuItem>
            <MenuItem value="niveau">Mon niveau</MenuItem>
          </Select>
        </FormControl>
        
        <FormControl variant="outlined" size="small" sx={{ minWidth: 200, mb: 3 }}>
          <InputLabel id="filtre-type-stage-label">Filtrer par type</InputLabel>
          <Select
            labelId="filtre-type-stage-label"
            value={filtreActif}
            onChange={(event: SelectChangeEvent) => {
              // Utilisation du type correct pour l'événement
              changerFiltre(event.target.value);
            }}
            label="Filtrer par type"
          >
            <MenuItem value="">Tous les types</MenuItem>
            <MenuItem value="temps_plein">Temps plein</MenuItem>
            <MenuItem value="temps_partiel">Temps partiel</MenuItem>
            <MenuItem value="alternance">Alternance</MenuItem>
            <MenuItem value="stage_etude">Stage d'étude</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {offres.length === 0 ? (
        <Alert severity="info">
          Aucune offre disponible avec les filtres sélectionnés.
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {offres.map((offre) => (
            <Grid item xs={12} md={6} lg={4} key={offre.id}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {offre.titre}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <BusinessIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">{offre.entreprise.nom}</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <LocationIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">{offre.lieu}</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CalendarIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      Du {format(new Date(offre.dateDebut), 'dd/MM/yyyy', { locale: fr })} au {format(new Date(offre.dateFin), 'dd/MM/yyyy', { locale: fr })}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <EuroIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      {formaterRemuneration(offre.remuneration)}
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {offre.description.length > 100 
                      ? `${offre.description.substring(0, 100)}...` 
                      : offre.description}
                  </Typography>
                  
                  <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
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
}

export default OffresListComponent;
