import React, { useState, useEffect } from 'react';
import { Box, Container, Grid, Tab, Tabs, Typography, Dialog, DialogContent } from '@mui/material';
import { useAuth } from '@/context/AuthContext';
import DocumentService from '@/services/DocumentService';
import DocumentList from '@/components/documents/DocumentList';
import { DOCUMENT_TYPES } from '@/types/documents';

/**
 * Page de consultation et téléchargement des documents pour les étudiants
 */
const StudentDocumentsPage = () => {
  const { authState } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  // Charger les documents accessibles à l'étudiant
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!authState.user?.id) return;
      
      try {
        setLoading(true);
        
        // Récupérer tous les documents publics et ceux des groupes de l'étudiant
        const docs = await DocumentService.getUserDocuments(authState.user.id);
        
        setDocuments(docs);
        setError(null);
      } catch (err) {
        console.error('Erreur lors du chargement des documents:', err);
        setError('Impossible de charger les documents. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [authState.user]);

  // Gérer le changement d'onglet
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
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
    setSelectedDocument(document);
    setViewDialogOpen(true);
  };

  // Fermer le dialogue de visualisation
  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
    setSelectedDocument(null);
  };

  // Filtrer les documents en fonction de l'onglet sélectionné
  const getFilteredDocuments = () => {
    switch (tabValue) {
      case 0: // Tous
        return documents;
      case 1: // Cours
        return documents.filter(doc => doc.type === DOCUMENT_TYPES.COURSE);
      case 2: // TP
        return documents.filter(doc => doc.type === DOCUMENT_TYPES.TP);
      case 3: // Examens
        return documents.filter(doc => doc.type === DOCUMENT_TYPES.EXAM);
      case 4: // Attestations et certificats
        return documents.filter(doc => 
          doc.type === DOCUMENT_TYPES.CERTIFICATE || 
          doc.type === DOCUMENT_TYPES.ATTESTATION
        );
      default:
        return documents;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Documents
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Tous" />
          <Tab label="Cours" />
          <Tab label="TP" />
          <Tab label="Examens" />
          <Tab label="Attestations et certificats" />
        </Tabs>
      </Box>

      <DocumentList
        documents={getFilteredDocuments()}
        loading={loading}
        error={error}
        onDownload={handleDownloadDocument}
        onView={handleViewDocument}
        canEdit={false}
      />

      {/* Dialogue de visualisation */}
      <Dialog
        open={viewDialogOpen}
        onClose={handleCloseViewDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogContent>
          {selectedDocument && (
            <Box sx={{ width: '100%', height: '80vh' }}>
              <iframe
                src={selectedDocument.file_url}
                width="100%"
                height="100%"
                style={{ border: 'none' }}
                title={selectedDocument.title}
              />
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default StudentDocumentsPage;
