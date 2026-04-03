/**
 * Page de génération de certificats de scolarité pour les étudiants
 * @module pages/student/CertificatePage
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { generateCertificate, getStudentData } from '../../utils/certificateUtils';
import { getAssetPath } from '../../utils/assetUtils';
import { uploadFile, createSignedUrl, removeFiles } from '@/api/storage';
import { insertGeneratedDocument, getDocumentTemplateByType, getStudentGeneratedCertificates } from '@/api/documents';
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
  Typography
} from '@mui/material';
import { styled } from '@mui/material/styles';
import DownloadIcon from '@mui/icons-material/Download';
import SchoolIcon from '@mui/icons-material/School';
import ArticleIcon from '@mui/icons-material/Article';
import DescriptionIcon from '@mui/icons-material/Description';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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
    backgroundImage: `url(${getAssetPath('images/logo-esgis-white.svg')})`,
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
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [certificates, setCertificates] = useState([]);

  const currentDate = format(new Date(), 'dd MMMM yyyy', { locale: fr });

  const previewIdentity = useMemo(() => {
    const fullName = authState.profile?.full_name || user?.user_metadata?.fullName || 'Étudiant ESGIS';
    const parts = fullName.split(' ').filter(Boolean);
    return {
      firstName: parts.slice(0, -1).join(' ') || parts[0] || 'Étudiant',
      lastName: parts.length > 1 ? parts[parts.length - 1].toUpperCase() : 'ESGIS'
    };
  }, [authState.profile?.full_name, user?.user_metadata?.fullName]);

  const resolveStoragePath = (filePath) => {
    if (!filePath) {
      return null;
    }
    return filePath.replace(/^documents\//, '');
  };

  const fetchCertificates = async () => {
    if (!authState.student?.id) {
      setHistoryLoading(false);
      return;
    }

    setHistoryLoading(true);

    try {
      const { certificates: fetched, error: certificatesError } = await getStudentGeneratedCertificates(authState.student.id);

      if (certificatesError) {
        throw certificatesError;
      }

      setCertificates(fetched);
    } catch (certificatesError) {
      console.error('Erreur lors du chargement de l\'historique des certificats:', certificatesError);
      setCertificates([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, [authState.student?.id]);

  const handleDownloadStoredCertificate = async (certificate) => {
    try {
      const storagePath = resolveStoragePath(certificate.file_path);

      if (!storagePath) {
        throw new Error('Chemin du certificat introuvable');
      }

      const { signedUrl, error: signedUrlError } = await createSignedUrl('documents', storagePath, 60);

      if (signedUrlError) {
        throw signedUrlError;
      }

      triggerDownload({
        url: signedUrl,
        filename: `certificat_scolarite_${format(new Date(certificate.created_at), 'yyyy-MM-dd')}.pdf`
      });
    } catch (downloadError) {
      console.error('Erreur lors du téléchargement du certificat archivé:', downloadError);
      setError(downloadError.message || 'Impossible de télécharger le certificat archivé.');
    }
  };

  const handleGenerateCertificate = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (!authState.student?.id || !authState.profile?.id) {
        throw new Error('Profil étudiant incomplet');
      }

      const studentData = await getStudentData(authState.profile.id);
      const pdfBytes = await generateCertificate(studentData);

      const { template, error: templateError } = await getDocumentTemplateByType('certificate');

      if (templateError) {
        throw templateError;
      }

      const dateSlug = format(new Date(), 'yyyy-MM-dd_HH-mm');
      const safeLastName = (studentData.lastName || 'etudiant').toLowerCase().replace(/\s+/g, '_');
      const storagePath = `official/${authState.profile.id}/certificat_scolarite_${safeLastName}_${dateSlug}.pdf`;

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
        generated_by: authState.profile.id
      });

      if (insertError) {
        await removeFiles('documents', [storagePath]);
        throw insertError;
      }

      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      triggerDownload({
        url,
        filename: `certificat_scolarite_${safeLastName}_${format(new Date(), 'yyyy-MM-dd')}.pdf`
      });
      setTimeout(() => URL.revokeObjectURL(url), 2000);

      setSuccess(true);
      fetchCertificates();
    } catch (generationError) {
      console.error('Erreur lors de la génération du certificat:', generationError);
      setError(generationError.message || 'Impossible de générer le certificat. Veuillez réessayer plus tard.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
        <SchoolIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Certificat de Scolarité
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Votre certificat a été généré, archivé et téléchargé.
        </Alert>
      )}

      <Grid container spacing={4}>
        <Grid item xs={12} md={5}>
          <StyledPaper>
            <Typography variant="h6" gutterBottom>
              <ArticleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Générer votre certificat
            </Typography>
            <Typography variant="body2" paragraph>
              Le certificat est généré au format PDF, archivé dans votre dossier officiel et immédiatement téléchargeable.
            </Typography>
            <Typography variant="body2" paragraph>
              Ce flux alimente l’historique administratif de vos documents au lieu d’une simple génération locale non tracée.
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" paragraph>
              <strong>Note:</strong> chaque génération crée une nouvelle archive officielle associée à votre profil étudiant.
            </Typography>
            <ActionButton
              variant="contained"
              color="primary"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
              onClick={handleGenerateCertificate}
              disabled={loading}
              fullWidth
            >
              {loading ? 'Génération en cours...' : 'Générer mon certificat'}
            </ActionButton>
          </StyledPaper>

          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Historique de mes certificats
              </Typography>
              {historyLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : certificates.length === 0 ? (
                <Typography variant="body2">
                  Aucun certificat archivé pour le moment.
                </Typography>
              ) : (
                <List dense>
                  {certificates.map((certificate) => (
                    <ListItem
                      key={certificate.id}
                      secondaryAction={
                        <IconButton edge="end" onClick={() => handleDownloadStoredCertificate(certificate)}>
                          <DownloadIcon />
                        </IconButton>
                      }
                    >
                      <ListItemText
                        primary={(
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <DescriptionIcon fontSize="small" />
                            <Typography variant="body2">
                              Certificat du {format(new Date(certificate.created_at), 'dd/MM/yyyy')}
                            </Typography>
                            <Chip
                              size="small"
                              color={certificate.status === 'approved' ? 'success' : 'default'}
                              label={certificate.status}
                            />
                          </Box>
                        )}
                        secondary={certificate.approval_date ? `Archivé le ${format(new Date(certificate.approval_date), 'dd/MM/yyyy HH:mm')}` : 'En attente'}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
            <CardActions>
              <Button size="small" href="/student/documents">
                Voir tous mes documents
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <StyledPaper>
            <Typography variant="h6" gutterBottom>
              Aperçu du certificat
            </Typography>
            <DocumentPreview>
              <DocumentTitle variant="h5">
                CERTIFICAT DE SCOLARITÉ
              </DocumentTitle>
              <DocumentContent>
                <Typography variant="body1" paragraph>
                  Je soussigné(e), Directeur de l'École Supérieure de Gestion et d'Informatique Systèmes,
                </Typography>
                <Typography variant="body1" paragraph>
                  certifie que :
                </Typography>
                <Typography variant="body1" paragraph sx={{ fontWeight: 'bold', ml: 4 }}>
                  {previewIdentity.firstName} {previewIdentity.lastName}
                </Typography>
                <Typography variant="body1" paragraph sx={{ ml: 4 }}>
                  Numéro d'étudiant : {authState.student?.student_number || user?.id?.substring(0, 8).toUpperCase() || ''}
                </Typography>
                <Typography variant="body1" paragraph sx={{ ml: 4 }}>
                  est régulièrement inscrit(e) en {authState.student?.level || 'Licence'} {user?.user_metadata?.program || 'Informatique'}
                </Typography>
                <Typography variant="body1" paragraph sx={{ ml: 4 }}>
                  pour l'année académique en cours.
                </Typography>
                <Typography variant="body1" paragraph>
                  Ce certificat est délivré pour servir et valoir ce que de droit.
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
