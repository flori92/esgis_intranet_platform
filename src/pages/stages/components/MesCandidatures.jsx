import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Business as BusinessIcon,
  Event as EventIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '../../../hooks/useAuth';

/**
 * @typedef {import('../types').Candidature} Candidature
 * @typedef {import('../types').Entretien} Entretien
 */

/**
 * Composant affichant les candidatures de l'étudiant
 * @param {Object} props - Propriétés du composant
 * @param {Candidature[]} props.candidatures - Liste des candidatures
 * @param {Entretien[]} props.entretiens - Liste des entretiens
 * @param {function} props.onAnnuler - Fonction pour annuler une candidature
 * @param {function} props.supprimerCandidature - Fonction pour supprimer une candidature
 * @param {function} props.modifierCandidature - Fonction pour modifier une candidature
 * @returns {JSX.Element} Composant d'affichage des candidatures
 */
const MesCandidatures = ({ 
  candidatures, 
  entretiens, 
  onAnnuler, 
  supprimerCandidature, 
  modifierCandidature 
}) => {
  const { authState } = useAuth();
  const [selectedCandidature, setSelectedCandidature] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [lettreMotivation, setLettreMotivation] = useState('');
  const [entretienDialogOpen, setEntretienDialogOpen] = useState(false);
  const [selectedEntretien, setSelectedEntretien] = useState(null);

  /**
   * Gérer l'édition d'une candidature
   * @param {Candidature} candidature - Candidature à éditer
   */
  const handleEdit = (candidature) => {
    setSelectedCandidature(candidature);
    setLettreMotivation(candidature.lettreMotivation || '');
    setEditDialogOpen(true);
  };

  /**
   * Fermer le dialogue d'édition
   */
  const handleCloseEdit = () => {
    setSelectedCandidature(null);
    setLettreMotivation('');
    setEditDialogOpen(false);
  };

  /**
   * Sauvegarder les modifications d'une candidature
   */
  const handleSaveEdit = async () => {
    try {
      if (!selectedCandidature) {
        return;
      }

      await modifierCandidature(selectedCandidature.id, lettreMotivation);
      handleCloseEdit();
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la candidature:', error);
    }
  };

  /**
   * Supprimer une candidature
   * @param {number} id - ID de la candidature à supprimer
   */
  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette candidature ?')) {
      return;
    }

    try {
      await supprimerCandidature(id);
    } catch (error) {
      console.error('Erreur lors de la suppression de la candidature:', error);
    }
  };

  /**
   * Obtenir le statut formaté d'une candidature
   * @param {string} status - Statut de la candidature
   * @returns {JSX.Element} Composant Chip représentant le statut
   */
  const getStatusChip = (status) => {
    switch (status) {
      case 'pending':
        return <Chip label="En attente" color="primary" variant="outlined" size="small" />;
      case 'accepted':
        return <Chip label="Acceptée" color="success" size="small" />;
      case 'rejected':
        return <Chip label="Refusée" color="error" size="small" />;
      case 'interview':
        return <Chip label="Entretien" color="warning" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  /**
   * Ouvrir le dialogue d'entretien
   * @param {number} candidatureId - ID de la candidature
   */
  const handleOpenEntretienDialog = (candidatureId) => {
    const entretien = entretiens.find(e => e.candidatureId === candidatureId) || null;
    setSelectedEntretien(entretien);
    setEntretienDialogOpen(true);
  };

  /**
   * Fermer le dialogue d'entretien
   */
  const handleCloseEntretienDialog = () => {
    setSelectedEntretien(null);
    setEntretienDialogOpen(false);
  };

  /**
   * Obtenir le type d'entretien formaté
   * @param {string} type - Type d'entretien
   * @returns {string} Type d'entretien formaté
   */
  const getTypeEntretien = (type) => {
    switch (type) {
      case 'presentiel':
        return 'Présentiel';
      case 'visioconference':
        return 'Visioconférence';
      case 'telephonique':
        return 'Téléphonique';
      default:
        return type;
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Mes candidatures
      </Typography>
      
      {candidatures.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1">
            Vous n'avez pas encore postulé à des offres de stage.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Entreprise</TableCell>
                <TableCell>Offre</TableCell>
                <TableCell>Date de candidature</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {candidatures.map((candidature) => {
                const hasEntretien = entretiens.some(e => e.candidatureId === candidature.id);
                
                return (
                  <TableRow key={candidature.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <BusinessIcon sx={{ mr: 1, color: 'primary.main' }} />
                        {candidature.offre.entreprise.nom}
                      </Box>
                    </TableCell>
                    <TableCell>{candidature.offre.titre}</TableCell>
                    <TableCell>
                      {format(new Date(candidature.date_candidature), 'dd/MM/yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell>
                      {getStatusChip(candidature.status)}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex' }}>
                        <Tooltip title="Voir/Modifier">
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(candidature)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Annuler ma candidature">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(candidature.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                        
                        {hasEntretien && (
                          <Tooltip title="Voir les détails de l'entretien">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenEntretienDialog(candidature.id)}
                            >
                              <EventIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog de détails/modification de candidature */}
      <Dialog
        open={editDialogOpen}
        onClose={handleCloseEdit}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedCandidature ? 'Modifier ma candidature' : 'Détails de ma candidature'}
        </DialogTitle>
        
        <DialogContent>
          {selectedCandidature && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                {selectedCandidature.offre?.titre}
              </Typography>
              
              <Typography variant="subtitle1" gutterBottom>
                {selectedCandidature.offre?.entreprise.nom}
              </Typography>
              
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Candidature envoyée le {format(new Date(selectedCandidature.date_candidature), 'dd MMMM yyyy', { locale: fr })}
              </Typography>
              
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                Statut : {getStatusChip(selectedCandidature.status)}
              </Typography>
              
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                Lettre de motivation
              </Typography>
              
              <TextField
                fullWidth
                multiline
                rows={8}
                variant="outlined"
                value={lettreMotivation}
                onChange={(e) => setLettreMotivation(e.target.value)}
              />
              
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                CV
              </Typography>
              
              <Button 
                variant="outlined" 
                component="a" 
                href={selectedCandidature.cv_path} 
                target="_blank"
              >
                Voir mon CV
              </Button>
              
              {selectedCandidature.commentaires && (
                <>
                  <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                    Commentaires
                  </Typography>
                  
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="body2" style={{ whiteSpace: 'pre-line' }}>
                      {selectedCandidature.commentaires}
                    </Typography>
                  </Paper>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseEdit}>
            Fermer
          </Button>
          
          {selectedCandidature && (
            <Button 
              onClick={handleSaveEdit}
              variant="contained"
              color="primary"
            >
              Enregistrer
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Dialog d'entretien */}
      <Dialog
        open={entretienDialogOpen}
        onClose={handleCloseEntretienDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Détails de l'entretien
        </DialogTitle>
        
        <DialogContent>
          {selectedEntretien && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Type : {getTypeEntretien(selectedEntretien.type)}
              </Typography>
              
              <Typography variant="subtitle1" gutterBottom>
                Date : {format(new Date(selectedEntretien.date), 'dd MMMM yyyy à HH:mm', { locale: fr })}
              </Typography>
              
              <Typography variant="subtitle1" gutterBottom>
                Lieu : {selectedEntretien.lieu}
              </Typography>
              
              {selectedEntretien.lien_visio && (
                <Typography variant="subtitle1" gutterBottom>
                  Lien : <a href={selectedEntretien.lien_visio} target="_blank" rel="noopener noreferrer">
                    {selectedEntretien.lien_visio}
                  </a>
                </Typography>
              )}
              
              <Typography variant="subtitle1" gutterBottom>
                Contact : {selectedEntretien.contact}
              </Typography>
              
              <Typography variant="subtitle1" gutterBottom>
                Durée : {selectedEntretien.duree} minutes
              </Typography>
              
              {selectedEntretien.notes && (
                <>
                  <Typography variant="subtitle1" gutterBottom>
                    Notes :
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="body2" style={{ whiteSpace: 'pre-line' }}>
                      {selectedEntretien.notes}
                    </Typography>
                  </Paper>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseEntretienDialog}>
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MesCandidatures;
