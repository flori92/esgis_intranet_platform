import React, { useState, useEffect } from 'react';
import { Box, Container, Grid, Tab, Tabs, Typography, Button, Dialog, DialogContent } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import DocumentService from '@/services/DocumentService';
import DocumentList from '@/components/documents/DocumentList';
import DocumentUpload from '@/components/documents/DocumentUpload';
import { DOCUMENT_TYPES } from '@/types/documents';

/**
 * Page de gestion des documents pour les professeurs
 */
const ProfessorDocumentsPage = () => {
  const { user, profile } = useSupabaseAuth();
  const [documents, setDocuments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  // Charger les documents du professeur
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        const docs = await DocumentService.getUserDocuments(user.id);
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
  }, [user]);

  // Charger les cours du professeur
  useEffect(() => {
    const fetchCourses = async () => {
      if (!user?.id) return;
      
      try {
        // TODO: Implémenter le service pour récupérer les cours du professeur
        // const professorCourses = await CourseService.getProfessorCourses(user.id);
        // setCourses(professorCourses);
        
        // Pour le moment, utiliser des données fictives
        setCourses([
          { id: '1', name: 'Programmation Web' },
          { id: '2', name: 'Bases de données' },
          { id: '3', name: 'Algorithmes et structures de données' }
        ]);
      } catch (err) {
        console.error('Erreur lors du chargement des cours:', err);
      }
    };

    fetchCourses();
  }, [user]);

  // Gérer le changement d'onglet
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Ouvrir le dialogue de téléversement
  const handleOpenUploadDialog = () => {
    setOpenUploadDialog(true);
    setUploadSuccess(false);
    setUploadError(null);
  };

  // Fermer le dialogue de téléversement
  const handleCloseUploadDialog = () => {
    setOpenUploadDialog(false);
  };

  // Gérer le téléversement d'un document
  const handleUploadDocument = async (file, documentData) => {
    if (!user?.id) return;
    
    try {
      setUploadLoading(true);
      setUploadError(null);
      
      // Générer un chemin unique pour le fichier
      const timestamp = new Date().getTime();
      const filePath = `${user.id}/${timestamp}_${file.name}`;
      
      // Téléverser le fichier
      const uploadResult = await DocumentService.uploadFile(file, filePath);
      
      // Créer l'entrée du document dans la base de données
      const newDocument = await DocumentService.createDocument({
        ...documentData,
        file_url: uploadResult.publicUrl,
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      // Mettre à jour la liste des documents
      setDocuments(prev => [newDocument, ...prev]);
      setUploadSuccess(true);
      
      // Fermer le dialogue après un délai
      setTimeout(() => {
        handleCloseUploadDialog();
      }, 2000);
    } catch (err) {
      console.error('Erreur lors du téléversement du document:', err);
      setUploadError('Impossible de téléverser le document. Veuillez réessayer plus tard.');
    } finally {
      setUploadLoading(false);
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

  // Gérer la suppression d'un document
  const handleDeleteDocument = async (document) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) return;
    
    try {
      await DocumentService.deleteDocument(document.id);
      setDocuments(prev => prev.filter(doc => doc.id !== document.id));
    } catch (err) {
      console.error('Erreur lors de la suppression du document:', err);
      alert('Impossible de supprimer le document. Veuillez réessayer plus tard.');
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
      case 4: // Autres
        return documents.filter(doc => 
          doc.type !== DOCUMENT_TYPES.COURSE && 
          doc.type !== DOCUMENT_TYPES.TP && 
          doc.type !== DOCUMENT_TYPES.EXAM
        );
      default:
        return documents;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Mes Documents
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenUploadDialog}
        >
          Ajouter un document
        </Button>
      </Box>

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
          <Tab label="Autres" />
        </Tabs>
      </Box>

      <DocumentList
        documents={getFilteredDocuments()}
        loading={loading}
        error={error}
        onDownload={handleDownloadDocument}
        onDelete={handleDeleteDocument}
        onView={handleViewDocument}
        canEdit={true}
      />

      {/* Dialogue de téléversement */}
      <Dialog
        open={openUploadDialog}
        onClose={handleCloseUploadDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogContent>
          <DocumentUpload
            onUpload={handleUploadDocument}
            loading={uploadLoading}
            error={uploadError}
            success={uploadSuccess}
            courses={courses}
          />
        </DialogContent>
      </Dialog>

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

export default ProfessorDocumentsPage;
