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
import { Candidature, Entretien } from '../types';
import { useAuth } from '../../../context/AuthContext';
import { fetchRecords, updateRecord, deleteRecord } from '../../../utils/supabase-helpers';
import { InputChangeEvent } from '../../../types/events';

interface MesCandidaturesProps {
  onUpdate: () => void;
}

const MesCandidatures: React.FC<MesCandidaturesProps> = ({ onUpdate }) => {
  const { authState } = useAuth();
  const [candidatures, setCandidatures] = useState<Candidature[]>([]);
  const [selectedCandidature, setSelectedCandidature] = useState<Candidature | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [lettreMotivation, setLettreMotivation] = useState('');
  const [entretiens, setEntretiens] = useState<Entretien[]>([]);

  useEffect(() => {
    fetchCandidatures();
  }, [authState.student?.id]);

  const fetchCandidatures = async () => {
    try {
      if (!authState.student?.id) return;

      const data = await fetchRecords<'candidatures'>('candidatures', {
        filters: [{ column: 'student_id', operator: 'eq', value: authState.student.id }]
      });

      setCandidatures(data);
    } catch (error) {
      console.error('Erreur lors de la récupération des candidatures:', error);
    }
  };

  const handleEdit = (candidature: Candidature) => {
    setSelectedCandidature(candidature);
    setLettreMotivation(candidature.lettre_motivation || '');
    setEditDialogOpen(true);
  };

  const handleCloseEdit = () => {
    setSelectedCandidature(null);
    setLettreMotivation('');
    setEditDialogOpen(false);
  };

  const handleSaveEdit = async () => {
    try {
      if (!selectedCandidature) return;

      await updateRecord('candidatures', selectedCandidature.id, {
        lettre_motivation: lettreMotivation
      });

      handleCloseEdit();
      fetchCandidatures();
      onUpdate();
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la candidature:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette candidature ?')) return;

    try {
      await deleteRecord('candidatures', id);
      fetchCandidatures();
      onUpdate();
    } catch (error) {
      console.error('Erreur lors de la suppression de la candidature:', error);
    }
  };

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

  // Fonction pour ouvrir le dialog d'entretien
  const handleOpenEntretienDialog = (candidatureId: number) => {
    const entretien = entretiens.find(e => e.candidatureId === candidatureId) || null;
    setSelectedCandidature(candidatures.find(c => c.id === candidatureId) || null);
    setLettreMotivation(selectedCandidature?.lettreMotivation || '');
    setEditDialogOpen(true);
  };

  // Fonction pour fermer le dialog d'entretien
  const handleCloseEntretienDialog = () => {
    setSelectedCandidature(null);
    setLettreMotivation('');
    setEditDialogOpen(false);
  };

  // Fonction pour obtenir le type d'entretien formaté
  const getTypeEntretien = (type: string) => {
    switch (type) {
      case 'presentiel':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <BusinessIcon fontSize="small" sx={{ mr: 0.5 }} />
            <span>Présentiel</span>
          </Box>
        );
      case 'visioconference':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <EventIcon fontSize="small" sx={{ mr: 0.5 }} />
            <span>Visioconférence</span>
          </Box>
        );
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
          <Typography variant="body1" color="text.secondary">
            Vous n'avez pas encore postulé à des offres de stage.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
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
                    <TableCell>
                      {candidature.offre?.titre || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {candidature.offre?.entreprise.nom || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {format(new Date(candidature.date_candidature), 'dd/MM/yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell>
                      {getStatusChip(candidature.status)}
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Tooltip title="Voir les détails">
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(candidature)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Supprimer ma candidature">
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
                onChange={(e: InputChangeEvent) => setLettreMotivation(e.target.value)}
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
    </Box>
  );
};

export default MesCandidatures;
