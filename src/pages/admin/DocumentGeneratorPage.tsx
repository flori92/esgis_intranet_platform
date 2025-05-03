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
import { supabase } from '../../utils/supabase';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Types pour les modèles de documents
interface DocumentTemplate {
  id: number;
  name: string;
  description: string;
  type: 'certificate' | 'attestation' | 'transcript' | 'other';
  template_path: string;
  requires_signature: boolean;
  required_fields: string[];
  created_at: string;
}

// Types pour les documents générés
interface GeneratedDocument {
  id: number;
  template_id: number;
  student_id: number;
  file_path: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  generated_by: string;
  approved_by: string | null;
  approval_date: string | null;
  created_at: string;
}

// Types pour les étudiants
interface Student {
  id: number;
  full_name: string;
  student_number: string;
  level: string;
  department_name: string;
}

const DocumentGeneratorPage: React.FC = () => {
  const { authState } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [documentData, setDocumentData] = useState<Uint8Array | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [generatedDocuments, setGeneratedDocuments] = useState<GeneratedDocument[]>([]);
  const [sendEmailChecked, setSendEmailChecked] = useState(false);

  // Charger les modèles de documents et les documents générés
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Charger les modèles de documents
        const { data: templatesData, error: templatesError } = await supabase
          .from('document_templates')
          .select('*');
        
        if (templatesError) throw templatesError;
        
        setTemplates(templatesData || []);

        // Charger les étudiants selon le rôle
        if (authState.isAdmin) {
          const { data: studentsData, error: studentsError } = await supabase
            .from('students')
            .select(`
              id,
              profiles (full_name),
              student_number,
              level,
              departments (name)
            `);
          
          if (studentsError) throw studentsError;
          
          const formattedStudents = studentsData?.map(student => ({
            id: student.id,
            full_name: student.profiles.full_name,
            student_number: student.student_number,
            level: student.level,
            department_name: student.departments.name
          })) || [];
          
          setStudents(formattedStudents);
        } else if (authState.isStudent && authState.student) {
          setSelectedStudent({
            id: authState.student.id,
            full_name: authState.user?.full_name || '',
            student_number: authState.student.student_number || '',
            level: authState.student.level || '',
            department_name: ''
          });
        }

        // Charger les documents générés
        let query = supabase
          .from('generated_documents')
          .select(`
            id,
            template_id,
            student_id,
            file_path,
            status,
            generated_by,
            approved_by,
            approval_date,
            created_at,
            document_templates (name, type)
          `);
        
        if (authState.isStudent && authState.student) {
          query = query.eq('student_id', authState.student.id);
        }

        const { data: documentsData, error: documentsError } = await query;
        
        if (documentsError) throw documentsError;
        
        setGeneratedDocuments(documentsData || []);
        
      } catch (err) {
        console.error('Erreur lors du chargement des données :', err);
        setError('Une erreur est survenue lors du chargement des données.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authState]);

  // Mettre à jour les champs du formulaire lorsque le template change
  useEffect(() => {
    if (selectedTemplate !== null) {
      const template = templates.find(t => t.id === selectedTemplate);
      if (template) {
        const initialValues: Record<string, string> = {};
        template.required_fields.forEach(field => {
          initialValues[field] = '';
        });
        setFormValues(initialValues);
      }
    }
  }, [selectedTemplate, templates]);

  // Gérer le changement de modèle
  const handleTemplateChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedTemplate(event.target.value as number);
  };

  // Gérer les changements dans le formulaire
  const handleFormChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues({
      ...formValues,
      [event.target.name]: event.target.value
    });
  };

  // Générer le document PDF
  const generateDocument = async () => {
    if (!selectedTemplate || !selectedStudent) {
      setError('Veuillez sélectionner un modèle et un étudiant.');
      return;
    }

    setLoading(true);
    try {
      const template = templates.find(t => t.id === selectedTemplate);
      if (!template) {
        throw new Error('Modèle non trouvé');
      }

      // Créer un nouveau document PDF
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.28, 841.89]); // A4

      // Ajouter une police
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Configuration de la page
      const { width, height } = page.getSize();
      const margin = 50;
      let y = height - margin;
      const lineHeight = 20;

      // Ajouter le logo ou l'en-tête
      page.drawText('ESGIS - ÉCOLE SUPÉRIEURE DE GESTION', {
        x: margin,
        y,
        size: 16,
        font: boldFont,
        color: rgb(0, 0, 0.7)
      });
      
      y -= 20;
      
      page.drawText('D\'INFORMATIQUE ET DES SCIENCES', {
        x: margin,
        y,
        size: 16,
        font: boldFont,
        color: rgb(0, 0, 0.7)
      });

      y -= 40;

      // Dessiner une ligne de séparation
      page.drawLine({
        start: { x: margin, y },
        end: { x: width - margin, y },
        thickness: 1,
        color: rgb(0, 0, 0.7)
      });

      y -= 40;

      // Titre du document
      page.drawText(template.name.toUpperCase(), {
        x: margin,
        y,
        size: 18,
        font: boldFont,
        color: rgb(0, 0, 0.9)
      });

      y -= lineHeight * 2;

      // Date
      const today = format(new Date(), 'dd MMMM yyyy', { locale: fr });
      page.drawText(`Date : ${today}`, {
        x: margin,
        y,
        size: 12,
        font: font
      });

      y -= lineHeight * 2;

      // Informations de l'étudiant
      page.drawText(`Étudiant(e) : ${selectedStudent.full_name}`, {
        x: margin,
        y,
        size: 12,
        font: font
      });

      y -= lineHeight;

      page.drawText(`Numéro étudiant : ${selectedStudent.student_number}`, {
        x: margin,
        y,
        size: 12,
        font: font
      });

      y -= lineHeight;

      page.drawText(`Niveau : ${selectedStudent.level}`, {
        x: margin,
        y,
        size: 12,
        font: font
      });

      y -= lineHeight * 2;

      // Contenu du document selon le type
      if (template.type === 'certificate') {
        page.drawText('Nous, soussignés, certifions que l\'étudiant(e) mentionné(e) ci-dessus est', {
          x: margin,
          y,
          size: 12,
          font: font
        });

        y -= lineHeight;

        page.drawText('régulièrement inscrit(e) à notre établissement pour l\'année académique en cours.', {
          x: margin,
          y,
          size: 12,
          font: font
        });
      } else if (template.type === 'attestation') {
        const purpose = formValues['purpose'] || 'administrative';
        
        page.drawText(`Nous attestons que l\'étudiant(e) mentionné(e) ci-dessus a satisfait à toutes`, {
          x: margin,
          y,
          size: 12,
          font: font
        });

        y -= lineHeight;

        page.drawText(`les exigences académiques requises. Cette attestation est délivrée à la demande`, {
          x: margin,
          y,
          size: 12,
          font: font
        });

        y -= lineHeight;

        page.drawText(`de l'intéressé(e) pour servir à des fins ${purpose}.`, {
          x: margin,
          y,
          size: 12,
          font: font
        });
      }

      // Espace pour la signature
      y -= lineHeight * 4;

      page.drawText('Signature et cachet :', {
        x: width - margin - 150,
        y,
        size: 12,
        font: font
      });

      // Enregistrer le document sous forme de tableau d'octets
      const pdfBytes = await pdfDoc.save();
      setDocumentData(pdfBytes);
      setPreviewOpen(true);

    } catch (err) {
      console.error('Erreur lors de la génération du document :', err);
      setError('Une erreur est survenue lors de la génération du document.');
    } finally {
      setLoading(false);
    }
  };

  // Sauvegarder le document généré
  const saveGeneratedDocument = async () => {
    if (!documentData || !selectedTemplate || !selectedStudent) {
      return;
    }

    setLoading(true);
    try {
      // 1. Uploader le fichier PDF dans le bucket storage
      const fileName = `document_${Date.now()}_${selectedStudent.student_number}.pdf`;
      const filePath = `documents/administrative/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('files')
        .upload(filePath, documentData, {
          contentType: 'application/pdf',
          cacheControl: '3600'
        });

      if (uploadError) throw uploadError;

      // 2. Obtenir l'URL publique du fichier
      const { data: urlData } = supabase.storage.from('files').getPublicUrl(filePath);
      const fileUrl = urlData.publicUrl;

      // 3. Enregistrer les métadonnées du document dans la base de données
      const { data, error: insertError } = await supabase
        .from('generated_documents')
        .insert([
          {
            template_id: selectedTemplate,
            student_id: selectedStudent.id,
            file_path: fileUrl,
            status: authState.isAdmin ? 'approved' : 'pending',
            generated_by: authState.user?.id || '',
            approved_by: authState.isAdmin ? authState.user?.id : null,
            approval_date: authState.isAdmin ? new Date().toISOString() : null
          }
        ])
        .select();

      if (insertError) throw insertError;

      // 4. Envoyer un email si nécessaire
      if (sendEmailChecked) {
        // Simuler l'envoi d'email (à implémenter avec un service d'email)
        console.log('Email envoyé à l\'étudiant avec le document en pièce jointe');
      }

      // 5. Afficher un message de succès et fermer l'aperçu
      setSuccess('Document généré et sauvegardé avec succès.');
      setPreviewOpen(false);
      
      // 6. Rafraîchir la liste des documents générés
      if (data) {
        const newDoc = data[0];
        const template = templates.find(t => t.id === newDoc.template_id);
        setGeneratedDocuments([
          {
            ...newDoc,
            document_templates: {
              name: template?.name || '',
              type: template?.type || 'other'
            }
          },
          ...generatedDocuments
        ]);
      }

    } catch (err) {
      console.error('Erreur lors de la sauvegarde du document :', err);
      setError('Une erreur est survenue lors de la sauvegarde du document.');
    } finally {
      setLoading(false);
    }
  };

  // Télécharger le document
  const downloadDocument = () => {
    if (!documentData) return;
    
    const blob = new Blob([documentData], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `document_${Date.now()}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // Prévisualiser un document existant
  const previewExistingDocument = async (filePath: string) => {
    setLoading(true);
    try {
      // Extraire le chemin du fichier de l'URL complète
      const pathRegex = /\/files\/([^?]+)/;
      const match = filePath.match(pathRegex);
      
      if (!match) throw new Error('Format d\'URL non valide');
      
      const path = match[1];
      
      // Télécharger le fichier depuis Supabase Storage
      const { data, error } = await supabase.storage
        .from('files')
        .download(path);
      
      if (error) throw error;
      
      // Convertir le blob en array buffer puis en Uint8Array
      const arrayBuffer = await data.arrayBuffer();
      setDocumentData(new Uint8Array(arrayBuffer));
      setPreviewOpen(true);
      
    } catch (err) {
      console.error('Erreur lors de la prévisualisation du document :', err);
      setError('Une erreur est survenue lors de la prévisualisation du document.');
    } finally {
      setLoading(false);
    }
  };

  // Approuver un document (admin uniquement)
  const approveDocument = async (documentId: number) => {
    if (!authState.isAdmin) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('generated_documents')
        .update({
          status: 'approved',
          approved_by: authState.user?.id,
          approval_date: new Date().toISOString()
        })
        .eq('id', documentId)
        .select();
      
      if (error) throw error;
      
      // Mettre à jour la liste des documents
      if (data) {
        setGeneratedDocuments(
          generatedDocuments.map(doc => 
            doc.id === documentId 
              ? { ...doc, status: 'approved', approved_by: authState.user?.id || '', approval_date: new Date().toISOString() } 
              : doc
          )
        );
        setSuccess('Document approuvé avec succès.');
      }
      
    } catch (err) {
      console.error('Erreur lors de l\'approbation du document :', err);
      setError('Une erreur est survenue lors de l\'approbation du document.');
    } finally {
      setLoading(false);
    }
  };

  // Rejeter un document (admin uniquement)
  const rejectDocument = async (documentId: number) => {
    if (!authState.isAdmin) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('generated_documents')
        .update({
          status: 'rejected'
        })
        .eq('id', documentId)
        .select();
      
      if (error) throw error;
      
      // Mettre à jour la liste des documents
      if (data) {
        setGeneratedDocuments(
          generatedDocuments.map(doc => 
            doc.id === documentId 
              ? { ...doc, status: 'rejected' } 
              : doc
          )
        );
        setSuccess('Document rejeté.');
      }
      
    } catch (err) {
      console.error('Erreur lors du rejet du document :', err);
      setError('Une erreur est survenue lors du rejet du document.');
    } finally {
      setLoading(false);
    }
  };

  // Rendu du statut avec la couleur correspondante
  const renderStatus = (status: string) => {
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
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Formulaire de génération de document */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Créer un nouveau document
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Type de document</InputLabel>
                  <Select
                    value={selectedTemplate || ''}
                    onChange={handleTemplateChange}
                    label="Type de document"
                  >
                    {templates.map(template => (
                      <MenuItem key={template.id} value={template.id}>
                        {template.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {authState.isAdmin && (
                <Grid item xs={12}>
                  <Autocomplete
                    options={students}
                    getOptionLabel={(option) => `${option.full_name} (${option.student_number})`}
                    renderInput={(params) => (
                      <TextField {...params} label="Étudiant" fullWidth margin="normal" />
                    )}
                    value={selectedStudent}
                    onChange={(_, newValue) => setSelectedStudent(newValue)}
                  />
                </Grid>
              )}

              {selectedTemplate && (
                <>
                  {Object.keys(formValues).map(field => (
                    <Grid item xs={12} key={field}>
                      <TextField
                        name={field}
                        label={field.charAt(0).toUpperCase() + field.slice(1).replace('_', ' ')}
                        fullWidth
                        margin="normal"
                        value={formValues[field]}
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
                      label="Envoyer par email à l'étudiant"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<DescriptionIcon />}
                      onClick={generateDocument}
                      disabled={loading}
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
