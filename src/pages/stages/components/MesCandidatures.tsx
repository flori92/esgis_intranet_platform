import React, { useState } from 'react';
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
import { Candidature, Entretien } from '../types';

interface MesCandidaturesProps {
  candidatures: Candidature[];
  supprimerCandidature: (id: number) => Promise<void>;
  modifierCandidature: (id: number, lettreMotivation: string) => Promise<void>;
  entretiens: Entretien[];
}

const MesCandidatures: React.FC<MesCandidaturesProps> = ({
  candidatures,
  supprimerCandidature,
  modifierCandidature,
  entretiens
}) => {
  const [dialogCandidature, setDialogCandidature] = useState<{
    open: boolean;
    candidature: Candidature | null;
    action: 'view' | 'edit';
  }>({
    open: false,
    candidature: null,
    action: 'view'
  });
  
  const [dialogConfirmation, setDialogConfirmation] = useState<{
    open: boolean;
    candidatureId: number | null;
  }>({
    open: false,
    candidatureId: null
  });
  
  const [lettreMotivation, setLettreMotivation] = useState('');
  
  const [dialogEntretien, setDialogEntretien] = useState<{
    open: boolean;
    entretien: Entretien | null;
  }>({
    open: false,
    entretien: null
  });

  // Fonction pour obtenir le statut formaté d'une candidature
  const getStatusChip = (status: string) => {
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

  // Fonction pour ouvrir le dialog de candidature
  const handleOpenCandidatureDialog = (candidature: Candidature, action: 'view' | 'edit') => {
    setDialogCandidature({
      open: true,
      candidature,
      action
    });
    setLettreMotivation(candidature.lettreMotivation);
  };

  // Fonction pour fermer le dialog de candidature
  const handleCloseCandidatureDialog = () => {
    setDialogCandidature({
      open: false,
      candidature: null,
      action: 'view'
    });
  };

  // Fonction pour ouvrir le dialog de confirmation de suppression
  const handleOpenConfirmationDialog = (candidatureId: number) => {
    setDialogConfirmation({
      open: true,
      candidatureId
    });
  };

  // Fonction pour fermer le dialog de confirmation
  const handleCloseConfirmationDialog = () => {
    setDialogConfirmation({
      open: false,
      candidatureId: null
    });
  };

  // Fonction pour confirmer la suppression
  const handleConfirmDelete = async () => {
    if (dialogConfirmation.candidatureId) {
      await supprimerCandidature(dialogConfirmation.candidatureId);
      handleCloseConfirmationDialog();
    }
  };

  // Fonction pour enregistrer les modifications
  const handleSaveChanges = async () => {
    if (dialogCandidature.candidature) {
      await modifierCandidature(dialogCandidature.candidature.id, lettreMotivation);
      handleCloseCandidatureDialog();
    }
  };

  // Fonction pour ouvrir le dialog d'entretien
  const handleOpenEntretienDialog = (candidatureId: number) => {
    const entretien = entretiens.find(e => e.candidatureId === candidatureId) || null;
    setDialogEntretien({
      open: true,
      entretien
    });
  };

  // Fonction pour fermer le dialog d'entretien
  const handleCloseEntretienDialog = () => {
    setDialogEntretien({
      open: false,
      entretien: null
    });
  };

  // Fonction pour obtenir le type d'entretien formaté
  const getTypeEntretien = (type: string) => {
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
      <Typography variant="h6" sx={{ mb: 2 }}>
        Mes candidatures
      </Typography>

      {candidatures.length === 0 ? (
        <Typography variant="body1" color="text.secondary">
          Vous n'avez pas encore postulé à des offres de stage.
        </Typography>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Offre</TableCell>
                <TableCell>Entreprise</TableCell>
                <TableCell>Date de candidature</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {candidatures.map((candidature) => {
                const hasEntretien = entretiens.some(e => e.candidatureId === candidature.id);
                
                return (
                  <TableRow key={candidature.id}>
                    <TableCell>{candidature.offre.titre}</TableCell>
                    <TableCell>{candidature.offre.entreprise}</TableCell>
                    <TableCell>
                      {format(new Date(candidature.dateCandidature), 'dd MMM yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell>{getStatusChip(candidature.status)}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Voir">
                        <IconButton 
                          size="small"
                          onClick={() => handleOpenCandidatureDialog(candidature, 'view')}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      {candidature.status === 'pending' && (
                        <>
                          <Tooltip title="Modifier">
                            <IconButton 
                              size="small"
                              onClick={() => handleOpenCandidatureDialog(candidature, 'edit')}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Supprimer">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleOpenConfirmationDialog(candidature.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      
                      {candidature.status === 'interview' && (
                        <Tooltip title="Voir l'entretien">
                          <IconButton 
                            size="small" 
                            color="warning"
                            onClick={() => handleOpenEntretienDialog(candidature.id)}
                          >
                            <EventIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog pour voir/modifier une candidature */}
      <Dialog 
        open={dialogCandidature.open} 
        onClose={handleCloseCandidatureDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {dialogCandidature.action === 'view' ? 'Détails de la candidature' : 'Modifier la candidature'}
        </DialogTitle>
        
        <DialogContent>
          {dialogCandidature.candidature && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Offre : {dialogCandidature.candidature.offre.titre}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <BusinessIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2">
                  {dialogCandidature.candidature.offre.entreprise}
                </Typography>
              </Box>
              
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                Lettre de motivation
              </Typography>
              
              {dialogCandidature.action === 'view' ? (
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="body2" style={{ whiteSpace: 'pre-line' }}>
                    {dialogCandidature.candidature.lettreMotivation}
                  </Typography>
                </Paper>
              ) : (
                <TextField
                  multiline
                  rows={8}
                  fullWidth
                  value={lettreMotivation}
                  onChange={(e) => setLettreMotivation(e.target.value)}
                  variant="outlined"
                />
              )}
              
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                CV
              </Typography>
              
              <Button 
                variant="outlined" 
                component="a" 
                href={dialogCandidature.candidature.cvPath} 
                target="_blank"
              >
                Voir mon CV
              </Button>
              
              {dialogCandidature.candidature.commentaires && (
                <>
                  <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                    Commentaires
                  </Typography>
                  
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="body2" style={{ whiteSpace: 'pre-line' }}>
                      {dialogCandidature.candidature.commentaires}
                    </Typography>
                  </Paper>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseCandidatureDialog}>
            Fermer
          </Button>
          
          {dialogCandidature.action === 'edit' && (
            <Button 
              onClick={handleSaveChanges}
              variant="contained"
              color="primary"
            >
              Enregistrer
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmation de suppression */}
      <Dialog
        open={dialogConfirmation.open}
        onClose={handleCloseConfirmationDialog}
      >
        <DialogTitle>
          Confirmer la suppression
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="body1">
            Êtes-vous sûr de vouloir supprimer cette candidature ? Cette action est irréversible.
          </Typography>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseConfirmationDialog}>
            Annuler
          </Button>
          <Button 
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog d'informations sur l'entretien */}
      <Dialog
        open={dialogEntretien.open}
        onClose={handleCloseEntretienDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Détails de l'entretien
        </DialogTitle>
        
        <DialogContent>
          {dialogEntretien.entretien ? (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Date : {format(new Date(dialogEntretien.entretien.date), 'EEEE d MMMM yyyy à HH:mm', { locale: fr })}
              </Typography>
              
              <Typography variant="subtitle2" gutterBottom>
                Type : {getTypeEntretien(dialogEntretien.entretien.type)}
              </Typography>
              
              <Typography variant="subtitle2" gutterBottom>
                Lieu : {dialogEntretien.entretien.lieu}
              </Typography>
              
              {dialogEntretien.entretien.notes && (
                <>
                  <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                    Notes
                  </Typography>
                  
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="body2" style={{ whiteSpace: 'pre-line' }}>
                      {dialogEntretien.entretien.notes}
                    </Typography>
                  </Paper>
                </>
              )}
            </Box>
          ) : (
            <Typography variant="body1" color="text.secondary">
              Aucun détail d'entretien disponible.
            </Typography>
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
