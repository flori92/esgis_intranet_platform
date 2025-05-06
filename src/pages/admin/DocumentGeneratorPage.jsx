import React, { useState, useEffect } from 'react';
import {
  Box, 
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Autocomplete,
  FormControlLabel,
  Checkbox,
  Card,
  CardContent,
  CardActions,
  Divider,
  Stack,
  Chip
} from '@mui/material';
import {
  Description as DescriptionIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  Preview as PreviewIcon,
  School as SchoolIcon,
  Send as SendIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
// Correction du chemin d'importation de Supabase
import { supabase } from '@/supabase';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getRecordsWithRelation as fetchRecords, insertRecord, getRecordsWithRelation as fetchWithRelations } from '@/utils/supabase-helpers';

const DocumentGeneratorPage = () => {
  const { authState } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [formValues, setFormValues] = useState({});
  const [documentData, setDocumentData] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [generatedDocuments, setGeneratedDocuments] = useState([]);
  const [sendEmailChecked, setSendEmailChecked] = useState(false);

  // Fonction pour charger les modèles de documents
  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const templates = await fetchRecords('document_templates');
      
      if (templates) {
        setTemplates(templates);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des modèles:', err);
      setError('Erreur lors du chargement des modèles');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour charger les étudiants
  const fetchStudents = async () => {
    try {
      const students = await fetchWithRelations(
        'students',
        `
          id,
          profile_id,
          profiles (
            full_name,
            email
          ),
          student_number,
          entry_year,
          level,
          status,
          department_id,
          departments (
            name
          )
        `
      );
      
      if (students) {
        // Transformer les données pour inclure le nom complet et l'email du profil
        const formattedStudents = students.map(student => ({
          id: student.id,
          profile_id: student.profile_id,
          full_name: student.profiles?.full_name || 'Nom inconnu',
          email: student.profiles?.email || '',
          student_number: student.student_number,
          entry_year: student.entry_year,
          level: student.level,
          status: student.status,
          department_id: student.department_id,
          department_name: student.departments?.name || 'Département inconnu'
        }));
        
        setStudents(formattedStudents);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des étudiants:', err);
      setError('Erreur lors du chargement des étudiants');
    }
  };
  
  // Fonction principale pour charger les données
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([fetchTemplates(), fetchStudents()]);
      
      // Récupérer les documents générés
      const { data: documents, error: documentsError } = await supabase
        .from('generated_documents')
        .select(`
          *,
          students (
            id,
            profiles (
              full_name
            )
          ),
          document_templates (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (documentsError) {
        throw documentsError;
      }
      
      // Transformer les données pour inclure le nom de l'étudiant et du modèle
      const formattedDocuments = documents.map(doc => ({
        ...doc,
        student_name: doc.students?.profiles?.full_name || 'Étudiant inconnu',
        template_name: doc.document_templates?.name || 'Modèle inconnu'
      }));
      
      setGeneratedDocuments(formattedDocuments);
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError('Une erreur est survenue lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };
  
  // Charger les données au chargement du composant
  useEffect(() => {
    fetchData();
  }, []);
  
  // Réinitialiser le formulaire lorsque le modèle change
  useEffect(() => {
    if (selectedTemplate) {
      // Trouver le modèle sélectionné
      const template = templates.find(t => t.id === selectedTemplate);
      
      if (template && template.variables) {
        // Initialiser les valeurs du formulaire avec les variables du modèle
        const initialValues = {};
        template.variables.forEach(variable => {
          initialValues[variable] = '';
        });
        
        setFormValues(initialValues);
      }
    } else {
      setFormValues({});
    }
  }, [selectedTemplate, templates]);

  // Gérer le changement de modèle
  const handleTemplateChange = (event) => {
    setSelectedTemplate(event.target.value);
  };

  // Gérer les changements dans le formulaire
  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Générer le document PDF
  const generateDocument = async () => {
    if (!selectedTemplate || !selectedStudent) {
      setError('Veuillez sélectionner un modèle et un étudiant');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Récupérer le modèle sélectionné
      const template = templates.find(t => t.id === selectedTemplate);
      
      if (!template) {
        throw new Error('Modèle non trouvé');
      }
      
      // Créer un nouveau document PDF
      const pdfDoc = await PDFDocument.create();
      
      // Ajouter une nouvelle page
      let page = pdfDoc.addPage([595.28, 841.89]); // A4
      
      // Obtenir la police
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      // Définir les marges et positions
      const margin = 50;
      const titleFontSize = 16;
      const contentFontSize = 12;
      const lineHeight = 20;
      
      // Dessiner l'en-tête
      page.drawText('ÉCOLE SUPÉRIEURE DE GÉNIE INFORMATIQUE', {
        x: margin,
        y: page.getHeight() - margin,
        size: titleFontSize,
        font: helveticaBold,
        color: rgb(0, 0, 0.7)
      });
      
      page.drawText('Document officiel', {
        x: margin,
        y: page.getHeight() - margin - titleFontSize - 10,
        size: contentFontSize,
        font: helveticaFont,
        color: rgb(0, 0, 0)
      });
      
      // Dessiner le titre du document
      page.drawText(template.name, {
        x: margin,
        y: page.getHeight() - margin - titleFontSize - 50,
        size: titleFontSize,
        font: helveticaBold,
        color: rgb(0, 0, 0)
      });
      
      // Dessiner les informations de l'étudiant
      let yPosition = page.getHeight() - margin - titleFontSize - 90;
      
      page.drawText(`Étudiant: ${selectedStudent.full_name}`, {
        x: margin,
        y: yPosition,
        size: contentFontSize,
        font: helveticaFont,
        color: rgb(0, 0, 0)
      });
      
      yPosition -= lineHeight;
      
      page.drawText(`Numéro étudiant: ${selectedStudent.student_number}`, {
        x: margin,
        y: yPosition,
        size: contentFontSize,
        font: helveticaFont,
        color: rgb(0, 0, 0)
      });
      
      yPosition -= lineHeight;
      
      page.drawText(`Niveau: ${selectedStudent.level}`, {
        x: margin,
        y: yPosition,
        size: contentFontSize,
        font: helveticaFont,
        color: rgb(0, 0, 0)
      });
      
      yPosition -= lineHeight;
      
      page.drawText(`Département: ${selectedStudent.department_name}`, {
        x: margin,
        y: yPosition,
        size: contentFontSize,
        font: helveticaFont,
        color: rgb(0, 0, 0)
      });
      
      // Ajouter un espace avant le contenu
      yPosition -= lineHeight * 2;
      
      // Remplacer les variables dans le contenu du modèle
      let content = template.content;
      
      // Remplacer les variables standards
      content = content.replace(/\{NOM_ETUDIANT\}/g, selectedStudent.full_name);
      content = content.replace(/\{NUMERO_ETUDIANT\}/g, selectedStudent.student_number);
      content = content.replace(/\{NIVEAU\}/g, selectedStudent.level);
      content = content.replace(/\{DEPARTEMENT\}/g, selectedStudent.department_name);
      content = content.replace(/\{DATE\}/g, format(new Date(), 'dd MMMM yyyy', { locale: fr }));
      
      // Remplacer les variables personnalisées
      Object.keys(formValues).forEach(key => {
        content = content.replace(new RegExp(`\\{${key}\\}`, 'g'), formValues[key]);
      });
      
      // Diviser le contenu en lignes pour respecter la largeur de la page
      const maxWidth = page.getWidth() - margin * 2;
      const words = content.split(' ');
      let line = '';
      
      for (const word of words) {
        const potentialLine = line ? `${line} ${word}` : word;
        const width = helveticaFont.widthOfTextAtSize(potentialLine, contentFontSize);
        
        if (width <= maxWidth) {
          line = potentialLine;
        } else {
          page.drawText(line, {
            x: margin,
            y: yPosition,
            size: contentFontSize,
            font: helveticaFont,
            color: rgb(0, 0, 0)
          });
          
          yPosition -= lineHeight;
          line = word;
          
          // Vérifier si on a besoin d'une nouvelle page
          if (yPosition < margin) {
            page = pdfDoc.addPage([595.28, 841.89]); // A4
            yPosition = page.getHeight() - margin;
          }
        }
      }
      
      // Dessiner la dernière ligne
      if (line) {
        page.drawText(line, {
          x: margin,
          y: yPosition,
          size: contentFontSize,
          font: helveticaFont,
          color: rgb(0, 0, 0)
        });
      }
      
      // Dessiner le pied de page
      page.drawText(`Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm')}`, {
        x: margin,
        y: margin,
        size: 10,
        font: helveticaFont,
        color: rgb(0.5, 0.5, 0.5)
      });
      
      // Sérialiser le document en bytes
      const pdfBytes = await pdfDoc.save();
      
      // Stocker les données du document
      setDocumentData(pdfBytes);
      
      // Ouvrir l'aperçu
      setPreviewOpen(true);
      
    } catch (err) {
      console.error('Erreur lors de la génération du document:', err);
      setError('Une erreur est survenue lors de la génération du document: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Sauvegarder le document généré
  const saveGeneratedDocument = async () => {
    if (!documentData || !selectedTemplate || !selectedStudent) {
      setError('Impossible de sauvegarder le document');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Récupérer le modèle sélectionné
      const template = templates.find(t => t.id === selectedTemplate);
      
      if (!template) {
        throw new Error('Modèle non trouvé');
      }
      
      // Générer un nom de fichier unique
      const timestamp = new Date().getTime();
      const fileName = `document_${selectedStudent.id}_${selectedTemplate}_${timestamp}.pdf`;
      const filePath = `documents/${fileName}`;
      
      // Stocker le fichier dans le bucket de stockage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .upload(fileName, documentData, {
          contentType: 'application/pdf',
          cacheControl: '3600'
        });
      
      if (storageError) {
        throw storageError;
      }
      
      // Obtenir l'URL publique du fichier
      const { data: publicURL } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);
      
      // Enregistrer le document dans la base de données
      const { data: document, error: insertError } = await supabase
        .from('generated_documents')
        .insert({
          template_id: selectedTemplate,
          student_id: selectedStudent.id,
          file_path: filePath,
          status: 'pending', // En attente d'approbation
          generated_by: authState.user?.id || null,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (insertError) {
        throw insertError;
      }
      
      // Fermer l'aperçu
      setPreviewOpen(false);
      
      // Afficher un message de succès
      setSuccess('Document enregistré avec succès');
      
      // Envoyer un email si demandé
      if (sendEmailChecked) {
        // Code pour envoyer un email (à implémenter avec un service d'email)
        console.log('Envoi d\'email à', selectedStudent.email);
      }
      
      // Rafraîchir la liste des documents
      fetchData();
      
    } catch (err) {
      console.error('Erreur lors de la sauvegarde du document:', err);
      setError('Une erreur est survenue lors de la sauvegarde du document: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Télécharger le document
  const downloadDocument = () => {
    if (!documentData) {
      setError('Aucun document à télécharger');
      return;
    }
    
    const blob = new Blob([documentData], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `document_${new Date().getTime()}.pdf`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // Prévisualiser un document existant
  const previewExistingDocument = async (filePath) => {
    setLoading(true);
    setError(null);
    
    try {
      // Extraire le nom du fichier du chemin
      const fileName = filePath.split('/').pop();
      
      // Télécharger le fichier depuis le stockage
      const { data, error } = await supabase.storage
        .from('documents')
        .download(fileName);
      
      if (error) {
        throw error;
      }
      
      // Convertir le blob en Uint8Array
      const arrayBuffer = await data.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Stocker les données du document
      setDocumentData(uint8Array);
      
      // Ouvrir l'aperçu
      setPreviewOpen(true);
      
    } catch (err) {
      console.error('Erreur lors de la prévisualisation du document:', err);
      setError('Une erreur est survenue lors de la prévisualisation du document');
    } finally {
      setLoading(false);
    }
  };

  // Approuver un document (admin uniquement)
  const approveDocument = async (documentId) => {
    if (!authState.isAdmin) {
      setError('Vous n\'avez pas les droits pour approuver un document');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Mettre à jour le statut du document
      const { error } = await supabase
        .from('generated_documents')
        .update({
          status: 'approved',
          approved_by: authState.user?.id || null,
          approval_date: new Date().toISOString()
        })
        .eq('id', documentId);
      
      if (error) {
        throw error;
      }
      
      // Afficher un message de succès
      setSuccess('Document approuvé avec succès');
      
      // Rafraîchir la liste des documents
      fetchData();
      
    } catch (err) {
      console.error('Erreur lors de l\'approbation du document:', err);
      setError('Une erreur est survenue lors de l\'approbation du document');
    } finally {
      setLoading(false);
    }
  };

  // Rejeter un document (admin uniquement)
  const rejectDocument = async (documentId) => {
    if (!authState.isAdmin) {
      setError('Vous n\'avez pas les droits pour rejeter un document');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Mettre à jour le statut du document
      const { error } = await supabase
        .from('generated_documents')
        .update({
          status: 'rejected',
          approved_by: authState.user?.id || null, // Pour enregistrer qui a rejeté
          approval_date: new Date().toISOString()
        })
        .eq('id', documentId);
      
      if (error) {
        throw error;
      }
      
      // Afficher un message de succès
      setSuccess('Document rejeté avec succès');
      
      // Rafraîchir la liste des documents
      fetchData();
      
    } catch (err) {
      console.error('Erreur lors du rejet du document:', err);
      setError('Une erreur est survenue lors du rejet du document');
    } finally {
      setLoading(false);
    }
  };

  // Rendu du statut avec la couleur correspondante
  const renderStatus = (status) => {
    switch (status) {
      case 'draft':
        return <Chip label="Brouillon" color="default" size="small" />;
      case 'pending':
        return <Chip label="En attente" color="warning" size="small" />;
      case 'approved':
        return <Chip label="Approuvé" color="success" size="small" />;
      case 'rejected':
        return <Chip label="Rejeté" color="error" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Générateur de documents administratifs
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {/* Générateur de document */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Générer un nouveau document
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="template-select-label">Modèle de document</InputLabel>
                  <Select
                    labelId="template-select-label"
                    value={selectedTemplate || ''}
                    onChange={handleTemplateChange}
                    label="Modèle de document"
                  >
                    <MenuItem value="" disabled>
                      Sélectionner un modèle
                    </MenuItem>
                    {templates.map(template => (
                      <MenuItem key={template.id} value={template.id}>
                        {template.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <Autocomplete
                  options={students}
                  getOptionLabel={(option) => `${option.full_name} (${option.student_number})`}
                  renderInput={(params) => (
                    <TextField {...params} label="Étudiant" />
                  )}
                  value={selectedStudent}
                  onChange={(_, newValue) => setSelectedStudent(newValue)}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                />
              </Grid>
              
              {selectedTemplate && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>
                      Informations supplémentaires
                    </Typography>
                    <Divider />
                  </Grid>
                  
                  {/* Champs dynamiques basés sur les variables du modèle */}
                  {Object.keys(formValues).map(key => (
                    <Grid item xs={12} key={key}>
                      <TextField
                        fullWidth
                        label={key.replace(/_/g, ' ')}
                        name={key}
                        value={formValues[key]}
                        onChange={handleFormChange}
                      />
                    </Grid>
                  ))}
                  
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Checkbox 
                          checked={sendEmailChecked}
                          onChange={(e) => setSendEmailChecked(e.target.checked)}
                        />
                      }
                      label="Envoyer par email après génération"
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<DescriptionIcon />}
                      onClick={generateDocument}
                      disabled={loading || !selectedStudent}
                      fullWidth
                    >
                      {loading ? <CircularProgress size={24} /> : 'Générer le document'}
                    </Button>
                  </Grid>
                </>
              )}
            </Grid>
          </Paper>
        </Grid>

        {/* Liste des documents générés */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Documents générés récemment
            </Typography>

            {generatedDocuments.length === 0 ? (
              <Typography variant="body1" color="textSecondary">
                Aucun document généré pour le moment.
              </Typography>
            ) : (
              <Stack spacing={2}>
                {generatedDocuments.map(doc => (
                  <Card key={doc.id} variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1">
                        {doc.document_templates.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Créé le {format(new Date(doc.created_at), 'dd/MM/yyyy à HH:mm')}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        {renderStatus(doc.status)}
                      </Box>
                    </CardContent>
                    <Divider />
                    <CardActions>
                      <Button
                        size="small"
                        startIcon={<PreviewIcon />}
                        onClick={() => previewExistingDocument(doc.file_path)}
                      >
                        Aperçu
                      </Button>
                      {authState.isAdmin && doc.status === 'pending' && (
                        <>
                          <Button
                            size="small"
                            color="success"
                            onClick={() => approveDocument(doc.id)}
                          >
                            Approuver
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => rejectDocument(doc.id)}
                          >
                            Rejeter
                          </Button>
                        </>
                      )}
                    </CardActions>
                  </Card>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Dialogue d'aperçu du document */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Aperçu du document</DialogTitle>
        <DialogContent>
          {documentData ? (
            <Box sx={{ width: '100%', height: '500px', overflow: 'hidden' }}>
              <iframe
                src={`data:application/pdf;base64,${Buffer.from(documentData).toString('base64')}`}
                width="100%"
                height="100%"
                title="Aperçu du document"
              />
            </Box>
          ) : (
            <Typography>Impossible de charger l'aperçu.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>
            Fermer
          </Button>
          <Button
            onClick={downloadDocument}
            startIcon={<DownloadIcon />}
            color="primary"
          >
            Télécharger
          </Button>
          <Button
            onClick={saveGeneratedDocument}
            startIcon={<SaveIcon />}
            variant="contained"
            color="primary"
          >
            Sauvegarder
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentGeneratorPage;
