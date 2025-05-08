/**
 * Page de génération de certificats de scolarité pour les étudiants
 * @module pages/student/CertificatePage
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { generateCertificate, getStudentData } from '../../utils/certificateUtils';
import { getAssetPath } from '../../utils/assetUtils';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Container, 
  Grid, 
  CircularProgress, 
  Card, 
  CardContent, 
  CardActions,
  Divider,
  Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import DownloadIcon from '@mui/icons-material/Download';
import SchoolIcon from '@mui/icons-material/School';
import ArticleIcon from '@mui/icons-material/Article';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Styles personnalisés
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
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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

/**
 * Composant de la page de certificats de scolarité
 * @returns {JSX.Element} Composant CertificatePage
 */
const CertificatePage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Date du jour formatée en français
  const currentDate = format(new Date(), "dd MMMM yyyy", { locale: fr });
  
  /**
   * Génère et télécharge le certificat de scolarité
   */
  const handleGenerateCertificate = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Récupération des données de l'étudiant
      const studentData = await getStudentData(user.id);
      
      // Génération du certificat
      const pdfBytes = await generateCertificate(studentData);
      
      // Création d'un blob pour le téléchargement
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      // Création d'un lien de téléchargement
      const link = document.createElement('a');
      link.href = url;
      link.download = `certificat_scolarite_${studentData.lastName.toLowerCase()}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setSuccess(true);
    } catch (err) {
      console.error("Erreur lors de la génération du certificat:", err);
      setError("Impossible de générer le certificat. Veuillez réessayer plus tard.");
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
          Votre certificat a été généré avec succès et le téléchargement a démarré.
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
              Ce certificat atteste que vous êtes régulièrement inscrit(e) à l'ESGIS pour l'année académique en cours.
            </Typography>
            <Typography variant="body2" paragraph>
              Le document généré est un fichier PDF officiel que vous pouvez télécharger, imprimer et présenter comme justificatif de scolarité.
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" paragraph>
              <strong>Note:</strong> Le certificat est automatiquement daté du jour de sa génération et comporte une signature numérique officielle.
            </Typography>
            <ActionButton
              variant="contained"
              color="primary"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
              onClick={handleGenerateCertificate}
              disabled={loading}
              fullWidth
            >
              {loading ? "Génération en cours..." : "Générer mon certificat"}
            </ActionButton>
          </StyledPaper>
          
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Besoin d'autres documents ?
              </Typography>
              <Typography variant="body2">
                D'autres documents administratifs sont disponibles dans la section "Documents" de votre espace étudiant.
              </Typography>
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
                  {user?.user_metadata?.firstName || user?.firstName || ''} {(user?.user_metadata?.lastName || user?.lastName || '').toUpperCase()}
                </Typography>
                <Typography variant="body1" paragraph sx={{ ml: 4 }}>
                  Numéro d'étudiant : {user?.user_metadata?.studentId || user?.id?.substring(0, 8).toUpperCase() || ''}
                </Typography>
                <Typography variant="body1" paragraph sx={{ ml: 4 }}>
                  est régulièrement inscrit(e) en {user?.user_metadata?.level || 'Licence'} {user?.user_metadata?.program || 'Informatique'}
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
                <Box sx={{ height: 40 }} /> {/* Espace pour la signature */}
              </DocumentFooter>
            </DocumentPreview>
          </StyledPaper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default CertificatePage;
