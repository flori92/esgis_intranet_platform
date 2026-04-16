import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import {
  Description as DescriptionIcon,
  Download as DownloadIcon,
  Preview as PreviewIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { useAuth } from '../../hooks/useAuth';
import { uploadFile } from '@/api/storage';
import {
  createDocumentDownloadUrl,
  getAllGeneratedDocuments,
  insertGeneratedDocument,
  updateGeneratedDocumentStatus
} from '@/api/documents';
import {
  getRecordsWithRelation as fetchRecords,
  getRecordsWithRelation as fetchWithRelations
} from '@/utils/supabase-helpers';
import { triggerDownload } from '@/utils/DownloadLinkUtil';
import { loadPdfLib } from '@/utils/pdfLib';

const getRelation = (value) => (Array.isArray(value) ? value[0] : value);

const STATUS_OPTIONS = [
  { value: 'approved', label: 'Disponible immédiatement' },
  { value: 'pending', label: 'En attente de validation' },
  { value: 'draft', label: 'Brouillon' }
];

const defaultDepositNote = (template) => {
  const templateType = template?.type || '';
  const templateName = `${template?.name || ''}`.toLowerCase();

  if (templateType === 'transcript') {
    return 'Relevé de notes certifié';
  }

  if (templateType === 'attestation' && templateName.includes('réussite')) {
    return 'Attestation de réussite';
  }

  if (templateType === 'attestation') {
    return "Attestation d'inscription";
  }

  if (templateType === 'certificate') {
    return 'Certificat de scolarité';
  }

  return template?.name || 'Document officiel';
};

const slugify = (value) => (
  `${value || 'document'}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase()
);

const buildFallbackContent = ({ template, student, depositNote }) => [
  `Objet : ${depositNote || template?.name || 'Document officiel'}`,
  '',
  `L'administration certifie que ${student?.full_name || 'cet étudiant'} est inscrit(e) à l'ESGIS.`,
  `Numéro étudiant : ${student?.student_number || '-'}`,
  `Niveau : ${student?.level || '-'}`,
  `Département : ${student?.department_name || '-'}`,
  '',
  `Document édité le ${format(new Date(), 'dd MMMM yyyy', { locale: fr })}.`,
  '',
  'Ce document est généré par le guichet administratif et versé dans le dossier officiel de l’étudiant.'
].join('\n');

const DocumentGeneratorPage = () => {
  const { authState } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [students, setStudents] = useState([]);
  const [generatedDocuments, setGeneratedDocuments] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [formValues, setFormValues] = useState({});
  const [depositNote, setDepositNote] = useState('');
  const [publicationStatus, setPublicationStatus] = useState('approved');
  const [sendEmailChecked, setSendEmailChecked] = useState(false);
  const [documentData, setDocumentData] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFileName, setPreviewFileName] = useState('document_officiel.pdf');

  const selectedTemplate = useMemo(
    () => templates.find((template) => String(template.id) === String(selectedTemplateId)) || null,
    [selectedTemplateId, templates]
  );

  const selectedStudent = useMemo(
    () => students.find((student) => String(student.id) === String(selectedStudentId)) || null,
    [selectedStudentId, students]
  );

  useEffect(() => {
    if (!documentData) {
      setPreviewUrl(null);
      return undefined;
    }

    const objectUrl = URL.createObjectURL(new Blob([documentData], { type: 'application/pdf' }));
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [documentData]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [templateRows, studentRows, generatedRows] = await Promise.all([
        fetchRecords('document_templates'),
        fetchWithRelations(
          'students',
          `
            id,
            profile_id,
            student_number,
            level,
            status,
            department_id,
            profiles(full_name, email),
            departments(name)
          `
        ),
        getAllGeneratedDocuments()
      ]);

      if (generatedRows.error) {
        throw generatedRows.error;
      }

      const mappedTemplates = (templateRows || []).map((template) => ({
        ...template,
        variables: template.required_fields || []
      }));

      const mappedStudents = (studentRows || []).map((student) => ({
        id: student.id,
        profile_id: student.profile_id,
        full_name: student.profiles?.full_name || 'Étudiant inconnu',
        email: student.profiles?.email || '',
        student_number: student.student_number || '-',
        level: student.level || '-',
        department_id: student.department_id || null,
        department_name: student.departments?.name || 'Département inconnu',
        status: student.status || 'active'
      }));

      const mappedGeneratedDocuments = (generatedRows.documents || []).slice(0, 12).map((document) => {
        const studentRelation = getRelation(document.students);
        const profileRelation = getRelation(studentRelation?.profiles);
        const templateRelation = getRelation(document.document_templates);

        return {
          ...document,
          student_name: profileRelation?.full_name || 'Étudiant inconnu',
          template_name: templateRelation?.name || document.deposit_note || 'Document officiel',
          template_type: templateRelation?.type || 'other'
        };
      });

      setTemplates(mappedTemplates);
      setStudents(mappedStudents);
      setGeneratedDocuments(mappedGeneratedDocuments);
    } catch (fetchError) {
      console.error('Erreur lors du chargement du générateur de documents:', fetchError);
      setError('Impossible de charger les données du générateur de documents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!selectedTemplate) {
      setFormValues({});
      setDepositNote('');
      return;
    }

    const initialValues = {};
    (selectedTemplate.variables || []).forEach((variable) => {
      initialValues[variable] = '';
    });

    setFormValues(initialValues);
    setDepositNote(defaultDepositNote(selectedTemplate));
  }, [selectedTemplate]);

  const setPreviewDocument = ({ pdfBytes, fileName }) => {
    setDocumentData(pdfBytes);
    setPreviewFileName(fileName);
    setPreviewOpen(true);
  };

  const generateDocument = async () => {
    if (!selectedTemplate || !selectedStudent) {
      setError('Veuillez sélectionner un modèle et un étudiant.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { PDFDocument, StandardFonts, rgb } = await loadPdfLib();
      const pdfDoc = await PDFDocument.create();
      let page = pdfDoc.addPage([595.28, 841.89]);
      const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const margin = 50;
      const titleFontSize = 16;
      const contentFontSize = 12;
      const lineHeight = 20;
      let yPosition = page.getHeight() - margin;

      page.drawText('ESGIS', {
        x: margin,
        y: yPosition,
        size: 18,
        font: boldFont,
        color: rgb(0, 0.2, 0.45)
      });

      yPosition -= 24;

      page.drawText(depositNote || selectedTemplate.name, {
        x: margin,
        y: yPosition,
        size: titleFontSize,
        font: boldFont,
        color: rgb(0, 0, 0)
      });

      yPosition -= 36;

      [
        `Étudiant : ${selectedStudent.full_name}`,
        `Numéro étudiant : ${selectedStudent.student_number}`,
        `Niveau : ${selectedStudent.level}`,
        `Département : ${selectedStudent.department_name}`,
        `Date d'édition : ${format(new Date(), 'dd MMMM yyyy', { locale: fr })}`
      ].forEach((line) => {
        page.drawText(line, {
          x: margin,
          y: yPosition,
          size: contentFontSize,
          font: regularFont,
          color: rgb(0, 0, 0)
        });
        yPosition -= lineHeight;
      });

      yPosition -= lineHeight;

      let content = selectedTemplate.content
        || selectedTemplate.description
        || buildFallbackContent({
          template: selectedTemplate,
          student: selectedStudent,
          depositNote
        });

      content = content.replace(/\{NOM_ETUDIANT\}/g, selectedStudent.full_name);
      content = content.replace(/\{NUMERO_ETUDIANT\}/g, selectedStudent.student_number);
      content = content.replace(/\{NIVEAU\}/g, selectedStudent.level);
      content = content.replace(/\{DEPARTEMENT\}/g, selectedStudent.department_name);
      content = content.replace(/\{DATE\}/g, format(new Date(), 'dd MMMM yyyy', { locale: fr }));

      Object.keys(formValues).forEach((key) => {
        content = content.replace(new RegExp(`\\{${key}\\}`, 'g'), formValues[key] || '');
      });

      const words = content.split(/\s+/);
      const maxWidth = page.getWidth() - margin * 2;
      let line = '';

      for (const word of words) {
        const nextLine = line ? `${line} ${word}` : word;
        const lineWidth = regularFont.widthOfTextAtSize(nextLine, contentFontSize);

        if (lineWidth <= maxWidth) {
          line = nextLine;
          continue;
        }

        page.drawText(line, {
          x: margin,
          y: yPosition,
          size: contentFontSize,
          font: regularFont,
          color: rgb(0, 0, 0)
        });

        yPosition -= lineHeight;
        line = word;

        if (yPosition < margin + lineHeight) {
          page = pdfDoc.addPage([595.28, 841.89]);
          yPosition = page.getHeight() - margin;
        }
      }

      if (line) {
        page.drawText(line, {
          x: margin,
          y: yPosition,
          size: contentFontSize,
          font: regularFont,
          color: rgb(0, 0, 0)
        });
      }

      page.drawText(`Document généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm')}`, {
        x: margin,
        y: margin,
        size: 9,
        font: regularFont,
        color: rgb(0.45, 0.45, 0.45)
      });

      const pdfBytes = await pdfDoc.save();
      setPreviewDocument({
        pdfBytes,
        fileName: `${slugify(depositNote || selectedTemplate.name)}_${slugify(selectedStudent.student_number)}.pdf`
      });
    } catch (generationError) {
      console.error('Erreur lors de la génération du document:', generationError);
      setError(`Une erreur est survenue lors de la génération du document: ${generationError.message}`);
    } finally {
      setLoading(false);
    }
  };

  const saveGeneratedDocument = async () => {
    if (!documentData || !selectedTemplate || !selectedStudent) {
      setError('Impossible de sauvegarder le document.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const now = new Date();
      const timestamp = format(now, 'yyyyMMdd_HHmmss');
      const actorId = authState.profile?.id || authState.user?.id || null;
      const storagePath = `official/admin_deposits/${selectedStudent.profile_id || selectedStudent.id}/${slugify(depositNote || selectedTemplate.name)}_${timestamp}.pdf`;

      const { error: storageError } = await uploadFile('documents', storagePath, documentData, {
        contentType: 'application/pdf',
        cacheControl: '3600'
      });

      if (storageError) {
        throw storageError;
      }

      const shouldApprove = publicationStatus === 'approved';

      const { error: insertError } = await insertGeneratedDocument({
        template_id: selectedTemplate.id,
        student_id: selectedStudent.id,
        file_path: `documents/${storagePath}`,
        status: publicationStatus,
        generated_by: actorId,
        approved_by: shouldApprove ? actorId : null,
        approval_date: shouldApprove ? now.toISOString() : null,
        manual_deposit: true,
        deposit_note: depositNote.trim() || defaultDepositNote(selectedTemplate)
      });

      if (insertError) {
        throw insertError;
      }

      if (sendEmailChecked) {
        console.log('Envoi d’email à implémenter pour', selectedStudent.email);
      }

      setPreviewOpen(false);
      setSuccess(shouldApprove
        ? 'Document généré et rendu disponible dans le dossier officiel de l’étudiant.'
        : 'Document généré et enregistré pour validation.');
      await fetchData();
    } catch (saveError) {
      console.error('Erreur lors de la sauvegarde du document:', saveError);
      setError(`Une erreur est survenue lors de la sauvegarde du document: ${saveError.message}`);
    } finally {
      setLoading(false);
    }
  };

  const downloadPreviewDocument = () => {
    if (!documentData) {
      return;
    }

    const blob = documentData instanceof Blob ? documentData : new Blob([documentData], { type: 'application/pdf' });
    const objectUrl = URL.createObjectURL(blob);

    triggerDownload({
      url: objectUrl,
      filename: previewFileName
    });

    setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
  };

  const openStoredDocumentPreview = async (document) => {
    try {
      setLoading(true);
      const { url, error: signedUrlError } = await createDocumentDownloadUrl(document.file_path, 60);

      if (signedUrlError) {
        throw signedUrlError;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Impossible de récupérer le document stocké');
      }

      const arrayBuffer = await response.arrayBuffer();
      setPreviewDocument({
        pdfBytes: new Uint8Array(arrayBuffer),
        fileName: `${slugify(document.deposit_note || document.template_name || 'document_officiel')}.pdf`
      });
    } catch (previewError) {
      console.error('Erreur lors de l’aperçu du document existant:', previewError);
      setError(previewError.message || 'Impossible de prévisualiser ce document.');
    } finally {
      setLoading(false);
    }
  };

  const downloadStoredDocument = async (document) => {
    try {
      const { url, error: downloadError } = await createDocumentDownloadUrl(document.file_path, 60);

      if (downloadError) {
        throw downloadError;
      }

      triggerDownload({
        url,
        filename: `${slugify(document.deposit_note || document.template_name || 'document_officiel')}.pdf`
      });
    } catch (downloadError) {
      console.error('Erreur lors du téléchargement du document stocké:', downloadError);
      setError(downloadError.message || 'Impossible de télécharger ce document.');
    }
  };

  const updateStoredDocumentStatus = async (documentId, nextStatus) => {
    if (!authState.isAdmin) {
      setError('Vous n’avez pas les droits pour modifier le statut d’un document.');
      return;
    }

    try {
      setLoading(true);
      const { error: updateError } = await updateGeneratedDocumentStatus(
        documentId,
        nextStatus,
        authState.profile?.id || authState.user?.id || null
      );

      if (updateError) {
        throw updateError;
      }

      setSuccess(nextStatus === 'approved' ? 'Document approuvé.' : 'Document rejeté.');
      await fetchData();
    } catch (updateError) {
      console.error('Erreur de mise à jour du statut du document:', updateError);
      setError(updateError.message || 'Impossible de mettre à jour ce document.');
    } finally {
      setLoading(false);
    }
  };

  const renderStatus = (status) => {
    switch (status) {
      case 'draft':
        return <Chip label="Brouillon" color="default" size="small" />;
      case 'pending':
        return <Chip label="En attente" color="warning" size="small" />;
      case 'approved':
        return <Chip label="Disponible" color="success" size="small" />;
      case 'rejected':
        return <Chip label="Rejeté" color="error" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={1} sx={{ mb: 3 }}>
        <Typography variant="h4">
          Générateur de documents administratifs
        </Typography>
        <Typography variant="body2" color="text.secondary">
          La scolarité peut générer un PDF, lui donner un libellé métier clair et le verser directement dans le dossier officiel de l’étudiant.
        </Typography>
      </Stack>

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
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Typography variant="h6">
                Générer un nouveau document
              </Typography>

              <Alert severity="info">
                Utilisez ce module pour déposer une attestation d’inscription, une attestation de réussite ou un relevé certifié dans le dossier officiel de l’étudiant.
              </Alert>

              <FormControl fullWidth>
                <InputLabel id="template-select-label">Modèle de document</InputLabel>
                <Select
                  labelId="template-select-label"
                  value={selectedTemplateId}
                  label="Modèle de document"
                  onChange={(event) => setSelectedTemplateId(event.target.value)}
                >
                  <MenuItem value="" disabled>Sélectionner un modèle</MenuItem>
                  {templates.map((template) => (
                    <MenuItem key={template.id} value={template.id}>
                      {template.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel id="student-select-label">Étudiant</InputLabel>
                <Select
                  labelId="student-select-label"
                  value={selectedStudentId}
                  label="Étudiant"
                  onChange={(event) => setSelectedStudentId(event.target.value)}
                >
                  {students.map((student) => (
                    <MenuItem key={student.id} value={student.id}>
                      {`${student.full_name} (${student.student_number})`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {selectedTemplate && (
                <>
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    <Chip size="small" label={`Type: ${selectedTemplate.type || 'other'}`} variant="outlined" />
                    {selectedStudent && (
                      <Chip size="small" label={selectedStudent.department_name} variant="outlined" />
                    )}
                  </Stack>

                  <TextField
                    fullWidth
                    label="Libellé visible par l’étudiant"
                    value={depositNote}
                    onChange={(event) => setDepositNote(event.target.value)}
                    helperText="Exemples: Attestation d'inscription, Attestation de réussite, Relevé de notes certifié."
                  />

                  <FormControl fullWidth>
                    <InputLabel id="publication-status-label">Disponibilité</InputLabel>
                    <Select
                      labelId="publication-status-label"
                      value={publicationStatus}
                      label="Disponibilité"
                      onChange={(event) => setPublicationStatus(event.target.value)}
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {(selectedTemplate.variables || []).length > 0 && (
                    <>
                      <Typography variant="subtitle2">
                        Variables du modèle
                      </Typography>
                      <Divider />
                      {(selectedTemplate.variables || []).map((variable) => (
                        <TextField
                          key={variable}
                          fullWidth
                          label={variable.replace(/_/g, ' ')}
                          name={variable}
                          value={formValues[variable] || ''}
                          onChange={(event) => setFormValues((prev) => ({
                            ...prev,
                            [variable]: event.target.value
                          }))}
                        />
                      ))}
                    </>
                  )}

                  <FormControlLabel
                    control={(
                      <Checkbox
                        checked={sendEmailChecked}
                        onChange={(event) => setSendEmailChecked(event.target.checked)}
                      />
                    )}
                    label="Préparer un envoi par email ensuite"
                  />

                  <Button
                    variant="contained"
                    startIcon={<DescriptionIcon />}
                    onClick={generateDocument}
                    disabled={loading || !selectedStudent}
                    fullWidth
                  >
                    {loading ? <CircularProgress size={20} color="inherit" /> : 'Générer le document'}
                  </Button>
                </>
              )}
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Stack spacing={2}>
              <Typography variant="h6">
                Dépôts récents
              </Typography>

              {generatedDocuments.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Aucun document généré pour le moment.
                </Typography>
              ) : (
                generatedDocuments.map((document) => (
                  <Card key={document.id} variant="outlined">
                    <CardContent>
                      <Stack spacing={1}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                          <Box>
                            <Typography variant="subtitle1">
                              {document.deposit_note || document.template_name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {document.student_name}
                            </Typography>
                          </Box>
                          {renderStatus(document.status)}
                        </Stack>

                        <Typography variant="caption" color="text.secondary">
                          {document.template_name} • créé le {format(new Date(document.created_at), 'dd/MM/yyyy à HH:mm')}
                        </Typography>
                      </Stack>
                    </CardContent>
                    <Divider />
                    <CardActions>
                      <Button size="small" startIcon={<PreviewIcon />} onClick={() => openStoredDocumentPreview(document)}>
                        Aperçu
                      </Button>
                      <Button size="small" startIcon={<DownloadIcon />} onClick={() => downloadStoredDocument(document)}>
                        Télécharger
                      </Button>
                      {authState.isAdmin && document.status === 'pending' && (
                        <>
                          <Button size="small" color="success" onClick={() => updateStoredDocumentStatus(document.id, 'approved')}>
                            Approuver
                          </Button>
                          <Button size="small" color="error" onClick={() => updateStoredDocumentStatus(document.id, 'rejected')}>
                            Rejeter
                          </Button>
                        </>
                      )}
                    </CardActions>
                  </Card>
                ))
              )}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Aperçu du document</DialogTitle>
        <DialogContent>
          {previewUrl ? (
            <Box sx={{ width: '100%', height: '500px', overflow: 'hidden' }}>
              <iframe
                src={previewUrl}
                width="100%"
                height="100%"
                title="Aperçu du document"
              />
            </Box>
          ) : (
            <Typography>Impossible de charger l’aperçu.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>
            Fermer
          </Button>
          <Button onClick={downloadPreviewDocument} startIcon={<DownloadIcon />}>
            Télécharger
          </Button>
          <Button
            onClick={saveGeneratedDocument}
            startIcon={<SaveIcon />}
            variant="contained"
          >
            Déposer dans le dossier étudiant
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentGeneratorPage;
