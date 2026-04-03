import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box, Typography, Paper, CircularProgress, Alert, Card, CardContent,
  Divider, Chip, Grid, Button
} from '@mui/material';
import {
  Verified as VerifiedIcon,
  Error as ErrorIcon,
  QrCode2 as QrCodeIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  CalendarMonth as CalendarIcon,
  Description as DocIcon
} from '@mui/icons-material';
import { verifyDocument } from '@/services/DocumentQRService';

/**
 * Page publique de vérification de document — ESGIS Campus §3.6
 * Accessible sans authentification via QR code
 * Route: /verify/:reference
 */
const VerifyDocumentPage = () => {
  const { reference } = useParams();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const verify = async () => {
      if (!reference) {
        setResult({ verified: false, message: 'Aucune référence fournie.' });
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await verifyDocument(decodeURIComponent(reference));
        setResult(res);
      } catch {
        setResult({ verified: false, message: 'Erreur lors de la vérification.' });
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [reference]);

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch { return dateStr || '-'; }
  };

  const getDocTypeLabel = (type) => {
    const labels = {
      CERT: 'Certificat de scolarité',
      ATT: "Attestation d'inscription",
      REL: 'Relevé de notes officiel',
      BULL: 'Bulletin semestriel',
      DIPL: 'Attestation de réussite / Diplôme',
    };
    return labels[type] || type || 'Document officiel';
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      bgcolor: '#f5f5f5',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      pt: 6, px: 2
    }}>
      {/* En-tête ESGIS */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ color: '#003366' }}>
          ESGIS
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Vérification de document officiel
        </Typography>
      </Box>

      <Paper elevation={4} sx={{ maxWidth: 550, width: '100%', borderRadius: 3, overflow: 'hidden' }}>
        {/* Bandeau supérieur */}
        <Box sx={{
          bgcolor: loading ? 'grey.400' : result?.verified ? '#003366' : '#CC0000',
          p: 2, textAlign: 'center', color: 'white'
        }}>
          {loading ? (
            <CircularProgress size={28} sx={{ color: 'white' }} />
          ) : result?.verified ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <VerifiedIcon sx={{ fontSize: 32 }} />
              <Typography variant="h6" fontWeight="bold">Document Authentique</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <ErrorIcon sx={{ fontSize: 32 }} />
              <Typography variant="h6" fontWeight="bold">Document Non Vérifié</Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ p: 3 }}>
          {loading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Vérification en cours...
              </Typography>
            </Box>
          ) : result?.verified ? (
            <>
              <Alert severity="success" sx={{ mb: 3 }}>
                {result.message}
              </Alert>

              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                Référence : <strong>{reference}</strong>
              </Typography>

              <Divider sx={{ mb: 2 }} />

              {result.document && (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <DocIcon color="primary" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">Type de document</Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {getDocTypeLabel(result.document.type)}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <PersonIcon color="primary" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">Titulaire</Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {result.document.studentName}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SchoolIcon color="primary" fontSize="small" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">Filière</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {result.document.filiere}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Niveau</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {result.document.niveau}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarIcon color="primary" fontSize="small" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">Année académique</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {result.document.anneeAcademique}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Date de délivrance</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {formatDate(result.document.dateGeneration)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              )}
            </>
          ) : (
            <>
              <Alert severity="error" sx={{ mb: 2 }}>
                {result?.message || 'Ce document ne peut pas être vérifié.'}
              </Alert>
              <Typography variant="body2" color="text.secondary">
                Si vous pensez qu'il s'agit d'une erreur, contactez la scolarité de l'ESGIS.
              </Typography>
            </>
          )}
        </Box>

        {/* Pied de page */}
        <Divider />
        <Box sx={{ p: 2, bgcolor: 'grey.50', textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            ESGIS — École Supérieure de Gestion d'Informatique et des Sciences
          </Typography>
          <br />
          <Typography variant="caption" color="text.secondary">
            Cette page permet de vérifier l'authenticité des documents officiels délivrés par l'établissement.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default VerifyDocumentPage;
