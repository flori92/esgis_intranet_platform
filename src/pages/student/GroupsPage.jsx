import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Dialog, DialogContent, Tab, Tabs, Button } from '@mui/material';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import GroupService from '@/services/GroupService';
import GroupList from '@/components/groups/GroupList';
import DocumentList from '@/components/documents/DocumentList';
import DocumentService from '@/services/DocumentService';

/**
 * Page de gestion des groupes de TP pour les étudiants
 */
const StudentGroupsPage = () => {
  const { user, profile } = useSupabaseAuth();
  const [myGroups, setMyGroups] = useState([]);
  const [availableGroups, setAvailableGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('documents'); // documents
  const [groupDocuments, setGroupDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState(null);

  // Charger les groupes de l'étudiant
  useEffect(() => {
    const fetchGroups = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        
        // Récupérer les groupes auxquels l'étudiant est inscrit
        const studentGroups = await GroupService.getStudentGroups(user.id);
        setMyGroups(studentGroups);
        
        // Récupérer les groupes disponibles pour l'étudiant
        const available = await GroupService.getAvailableGroups(user.id);
        setAvailableGroups(available);
        
        setError(null);
      } catch (err) {
        console.error('Erreur lors du chargement des groupes:', err);
        setError('Impossible de charger les groupes. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [user]);

  // Charger les documents d'un groupe
  const fetchGroupDocuments = async (groupId) => {
    try {
      setDocumentsLoading(true);
      const documents = await DocumentService.getGroupDocuments(groupId);
      setGroupDocuments(documents);
      setDocumentsError(null);
    } catch (err) {
      console.error('Erreur lors du chargement des documents:', err);
      setDocumentsError('Impossible de charger les documents. Veuillez réessayer plus tard.');
    } finally {
      setDocumentsLoading(false);
    }
  };

  // Gérer le changement d'onglet
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Ouvrir le dialogue de documents
  const handleOpenDocumentsDialog = async (group) => {
    setDialogOpen(true);
    setDialogMode('documents');
    setSelectedGroup(group);
    await fetchGroupDocuments(group.id);
  };

  // Fermer le dialogue
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  // Gérer la demande d'adhésion à un groupe
  const handleJoinGroup = async (group) => {
    try {
      await GroupService.requestToJoinGroup(group.id, user.id);
      
      // Mettre à jour les listes de groupes
      setAvailableGroups(prev => prev.filter(g => g.id !== group.id));
      
      // Ajouter le groupe à la liste des groupes de l'étudiant avec le statut "en attente"
      const newGroup = {
        ...group,
        status: 'pending'
      };
      
      setMyGroups(prev => [newGroup, ...prev]);
      
      alert('Demande d\'adhésion envoyée avec succès !');
    } catch (err) {
      console.error('Erreur lors de la demande d\'adhésion:', err);
      alert('Impossible d\'envoyer la demande d\'adhésion. Veuillez réessayer plus tard.');
    }
  };

  // Gérer le téléchargement d'un document
  const handleDownloadDocument = async (document) => {
    try {
      // Extraire le chemin du fichier de l'URL
      const url = document.file_url;
      
      // Ouvrir l'URL dans un nouvel onglet
      window.open(url, '_blank');
    } catch (err) {
      console.error('Erreur lors du téléchargement du document:', err);
      alert('Impossible de télécharger le document. Veuillez réessayer plus tard.');
    }
  };

  // Gérer la visualisation d'un document
  const handleViewDocument = (document) => {
    // Ouvrir l'URL dans un nouvel onglet
    window.open(document.file_url, '_blank');
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Mes Groupes de TP
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="fullWidth"
          >
            <Tab label="Mes Groupes" />
            <Tab label="Groupes Disponibles" />
          </Tabs>
        </Box>

        {tabValue === 0 ? (
          <GroupList
            groups={myGroups}
            loading={loading}
            error={error}
            onView={handleOpenDocumentsDialog}
            onManageDocuments={handleOpenDocumentsDialog}
            isProfessor={false}
          />
        ) : (
          <Box>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Voici les groupes de TP disponibles. Vous pouvez demander à rejoindre un groupe en cliquant sur "Rejoindre".
            </Typography>
            
            {loading && <Typography>Chargement des groupes...</Typography>}
            
            {error && (
              <Typography color="error">
                {error}
              </Typography>
            )}
            
            {!loading && !error && availableGroups.length === 0 && (
              <Typography sx={{ textAlign: 'center', color: 'text.secondary', my: 3 }}>
                Aucun groupe disponible pour le moment.
              </Typography>
            )}
            
            {!loading && !error && availableGroups.length > 0 && (
              <GroupList
                groups={availableGroups}
                onView={(group) => handleJoinGroup(group)}
                isProfessor={false}
              />
            )}
          </Box>
        )}
      </Box>

      {/* Dialogue de documents */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogContent>
          {dialogMode === 'documents' && (
            <Box>
              <Typography variant="h6" component="h2" gutterBottom>
                Documents du groupe {selectedGroup?.name}
              </Typography>

              <DocumentList
                documents={groupDocuments}
                loading={documentsLoading}
                error={documentsError}
                onDownload={handleDownloadDocument}
                onView={handleViewDocument}
                canEdit={false}
              />
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default StudentGroupsPage;
