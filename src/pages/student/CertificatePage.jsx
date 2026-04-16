/**
 * Page de génération des documents d'inscription pour les étudiants
 * @module pages/student/CertificatePage
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  generateCertificate,
  generateEnrollmentAttestation,
  getStudentData
} from '../../utils/certificateUtils';
import { getAssetPath } from '../../utils/assetUtils';
import { uploadFile, createSignedUrl, removeFiles } from '@/api/storage';
import {
  getDocumentTemplateByType,
  getStudentGeneratedDocuments,
  insertGeneratedDocument
} from '@/api/documents';
import { triggerDownload } from '@/utils/DownloadLinkUtil';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Tab,
  Tabs,
  Typography
} from '@mui/material';
import { styled } from '@mui/material/styles';
import DownloadIcon from '@mui/icons-material/Download';
import SchoolIcon from '@mui/icons-material/School';
import ArticleIcon from '@mui/icons-material/Article';
import DescriptionIcon from '@mui/icons-material/Description';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const DOCUMENT_TYPES = {
  certificate: {
    tabLabel: 'Certificat',
    title: 'Certificat de scolarité',
    templateType: 'certificate',
    previewTitle: 'CERTIFICAT DE SCOLARITÉ',
    buttonLabel: 'Générer mon certificat',
    historyLabel: 'Historique des certificats',
    storagePrefix: 'certificat_scolarite',
    successMessage: 'Votre certificat a été généré, archivé et téléchargé.',
    description: 'Le certificat est généré au format PDF, archivé dans votre dossier officiel et immédiatement téléchargeable.',
    legalNote: 'Chaque génération crée une nouvelle archive officielle associée à votre profil étudiant.'
  },
  attestation: {
    tabLabel: 'Attestation',
    title: "Attestation d'inscription",
    templateType: 'attestation',
    previewTitle: "ATTESTATION D'INSCRIPTION",
    buttonLabel: "Générer mon attestation",
    historyLabel: "Historique des attestations",
    storagePrefix: 'attestation_inscription',
    successMessage: "Votre attestation d'inscription a été générée, archivée et téléchargée.",
    description: "L'attestation d'inscription est datée, signée numériquement via le circuit officiel et reste disponible dans votre historique.",
    legalNote: 'Ce document est pensé pour être disponible à tout moment sans devoir repasser par une demande manuelle.'
  }
};

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  marginBottom: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
}));

const DocumentPreview = styled(Box)(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(3),
  backgroundColor: '#f9f9f9',
  minHeight: '400px',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    inset: 0,
    backgroundImage: `url(${getAssetPath('images/logo-esgis-brand.png')})`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    backgroundSize: '50%',
    opacity: 0.05,
    pointerEvents: 'none'
  }
}));

const DocumentTitle = styled(Typography)(({ theme }) => ({
  textAlign: 'center',
  fontWeight: 'bold',
  marginBottom: theme.spacing(3),
  color: theme.palette.primary.main
}));

const DocumentContent = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2)
}));

const DocumentFooter = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(4),
  textAlign: 'right',
  paddingTop: theme.spacing(2),
  borderTop: `1px dashed ${theme.palette.divider}`
}));

const ActionButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
  padding: theme.spacing(1, 3)
}));

const CertificatePage = () => {
  const { authState, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [generatingType, setGeneratingType] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [officialDocuments, setOfficialDocuments] = useState([]);
  const [activeDocumentType, setActiveDocumentType] = useState(
    searchParams.get('doc') === 'attestation' ? 'attestation' : 'certificate'
  );

  const currentDate = format(new Date(), 'dd MMMM yyyy', { locale: fr });
  const activeDocument = DOCUMENT_TYPES[activeDocumentType];

  const previewIdentity = useMemo(() => {
    const fullName = authState.profile?.full_name || user?.user_metadata?.fullName || 'Étudiant ESGIS';
    const parts = fullName.split(' ').filter(Boolean);
    return {
      firstName: parts.slice(0, -1).join(' ') || parts[0] || 'Étudiant',
      lastName: parts.length > 1 ? parts[parts.length - 1].toUpperCase() : 'ESGIS'
    };
  }, [authState.profile?.full_name, user?.user_metadata?.fullName]);

  const filteredDocuments = useMemo(() => (
    officialDocuments.filter((document) => document.template_type === activeDocumentType)
  ), [activeDocumentType, officialDocuments]);

  useEffect(() => {
    const requestedDocument = searchParams.get('doc');

    if (requestedDocument === 'certificate' || requestedDocument === 'attestation') {
      setActiveDocumentType(requestedDocument);
    }
  }, [searchParams]);

  const resolveStoragePath = (filePath) => {
    if (!filePath) {
      return null;
    }

    return filePath.replace(/^documents\//, '');
  };

  const fetchOfficialDocuments = async () => {
    if (!authState.student?.id) {
      setHistoryLoading(false);
      return;
    }

    setHistoryLoading(true);

    try {
      const { documents, error: fetchError } = await getStudentGeneratedDocuments(authState.student.id, {
        templateTypes: ['certificate', 'attestation']
      });

      if (fetchError) {
        throw fetchError;
      }

      setOfficialDocuments(documents);
    } catch (documentsError) {
      console.error('Erreur lors du chargement de l’historique des documents d’inscription:', documentsError);
      setOfficialDocuments([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchOfficialDocuments();
  }, [authState.student?.id]);

  const handleDownloadStoredDocument = async (document) => {
    try {
      const storagePath = resolveStoragePath(document.file_path);

      if (!storagePath) {
        throw new Error('Chemin du document introuvable');
      }

      const { signedUrl, error: signedUrlError } = await createSignedUrl('documents', storagePath, 60);

      if (signedUrlError) {
        throw signedUrlError;
      }

      triggerDownload({
        url: signedUrl,
        filename: `${activeDocument.storagePrefix}_${format(new Date(document.created_at), 'yyyy-MM-dd')}.pdf`
      });
    } catch (downloadError) {
      console.error('Erreur lors du téléchargement du document archivé:', downloadError);
      setError(downloadError.message || 'Impossible de télécharger le document archivé.');
    }
  };

  const archiveGeneratedDocument = async ({ pdfBytes, templateType, storagePrefix }) => {
    const { template, error: templateError } = await getDocumentTemplateByType(templateType);

    if (templateError) {
      throw templateError;
    }

    const dateSlug = format(new Date(), 'yyyy-MM-dd_HH-mm');
    const safeLastName = (previewIdentity.lastName || 'etudiant').toLowerCase().replace(/\s+/g, '_');
    const storagePath = `official/${authState.profile.id}/${storagePrefix}_${safeLastName}_${dateSlug}.pdf`;

    const { error: uploadError } = await uploadFile('documents', storagePath, pdfBytes, {
      contentType: 'application/pdf',
      cacheControl: '3600',
      upsert: false
    });

    if (uploadError) {
      throw uploadError;
    }

    const { error: insertError } = await insertGeneratedDocument({
      template_id: template.id,
      student_id: authState.student.id,
      file_path: `documents/${storagePath}`,
      status: 'approved',
      generated_by: authState.profile.id,
      approved_by: authState.profile.id,
      approval_date: new Date().toISOString(),
      deposit_note: activeDocument.title
    });

    if (insertError) {
      await removeFiles('documents', [storagePath]);
      throw insertError;
    }

    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    triggerDownload({
      url,
      filename: `${storagePrefix}_${format(new Date(), 'yyyy-MM-dd')}.pdf`
    });

    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const handleGenerateDocument = async () => {
    setGeneratingType(activeDocumentType);
    setError(null);
    setSuccessMessage(null);

    try {
      if (!authState.student?.id || !authState.profile?.id) {
        throw new Error('Profil étudiant incomplet');
      }

      const studentData = await getStudentData(authState.profile.id);
      const pdfBytes = activeDocumentType === 'attestation'
        ? await generateEnrollmentAttestation(studentData)
        : await generateCertificate(studentData);

      await archiveGeneratedDocument({
        pdfBytes,
        templateType: activeDocument.templateType,
        storagePrefix: activeDocument.storagePrefix
      });

      setSuccessMessage(activeDocument.successMessage);
      fetchOfficialDocuments();
    } catch (generationError) {
      console.error('Erreur lors de la génération du document:', generationError);
      setError(generationError.message || 'Impossible de générer le document. Veuillez réessayer plus tard.');
    } finally {
      setGeneratingType(null);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
        <SchoolIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Documents d&apos;inscription
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      <Grid container spacing={4}>
        <Grid item xs={12} md={5}>
          <StyledPaper>
            <Tabs
              value={activeDocumentType}
              onChange={(_event, value) => {
                setActiveDocumentType(value);
                setSearchParams(value === 'attestation' ? { doc: 'attestation' } : {});
              }}
              sx={{ mb: 2 }}
            >
              <Tab value="certificate" label={DOCUMENT_TYPES.certificate.tabLabel} />
              <Tab value="attestation" label={DOCUMENT_TYPES.attestation.tabLabel} />
            </Tabs>

            <Typography variant="h6" gutterBottom>
              <ArticleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              {activeDocument.title}
            </Typography>
            <Typography variant="body2" paragraph>
              {activeDocument.description}
            </Typography>
            <Typography variant="body2" paragraph>
              Ce flux alimente l&apos;historique administratif de vos documents au lieu d&apos;une simple génération locale non tracée.
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" paragraph>
              <strong>Note :</strong> {activeDocument.legalNote}
            </Typography>
            <ActionButton
              variant="contained"
              color="primary"
              startIcon={generatingType === activeDocumentType ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
              onClick={handleGenerateDocument}
              disabled={!!generatingType}
              fullWidth
            >
              {generatingType === activeDocumentType ? 'Génération en cours...' : activeDocument.buttonLabel}
            </ActionButton>
          </StyledPaper>

          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                {activeDocument.historyLabel}
              </Typography>
              {historyLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : filteredDocuments.length === 0 ? (
                <Typography variant="body2">
                  Aucun document archivé pour le moment.
                </Typography>
              ) : (
                <List dense>
                  {filteredDocuments.map((document) => (
                    <ListItem
                      key={document.id}
                      secondaryAction={
                        <IconButton edge="end" onClick={() => handleDownloadStoredDocument(document)}>
                          <DownloadIcon />
                        </IconButton>
                      }
                    >
                      <ListItemText
                        primary={(
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <DescriptionIcon fontSize="small" />
                            <Typography variant="body2">
                              {activeDocument.title} du {format(new Date(document.created_at), 'dd/MM/yyyy')}
                            </Typography>
                            <Chip
                              size="small"
                              color={document.status === 'approved' ? 'success' : 'default'}
                              label={document.status}
                            />
                          </Box>
                        )}
                        secondary={document.approval_date ? `Archivé le ${format(new Date(document.approval_date), 'dd/MM/yyyy HH:mm')}` : 'En attente'}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
            <CardActions>
              <Button size="small" href="/student/requests">
                Voir mes documents officiels
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <StyledPaper>
            <Typography variant="h6" gutterBottom>
              Aperçu du document
            </Typography>
            <DocumentPreview>
              <DocumentTitle variant="h5">
                {activeDocument.previewTitle}
              </DocumentTitle>
              <DocumentContent>
                <Typography variant="body1" paragraph>
                  Je soussigné(e), Directeur de l&apos;École Supérieure de Gestion et d&apos;Informatique Systèmes,
                </Typography>
                <Typography variant="body1" paragraph>
                  certifie que :
                </Typography>
                <Typography variant="body1" paragraph sx={{ fontWeight: 'bold', ml: 4 }}>
                  {previewIdentity.firstName} {previewIdentity.lastName}
                </Typography>
                <Typography variant="body1" paragraph sx={{ ml: 4 }}>
                  Numéro d&apos;étudiant : {authState.student?.student_number || user?.id?.substring(0, 8).toUpperCase() || ''}
                </Typography>
                <Typography variant="body1" paragraph sx={{ ml: 4 }}>
                  est régulièrement inscrit(e) en {authState.student?.level || 'Licence'} {user?.user_metadata?.program || 'Informatique'}
                </Typography>
                <Typography variant="body1" paragraph sx={{ ml: 4 }}>
                  {activeDocumentType === 'attestation'
                    ? "pour l'année académique en cours au sein de notre établissement."
                    : "pour l'année académique en cours."}
                </Typography>
                <Typography variant="body1" paragraph>
                  {activeDocumentType === 'attestation'
                    ? "La présente attestation est délivrée à l'intéressé(e) pour servir et valoir ce que de droit."
                    : 'Ce certificat est délivré pour servir et valoir ce que de droit.'}
                </Typography>
              </DocumentContent>
              <DocumentFooter>
                <Typography variant="body2">
                  Fait à Lomé, le {currentDate}
                </Typography>
                <Typography variant="body2" sx={{ mt: 2, fontWeight: 'bold' }}>
                  Le Directeur
                </Typography>
                <Box sx={{ height: 40 }} />
              </DocumentFooter>
            </DocumentPreview>
          </StyledPaper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default CertificatePage;
